// Karciarz Franek — daily gamble feature (Priorytet 7 z docs/features-vs-sf.md).
//
// Mechanika: rzut 1d10. 1 darmowa gra na UTC dzień; extra gry 5 gemów.
// Wynik mapuje się na nagrodę:
//   1-3 (30%) — nic
//   4-6 (30%) — 500g
//   7-9 (30%) — 1500g
//   10  (10%) — rare item LUB 20 gemów (50/50)
//
// EV w gold'ach (grubo): 0 + 150 + 450 + 50 gemów-ekw ≈ kilkaset gold'a + ~1g
// z rare item'u. Przy koszcie 5 gemów ~premium, EV ma być delikatnie
// ujemny — negative-EV gambling hook bez grindowania dogłębnie.
//
// Pure functions tu (bez DB) — router robi walidację stan'a, DB reads/writes.

import type { ItemTemplate } from '../content/registry.js';
import { REGISTRY } from '../content/registry.js';

export type DiceRewardKind = 'nothing' | 'gold' | 'rare_item' | 'gems';

export interface DiceReward {
  kind: DiceRewardKind;
  gold: number;
  gems: number;
  /** ItemTemplate gdy `kind === 'rare_item'`, inaczej null. */
  item: ItemTemplate | null;
}

/** Mapowanie rzutu d10 na płaską nagrodę. `roll` musi być 1..10. Pure. */
export function rollToReward(
  roll: number,
  itemPicker: () => ItemTemplate | null,
  jackpotFlip: 'item' | 'gems',
): DiceReward {
  if (roll <= 3) return { kind: 'nothing', gold: 0, gems: 0, item: null };
  if (roll <= 6) return { kind: 'gold', gold: 500, gems: 0, item: null };
  if (roll <= 9) return { kind: 'gold', gold: 1500, gems: 0, item: null };
  // 10 — jackpot. Pół na pół: item albo 20 gemów. Gdy pool rare items dla
  // tego poziomu pusty (np. L1 bez żadnych rare) — fallback na gemy, inaczej
  // gracz traci jackpot przez bug contentowy.
  if (jackpotFlip === 'gems') return { kind: 'gems', gold: 0, gems: 20, item: null };
  const item = itemPicker();
  if (!item) return { kind: 'gems', gold: 0, gems: 20, item: null };
  return { kind: 'rare_item', gold: 0, gems: 0, item };
}

/** Wybiera losową rare-rarity rzecz z REGISTRY.items dostępną dla gracza
 *  danego LVL. `classGate` filtruje broń na klasę (podobnie jak w shopie). */
export function pickRandomRareItem(
  charLvl: number,
  charCls: 'warrior' | 'mage' | 'rogue',
  rng: () => number = Math.random,
): ItemTemplate | null {
  const pool: ItemTemplate[] = [];
  for (const item of REGISTRY.items.values()) {
    if (item.rarity !== 'rare') continue;
    // Rough LVL filter — pomijamy itemy spoza pasma gracza. Shop używa +2
    // bufora; tu też, żeby pula przy L1 nie była pusta.
    const tier = inferRequiredLvl(item);
    if (tier > charLvl + 2) continue;
    if (item.allowedClasses && !item.allowedClasses.includes(charCls)) continue;
    pool.push(item);
  }
  if (pool.length === 0) return null;
  const idx = Math.floor(rng() * pool.length);
  return pool[idx] ?? null;
}

/** `ItemTemplate` nie ma pola `requiredLvl` wprost — rare items są z shop'a
 *  (shop_listings ma lvl) albo z loot pool'i (tier-based). Dla dice'a
 *  używamy heurystyki po ATK/DEF/MAG — proxy dla „jakiej klasy jest ten item".
 *  To pragmatyczne; alternatywa = przepisać REGISTRY żeby itemy miały lvl. */
function inferRequiredLvl(item: ItemTemplate): number {
  const stat = Math.max(item.atk ?? 0, item.def ?? 0, item.mag ?? 0);
  if (stat === 0) return 1; // potions, trinkety bez statów
  // Rough mapping — L6 rare ma staty ~14, L16 ~32, L28 ~58.
  if (stat <= 10) return 3;
  if (stat <= 15) return 6;
  if (stat <= 22) return 10;
  if (stat <= 30) return 15;
  if (stat <= 45) return 22;
  if (stat <= 60) return 30;
  return 40;
}

/** Pełny player-facing throw: rolluje, mapuje, zwraca nagrodę + sam roll
 *  żeby klient mógł go zaanimować. */
export function performDiceThrow(
  charLvl: number,
  charCls: 'warrior' | 'mage' | 'rogue',
  rng: () => number = Math.random,
): { roll: number; reward: DiceReward } {
  const roll = 1 + Math.floor(rng() * 10);
  const flip: 'item' | 'gems' = rng() < 0.5 ? 'item' : 'gems';
  const reward = rollToReward(roll, () => pickRandomRareItem(charLvl, charCls, rng), flip);
  return { roll, reward };
}
