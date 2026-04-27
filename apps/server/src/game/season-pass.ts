// Season Pass — Priorytet 8 z docs/features-vs-sf.md.
//
// 30-tierowy battle pass z miesięcznym resetem (UTC first-of-month).
// Dual track: free (wszyscy) + premium (wykupiony za gemy). Player dostaje
// XP za aktywności (combat wins + quest collects), zdobywa tier'y, claim'uje
// nagrody manualnie (więcej feedback loop niż auto-drop).
//
// XP źródła:
//   - combat.engage victory w dungeon = +1 XP
//   - quests.collect = +5 XP
// Tier progression: tier N wymaga 12*N XP (linear). Tier 30 = 360 XP total.
// Casual gracz z 15-30 XP/dzień robi 1-2 tiery dziennie → 12-24 dni na pełny.

import type { IconName } from '@grodno/shared';

/** Liczba tierów w sezonie. 30 = feels jak monthly pass. */
export const SEASON_PASS_TIER_COUNT = 30;

/** Cost premium unlock (gems). Post-audyt 2026-04: obniżone 500 → 300.
 *  500g = ~17 mies. F2P grindu (achievementy front-loaded), feeling overpriced
 *  vs tier 30 premium reward (~jeden legendary ring). 300g = ~9 mies. — premium
 *  to nadal heavy gem sink, ale realnie osiągalny dla aktywnego F2P na 2-3 sezon. */
export const SEASON_PASS_PREMIUM_COST_GEMS = 300;

/** XP per combat win. Niskie — gracz robi 20-50 walk dziennie. */
export const SEASON_PASS_XP_PER_COMBAT_WIN = 1;

/** XP per quest collect. Wyższe — questów jest mniej, dłużej trwają. */
export const SEASON_PASS_XP_PER_QUEST_COLLECT = 5;

export interface TierReward {
  gold?: number;
  gems?: number;
  xp?: number;
  keys?: number;
  /** Nazwa itemu (nie template_id — trzymamy loose-coupled, nazwy są w seed.ts). */
  itemName?: string;
  itemIcon?: IconName;
  itemRarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

/** Mnożnik XP per tier. 12 XP/tier (post-audyt 2026-04) — pierwotnie 10 było
 *  za szybkie dla grinderów (tier 30 w <24h). Przy 12:
 *    casual 15 XP/dzień → tier 30 w ~24 dni (good monthly pacing)
 *    dedicated 55 XP/dzień → ~7 dni (ok)
 *    grinder 150 XP/dzień → ~3 dni (akceptowalnie fast — engagement whale'a) */
export const SEASON_PASS_XP_PER_TIER = 12;

/** ile XP potrzeba żeby osiągnąć dany tier (1-indexed). */
export function xpRequiredForTier(tier: number): number {
  return Math.max(0, tier) * SEASON_PASS_XP_PER_TIER;
}

/** Jaki jest aktualny tier gracza z X XP. Zero-based bitmap indexing
 *  potem przechodzi przez bitmapę `1 << (tier - 1)`. */
export function tierFromXp(xp: number): number {
  return Math.min(
    SEASON_PASS_TIER_COUNT,
    Math.floor(Math.max(0, xp) / SEASON_PASS_XP_PER_TIER),
  );
}

// ===========================================================================
// Reward tables — 30 tierów × 2 tracks. Programatyczne generowanie z
// override'ami na milestone (5/10/15/20/25/30). Base'y skalują się z tier'em.
// ===========================================================================

export const FREE_TRACK: readonly TierReward[] = [
  // Tier 1-9: drobniaki
  { gold: 100, xp: 50 },
  { gold: 150, xp: 80 },
  { gold: 120, xp: 60, itemName: 'Mikstura HP', itemIcon: 'potion', itemRarity: 'common' },
  { gold: 200, xp: 100 },
  { gems: 5, gold: 150 }, // milestone 5
  { gold: 250, keys: 1 },
  { gold: 300, xp: 150 },
  { gold: 200, xp: 100, itemName: 'Mikstura Zielona', itemIcon: 'potion', itemRarity: 'common' },
  { gems: 5, gold: 250 },
  // Tier 10: milestone — rare potion
  { gold: 400, xp: 200, itemName: 'Mikstura Sezonu', itemIcon: 'potion-medium', itemRarity: 'rare' },
  // Tier 11-19
  { gold: 400, xp: 200 },
  { gems: 7, gold: 300 },
  { gold: 350, keys: 1 },
  { gold: 500, xp: 250 },
  { gems: 10, gold: 400, keys: 2 }, // milestone 15
  { gold: 600, xp: 300 },
  { gold: 450, xp: 200, itemName: 'Mikstura Wiązana', itemIcon: 'potion', itemRarity: 'common' },
  { gold: 700, xp: 350 },
  { gems: 10, gold: 500 },
  // Tier 20: milestone — rare item
  {
    gold: 800,
    xp: 400,
    itemName: 'Plecak Sezonowy',
    itemIcon: 'gift',
    itemRarity: 'rare',
  },
  // Tier 21-29
  { gold: 800, xp: 400 },
  { gems: 12, gold: 600 },
  { gold: 700, keys: 2 },
  { gold: 900, xp: 450 },
  { gems: 15, gold: 800, keys: 3 }, // milestone 25
  { gold: 1000, xp: 500 },
  { gold: 800, xp: 400, itemName: 'Mikstura Niespodzianki', itemIcon: 'potion-big', itemRarity: 'rare' },
  { gold: 1200, xp: 600 },
  { gems: 15, gold: 900 },
  // Tier 30: FINALE — legendarny finisz free track
  {
    gold: 5000,
    gems: 20,
    xp: 1500,
    itemName: 'Trofeum Sezonu',
    itemIcon: 'crown',
    itemRarity: 'legendary',
  },
];

export const PREMIUM_TRACK: readonly TierReward[] = [
  // Premium = roughly 2-3× free. Jeszcze częstsze gemy, rzadsze itemy, zwieńczenie legendary.
  // Tier 1-9
  { gold: 200, gems: 5 },
  { gold: 250, gems: 3, xp: 150 },
  { gold: 200, xp: 100, itemName: 'Mikstura Premium I', itemIcon: 'potion', itemRarity: 'common' },
  { gold: 500, gems: 5 },
  { gems: 10, gold: 300, itemName: 'Eliksir Sezonowy', itemIcon: 'potion-medium', itemRarity: 'rare' }, // milestone 5
  { gold: 400, gems: 5, keys: 1 },
  { gold: 600, xp: 200 },
  { gold: 500, xp: 200, itemName: 'Mikstura Premium II', itemIcon: 'potion-beet', itemRarity: 'common' },
  { gems: 10, gold: 500 },
  // Tier 10: milestone premium — epic potion
  {
    gold: 800,
    xp: 400,
    itemName: 'Wielka Mikstura Premium',
    itemIcon: 'potion-big',
    itemRarity: 'epic',
  },
  // Tier 11-19
  { gold: 1000, gems: 5, xp: 300 },
  { gems: 15, gold: 500 },
  { gold: 800, xp: 300, itemName: 'Mikstura Premium III', itemIcon: 'potion-black', itemRarity: 'rare' },
  { gold: 1500, xp: 500 },
  { gems: 20, gold: 800, keys: 5 }, // milestone 15
  { gold: 2000, gems: 10 },
  { gold: 1200, xp: 400, itemName: 'Mikstura Premium IV', itemIcon: 'potion-forest', itemRarity: 'rare' },
  { gold: 2500, xp: 600 },
  { gems: 20, gold: 1000 },
  // Tier 20: milestone — epic item
  {
    gold: 3000,
    gems: 15,
    xp: 800,
    itemName: 'Pas Sezonowego Mistrza',
    itemIcon: 'amulet-catacombs',
    itemRarity: 'epic',
  },
  // Tier 21-29
  { gold: 3000, gems: 15, xp: 700 },
  { gems: 25, gold: 1500 },
  { gold: 2500, xp: 600, itemName: 'Mikstura Premium V', itemIcon: 'potion-marsh', itemRarity: 'rare' },
  { gold: 3500, keys: 10 },
  { gems: 30, gold: 2000, keys: 5 }, // milestone 25
  { gold: 4000, gems: 20, xp: 1000 },
  { gold: 3000, xp: 800, itemName: 'Wywar Premium', itemIcon: 'potion-black-big', itemRarity: 'epic' },
  { gold: 5000, gems: 30, xp: 1200 },
  { gems: 40, gold: 3000 },
  // Tier 30: FINALE premium — legendary item + big gem dump
  {
    gold: 15000,
    gems: 50,
    xp: 3000,
    itemName: 'Pierścień Sezonowego Władcy',
    itemIcon: 'ring-old-gods',
    itemRarity: 'legendary',
  },
];

// ===========================================================================
// Season start helper — UTC first-of-month ISO date.
// ===========================================================================

export function currentSeasonStart(now: Date = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

// ===========================================================================
// Bitmap helpers — 30 tierów mieści się w int32 z zapasem.
// ===========================================================================

/** Czy tier (1-indexed) jest odebrany w bitmapie? */
export function isTierClaimed(bitmap: number, tier: number): boolean {
  if (tier < 1 || tier > 31) return false;
  return (bitmap & (1 << (tier - 1))) !== 0;
}

/** Mark tier (1-indexed) jako claim'ed. Returns new bitmap. */
export function markTierClaimed(bitmap: number, tier: number): number {
  if (tier < 1 || tier > 31) return bitmap;
  return bitmap | (1 << (tier - 1));
}

/** Nagroda z odpowiedniego track'a dla danego tier'a (1-indexed). */
export function getTierReward(tier: number, track: 'free' | 'premium'): TierReward | null {
  if (tier < 1 || tier > SEASON_PASS_TIER_COUNT) return null;
  const arr = track === 'free' ? FREE_TRACK : PREMIUM_TRACK;
  return arr[tier - 1] ?? null;
}
