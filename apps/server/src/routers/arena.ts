// Arena router — produkcyjny.
//
// arena.list         — stats + rivals + leaderboard (single round-trip
//                       dla ScreenArena).
// arena.rivalDetails — statystyki konkretnego rivala (pre-fight preview);
//                       loadowane ondemand żeby lista była lekka.
// arena.history      — ostatnie 10 walk gracza (attacker lub defender).
// arena.fight        — symuluje walkę, persystuje match, update'uje Elo
//                       attacker'a ORAZ defender'a (jeśli real player),
//                       bump'uje streak, chroniczy win/streak, achievementy.

import { TRPCError } from '@trpc/server';
import { eq, sql } from 'drizzle-orm';
import type {
  AchievementUnlockPayload,
  ArenaFightResult,
  ArenaHistoryResponse,
  ArenaListResponse,
  ArenaRivalDetails,
  CharacterClass,
  CharacterStats,
} from '@grodno/shared';
import {
  GEM_SINK_COSTS,
  arenaFightInputSchema,
  arenaRivalDetailsInputSchema,
} from '@grodno/shared';
import { arenaMatches, characterCompanions, characters } from '../db/schema.js';
import {
  ARENA_FIGHTS_PER_DAY,
  computeEloDelta,
  computeGoldReward,
  computeMyRank,
  computePower,
  listArenaHistory,
  listArenaRivals,
  listLeaderboard,
  loadEquipBonuses,
  resolveFightsToday,
  simulateDuel,
  synthesizeNpc,
  type CombatFighter,
} from '../game/arena.js';
import {
  collectBump,
  collectSetMax,
} from '../game/achievements.js';
import {
  aggregateBuffs,
  effectiveMax,
  loadActiveBuffs,
} from '../game/buffs.js';
import { logArenaStreak, logArenaVictory } from '../game/chronicle.js';
import { isoDateUTC } from '../game/daily.js';
import { applyGuildWarBuffs, loadGuildWarBuffs } from '../game/guilds.js';
import {
  applyScrapbookDamageBuff,
  applyScrapbookGoldBonus,
  loadScrapbookBuffs,
} from '../game/scrapbook.js';
import { getCompanion } from '../game/tavern.js';
import { isWorking, WORKING_BLOCKS_COMBAT_MESSAGE } from '../game/work.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

async function loadSelfFighter(
  db: import('../db/client.js').Db,
  userId: string,
): Promise<{
  char: typeof characters.$inferSelect;
  fighter: CombatFighter;
}> {
  const [char] = await db
    .select()
    .from(characters)
    .where(eq(characters.userId, userId))
    .limit(1);
  if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'No character' });
  const bonuses = await loadEquipBonuses(db, char.id);
  // Companion + timed elixir/blessing buffy — gracz pijący eliksir czuje
  // efekt też w PvP (wcześniej arena przepuszczała mimo buff'a w DB).
  const [companionRow] = await db
    .select({ slug: characterCompanions.companionSlug })
    .from(characterCompanions)
    .where(eq(characterCompanions.characterId, char.id))
    .limit(1);
  const compBuff = companionRow ? getCompanion(companionRow.slug)?.buff ?? null : null;
  const elixirBuffs = await loadActiveBuffs(db, char.id, new Date());
  const eb = aggregateBuffs(elixirBuffs);
  const s = char.stats as CharacterStats;
  const fighter: CombatFighter = {
    atk: s.atk + bonuses.atk + (compBuff?.atkBonus ?? 0) + eb.atkFlat,
    def: s.def + bonuses.def + eb.defFlat,
    mag: s.mag + bonuses.mag + (compBuff?.magBonus ?? 0) + eb.magFlat,
    spd: s.spd + eb.spdFlat,
    hpMax: effectiveMax(char.hpMax, eb.hpMaxPct),
    cls: char.cls as CharacterClass,
    name: char.name,
    lvl: char.lvl,
  };
  return { char, fighter };
}

export const arenaRouter = router({
  list: protectedProcedure.query(async ({ ctx }): Promise<ArenaListResponse> => {
    const [char] = await ctx.db
      .select({
        id: characters.id,
        userId: characters.userId,
        lvl: characters.lvl,
        arenaPoints: characters.arenaPoints,
        arenaWins: characters.arenaWins,
        arenaLosses: characters.arenaLosses,
        arenaFightsToday: characters.arenaFightsToday,
        arenaLastFightDate: characters.arenaLastFightDate,
      })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'No character' });

    const fightsToday = resolveFightsToday(char);
    const rivals = await listArenaRivals(ctx.db, char.id, char.userId, char.lvl);
    const leaderboard = await listLeaderboard(ctx.db, 10);
    const rank = await computeMyRank(ctx.db, char.id);

    return {
      stats: {
        arenaPoints: char.arenaPoints,
        arenaWins: char.arenaWins,
        arenaLosses: char.arenaLosses,
        fightsToday,
        fightsMax: ARENA_FIGHTS_PER_DAY,
        rank,
      },
      rivals,
      leaderboard,
    };
  }),

  rivalDetails: protectedProcedure
    .input(arenaRivalDetailsInputSchema)
    .query(async ({ ctx, input }): Promise<ArenaRivalDetails> => {
      const [self] = await ctx.db
        .select({ lvl: characters.lvl, userId: characters.userId })
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);
      if (!self) throw new TRPCError({ code: 'NOT_FOUND', message: 'No character' });

      if (input.rivalId.startsWith('npc:')) {
        const parts = input.rivalId.split(':');
        const lvl = Number.parseInt(parts[1] ?? '', 10);
        const idx = Number.parseInt(parts[2] ?? '', 10);
        if (!Number.isFinite(lvl) || !Number.isFinite(idx)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Bad NPC slug' });
        }
        const npc = synthesizeNpc(lvl, idx);
        return {
          rival: npc.rival,
          atk: npc.fighter.atk,
          def: npc.fighter.def,
          mag: npc.fighter.mag,
          spd: npc.fighter.spd,
          hpMax: npc.fighter.hpMax,
        };
      }

      const [r] = await ctx.db
        .select()
        .from(characters)
        .where(eq(characters.id, input.rivalId))
        .limit(1);
      if (!r) throw new TRPCError({ code: 'NOT_FOUND', message: 'Rival not found' });
      if (r.userId === self.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'To ty.' });
      }
      const bonuses = await loadEquipBonuses(ctx.db, r.id);
      const rs = r.stats as CharacterStats;
      const atk = rs.atk + bonuses.atk;
      const def = rs.def + bonuses.def;
      const mag = rs.mag + bonuses.mag;
      const spd = rs.spd;
      return {
        rival: {
          id: r.id,
          kind: 'player',
          name: r.name,
          cls: r.cls as CharacterClass,
          lvl: r.lvl,
          power: computePower(atk, def, mag, spd, r.lvl),
          arenaPoints: r.arenaPoints,
        },
        atk,
        def,
        mag,
        spd,
        hpMax: r.hpMax,
      };
    }),

  history: protectedProcedure.query(async ({ ctx }): Promise<ArenaHistoryResponse> => {
    const [char] = await ctx.db
      .select({ id: characters.id })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'No character' });
    const matches = await listArenaHistory(ctx.db, char.id, 10);
    return { matches };
  }),

  fight: protectedProcedure
    .input(arenaFightInputSchema)
    .mutation(async ({ ctx, input }): Promise<ArenaFightResult> => {
      const { char, fighter: youFighter } = await loadSelfFighter(ctx.db, ctx.userId);
      if (isWorking(char)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: WORKING_BLOCKS_COMBAT_MESSAGE });
      }
      const today = isoDateUTC();
      const fightsToday = resolveFightsToday(char);
      if (fightsToday >= ARENA_FIGHTS_PER_DAY) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Dziś już wystarczy. Wróć jutro — limit ${ARENA_FIGHTS_PER_DAY} walk dziennie.`,
        });
      }

      // Resolve rival — real player uuid lub NPC synth slug.
      let rivalFighter: CombatFighter;
      let rivalKind: 'player' | 'npc';
      let rivalName: string;
      let rivalCls: CharacterClass;
      let rivalLvl: number;
      let rivalArenaPoints: number;
      let rivalDbId: string | null = null;
      let rivalSlug: string;

      if (input.rivalId.startsWith('npc:')) {
        const parts = input.rivalId.split(':');
        const lvl = Number.parseInt(parts[1] ?? '', 10);
        const idx = Number.parseInt(parts[2] ?? '', 10);
        if (!Number.isFinite(lvl) || !Number.isFinite(idx)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Bad NPC slug' });
        }
        if (Math.abs(lvl - char.lvl) > 3) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Poza twoją ligą.' });
        }
        const npc = synthesizeNpc(lvl, idx);
        rivalFighter = npc.fighter;
        rivalKind = 'npc';
        rivalName = npc.rival.name;
        rivalCls = npc.rival.cls;
        rivalLvl = npc.rival.lvl;
        rivalArenaPoints = npc.rival.arenaPoints;
        rivalSlug = input.rivalId;
      } else {
        const [r] = await ctx.db
          .select()
          .from(characters)
          .where(eq(characters.id, input.rivalId))
          .limit(1);
        if (!r) throw new TRPCError({ code: 'NOT_FOUND', message: 'Rival not found' });
        if (r.userId === char.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Nie walczysz sam ze sobą.',
          });
        }
        if (Math.abs(r.lvl - char.lvl) > 3) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Poza twoją ligą.' });
        }
        const bonuses = await loadEquipBonuses(ctx.db, r.id);
        const rs = r.stats as CharacterStats;
        rivalFighter = {
          atk: rs.atk + bonuses.atk,
          def: rs.def + bonuses.def,
          mag: rs.mag + bonuses.mag,
          spd: rs.spd,
          hpMax: r.hpMax,
          cls: r.cls as CharacterClass,
          name: r.name,
          lvl: r.lvl,
        };
        rivalKind = 'player';
        rivalName = r.name;
        rivalCls = r.cls as CharacterClass;
        rivalLvl = r.lvl;
        rivalArenaPoints = r.arenaPoints;
        rivalDbId = r.id;
        rivalSlug = r.id;
      }

      // Guild war buffy (Phase 2) — altar daje %-bonusy do atk/mag/def dla
      // arena/wojen/rajdów. NPC-boty nie mają gildii. Jeśli rivalDbId = null
      // (NPC) — pomijamy. Jeśli gildia nie ma altar'a — ZERO_BUFFS no-op.
      const youGuildBuffs = await loadGuildWarBuffs(ctx.db, char.id);
      const youScrapbookBuffs = await loadScrapbookBuffs(ctx.db, char.id);
      let youFighterBuffed = applyGuildWarBuffs(youFighter, youGuildBuffs);
      youFighterBuffed = applyScrapbookDamageBuff(youFighterBuffed, youScrapbookBuffs);
      let rivalFighterBuffed = rivalFighter;
      if (rivalDbId !== null) {
        rivalFighterBuffed = applyGuildWarBuffs(
          rivalFighter,
          await loadGuildWarBuffs(ctx.db, rivalDbId),
        );
        rivalFighterBuffed = applyScrapbookDamageBuff(
          rivalFighterBuffed,
          await loadScrapbookBuffs(ctx.db, rivalDbId),
        );
      }

      const { youWon, log } = simulateDuel(youFighterBuffed, rivalFighterBuffed);
      const pointsDelta = computeEloDelta(
        char.arenaPoints,
        rivalArenaPoints,
        youWon ? 1 : 0,
      );
      const newPoints = Math.max(0, char.arenaPoints + pointsDelta);
      const goldReward = applyScrapbookGoldBonus(
        computeGoldReward(char.lvl, youWon),
        youScrapbookBuffs,
      );
      // Streak: bump na win, reset na loss.
      const newStreak = youWon ? char.arenaCurrentStreak + 1 : 0;
      const rivalPower = computePower(
        rivalFighter.atk,
        rivalFighter.def,
        rivalFighter.mag,
        rivalFighter.spd,
        rivalFighter.lvl,
      );

      await ctx.db
        .update(characters)
        .set({
          arenaPoints: newPoints,
          arenaWins: sql`${characters.arenaWins} + ${youWon ? 1 : 0}`,
          arenaLosses: sql`${characters.arenaLosses} + ${youWon ? 0 : 1}`,
          arenaFightsToday: fightsToday + 1,
          arenaLastFightDate: today,
          arenaCurrentStreak: newStreak,
          gold: sql`${characters.gold} + ${goldReward}`,
          updatedAt: new Date(),
        })
        .where(eq(characters.id, char.id));

      // Symmetric Elo: real defender traci/zyskuje przeciwną wartość
      // (-pointsDelta). NIE zerujemy mu streak'a bo to nie jego walka —
      // tylko attacker buduje passę. Wins/losses z perspektywy defender'a
      // NIE dopisujemy — jego ranking idzie bez liczenia do własnych
      // achievementów (inaczej unlocki by się rozsypywały). MVP: tylko
      // arena_points update defender.
      if (rivalDbId) {
        const defenderDelta = -pointsDelta;
        await ctx.db
          .update(characters)
          .set({
            arenaPoints: sql`GREATEST(0, ${characters.arenaPoints} + ${defenderDelta})`,
            updatedAt: new Date(),
          })
          .where(eq(characters.id, rivalDbId));
      }

      // Persist match row.
      const [inserted] = await ctx.db
        .insert(arenaMatches)
        .values({
          attackerId: char.id,
          defenderId: rivalDbId,
          defenderKind: rivalKind,
          defenderSlug: rivalSlug,
          attackerName: char.name,
          attackerCls: char.cls,
          attackerLvl: char.lvl,
          defenderName: rivalName,
          defenderCls: rivalCls,
          defenderLvl: rivalLvl,
          defenderPower: rivalPower,
          wonByAttacker: youWon,
          pointsDelta,
          goldReward,
        })
        .returning({ id: arenaMatches.id });

      // Chronicle — tylko wins vs real players i ≥3-win streak'i (żeby
      // feed nie był zaspamowany NPC-farmą).
      if (youWon && rivalKind === 'player' && inserted) {
        logArenaVictory(
          ctx.db,
          char.id,
          char.name,
          rivalName,
          pointsDelta,
          inserted.id,
        ).catch((e) => console.error('[chronicle] logArenaVictory failed', e));
      }
      if (youWon && newStreak >= 3) {
        logArenaStreak(ctx.db, char.id, char.name, newStreak).catch((e) =>
          console.error('[chronicle] logArenaStreak failed', e),
        );
      }

      // Achievementy.
      const unlocks: AchievementUnlockPayload[] = [];
      if (youWon) {
        await collectBump(unlocks, ctx.db, char.id, 'arena_first_win');
        await collectBump(unlocks, ctx.db, char.id, 'arena_wins_10');
        await collectBump(unlocks, ctx.db, char.id, 'arena_wins_50');
        await collectBump(unlocks, ctx.db, char.id, 'arena_wins_200');
        await collectSetMax(unlocks, ctx.db, char.id, 'arena_streak_5', newStreak);
        await collectSetMax(unlocks, ctx.db, char.id, 'arena_streak_10', newStreak);
      }
      // Rank milestone — sprawdzamy PO update'cie arena_points.
      const newRank = await computeMyRank(ctx.db, char.id);
      if (newRank !== null && newRank <= 100) {
        await collectSetMax(unlocks, ctx.db, char.id, 'arena_top_100', 1);
      }

      return {
        won: youWon,
        pointsDelta,
        goldReward,
        rival: {
          id: input.rivalId,
          kind: rivalKind,
          name: rivalName,
          cls: rivalCls,
          lvl: rivalLvl,
          power: rivalPower,
          arenaPoints: rivalArenaPoints,
        },
        log,
        newArenaPoints: newPoints,
        fightsToday: fightsToday + 1,
        currentStreak: newStreak,
        unlockedAchievements: unlocks,
      };
    }),

  /**
   * Gem sink: dokup extra walkę arena poza dziennym limitem. Działa przez
   * dekrementację `arena_fights_today` o 1 (gate pozwala gdy < cap).
   * Allowed tylko gdy gracz osiągnął cap (inaczej nie ma sensu kupować).
   */
  buyExtraFight: protectedProcedure.mutation(async ({ ctx }) => {
    const [char] = await ctx.db
      .select()
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });
    const cost = GEM_SINK_COSTS.extraArenaFight;
    if (char.gems < cost) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Brak gemów (${cost}).` });
    }
    const today = isoDateUTC();
    const fightsToday = resolveFightsToday(char);
    if (fightsToday < ARENA_FIGHTS_PER_DAY) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Masz jeszcze darmowe walki dziś.',
      });
    }
    await ctx.db
      .update(characters)
      .set({
        gems: sql`${characters.gems} - ${cost}`,
        arenaFightsToday: Math.max(0, fightsToday - 1),
        arenaLastFightDate: today,
      })
      .where(eq(characters.id, char.id));
    return { ok: true, cost };
  }),
});
