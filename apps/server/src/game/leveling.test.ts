import { describe, expect, it } from 'vitest';
import {
  applyXpGain,
  staminaMaxForLevel,
  summarizeLevelUps,
  xpToNext,
  type CharacterProgression,
} from './leveling.js';

function warrior(overrides: Partial<CharacterProgression> = {}): CharacterProgression {
  return {
    cls: 'warrior',
    lvl: 1,
    xp: 0,
    xpMax: xpToNext(1),
    hp: 100,
    hpMax: 100,
    mp: 20,
    mpMax: 20,
    stamina: 10,
    staminaMax: 10,
    ...overrides,
  };
}

describe('xpToNext', () => {
  it('uses the hand-tuned table for L1-L14', () => {
    expect(xpToNext(1)).toBe(60);
    expect(xpToNext(5)).toBe(1_500);
    expect(xpToNext(14)).toBe(4_500);
  });

  it('falls back to the exponential formula past the table', () => {
    // L15→L16 threshold sits at 20 000 by design (q15 boss = 50 %).
    expect(xpToNext(15)).toBe(20_000);
    expect(xpToNext(20)).toBeGreaterThan(xpToNext(15));
    expect(xpToNext(100)).toBeGreaterThan(xpToNext(50));
  });

  it('scales past the int32 ceiling safely (uses JS number, xp_max column is bigint)', () => {
    // L200+ crosses 10¹⁴ — still inside Number.MAX_SAFE_INTEGER (~9·10¹⁵).
    expect(xpToNext(200)).toBeGreaterThan(1e12);
    expect(Number.isFinite(xpToNext(300))).toBe(true);
  });
});

describe('staminaMaxForLevel', () => {
  it('is 10 at L1-L4, then +1 every 5 levels', () => {
    expect(staminaMaxForLevel(1)).toBe(10);
    expect(staminaMaxForLevel(4)).toBe(10);
    expect(staminaMaxForLevel(5)).toBe(11);
    expect(staminaMaxForLevel(10)).toBe(12);
    expect(staminaMaxForLevel(15)).toBe(13);
  });
});

describe('applyXpGain — no level-up', () => {
  it('adds XP below the threshold without crossing', () => {
    const res = applyXpGain(warrior({ xp: 10 }), 30);
    expect(res.progression.xp).toBe(40);
    expect(res.progression.lvl).toBe(1);
    expect(res.ups).toHaveLength(0);
  });

  it('does not restore HP/MP when no level-up', () => {
    const res = applyXpGain(warrior({ xp: 0, hp: 30, mp: 5 }), 20);
    expect(res.progression.hp).toBe(30);
    expect(res.progression.mp).toBe(5);
  });

  it('ignores zero or negative XP gains', () => {
    const res = applyXpGain(warrior({ xp: 30 }), 0);
    expect(res.progression.xp).toBe(30);
    expect(res.ups).toHaveLength(0);
  });
});

describe('applyXpGain — single level-up', () => {
  it('crosses L1 → L2 and advances xpMax', () => {
    const res = applyXpGain(warrior({ xp: 50 }), 20); // 70 > 60, 10 leftover < 120
    expect(res.progression.lvl).toBe(2);
    expect(res.progression.xp).toBe(10);
    expect(res.progression.xpMax).toBe(xpToNext(2));
    expect(res.ups).toHaveLength(1);
    expect(res.ups[0]).toMatchObject({ fromLevel: 1, toLevel: 2, hpGain: 14, mpGain: 3 });
  });

  it('restores HP and MP to new max on level-up', () => {
    const res = applyXpGain(warrior({ xp: 50, hp: 1, mp: 1 }), 20);
    expect(res.progression.hp).toBe(res.progression.hpMax);
    expect(res.progression.mp).toBe(res.progression.mpMax);
  });

  it('applies class-specific HP/MP gains (mage gets more MP, warrior more HP)', () => {
    const warRes = applyXpGain(warrior({ xp: 50 }), 20);
    const mageRes = applyXpGain({ ...warrior({ xp: 50 }), cls: 'mage' }, 20);
    expect(warRes.ups[0].hpGain).toBe(14);
    expect(warRes.ups[0].mpGain).toBe(3);
    expect(mageRes.ups[0].hpGain).toBe(8);
    expect(mageRes.ups[0].mpGain).toBe(10);
  });

  it('raises stamina cap exactly when crossing a /5 boundary', () => {
    const before = warrior({ lvl: 4, xp: xpToNext(4) - 1, xpMax: xpToNext(4), staminaMax: 10, stamina: 10 });
    const res = applyXpGain(before, 5);
    expect(res.progression.lvl).toBe(5);
    expect(res.progression.staminaMax).toBe(11);
    expect(res.ups[0].staminaGain).toBe(1);
  });
});

describe('applyXpGain — multiple level-ups in one call', () => {
  it('cascades through several levels if XP gained is large', () => {
    const res = applyXpGain(warrior(), 3_000); // crosses L1→L5 (60+120+240+400 = 820) and part of L5→L6
    expect(res.progression.lvl).toBeGreaterThanOrEqual(4);
    expect(res.ups.length).toBeGreaterThanOrEqual(3);
    // Each up records a single-level transition.
    for (let i = 0; i < res.ups.length; i += 1) {
      expect(res.ups[i].toLevel - res.ups[i].fromLevel).toBe(1);
    }
  });
});

describe('applyXpGain — uncapped curve', () => {
  it('keeps cascading past the hand-tuned table (L14 → L15 → L16…)', () => {
    const before = warrior({
      lvl: 14,
      xp: xpToNext(14) - 1,
      xpMax: xpToNext(14),
    });
    const res = applyXpGain(before, 10 + xpToNext(15));
    expect(res.progression.lvl).toBe(16);
    expect(res.ups).toHaveLength(2);
    expect(res.ups[1].newXpMax).toBe(xpToNext(16));
  });

  it('huge XP gains still terminate — exponential formula outruns input', () => {
    const res = applyXpGain(warrior(), 1_000_000_000); // 1B XP
    // Player lands somewhere deep but the loop terminates (not infinite).
    expect(res.progression.lvl).toBeGreaterThan(50);
    expect(res.progression.xp).toBeLessThan(res.progression.xpMax);
  });
});

describe('summarizeLevelUps', () => {
  it('returns null for an empty list', () => {
    expect(summarizeLevelUps([])).toBeNull();
  });

  it('collapses multiple ups into one summary with totalled gains', () => {
    const res = applyXpGain(warrior(), 3000); // cross L1→L3
    const summary = summarizeLevelUps(res.ups);
    expect(summary).not.toBeNull();
    expect(summary!.fromLevel).toBe(1);
    expect(summary!.toLevel).toBe(res.progression.lvl);
    expect(summary!.hpGain).toBe(res.ups.reduce((a, u) => a + u.hpGain, 0));
  });

  it('reports chapter unlock when crossing a chapter gate level', () => {
    // Crossing L6 unlocks akt-2.
    const before = warrior({ lvl: 5, xp: xpToNext(5) - 1, xpMax: xpToNext(5) });
    const res = applyXpGain(before, 5);
    const summary = summarizeLevelUps(res.ups);
    expect(summary?.chapterUnlock?.id).toBe('akt-2');
  });

  it('reports no chapter unlock when the gate level is not crossed', () => {
    const res = applyXpGain(warrior(), 30); // no level-up at all (30 < L1 threshold 60)
    expect(summarizeLevelUps(res.ups)).toBeNull();
  });
});
