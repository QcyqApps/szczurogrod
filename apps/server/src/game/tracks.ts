// Tropy — aktywne leady na konkretne moby w lochu. Gracz ma max 3 sloty, każdy
// z TTL 2h. Walka z wytropionym mobem: gold×2, xp×2, drop-rate×1.5. Sloty
// odświeżają się automatycznie co godzinę (jeśli którykolwiek jest pusty)
// — wzorzec z `game/regen.ts` / `game/dungeon-keys.ts`.
//
// Reroll pojedynczego slotu kosztuje `TRACK_REROLL_GEM_COST = 10` gemów.

import { REGISTRY } from '../content/registry.js';

/** Maksymalna liczba slotów tropów. */
export const TRACK_SLOTS_MAX = 3;
/** Jak długo aktywny trop jest ważny. */
export const TRACK_TTL_MS = 2 * 60 * 60 * 1000;
/** Co jak długo pusty slot regeneruje nowego tropa. */
export const TRACK_ROLL_INTERVAL_MS = 60 * 60 * 1000;
/** Koszt rerolla jednego slotu. */
export const TRACK_REROLL_GEM_COST = 10;

/** Bonusy stosowane w `combat.applyVictoryReward` gdy mob był wytropiony. */
export const TRACK_GOLD_MULT = 2;
export const TRACK_XP_MULT = 2;
export const TRACK_DROP_RATE_MULT = 1.5;

export interface TrackRegenResult {
  /** Ile tropów dolosować w tym teraz (ograniczone liczbą wolnych slotów). */
  gained: number;
  /** Timestamp do zapisu — advance tylko o skonsumowane tiki. */
  lastRollAt: Date;
}

/**
 * Gdyby wszystkie 3 sloty były przez jakiś czas wypełnione, nikt by nie
 * "tracił" regenu — tiki liczą się tylko gdy slot jest pusty. Proste:
 * - `elapsed / interval` = teoretyczne tiki
 * - capujemy do liczby wolnych slotów
 * - advance'ujemy `lastRollAt` tylko o faktycznie skonsumowane tiki
 */
export function applyTrackRegen(
  activeCount: number,
  lastRollAt: Date,
  now: Date = new Date(),
): TrackRegenResult {
  if (activeCount >= TRACK_SLOTS_MAX) {
    // Wszystko pełne — zresetuj timer do now, żeby pierwsza pustka liczyła
    // od razu od zera (bez "banku" starych tików z okresu gdy było pełno).
    return { gained: 0, lastRollAt: now };
  }
  const emptySlots = TRACK_SLOTS_MAX - activeCount;
  const elapsed = now.getTime() - lastRollAt.getTime();
  if (elapsed <= 0) return { gained: 0, lastRollAt };
  const theoretical = Math.floor(elapsed / TRACK_ROLL_INTERVAL_MS);
  const gained = Math.min(theoretical, emptySlots);
  if (gained <= 0) return { gained: 0, lastRollAt };
  return {
    gained,
    lastRollAt: new Date(lastRollAt.getTime() + gained * TRACK_ROLL_INTERVAL_MS),
  };
}

/**
 * Losuje mob-slug na nowy trop. Filtruje po:
 * - poziomie postaci (requiredLvl <= charLvl)
 * - `allowedSlugs` — set mobów z odblokowanych lochów (anty-spoiler: gracz
 *   nie dostaje tropu na moba z zamkniętego lochu, nawet jeśli ma wymagany lvl)
 * - `exclude` — slugi już zajęte w innych slotach (anty-duplicate)
 *
 * Zwraca null jeśli nic nie pasuje (świeży L1, tylko jeden dostępny mob,
 * już jest wytropiony).
 */
export function rollTrackEnemy(
  charLvl: number,
  exclude: readonly string[],
  allowedSlugs: ReadonlySet<string>,
): string | null {
  const excludeSet = new Set(exclude);
  const candidates = [...REGISTRY.enemies.values()].filter(
    (e) =>
      e.requiredLvl <= charLvl && allowedSlugs.has(e.slug) && !excludeSet.has(e.slug),
  );
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)].slug;
}

/** Helper — oblicza timestamp wygaśnięcia nowego tropa. */
export function trackExpiryFromNow(now: Date = new Date()): Date {
  return new Date(now.getTime() + TRACK_TTL_MS);
}
