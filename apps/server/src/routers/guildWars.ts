// Guild wars router — Phase 3.
//
// Endpointy:
// - declare      (officer+) — wypowiada wojnę, cooldown 1/dzień, matchmaking band ±10 avg lvl
// - commit       (any)      — dołącza do side gracz'a; snapshot fighter z guild buffs
// - cancelCommit (self)     — przed scheduledAt może wycofać commit
// - reorder      (officer+) — ustala orderIndex dla committed participants
// - browse       (any)      — lista gildii-targetów (declare modal)
// - list         (any)      — aktywna wojna + ostatnie 5 mojej gildii
// - get          (any)      — pełne szczegóły (participants + log jeśli resolved)
// - history      (any)      — paginacja zakończonych

import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, inArray, isNull, ne, or, sql } from 'drizzle-orm';
import type {
  AchievementUnlockPayload,
  CharacterClass,
  CharacterStats,
  GuildEmblemKind,
  GuildWarDetails,
  GuildWarParticipant,
  GuildWarRound,
  GuildWarSide,
  GuildWarStatus,
  GuildWarSummary,
  GuildWarsBrowseResponse,
  GuildWarsListResponse,
} from '@grodno/shared';
import {
  guildWarsDeclareInputSchema,
  guildWarsIdInputSchema,
  guildWarsReorderInputSchema,
} from '@grodno/shared';
import {
  characters,
  guildMembers,
  guildWarParticipants,
  guildWars,
  guilds,
} from '../db/schema.js';
import { collectBump } from '../game/achievements.js';
import { loadEquipBonuses, type CombatFighter } from '../game/arena.js';
import { invalidateTopWarCache } from './town.js';
import { isoDateUTC } from '../game/daily.js';
import {
  WAR_COMMIT_WINDOW_MS,
  WAR_MATCHMAKING_LVL_BAND,
  WAR_MAX_PARTICIPANTS_PER_SIDE,
} from '../game/guild-wars.js';
import { applyGuildWarBuffs, loadGuildWarBuffs } from '../game/guilds.js';
import { assertCan, getMembershipOrNull } from '../game/guild-permissions.js';
import { isWorking, WORKING_BLOCKS_COMBAT_MESSAGE } from '../game/work.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

async function requireChar(
  db: import('../db/client.js').Db,
  userId: string,
): Promise<typeof characters.$inferSelect> {
  const [char] = await db.select().from(characters).where(eq(characters.userId, userId)).limit(1);
  if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });
  return char;
}

async function computeMyAvgLvl(
  db: import('../db/client.js').Db,
  guildId: string,
): Promise<number> {
  const [row] = await db
    .select({ avg: sql<number>`avg(${characters.lvl})::float` })
    .from(guildMembers)
    .innerJoin(characters, eq(characters.id, guildMembers.characterId))
    .where(eq(guildMembers.guildId, guildId));
  return row?.avg ?? 1;
}

async function activeWarForGuild(
  db: import('../db/client.js').Db,
  guildId: string,
): Promise<typeof guildWars.$inferSelect | null> {
  const [row] = await db
    .select()
    .from(guildWars)
    .where(
      and(
        or(
          eq(guildWars.attackerGuildId, guildId),
          eq(guildWars.defenderGuildId, guildId),
        ),
        or(eq(guildWars.status, 'scheduled'), eq(guildWars.status, 'resolving')),
      ),
    )
    .limit(1);
  return row ?? null;
}

async function buildSnapshotFighter(
  db: import('../db/client.js').Db,
  char: typeof characters.$inferSelect,
): Promise<CombatFighter> {
  const equip = await loadEquipBonuses(db, char.id);
  const stats = char.stats as CharacterStats;
  const base: CombatFighter = {
    atk: stats.atk + equip.atk,
    def: stats.def + equip.def,
    mag: stats.mag + equip.mag,
    spd: stats.spd,
    hpMax: char.hpMax,
    cls: char.cls as CharacterClass,
    name: char.name,
    lvl: char.lvl,
  };
  const buffs = await loadGuildWarBuffs(db, char.id);
  return applyGuildWarBuffs(base, buffs);
}

function warToSummary(
  w: typeof guildWars.$inferSelect,
  attackerG: Pick<typeof guilds.$inferSelect, 'name' | 'tag'>,
  defenderG: Pick<typeof guilds.$inferSelect, 'name' | 'tag'>,
): GuildWarSummary {
  return {
    id: w.id,
    attackerGuildId: w.attackerGuildId,
    attackerGuildName: attackerG.name,
    attackerGuildTag: attackerG.tag,
    defenderGuildId: w.defenderGuildId,
    defenderGuildName: defenderG.name,
    defenderGuildTag: defenderG.tag,
    status: w.status as GuildWarStatus,
    scheduledAt: w.scheduledAt.getTime(),
    resolvedAt: w.resolvedAt ? w.resolvedAt.getTime() : null,
    winnerGuildId: w.winnerGuildId,
    attackerScore: w.attackerScore,
    defenderScore: w.defenderScore,
    goldPrize: w.goldPrize,
    gloryDelta: w.gloryDelta,
    createdAt: w.createdAt.getTime(),
  };
}

export const guildWarsRouter = router({
  declare: protectedProcedure
    .input(guildWarsDeclareInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      const { guildId: myGuildId } = await assertCan(ctx.db, char.id, 'declareWar');

      if (input.defenderGuildId === myGuildId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Sam ze sobą nie walczysz.' });
      }

      // Cooldown — 1 declare/dzień dla mojej gildii.
      const [myGuild] = await ctx.db.select().from(guilds).where(eq(guilds.id, myGuildId)).limit(1);
      if (!myGuild) throw new TRPCError({ code: 'NOT_FOUND', message: 'Gildia zniknęła.' });
      const today = isoDateUTC();
      if (myGuild.lastWarDeclaredDate === today) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Dzisiaj już wypowiedziałeś wojnę. Jutro.',
        });
      }

      // Brak aktywnej wojny po obu stronach.
      const myActive = await activeWarForGuild(ctx.db, myGuildId);
      if (myActive) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Masz już aktywną wojnę.' });
      }
      const theirActive = await activeWarForGuild(ctx.db, input.defenderGuildId);
      if (theirActive) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Oni już walczą z kimś innym.',
        });
      }

      const [defender] = await ctx.db
        .select()
        .from(guilds)
        .where(and(eq(guilds.id, input.defenderGuildId), isNull(guilds.disbandedAt)))
        .limit(1);
      if (!defender) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Gildia docelowa nie istnieje.' });
      }

      // Matchmaking band — ±WAR_MATCHMAKING_LVL_BAND avg lvl.
      const myAvg = await computeMyAvgLvl(ctx.db, myGuildId);
      const theirAvg = await computeMyAvgLvl(ctx.db, input.defenderGuildId);
      if (Math.abs(myAvg - theirAvg) > WAR_MATCHMAKING_LVL_BAND) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Różnica poziomów za duża. Znajdź coś bliżej swojej ligi.',
        });
      }

      const scheduledAt = new Date(Date.now() + WAR_COMMIT_WINDOW_MS);

      const unlocks: AchievementUnlockPayload[] = [];
      const [created] = await ctx.db
        .insert(guildWars)
        .values({
          attackerGuildId: myGuildId,
          defenderGuildId: input.defenderGuildId,
          status: 'scheduled',
          scheduledAt,
        })
        .returning({ id: guildWars.id });

      await ctx.db
        .update(guilds)
        .set({ lastWarDeclaredDate: today, updatedAt: new Date() })
        .where(eq(guilds.id, myGuildId));

      // System msg w chat'ach obu gildii.
      const { guildChatMessages } = await import('../db/schema.js');
      const msgBody = `Wojna: „${myGuild.name}" vs „${defender.name}". Start za 24h.`;
      await ctx.db.insert(guildChatMessages).values([
        {
          guildId: myGuildId,
          authorCharId: char.id,
          authorName: char.name,
          authorCls: char.cls,
          body: msgBody,
          kind: 'system',
        },
        {
          guildId: input.defenderGuildId,
          authorCharId: char.id,
          authorName: char.name,
          authorCls: char.cls,
          body: msgBody,
          kind: 'system',
        },
      ]);

      await collectBump(unlocks, ctx.db, char.id, 'guild_war_declared');
      invalidateTopWarCache();

      return { ok: true, warId: created!.id, unlockedAchievements: unlocks };
    }),

  commit: protectedProcedure
    .input(guildWarsIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      if (isWorking(char)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: WORKING_BLOCKS_COMBAT_MESSAGE });
      }
      const membership = await getMembershipOrNull(ctx.db, char.id);
      if (!membership) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Nie jesteś w gildii.' });
      }

      const [war] = await ctx.db
        .select()
        .from(guildWars)
        .where(eq(guildWars.id, input.warId))
        .limit(1);
      if (!war) throw new TRPCError({ code: 'NOT_FOUND', message: 'Wojna nie istnieje.' });
      if (war.status !== 'scheduled') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Wojna już rozstrzygnięta lub w trakcie.',
        });
      }
      if (war.scheduledAt.getTime() <= Date.now()) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Za późno — wojna się właśnie rozpoczyna.',
        });
      }

      let side: GuildWarSide;
      if (membership.guildId === war.attackerGuildId) side = 'attacker';
      else if (membership.guildId === war.defenderGuildId) side = 'defender';
      else
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Ta wojna nie dotyczy twojej gildii.',
        });

      // Cap 15/side
      const countRows = await ctx.db
        .select({ n: sql<number>`count(*)::int` })
        .from(guildWarParticipants)
        .where(
          and(
            eq(guildWarParticipants.warId, input.warId),
            eq(guildWarParticipants.side, side),
          ),
        );
      const current = countRows[0]?.n ?? 0;
      if (current >= WAR_MAX_PARTICIPANTS_PER_SIDE) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Drużyna pełna (${WAR_MAX_PARTICIPANTS_PER_SIDE}).`,
        });
      }

      const fighter = await buildSnapshotFighter(ctx.db, char);
      const orderIndex = current; // append — lider potem zreorderuje

      await ctx.db
        .insert(guildWarParticipants)
        .values({
          warId: input.warId,
          characterId: char.id,
          side,
          orderIndex,
          snapshot: fighter,
        })
        .onConflictDoNothing();

      return { ok: true };
    }),

  cancelCommit: protectedProcedure
    .input(guildWarsIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      const [war] = await ctx.db
        .select()
        .from(guildWars)
        .where(eq(guildWars.id, input.warId))
        .limit(1);
      if (!war) throw new TRPCError({ code: 'NOT_FOUND', message: 'Wojna nie istnieje.' });
      if (war.status !== 'scheduled') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Za późno — wojna się zaczęła.',
        });
      }
      await ctx.db
        .delete(guildWarParticipants)
        .where(
          and(
            eq(guildWarParticipants.warId, input.warId),
            eq(guildWarParticipants.characterId, char.id),
          ),
        );
      return { ok: true };
    }),

  reorder: protectedProcedure
    .input(guildWarsReorderInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      const membership = await getMembershipOrNull(ctx.db, char.id);
      if (!membership) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Nie jesteś w gildii.' });
      }
      if (membership.rank !== 'leader' && membership.rank !== 'officer') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Tylko lider/oficer ustala szyk.',
        });
      }

      const [war] = await ctx.db
        .select()
        .from(guildWars)
        .where(eq(guildWars.id, input.warId))
        .limit(1);
      if (!war) throw new TRPCError({ code: 'NOT_FOUND', message: 'Wojna nie istnieje.' });
      if (war.status !== 'scheduled') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Za późno na ustawianie szyku.',
        });
      }

      // Upewnij się że ustawiamy tylko swoją stronę.
      let mySide: GuildWarSide;
      if (membership.guildId === war.attackerGuildId) mySide = 'attacker';
      else if (membership.guildId === war.defenderGuildId) mySide = 'defender';
      else
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Ta wojna nie dotyczy twojej gildii.',
        });

      for (const { characterId, orderIndex } of input.orders) {
        await ctx.db
          .update(guildWarParticipants)
          .set({ orderIndex })
          .where(
            and(
              eq(guildWarParticipants.warId, input.warId),
              eq(guildWarParticipants.characterId, characterId),
              eq(guildWarParticipants.side, mySide),
            ),
          );
      }

      return { ok: true };
    }),

  browse: protectedProcedure.query(async ({ ctx }): Promise<GuildWarsBrowseResponse> => {
    const char = await requireChar(ctx.db, ctx.userId);
    const membership = await getMembershipOrNull(ctx.db, char.id);
    if (!membership) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Nie jesteś w gildii.' });
    }

    const myAvg = await computeMyAvgLvl(ctx.db, membership.guildId);
    const minAvg = myAvg - WAR_MATCHMAKING_LVL_BAND;
    const maxAvg = myAvg + WAR_MATCHMAKING_LVL_BAND;

    // Lista wszystkich gildii + avg lvl, filtrowanie ±band + active-war check.
    const rows = await ctx.db
      .select({
        id: guilds.id,
        name: guilds.name,
        tag: guilds.tag,
        emblemKind: guilds.emblemKind,
        emblemColor: guilds.emblemColor,
        glory: guilds.glory,
        avgLvl: sql<number>`coalesce((select avg(c.lvl)::float from guild_members gm join characters c on c.id = gm.character_id where gm.guild_id = ${guilds.id}), 1)`,
        memberCount: sql<number>`(select count(*)::int from guild_members where guild_id = ${guilds.id})`,
      })
      .from(guilds)
      .where(and(isNull(guilds.disbandedAt), ne(guilds.id, membership.guildId)))
      .limit(100);

    const targets = rows
      .filter((r) => r.avgLvl >= minAvg && r.avgLvl <= maxAvg)
      .sort((a, b) => Math.abs(a.avgLvl - myAvg) - Math.abs(b.avgLvl - myAvg))
      .slice(0, 20)
      .map((r) => ({
        id: r.id,
        name: r.name,
        tag: r.tag,
        emblemKind: r.emblemKind as GuildEmblemKind,
        emblemColor: r.emblemColor,
        memberCount: r.memberCount,
        avgLvl: r.avgLvl,
        glory: r.glory,
      }));

    return { myAvgLvl: myAvg, targets };
  }),

  list: protectedProcedure.query(async ({ ctx }): Promise<GuildWarsListResponse> => {
    const char = await requireChar(ctx.db, ctx.userId);
    const membership = await getMembershipOrNull(ctx.db, char.id);
    if (!membership) return { active: null, recent: [] };

    // Load all wars tied to my guild, then split.
    const rows = await ctx.db
      .select()
      .from(guildWars)
      .where(
        or(
          eq(guildWars.attackerGuildId, membership.guildId),
          eq(guildWars.defenderGuildId, membership.guildId),
        ),
      )
      .orderBy(desc(guildWars.createdAt))
      .limit(10);

    // Hydrate guild names.
    const guildIds = Array.from(new Set(rows.flatMap((r) => [r.attackerGuildId, r.defenderGuildId])));
    const guildRows = guildIds.length
      ? await ctx.db
          .select({ id: guilds.id, name: guilds.name, tag: guilds.tag })
          .from(guilds)
          .where(inArray(guilds.id, guildIds))
      : [];
    const guildById = new Map(guildRows.map((g) => [g.id, { name: g.name, tag: g.tag }]));
    const fallback = { name: '???', tag: '???' };

    const summaries = rows.map((w) =>
      warToSummary(
        w,
        guildById.get(w.attackerGuildId) ?? fallback,
        guildById.get(w.defenderGuildId) ?? fallback,
      ),
    );
    const active = summaries.find((s) => s.status === 'scheduled' || s.status === 'resolving') ?? null;
    const recent = summaries.filter((s) => s.status === 'resolved' || s.status === 'cancelled');

    return { active, recent };
  }),

  get: protectedProcedure
    .input(guildWarsIdInputSchema)
    .query(async ({ ctx, input }): Promise<GuildWarDetails> => {
      const char = await requireChar(ctx.db, ctx.userId);
      const [war] = await ctx.db
        .select()
        .from(guildWars)
        .where(eq(guildWars.id, input.warId))
        .limit(1);
      if (!war) throw new TRPCError({ code: 'NOT_FOUND', message: 'Wojna nie istnieje.' });

      const [attackerG] = await ctx.db
        .select({ name: guilds.name, tag: guilds.tag })
        .from(guilds)
        .where(eq(guilds.id, war.attackerGuildId))
        .limit(1);
      const [defenderG] = await ctx.db
        .select({ name: guilds.name, tag: guilds.tag })
        .from(guilds)
        .where(eq(guilds.id, war.defenderGuildId))
        .limit(1);

      const partRows = await ctx.db
        .select({
          characterId: guildWarParticipants.characterId,
          side: guildWarParticipants.side,
          orderIndex: guildWarParticipants.orderIndex,
          wonDuel: guildWarParticipants.wonDuel,
          name: characters.name,
          cls: characters.cls,
          lvl: characters.lvl,
        })
        .from(guildWarParticipants)
        .innerJoin(characters, eq(characters.id, guildWarParticipants.characterId))
        .where(eq(guildWarParticipants.warId, input.warId))
        .orderBy(asc(guildWarParticipants.side), asc(guildWarParticipants.orderIndex));

      const participants: GuildWarParticipant[] = partRows.map((p) => ({
        characterId: p.characterId,
        name: p.name,
        cls: p.cls as CharacterClass,
        lvl: p.lvl,
        side: p.side as GuildWarSide,
        orderIndex: p.orderIndex,
        wonDuel: p.wonDuel,
      }));

      const membership = await getMembershipOrNull(ctx.db, char.id);
      let mySide: GuildWarSide | null = null;
      if (membership) {
        if (membership.guildId === war.attackerGuildId) mySide = 'attacker';
        else if (membership.guildId === war.defenderGuildId) mySide = 'defender';
      }
      const mine = participants.find((p) => p.characterId === char.id);
      const myOrderIndex = mine ? mine.orderIndex : null;

      const summary = warToSummary(
        war,
        attackerG ?? { name: '???', tag: '???' },
        defenderG ?? { name: '???', tag: '???' },
      );

      // Patchuj round'om imiona z `participants` (join z characters @ read-time).
      // Legacy snapshoty z guildWarParticipants.snapshot — committed zanim
      // CombatFighter miał `name` field — mają `attackerName: null` w log
      // jsonb po resolve. Charactery wciąż żyją i znamy ich imiona przez
      // characterId, więc patch overwrite'uje legacy null'e bez szkody dla
      // nowych wpisów (te już mają poprawne name).
      const rawRounds = (war.log as GuildWarRound[] | null) ?? null;
      const nameById = new Map(participants.map((p) => [p.characterId, p.name]));
      const rounds = rawRounds
        ? rawRounds.map((r) => ({
            ...r,
            attackerName: nameById.get(r.attackerCharId) ?? r.attackerName ?? '?',
            defenderName: nameById.get(r.defenderCharId) ?? r.defenderName ?? '?',
          }))
        : null;

      return {
        ...summary,
        participants,
        rounds,
        mySide,
        myOrderIndex,
      };
    }),
});
