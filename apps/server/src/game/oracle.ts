// Wróżka Hanusia — Oracle / Wyrocznia (Priorytet 7 z docs/features-vs-sf.md).
//
// Mechanika: 1 darmowy pull / UTC dzień + extra za 3 gemy. Każdy pull daje
// coś (brak "nic" w pool'u — inaczej niż dice). Loot table:
//   60% — gold (scaled by lvl, 100–1000g)
//   20% — mała dawka XP (scaled by lvl)
//   10% — common potion (random z pool'a)
//    7% — common equipment item
//    3% — rare item
//
// Pure functions tu; router robi DB reads/writes i atomowe nagradzanie.

import type { ItemTemplate } from '../content/registry.js';
import { REGISTRY } from '../content/registry.js';

export type OracleRewardKind =
  | 'gold'
  | 'xp'
  | 'potion'
  | 'common_item'
  | 'rare_item';

export interface OracleReward {
  kind: OracleRewardKind;
  gold: number;
  xp: number;
  /** `ItemTemplate` gdy `kind === 'potion' | 'common_item' | 'rare_item'`. */
  item: ItemTemplate | null;
}

/**
 * Rozmiar gold'a — 100 + lvl × 10 bazy, +0..base losowo, cap 1000.
 * Skaluje się liniowo z lvl'em bez ryzyka złotówek na L1 ani przelewów na L60.
 */
export function rollOracleGold(charLvl: number, rng: () => number = Math.random): number {
  const base = 100 + Math.round(charLvl * 10);
  const bonus = Math.floor(rng() * base);
  return Math.min(1000, base + bonus);
}

/** Małe XP scroll — ~20% questa na danym poziomie. */
export function rollOracleXp(charLvl: number): number {
  return 50 + charLvl * 10;
}

/** Loot roll wg rarity. Filtruje klasę broni + LVL ± 2 (jak shop). */
export function pickOracleItem(
  charLvl: number,
  charCls: 'warrior' | 'mage' | 'rogue',
  rarity: 'common' | 'rare',
  slotFilter: 'potion' | 'any',
  rng: () => number = Math.random,
): ItemTemplate | null {
  const pool: ItemTemplate[] = [];
  for (const item of REGISTRY.items.values()) {
    if (item.rarity !== rarity) continue;
    if (slotFilter === 'potion' && item.slot !== 'potion') continue;
    if (slotFilter === 'any' && item.slot === 'potion') continue;
    // Nie dawajmy mikstur buff'owanych — to content gem-shop grade; Oracle
    // = baseline fallback dla wszystkich graczy.
    if (item.buffKind) continue;
    const tier = inferRequiredLvl(item);
    if (tier > charLvl + 2) continue;
    if (item.allowedClasses && !item.allowedClasses.includes(charCls)) continue;
    pool.push(item);
  }
  if (pool.length === 0) return null;
  const idx = Math.floor(rng() * pool.length);
  return pool[idx] ?? null;
}

/** Heurystyka LVL z największej staty (bo `ItemTemplate` nie ma tego pola
 *  wprost). Mirror z `dice.ts::inferRequiredLvl` — duplikacja akceptowalna,
 *  inaczej trzeba by przerobić registry. */
function inferRequiredLvl(item: ItemTemplate): number {
  if (item.slot === 'potion') {
    // Mikstury lecą wg rarity — low-lvl dostępny od zawsze, endgame dopiero.
    if (item.rarity === 'common') return 1;
    if (item.rarity === 'rare') return 8;
    if (item.rarity === 'epic') return 18;
    return 33; // legendary
  }
  const stat = Math.max(item.atk ?? 0, item.def ?? 0, item.mag ?? 0);
  if (stat === 0) return 1;
  if (stat <= 10) return 3;
  if (stat <= 15) return 6;
  if (stat <= 22) return 10;
  if (stat <= 30) return 15;
  if (stat <= 45) return 22;
  if (stat <= 60) return 30;
  return 40;
}

/** Wybiera kategorię nagrody wg probabilities (60/20/10/7/3). */
export function rollOracleCategory(rng: () => number = Math.random): OracleRewardKind {
  const r = rng();
  if (r < 0.6) return 'gold';
  if (r < 0.8) return 'xp';
  if (r < 0.9) return 'potion';
  if (r < 0.97) return 'common_item';
  return 'rare_item';
}

/**
 * Player-facing pull: rolluje kategorię, mapuje, zwraca pełną nagrodę.
 * Gdy pool itemów dla danej kategorii pusty (np. fresh DB bez common items
 * dla klasy) — fallback na gold, żeby gracz nie dostawał pustego pull'a.
 */
export function performOraclePull(
  charLvl: number,
  charCls: 'warrior' | 'mage' | 'rogue',
  rng: () => number = Math.random,
): OracleReward {
  const kind = rollOracleCategory(rng);
  if (kind === 'gold') {
    return { kind: 'gold', gold: rollOracleGold(charLvl, rng), xp: 0, item: null };
  }
  if (kind === 'xp') {
    return { kind: 'xp', gold: 0, xp: rollOracleXp(charLvl), item: null };
  }
  if (kind === 'potion') {
    const item = pickOracleItem(charLvl, charCls, 'common', 'potion', rng);
    if (!item) return fallbackGold(charLvl, rng);
    return { kind: 'potion', gold: 0, xp: 0, item };
  }
  if (kind === 'common_item') {
    const item = pickOracleItem(charLvl, charCls, 'common', 'any', rng);
    if (!item) return fallbackGold(charLvl, rng);
    return { kind: 'common_item', gold: 0, xp: 0, item };
  }
  // rare_item
  const item = pickOracleItem(charLvl, charCls, 'rare', 'any', rng);
  if (!item) return fallbackGold(charLvl, rng);
  return { kind: 'rare_item', gold: 0, xp: 0, item };
}

function fallbackGold(charLvl: number, rng: () => number): OracleReward {
  return { kind: 'gold', gold: rollOracleGold(charLvl, rng), xp: 0, item: null };
}
