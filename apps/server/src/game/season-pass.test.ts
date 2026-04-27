import { describe, expect, it } from 'vitest';
import {
  FREE_TRACK,
  PREMIUM_TRACK,
  SEASON_PASS_TIER_COUNT,
  currentSeasonStart,
  getTierReward,
  isTierClaimed,
  markTierClaimed,
  tierFromXp,
  xpRequiredForTier,
} from './season-pass.js';

describe('tierFromXp', () => {
  it('0 XP → tier 0', () => {
    expect(tierFromXp(0)).toBe(0);
  });
  it('12 XP → tier 1 (post-audyt)', () => {
    expect(tierFromXp(12)).toBe(1);
    expect(tierFromXp(11)).toBe(0);
  });
  it('60 XP → tier 5', () => {
    expect(tierFromXp(60)).toBe(5);
  });
  it('caps at SEASON_PASS_TIER_COUNT', () => {
    expect(tierFromXp(9999)).toBe(SEASON_PASS_TIER_COUNT);
  });
  it('negative → 0', () => {
    expect(tierFromXp(-5)).toBe(0);
  });
});

describe('xpRequiredForTier', () => {
  it('tier N requires 12×N XP', () => {
    expect(xpRequiredForTier(1)).toBe(12);
    expect(xpRequiredForTier(10)).toBe(120);
    expect(xpRequiredForTier(30)).toBe(360);
  });
});

describe('reward tables', () => {
  it(`both tracks have exactly ${SEASON_PASS_TIER_COUNT} entries`, () => {
    expect(FREE_TRACK.length).toBe(SEASON_PASS_TIER_COUNT);
    expect(PREMIUM_TRACK.length).toBe(SEASON_PASS_TIER_COUNT);
  });

  it('tier 30 (finale) w obu tracks jest legendary', () => {
    expect(FREE_TRACK[29]?.itemRarity).toBe('legendary');
    expect(PREMIUM_TRACK[29]?.itemRarity).toBe('legendary');
  });

  it('premium tier 30 daje więcej gemów niż free', () => {
    expect(PREMIUM_TRACK[29]!.gems!).toBeGreaterThan(FREE_TRACK[29]!.gems!);
  });

  it('getTierReward respektuje indeksację 1-based', () => {
    expect(getTierReward(1, 'free')).toEqual(FREE_TRACK[0]);
    expect(getTierReward(30, 'premium')).toEqual(PREMIUM_TRACK[29]);
    expect(getTierReward(0, 'free')).toBeNull();
    expect(getTierReward(31, 'free')).toBeNull();
  });
});

describe('bitmap helpers', () => {
  it('claim + check roundtrip', () => {
    let b = 0;
    b = markTierClaimed(b, 1);
    b = markTierClaimed(b, 15);
    b = markTierClaimed(b, 30);
    expect(isTierClaimed(b, 1)).toBe(true);
    expect(isTierClaimed(b, 15)).toBe(true);
    expect(isTierClaimed(b, 30)).toBe(true);
    expect(isTierClaimed(b, 2)).toBe(false);
    expect(isTierClaimed(b, 14)).toBe(false);
  });

  it('isTierClaimed defensively rejects out-of-range', () => {
    expect(isTierClaimed(0xffffffff, 0)).toBe(false);
    expect(isTierClaimed(0xffffffff, 32)).toBe(false);
  });
});

describe('currentSeasonStart', () => {
  it('zwraca ISO first-of-month UTC', () => {
    expect(currentSeasonStart(new Date('2026-04-15T10:30:00Z'))).toBe('2026-04-01');
    expect(currentSeasonStart(new Date('2026-12-31T23:59:00Z'))).toBe('2026-12-01');
    expect(currentSeasonStart(new Date('2026-01-01T00:00:01Z'))).toBe('2026-01-01');
  });
});
