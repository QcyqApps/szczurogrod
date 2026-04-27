import { describe, expect, it } from 'vitest';
import { rollOracleCategory, rollOracleGold, rollOracleXp } from './oracle.js';

describe('rollOracleCategory', () => {
  it('60% gold, 20% xp, 10% potion, 7% common, 3% rare', () => {
    const counts = { gold: 0, xp: 0, potion: 0, common_item: 0, rare_item: 0 };
    // Prosty deterministic rng cycling przez [0, 1) w kawałkach 0.001.
    const samples = 1000;
    for (let i = 0; i < samples; i += 1) {
      const r = i / samples;
      const k = rollOracleCategory(() => r);
      counts[k] += 1;
    }
    // Z liniowym rng, rozkład jest dokładnie per próg:
    //   0..600      → gold
    //   600..800    → xp
    //   800..900    → potion
    //   900..970    → common_item
    //   970..1000   → rare_item
    expect(counts.gold).toBe(600);
    expect(counts.xp).toBe(200);
    expect(counts.potion).toBe(100);
    expect(counts.common_item).toBe(70);
    expect(counts.rare_item).toBe(30);
  });

  it('edge: rng=0 → gold', () => {
    expect(rollOracleCategory(() => 0)).toBe('gold');
  });
  it('edge: rng=0.99 → rare_item', () => {
    expect(rollOracleCategory(() => 0.99)).toBe('rare_item');
  });
});

describe('rollOracleGold', () => {
  it('L1 mieści się w ~100-220g', () => {
    const lo = rollOracleGold(1, () => 0);
    const hi = rollOracleGold(1, () => 0.999);
    expect(lo).toBe(110); // base=110, bonus=0
    expect(hi).toBeGreaterThanOrEqual(lo);
    expect(hi).toBeLessThanOrEqual(220);
  });

  it('L50 capuje na 1000', () => {
    const hi = rollOracleGold(50, () => 0.999);
    expect(hi).toBeLessThanOrEqual(1000);
  });

  it('skaluje się liniowo z lvl', () => {
    const l1 = rollOracleGold(1, () => 0);
    const l10 = rollOracleGold(10, () => 0);
    const l25 = rollOracleGold(25, () => 0);
    expect(l10).toBeGreaterThan(l1);
    expect(l25).toBeGreaterThan(l10);
  });
});

describe('rollOracleXp', () => {
  it('L1=60, L10=150, L50=550', () => {
    expect(rollOracleXp(1)).toBe(60);
    expect(rollOracleXp(10)).toBe(150);
    expect(rollOracleXp(50)).toBe(550);
  });
});
