// Klątwy — ujemne warianty buff_kind. Spawnują się po przegranej z bossem
// (tier ≥ 3); Baba Jaga zdejmuje je za gold w router `witch`.
//
// Dzielą tabelę `character_buffs` z pozytywnymi buff'ami — `is_curse=true`
// flaga odróżnia je. Magnitude jest zawsze DODATNIE w DB, znak dokłada
// `aggregateBuffs`.

import type { BuffKind } from './buffs.js';

export interface CurseTemplate {
  slug: string;
  kind: BuffKind;
  /** Dodatnia wartość; aggregateBuffs odejmie ją od deltek. */
  magnitude: number;
  name: string;
  desc: string;
  /** Ile godzin trwa klątwa jeśli gracz jej nie zdejmie. */
  durationHours: number;
}

export const CURSES: readonly CurseTemplate[] = [
  {
    slug: 'curse-weakness',
    kind: 'atk_flat',
    magnitude: 5,
    name: 'Klątwa Słabości',
    desc: 'Miecz waży dwa razy więcej. -5 ATK.',
    durationHours: 24,
  },
  {
    slug: 'curse-fragility',
    kind: 'def_flat',
    magnitude: 5,
    name: 'Klątwa Kruchości',
    desc: 'Pancerz trzyma się na słowo honoru. -5 DEF.',
    durationHours: 24,
  },
  {
    slug: 'curse-impotence',
    kind: 'mag_flat',
    magnitude: 6,
    name: 'Klątwa Niemocy',
    desc: 'Zaklęcia nie chcą się kleić. -6 MAG.',
    durationHours: 24,
  },
  {
    slug: 'curse-sluggish',
    kind: 'spd_flat',
    magnitude: 3,
    name: 'Klątwa Ociężałości',
    desc: 'Nogi robią się z ołowiu. -3 SPD.',
    durationHours: 24,
  },
  {
    slug: 'curse-anguish',
    kind: 'hp_max_pct',
    magnitude: 10,
    name: 'Klątwa Udręki',
    desc: 'Rany się nie goją jak powinny. -10% HP max.',
    durationHours: 24,
  },
  {
    slug: 'curse-empty-head',
    kind: 'mp_max_pct',
    magnitude: 15,
    name: 'Klątwa Pustej Głowy',
    desc: 'Pamięć dziurawa jak sito. -15% MP max.',
    durationHours: 24,
  },
];

/**
 * Prawdopodobieństwo że boss zostawi klątwę po swojej wygranej z graczem.
 * Post-audyt 2026-04: 25% → 15%. Sweet spot dostrojony — 25% spawnowało
 * klątwę co 4 walkę, co dla learning-phase Tower/Q5/Q10 wytwarzało
 * frustration spiral (przegrał → klątwa → następna walka jeszcze trudniejsza).
 * 15% odpowiada balansowi S&F i daje gracza poczuć klątwy raz na sesję
 * (8-15 prób), nie raz na minutę.
 */
export const CURSE_SPAWN_CHANCE = 0.15;

/** Tier wroga od którego klątwy mogą się odpalać. Tier 1-2 mobs nie rzucają. */
export const CURSE_MIN_TIER = 3;

/** Pure: czy po przegranej z tym wrogiem rzucić klątwę? */
export function shouldSpawnCurse(enemyTier: number, rng: () => number = Math.random): boolean {
  if (enemyTier < CURSE_MIN_TIER) return false;
  return rng() < CURSE_SPAWN_CHANCE;
}

/** Pure: wybór losowej klątwy z puli. */
export function rollCurse(rng: () => number = Math.random): CurseTemplate {
  const idx = Math.floor(rng() * CURSES.length);
  return CURSES[idx] ?? CURSES[0]!;
}

/** Zwraca klątwę po slugu (dla UI / Baby Jagi do nazwy). */
export function getCurse(slug: string): CurseTemplate | null {
  return CURSES.find((c) => c.slug === slug) ?? null;
}
