import { describe, expect, it } from 'vitest';
import type { CombatFighter } from './arena.js';
import { resolveGauntlet, type WarParticipant } from './guild-wars.js';

function fighter(name: string, atk: number, hp: number): CombatFighter {
  return {
    name,
    atk,
    def: 0,
    mag: 0,
    spd: 0,
    hpMax: hp,
    cls: 'warrior',
    lvl: 10,
  };
}

function participant(
  id: string,
  orderIndex: number,
  f: CombatFighter,
): WarParticipant {
  return { characterId: id, orderIndex, fighter: f };
}

describe('resolveGauntlet', () => {
  it('attacker forfeit (empty queue) → defender wins', () => {
    const res = resolveGauntlet(
      [],
      [participant('d1', 0, fighter('D1', 50, 200))],
    );
    expect(res.winner).toBe('defender');
    expect(res.attackerScore).toBe(0);
    expect(res.defenderScore).toBe(0);
    expect(res.rounds).toHaveLength(0);
  });

  it('defender forfeit (empty queue) → attacker wins', () => {
    const res = resolveGauntlet(
      [participant('a1', 0, fighter('A1', 50, 200))],
      [],
    );
    expect(res.winner).toBe('attacker');
    expect(res.rounds).toHaveLength(0);
  });

  it('both empty → defender wins by default', () => {
    const res = resolveGauntlet([], []);
    expect(res.winner).toBe('defender');
  });

  it('1v1 obie strony → zwycięzca ma wonDuel=true, loser=false', () => {
    // Deterministyczny outcome nie jest wyliczalny (RNG w combat). Sprawdzamy
    // tylko że invarianty się trzymają:
    // - winner side stojący ma wonDuel=true w participantResults
    // - loser side ma wonDuel=false
    // - sumarycznie jedna runda
    const res = resolveGauntlet(
      [participant('a1', 0, fighter('A1', 50, 200))],
      [participant('d1', 0, fighter('D1', 50, 200))],
    );
    expect(res.rounds).toHaveLength(1);
    expect(res.attackerScore + res.defenderScore).toBe(1);
    const winnerId = res.winner === 'attacker' ? 'a1' : 'd1';
    const loserId = res.winner === 'attacker' ? 'd1' : 'a1';
    expect(res.participantResults.get(winnerId)).toBe(true);
    expect(res.participantResults.get(loserId)).toBe(false);
  });

  it('sortuje kolejki po orderIndex (niższy = wcześniej)', () => {
    // A1.orderIndex=5, A2.orderIndex=0 → A2 wchodzi pierwszy.
    // Damage absurdalnie wysoki żeby 1-turn KO — sprawdzam który padł pierwszy.
    const res = resolveGauntlet(
      [
        participant('a1-last', 5, fighter('A1', 9999, 9999)),
        participant('a2-first', 0, fighter('A2', 1, 50)),
      ],
      [participant('d1', 0, fighter('D1', 9999, 9999))],
    );
    // A2 (order=0) wchodzi pierwszy z 50 HP vs D1 z 9999 atk → A2 pada w rundzie 1.
    // Po A2-loss, A1 (order=5) wchodzi z pełnym HP vs D1 z zostawionym HP → D1 też pada.
    expect(res.rounds[0]?.attackerCharId).toBe('a2-first');
    expect(res.rounds[0]?.winner).toBe('defender');
    expect(res.participantResults.get('a2-first')).toBe(false);
  });

  it('carryover HP: zwycięzca utrzymuje HP między rundami', () => {
    // A1 ma 9999 atk vs D1 (50 hp) vs D2 (50 hp)
    // Runda 1: A1 zabija D1, A1 zostaje z ~pełnym HP (D1 zadał minimalny damage)
    // Runda 2: A1 kontynuuje z carryover HP vs D2 (swiezy) → A1 dalej wygrywa
    const res = resolveGauntlet(
      [participant('a1', 0, fighter('A1', 9999, 9999))],
      [
        participant('d1', 0, fighter('D1', 1, 50)),
        participant('d2', 1, fighter('D2', 1, 50)),
      ],
    );
    expect(res.winner).toBe('attacker');
    expect(res.attackerScore).toBe(2);
    expect(res.defenderScore).toBe(0);
    expect(res.rounds).toHaveLength(2);
    // Runda 2 — attackerHpBefore = winnerHpAfter z rundy 1 (carryover)
    const r1WinnerHp = res.rounds[0]!.winnerHpAfter;
    const r2AttackerHpBefore = res.rounds[1]!.attackerHpBefore;
    expect(r2AttackerHpBefore).toBe(r1WinnerHp);
  });

  it('ostatni stojący = winner, wonDuel=true', () => {
    // A1 (9999 atk, 9999 hp) vs D1 (1 atk, 50 hp), D2 (1 atk, 50 hp), D3 (1 atk, 50 hp)
    // A1 zabija wszystkich, zostaje ostatni — participantResults['a1']=true
    const res = resolveGauntlet(
      [participant('a1', 0, fighter('A1', 9999, 9999))],
      [
        participant('d1', 0, fighter('D1', 1, 50)),
        participant('d2', 1, fighter('D2', 1, 50)),
        participant('d3', 2, fighter('D3', 1, 50)),
      ],
    );
    expect(res.winner).toBe('attacker');
    expect(res.attackerScore).toBe(3);
    expect(res.defenderScore).toBe(0);
    expect(res.participantResults.get('a1')).toBe(true);
    expect(res.participantResults.get('d1')).toBe(false);
    expect(res.participantResults.get('d2')).toBe(false);
    expect(res.participantResults.get('d3')).toBe(false);
  });
});
