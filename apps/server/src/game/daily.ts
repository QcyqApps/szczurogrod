import type { IconName } from '@grodno/shared';

export interface DailyDayReward {
  kind: 'gold' | 'xp' | 'potion' | 'gem' | 'gift' | 'crown';
  v: string | number;
  gold?: number;
  gems?: number;
  xp?: number;
  /** Dungeon keys awarded on claim. 0 or missing = none. */
  keys?: number;
  itemName?: string;
  itemIcon?: IconName;
  itemRarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

// 28-day rotating reward calendar. Milestone days oznaczone w komentarzu —
// gracz widzi je na grid'zie jako highlight (7 = gem spike, 14 = rzadki łup,
// 21 = klucze + gemy, 28 = legendarny finisz). Scaling rośnie stopniowo;
// gold jest skalowany przez `levelMultiplier` (daily.ts router), gemy NIE
// skalują — są stałe.
//
// Dni 1-7: łagodne wejście, znane z poprzedniej wersji 7-day streaka (delty
// zachowane w większości). Dzień 7 był "finał tygodnia" — teraz staje się
// mniejszym milestone'em w ramach większego miesiąca.
// Dni 8-14: escalacja — więcej gold'a, pierwsza rare'owa rzecz na 14.
// Dni 15-21: mid-streak, gemy + klucze.
// Dni 22-28: endgame tier z legendarnym finishem.
export const DAILY_LADDER: readonly DailyDayReward[] = [
  // === Tydzień 1 ===
  { kind: 'gold', v: 150, gold: 150, xp: 80 },
  { kind: 'xp', v: 80, gold: 60, xp: 120 },
  {
    kind: 'potion',
    v: 'x2',
    gold: 80,
    xp: 60,
    keys: 2,
    itemName: 'Mikstura HP',
    itemIcon: 'potion',
    itemRarity: 'common',
  },
  { kind: 'gold', v: 300, gold: 300, xp: 100 },
  { kind: 'gem', v: 3, gold: 100, gems: 3, xp: 80 },
  {
    kind: 'gift',
    v: '',
    gold: 200,
    xp: 150,
    itemName: 'Pakiet Niespodzianka',
    itemIcon: 'gift',
    itemRarity: 'rare',
  },
  // Milestone dzień 7 — gemy + solid gold. Poprzednia wersja dawała Koronę
  // Tygodnia; przesuwamy rarytas później (dzień 14) żeby finał był ostrzejszy.
  { kind: 'gem', v: 7, gold: 400, gems: 7, xp: 250 },
  // === Tydzień 2 ===
  { kind: 'gold', v: 250, gold: 250, xp: 180 },
  {
    kind: 'potion',
    v: 'x1',
    gold: 180,
    xp: 220,
    itemName: 'Mikstura Zielona',
    itemIcon: 'potion',
    itemRarity: 'common',
  },
  { kind: 'gold', v: 500, gold: 500, xp: 250 },
  { kind: 'gem', v: 5, gold: 220, gems: 5, xp: 200 },
  { kind: 'gold', v: 380, gold: 380, xp: 280 },
  {
    kind: 'potion',
    v: 'x1',
    gold: 300,
    xp: 300,
    itemName: 'Eliksir Średniotygodniowy',
    itemIcon: 'potion-medium',
    itemRarity: 'rare',
  },
  // Milestone dzień 14 — gwarantowany rare item. Korona Tygodnia (epic
  // wcześniej), teraz renamed na odzwierciedlenie cyklu.
  {
    kind: 'crown',
    v: 1,
    gold: 500,
    gems: 10,
    xp: 400,
    itemName: 'Korona Tygodnia',
    itemIcon: 'crown',
    itemRarity: 'rare',
  },
  // === Tydzień 3 ===
  { kind: 'gold', v: 400, gold: 400, xp: 350 },
  { kind: 'gem', v: 8, gold: 350, gems: 8, xp: 400 },
  { kind: 'gold', v: 600, gold: 600, xp: 450 },
  {
    kind: 'potion',
    v: 'x1',
    gold: 500,
    xp: 500,
    itemName: 'Eliksir Trzeciotygodniowy',
    itemIcon: 'potion-big',
    itemRarity: 'epic',
  },
  { kind: 'gold', v: 450, gold: 450, xp: 550 },
  { kind: 'gem', v: 10, gold: 700, gems: 10, xp: 600 },
  // Milestone dzień 21 — gemy + klucze + zapas gold'a. Klucze rzadko dawane,
  // tu jednorazowy boost 5 kluczy żeby gracz mógł zagrać dużo lochów tego dnia.
  {
    kind: 'gift',
    v: '',
    gold: 600,
    gems: 15,
    keys: 5,
    xp: 700,
  },
  // === Tydzień 4 ===
  { kind: 'gold', v: 800, gold: 800, xp: 800 },
  { kind: 'gem', v: 10, gold: 700, gems: 10, xp: 900 },
  { kind: 'gold', v: 1000, gold: 1000, xp: 1000 },
  {
    kind: 'potion',
    v: 'x1',
    gold: 900,
    xp: 1100,
    itemName: 'Mikstura Czwartotygodniowa',
    itemIcon: 'potion-black',
    itemRarity: 'epic',
  },
  { kind: 'gem', v: 12, gold: 1200, gems: 12, xp: 1200 },
  { kind: 'gold', v: 1100, gold: 1100, keys: 3, xp: 1400 },
  // Milestone dzień 28 — legendarny finisz. Korona Miesiąca, legendary,
  // uniwersalna (head slot). Gracz który wytrzymał 28 dni pod rząd dostaje
  // porządną nagrodę + duży gem dump.
  {
    kind: 'crown',
    v: 1,
    gold: 2000,
    gems: 30,
    xp: 2000,
    itemName: 'Korona Miesiąca',
    itemIcon: 'crown-undead',
    itemRarity: 'legendary',
  },
];

// ISO YYYY-MM-DD in UTC — day boundary is midnight UTC for simplicity.
// For production we'd anchor to player's timezone; UTC avoids ambiguity for demo.
export function isoDateUTC(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const da = Date.parse(`${a}T00:00:00Z`);
  const db = Date.parse(`${b}T00:00:00Z`);
  return Math.round((db - da) / 86_400_000);
}

/** Ile dni trzyma się streak zanim zaczyna loop'ować od początku. 28 =
 *  28-dniowy kalendarz, dopasowane do cyklu miesięcznego. */
export const DAILY_STREAK_CAP = 28;

/** Given last claim date and streak, what's the effective streak for `today` claim. */
export function computeStreakForToday(
  lastClaimDate: string | null,
  previousStreak: number,
  today: string,
): number {
  if (!lastClaimDate) return 1;
  const diff = daysBetween(lastClaimDate, today);
  if (diff <= 0) return previousStreak; // same day — shouldn't happen (claim blocked)
  if (diff === 1) return Math.min(DAILY_STREAK_CAP, previousStreak + 1); // ladder loops at day 28
  return 1; // gap broke the streak
}

export function dayToLadderIndex(streakDay: number): number {
  // streakDay is 1..DAILY_STREAK_CAP, array is 0..DAILY_STREAK_CAP-1
  return Math.max(0, Math.min(DAILY_STREAK_CAP - 1, streakDay - 1));
}
