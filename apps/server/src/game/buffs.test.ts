import { describe, expect, it } from 'vitest';
import {
  ZERO_DELTAS,
  aggregateBuffs,
  effectiveMax,
  type ActiveBuff,
} from './buffs.js';

function mk(kind: ActiveBuff['kind'], magnitude: number, isCurse = false): ActiveBuff {
  return {
    kind,
    magnitude,
    expiresAt: new Date(Date.now() + 3600_000),
    sourceItemId: null,
    isCurse,
  };
}

describe('aggregateBuffs', () => {
  it('empty → zero deltas', () => {
    expect(aggregateBuffs([])).toEqual(ZERO_DELTAS);
  });

  it('sums flat stat buffs of distinct kinds', () => {
    const d = aggregateBuffs([
      mk('atk_flat', 15),
      mk('def_flat', 12),
      mk('mag_flat', 18),
      mk('spd_flat', 8),
    ]);
    expect(d.atkFlat).toBe(15);
    expect(d.defFlat).toBe(12);
    expect(d.magFlat).toBe(18);
    expect(d.spdFlat).toBe(8);
    expect(d.hpMaxPct).toBe(0);
    expect(d.mpMaxPct).toBe(0);
  });

  it('aggregates hp/mp % independently', () => {
    const d = aggregateBuffs([mk('hp_max_pct', 50), mk('mp_max_pct', 25)]);
    expect(d.hpMaxPct).toBe(50);
    expect(d.mpMaxPct).toBe(25);
  });

  it('hypothetical duplicate-kind rows sum (defense-in-depth — DB PK prevents)', () => {
    // Production flow has PK (character_id, kind) — tylko jeden wiersz może
    // istnieć per kategoria. Test sanity-check'uje że nawet gdyby jakiś bug
    // pokazał dwa wiersze, aggregateBuffs sumuje a nie crashuje.
    const d = aggregateBuffs([mk('atk_flat', 10), mk('atk_flat', 5)]);
    expect(d.atkFlat).toBe(15);
  });
});

describe('effectiveMax', () => {
  it('pct=0 → baseMax unchanged', () => {
    expect(effectiveMax(200, 0)).toBe(200);
  });

  it('pct=25 → 1.25× baseMax, rounded', () => {
    expect(effectiveMax(200, 25)).toBe(250);
    expect(effectiveMax(137, 25)).toBe(Math.round(137 * 1.25));
  });

  it('pct=100 → doubles baseMax', () => {
    expect(effectiveMax(200, 100)).toBe(400);
  });

  it('pct=-10 → 0.9× baseMax (klątwa pomniejsza)', () => {
    expect(effectiveMax(200, -10)).toBe(180);
  });

  it('pct=-100 clamped to 0.5× floor (nie zjadamy wszystkiego)', () => {
    expect(effectiveMax(200, -100)).toBe(100);
    expect(effectiveMax(200, -200)).toBe(100);
  });
});

describe('aggregateBuffs with curses', () => {
  it('klątwa ATK odejmuje magnitude', () => {
    const d = aggregateBuffs([mk('atk_flat', 10, true)]);
    expect(d.atkFlat).toBe(-10);
  });

  it('buff + klątwa tej samej kind = net delta', () => {
    const d = aggregateBuffs([mk('atk_flat', 8, false), mk('atk_flat', 5, true)]);
    expect(d.atkFlat).toBe(3);
  });

  it('klątwa hp_max_pct odejmuje procent', () => {
    const d = aggregateBuffs([mk('hp_max_pct', 25, false), mk('hp_max_pct', 10, true)]);
    expect(d.hpMaxPct).toBe(15);
  });
});
