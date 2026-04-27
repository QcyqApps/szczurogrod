// Wieża Bezdenna — Priorytet 4 z docs/features-vs-sf.md.
//
// Endless dungeon z per-floor scaled bossami. Używamy existing enemy
// templates (REGISTRY.enemies) jako "flavor" na poszczególnych piętrach —
// rotation po tier, stats scaled by floor^1.05.
//
// Reset tygodniowy UTC (poniedziałek). `isoWeekStart()` zwraca ISO date
// najbliższego poprzedniego poniedziałku w UTC.

import type { CharacterClass, IconName } from '@grodno/shared';
import type { EnemyTemplate } from '../content/registry.js';

export const TOWER_FAIL_COOLDOWN_MS = 10 * 60 * 1000; // 10 min (post-audyt 2026-04: 15 → 10 dla lepszego retry tempa)
export const TOWER_RESURRECT_GEM_COST = 5;
export const TOWER_MAX_LEVEL_CAP = 999;

/** Mnożnik stat per floor — każdy +5% HP i ATK od bazy. */
export function computeBossScaleMultiplier(floor: number): number {
  return Math.pow(1.05, Math.max(0, floor - 1));
}

/** Boss stats dla danego floor'a i klasy gracza (dla counter-selection). */
export interface TowerBossStats {
  name: string;
  icon: IconName;
  /** Slug receptury z `apps/web/src/components/monsters/recipes.ts`. */
  monsterSlug: string;
  atk: number;
  def: number;
  mag: number;
  spd: number;
  hpMax: number;
  cls: CharacterClass;
  floor: number;
}

/**
 * Generuje bossa dla floor'a. Tier (w pool 5 namei + avatars) rotuje po floor.
 * Base stats cechują mobka z tier 1 enemy template, przeskalowane × floor^1.05.
 *
 * Floor 1 = baseline (atk 18, hp 180).
 * Floor 10 ≈ baseline × 1.55 (atk 28, hp 280).
 * Floor 50 ≈ baseline × 11.5 (atk 207, hp 2070).
 * Floor 100 ≈ baseline × 131 (atk 2358, hp 23580).
 */
export function computeBossStats(floor: number): TowerBossStats {
  const mult = computeBossScaleMultiplier(floor);
  // Base (tier 1 enemy approximation):
  const baseAtk = 18;
  const baseDef = 8;
  const baseMag = 4;
  const baseHp = 180;

  // 6 bossów w rotacji: warrior-themed → caster-themed → rogue-themed.
  // `monsterSlug` mapuje na istniejącą recepturę w recipes.ts — Monster
  // komponent rysuje hand-drawn sprite (spójnie z lochami). `icon` trzymamy
  // jako fallback dla starszych klientów (pre-monsterSlug patch).
  const POOL: ReadonlyArray<{
    name: string;
    icon: IconName;
    monsterSlug: string;
    cls: CharacterClass;
  }> = [
    { name: 'Strażnik Piętra', icon: 'skull-mage', monsterSlug: 'skeleton-captain', cls: 'warrior' },
    { name: 'Cień Kronikarza', icon: 'skull-lich', monsterSlug: 'lich-acolyte', cls: 'mage' },
    { name: 'Rzezimieszek', icon: 'dagger-dragon', monsterSlug: 'forest-bandit', cls: 'rogue' },
    { name: 'Herald Wieży', icon: 'crown-undead', monsterSlug: 'kosciej-elder', cls: 'warrior' },
    { name: 'Szept z Kurzu', icon: 'blade-wraith', monsterSlug: 'mist-wraith', cls: 'mage' },
    { name: 'Wędrowiec Mroku', icon: 'cloak-shadow-deep', monsterSlug: 'shadow-beast', cls: 'rogue' },
  ];
  const pick = POOL[(floor - 1) % POOL.length]!;

  return {
    name: pick.name,
    icon: pick.icon,
    monsterSlug: pick.monsterSlug,
    cls: pick.cls,
    atk: Math.round(baseAtk * mult),
    def: Math.round(baseDef * mult),
    mag: Math.round(baseMag * mult),
    spd: 10,
    hpMax: Math.round(baseHp * mult),
    floor,
  };
}

/**
 * Pakuje boss stats w syntetyczny EnemyTemplate — pozwala reużyć pełną maszynę
 * walki z game/combat.ts (rollPlayerAttack, rollEnemyAttack, CombatSession).
 * Slug `tower-floor-N` jest deterministyczny i nie koliduje z real mobkami,
 * których slugi są lowercase-kebab bez prefiksu `tower-`. Fields typu
 * `cooldownSec`/`dailyLimit`/`tier` są wymagane przez interface ale nieużywane
 * w torowych ścieżkach — engage leci przez tower.engage, nie combat.engage, więc
 * gating po cooldown/limit nigdy nie zadziała.
 */
export function bossToEnemyTemplate(boss: TowerBossStats): EnemyTemplate {
  return {
    slug: `tower-floor-${boss.floor}`,
    name: boss.name,
    lvl: boss.floor,
    hp: boss.hpMax,
    atk: boss.atk,
    def: boss.def,
    gold: 0,
    xp: 0,
    requiredLvl: 1,
    tier: 1,
    cooldownSec: 0,
    dailyLimit: 999,
    abilities: [],
  };
}

/**
 * Reward per floor. Co 10 floorów — większa nagroda (milestone). Między
 * milestones małe gold reward za każdy ukończony floor.
 */
export function computeFloorReward(floor: number): {
  gold: number;
  gems: number;
  isMilestone: boolean;
} {
  const isMilestone = floor % 10 === 0;
  if (!isMilestone) {
    // Drobny per-floor reward — stacking throughout week. Iteracje audytów:
    //   v1: 50+10×floor (floor 99 = 990g, demotywujące)
    //   v2: 100+15×floor (floor 99 = 1585g)
    //   v3 (2026-04): 150+25×floor — tower ROI nadrabia do dungeon farmu;
    //     floor 50 = 1400g, floor 99 = 2625g. W połączeniu z 10min cooldown
    //     tower bije ~konkurencyjnie z dungeonem 4-6kg/h.
    return { gold: 150 + floor * 25, gems: 0, isMilestone: false };
  }
  // Milestone: rosnące nagrody co 10 floorów.
  const tier = floor / 10; // 1, 2, 3, ...
  return {
    gold: 500 * tier * tier, // 500, 2000, 4500, 8000, ...
    gems: 3 + tier, // 4, 5, 6, 7, ...
    isMilestone: true,
  };
}

/**
 * ISO date najbliższego poprzedniego poniedziałku w UTC (format "yyyy-mm-dd").
 * Używane jako `week_start` w DB — zmiana = weekly reset trigger.
 */
export function isoWeekStart(d: Date = new Date()): string {
  // UTC day: 0=Sun, 1=Mon, ..., 6=Sat. Cofamy do poniedziałku.
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayOfWeek = utc.getUTCDay(); // 0..6
  const daysBackToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  utc.setUTCDate(utc.getUTCDate() - daysBackToMonday);
  return utc.toISOString().slice(0, 10);
}
