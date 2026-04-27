import { describe, expect, it } from 'vitest';
import {
  BLESSINGS,
  blessingReadyAtMs,
  BLESSING_COOLDOWN_MS,
  computeBlessingCost,
  getBlessing,
} from './blessings.js';

describe('BLESSINGS', () => {
  it('has exactly 6 offers (one per BuffKind)', () => {
    expect(BLESSINGS.length).toBe(6);
    const kinds = new Set(BLESSINGS.map((b) => b.kind));
    expect(kinds.size).toBe(6);
  });

  it('every blessing has a positive costGoldBase and 1h duration', () => {
    for (const b of BLESSINGS) {
      expect(b.costGoldBase).toBeGreaterThan(0);
      expect(b.durationHours).toBe(1);
    }
  });
});

describe('getBlessing', () => {
  it('finds by id', () => {
    expect(getBlessing('b-hp')?.kind).toBe('hp_max_pct');
  });
  it('returns null for unknown', () => {
    expect(getBlessing('nope')).toBeNull();
  });
});

describe('computeBlessingCost', () => {
  it('L1 → base × ~1.1 (minimal scaling)', () => {
    expect(computeBlessingCost(100, 1)).toBeGreaterThanOrEqual(108);
    expect(computeBlessingCost(100, 1)).toBeLessThanOrEqual(112);
  });

  it('monotonically increases with lvl', () => {
    const costs = [1, 5, 10, 15, 20, 30, 50].map((lvl) => computeBlessingCost(100, lvl));
    for (let i = 1; i < costs.length; i += 1) {
      expect(costs[i]).toBeGreaterThan(costs[i - 1]!);
    }
  });

  it('L10 HP blessing lands in ~400-600g range (~1 quest)', () => {
    const cost = computeBlessingCost(100, 10);
    expect(cost).toBeGreaterThanOrEqual(400);
    expect(cost).toBeLessThanOrEqual(600);
  });

  it('L30 HP blessing lands in ~2200-3000g range (~1 quest at endgame)', () => {
    const cost = computeBlessingCost(100, 30);
    expect(cost).toBeGreaterThanOrEqual(2200);
    expect(cost).toBeLessThanOrEqual(3000);
  });

  it('ATK blessing (base 120) is 20% droższy od HP/DEF (base 100) na każdym LVL', () => {
    for (const lvl of [5, 15, 25]) {
      const hp = computeBlessingCost(100, lvl);
      const atk = computeBlessingCost(120, lvl);
      // Ratio wynika czysto z base — mult jest ten sam dla obu.
      const ratio = atk / hp;
      expect(ratio).toBeCloseTo(1.2, 1);
    }
  });

  it('clamps lvl < 1 → effective lvl 1 (brak crashów na corner case)', () => {
    expect(computeBlessingCost(100, 0)).toBe(computeBlessingCost(100, 1));
    expect(computeBlessingCost(100, -5)).toBe(computeBlessingCost(100, 1));
  });
});

describe('blessingReadyAtMs', () => {
  it('null lastBlessingAt → null (ready)', () => {
    expect(blessingReadyAtMs(null)).toBeNull();
  });

  it('expired cooldown → null', () => {
    const past = new Date(Date.now() - BLESSING_COOLDOWN_MS - 1000);
    expect(blessingReadyAtMs(past)).toBeNull();
  });

  it('active cooldown → returns ready-at unix ms', () => {
    const recent = new Date(Date.now() - 5 * 60 * 1000); // 5 min ago
    const readyAt = blessingReadyAtMs(recent);
    expect(readyAt).not.toBeNull();
    expect(readyAt).toBe(recent.getTime() + BLESSING_COOLDOWN_MS);
  });
});
