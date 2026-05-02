import { describe, expect, it } from 'vitest';
import {
  SZCZUROGROD_PLUS_DURATION_DAYS,
  SZCZUROGROD_PLUS_MAX_STACK_DAYS,
  applyXpBonus,
  extendSubscription,
  isSzczurogrodPlusActive,
} from './subscription.js';

const NOW = new Date('2026-05-02T10:00:00Z');
const DAY_MS = 24 * 60 * 60 * 1000;

describe('isSzczurogrodPlusActive', () => {
  it('false gdy until = null', () => {
    expect(isSzczurogrodPlusActive({ szczurogrodPlusUntil: null }, NOW)).toBe(false);
  });

  it('false gdy until <= now', () => {
    expect(
      isSzczurogrodPlusActive({ szczurogrodPlusUntil: new Date(NOW.getTime() - 1) }, NOW),
    ).toBe(false);
  });

  it('true gdy until > now', () => {
    expect(
      isSzczurogrodPlusActive({ szczurogrodPlusUntil: new Date(NOW.getTime() + DAY_MS) }, NOW),
    ).toBe(true);
  });
});

describe('applyXpBonus', () => {
  it('zwraca raw gdy subskrypcja nieaktywna', () => {
    expect(applyXpBonus({ szczurogrodPlusUntil: null }, 100, NOW)).toBe(100);
  });

  it('+20% gdy aktywna', () => {
    expect(
      applyXpBonus({ szczurogrodPlusUntil: new Date(NOW.getTime() + DAY_MS) }, 100, NOW),
    ).toBe(120);
  });

  it('ceil zaokrągla w górę', () => {
    // 1 * 1.2 = 1.2 → 2
    expect(
      applyXpBonus({ szczurogrodPlusUntil: new Date(NOW.getTime() + DAY_MS) }, 1, NOW),
    ).toBe(2);
    // 7 * 1.2 = 8.4 → 9
    expect(
      applyXpBonus({ szczurogrodPlusUntil: new Date(NOW.getTime() + DAY_MS) }, 7, NOW),
    ).toBe(9);
  });
});

describe('extendSubscription', () => {
  it('świeży zakup → now + duration', () => {
    const result = extendSubscription(null, SZCZUROGROD_PLUS_DURATION_DAYS, NOW);
    expect(result.getTime()).toBe(NOW.getTime() + SZCZUROGROD_PLUS_DURATION_DAYS * DAY_MS);
  });

  it('extend gdy aktywne — dodaje od until, nie od now', () => {
    const current = new Date(NOW.getTime() + 10 * DAY_MS);
    const result = extendSubscription(current, 30, NOW);
    expect(result.getTime()).toBe(current.getTime() + 30 * DAY_MS);
  });

  it('cap na 90 dni od now', () => {
    const current = new Date(NOW.getTime() + 80 * DAY_MS);
    const result = extendSubscription(current, 30, NOW);
    expect(result.getTime()).toBe(NOW.getTime() + SZCZUROGROD_PLUS_MAX_STACK_DAYS * DAY_MS);
  });

  it('wygasły until → traktuj jak null', () => {
    const expired = new Date(NOW.getTime() - DAY_MS);
    const result = extendSubscription(expired, 30, NOW);
    expect(result.getTime()).toBe(NOW.getTime() + 30 * DAY_MS);
  });
});
