// Trener: player spends gold to buy single stat points. Cost curve = current²
// (Shakes & Fidget style), so pumping one stat naturally taxes the player.

import type { CharacterStats } from '@grodno/shared';

export type StatKey = keyof CharacterStats;

/** Gold cost to raise a stat from its current value to current+1. */
export function statCost(currentValue: number): number {
  return Math.max(1, Math.pow(currentValue, 2));
}

/** Full quote for the UI: 4 next-point costs based on current values. */
export function computeQuote(stats: CharacterStats) {
  return {
    atk: statCost(stats.atk),
    def: statCost(stats.def),
    mag: statCost(stats.mag),
    spd: statCost(stats.spd),
  };
}
