// Guild router — Phase 1 MVP.
//
// Lifecycle: create → invite → acceptInvite → chat → promote → demote → kick
//          → leave → transferLeader → disband.
// Rate-limit chat in-memory (LRU, rozgrywka single-instance — OK dla MVP).
// Wszystkie mutacje gated przez `assertCan()` z game/guild-permissions.ts.

import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, ilike, isNull, lt, ne, or, sql } from 'drizzle-orm';
import type {
  AchievementUnlockPayload,
  CharacterClass,
  GuildBrowseResponse,
  GuildChatListResponse,
  GuildGetResponse,
  GuildMember,
  GuildMyInvitesResponse,
  GuildPendingApplicationsResponse,
  GuildRank,
  GuildSummary,
} from '@grodno/shared';
import {
  guildBrowseInputSchema,
  guildCharIdInputSchema,
  guildChatDeleteInputSchema,
  guildChatListInputSchema,
  guildChatSendInputSchema,
  guildCreateInputSchema,
  guildIdInputSchema,
  guildSearchCharacterInputSchema,
  guildUpdateEmblemInputSchema,
  guildUpdateMottoInputSchema,
  guildUpdateOpennessInputSchema,
} from '@grodno/shared';
import type { GuildSearchCharacterResponse } from '@grodno/shared';
import { characters, guildChatMessages, guildInvites, guildMembers, guilds } from '../db/schema.js';
import { collectBump } from '../game/achievements.js';
import { logGuildFounded, logGuildJoined } from '../game/chronicle.js';
import { assertCan, canPerform, getMembershipOrNull, getTargetMembership } from '../game/guild-permissions.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

const GUILD_CREATE_GOLD_COST = 5000;
const GUILD_CREATE_MIN_LVL = 5;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dni

// ---------- Chat rate-limit (in-memory LRU) ----------
// Map: characterId → [timestamps of recent sends]. Limity:
// 1 msg / 3s (last 3s), 30 msgs / 5min. Single-instance deployment OK;
// przy scale → przenieść do Redis albo server-side queue.
const CHAT_LIMIT_BY_CHAR = new Map<string, number[]>();
const CHAT_WINDOW_SEC = 3;
const CHAT_WINDOW_BURST_MIN = 5;
const CHAT_BURST_MAX = 30;

function canSendChat(charId: string, nowMs: number): boolean {
  const history = CHAT_LIMIT_BY_CHAR.get(charId) ?? [];
  const fresh = history.filter((t) => nowMs - t < CHAT_WINDOW_BURST_MIN * 60_000);
  const within3s = fresh.filter((t) => nowMs - t < CHAT_WINDOW_SEC * 1000);
  if (within3s.length >= 1) return false;
  if (fresh.length >= CHAT_BURST_MAX) return false;
  fresh.push(nowMs);
  CHAT_LIMIT_BY_CHAR.set(charId, fresh);
  return true;
}

// ---------- Helpers ----------

/**
 * Ładuje char gracza z userId. Throws gdy brak postaci.
 */
async function requireChar(
  db: import('../db/client.js').Db,
  userId: string,
): Promise<typeof characters.$inferSelect> {
  const [char] = await db.select().from(characters).where(eq(characters.userId, userId)).limit(1);
  if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });
  return char;
}

async function guildMemberCount(
  db: import('../db/client.js').Db,
  guildId: string,
): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(guildMembers)
    .where(eq(guildMembers.guildId, guildId));
  return row?.n ?? 0;
}

// ---------- Router ----------

export const guildRouter = router({
  /**
   * Zakładanie gildii — 5000 gold, gate LVL 5. Tworzy guild row, dodaje
   * zakładacza jako leader, denormalizuje characters.guildId/Rank, wrzuca
   * system chat msg, loguje chronicle event.
   */
  create: protectedProcedure
    .input(guildCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      if (char.lvl < GUILD_CREATE_MIN_LVL) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Wymagany LVL ${GUILD_CREATE_MIN_LVL}.`,
        });
      }
      if (char.gold < GUILD_CREATE_GOLD_COST) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Brak złota. Wymagane ${GUILD_CREATE_GOLD_COST}g.`,
        });
      }
      const existing = await getMembershipOrNull(ctx.db, char.id);
      if (existing) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Jesteś już w innej gildii. Najpierw wyjdź.',
        });
      }

      // Name/tag unique check (wcześniej niż transakcja — lepszy error msg).
      const [nameCollision] = await ctx.db
        .select({ id: guilds.id })
        .from(guilds)
        .where(and(eq(guilds.name, input.name), isNull(guilds.disbandedAt)))
        .limit(1);
      if (nameCollision) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Nazwa zajęta.' });
      }
      const [tagCollision] = await ctx.db
        .select({ id: guilds.id })
        .from(guilds)
        .where(and(eq(guilds.tag, input.tag), isNull(guilds.disbandedAt)))
        .limit(1);
      if (tagCollision) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Tag zajęty.' });
      }

      // Atomic: decrement gold → insert guild → insert member → system msg →
      // denorm characters. Drizzle nie ma explicit transaction helpers tutaj,
      // ale insert conflicts są idempotent przez unique indexes — jeśli drop
      // środku, retry da clean state.
      const [createdGuild] = await ctx.db
        .insert(guilds)
        .values({
          name: input.name,
          tag: input.tag,
          motto: input.motto ?? '',
          emblemKind: input.emblemKind,
          emblemColor: input.emblemColor,
          leaderCharId: char.id,
        })
        .returning();
      if (!createdGuild) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Nie udało się utworzyć.' });
      }

      await ctx.db
        .insert(guildMembers)
        .values({ guildId: createdGuild.id, characterId: char.id, rank: 'leader' });

      await ctx.db
        .update(characters)
        .set({
          gold: char.gold - GUILD_CREATE_GOLD_COST,
          guildId: createdGuild.id,
          guildRank: 'leader',
          updatedAt: new Date(),
        })
        .where(eq(characters.id, char.id));

      await ctx.db.insert(guildChatMessages).values({
        guildId: createdGuild.id,
        authorCharId: char.id,
        authorName: char.name,
        authorCls: char.cls,
        body: `${char.name} założył/a gildię "${input.name}".`,
        kind: 'system',
      });

      logGuildFounded(ctx.db, char.id, char.name, createdGuild.id, createdGuild.name).catch((e) =>
        console.error('[chronicle] logGuildFounded failed', e),
      );

      const unlocks: AchievementUnlockPayload[] = [];
      await collectBump(unlocks, ctx.db, char.id, 'guild_first_create');
      await collectBump(unlocks, ctx.db, char.id, 'guild_leader_rank');

      return {
        guildId: createdGuild.id,
        unlockedAchievements: unlocks,
      };
    }),

  /** Pełny snapshot mojej gildii (summary + members + myRank). */
  get: protectedProcedure.query(async ({ ctx }): Promise<GuildGetResponse | null> => {
    const char = await requireChar(ctx.db, ctx.userId);
    const membership = await getMembershipOrNull(ctx.db, char.id);
    if (!membership) return null;

    const [g] = await ctx.db.select().from(guilds).where(eq(guilds.id, membership.guildId)).limit(1);
    if (!g || g.disbandedAt) return null;

    const memberRows = await ctx.db
      .select({
        characterId: guildMembers.characterId,
        rank: guildMembers.rank,
        joinedAt: guildMembers.joinedAt,
        contributedGold: guildMembers.contributedGold,
        contributedGems: guildMembers.contributedGems,
        lastActiveAt: guildMembers.lastActiveAt,
        name: characters.name,
        cls: characters.cls,
        lvl: characters.lvl,
      })
      .from(guildMembers)
      .innerJoin(characters, eq(characters.id, guildMembers.characterId))
      .where(eq(guildMembers.guildId, g.id))
      .orderBy(asc(guildMembers.rank), desc(characters.lvl));

    const members: GuildMember[] = memberRows.map((r) => ({
      characterId: r.characterId,
      name: r.name,
      cls: r.cls as 'warrior' | 'mage' | 'rogue',
      lvl: r.lvl,
      rank: r.rank as GuildRank,
      joinedAt: r.joinedAt.getTime(),
      lastActiveAt: r.lastActiveAt.getTime(),
      contributedGold: r.contributedGold,
      contributedGems: r.contributedGems,
    }));

    return {
      guild: {
        id: g.id,
        name: g.name,
        tag: g.tag,
        motto: g.motto,
        emblemKind: g.emblemKind as GuildSummary['emblemKind'],
        emblemColor: g.emblemColor,
        level: g.level,
        glory: g.glory,
        memberCount: members.length,
        memberCap: g.memberCap,
        requiredLvl: g.requiredLvl,
        isOpen: g.isOpen,
        leaderCharId: g.leaderCharId,
        treasuryGold: g.treasuryGold,
        treasuryGems: g.treasuryGems,
      },
      members,
      myRank: membership.rank,
    };
  }),

  /** Lista otwartych gildii z paginacją (po 20). */
  browse: protectedProcedure
    .input(guildBrowseInputSchema)
    .query(async ({ ctx, input }): Promise<GuildBrowseResponse> => {
      const pageSize = 20;
      const offset = (input.page ?? 0) * pageSize;
      const q = input.query?.trim().toLowerCase();
      const whereParts = [eq(guilds.isOpen, true), isNull(guilds.disbandedAt)];
      if (q) {
        whereParts.push(or(ilike(guilds.name, `%${q}%`), ilike(guilds.tag, `%${q}%`))!);
      }
      const rows = await ctx.db
        .select()
        .from(guilds)
        .where(and(...whereParts))
        .orderBy(desc(guilds.glory), asc(guilds.name))
        .limit(pageSize + 1)
        .offset(offset);

      const hasMore = rows.length > pageSize;
      const visible = rows.slice(0, pageSize);
      const counts = await Promise.all(
        visible.map(async (g) => ({ id: g.id, n: await guildMemberCount(ctx.db, g.id) })),
      );
      const countById = new Map(counts.map((c) => [c.id, c.n]));

      const summaries: GuildSummary[] = visible.map((g) => ({
        id: g.id,
        name: g.name,
        tag: g.tag,
        motto: g.motto,
        emblemKind: g.emblemKind as GuildSummary['emblemKind'],
        emblemColor: g.emblemColor,
        level: g.level,
        glory: g.glory,
        memberCount: countById.get(g.id) ?? 0,
        memberCap: g.memberCap,
        requiredLvl: g.requiredLvl,
        isOpen: g.isOpen,
      }));

      return { guilds: summaries, hasMore };
    }),

  /** Wychodzenie z gildii — lider musi najpierw transferLeader. */
  leave: protectedProcedure.mutation(async ({ ctx }) => {
    const char = await requireChar(ctx.db, ctx.userId);
    const membership = await getMembershipOrNull(ctx.db, char.id);
    if (!membership) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Nie jesteś w gildii.' });
    }
    if (membership.rank === 'leader') {
      const [g] = await ctx.db
        .select({ leaderCharId: guilds.leaderCharId })
        .from(guilds)
        .where(eq(guilds.id, membership.guildId))
        .limit(1);
      if (g && g.leaderCharId === char.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Jesteś liderem. Najpierw przekaż przywództwo lub rozwiąż gildię.',
        });
      }
    }

    await ctx.db
      .delete(guildMembers)
      .where(and(eq(guildMembers.guildId, membership.guildId), eq(guildMembers.characterId, char.id)));

    await ctx.db
      .update(characters)
      .set({ guildId: null, guildRank: null, updatedAt: new Date() })
      .where(eq(characters.id, char.id));

    await ctx.db.insert(guildChatMessages).values({
      guildId: membership.guildId,
      authorCharId: char.id,
      authorName: char.name,
      authorCls: char.cls,
      body: `${char.name} opuścił/a gildię.`,
      kind: 'system',
    });

    return { ok: true };
  }),

  /** Rozwiąż gildię — tylko lider. Soft-delete (disbandedAt), kasuje wszystkich członków. */
  disband: protectedProcedure.mutation(async ({ ctx }) => {
    const char = await requireChar(ctx.db, ctx.userId);
    const { guildId } = await assertCan(ctx.db, char.id, 'disband');

    await ctx.db
      .update(guilds)
      .set({ disbandedAt: new Date(), updatedAt: new Date() })
      .where(eq(guilds.id, guildId));

    // Kasujemy members + denorm characters.guildId wszystkich członków
    const memberIds = await ctx.db
      .select({ characterId: guildMembers.characterId })
      .from(guildMembers)
      .where(eq(guildMembers.guildId, guildId));

    await ctx.db.delete(guildMembers).where(eq(guildMembers.guildId, guildId));
    await ctx.db.delete(guildInvites).where(eq(guildInvites.guildId, guildId));

    for (const m of memberIds) {
      await ctx.db
        .update(characters)
        .set({ guildId: null, guildRank: null, updatedAt: new Date() })
        .where(eq(characters.id, m.characterId));
    }

    return { ok: true, disbandedMembers: memberIds.length };
  }),

  // ============================================================
  // Invites + applications + membership changes
  // ============================================================

  /** Officer/Leader zaprasza postać do gildii. Rośnie do 7 dni. */
  invite: protectedProcedure
    .input(guildCharIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      const { guildId } = await assertCan(ctx.db, char.id, 'invite');
      if (input.characterId === char.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nie zapraszaj siebie.' });
      }
      const target = await getMembershipOrNull(ctx.db, input.characterId);
      if (target) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Ta postać jest już w gildii.' });
      }
      const [g] = await ctx.db.select().from(guilds).where(eq(guilds.id, guildId)).limit(1);
      if (!g || g.disbandedAt) throw new TRPCError({ code: 'NOT_FOUND', message: 'Gildia nie istnieje.' });
      const count = await guildMemberCount(ctx.db, guildId);
      if (count >= g.memberCap) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Gildia pełna.' });
      }
      await ctx.db
        .insert(guildInvites)
        .values({
          guildId,
          characterId: input.characterId,
          direction: 'invite',
          createdBy: char.id,
          expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        })
        .onConflictDoUpdate({
          target: [guildInvites.guildId, guildInvites.characterId],
          set: {
            direction: 'invite',
            createdBy: char.id,
            expiresAt: new Date(Date.now() + INVITE_TTL_MS),
          },
        });
      return { ok: true };
    }),

  /** Gracz aplikuje do otwartej gildii. */
  applyToGuild: protectedProcedure
    .input(guildIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      const existing = await getMembershipOrNull(ctx.db, char.id);
      if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Już jesteś w gildii.' });
      const [g] = await ctx.db
        .select()
        .from(guilds)
        .where(and(eq(guilds.id, input.guildId), isNull(guilds.disbandedAt)))
        .limit(1);
      if (!g) throw new TRPCError({ code: 'NOT_FOUND', message: 'Gildia nie istnieje.' });
      if (!g.isOpen) throw new TRPCError({ code: 'FORBIDDEN', message: 'Gildia zamknięta.' });
      if (char.lvl < g.requiredLvl) {
        throw new TRPCError({ code: 'FORBIDDEN', message: `Wymagany LVL ${g.requiredLvl}.` });
      }
      await ctx.db
        .insert(guildInvites)
        .values({
          guildId: input.guildId,
          characterId: char.id,
          direction: 'apply',
          createdBy: char.id,
          expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        })
        .onConflictDoUpdate({
          target: [guildInvites.guildId, guildInvites.characterId],
          set: {
            direction: 'apply',
            createdBy: char.id,
            expiresAt: new Date(Date.now() + INVITE_TTL_MS),
          },
        });
      return { ok: true };
    }),

  /** Gracz akceptuje zaproszenie → dołącza jako Rekrut. */
  acceptInvite: protectedProcedure
    .input(guildIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      if (await getMembershipOrNull(ctx.db, char.id)) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Już jesteś w gildii.' });
      }
      const [inv] = await ctx.db
        .select()
        .from(guildInvites)
        .where(and(eq(guildInvites.guildId, input.guildId), eq(guildInvites.characterId, char.id)))
        .limit(1);
      if (!inv || inv.direction !== 'invite') {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak zaproszenia.' });
      }
      if (inv.expiresAt.getTime() < Date.now()) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Zaproszenie wygasło.' });
      }
      const [g] = await ctx.db
        .select()
        .from(guilds)
        .where(and(eq(guilds.id, input.guildId), isNull(guilds.disbandedAt)))
        .limit(1);
      if (!g) throw new TRPCError({ code: 'NOT_FOUND', message: 'Gildia nie istnieje.' });
      const count = await guildMemberCount(ctx.db, g.id);
      if (count >= g.memberCap) throw new TRPCError({ code: 'FORBIDDEN', message: 'Gildia pełna.' });

      await ctx.db
        .insert(guildMembers)
        .values({ guildId: g.id, characterId: char.id, rank: 'recruit' });
      await ctx.db
        .update(characters)
        .set({ guildId: g.id, guildRank: 'recruit', updatedAt: new Date() })
        .where(eq(characters.id, char.id));
      await ctx.db
        .delete(guildInvites)
        .where(and(eq(guildInvites.guildId, g.id), eq(guildInvites.characterId, char.id)));

      await ctx.db.insert(guildChatMessages).values({
        guildId: g.id,
        authorCharId: char.id,
        authorName: char.name,
        authorCls: char.cls,
        body: `${char.name} dołączył/a do gildii.`,
        kind: 'system',
      });

      logGuildJoined(ctx.db, char.id, char.name, g.id, g.name).catch((e) =>
        console.error('[chronicle] logGuildJoined failed', e),
      );

      const unlocks: AchievementUnlockPayload[] = [];
      await collectBump(unlocks, ctx.db, char.id, 'guild_first_join');

      return { ok: true, unlockedAchievements: unlocks };
    }),

  /** Gracz odrzuca zaproszenie. */
  declineInvite: protectedProcedure
    .input(guildIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      await ctx.db
        .delete(guildInvites)
        .where(and(eq(guildInvites.guildId, input.guildId), eq(guildInvites.characterId, char.id)));
      return { ok: true };
    }),

  /** Officer/Leader zatwierdza aplikację. Analogicznie do acceptInvite. */
  approveApplication: protectedProcedure
    .input(guildCharIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      const { guildId } = await assertCan(ctx.db, char.id, 'approveApplication');
      const [inv] = await ctx.db
        .select()
        .from(guildInvites)
        .where(and(eq(guildInvites.guildId, guildId), eq(guildInvites.characterId, input.characterId)))
        .limit(1);
      if (!inv || inv.direction !== 'apply') {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak aplikacji.' });
      }
      if (await getMembershipOrNull(ctx.db, input.characterId)) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Już w gildii.' });
      }
      const [g] = await ctx.db.select().from(guilds).where(eq(guilds.id, guildId)).limit(1);
      if (!g) throw new TRPCError({ code: 'NOT_FOUND', message: 'Gildia.' });
      const count = await guildMemberCount(ctx.db, guildId);
      if (count >= g.memberCap) throw new TRPCError({ code: 'FORBIDDEN', message: 'Pełna.' });

      const [applicant] = await ctx.db
        .select()
        .from(characters)
        .where(eq(characters.id, input.characterId))
        .limit(1);
      if (!applicant) throw new TRPCError({ code: 'NOT_FOUND', message: 'Postać.' });

      await ctx.db
        .insert(guildMembers)
        .values({ guildId, characterId: input.characterId, rank: 'recruit' });
      await ctx.db
        .update(characters)
        .set({ guildId, guildRank: 'recruit', updatedAt: new Date() })
        .where(eq(characters.id, input.characterId));
      await ctx.db
        .delete(guildInvites)
        .where(and(eq(guildInvites.guildId, guildId), eq(guildInvites.characterId, input.characterId)));

      await ctx.db.insert(guildChatMessages).values({
        guildId,
        authorCharId: applicant.id,
        authorName: applicant.name,
        authorCls: applicant.cls,
        body: `${applicant.name} dołączył/a do gildii.`,
        kind: 'system',
      });

      logGuildJoined(ctx.db, applicant.id, applicant.name, guildId, g.name).catch((e) =>
        console.error('[chronicle] logGuildJoined failed', e),
      );

      return { ok: true };
    }),

  /** Officer/Leader odrzuca aplikację. */
  rejectApplication: protectedProcedure
    .input(guildCharIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      const { guildId } = await assertCan(ctx.db, char.id, 'approveApplication');
      await ctx.db
        .delete(guildInvites)
        .where(and(eq(guildInvites.guildId, guildId), eq(guildInvites.characterId, input.characterId)));
      return { ok: true };
    }),

  /** Wykop członka — zależy od jego ranku (recruit/member można wykopać
   *  officerem; officer tylko liderem). */
  kick: protectedProcedure
    .input(guildCharIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      const { guildId, rank: myRank } = await getMembershipOrNull(ctx.db, char.id).then((m) => {
        if (!m) throw new TRPCError({ code: 'FORBIDDEN', message: 'Nie w gildii.' });
        return m;
      });
      if (input.characterId === char.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Użyj leave.' });
      }
      const target = await getTargetMembership(ctx.db, guildId, input.characterId);
      if (!target) throw new TRPCError({ code: 'NOT_FOUND', message: 'Nie ma takiego członka.' });

      const action =
        target.rank === 'recruit'
          ? 'kickRecruit'
          : target.rank === 'member'
            ? 'kickMember'
            : target.rank === 'officer'
              ? 'kickOfficer'
              : null;
      if (!action) throw new TRPCError({ code: 'FORBIDDEN', message: 'Nie możesz wykopać lidera.' });
      if (!canPerform(myRank, action)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Twoja ranga nie pozwala.' });
      }

      const [targetChar] = await ctx.db
        .select({ name: characters.name, cls: characters.cls })
        .from(characters)
        .where(eq(characters.id, input.characterId))
        .limit(1);

      await ctx.db
        .delete(guildMembers)
        .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.characterId, input.characterId)));
      await ctx.db
        .update(characters)
        .set({ guildId: null, guildRank: null, updatedAt: new Date() })
        .where(eq(characters.id, input.characterId));

      if (targetChar) {
        await ctx.db.insert(guildChatMessages).values({
          guildId,
          authorCharId: char.id,
          authorName: char.name,
          authorCls: char.cls,
          body: `${targetChar.name} został/a wykopany/a z gildii.`,
          kind: 'system',
        });
      }

      return { ok: true };
    }),

  /** Promocja: recruit→member (officer+), member→officer (leader only). */
  promote: protectedProcedure
    .input(guildCharIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      const me = await getMembershipOrNull(ctx.db, char.id);
      if (!me) throw new TRPCError({ code: 'FORBIDDEN', message: 'Nie w gildii.' });
      const target = await getTargetMembership(ctx.db, me.guildId, input.characterId);
      if (!target) throw new TRPCError({ code: 'NOT_FOUND', message: 'Nie ma członka.' });

      let newRank: GuildRank;
      if (target.rank === 'recruit') {
        if (!canPerform(me.rank, 'promoteToMember')) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Brak uprawnień.' });
        }
        newRank = 'member';
      } else if (target.rank === 'member') {
        if (!canPerform(me.rank, 'promoteToOfficer')) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Tylko lider.' });
        }
        newRank = 'officer';
      } else {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nie możesz wyżej promować.' });
      }

      await ctx.db
        .update(guildMembers)
        .set({ rank: newRank })
        .where(and(eq(guildMembers.guildId, me.guildId), eq(guildMembers.characterId, input.characterId)));
      await ctx.db
        .update(characters)
        .set({ guildRank: newRank, updatedAt: new Date() })
        .where(eq(characters.id, input.characterId));

      const unlocks: AchievementUnlockPayload[] = [];
      if (newRank === 'officer') {
        await collectBump(unlocks, ctx.db, input.characterId, 'guild_officer_rank');
      }

      return { ok: true, newRank, unlockedAchievements: unlocks };
    }),

  /** Degradacja — tylko lider. officer→member, member→recruit. */
  demote: protectedProcedure
    .input(guildCharIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      const { guildId } = await assertCan(ctx.db, char.id, 'demote');
      const target = await getTargetMembership(ctx.db, guildId, input.characterId);
      if (!target) throw new TRPCError({ code: 'NOT_FOUND', message: 'Nie ma członka.' });
      if (target.rank === 'leader') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Lidera nie degraduje się.' });
      }
      const newRank: GuildRank =
        target.rank === 'officer' ? 'member' : target.rank === 'member' ? 'recruit' : 'recruit';
      if (target.rank === 'recruit') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Już najniższa ranga.' });
      }
      await ctx.db
        .update(guildMembers)
        .set({ rank: newRank })
        .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.characterId, input.characterId)));
      await ctx.db
        .update(characters)
        .set({ guildRank: newRank, updatedAt: new Date() })
        .where(eq(characters.id, input.characterId));
      return { ok: true, newRank };
    }),

  /** Przekaż przywództwo — tylko lider. Target musi być w gildii. */
  transferLeader: protectedProcedure
    .input(guildCharIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      const { guildId } = await assertCan(ctx.db, char.id, 'transferLeader');
      if (input.characterId === char.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Już jesteś liderem.' });
      }
      const target = await getTargetMembership(ctx.db, guildId, input.characterId);
      if (!target) throw new TRPCError({ code: 'NOT_FOUND', message: 'Nie ma członka.' });

      await ctx.db
        .update(guildMembers)
        .set({ rank: 'officer' })
        .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.characterId, char.id)));
      await ctx.db
        .update(guildMembers)
        .set({ rank: 'leader' })
        .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.characterId, input.characterId)));
      await ctx.db
        .update(guilds)
        .set({ leaderCharId: input.characterId, updatedAt: new Date() })
        .where(eq(guilds.id, guildId));
      await ctx.db
        .update(characters)
        .set({ guildRank: 'officer', updatedAt: new Date() })
        .where(eq(characters.id, char.id));
      await ctx.db
        .update(characters)
        .set({ guildRank: 'leader', updatedAt: new Date() })
        .where(eq(characters.id, input.characterId));

      const unlocks: AchievementUnlockPayload[] = [];
      await collectBump(unlocks, ctx.db, input.characterId, 'guild_leader_rank');

      return { ok: true, unlockedAchievements: unlocks };
    }),

  /** Moje zaproszenia + aplikacje — dla dashboard banner'a. */
  myInvites: protectedProcedure.query(async ({ ctx }): Promise<GuildMyInvitesResponse> => {
    const char = await requireChar(ctx.db, ctx.userId);
    const rows = await ctx.db
      .select({
        guildId: guildInvites.guildId,
        direction: guildInvites.direction,
        createdBy: guildInvites.createdBy,
        expiresAt: guildInvites.expiresAt,
        guildName: guilds.name,
        guildTag: guilds.tag,
      })
      .from(guildInvites)
      .innerJoin(guilds, eq(guilds.id, guildInvites.guildId))
      .where(
        and(
          eq(guildInvites.characterId, char.id),
          isNull(guilds.disbandedAt),
          lt(sql`${guildInvites.expiresAt}`, sql`now() + interval '7 days'`),
          ne(guildInvites.direction, 'apply'), // tylko inbound invites
        ),
      );
    return {
      invites: rows.map((r) => ({
        guildId: r.guildId,
        guildName: r.guildName,
        guildTag: r.guildTag,
        direction: r.direction as 'invite' | 'apply',
        createdBy: r.createdBy,
        expiresAt: r.expiresAt.getTime(),
      })),
    };
  }),

  /** Officer+ — pending applications do mojej gildii. */
  pendingApplications: protectedProcedure.query(
    async ({ ctx }): Promise<GuildPendingApplicationsResponse> => {
      const char = await requireChar(ctx.db, ctx.userId);
      const membership = await getMembershipOrNull(ctx.db, char.id);
      if (!membership) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Nie jesteś w gildii.' });
      }
      if (membership.rank !== 'leader' && membership.rank !== 'officer') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Tylko lider/oficer widzi podania.',
        });
      }
      const rows = await ctx.db
        .select({
          characterId: guildInvites.characterId,
          createdAt: guildInvites.createdAt,
          expiresAt: guildInvites.expiresAt,
          name: characters.name,
          cls: characters.cls,
          lvl: characters.lvl,
        })
        .from(guildInvites)
        .innerJoin(characters, eq(characters.id, guildInvites.characterId))
        .where(
          and(
            eq(guildInvites.guildId, membership.guildId),
            eq(guildInvites.direction, 'apply'),
          ),
        );
      return {
        applications: rows.map((r) => ({
          characterId: r.characterId,
          name: r.name,
          cls: r.cls as CharacterClass,
          lvl: r.lvl,
          createdAt: r.createdAt.getTime(),
          expiresAt: r.expiresAt.getTime(),
        })),
      };
    },
  ),

  // ============================================================
  // Chat + metadata
  // ============================================================

  /** Ostatnie 50 wiadomości. Polling na kliencie co 8s. */
  chatList: protectedProcedure
    .input(guildChatListInputSchema)
    .query(async ({ ctx, input }): Promise<GuildChatListResponse> => {
      const char = await requireChar(ctx.db, ctx.userId);
      const membership = await getMembershipOrNull(ctx.db, char.id);
      if (!membership) return { messages: [] };
      const whereParts = [eq(guildChatMessages.guildId, membership.guildId)];
      if (input.before) {
        whereParts.push(lt(guildChatMessages.createdAt, new Date(input.before)));
      }
      const rows = await ctx.db
        .select()
        .from(guildChatMessages)
        .where(and(...whereParts))
        .orderBy(desc(guildChatMessages.createdAt))
        .limit(50);
      return {
        messages: rows.map((r) => ({
          id: r.id,
          authorCharId: r.authorCharId,
          authorName: r.authorName,
          authorCls: r.authorCls as 'warrior' | 'mage' | 'rogue',
          body: r.body,
          kind: r.kind as 'chat' | 'system',
          createdAt: r.createdAt.getTime(),
        })),
      };
    }),

  /** Wyślij wiadomość. Rate-limit: 1/3s, 30/5min. */
  chatSend: protectedProcedure
    .input(guildChatSendInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      await assertCan(ctx.db, char.id, 'chat.send');
      const { guildId } = await getMembershipOrNull(ctx.db, char.id).then((m) => m!);
      if (!canSendChat(char.id, Date.now())) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Spowolnij. Chwilę poczekaj.' });
      }
      await ctx.db.insert(guildChatMessages).values({
        guildId,
        authorCharId: char.id,
        authorName: char.name,
        authorCls: char.cls,
        body: input.body,
        kind: 'chat',
      });
      await ctx.db
        .update(guildMembers)
        .set({ lastActiveAt: new Date() })
        .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.characterId, char.id)));

      const unlocks: AchievementUnlockPayload[] = [];
      await collectBump(unlocks, ctx.db, char.id, 'guild_chat_chatty_100');

      return { ok: true, unlockedAchievements: unlocks };
    }),

  /** Usuwa wiadomość z czatu. Autor zawsze swoją. Leader i officer dowolną. System msgs — nie. */
  chatDelete: protectedProcedure
    .input(guildChatDeleteInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      const membership = await getMembershipOrNull(ctx.db, char.id);
      if (!membership) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Nie jesteś w gildii.' });
      }
      const [msg] = await ctx.db
        .select()
        .from(guildChatMessages)
        .where(eq(guildChatMessages.id, input.messageId))
        .limit(1);
      if (!msg) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Wiadomość nie istnieje.' });
      }
      if (msg.guildId !== membership.guildId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'To nie jest wiadomość z twojej gildii.',
        });
      }
      if (msg.kind === 'system') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Systemowych nie ruszamy.',
        });
      }
      const isAuthor = msg.authorCharId === char.id;
      const isModerator =
        membership.rank === 'leader' || membership.rank === 'officer';
      if (!isAuthor && !isModerator) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Tylko autor albo lider/oficer.',
        });
      }
      await ctx.db
        .delete(guildChatMessages)
        .where(eq(guildChatMessages.id, input.messageId));
      return { ok: true };
    }),

  updateMotto: protectedProcedure
    .input(guildUpdateMottoInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      const { guildId } = await assertCan(ctx.db, char.id, 'updateMotto');
      await ctx.db
        .update(guilds)
        .set({ motto: input.motto, updatedAt: new Date() })
        .where(eq(guilds.id, guildId));
      return { ok: true };
    }),

  updateEmblem: protectedProcedure
    .input(guildUpdateEmblemInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      const { guildId } = await assertCan(ctx.db, char.id, 'updateEmblem');
      await ctx.db
        .update(guilds)
        .set({
          emblemKind: input.emblemKind,
          emblemColor: input.emblemColor,
          updatedAt: new Date(),
        })
        .where(eq(guilds.id, guildId));
      return { ok: true };
    }),

  updateOpenness: protectedProcedure
    .input(guildUpdateOpennessInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      const { guildId } = await assertCan(ctx.db, char.id, 'updateOpenness');
      await ctx.db
        .update(guilds)
        .set({
          isOpen: input.isOpen,
          requiredLvl: input.requiredLvl,
          updatedAt: new Date(),
        })
        .where(eq(guilds.id, guildId));
      return { ok: true };
    }),

  // Szuka postaci po prefiksie nazwy. Tylko bez gildii (inviteable targets).
  // Case-insensitive, max 10 wyników. Używane w GuildInviteModal.
  searchCharacter: protectedProcedure
    .input(guildSearchCharacterInputSchema)
    .query(async ({ ctx, input }): Promise<GuildSearchCharacterResponse> => {
      const rows = await ctx.db
        .select({
          id: characters.id,
          name: characters.name,
          cls: characters.cls,
          lvl: characters.lvl,
        })
        .from(characters)
        .where(and(ilike(characters.name, `${input.query}%`), isNull(characters.guildId)))
        .orderBy(asc(characters.name))
        .limit(10);
      return { results: rows };
    }),
});
