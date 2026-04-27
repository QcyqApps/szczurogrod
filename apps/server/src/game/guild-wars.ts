// Gildie — wojny gauntlet S&F (Phase 3).
//
// resolveGauntlet — pure function. Przyjmuje dwie kolejki fighterów posortowane
// po orderIndex. Uruchamia serię duelów z carryover HP: zwycięzca utrzymuje
// pozostały HP i walczy z następnym przeciwnikiem. Koniec gdy jedna strona
// ma pusty queue.
//
// Zwraca:
// - winner: 'attacker' | 'defender'
// - attackerScore / defenderScore: liczba wygranych duelów (ile zabić)
// - roundLog: per-duel summary dla UI replay
// - participantResults: Map<charId, wonDuel> — persisted w participants.won_duel
//
// Brak regeneracji HP między duelami (klasyczny S&F). Max 40 tur per duel
// jak arena (simulateDuelWithHp limit).

import type { ArenaLogEntry } from '@grodno/shared';
import type { CombatFighter } from './arena.js';
import { simulateDuelWithHp } from './arena.js';

export const WAR_COMMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
export const WAR_MAX_PARTICIPANTS_PER_SIDE = 15;
export const WAR_MATCHMAKING_LVL_BAND = 10;
export const WAR_GOLD_PRIZE = 5000;
export const WAR_GLORY_WIN = 25;
export const WAR_GLORY_LOSS = 10;

export interface WarParticipant {
  characterId: string;
  fighter: CombatFighter;
  orderIndex: number;
}

export interface GauntletRound {
  /** 0-indexed numer rundy. */
  round: number;
  attackerCharId: string;
  attackerName: string;
  attackerHpBefore: number;
  defenderCharId: string;
  defenderName: string;
  defenderHpBefore: number;
  /** 'attacker' | 'defender' — kto przeżył. */
  winner: 'attacker' | 'defender';
  winnerHpAfter: number;
  /** Turn-by-turn log duelu (do UI replay w WarResultModal). */
  duelLog: readonly ArenaLogEntry[];
}

export interface GauntletResult {
  winner: 'attacker' | 'defender';
  attackerScore: number;
  defenderScore: number;
  rounds: readonly GauntletRound[];
  /** charId → wonDuel boolean (undefined gdy nie walczył). */
  participantResults: Map<string, boolean>;
}

/**
 * Resolve S&F gauntlet. Sortuje kolejki po orderIndex, potem iteruje:
 * - bierze pierwszego z każdej strony
 * - uruchamia simulateDuelWithHp (wyżej stacjonujący fighter zachowuje current HP)
 * - loser odpada, winner zostaje z pozostałym HP
 * - koniec gdy jedna kolejka pusta → druga strona wygrywa
 *
 * Przypadek forfeit: jedna strona ma 0 committów → druga wygrywa auto
 * (score = 0, winner ustalony, rounds pustę).
 */
export function resolveGauntlet(
  attackers: readonly WarParticipant[],
  defenders: readonly WarParticipant[],
): GauntletResult {
  // Forfeit
  if (attackers.length === 0 && defenders.length === 0) {
    // Brak obu stron — attacker-forfeit (declaration winner-by-default nonsense,
    // ale potrzebujemy jakiegoś winnera). Idziemy defender — jako że atakujący
    // wypowiedział ale nikt się nie stawił.
    return {
      winner: 'defender',
      attackerScore: 0,
      defenderScore: 0,
      rounds: [],
      participantResults: new Map(),
    };
  }
  if (attackers.length === 0) {
    return {
      winner: 'defender',
      attackerScore: 0,
      defenderScore: 0,
      rounds: [],
      participantResults: new Map(),
    };
  }
  if (defenders.length === 0) {
    return {
      winner: 'attacker',
      attackerScore: 0,
      defenderScore: 0,
      rounds: [],
      participantResults: new Map(),
    };
  }

  const attackerQueue = [...attackers].sort((a, b) => a.orderIndex - b.orderIndex);
  const defenderQueue = [...defenders].sort((a, b) => a.orderIndex - b.orderIndex);

  const rounds: GauntletRound[] = [];
  const results = new Map<string, boolean>();

  let aIdx = 0;
  let dIdx = 0;
  let aHp = attackerQueue[0]!.fighter.hpMax;
  let dHp = defenderQueue[0]!.fighter.hpMax;
  let attackerScore = 0;
  let defenderScore = 0;

  while (aIdx < attackerQueue.length && dIdx < defenderQueue.length) {
    const a = attackerQueue[aIdx]!;
    const d = defenderQueue[dIdx]!;
    const result = simulateDuelWithHp(a.fighter, d.fighter, aHp, dHp);

    rounds.push({
      round: rounds.length,
      attackerCharId: a.characterId,
      attackerName: a.fighter.name,
      attackerHpBefore: aHp,
      defenderCharId: d.characterId,
      defenderName: d.fighter.name,
      defenderHpBefore: dHp,
      winner: result.youWon ? 'attacker' : 'defender',
      winnerHpAfter: result.winnerHpRemaining,
      duelLog: result.log,
    });

    if (result.youWon) {
      // Attacker wygrał — defender odpada
      results.set(d.characterId, false);
      attackerScore += 1;
      aHp = result.winnerHpRemaining;
      dIdx += 1;
      if (dIdx < defenderQueue.length) {
        dHp = defenderQueue[dIdx]!.fighter.hpMax;
      }
    } else {
      // Defender wygrał — attacker odpada
      results.set(a.characterId, false);
      defenderScore += 1;
      dHp = result.winnerHpRemaining;
      aIdx += 1;
      if (aIdx < attackerQueue.length) {
        aHp = attackerQueue[aIdx]!.fighter.hpMax;
      }
    }
  }

  // Ostatni stojący — zwycięzca round'y, jeszcze nie wpisany w results.
  const winner: 'attacker' | 'defender' =
    aIdx < attackerQueue.length ? 'attacker' : 'defender';
  if (winner === 'attacker') {
    // Wszyscy defenderzy padli; ostatni attacker (który jest aIdx'em) przeżył.
    const lastAttacker = attackerQueue[aIdx]!;
    results.set(lastAttacker.characterId, true);
  } else {
    const lastDefender = defenderQueue[dIdx]!;
    results.set(lastDefender.characterId, true);
  }

  return {
    winner,
    attackerScore,
    defenderScore,
    rounds,
    participantResults: results,
  };
}
