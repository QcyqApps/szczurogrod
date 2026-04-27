import { describe, expect, it } from 'vitest';
import type { CombatFighter } from './arena.js';
import {
  RAID_BOSS_TEMPLATES,
  RAID_HITS_PER_DAY,
  computeBossHp,
  computeBossReward,
  rollRaidDamage,
  templateForTier,
} from './guild-raids.js';

function fighter(atk: number, mag: number): CombatFighter {
  return {
    name: 'Test',
    atk,
    def: 0,
    mag,
    spd: 0,
    hpMax: 100,
    cls: 'warrior',
    lvl: 10,
  };
}

describe('RAID_BOSS_TEMPLATES', () => {
  it('ma 5 bossów', () => {
    expect(RAID_BOSS_TEMPLATES).toHaveLength(5);
  });

  it('rotationIndex każdego bossa jest 0..4, unikalne', () => {
    const indices = RAID_BOSS_TEMPLATES.map((b) => b.rotationIndex).sort();
    expect(indices).toEqual([0, 1, 2, 3, 4]);
  });

  it('RAID_HITS_PER_DAY = 3', () => {
    expect(RAID_HITS_PER_DAY).toBe(3);
  });
});

describe('templateForTier', () => {
  it('tier 1 → pierwszy template (Szczur Wielki)', () => {
    const t = templateForTier(1);
    expect(t.rotationIndex).toBe(0);
    expect(t.slug).toBe('szczur-wielki');
  });

  it('tier 6 → wraca do rotation 0 (5+1 mod 5 = 0)', () => {
    const t1 = templateForTier(1);
    const t6 = templateForTier(6);
    expect(t6.slug).toBe(t1.slug);
  });

  it('tier 11 → rotation 0 znów (10 mod 5 = 0)', () => {
    const t1 = templateForTier(1);
    const t11 = templateForTier(11);
    expect(t11.slug).toBe(t1.slug);
  });

  it('każdy tier mapuje do jednego z 5 template', () => {
    for (let tier = 1; tier <= 20; tier++) {
      const t = templateForTier(tier);
      expect(RAID_BOSS_TEMPLATES).toContain(t);
    }
  });
});

describe('computeBossHp', () => {
  it('tier 1 → baseHp bez zmian', () => {
    expect(computeBossHp(8000, 1)).toBe(8000);
  });

  it('tier 2 → baseHp * 1.3', () => {
    expect(computeBossHp(10_000, 2)).toBe(13_000);
  });

  it('tier 6 → baseHp * 2.5 (1 + 5*0.3)', () => {
    expect(computeBossHp(10_000, 6)).toBe(25_000);
  });

  it('tier 11 → baseHp * 4 (1 + 10*0.3)', () => {
    expect(computeBossHp(10_000, 11)).toBe(40_000);
  });

  it('HP rośnie monotonicznie z tier', () => {
    let prev = 0;
    for (let tier = 1; tier <= 20; tier++) {
      const hp = computeBossHp(1000, tier);
      expect(hp).toBeGreaterThan(prev);
      prev = hp;
    }
  });
});

describe('computeBossReward', () => {
  it('tier 1: 700g, 0 gems', () => {
    expect(computeBossReward(1)).toEqual({ gold: 700, gems: 0 });
  });

  it('tier 2: 1200g, 1 gem', () => {
    expect(computeBossReward(2)).toEqual({ gold: 1200, gems: 1 });
  });

  it('tier 5: 2700g, 2 gems', () => {
    expect(computeBossReward(5)).toEqual({ gold: 2700, gems: 2 });
  });

  it('tier 10: 5200g, 5 gems', () => {
    expect(computeBossReward(10)).toEqual({ gold: 5200, gems: 5 });
  });

  it('reward rośnie z tier', () => {
    let prev = -1;
    for (let tier = 1; tier <= 20; tier++) {
      const r = computeBossReward(tier);
      expect(r.gold).toBeGreaterThan(prev);
      prev = r.gold;
    }
  });
});

describe('rollRaidDamage', () => {
  it('zwraca co najmniej 10 damage (floor)', () => {
    for (let i = 0; i < 50; i++) {
      const dmg = rollRaidDamage(fighter(0, 0), 1, 9999);
      expect(dmg).toBeGreaterThanOrEqual(10);
    }
  });

  it('cap do hpCurrent (ostatni hit nie przekracza)', () => {
    for (let i = 0; i < 50; i++) {
      const dmg = rollRaidDamage(fighter(1000, 1000), 1, 42);
      expect(dmg).toBeLessThanOrEqual(42);
    }
  });

  it('większy atk+mag → większy średni damage', () => {
    const weak: number[] = [];
    const strong: number[] = [];
    for (let i = 0; i < 200; i++) {
      weak.push(rollRaidDamage(fighter(10, 10), 1, 99999));
      strong.push(rollRaidDamage(fighter(500, 500), 1, 99999));
    }
    const weakAvg = weak.reduce((a, b) => a + b, 0) / weak.length;
    const strongAvg = strong.reduce((a, b) => a + b, 0) / strong.length;
    expect(strongAvg).toBeGreaterThan(weakAvg * 5);
  });

  it('dla wysokiego atk — wyższy tier daje więcej dmg (tier scale dominuje bossDef)', () => {
    // Dla fighter'a z atk+mag=1000 (baseDamage=500):
    //   tier 1:  500*1.05 - 5    = 520 raw
    //   tier 10: 500*1.5  - 50   = 700 raw → oczekiwane 34% więcej
    const t1: number[] = [];
    const t10: number[] = [];
    for (let i = 0; i < 200; i++) {
      t1.push(rollRaidDamage(fighter(500, 500), 1, 99999));
      t10.push(rollRaidDamage(fighter(500, 500), 10, 99999));
    }
    const t1Avg = t1.reduce((a, b) => a + b, 0) / t1.length;
    const t10Avg = t10.reduce((a, b) => a + b, 0) / t10.length;
    expect(t10Avg).toBeGreaterThan(t1Avg * 1.2);
  });
});
