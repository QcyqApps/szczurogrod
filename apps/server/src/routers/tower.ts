// Tower router — Wieża Bezdenna (Priorytet 4).
//
// Endpointy:
// - current: snapshot progress + boss stats + failed cooldown.
// - engage: otwiera aktywną walkę z bossem piętra. Zwraca CombatState — od
//   tego momentu klient używa combat.attack/heal/end (session kind='tower'
//   w silniku, patrz game/combat.ts + applyVictoryReward branch).
// - resurrect: gem sink 5g, zeruje failed cooldown.
// - leaderboard: top 10 bestFloorThisWeek z current week.
//
// Weekly reset: `current()` sprawdza week_start — jeśli zmiana → reset
// currentFloor=1, bestFloorThisWeek=0. Stara wartość przepada (no historical archive).

import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { desc, eq } from 'drizzle-orm';
import type {
  CharacterClass,
  CharacterStats,
  CombatState,
  TowerCurrentResponse,
  TowerEngageResponse,
  TowerLeaderboardEntry,
  TowerLeaderboardResponse,
  TowerResurrectResponse,
} from '@grodno/shared';
import { characterCompanions, characters, towerProgress } from '../db/schema.js';
import { loadEquipBonuses } from '../game/arena.js';
import {
  aggregateBuffs,
  effectiveMax,
  loadActiveBuffs,
} from '../game/buffs.js';
import {
  createSession,
  forfeitOrphanedSession,
  type CombatSession,
} from '../game/combat.js';
import { applyGuildWarBuffs, loadGuildWarBuffs } from '../game/guilds.js';
import { applyHpRegen, applyMpRegen } from '../game/regen.js';
import {
  applyScrapbookDamageBuff,
  loadScrapbookBuffs,
} from '../game/scrapbook.js';
import { getCompanion } from '../game/tavern.js';
import { isWorking, WORKING_BLOCKS_COMBAT_MESSAGE } from '../game/work.js';
import {
  TOWER_FAIL_COOLDOWN_MS,
  TOWER_RESURRECT_GEM_COST,
  bossToEnemyTemplate,
  computeBossStats,
  isoWeekStart,
} from '../game/tower.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

/** Minimum HP, żeby wejść w walkę (mirror HP_ENGAGE_MIN z combat routera). */
const HP_ENGAGE_MIN = 20;

async function requireChar(
  db: import('../db/client.js').Db,
  userId: string,
): Promise<typeof characters.$inferSelect> {
  const [char] = await db.select().from(characters).where(eq(characters.userId, userId)).limit(1);
  if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });
  return char;
}

/**
 * Zapewnia wiersz progress + auto-reset weekly. Zwraca current progress.
 */
async function ensureProgress(
  db: import('../db/client.js').Db,
  characterId: string,
): Promise<typeof towerProgress.$inferSelect> {
  const thisWeek = isoWeekStart();
  const [existing] = await db
    .select()
    .from(towerProgress)
    .where(eq(towerProgress.characterId, characterId))
    .limit(1);
  if (!existing) {
    const [created] = await db
      .insert(towerProgress)
      .values({
        characterId,
        currentFloor: 1,
        bestFloorThisWeek: 0,
        weekStart: thisWeek,
      })
      .returning();
    return created!;
  }
  if (existing.weekStart !== thisWeek) {
    // Weekly reset.
    await db
      .update(towerProgress)
      .set({
        currentFloor: 1,
        bestFloorThisWeek: 0,
        weekStart: thisWeek,
        failedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(towerProgress.characterId, characterId));
    return {
      ...existing,
      currentFloor: 1,
      bestFloorThisWeek: 0,
      weekStart: thisWeek,
      failedAt: null,
    };
  }
  return existing;
}

/** Next monday 00:00 UTC relative to now, w ms. */
function nextResetAtMs(): number {
  const now = new Date();
  const utc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const dayOfWeek = utc.getUTCDay();
  const daysForward = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  utc.setUTCDate(utc.getUTCDate() + daysForward);
  return utc.getTime();
}

export const towerRouter = router({
  current: protectedProcedure.query(async ({ ctx }): Promise<TowerCurrentResponse> => {
    const char = await requireChar(ctx.db, ctx.userId);
    const progress = await ensureProgress(ctx.db, char.id);
    const boss = computeBossStats(progress.currentFloor);
    const failedUntil = progress.failedAt
      ? progress.failedAt.getTime() + TOWER_FAIL_COOLDOWN_MS
      : null;
    return {
      currentFloor: progress.currentFloor,
      bestFloorThisWeek: progress.bestFloorThisWeek,
      weekStart: progress.weekStart,
      nextResetAt: nextResetAtMs(),
      boss,
      failedUntil: failedUntil && failedUntil > Date.now() ? failedUntil : null,
      gemResurrectCost: TOWER_RESURRECT_GEM_COST,
    };
  }),

  /**
   * Otwiera aktywną walkę na bieżącym piętrze. Tworzy CombatSession
   * z kind='tower' — dalej turn-by-turn klient używa combat.attack/heal/end.
   * Branch w applyVictoryReward/defeat w routers/combat.ts decyduje co się
   * dzieje przy zakończeniu walki (floor++/gold/gems vs failedAt).
   */
  engage: protectedProcedure.mutation(async ({ ctx }): Promise<TowerEngageResponse> => {
    const char = await requireChar(ctx.db, ctx.userId);
    if (isWorking(char)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: WORKING_BLOCKS_COMBAT_MESSAGE });
    }
    // Auto-forfeit poprzedniej sesji (po refreshu / wyjściu z apki). Persistuje
    // mid-fight HP/MP — nowa walka zaczyna się ze stanem postaci jaki był na
    // klipie ostatniej tury. Mirror flow w `combat.engage`.
    await forfeitOrphanedSession(ctx.db, char.id);
    const progress = await ensureProgress(ctx.db, char.id);
    const now = new Date();

    // Cooldown check — blokada po ostatniej porażce.
    if (progress.failedAt) {
      const ready = progress.failedAt.getTime() + TOWER_FAIL_COOLDOWN_MS;
      if (ready > now.getTime()) {
        const secsLeft = Math.ceil((ready - now.getTime()) / 1000);
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Jeszcze ${secsLeft}s cooldownu. Albo użyj gemów.`,
        });
      }
    }

    // Regen HP/MP przed walką, jak w combat.engage — gracz który odpoczął
    // w mieście widzi świeże HP/MP. Tower nie zużywa kluczy do lochów.
    const hpRegen = applyHpRegen(char.hp, char.hpMax, char.lastHpTickAt, now);
    const mpRegen = applyMpRegen(char.mp, char.mpMax, char.lastMpTickAt, now);
    char.hp = hpRegen.value;
    char.mp = mpRegen.value;

    if (char.hp < HP_ENGAGE_MIN) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Za mało HP, aby ruszyć w bój (min. ${HP_ENGAGE_MIN}).`,
      });
    }

    await ctx.db
      .update(characters)
      .set({
        hp: hpRegen.value,
        lastHpTickAt: hpRegen.lastTickAt,
        mp: mpRegen.value,
        lastMpTickAt: mpRegen.lastTickAt,
      })
      .where(eq(characters.id, char.id));

    // Ekwipunek + companion buffy + guild/scrapbook buffy.
    const equip = await loadEquipBonuses(ctx.db, char.id);
    const [companionRow] = await ctx.db
      .select({ slug: characterCompanions.companionSlug })
      .from(characterCompanions)
      .where(eq(characterCompanions.characterId, char.id))
      .limit(1);
    const buff = companionRow ? getCompanion(companionRow.slug)?.buff ?? null : null;
    const stats = char.stats as CharacterStats;

    // Guild/scrapbook buffy — gracz dostaje ten sam boost, który ma
    // w dungeon combat (dmg bump + gold bonus; gold odnosi się tylko do
    // rewarda w tower.attack, ale spójność statów warto zachować).
    const guildBuffs = await loadGuildWarBuffs(ctx.db, char.id);
    const scrapbookBuffs = await loadScrapbookBuffs(ctx.db, char.id);
    // Timed elixir buffy — spójne z dungeon combat.
    const elixirBuffs = await loadActiveBuffs(ctx.db, char.id, now);
    const eb = aggregateBuffs(elixirBuffs);
    const hpMaxEff = effectiveMax(char.hpMax, eb.hpMaxPct);
    const mpMaxEff = effectiveMax(char.mpMax, eb.mpMaxPct);
    const buffed = applyScrapbookDamageBuff(
      applyGuildWarBuffs(
        {
          atk: stats.atk + equip.atk + (buff?.atkBonus ?? 0) + eb.atkFlat,
          def: stats.def + equip.def + eb.defFlat,
          mag: stats.mag + equip.mag + (buff?.magBonus ?? 0) + eb.magFlat,
          spd: stats.spd + eb.spdFlat,
          hpMax: hpMaxEff,
          cls: char.cls as CharacterClass,
          name: char.name,
          lvl: char.lvl,
        },
        guildBuffs,
      ),
      scrapbookBuffs,
    );

    const boss = computeBossStats(progress.currentFloor);
    const enemy = bossToEnemyTemplate(boss);

    const session: CombatSession = {
      combatId: randomUUID(),
      userId: ctx.userId,
      characterId: char.id,
      kind: 'tower',
      towerFloor: boss.floor,
      enemy,
      enemyHp: enemy.hp,
      playerHp: Math.min(char.hp, hpMaxEff),
      playerHpMax: hpMaxEff,
      playerMp: Math.min(char.mp, mpMaxEff),
      playerMpMax: mpMaxEff,
      playerAtk: buffed.atk,
      playerDef: buffed.def,
      playerMag: buffed.mag,
      playerSpd: buffed.spd,
      playerCls: char.cls as CharacterClass,
      playerHealBonus: buff?.healBonus ?? 0,
      heavyCooldown: 0,
      magicCooldown: 0,
      trackBonus: false,
      playerStatus: [],
      playerBuffs: [],
      status: 'fight',
      rewardApplied: false,
      createdAt: Date.now(),
    };
    createSession(session);

    const state: CombatState = {
      combatId: session.combatId,
      enemySlug: enemy.slug,
      enemyName: enemy.name,
      enemyLvl: enemy.lvl,
      enemyHp: session.enemyHp,
      enemyHpMax: enemy.hp,
      enemyGold: 0,
      enemyXp: 0,
      enemyDef: enemy.def,
      playerHp: session.playerHp,
      playerHpMax: session.playerHpMax,
      playerMp: session.playerMp,
      playerMpMax: session.playerMpMax,
      playerAtk: session.playerAtk,
      playerMag: session.playerMag,
      playerSpd: session.playerSpd,
      playerDef: session.playerDef,
      playerCls: session.playerCls,
      heavyCooldown: session.heavyCooldown,
      magicCooldown: session.magicCooldown,
      trackBonus: false,
      playerStatus: [],
      playerBuffs: [],
      status: 'fight',
    };
    return state;
  }),

  resurrect: protectedProcedure.mutation(async ({ ctx }): Promise<TowerResurrectResponse> => {
    const char = await requireChar(ctx.db, ctx.userId);
    const progress = await ensureProgress(ctx.db, char.id);
    if (!progress.failedAt) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nie ma potrzeby wskrzeszać.' });
    }
    const cost = TOWER_RESURRECT_GEM_COST;
    if (char.gems < cost) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Brak gemów (${cost}).` });
    }
    const now = new Date();
    await ctx.db.transaction(async (tx) => {
      await tx
        .update(characters)
        .set({ gems: char.gems - cost, updatedAt: now })
        .where(eq(characters.id, char.id));
      await tx
        .update(towerProgress)
        .set({ failedAt: null, updatedAt: now })
        .where(eq(towerProgress.characterId, char.id));
    });
    return { ok: true, cost };
  }),

  leaderboard: protectedProcedure.query(
    async ({ ctx }): Promise<TowerLeaderboardResponse> => {
      const thisWeek = isoWeekStart();
      const rows = await ctx.db
        .select({
          characterId: towerProgress.characterId,
          bestFloor: towerProgress.bestFloorThisWeek,
          name: characters.name,
          cls: characters.cls,
          lvl: characters.lvl,
        })
        .from(towerProgress)
        .innerJoin(characters, eq(characters.id, towerProgress.characterId))
        .where(eq(towerProgress.weekStart, thisWeek))
        .orderBy(desc(towerProgress.bestFloorThisWeek))
        .limit(10);
      const entries: TowerLeaderboardEntry[] = rows
        .filter((r) => r.bestFloor > 0)
        .map((r) => ({
          characterId: r.characterId,
          name: r.name,
          cls: r.cls as CharacterClass,
          lvl: r.lvl,
          bestFloor: r.bestFloor,
        }));
      return {
        weekStart: thisWeek,
        nextResetAt: nextResetAtMs(),
        entries,
      };
    },
  ),
});
