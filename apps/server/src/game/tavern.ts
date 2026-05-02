// Tavern: companion catalog + rotating rumors. Companions provide combat buffs
// applied server-side in combat.engage.

import type { CompanionOffer } from '@grodno/shared';
import { REGISTRY } from '../content/registry.js';

export interface CompanionBuff {
  atkBonus?: number;
  magBonus?: number;
  lootBonusPct?: number;
  /** 0..1 fractional bonus on potion healing (e.g. 0.2 → +20% HP/MP per potion). */
  healBonus?: number;
}

export interface CompanionTemplate extends CompanionOffer {
  buff: CompanionBuff;
}

export const COMPANIONS: readonly CompanionTemplate[] = [
  {
    slug: 'zofia',
    name: 'Brodata Zofia',
    cls: 'warrior',
    lvl: 7,
    price: 420,
    trait: '+5 ATK w lochach',
    buff: { atkBonus: 5 },
  },
  {
    slug: 'cichobieg',
    name: 'Cichobieg',
    cls: 'rogue',
    lvl: 6,
    price: 380,
    trait: '+12% szansy na rzadki loot',
    buff: { lootBonusPct: 12 },
  },
  {
    slug: 'olaf',
    name: 'Stary Olaf',
    cls: 'mage',
    lvl: 8,
    price: 550,
    trait: '+8 MAG, mikstury leczą +20%',
    buff: { magBonus: 8, healBonus: 0.2 },
  },
  // ========== Companions dla akt-3 / akt-4 ==========
  {
    slug: 'gretka-rzepnica',
    name: 'Gretka z Rzepnicy',
    cls: 'warrior',
    lvl: 10,
    price: 900,
    trait: '+9 ATK, +4% rzadkiego łupu',
    buff: { atkBonus: 9, lootBonusPct: 4 },
  },
  {
    slug: 'mnich-blazej',
    name: 'Mnich Błażej',
    cls: 'mage',
    lvl: 13,
    price: 1200,
    trait: 'Mikstury leczą +40%, +4 MAG',
    buff: { magBonus: 4, healBonus: 0.4 },
  },
  {
    slug: 'wilk-balwan',
    name: 'Wilk Bałwan',
    cls: 'rogue',
    lvl: 16,
    price: 1800,
    trait: '+20% rzadkiego łupu, +5 ATK',
    buff: { atkBonus: 5, lootBonusPct: 20 },
  },
  {
    slug: 'matka-zosia',
    name: 'Matka Zosia',
    cls: 'mage',
    lvl: 20,
    price: 2800,
    trait: '+14 MAG, mikstury leczą +50%',
    buff: { magBonus: 14, healBonus: 0.5 },
  },
  // ========== Companions dla akt-4 / Bagna ==========
  {
    slug: 'klemens-topor',
    name: 'Klemens Topór',
    cls: 'warrior',
    lvl: 25,
    price: 4500,
    trait: '+12 ATK, +5% rzadkiego łupu',
    buff: { atkBonus: 12, lootBonusPct: 5 },
  },
  {
    slug: 'sieroszka-bezimienna',
    name: 'Sieroszka Bezimienna',
    cls: 'rogue',
    lvl: 30,
    price: 7500,
    trait: '+25% rzadkiego łupu, +8 ATK',
    buff: { atkBonus: 8, lootBonusPct: 25 },
  },
  {
    slug: 'eustachy-mnich',
    name: 'Eustachy Pijany Mnich',
    cls: 'mage',
    lvl: 36,
    price: 13000,
    trait: '+18 MAG, mikstury leczą +55%',
    buff: { magBonus: 18, healBonus: 0.55 },
  },
  // ========== Companions dla Bagien / Granii ==========
  {
    slug: 'hetman-wojciech',
    name: 'Hetman Wojciech',
    cls: 'warrior',
    lvl: 42,
    price: 22000,
    trait: '+22 ATK, +8% rzadkiego łupu',
    buff: { atkBonus: 22, lootBonusPct: 8 },
  },
  {
    slug: 'halina-cichodusza',
    name: 'Halina Cichodusza',
    cls: 'rogue',
    lvl: 48,
    price: 38000,
    trait: '+30% rzadkiego łupu, +13 ATK',
    buff: { atkBonus: 13, lootBonusPct: 30 },
  },
  {
    slug: 'wiedzma-praska',
    name: 'Stara Wiedźma Praska',
    cls: 'mage',
    lvl: 54,
    price: 60000,
    trait: '+27 MAG, mikstury leczą +65%',
    buff: { magBonus: 27, healBonus: 0.65 },
  },
  {
    slug: 'tytus-niezlomny',
    name: 'Tytus Niezłomny',
    cls: 'warrior',
    lvl: 60,
    price: 95000,
    trait: '+33 ATK, +12% rzadkiego łupu',
    buff: { atkBonus: 33, lootBonusPct: 12 },
  },
];

export function getCompanion(slug: string): CompanionTemplate | null {
  return REGISTRY.companions.get(slug) ?? null;
}

/**
 * Ile kompanów pokazujemy w ofercie tawerny per gracz. Wybierane deterministycznie
 * z całego registry przez (characterId + date + nonce). Mniej niż liczba registry
 * = "refresh" ma sens (cycle przez resztę).
 */
export const COMPANION_OFFER_SIZE = 5;

interface CompanionOfferCacheEntry {
  date: string;
  nonce: number;
  offer: CompanionOffer[];
}

const COMPANION_OFFER_CACHE = new Map<string, CompanionOfferCacheEntry>();

// Mała seedowalna PRNG (mulberry32) — deterministyczny shuffle bez external deps.
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input: string): number {
  // Simple xmur3 — wystarczy jako seed dla mulberry32.
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function templateToOffer(t: CompanionTemplate): CompanionOffer {
  return {
    slug: t.slug,
    name: t.name,
    cls: t.cls,
    lvl: t.lvl,
    price: t.price,
    trait: t.trait,
  };
}

function buildOffer(characterId: string, date: string, nonce: number): CompanionOffer[] {
  const all = [...REGISTRY.companions.values()].map(templateToOffer);
  if (all.length <= COMPANION_OFFER_SIZE) return all;
  const seed = hashSeed(`${characterId}|${date}|${nonce}`);
  const rng = mulberry32(seed);
  // Fisher-Yates seedowany shuffle.
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = all[i]!;
    all[i] = all[j]!;
    all[j] = tmp;
  }
  return all.slice(0, COMPANION_OFFER_SIZE);
}

/**
 * Daily-rotated subset of companions for `characterId`. Cached in-memory dla
 * tego samego dnia — wszystkie wywołania w obrębie dnia zwracają tę samą listę,
 * dopóki gracz nie wywoła `rerollCompanionOffer`.
 */
export function getCompanionOffer(characterId: string, today: string): CompanionOffer[] {
  const cached = COMPANION_OFFER_CACHE.get(characterId);
  if (cached && cached.date === today) return cached.offer;
  const nonce = 0;
  const offer = buildOffer(characterId, today, nonce);
  COMPANION_OFFER_CACHE.set(characterId, { date: today, nonce, offer });
  return offer;
}

/**
 * Inkrementuje nonce dla gracza i zwraca nowy zestaw kompanów. Nonce zawsze
 * skacze o 1, więc przy registry.size > offer_size każdy reroll widać.
 */
export function rerollCompanionOffer(characterId: string, today: string): CompanionOffer[] {
  const cached = COMPANION_OFFER_CACHE.get(characterId);
  const nonce = (cached?.date === today ? cached.nonce : 0) + 1;
  const offer = buildOffer(characterId, today, nonce);
  COMPANION_OFFER_CACHE.set(characterId, { date: today, nonce, offer });
  return offer;
}

/** How long the tavern healer sleeps off the ale before the next visit. */
export const HEALER_COOLDOWN_MS = 60 * 60 * 1000;

/**
 * Gold cost of a full-heal visit to the tavern healer. Base 100 + 25 × level —
 * a serious dent at L1 (125 g = ~2 mob kills), roughly fair at L15 (475 g).
 */
export function computeHealerCost(lvl: number): number {
  return 100 + lvl * 25;
}

// Rumor pools keyed by chapter. Player currently in Akt I sees Akt I plotki;
// Akt II unlocks Las Kunowy rumors, Akt III unlocks Katakumby.
const RUMORS_AKT_1: readonly string[] = [
  'Wiedźma przyjmuje grzyby. Tylko prawdziwki, dziś nie bierze kurek.',
  'Szczur w piwnicy piekarza czyta po łacinie. Pytał o sery.',
  'Burmistrz stracił pieczątkę. Znowu.',
  'Goblin w lochach gra na flecie. Daje się zagadać.',
  'Na rynku kupiec sprzedaje „legendarny miecz”. Chyba z drewna.',
  'Karczmarz nie śpi od tygodnia. Podobno coś słyszał.',
  'Kuny w młynie nauczyły się czytać rachunki. Młynarz niepocieszony.',
  'Podobno pod starym dębem kopali skarb. Z 3 metry. I nic.',
];

const RUMORS_AKT_2: readonly string[] = [
  'Mgła nad stawem mówi po francusku. Tłumacz zagubiony.',
  'Fairy ring w lesie. Kto stanie, ten tańczy. Kto tańczy, ten tańczy dłużej.',
  'Magowie z Wieży znów eksperymentują z serem. Uciekać.',
  'Kot kowalowej widziany ostatnio z butelką wina. Kowal twierdzi, że kot nie pije.',
  'Troll pod mostem bierze myto w oscypkach. Twardych oscypkach.',
  'Pająki w jaskiniach tkają coś większego niż sieć. Coś z haftem.',
];

const RUMORS_AKT_3: readonly string[] = [
  'W katakumbach pod katedrą ktoś stuka. Ojciec Tadeusz nie odpisuje.',
  'Lustro w gabinecie burmistrza pokazuje kogoś innego. Burmistrz unika lustra.',
  'Nieumarli głosują w wyborach. Zawsze na tego samego kandydata.',
  'Pustka szepcze imiona. Twoje też. Nie odpowiadaj.',
  'Hobgoblin King ogłosił podatki. Na wszystko. Zwłaszcza na oddychanie.',
  'Kościany smok śpi pod wzgórzem. Tak przynajmniej głosi legenda. I chrapie.',
];

function poolsForChapter(chapter: 'akt-1' | 'akt-2' | 'akt-3' | 'akt-4' | 'akt-5' | 'akt-6'): readonly string[] {
  // Akt II gracz widzi też plotki Akt I (stare problemy wracają),
  // Akt III widzi wszystko. Gracz w wyższych rozdziałach dostaje bogatszy pool.
  if (chapter === 'akt-3') return [...RUMORS_AKT_1, ...RUMORS_AKT_2, ...RUMORS_AKT_3];
  if (chapter === 'akt-2') return [...RUMORS_AKT_1, ...RUMORS_AKT_2];
  return RUMORS_AKT_1;
}

/**
 * Deterministic daily shuffle. `chapter` biases which pool is drawn from;
 * `isoDate` makes rumors stable per calendar day.
 */
export function getRumorsForDate(
  isoDate: string,
  count = 3,
  chapter: 'akt-1' | 'akt-2' | 'akt-3' | 'akt-4' | 'akt-5' | 'akt-6' = 'akt-1',
): string[] {
  const pool = poolsForChapter(chapter);
  const seed = [...isoDate, '|', chapter].reduce(
    (acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0,
    0,
  );
  const shuffled = [...pool];
  let rand = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    rand = (rand * 1664525 + 1013904223) >>> 0;
    const j = rand % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
