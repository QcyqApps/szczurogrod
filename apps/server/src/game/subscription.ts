// Szczurogród+ subskrypcja — premium status dający +20% XP do wszystkich
// źródeł (questy, walka, daily, praca, season pass, oracle, survivor).
//
// Aktywność: `now < character.szczurogrodPlusUntil`. Sprzedaż w gemach
// (helper poniżej + endpoint `me.buySzczurogrodPlus`). Nie używa buff
// systemu (timed elixiry), bo subskrypcja żyje dni-tygodnie i nie wpada
// w `me.get` lazy-purge.
//
// Anti-stacking: `extendSubscription` cap'uje przyszły until na +90 dni
// od now, żeby gracz nie kupował 100× i nie gromadził lifetime'u nigdy
// nie używając. Brak "rolling renewal" — każdy buy jest osobnym
// wydłużeniem, ale stack ograniczony.
//
// Multiplier wpinany jest w call-site'y `applyXpGain` przez
// `applyXpBonus(char, xp)` — wszystkie 7 routerów używających XP.

const PLUS_XP_BONUS_PCT = 20;
export const SZCZUROGROD_PLUS_PRICE_GEMS = 200;
export const SZCZUROGROD_PLUS_DURATION_DAYS = 30;
export const SZCZUROGROD_PLUS_MAX_STACK_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface SubscriptionSlice {
  szczurogrodPlusUntil: Date | null;
}

/**
 * True gdy subskrypcja aktywna w danej chwili. Lazy-check — brak
 * background job'a do wygaszania.
 */
export function isSzczurogrodPlusActive(
  char: SubscriptionSlice,
  now: Date = new Date(),
): boolean {
  return char.szczurogrodPlusUntil !== null && char.szczurogrodPlusUntil > now;
}

/**
 * Mnoży `xp` przez (1 + 0.20) gdy subskrypcja aktywna. Zaokrąglone w górę,
 * żeby gracz nie tracił ułamka od baz typu xp=1.
 */
export function applyXpBonus(
  char: SubscriptionSlice,
  xp: number,
  now: Date = new Date(),
): number {
  if (!isSzczurogrodPlusActive(char, now)) return xp;
  return Math.ceil(xp * (1 + PLUS_XP_BONUS_PCT / 100));
}

/**
 * Liczy nowy `szczurogrodPlusUntil` po zakupie. Cap na 90 dni od `now`
 * w przyszłość — anti-stacking. Jeśli gracz kupuje gdy ma jeszcze ważną
 * subskrypcję, nowe dni dokładają się od `until`, nie od `now`.
 */
export function extendSubscription(
  currentUntil: Date | null,
  daysToAdd: number,
  now: Date = new Date(),
): Date {
  const baseMs = currentUntil && currentUntil > now ? currentUntil.getTime() : now.getTime();
  const proposedUntil = baseMs + daysToAdd * DAY_MS;
  const cap = now.getTime() + SZCZUROGROD_PLUS_MAX_STACK_DAYS * DAY_MS;
  return new Date(Math.min(proposedUntil, cap));
}
