// Guild raids router — Phase 4 (continuous S&F).
//
// 3 endpointy: current, hit, history.
// - current: zwraca aktywnego bossa + mój cooldown + top-10 leaderboard.
//   Jeśli brak activowego — spawn'uje tier 1 (lazy bootstrap).
// - hit: snapshot fighter z guild buffs, damage roll, decrement HP, log hit.
//   Gdy HP <= 0: mark killed, spawn next tier, split reward, chronicle, ach.
// - history: ostatnie ubite bossy (tier desc).

import { TRPCError } from '@trpc/server';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type {
  AchievementUnlockPayload,
  CharacterClass,
  CharacterStats,
  GuildRaidBoss,
  GuildRaidCurrentResponse,
  GuildRaidHistoryResponse,
  GuildRaidHitResponse,
  GuildRaidLeaderboardEntry,
  IconName,
} from '@grodno/shared';
import { GEM_SINK_COSTS } from '@grodno/shared';
import {
  characterCompanions,
  characters,
  guildMembers,
  guildRaidBosses,
  guildRaidHits,
  guildTreasuryLogs,
  guilds,
} from '../db/schema.js';
import { collectBump } from '../game/achievements.js';
import { loadEquipBonuses, type CombatFighter } from '../game/arena.js';
import {
  aggregateBuffs,
  effectiveMax,
  loadActiveBuffs,
} from '../game/buffs.js';
import { logGuildRaidKilled } from '../game/chronicle.js';
import { isoDateUTC } from '../game/daily.js';
import {
  RAID_HITS_PER_DAY,
  computeBossHp,
  computeBossReward,
  rollRaidDamage,
  templateForTier,
} from '../game/guild-raids.js';
import { applyGuildWarBuffs, loadGuildWarBuffs } from '../game/guilds.js';
import {
  applyScrapbookDamageBuff,
  applyScrapbookGoldBonus,
  loadScrapbookBuffs,
} from '../game/scrapbook.js';
import { getCompanion } from '../game/tavern.js';
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

/** Zapewnia że gildia ma aktywnego bossa (spawn tier 1 jeśli brak). Zwraca row'a. */
async function ensureActiveBoss(
  db: import('../db/client.js').Db,
  guildId: string,
): Promise<typeof guildRaidBosses.$inferSelect> {
  const [existing] = await db
    .select()
    .from(guildRaidBosses)
    .where(and(eq(guildRaidBosses.guildId, guildId), eq(guildRaidBosses.status, 'active')))
    .limit(1);
  if (existing) return existing;

  // Brak active'ego. Sprawdź najwyższy tier ubitego (żeby continuation po killu
  // był poprawny — ale zwyczaj spawn następuje od razu w hit'cie. Ten branch
  // to lazy bootstrap dla NEW gildii albo gdy coś się stało kasującego active'a).
  const [lastKilled] = await db
    .select({ tier: guildRaidBosses.tier })
    .from(guildRaidBosses)
    .where(eq(guildRaidBosses.guildId, guildId))
    .orderBy(desc(guildRaidBosses.tier))
    .limit(1);
  const nextTier = lastKilled ? lastKilled.tier + 1 : 1;
  const tpl = templateForTier(nextTier);
  const hpMax = computeBossHp(tpl.baseHp, nextTier);

  const [spawned] = await db
    .insert(guildRaidBosses)
    .values({
      guildId,
      tier: nextTier,
      bossSlug: tpl.slug,
      hpMax,
      hpCurrent: hpMax,
      status: 'active',
    })
    .returning();
  return spawned!;
}

async function buildFighter(
  db: import('../db/client.js').Db,
  char: typeof characters.$inferSelect,
): Promise<CombatFighter> {
  const equip = await loadEquipBonuses(db, char.id);
  // Companion + timed elixir/blessing buffy — spójne z PvE/tower/arena.
  // Bez tego gracz wypijający eliksir +8 ATK nie czuje go w raidzie.
  const [companionRow] = await db
    .select({ slug: characterCompanions.companionSlug })
    .from(characterCompanions)
    .where(eq(characterCompanions.characterId, char.id))
    .limit(1);
  const compBuff = companionRow ? getCompanion(companionRow.slug)?.buff ?? null : null;
  const elixirBuffs = await loadActiveBuffs(db, char.id, new Date());
  const eb = aggregateBuffs(elixirBuffs);
  const stats = char.stats as CharacterStats;
  const base: CombatFighter = {
    atk: stats.atk + equip.atk + (compBuff?.atkBonus ?? 0) + eb.atkFlat,
    def: stats.def + equip.def + eb.defFlat,
    mag: stats.mag + equip.mag + (compBuff?.magBonus ?? 0) + eb.magFlat,
    spd: stats.spd + eb.spdFlat,
    hpMax: effectiveMax(char.hpMax, eb.hpMaxPct),
    cls: char.cls as CharacterClass,
    name: char.name,
    lvl: char.lvl,
  };
  const guildBuffs = await loadGuildWarBuffs(db, char.id);
  const scrapbookBuffs = await loadScrapbookBuffs(db, char.id);
  const withGuild = applyGuildWarBuffs(base, guildBuffs);
  return applyScrapbookDamageBuff(withGuild, scrapbookBuffs);
}

function bossRowToDto(row: typeof guildRaidBosses.$inferSelect): GuildRaidBoss {
  const tpl = templateForTier(row.tier);
  return {
    id: row.id,
    slug: row.bossSlug,
    name: tpl.name,
    icon: tpl.icon,
    flavor: tpl.flavor,
    tier: row.tier,
    hpMax: row.hpMax,
    hpCurrent: row.hpCurrent,
    spawnedAt: row.spawnedAt.getTime(),
  };
}

async function leaderboard(
  db: import('../db/client.js').Db,
  bossId: string,
): Promise<GuildRaidLeaderboardEntry[]> {
  const rows = await db
    .select({
      characterId: guildRaidHits.characterId,
      name: characters.name,
      cls: characters.cls,
      totalDmg: sql<number>`sum(${guildRaidHits.dmg})::int`,
      hitCount: sql<number>`count(*)::int`,
    })
    .from(guildRaidHits)
    .innerJoin(characters, eq(characters.id, guildRaidHits.characterId))
    .where(eq(guildRaidHits.bossId, bossId))
    .groupBy(guildRaidHits.characterId, characters.name, characters.cls)
    .orderBy(desc(sql`sum(${guildRaidHits.dmg})`))
    .limit(10);
  return rows.map((r) => ({
    characterId: r.characterId,
    name: r.name,
    cls: r.cls as CharacterClass,
    totalDmg: r.totalDmg,
    hitCount: r.hitCount,
  }));
}

async function resolveMyHitsToday(
  db: import('../db/client.js').Db,
  guildId: string,
  characterId: string,
): Promise<number> {
  const [member] = await db
    .select({
      hits: guildMembers.raidHitsToday,
      date: guildMembers.lastRaidHitDate,
    })
    .from(guildMembers)
    .where(
      and(eq(guildMembers.guildId, guildId), eq(guildMembers.characterId, characterId)),
    )
    .limit(1);
  if (!member) return 0;
  const today = isoDateUTC();
  return member.date === today ? member.hits : 0;
}

export const guildRaidsRouter = router({
  current: protectedProcedure.query(async ({ ctx }): Promise<GuildRaidCurrentResponse> => {
    const char = await requireChar(ctx.db, ctx.userId);
    const membership = await getMembershipOrNull(ctx.db, char.id);
    if (!membership) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Nie jesteś w gildii.' });
    }

    const boss = await ensureActiveBoss(ctx.db, membership.guildId);
    const myHitsToday = await resolveMyHitsToday(ctx.db, membership.guildId, char.id);
    const leaders = await leaderboard(ctx.db, boss.id);

    return {
      boss: bossRowToDto(boss),
      myHitsToday,
      myHitsMax: RAID_HITS_PER_DAY,
      leaderboard: leaders,
    };
  }),

  hit: protectedProcedure.mutation(async ({ ctx }): Promise<GuildRaidHitResponse> => {
    const char = await requireChar(ctx.db, ctx.userId);
    if (isWorking(char)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: WORKING_BLOCKS_COMBAT_MESSAGE });
    }
    const { guildId } = await assertCan(ctx.db, char.id, 'raidHit');

    // Daily limit check — reset gdy date'a się zmieniła.
    const [member] = await ctx.db
      .select()
      .from(guildMembers)
      .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.characterId, char.id)))
      .limit(1);
    if (!member) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Nie jesteś w gildii.' });
    }
    const today = isoDateUTC();
    const hitsTodayBefore = member.lastRaidHitDate === today ? member.raidHitsToday : 0;
    if (hitsTodayBefore >= RAID_HITS_PER_DAY) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Dziś już ${RAID_HITS_PER_DAY} uderzeń. Reset o północy UTC.`,
      });
    }

    const boss = await ensureActiveBoss(ctx.db, guildId);
    const fighter = await buildFighter(ctx.db, char);
    const dmg = rollRaidDamage(fighter, boss.tier, boss.hpCurrent);
    const newHp = boss.hpCurrent - dmg;
    const killed = newHp <= 0;

    const unlocks: AchievementUnlockPayload[] = [];

    // Persist (hit + HP decrement + daily bump) w 1 transakcji.
    await ctx.db.transaction(async (tx) => {
      await tx.insert(guildRaidHits).values({
        bossId: boss.id,
        characterId: char.id,
        dmg,
      });

      if (killed) {
        await tx
          .update(guildRaidBosses)
          .set({
            hpCurrent: 0,
            status: 'killed',
            killedAt: new Date(),
            killingBlowCharId: char.id,
          })
          .where(eq(guildRaidBosses.id, boss.id));
      } else {
        await tx
          .update(guildRaidBosses)
          .set({ hpCurrent: newHp })
          .where(eq(guildRaidBosses.id, boss.id));
      }

      await tx
        .update(guildMembers)
        .set({
          raidHitsToday: hitsTodayBefore + 1,
          lastRaidHitDate: today,
          lastActiveAt: new Date(),
        })
        .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.characterId, char.id)));
    });

    let nextBossDto: GuildRaidBoss | null = null;
    let rewardGold = 0;
    let rewardGems = 0;

    await collectBump(unlocks, ctx.db, char.id, 'guild_raid_first_hit');

    if (killed) {
      const [guildRow] = await ctx.db
        .select({ name: guilds.name })
        .from(guilds)
        .where(eq(guilds.id, guildId))
        .limit(1);
      const guildName = guildRow?.name ?? '???';
      const tpl = templateForTier(boss.tier);

      // Reward payout do skarbca. Killing-blow gracz wnosi swój scrapbook
      // gold buff (+3% @ 50%) do treasury — symbolicznie premia za
      // kolekcjonerstwo. Gemy bez bonus'u.
      const reward = computeBossReward(boss.tier);
      const killerScrapbook = await loadScrapbookBuffs(ctx.db, char.id);
      rewardGold = applyScrapbookGoldBonus(reward.gold, killerScrapbook);
      rewardGems = reward.gems;

      // Spawn next tier.
      const nextTier = boss.tier + 1;
      const nextTpl = templateForTier(nextTier);
      const nextHp = computeBossHp(nextTpl.baseHp, nextTier);

      await ctx.db.transaction(async (tx) => {
        // 1. Reward do skarbca.
        await tx
          .update(guilds)
          .set({
            treasuryGold: sql`${guilds.treasuryGold} + ${rewardGold}`,
            treasuryGems: sql`${guilds.treasuryGems} + ${rewardGems}`,
            updatedAt: new Date(),
          })
          .where(eq(guilds.id, guildId));
        await tx.insert(guildTreasuryLogs).values({
          guildId,
          actorCharId: char.id,
          actorName: char.name,
          kind: 'raid_reward',
          goldDelta: rewardGold,
          gemsDelta: rewardGems,
          memo: `${tpl.name} T${boss.tier} padł`,
        });

        // 2. Spawn next tier.
        const [next] = await tx
          .insert(guildRaidBosses)
          .values({
            guildId,
            tier: nextTier,
            bossSlug: nextTpl.slug,
            hpMax: nextHp,
            hpCurrent: nextHp,
            status: 'active',
          })
          .returning();
        if (next) nextBossDto = bossRowToDto(next);
      });

      // 3. Chronicle + achievements dla wszystkich członków gildii (killing blow
      // dostaje killblow; wszyscy członkowie dostają kills_N progress).
      await logGuildRaidKilled(
        ctx.db,
        char.id,
        char.name,
        boss.id,
        guildName,
        tpl.name,
        boss.tier,
      ).catch((err) => console.error('[guildRaids] logGuildRaidKilled', err));
      await collectBump(unlocks, ctx.db, char.id, 'guild_raid_killblow');

      // Aggregate kills dla gildii — bumpuje się u WSZYSTKICH członków
      // proportionalnie (każdy dostaje +1 do swojego guild_raid_kills_N).
      const memberRows = await ctx.db
        .select({ id: guildMembers.characterId })
        .from(guildMembers)
        .where(eq(guildMembers.guildId, guildId));
      for (const m of memberRows) {
        if (m.id === char.id) continue; // już bumped przez killblow flow
        const memberUnlocks: AchievementUnlockPayload[] = [];
        await collectBump(memberUnlocks, ctx.db, m.id, 'guild_raid_kills_5').catch(() => null);
        await collectBump(memberUnlocks, ctx.db, m.id, 'guild_raid_kills_25').catch(() => null);
        // Unlocks zewnętrznych członków NIE pojawiają się w response — zostaną
        // wyemitowane gdy członek otworzy screen achievementów.
      }
      await collectBump(unlocks, ctx.db, char.id, 'guild_raid_kills_5');
      await collectBump(unlocks, ctx.db, char.id, 'guild_raid_kills_25');
    }

    const myHitsToday = hitsTodayBefore + 1;
    return {
      dmg,
      hpRemaining: Math.max(0, newHp),
      killed,
      nextBoss: nextBossDto,
      rewardGold,
      rewardGems,
      myHitsToday,
      myHitsMax: RAID_HITS_PER_DAY,
      unlockedAchievements: unlocks.length > 0 ? unlocks : undefined,
    };
  }),

  history: protectedProcedure.query(async ({ ctx }): Promise<GuildRaidHistoryResponse> => {
    const char = await requireChar(ctx.db, ctx.userId);
    const membership = await getMembershipOrNull(ctx.db, char.id);
    if (!membership) return { entries: [] };

    const rows = await ctx.db
      .select({
        id: guildRaidBosses.id,
        tier: guildRaidBosses.tier,
        bossSlug: guildRaidBosses.bossSlug,
        hpMax: guildRaidBosses.hpMax,
        killedAt: guildRaidBosses.killedAt,
        killingBlowCharId: guildRaidBosses.killingBlowCharId,
      })
      .from(guildRaidBosses)
      .where(
        and(
          eq(guildRaidBosses.guildId, membership.guildId),
          eq(guildRaidBosses.status, 'killed'),
        ),
      )
      .orderBy(desc(guildRaidBosses.tier))
      .limit(20);

    const charIds = Array.from(
      new Set(rows.map((r) => r.killingBlowCharId).filter((id): id is string => !!id)),
    );
    const charRows = charIds.length
      ? await ctx.db
          .select({ id: characters.id, name: characters.name })
          .from(characters)
          .where(inArray(characters.id, charIds))
      : [];
    const nameById = new Map(charRows.map((c) => [c.id, c.name]));

    return {
      entries: rows.map((r) => {
        const tpl = templateForTier(r.tier);
        return {
          id: r.id,
          tier: r.tier,
          bossName: tpl.name,
          bossIcon: tpl.icon as IconName,
          hpMax: r.hpMax,
          killedAt: r.killedAt ? r.killedAt.getTime() : 0,
          killingBlowCharName: r.killingBlowCharId
            ? (nameById.get(r.killingBlowCharId) ?? null)
            : null,
        };
      }),
    };
  }),

  /**
   * Gem sink: dokup extra raid hit poza dziennym limitem (3/dzień).
   * Dekrementuje `raid_hits_today` o 1 — następny `hit` może przejść gate.
   * Tylko gdy gracz osiągnął cap.
   */
  buyExtraHit: protectedProcedure.mutation(async ({ ctx }) => {
    const char = await requireChar(ctx.db, ctx.userId);
    const cost = GEM_SINK_COSTS.extraRaidHit;
    if (char.gems < cost) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Brak gemów (${cost}).` });
    }
    const [member] = await ctx.db
      .select()
      .from(guildMembers)
      .where(eq(guildMembers.characterId, char.id))
      .limit(1);
    if (!member) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Nie jesteś w gildii.' });
    }
    const today = isoDateUTC();
    const hitsTodayBefore = member.lastRaidHitDate === today ? member.raidHitsToday : 0;
    if (hitsTodayBefore < 3) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Masz jeszcze darmowe uderzenia dziś.',
      });
    }
    await ctx.db
      .update(characters)
      .set({ gems: sql`${characters.gems} - ${cost}` })
      .where(eq(characters.id, char.id));
    await ctx.db
      .update(guildMembers)
      .set({
        raidHitsToday: hitsTodayBefore - 1,
        lastRaidHitDate: today,
      })
      .where(and(eq(guildMembers.guildId, member.guildId), eq(guildMembers.characterId, char.id)));
    return { ok: true, cost };
  }),
});
