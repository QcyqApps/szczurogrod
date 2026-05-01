// "Praca" — długoterminowe idle questy.
//
// Gracz wybiera zlecenie (kind) + długość (1, 2, 4, 8h). Postać "idzie do pracy",
// po upływie czasu odbiera zapłatę. Można też wyjść wcześniej i wziąć część.
//
// Server-authoritative: czas walidowany przy claim'ie/cancel'u (Date.now() vs
// work_ends_at), nagrody liczone serwer-side, klient widzi tylko preview.

export const WORK_DURATIONS_HOURS = [1, 2, 4, 8] as const;
export type WorkDurationHours = (typeof WORK_DURATIONS_HOURS)[number];

/**
 * Bazowa stawka per godzinę: 80g/lvl + 35xp/lvl.
 * Każde zlecenie skaluje to przez goldMul/xpMul — daje to różne profile:
 * tragarz wozi worki za pieniądze, stróż uczy się czujności za grosze.
 *
 * Comparison points (L20, 4h):
 * - tragarz:  9600g + 1400xp  (gold-heavy, slabe xp)
 * - piekarz:  5760g + 4480xp  (xp-leaning, balanced)
 * - stroz:    3840g + 5600xp  (xp-heavy, niska zapłata)
 * - rolnik:   6400g + 2800xp  (baseline, średnio średnio)
 */
export const WORK_KINDS = [
  {
    slug: 'tragarz',
    name: 'Tragarz w porcie',
    flavor: 'Worki, beczki, skrzynie. Płacą od sztuki.',
    goldMul: 1.5,
    xpMul: 0.5,
  },
  {
    slug: 'piekarz',
    name: 'Pomocnik piekarza',
    flavor: 'Mąka wszędzie. W oczach też. Ale człowiek się czegoś uczy.',
    goldMul: 0.9,
    xpMul: 1.6,
  },
  {
    slug: 'stroz',
    name: 'Nocny stróż',
    flavor: 'Drzemka liczy się jako patrol. Refleks ostrzy się sam.',
    goldMul: 0.6,
    xpMul: 2.0,
  },
  {
    slug: 'rolnik',
    name: 'Pomocnik rolnika',
    flavor: 'Świnie nie pomagają. Zarobek skromny, ale uczciwy.',
    goldMul: 1.0,
    xpMul: 1.0,
  },
] as const;
export type WorkKindDef = (typeof WORK_KINDS)[number];
export type WorkKindSlug = WorkKindDef['slug'];

const BASE_GOLD_PER_HOUR_PER_LVL = 80;
const BASE_XP_PER_HOUR_PER_LVL = 35;

export function isValidDuration(h: number): h is WorkDurationHours {
  return (WORK_DURATIONS_HOURS as readonly number[]).includes(h);
}

export function isValidKind(slug: string): slug is WorkKindSlug {
  return WORK_KINDS.some((k) => k.slug === slug);
}

export function getKind(slug: string): WorkKindDef | null {
  return WORK_KINDS.find((k) => k.slug === slug) ?? null;
}

/**
 * Pełna nagroda za ukończoną pracę (lvl × hours × per-kind multiplier).
 */
export function computeReward(
  lvl: number,
  hours: WorkDurationHours,
  kindSlug: WorkKindSlug,
): { gold: number; xp: number } {
  const kind = getKind(kindSlug);
  const gMul = kind?.goldMul ?? 1;
  const xMul = kind?.xpMul ?? 1;
  return {
    gold: Math.round(BASE_GOLD_PER_HOUR_PER_LVL * lvl * hours * gMul),
    xp: Math.round(BASE_XP_PER_HOUR_PER_LVL * lvl * hours * xMul),
  };
}

/**
 * Nagroda częściowa — przy wcześniejszym wyjściu. Pro-rated po elapsed/total.
 * Zwraca też ułamek czasu (0..1) do UI.
 */
export function computePartialReward(
  lvl: number,
  hours: WorkDurationHours,
  kindSlug: WorkKindSlug,
  elapsedMs: number,
): { gold: number; xp: number; fraction: number } {
  const totalMs = hours * 3_600_000;
  const fraction = Math.max(0, Math.min(1, elapsedMs / totalMs));
  const full = computeReward(lvl, hours, kindSlug);
  return {
    gold: Math.floor(full.gold * fraction),
    xp: Math.floor(full.xp * fraction),
    fraction,
  };
}

export function durationMs(hours: WorkDurationHours): number {
  return hours * 3600 * 1000;
}

/**
 * True jeśli postać aktualnie pracuje (niezależnie od ready/nie-ready).
 * Używane do blokowania walk we wszystkich routerach combat-flavored.
 */
export function isWorking(char: {
  workStartedAt: Date | null;
  workEndsAt: Date | null;
}): boolean {
  return char.workStartedAt !== null && char.workEndsAt !== null;
}

export const WORKING_BLOCKS_COMBAT_MESSAGE =
  'Pracujesz. Wróć do tablicy pracy żeby skończyć albo wyjść.';

