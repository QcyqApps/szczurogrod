import { describe, expect, it } from 'vitest';
import { computeQuote, statCost } from './trainer.js';

describe('statCost', () => {
  it('follows the stat² curve', () => {
    expect(statCost(5)).toBe(25);
    expect(statCost(10)).toBe(100);
    expect(statCost(18)).toBe(324);
    expect(statCost(50)).toBe(2500);
  });

  it('has a floor of 1 gold for very low stats', () => {
    expect(statCost(0)).toBe(1);
    expect(statCost(1)).toBe(1);
  });

  it('is monotonically increasing', () => {
    for (let v = 1; v < 50; v += 1) {
      expect(statCost(v + 1)).toBeGreaterThanOrEqual(statCost(v));
    }
  });
});

describe('computeQuote', () => {
  it('returns the next-point cost for every stat', () => {
    const quote = computeQuote({ atk: 18, def: 14, mag: 4, spd: 7 });
    expect(quote).toEqual({
      atk: 324,
      def: 196,
      mag: 16,
      spd: 49,
    });
  });

  it('matches statCost entry by entry', () => {
    const stats = { atk: 22, def: 9, mag: 31, spd: 12 };
    const quote = computeQuote(stats);
    expect(quote.atk).toBe(statCost(stats.atk));
    expect(quote.def).toBe(statCost(stats.def));
    expect(quote.mag).toBe(statCost(stats.mag));
    expect(quote.spd).toBe(statCost(stats.spd));
  });
});
