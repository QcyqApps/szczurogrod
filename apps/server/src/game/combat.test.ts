import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  reduce,
  rollEnemyAttack,
  rollPlayerAttack,
  rollRarity,
  RARITY_WEIGHTS,
} from './combat.js';

describe('rollRarity', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the first rarity when random lands at the start', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(rollRarity(RARITY_WEIGHTS[1])).toBe('common');
  });

  it('returns the last non-zero rarity when random lands at the end', () => {
    // Tier 1: common 80, rare 20, epic 0, legendary 0. Random close to 1 → rare.
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(rollRarity(RARITY_WEIGHTS[1])).toBe('rare');
  });

  it('tier 4 lands on legendary at the top of the roll', () => {
    // Tier 4: common 10, rare 20, epic 45, legendary 25 (total 100).
    // Random 0.95 → roll = 95; subtract 10, 20, 45 → remaining 20 vs legendary 25 → legendary.
    vi.spyOn(Math, 'random').mockReturnValue(0.95);
    expect(rollRarity(RARITY_WEIGHTS[4])).toBe('legendary');
  });

  it('returns only non-zero weight rarities (tier 1 never yields epic/legendary)', () => {
    const weights = RARITY_WEIGHTS[1];
    const seen = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      vi.spyOn(Math, 'random').mockReturnValueOnce(i / 200);
      seen.add(rollRarity(weights));
    }
    expect(seen.has('epic')).toBe(false);
    expect(seen.has('legendary')).toBe(false);
    expect(seen.has('common')).toBe(true);
    expect(seen.has('rare')).toBe(true);
  });

  it('falls back to common if all weights are zero (pathological)', () => {
    const zeroWeights = { common: 0, rare: 0, epic: 0, legendary: 0 } as const;
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(rollRarity(zeroWeights)).toBe('common');
  });

  it('approximates the configured distribution over many rolls', () => {
    // Tier 3: common 30, rare 40, epic 25, legendary 5 (total 100).
    const counts = { common: 0, rare: 0, epic: 0, legendary: 0 };
    // Seed Math.random with a deterministic sequence for reproducibility.
    let seed = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    });
    for (let i = 0; i < 10_000; i += 1) {
      counts[rollRarity(RARITY_WEIGHTS[3])] += 1;
    }
    // Loose bounds — deterministic PRNG, but still check ratios are in the ballpark.
    expect(counts.common).toBeGreaterThan(2500);
    expect(counts.common).toBeLessThan(3500);
    expect(counts.rare).toBeGreaterThan(3500);
    expect(counts.rare).toBeLessThan(4500);
    expect(counts.legendary).toBeGreaterThan(200);
    expect(counts.legendary).toBeLessThan(800);
  });
});

describe('reduce', () => {
  it('returns 0 for non-positive raw damage', () => {
    expect(reduce(0, 10)).toBe(0);
    expect(reduce(-5, 10)).toBe(0);
  });

  it('applies no reduction at DEF 0 (rounded up)', () => {
    expect(reduce(10, 0)).toBe(10);
    expect(reduce(25, 0)).toBe(25);
  });

  it('approximates the documented mitigation curve', () => {
    // 100 raw @ DEF 10 → ceil(100 * 100 / 110) = ceil(90.9) = 91 ≈ 9% mit.
    expect(reduce(100, 10)).toBe(91);
    // 100 raw @ DEF 50 → ceil(100 * 100 / 150) = 67 ≈ 33% mit.
    expect(reduce(100, 50)).toBe(67);
    // 100 raw @ DEF 100 → ceil(100 * 100 / 200) = 50 ≈ 50% mit.
    expect(reduce(100, 100)).toBe(50);
  });

  it('guarantees minimum 1 dmg even against a wall of DEF', () => {
    expect(reduce(1, 999)).toBe(1);
    expect(reduce(5, 10_000)).toBe(1);
  });

  it('negative DEF is clamped to 0', () => {
    expect(reduce(10, -50)).toBe(10);
  });
});

describe('rollPlayerAttack', () => {
  afterEach(() => vi.restoreAllMocks());

  it('normal attack uses atk-only formula and reduces against DEF', () => {
    // Force no crit, no heavy miss, RNG floor so the dmg is deterministic.
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    // atk 20: raw = (20 + 8) + 3 = 31, no crit (0.5 >= 0.2). Against def 10:
    // reduce(31, 10) = ceil(31*100/110) = 29.
    const res = rollPlayerAttack('norm', { atk: 20, mag: 0, spd: 5 }, 10);
    expect(res.miss).toBe(false);
    expect(res.crit).toBe(false);
    expect(res.dmg).toBeGreaterThan(0);
  });

  it('heavy miss short-circuits with 0 dmg and miss=true', () => {
    // Low SPD keeps miss rate ~25%. Random 0.01 < missRate → miss.
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const res = rollPlayerAttack('heavy', { atk: 20, mag: 0, spd: 5 }, 0);
    expect(res.miss).toBe(true);
    expect(res.dmg).toBe(0);
    expect(res.crit).toBe(false);
  });

  it('heavy landing deals more than norm on the same inputs', () => {
    // Force past miss check: first random is 0.99 (no miss), then 0.99 (no crit),
    // then 0 for the random bonus.
    const seq = [0.99, 0.99, 0];
    vi.spyOn(Math, 'random').mockImplementation(() => seq.shift() ?? 0);
    const heavy = rollPlayerAttack('heavy', { atk: 20, mag: 0, spd: 50 }, 0);
    // Reset for norm.
    const seq2 = [0.99, 0];
    vi.spyOn(Math, 'random').mockImplementation(() => seq2.shift() ?? 0);
    const norm = rollPlayerAttack('norm', { atk: 20, mag: 0, spd: 50 }, 0);
    expect(heavy.dmg).toBeGreaterThan(norm.dmg);
  });

  it('magic pierces half the enemy DEF', () => {
    // Force no crit (0.99 > 0.2) and 0 for the +rand bonus so casts are deterministic.
    const seq = [0.99, 0];
    vi.spyOn(Math, 'random').mockImplementation(() => seq.shift() ?? 0);
    const vsHighDef = rollPlayerAttack('magic', { atk: 0, mag: 20, spd: 0 }, 40);
    // Pierce halves DEF 40 → 20. Balance pass 3: raw = mag * 0.5 + 8 + 0 = 18.
    // Reduce(18, 20) = ceil(1800/120) = 15.
    expect(vsHighDef.dmg).toBe(15);
  });

  it('crit multiplies raw before reduction', () => {
    // For heavy: first random is miss check (0.99 no miss), then crit (0.0 → crit).
    const seq = [0.99, 0.0, 0];
    vi.spyOn(Math, 'random').mockImplementation(() => seq.shift() ?? 0);
    const crit = rollPlayerAttack('heavy', { atk: 20, mag: 0, spd: 50 }, 0);
    expect(crit.crit).toBe(true);
    expect(crit.miss).toBe(false);
    // Non-crit baseline.
    const seq2 = [0.99, 0.99, 0];
    vi.spyOn(Math, 'random').mockImplementation(() => seq2.shift() ?? 0);
    const normal = rollPlayerAttack('heavy', { atk: 20, mag: 0, spd: 50 }, 0);
    expect(crit.dmg).toBeGreaterThan(normal.dmg);
  });
});

describe('rollEnemyAttack', () => {
  afterEach(() => vi.restoreAllMocks());

  it('dodge returns 0 dmg with dodged=true', () => {
    // Rogue cap 0.40. SPD 30 → dodgeChance = 0.30. Random 0.0 → dodged.
    vi.spyOn(Math, 'random').mockReturnValue(0.0);
    const res = rollEnemyAttack(20, { def: 5, spd: 30 }, 'rogue');
    expect(res.dodged).toBe(true);
    expect(res.dmg).toBe(0);
  });

  it('warrior dodge is capped at 25 % even with huge SPD', () => {
    // SPD 100 would give 1.0 chance — cap it at 0.25 for warriors.
    // Random 0.3 > 0.25 → no dodge; random 0.2 < 0.25 → dodge.
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const noDodge = rollEnemyAttack(20, { def: 0, spd: 100 }, 'warrior');
    expect(noDodge.dodged).toBe(false);

    vi.spyOn(Math, 'random').mockReturnValue(0.2);
    const dodged = rollEnemyAttack(20, { def: 0, spd: 100 }, 'warrior');
    expect(dodged.dodged).toBe(true);
  });

  it('rogue/mage dodge is capped at 40 %', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.45);
    const rogue = rollEnemyAttack(20, { def: 0, spd: 100 }, 'rogue');
    expect(rogue.dodged).toBe(false);

    vi.spyOn(Math, 'random').mockReturnValue(0.39);
    const rogueDodged = rollEnemyAttack(20, { def: 0, spd: 100 }, 'rogue');
    expect(rogueDodged.dodged).toBe(true);

    vi.spyOn(Math, 'random').mockReturnValue(0.39);
    const mageDodged = rollEnemyAttack(20, { def: 0, spd: 100 }, 'mage');
    expect(mageDodged.dodged).toBe(true);
  });

  it('landed hit reduces enemy dmg by player DEF', () => {
    // No dodge: random 0.99; then 0 for the +rand bonus.
    const seq = [0.99, 0];
    vi.spyOn(Math, 'random').mockImplementation(() => seq.shift() ?? 0);
    // raw = 20 + 0 = 20. Reduce(20, 50) = ceil(2000/150) = 14.
    const res = rollEnemyAttack(20, { def: 50, spd: 0 }, 'warrior');
    expect(res.dodged).toBe(false);
    expect(res.dmg).toBe(14);
  });
});
