import { describe, expect, it } from 'vitest';
import {
  DAILY_LADDER,
  DAILY_STREAK_CAP,
  computeStreakForToday,
  dayToLadderIndex,
  daysBetween,
  isoDateUTC,
} from './daily.js';

describe('isoDateUTC', () => {
  it('formats a Date as YYYY-MM-DD in UTC', () => {
    expect(isoDateUTC(new Date('2026-04-21T13:45:00Z'))).toBe('2026-04-21');
  });

  it('rolls over at midnight UTC, not local time', () => {
    // 23:30 UTC on 2026-04-21 is still the 21st in UTC.
    expect(isoDateUTC(new Date('2026-04-21T23:30:00Z'))).toBe('2026-04-21');
    // 00:30 UTC on 2026-04-22 is the 22nd.
    expect(isoDateUTC(new Date('2026-04-22T00:30:00Z'))).toBe('2026-04-22');
  });
});

describe('daysBetween', () => {
  it('returns 0 for the same day', () => {
    expect(daysBetween('2026-04-21', '2026-04-21')).toBe(0);
  });

  it('returns 1 for consecutive days', () => {
    expect(daysBetween('2026-04-21', '2026-04-22')).toBe(1);
  });

  it('returns a negative number when b is before a', () => {
    expect(daysBetween('2026-04-22', '2026-04-21')).toBe(-1);
  });

  it('handles month boundaries', () => {
    expect(daysBetween('2026-04-30', '2026-05-01')).toBe(1);
  });

  it('handles year boundaries', () => {
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
  });
});

describe('computeStreakForToday', () => {
  it('returns 1 for first-ever claim (no prior date)', () => {
    expect(computeStreakForToday(null, 0, '2026-04-21')).toBe(1);
  });

  it('continues the streak when claiming on the next day', () => {
    expect(computeStreakForToday('2026-04-20', 3, '2026-04-21')).toBe(4);
  });

  it(`caps the streak at ${DAILY_STREAK_CAP} (ladder loops)`, () => {
    expect(computeStreakForToday('2026-04-20', DAILY_STREAK_CAP, '2026-04-21')).toBe(
      DAILY_STREAK_CAP,
    );
    expect(computeStreakForToday('2026-04-20', 99, '2026-04-21')).toBe(DAILY_STREAK_CAP);
  });

  it('progresses through mid-streak (day 13 → 14)', () => {
    expect(computeStreakForToday('2026-04-20', 13, '2026-04-21')).toBe(14);
  });

  it('progresses past old 7-day cap (day 7 → 8)', () => {
    expect(computeStreakForToday('2026-04-20', 7, '2026-04-21')).toBe(8);
  });

  it('resets to 1 when a day is skipped', () => {
    expect(computeStreakForToday('2026-04-19', 5, '2026-04-21')).toBe(1);
  });

  it('returns previous streak when claim date equals today (no-op safety)', () => {
    expect(computeStreakForToday('2026-04-21', 3, '2026-04-21')).toBe(3);
  });
});

describe('dayToLadderIndex', () => {
  it(`maps 1..${DAILY_STREAK_CAP} → 0..${DAILY_STREAK_CAP - 1}`, () => {
    expect(dayToLadderIndex(1)).toBe(0);
    expect(dayToLadderIndex(14)).toBe(13);
    expect(dayToLadderIndex(DAILY_STREAK_CAP)).toBe(DAILY_STREAK_CAP - 1);
  });

  it(`clamps values outside 1..${DAILY_STREAK_CAP}`, () => {
    expect(dayToLadderIndex(0)).toBe(0);
    expect(dayToLadderIndex(-5)).toBe(0);
    expect(dayToLadderIndex(100)).toBe(DAILY_STREAK_CAP - 1);
  });
});

describe('DAILY_LADDER', () => {
  it(`has exactly ${DAILY_STREAK_CAP} entries`, () => {
    expect(DAILY_LADDER.length).toBe(DAILY_STREAK_CAP);
  });

  it('day 28 is a legendary finisher', () => {
    const last = DAILY_LADDER[DAILY_STREAK_CAP - 1]!;
    expect(last.itemRarity).toBe('legendary');
    expect(last.gems).toBeGreaterThanOrEqual(20);
  });

  it('day 14 is at least rare (mid-month milestone)', () => {
    const d14 = DAILY_LADDER[13]!;
    expect(['rare', 'epic', 'legendary']).toContain(d14.itemRarity);
  });
});
