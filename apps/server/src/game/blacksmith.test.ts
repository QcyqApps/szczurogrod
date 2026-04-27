import { describe, expect, it } from 'vitest';
import {
  MAX_ENHANCEMENT_LEVEL,
  applyEnhancementToStats,
  computeDismantleScrap,
  computeEnhancementMultiplier,
  computeUpgradeCost,
  computeUpgradeSuccessRate,
} from './blacksmith.js';

describe('computeEnhancementMultiplier', () => {
  it('is 1 at level 0', () => {
    expect(computeEnhancementMultiplier(0)).toBe(1);
  });
  it('+5% per level 1..5', () => {
    expect(computeEnhancementMultiplier(1)).toBeCloseTo(1.05);
    expect(computeEnhancementMultiplier(5)).toBeCloseTo(1.25);
  });
  it('+10% per level 6..10 on top of lvl 5 baseline', () => {
    expect(computeEnhancementMultiplier(6)).toBeCloseTo(1.35);
    expect(computeEnhancementMultiplier(10)).toBeCloseTo(1.75);
  });
  it('clamps above MAX', () => {
    expect(computeEnhancementMultiplier(MAX_ENHANCEMENT_LEVEL + 5)).toBeCloseTo(
      computeEnhancementMultiplier(MAX_ENHANCEMENT_LEVEL),
    );
  });
});

describe('applyEnhancementToStats', () => {
  it('leaves zero-base stats at zero at every level', () => {
    for (let lvl = 0; lvl <= MAX_ENHANCEMENT_LEVEL; lvl += 1) {
      const stats = applyEnhancementToStats({ atk: 0, def: 0, mag: 0 }, lvl);
      expect(stats).toEqual({ atk: 0, def: 0, mag: 0 });
    }
  });

  it('handles null / undefined stat fields as zero', () => {
    const stats = applyEnhancementToStats({ atk: null, def: undefined, mag: 5 }, 3);
    expect(stats.atk).toBe(0);
    expect(stats.def).toBe(0);
    expect(stats.mag).toBeGreaterThan(5);
  });

  it('guarantees +1 visible growth per level for low-stat items (regression)', () => {
    // Ostra Drzazga — common weapon, atk=2. Stara wersja `floor(2 * 1.05)=2`
    // pokazywała "brak zmiany" aż do +8. Nowa gwarantuje co najmniej +1/lvl.
    const base = { atk: 2, def: 0, mag: 0 };
    let prev = applyEnhancementToStats(base, 0).atk;
    for (let lvl = 1; lvl <= MAX_ENHANCEMENT_LEVEL; lvl += 1) {
      const curr = applyEnhancementToStats(base, lvl).atk;
      expect(curr).toBeGreaterThan(prev);
      prev = curr;
    }
  });

  it('scales big stats via multiplier (not linear +lvl)', () => {
    // Sztylet Smoczy — legendary, atk=38. Mult wygrywa nad +lvl.
    const base = { atk: 38, def: 0, mag: 0 };
    expect(applyEnhancementToStats(base, 10).atk).toBeGreaterThan(38 + 10);
    // +5 powinno dać ~floor(38 * 1.25) = 47, nie tylko 43.
    expect(applyEnhancementToStats(base, 5).atk).toBeGreaterThanOrEqual(47);
  });

  it('is monotonically non-decreasing across levels for every stat', () => {
    const base = { atk: 12, def: 5, mag: 30 };
    let prev = applyEnhancementToStats(base, 0);
    for (let lvl = 1; lvl <= MAX_ENHANCEMENT_LEVEL; lvl += 1) {
      const curr = applyEnhancementToStats(base, lvl);
      expect(curr.atk).toBeGreaterThanOrEqual(prev.atk);
      expect(curr.def).toBeGreaterThanOrEqual(prev.def);
      expect(curr.mag).toBeGreaterThanOrEqual(prev.mag);
      prev = curr;
    }
  });

  it('strictly increases nonzero stats on every level bump (no invisible upgrades)', () => {
    for (const baseValue of [1, 2, 5, 10, 20, 46]) {
      const base = { atk: baseValue, def: 0, mag: 0 };
      let prev = applyEnhancementToStats(base, 0).atk;
      for (let lvl = 1; lvl <= MAX_ENHANCEMENT_LEVEL; lvl += 1) {
        const curr = applyEnhancementToStats(base, lvl).atk;
        expect(curr).toBeGreaterThan(prev);
        prev = curr;
      }
    }
  });
});

describe('computeUpgradeCost', () => {
  it('returns null at MAX level', () => {
    expect(computeUpgradeCost(MAX_ENHANCEMENT_LEVEL)).toBeNull();
  });
  it('scales quadratically on gold', () => {
    expect(computeUpgradeCost(0)).toEqual({ gold: 500, scrap: 5 });
    expect(computeUpgradeCost(4)).toEqual({ gold: 12500, scrap: 25 });
    expect(computeUpgradeCost(9)).toEqual({ gold: 50000, scrap: 50 });
  });
});

describe('computeUpgradeSuccessRate', () => {
  it('is 1.0 for safe levels', () => {
    for (let lvl = 0; lvl < 6; lvl += 1) {
      expect(computeUpgradeSuccessRate(lvl)).toBe(1);
    }
  });
  it('declines 0.9 → 0.6 past safe threshold (post-audyt 2026-04)', () => {
    expect(computeUpgradeSuccessRate(6)).toBeCloseTo(0.9);
    expect(computeUpgradeSuccessRate(7)).toBeCloseTo(0.8);
    expect(computeUpgradeSuccessRate(8)).toBeCloseTo(0.7);
    expect(computeUpgradeSuccessRate(9)).toBeCloseTo(0.6);
  });
  it('clamps at 0.6 minimum', () => {
    expect(computeUpgradeSuccessRate(15)).toBe(0.6);
  });
});

describe('computeDismantleScrap', () => {
  it('maps rarity → scrap correctly', () => {
    expect(computeDismantleScrap('common')).toBe(1);
    expect(computeDismantleScrap('rare')).toBe(3);
    expect(computeDismantleScrap('epic')).toBe(8);
    expect(computeDismantleScrap('legendary')).toBe(20);
  });
});
