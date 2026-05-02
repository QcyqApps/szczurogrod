import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { REGISTRY } from '../content/registry.js';
import {
  COMPANION_OFFER_SIZE,
  getCompanionOffer,
  rerollCompanionOffer,
  type CompanionTemplate,
} from './tavern.js';

const TEST_COMPANIONS: CompanionTemplate[] = Array.from({ length: 14 }, (_, i) => ({
  slug: `test-comp-${i}`,
  name: `Test ${i}`,
  cls: 'warrior',
  lvl: i + 1,
  price: 100 * (i + 1),
  trait: `+${i + 1} ATK`,
  buff: { atkBonus: i + 1 },
}));

describe('tavern companion offer', () => {
  // REGISTRY jest globalny — clear & restore żeby nie zatruwać innych testów.
  let backup: Array<[string, CompanionTemplate]>;
  beforeEach(() => {
    backup = [...REGISTRY.companions.entries()];
    REGISTRY.companions.clear();
    for (const t of TEST_COMPANIONS) REGISTRY.companions.set(t.slug, t);
  });
  afterEach(() => {
    REGISTRY.companions.clear();
    for (const [k, v] of backup) REGISTRY.companions.set(k, v);
  });

  it('returns COMPANION_OFFER_SIZE entries gdy registry > size', () => {
    const offer = getCompanionOffer('char-1', '2026-05-02');
    expect(offer).toHaveLength(COMPANION_OFFER_SIZE);
  });

  it('zwraca te same entries dla tego samego (charId, date) — caching', () => {
    const a = getCompanionOffer('char-1', '2026-05-02');
    const b = getCompanionOffer('char-1', '2026-05-02');
    expect(a.map((c) => c.slug)).toEqual(b.map((c) => c.slug));
  });

  it('różny charId → różny offer (sometimes)', () => {
    // Z 14 → C(14, 5) = 2002 możliwych ofert. Dla 5 różnych charów raczej
    // zobaczymy >=2 różne offerty.
    const seen = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const offer = getCompanionOffer(`char-${i}`, '2026-05-02');
      seen.add(offer.map((c) => c.slug).sort().join('|'));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('reroll zmienia offer (z wysokim prawdopodobieństwem)', () => {
    const before = getCompanionOffer('char-1', '2026-05-02');
    const after = rerollCompanionOffer('char-1', '2026-05-02');
    expect(before.map((c) => c.slug).join('|')).not.toEqual(after.map((c) => c.slug).join('|'));
  });

  it('zmiana daty resetuje nonce (offer z dnia A ≠ dnia B nawet po rerollu)', () => {
    const dayA = getCompanionOffer('char-1', '2026-05-02');
    rerollCompanionOffer('char-1', '2026-05-02');
    rerollCompanionOffer('char-1', '2026-05-02');
    const dayB = getCompanionOffer('char-1', '2026-05-03');
    // Inny seed → inna oferta. Test słaby (możliwy collision), ale przy
    // 2002 możliwych offert dla char-1 pierwszy dzień A i dzień B z nonce 0
    // niemal na pewno będą różne.
    expect(dayA.map((c) => c.slug).join('|')).not.toEqual(dayB.map((c) => c.slug).join('|'));
  });

  it('reroll konsekwentny — kilka rerolli z rzędu daje różne wyniki', () => {
    const seen = new Set<string>();
    seen.add(getCompanionOffer('char-1', '2026-05-02').map((c) => c.slug).sort().join('|'));
    for (let i = 0; i < 5; i++) {
      const o = rerollCompanionOffer('char-1', '2026-05-02');
      seen.add(o.map((c) => c.slug).sort().join('|'));
    }
    // 6 sekwencji — przy 2002 unikalnych ofert oczekujemy co najmniej 4 różnych.
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });
});

describe('tavern companion offer — gdy registry <= size', () => {
  let backup: Array<[string, CompanionTemplate]>;
  beforeEach(() => {
    backup = [...REGISTRY.companions.entries()];
    REGISTRY.companions.clear();
    for (let i = 0; i < 3; i++) {
      const t: CompanionTemplate = {
        slug: `tiny-${i}`,
        name: `Tiny ${i}`,
        cls: 'mage',
        lvl: 1,
        price: 100,
        trait: 'flavor',
        buff: {},
      };
      REGISTRY.companions.set(t.slug, t);
    }
  });
  afterEach(() => {
    REGISTRY.companions.clear();
    for (const [k, v] of backup) REGISTRY.companions.set(k, v);
  });

  it('zwraca wszystkich (skip shuffle)', () => {
    // Świeży characterId — globalny cache offer'ów nie podsuwa wyniku z poprzedniego describe.
    const offer = getCompanionOffer('tiny-char', '2026-05-02');
    expect(offer).toHaveLength(3);
  });
});
