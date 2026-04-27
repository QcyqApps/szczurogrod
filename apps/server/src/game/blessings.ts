// Mnich Panteleon — daily blessing buffs (Priorytet 7 z docs/features-vs-sf.md).
//
// Panteleon daje płatne krótkie buffy, słabsze niż elixiry z shop'a ale
// tańsze i natychmiastowe. Każda oferta mapuje się na istniejący `BuffKind`
// i używa `applyBuff` mechanizmu (override-per-kind) — dzięki czemu klient
// widzi je na ActiveBuffsBar tak samo jak elixiry.
//
// Cena skaluje się z LVL gracza — blessing ma kosztować ~1 quest na danym
// poziomie, inaczej L30+ kupowaliby je za drobne. Formuła poniżej
// (`computeBlessingCost`) matchuje gold income z quest'ów approximately.
//
// Balance vs elixiry (po scalingu):
//   - Elixir HP 25% 12h: 800g flat → ~67g/h per 25%
//   - Panteleon HP 10% 1h L10: ~500g → 500g/h per 10% (7.5× droższy per-hour
//     ale dostępny instant bez plecaka)
// Panteleon = taktyczny short-term; elixiry = inwestycja długoterminowa.
//
// Cooldown: 30 min między dowolnymi dwoma blessing'ami (max 2 aktywne naraz
// jeśli gracz czeka pełny cooldown).

import type { IconName } from '@grodno/shared';
import type { BuffKind } from './buffs.js';

export const BLESSING_COOLDOWN_MS = 30 * 60 * 1000; // 30 min

export interface BlessingOffer {
  id: string;
  name: string;
  desc: string;
  icon: IconName;
  kind: BuffKind;
  magnitude: number;
  durationHours: number;
  /** Baseline price przed skalowaniem LVL. `computeBlessingCost` liczy
   *  końcową cenę per-gracz. */
  costGoldBase: number;
}

export const BLESSINGS: readonly BlessingOffer[] = [
  // HP/DEF: base 100 — defensywny baseline.
  {
    id: 'b-hp',
    name: 'Błogosławieństwo Żywotności',
    desc: '+10% HP max na 1 godzinę.',
    icon: 'potion-hp-small',
    kind: 'hp_max_pct',
    magnitude: 10,
    durationHours: 1,
    costGoldBase: 100,
  },
  // MP/SPD: base 80 — mniej krytyczne staty, tańsze.
  {
    id: 'b-mp',
    name: 'Błogosławieństwo Many',
    desc: '+10% MP max na 1 godzinę.',
    icon: 'potion-first',
    kind: 'mp_max_pct',
    magnitude: 10,
    durationHours: 1,
    costGoldBase: 80,
  },
  // ATK/MAG: base 120 — offensywne staty, droższe (większy impact na DPS).
  {
    id: 'b-atk',
    name: 'Błogosławieństwo Ostrza',
    desc: '+8 ATK na 1 godzinę.',
    icon: 'sword',
    kind: 'atk_flat',
    magnitude: 8,
    durationHours: 1,
    costGoldBase: 120,
  },
  {
    id: 'b-def',
    name: 'Błogosławieństwo Tarczy',
    desc: '+8 DEF na 1 godzinę.',
    icon: 'helmet',
    kind: 'def_flat',
    magnitude: 8,
    durationHours: 1,
    costGoldBase: 100,
  },
  {
    id: 'b-mag',
    name: 'Błogosławieństwo Iskry',
    desc: '+10 MAG na 1 godzinę.',
    icon: 'bolt',
    kind: 'mag_flat',
    magnitude: 10,
    durationHours: 1,
    costGoldBase: 120,
  },
  {
    id: 'b-spd',
    name: 'Błogosławieństwo Szybkości',
    desc: '+5 SPD na 1 godzinę.',
    icon: 'boots',
    kind: 'spd_flat',
    magnitude: 5,
    durationHours: 1,
    costGoldBase: 80,
  },
];

/**
 * Formuła scalingu ceny. Zaprojektowana tak, żeby blessing kosztował ~1 quest
 * na danym LVL pasmie (grubo):
 *   L1  → base × 1.1
 *   L10 → base × 5
 *   L20 → base × 15
 *   L30 → base × 30
 *   L50 → base × 76
 * Dla HP base=100: L1=110g, L10=500g, L20=1500g, L30=3000g, L50=7600g.
 * Wzór `1 + lvl^1.6 / 10` — sweet spot między liniowym (za płaskim w endgame)
 * a wykładniczym (za stromym dla casualowych graczy).
 */
export function computeBlessingCost(costGoldBase: number, charLvl: number): number {
  const mult = 1 + Math.pow(Math.max(1, charLvl), 1.6) / 10;
  return Math.round(costGoldBase * mult);
}

/** Zwraca ofertę po ID albo null. */
export function getBlessing(id: string): BlessingOffer | null {
  return BLESSINGS.find((b) => b.id === id) ?? null;
}

/** Unix ms kiedy cooldown błogosławieństw się kończy. NULL = ready. */
export function blessingReadyAtMs(lastBlessingAt: Date | null, now: Date = new Date()): number | null {
  if (!lastBlessingAt) return null;
  const ready = lastBlessingAt.getTime() + BLESSING_COOLDOWN_MS;
  return ready > now.getTime() ? ready : null;
}
