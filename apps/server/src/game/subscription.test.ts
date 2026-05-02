import { describe, expect, it } from 'vitest';
import { findPackageById, GEM_PACKAGES } from './gemPackages.js';
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

describe('GEM_PACKAGES — vip30 contract', () => {
  it('vip30 ma subscriptionDays = 30 (dropuje gemy + extenduje subskrypcję)', () => {
    const vip = findPackageById('vip30');
    expect(vip).toBeDefined();
    expect(vip!.subscriptionDays).toBe(30);
    expect(vip!.gems).toBe(3000);
  });

  it('zwykłe paczki gemów (p1..p5) nie mają subscriptionDays', () => {
    for (const id of ['p1', 'p2', 'p3', 'p4', 'p5']) {
      const pkg = findPackageById(id);
      expect(pkg).toBeDefined();
      expect(pkg!.subscriptionDays).toBeUndefined();
    }
  });

  it('GEM_PACKAGES — żaden id nie ma subscriptionDays > MAX_STACK', () => {
    for (const pkg of GEM_PACKAGES) {
      if (pkg.subscriptionDays !== undefined) {
        expect(pkg.subscriptionDays).toBeGreaterThan(0);
        expect(pkg.subscriptionDays).toBeLessThanOrEqual(SZCZUROGROD_PLUS_MAX_STACK_DAYS);
      }
    }
  });
});
