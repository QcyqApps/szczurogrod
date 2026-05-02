// World boss router — server-wide raid (Phase 1: MVP + tap-fury mini-game).
//
// Endpointy: current, startHit, commitHit, shopList, shopBuy, buyExtraHit, history.
// - current: zwraca aktywnego bossa (lazy spawn jeśli brak), mój udział,
//   leaderboard top 50, mój rank.
// - startHit: rezerwacja sesji dla tap-mini-gry. NIE inkrementuje hitsToday
//   ani nie rolluje dmg — tylko lock'uje session w pamięci. Klient otwiera
//   modal i zlicza tapy przez TAP_FURY_DURATION_MS.
// - commitHit: walidacja sesji (ownership, duration, tap rate cap), damage
//   roll z multiplierem tapów, decrement HP, log hit, distribution po killu.
// - history: ostatnie 20 ubitych bossów + mój rank w każdym.

import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import type {
  AchievementUnlockPayload,
  CharacterClass,
  CharacterStats,
  WorldBoss,
  WorldBossCurrentResponse,
  WorldBossHistoryEntry,
  WorldBossHistoryResponse,
  WorldBossHitResponse,
  WorldBossLeaderboardEntry,
  WorldBossShopBuyResponse,
  WorldBossShopListResponse,
  WorldBossStartHitResponse,
} from '@grodno/shared';
import {
  GEM_SINK_COSTS,
  worldBossCommitHitInputSchema,
  worldBossShopBuyInputSchema,
} from '@grodno/shared';
import {
  characterCompanions,
  characters,
  worldBossHits,
  worldBosses,
} from '../db/schema.js';
import { collectBump } from '../game/achievements.js';
import { loadEquipBonuses, type CombatFighter } from '../game/arena.js';
import { aggregateBuffs, effectiveMax, loadActiveBuffs } from '../game/buffs.js';
import { logWorldBossKilled } from '../game/chronicle.js';
import { isoDateUTC } from '../game/daily.js';
import { applyGuildWarBuffs, loadGuildWarBuffs } from '../game/guilds.js';
import {
  applyScrapbookDamageBuff,
  loadScrapbookBuffs,
} from '../game/scrapbook.js';
import { getCompanion } from '../game/tavern.js';
import { isWorking, WORKING_BLOCKS_COMBAT_MESSAGE } from '../game/work.js';
import {
  TAP_FURY_DURATION_MS,
  TAP_FURY_MAX_TAPS,
  TAP_FURY_MIN_TAPS,
  WORLD_BOSS_HITS_PER_DAY,
  applyTapBonusToEchoes,
  classesAdvantageousIn,
  clampTapCount,
  computePhase,
  computeWorldBossHp,
  createHitSession,
  damageBonusGold,
  deleteHitSession,
  findCharHitSession,
  getHitSession,
  killerEchoBonus,
  rewardForRank,
  rollEchoesDrop,
  rollWorldBossDamage,
  tapMultiplier,
  worldBossTemplateForTier,
} from '../game/world-bosses.js';
import { findOffer, WORLD_BOSS_SHOP } from '../game/world-boss-shop.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

async function requireChar(
  db: import('../db/client.js').Db,
  userId: string,
): Promise<typeof characters.$inferSelect> {
  const [char] = await db
    .select()
    .from(characters)
    .where(eq(characters.userId, userId))
    .limit(1);
  if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });
  return char;
}

/** Spawn'uje boss tier 1 jeśli brak active'go. Wywoływane lazy. */
async function ensureActiveBoss(
  db: import('../db/client.js').Db,
): Promise<typeof worldBosses.$inferSelect> {
  const [existing] = await db
    .select()
    .from(worldBosses)
    .where(eq(worldBosses.status, 'active'))
    .limit(1);
  if (existing) return existing;

  // Brak active'ego. Sprawdź najwyższy tier ubitego (continuation po killu
  // robi się w hit'cie, więc ten branch — pierwszy boot albo edge case).
  const [lastKilled] = await db
    .select({ tier: worldBosses.tier })
    .from(worldBosses)
    .orderBy(desc(worldBosses.tier))
    .limit(1);
  const nextTier = lastKilled ? lastKilled.tier + 1 : 1;
  const tpl = worldBossTemplateForTier(nextTier);
  const hpMax = computeWorldBossHp(tpl.baseHp, nextTier);

  // Race-safe insert. Partial unique idx (status='active') zatrzymuje
  // równoległe spawny. Jeśli ktoś inny zdążył spawnować — re-fetch.
  try {
    const [spawned] = await db
      .insert(worldBosses)
      .values({
        tier: nextTier,
        bossSlug: tpl.slug,
        hpMax,
        hpCurrent: hpMax,
        status: 'active',
      })
      .returning();
    return spawned!;
  } catch {
    const [winner] = await db
      .select()
      .from(worldBosses)
      .where(eq(worldBosses.status, 'active'))
      .limit(1);
    if (!winner) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Spawn race lost — retry',
      });
    }
    return winner;
  }
}

async function buildFighter(
  db: import('../db/client.js').Db,
  char: typeof characters.$inferSelect,
): Promise<CombatFighter> {
  const equip = await loadEquipBonuses(db, char.id);
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
  // Buffy gildii (atak/mag/def %) i scrapbook też się stosują — podobnie
  // jak w guild raid'zie, żeby progres collection się czuł.
  const guildBuffs = await loadGuildWarBuffs(db, char.id);
  const scrapbookBuffs = await loadScrapbookBuffs(db, char.id);
  const withGuild = applyGuildWarBuffs(base, guildBuffs);
  return applyScrapbookDamageBuff(withGuild, scrapbookBuffs);
}

function bossRowToDto(row: typeof worldBosses.$inferSelect): WorldBoss {
  const tpl = worldBossTemplateForTier(row.tier);
  const phase = computePhase(row.hpCurrent, row.hpMax);
  return {
    id: row.id,
    slug: row.bossSlug,
    name: tpl.name,
    icon: tpl.icon,
    flavor: tpl.flavor,
    tier: row.tier,
    hpMax: row.hpMax,
    hpCurrent: row.hpCurrent,
    phase,
    advantageousClasses: [...classesAdvantageousIn(phase)],
    spawnedAt: row.spawnedAt.getTime(),
  };
}

const LEADERBOARD_LIMIT = 50;

async function leaderboard(
  db: import('../db/client.js').Db,
  bossId: string,
): Promise<WorldBossLeaderboardEntry[]> {
  const rows = await db
    .select({
      characterId: worldBossHits.characterId,
      name: characters.name,
      cls: characters.cls,
      totalDmg: sql<number>`sum(${worldBossHits.dmg})::int`,
      hitCount: sql<number>`count(*)::int`,
    })
    .from(worldBossHits)
    .innerJoin(characters, eq(characters.id, worldBossHits.characterId))
    .where(eq(worldBossHits.bossId, bossId))
    .groupBy(worldBossHits.characterId, characters.name, characters.cls)
    .orderBy(desc(sql`sum(${worldBossHits.dmg})`))
    .limit(LEADERBOARD_LIMIT);
  return rows.map((r) => ({
    characterId: r.characterId,
    name: r.name,
    cls: r.cls as CharacterClass,
    totalDmg: r.totalDmg,
    hitCount: r.hitCount,
  }));
}

/**
 * Wyznacza rank i sumę dmg dla konkretnej postaci. Rank obliczany jako
 * count distinct characters z większym total dmg + 1. Zwraca null gdy
 * postać nie biła tego bossa (totalDmg = 0).
 */
async function myStanding(
  db: import('../db/client.js').Db,
  bossId: string,
  characterId: string,
): Promise<{ totalDmg: number; rank: number | null }> {
  const [own] = await db
    .select({ totalDmg: sql<number>`coalesce(sum(${worldBossHits.dmg}), 0)::int` })
    .from(worldBossHits)
    .where(
      and(eq(worldBossHits.bossId, bossId), eq(worldBossHits.characterId, characterId)),
    );
  const totalDmg = own?.totalDmg ?? 0;
  if (totalDmg === 0) return { totalDmg: 0, rank: null };

  // Subquery: dla każdej postaci sumuję dmg, liczę ile postaci ma sumę większą.
  const result = await db.execute<{ better: number }>(sql`
    select count(*)::int as better from (
      select character_id, sum(dmg) as total
      from world_boss_hits
      where boss_id = ${bossId}
      group by character_id
      having sum(dmg) > ${totalDmg}
    ) sub
  `);
  const betterRow = result.rows[0] as { better?: number } | undefined;
  const better = Number(betterRow?.better ?? 0);
  return { totalDmg, rank: better + 1 };
}

async function totalHitterCount(
  db: import('../db/client.js').Db,
  bossId: string,
): Promise<number> {
  const [row] = await db
    .select({ n: count(sql`distinct ${worldBossHits.characterId}`) })
    .from(worldBossHits)
    .where(eq(worldBossHits.bossId, bossId));
  return Number(row?.n ?? 0);
}

/**
 * Po killu — zbiera całą leaderboard (wszystkich), liczy reward per rank,
 * commit'uje gold/gems do każdej postaci. Zwraca reward dla `selfCharId`
 * + jego final rank.
 */
async function distributeKillRewards(
  db: import('../db/client.js').Db,
  bossId: string,
  tier: number,
  selfCharId: string,
): Promise<{ rewardGold: number; rewardGems: number; finalRank: number }> {
  const ranking = await db
    .select({
      characterId: worldBossHits.characterId,
      totalDmg: sql<number>`sum(${worldBossHits.dmg})::int`,
    })
    .from(worldBossHits)
    .where(eq(worldBossHits.bossId, bossId))
    .groupBy(worldBossHits.characterId)
    .orderBy(desc(sql`sum(${worldBossHits.dmg})`));

  let selfReward = { rewardGold: 0, rewardGems: 0, finalRank: 0 };

  // Single transaction — wszystkie nagrody w atomic batch'u.
  await db.transaction(async (tx) => {
    for (let i = 0; i < ranking.length; i++) {
      const entry = ranking[i]!;
      const rank = i + 1;
      const reward = rewardForRank(rank, tier);
      const dmgBonus = damageBonusGold(entry.totalDmg);
      const totalGold = reward.gold + dmgBonus;
      const totalGems = reward.gems;
      await tx
        .update(characters)
        .set({
          gold: sql`${characters.gold} + ${totalGold}`,
          gems: sql`${characters.gems} + ${totalGems}`,
        })
        .where(eq(characters.id, entry.characterId));
      if (entry.characterId === selfCharId) {
        selfReward = {
          rewardGold: totalGold,
          rewardGems: totalGems,
          finalRank: rank,
        };
      }
    }
  });

  return selfReward;
}

export const worldBossRouter = router({
  current: protectedProcedure.query(async ({ ctx }): Promise<WorldBossCurrentResponse> => {
    const char = await requireChar(ctx.db, ctx.userId);
    const boss = await ensureActiveBoss(ctx.db);
    const today = isoDateUTC();
    const myHitsToday =
      char.lastWorldBossHitDate === today ? char.worldBossHitsToday : 0;
    const [leaders, standing, hitters] = await Promise.all([
      leaderboard(ctx.db, boss.id),
      myStanding(ctx.db, boss.id, char.id),
      totalHitterCount(ctx.db, boss.id),
    ]);

    return {
      boss: bossRowToDto(boss),
      myHitsToday,
      myHitsMax: WORLD_BOSS_HITS_PER_DAY,
      myTotalDmg: standing.totalDmg,
      myRank: standing.rank,
      totalHitters: hitters,
      leaderboard: leaders,
    };
  }),

  /**
   * Rezerwacja sesji tap-mini-gry. Walidacje: praca, daily-cap, brak innej
   * aktywnej sesji. NIE inkrementuje worldBossHitsToday — to robi `commitHit`.
   * Idempotency: jeśli istnieje świeża sesja, zwraca jej sessionId (refresh-safe).
   */
  startHit: protectedProcedure.mutation(
    async ({ ctx }): Promise<WorldBossStartHitResponse> => {
      const char = await requireChar(ctx.db, ctx.userId);
      if (isWorking(char)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: WORKING_BLOCKS_COMBAT_MESSAGE });
      }

      const today = isoDateUTC();
      const hitsTodayBefore =
        char.lastWorldBossHitDate === today ? char.worldBossHitsToday : 0;
      if (hitsTodayBefore >= WORLD_BOSS_HITS_PER_DAY) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Dziś już ${WORLD_BOSS_HITS_PER_DAY} uderzeń. Reset o północy UTC.`,
        });
      }

      // Idempotency dla refresha: jeśli sesja jest świeża i niezakomitowana,
      // zwróć jej id. Stałą sesję usuwamy żeby nie blokować nowego hita.
      const existing = findCharHitSession(char.id);
      if (existing && !existing.committed) {
        const elapsed = Date.now() - existing.startedAt;
        if (elapsed < TAP_FURY_DURATION_MS + 4000) {
          return {
            sessionId: existing.sessionId,
            durationMs: TAP_FURY_DURATION_MS,
            minTaps: TAP_FURY_MIN_TAPS,
            maxTaps: TAP_FURY_MAX_TAPS,
          };
        }
        deleteHitSession(existing.sessionId);
      }

      const boss = await ensureActiveBoss(ctx.db);
      const sessionId = randomUUID();
      createHitSession({
        sessionId,
        userId: ctx.userId,
        characterId: char.id,
        bossId: boss.id,
        bossTier: boss.tier,
        startedAt: Date.now(),
        committed: false,
      });

      return {
        sessionId,
        durationMs: TAP_FURY_DURATION_MS,
        minTaps: TAP_FURY_MIN_TAPS,
        maxTaps: TAP_FURY_MAX_TAPS,
      };
    },
  ),

  /**
   * Commit sesji — walidacje anti-cheat, damage roll z tap multiplier'em,
   * dystrybucja nagród przy killu. Lustro starego `hit` z dwiema różnicami:
   *   1. Damage skalowany przez tapMultiplier(taps) (0.6..1.4×).
   *   2. Echa +50% przy taps >= 25.
   * Dodatkowo: jeśli boss już padł (race z innym graczem) — refund hita,
   * zwracamy `bossAlreadyDead: true`, brak nagród.
   */
  commitHit: protectedProcedure
    .input(worldBossCommitHitInputSchema)
    .mutation(async ({ ctx, input }): Promise<WorldBossHitResponse> => {
      const char = await requireChar(ctx.db, ctx.userId);

      const session = getHitSession(input.sessionId);
      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Sesja wygasła. Zacznij ponownie.',
        });
      }
      if (session.userId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Nie twoja sesja.' });
      }
      if (session.committed) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Sesja już skomitowana.' });
      }

      const elapsed = Date.now() - session.startedAt;
      if (elapsed < TAP_FURY_DURATION_MS - 500) {
        // NIE oznaczamy committed — gracz może retry'ować po dolicizu czasu.
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Furia jeszcze trwa.',
        });
      }
      if (elapsed > TAP_FURY_DURATION_MS + 4000) {
        deleteHitSession(input.sessionId);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Sesja wygasła. Zacznij ponownie.',
        });
      }
      // Race-guard: ustaw committed dopiero po duration check'u, ale PRZED
      // re-fetch'em bossa i transakcją. Blokuje równoległe commit'y tej samej
      // sesji (np. user dwa razy klika commit po commit).
      session.committed = true;

      // Re-fetch boss atomicznie — mogło zmienić się od startHit.
      const [bossNow] = await ctx.db
        .select()
        .from(worldBosses)
        .where(eq(worldBosses.id, session.bossId))
        .limit(1);

      const today = isoDateUTC();
      const hitsTodayBefore =
        char.lastWorldBossHitDate === today ? char.worldBossHitsToday : 0;

      // Refund path — boss padł podczas Furii. Hit nie był jeszcze inkrementowany,
      // więc nic nie odejmujemy — po prostu usuwamy sesję i zwracamy soft-info.
      if (!bossNow || bossNow.status !== 'active' || bossNow.hpCurrent <= 0) {
        deleteHitSession(input.sessionId);
        return {
          dmg: 0,
          phaseAtHit: 3,
          phaseMatched: false,
          echoesDrop: 0,
          hpRemaining: 0,
          killed: false,
          nextBoss: null,
          rewardGold: 0,
          rewardGems: 0,
          finalRank: null,
          isKiller: false,
          myHitsToday: hitsTodayBefore,
          myHitsMax: WORLD_BOSS_HITS_PER_DAY,
          taps: 0,
          tapMultiplier: 1,
          bossAlreadyDead: true,
        };
      }

      // Defensywne re-checki (mogły się zmienić przez 4s + slack).
      if (isWorking(char)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: WORKING_BLOCKS_COMBAT_MESSAGE });
      }
      if (hitsTodayBefore >= WORLD_BOSS_HITS_PER_DAY) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Dziś już ${WORLD_BOSS_HITS_PER_DAY} uderzeń. Reset o północy UTC.`,
        });
      }

      const clampedTaps = clampTapCount(input.taps, TAP_FURY_DURATION_MS);
      const tapMul = tapMultiplier(clampedTaps);

      const fighter = await buildFighter(ctx.db, char);
      const roll = rollWorldBossDamage(
        fighter,
        bossNow.tier,
        bossNow.hpCurrent,
        bossNow.hpMax,
        tapMul,
      );
      const newHp = bossNow.hpCurrent - roll.dmg;
      const killed = newHp <= 0;
      const baseEchoes = rollEchoesDrop(bossNow.tier, roll.phaseMatched);
      const echoesAfterTap = applyTapBonusToEchoes(baseEchoes, clampedTaps);
      const echoesDrop = echoesAfterTap + (killed ? killerEchoBonus(bossNow.tier) : 0);

      await ctx.db.transaction(async (tx) => {
        await tx.insert(worldBossHits).values({
          bossId: bossNow.id,
          characterId: char.id,
          dmg: roll.dmg,
          phase: roll.phase,
        });
        if (killed) {
          await tx
            .update(worldBosses)
            .set({
              hpCurrent: 0,
              status: 'killed',
              killedAt: new Date(),
              killingBlowCharId: char.id,
            })
            .where(eq(worldBosses.id, bossNow.id));
        } else {
          await tx
            .update(worldBosses)
            .set({ hpCurrent: newHp })
            .where(eq(worldBosses.id, bossNow.id));
        }
        await tx
          .update(characters)
          .set({
            worldBossHitsToday: hitsTodayBefore + 1,
            lastWorldBossHitDate: today,
            echoes: sql`${characters.echoes} + ${echoesDrop}`,
          })
          .where(eq(characters.id, char.id));
      });

      deleteHitSession(input.sessionId);

      const unlocks: AchievementUnlockPayload[] = [];
      await collectBump(unlocks, ctx.db, char.id, 'world_boss_first_hit');

      let nextBossDto: WorldBoss | null = null;
      let rewardGold = 0;
      let rewardGems = 0;
      let finalRank: number | null = null;
      let isKiller = false;

      if (killed) {
        const tpl = worldBossTemplateForTier(bossNow.tier);
        const distribution = await distributeKillRewards(
          ctx.db,
          bossNow.id,
          bossNow.tier,
          char.id,
        );
        rewardGold = distribution.rewardGold;
        rewardGems = distribution.rewardGems;
        finalRank = distribution.finalRank;
        isKiller = true;

        const nextTier = bossNow.tier + 1;
        const nextTpl = worldBossTemplateForTier(nextTier);
        const nextHp = computeWorldBossHp(nextTpl.baseHp, nextTier);
        try {
          const [next] = await ctx.db
            .insert(worldBosses)
            .values({
              tier: nextTier,
              bossSlug: nextTpl.slug,
              hpMax: nextHp,
              hpCurrent: nextHp,
              status: 'active',
            })
            .returning();
          if (next) nextBossDto = bossRowToDto(next);
        } catch (err) {
          console.warn('[worldBoss] next-tier spawn race', err);
        }

        const contributors = await totalHitterCount(ctx.db, bossNow.id);
        await logWorldBossKilled(
          ctx.db,
          char.id,
          char.name,
          bossNow.id,
          tpl.name,
          bossNow.tier,
          contributors,
        ).catch((err) => console.error('[worldBoss] logWorldBossKilled', err));

        await collectBump(unlocks, ctx.db, char.id, 'world_boss_killblow');
        await collectBump(unlocks, ctx.db, char.id, 'world_boss_killblow_3');
        if (finalRank !== null && finalRank <= 10) {
          await collectBump(unlocks, ctx.db, char.id, 'world_boss_top10');
        }
        await collectBump(unlocks, ctx.db, char.id, 'world_boss_kills_5');

        const otherContribIds = await ctx.db
          .select({ id: worldBossHits.characterId })
          .from(worldBossHits)
          .where(eq(worldBossHits.bossId, bossNow.id))
          .groupBy(worldBossHits.characterId);
        for (const c of otherContribIds) {
          if (c.id === char.id) continue;
          const memberUnlocks: AchievementUnlockPayload[] = [];
          await collectBump(memberUnlocks, ctx.db, c.id, 'world_boss_kills_5').catch(
            () => null,
          );
        }
      }

      return {
        dmg: roll.dmg,
        phaseAtHit: roll.phase,
        phaseMatched: roll.phaseMatched,
        echoesDrop,
        hpRemaining: Math.max(0, newHp),
        killed,
        nextBoss: nextBossDto,
        rewardGold,
        rewardGems,
        finalRank,
        isKiller,
        myHitsToday: hitsTodayBefore + 1,
        myHitsMax: WORLD_BOSS_HITS_PER_DAY,
        unlockedAchievements: unlocks.length > 0 ? unlocks : undefined,
        taps: clampedTaps,
        tapMultiplier: tapMul,
      };
    }),

  /**
   * Shop list — statyczny katalog + moje saldo ech. Echa są lifetime
   * akumulujące, więc saldo zwracamy raw z characters.echoes.
   */
  shopList: protectedProcedure.query(async ({ ctx }): Promise<WorldBossShopListResponse> => {
    const char = await requireChar(ctx.db, ctx.userId);
    return {
      myEchoes: char.echoes,
      offers: WORLD_BOSS_SHOP.map((o) => ({
        slug: o.slug,
        i18nKey: o.i18nKey,
        icon: o.icon,
        cost: o.cost,
        reward: { kind: o.reward.kind, amount: o.reward.amount },
      })),
    };
  }),

  /**
   * Shop buy — atomicznie odejmuje echa i przyznaje reward. Reward kinds:
   *   - gems / gold: prosty UPDATE characters
   *   - scrap: UPDATE characters.scrap
   *   - extra_hit: dekrement worldBossHitsToday o 1 (ale tylko gdy gracz
   *     osiągnął cap; inaczej błąd, bo ma jeszcze darmowe).
   */
  shopBuy: protectedProcedure
    .input(worldBossShopBuyInputSchema)
    .mutation(async ({ ctx, input }): Promise<WorldBossShopBuyResponse> => {
      const offer = findOffer(input.offerSlug);
      if (!offer) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Nieznana oferta.' });
      }
      const char = await requireChar(ctx.db, ctx.userId);
      if (char.echoes < offer.cost) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Brak ech (potrzeba ${offer.cost}, masz ${char.echoes}).`,
        });
      }
      if (offer.reward.kind === 'extra_hit') {
        const today = isoDateUTC();
        const hits = char.lastWorldBossHitDate === today ? char.worldBossHitsToday : 0;
        if (hits < WORLD_BOSS_HITS_PER_DAY) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Masz jeszcze darmowe uderzenia dziś.',
          });
        }
      }

      let echoesAfter = 0;
      await ctx.db.transaction(async (tx) => {
        const updates: Record<string, unknown> = {
          echoes: sql`${characters.echoes} - ${offer.cost}`,
        };
        switch (offer.reward.kind) {
          case 'gems':
            updates.gems = sql`${characters.gems} + ${offer.reward.amount}`;
            break;
          case 'gold':
            updates.gold = sql`${characters.gold} + ${offer.reward.amount}`;
            break;
          case 'scrap':
            updates.scrap = sql`${characters.scrap} + ${offer.reward.amount}`;
            break;
          case 'extra_hit':
            updates.worldBossHitsToday = sql`${characters.worldBossHitsToday} - ${offer.reward.amount}`;
            updates.lastWorldBossHitDate = isoDateUTC();
            break;
        }
        await tx.update(characters).set(updates).where(eq(characters.id, char.id));
        const [refreshed] = await tx
          .select({ echoes: characters.echoes })
          .from(characters)
          .where(eq(characters.id, char.id))
          .limit(1);
        echoesAfter = refreshed?.echoes ?? 0;
      });

      return {
        spent: offer.cost,
        echoesAfter,
        reward: { kind: offer.reward.kind, amount: offer.reward.amount },
      };
    }),

  /**
   * Gem sink — dokup +1 hit poza dziennym limitem. Mirror'uje guildRaids.buyExtraHit.
   * Tylko gdy gracz osiągnął WORLD_BOSS_HITS_PER_DAY.
   */
  buyExtraHit: protectedProcedure.mutation(async ({ ctx }) => {
    const char = await requireChar(ctx.db, ctx.userId);
    const cost = GEM_SINK_COSTS.extraWorldBossHit;
    if (char.gems < cost) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Brak gemów (${cost}).` });
    }
    const today = isoDateUTC();
    const hitsTodayBefore =
      char.lastWorldBossHitDate === today ? char.worldBossHitsToday : 0;
    if (hitsTodayBefore < WORLD_BOSS_HITS_PER_DAY) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Masz jeszcze darmowe uderzenia dziś.',
      });
    }
    await ctx.db
      .update(characters)
      .set({
        gems: sql`${characters.gems} - ${cost}`,
        worldBossHitsToday: hitsTodayBefore - 1,
        lastWorldBossHitDate: today,
      })
      .where(eq(characters.id, char.id));
    return { ok: true, cost };
  }),

  history: protectedProcedure.query(async ({ ctx }): Promise<WorldBossHistoryResponse> => {
    const char = await requireChar(ctx.db, ctx.userId);

    const rows = await ctx.db
      .select({
        id: worldBosses.id,
        tier: worldBosses.tier,
        bossSlug: worldBosses.bossSlug,
        hpMax: worldBosses.hpMax,
        killedAt: worldBosses.killedAt,
        killingBlowCharId: worldBosses.killingBlowCharId,
      })
      .from(worldBosses)
      .where(eq(worldBosses.status, 'killed'))
      .orderBy(desc(worldBosses.tier))
      .limit(20);

    const entries: WorldBossHistoryEntry[] = await Promise.all(
      rows.map(async (r) => {
        const tpl = worldBossTemplateForTier(r.tier);
        // Killer name lookup — N+1 query ale 20 rzędów max, OK.
        let killerName: string | null = null;
        if (r.killingBlowCharId) {
          const [k] = await ctx.db
            .select({ name: characters.name })
            .from(characters)
            .where(eq(characters.id, r.killingBlowCharId))
            .limit(1);
          killerName = k?.name ?? null;
        }
        const standing = await myStanding(ctx.db, r.id, char.id);
        return {
          id: r.id,
          tier: r.tier,
          bossName: tpl.name,
          bossIcon: tpl.icon,
          hpMax: r.hpMax,
          killedAt: r.killedAt ? r.killedAt.getTime() : 0,
          killingBlowCharName: killerName,
          myRank: standing.rank,
          myDmg: standing.totalDmg,
        };
      }),
    );

    return { entries };
  }),
});
