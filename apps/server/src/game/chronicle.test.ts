import { describe, expect, it } from 'vitest';
import type { ChroniclePayload } from '@grodno/shared';
import { renderChronicleEvent } from './chronicle.js';

describe('renderChronicleEvent', () => {
  it('boss_kill podstawia heroName i questTitle', () => {
    const payload: ChroniclePayload = {
      kind: 'boss_kill',
      questId: 'q5',
      questTitle: 'Kogucik wodza goblinów',
      heroName: 'Bolek',
    };
    const text = renderChronicleEvent(payload, 'event-id-1');
    expect(text).toContain('Bolek');
    expect(text).toContain('Kogucik wodza goblinów');
    expect(text).not.toContain('undefined');
  });

  it('legendary_drop podstawia heroName i itemName', () => {
    const payload: ChroniclePayload = {
      kind: 'legendary_drop',
      itemName: 'Miecz Świtu',
      heroName: 'Jadwiga',
    };
    const text = renderChronicleEvent(payload, 'event-id-2');
    expect(text).toContain('Jadwiga');
    expect(text).toContain('Miecz Świtu');
    expect(text).not.toContain('undefined');
  });

  it('level_milestone podstawia heroName i level', () => {
    const payload: ChroniclePayload = {
      kind: 'level_milestone',
      level: 10,
      heroName: 'Stasio',
    };
    const text = renderChronicleEvent(payload, 'event-id-3');
    expect(text).toContain('Stasio');
    expect(text).toContain('10');
    expect(text).not.toContain('undefined');
  });

  it('stabilność — ten sam stableKey → ten sam rendered text', () => {
    const payload: ChroniclePayload = {
      kind: 'boss_kill',
      questId: 'q10',
      questTitle: 'Porachunki z Hobgoblinem',
      heroName: 'Helena',
    };
    const first = renderChronicleEvent(payload, 'stable-key-xyz');
    const second = renderChronicleEvent(payload, 'stable-key-xyz');
    expect(first).toBe(second);
  });

  it('różnorodność — różne stableKey mogą dać różne szablony', () => {
    const payload: ChroniclePayload = {
      kind: 'boss_kill',
      questId: 'q5',
      questTitle: 'Testowy boss',
      heroName: 'Gretka',
    };
    // 20 różnych kluczy → oczekujemy co najmniej 2 różnych wyników
    const outputs = new Set<string>();
    for (let i = 0; i < 20; i += 1) {
      outputs.add(renderChronicleEvent(payload, `key-${i}`));
    }
    expect(outputs.size).toBeGreaterThan(1);
  });

  it('zwraca string bez HTML / bez placeholderów', () => {
    const payload: ChroniclePayload = {
      kind: 'level_milestone',
      level: 50,
      heroName: 'Wojciech',
    };
    const text = renderChronicleEvent(payload, 'id');
    expect(text).not.toMatch(/\{[a-z]+\}/); // żadne {hero}, {level}
    expect(text).not.toMatch(/<[^>]+>/); // żadne tagi HTML
  });
});
