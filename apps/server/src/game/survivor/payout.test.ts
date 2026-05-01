import { describe, expect, it } from 'vitest';
import { getStage } from '@grodno/shared/survivor';
import { computeOkruchyPayout, validateRunReport } from './payout.js';

const stage1 = getStage(1)!;

describe('validateRunReport', () => {
  it('accepts a normal completed run', () => {
    const result = validateRunReport({
      stage: stage1,
      startedAtMs: 1_000_000,
      nowMs: 1_000_000 + 50_000,
      reportedDurationMs: 49_000,
      reportedKills: 100,
      reportedBossKilled: true,
    });
    expect(result.ok).toBe(true);
  });

  it('rejects when reported duration far exceeds wall-clock elapsed', () => {
    const result = validateRunReport({
      stage: stage1,
      startedAtMs: 1_000_000,
      nowMs: 1_000_000 + 10_000,
      reportedDurationMs: 60_000,
      reportedKills: 50,
      reportedBossKilled: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('REPORTED_DURATION_EXCEEDS_ELAPSED');
  });

  it('rejects boss kill before boss entry window', () => {
    const result = validateRunReport({
      stage: stage1,
      startedAtMs: 1_000_000,
      nowMs: 1_000_000 + 30_000,
      reportedDurationMs: 30_000,
      reportedKills: 100,
      reportedBossKilled: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('BOSS_KILL_BEFORE_BOSS_ENTRY');
  });

  it('rejects implausibly high kill count', () => {
    const result = validateRunReport({
      stage: stage1,
      startedAtMs: 1_000_000,
      nowMs: 1_000_000 + 50_000,
      reportedDurationMs: 50_000,
      reportedKills: 5_000,
      reportedBossKilled: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('KILL_RATE_EXCEEDS_BOUND');
  });

  it('rejects late report past slack window', () => {
    const result = validateRunReport({
      stage: stage1,
      startedAtMs: 1_000_000,
      nowMs: 1_000_000 + 5 * 60 * 1000,
      reportedDurationMs: 50_000,
      reportedKills: 100,
      reportedBossKilled: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('REPORT_ARRIVED_TOO_LATE');
  });
});

describe('computeOkruchyPayout', () => {
  it('rewards a clean stage 1 boss kill', () => {
    const okruchy = computeOkruchyPayout({
      stage: stage1,
      kills: 80,
      bossKilled: true,
      stageAlreadyCleared: false,
    });
    // 80 * 2 + 100 = 260, * 1.0 multiplier = 260
    expect(okruchy).toBe(260);
  });

  it('halves payout when replaying a cleared stage', () => {
    const okruchy = computeOkruchyPayout({
      stage: stage1,
      kills: 80,
      bossKilled: true,
      stageAlreadyCleared: true,
    });
    // 260 * 0.5 = 130
    expect(okruchy).toBe(130);
  });

  it('drops boss bonus when boss not killed', () => {
    const okruchy = computeOkruchyPayout({
      stage: stage1,
      kills: 80,
      bossKilled: false,
      stageAlreadyCleared: false,
    });
    // 80 * 2 = 160
    expect(okruchy).toBe(160);
  });

  it('scales with stage payoutMult', () => {
    const stage3 = getStage(3)!;
    const okruchy = computeOkruchyPayout({
      stage: stage3,
      kills: 80,
      bossKilled: true,
      stageAlreadyCleared: false,
    });
    // (160 + 100) * 2.4 = 624
    expect(okruchy).toBe(624);
  });

  it('returns 0 for zero kills, no boss', () => {
    expect(
      computeOkruchyPayout({
        stage: stage1,
        kills: 0,
        bossKilled: false,
        stageAlreadyCleared: false,
      }),
    ).toBe(0);
  });
});
