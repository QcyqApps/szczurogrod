// Stage definitions — single source of truth for the survivor game.
// Imported by both client (`render` reads `enemyRoster`, `Hub.tsx` lists
// stages) and server (`startRun` validates `stageId`, `finishRun` validates
// `durationMs >= durationMs`, `payoutMult` feeds okruchy calc).
//
// IMPORTANT: ordering and `id` are load-bearing. `maxStageUnlocked` is an
// integer index into this array (1-based). Adding a stage at the end is safe;
// reordering or deleting middle stages would shift unlocks.

export type EnemyKind =
  | 'rat_walker'
  | 'rat_fast'
  | 'rat_tank'
  | 'rat_ranged'
  | 'sewer_worm'
  | 'lich_szczur'
  | 'rat_king';

export interface StageDef {
  /** 1-based index. Must equal array index + 1. */
  readonly id: number;
  /** Display name in the hub. PL only for now (M4 adds EN). */
  readonly name: string;
  /** Short flavor line shown under the name in the stage selector. */
  readonly flavor: string;
  /** Enemy kinds eligible to spawn during this stage. Boss not included. */
  readonly enemyRoster: readonly EnemyKind[];
  /** Boss spawned after `bossEntryMs`. Killing it = run won. */
  readonly boss: EnemyKind;
  /** Enemies spawned per second (Poisson rate; jitter applied client-side). */
  readonly spawnRate: number;
  /** HP/s drained from the player by the timer (passive damage). */
  readonly drainPerSec: number;
  /** Multiplier applied to the kill payout. Stage 1 = 1.0; later stages > 1. */
  readonly payoutMult: number;
  /** Length of the regular-wave phase before the boss arrives. */
  readonly durationMs: number;
  /** When the boss enters (after the duration ends, with a small grace window). */
  readonly bossEntryMs: number;
  /** Server upper-bound on kills/sec — anti-cheat sanity. */
  readonly maxKillsPerSec: number;
}

// Tuning rationale:
// - Stage 1 jest celowo łagodny — nauka mechanik. Fresh-player z imperfect
//   aim'em (~50-60% trafień) musi przeżyć bez skilli. Stąd spawn 0.5/s
//   (jeden szczur co 2s, gracz strzela co 1.4s — ma czas) i drain 0.7/s.
// - Stage 2 wymaga ~1-2 lvl w core stats (dmg/fire_rate/splash).
// - Stage 3 wymaga ~3-5 lvl. Tu spawn rate przewyższa baseline kill rate,
//   gracz musi ZBUDOWAĆ DPS żeby przeżyć.
// - drainPerSec: 0.7/1.3/1.8 daje passive HP-loss-per-50s = 35/65/90,
//   pozostawiając margines na contact damage proporcjonalny do trudności.
// - maxKillsPerSec to anti-cheat ceiling SPRAWDZANY OD ŚREDNIEJ z całego
//   runu, nie peak. Realistyczna średnia ~1-3 k/s; cap 12/18/24 daje 4-8×
//   margines i nie blokuje uczciwego replay'a.
// - payoutMult: stage 2 nagradza 1.6× więcej, stage 3 = 2.4×. Przy nowych
//   boss HP ~45-100 kills + boss daje: stage 1 ~190, stage 2 ~340, stage 3
//   ~720 okruchy per fresh clear.
export const STAGE_DEFS: readonly StageDef[] = [
  {
    id: 1,
    name: 'Bramy Szczurogrodu',
    flavor: 'Pierwsza fala. Strażnik śpi.',
    enemyRoster: ['rat_walker'],
    boss: 'rat_king',
    spawnRate: 0.5,
    drainPerSec: 0.7,
    payoutMult: 1.0,
    durationMs: 45_000,
    bossEntryMs: 50_000,
    maxKillsPerSec: 12,
  },
  {
    id: 2,
    name: 'Kanały',
    flavor: 'Pachnie tym, czym pachnie.',
    enemyRoster: ['rat_walker', 'rat_fast'],
    boss: 'sewer_worm',
    spawnRate: 1.0,
    drainPerSec: 1.3,
    payoutMult: 1.6,
    durationMs: 45_000,
    bossEntryMs: 50_000,
    maxKillsPerSec: 18,
  },
  {
    id: 3,
    name: 'Podgrodzie',
    flavor: 'Stare ulice, świeże kości.',
    enemyRoster: ['rat_walker', 'rat_fast', 'rat_tank', 'rat_ranged'],
    boss: 'lich_szczur',
    spawnRate: 1.4,
    drainPerSec: 1.8,
    payoutMult: 2.4,
    durationMs: 45_000,
    bossEntryMs: 50_000,
    maxKillsPerSec: 24,
  },
];

export function getStage(id: number): StageDef | null {
  return STAGE_DEFS.find((s) => s.id === id) ?? null;
}

export const STAGE_COUNT = STAGE_DEFS.length;
