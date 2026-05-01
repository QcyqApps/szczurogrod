// Server-side payout + validation for survivor runs. Pure functions; the
// router calls these and persists the result. Anti-cheat is "trust but bound"
// — we don't replay every shot, but we validate aggregates against bounds
// (`durationMs >= 45_000` for boss kills, `kills <= maxKillsPerSec * seconds`,
// elapsed wall-clock matches reported duration within ±30s slack).

import type { StageDef } from '@grodno/shared/survivor';

export interface ValidateRunArgs {
  readonly stage: StageDef;
  readonly startedAtMs: number;
  readonly nowMs: number;
  readonly reportedDurationMs: number;
  readonly reportedKills: number;
  readonly reportedBossKilled: boolean;
}

export type ValidateResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };

/** Lower bound: report must arrive close to wall-clock elapsed since start.
 * Upper bound: 30s slack for slow networks / app suspend. */
const ELAPSED_SLACK_LOW_MS = 3_000;
const ELAPSED_SLACK_HIGH_MS = 30_000;

export function validateRunReport(args: ValidateRunArgs): ValidateResult {
  const elapsed = args.nowMs - args.startedAtMs;
  if (elapsed < args.reportedDurationMs - ELAPSED_SLACK_LOW_MS) {
    return { ok: false, reason: 'REPORTED_DURATION_EXCEEDS_ELAPSED' };
  }
  if (elapsed > args.reportedDurationMs + ELAPSED_SLACK_HIGH_MS) {
    return { ok: false, reason: 'REPORT_ARRIVED_TOO_LATE' };
  }
  if (args.reportedBossKilled && args.reportedDurationMs < args.stage.durationMs) {
    return { ok: false, reason: 'BOSS_KILL_BEFORE_BOSS_ENTRY' };
  }
  const seconds = Math.max(1, args.reportedDurationMs / 1000);
  if (args.reportedKills > seconds * args.stage.maxKillsPerSec) {
    return { ok: false, reason: 'KILL_RATE_EXCEEDS_BOUND' };
  }
  if (args.reportedKills < 0 || args.reportedDurationMs < 0) {
    return { ok: false, reason: 'NEGATIVE_REPORT' };
  }
  return { ok: true };
}

export interface PayoutArgs {
  readonly stage: StageDef;
  readonly kills: number;
  readonly bossKilled: boolean;
  /** True if the user has already cleared this stage (won prior run with bossKilled). */
  readonly stageAlreadyCleared: boolean;
}

const REPLAY_PENALTY = 0.5;
const PER_KILL_OKRUCHY = 2;
const BOSS_KILL_OKRUCHY = 100;

/** Expected payouts po balance pass'ie (base dmg 22, CD 1400ms):
 *   Stage 1 fresh + boss: ~45 kills * 2 + 100 = 190 okruchy (1.0 mult).
 *   Stage 1 replay: 95.
 *   Stage 2 fresh + boss: ~70 kills * 2 + 100 = 240 * 1.6 = 384.
 *   Stage 3 fresh + boss: ~100 kills * 2 + 100 = 300 * 2.4 = 720.
 * Pierwszy clear stage 1 daje gracza dość żeby kupić: hp_max lvl 1 (5) +
 * dmg lvl 1 (8) + fire_rate lvl 1 (10) + splash lvl 1 (20) = 43 — i jeszcze
 * zostaje na proj_speed lvl 1 (10) lub lifesteal lvl 1 (12). Druga próba
 * jest już wyraźnie potężniejsza. */
export function computeOkruchyPayout(args: PayoutArgs): number {
  const base = args.kills * PER_KILL_OKRUCHY + (args.bossKilled ? BOSS_KILL_OKRUCHY : 0);
  const stageMult = args.stage.payoutMult;
  const penalty = args.stageAlreadyCleared ? REPLAY_PENALTY : 1;
  return Math.floor(base * stageMult * penalty);
}
