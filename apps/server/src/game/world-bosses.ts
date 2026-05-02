// World bosses — server-wide raid system (Phase 1: MVP).
//
// Pojedynczy boss żyje globalnie. 3 hit/dzień/gracz (rownolegle do guild
// raid). Boss ma 3 fazy HP — w każdej innaklasa dostaje +50% damage:
//   - Faza 1 (HP > 66%): warrior + rogue (atak fizyczny)
//   - Faza 2 (33-66%): mage (kruszenie magii)
//   - Faza 3 (< 33%): brak słabości — wszyscy walą po równi (race do killbow)
//
// Po killu reward distribution po damage tier:
//   - top 1: 300 gems + 10000 gold + flat tytuł killer
//   - top 10: 100 gems + 5000 gold
//   - top 100: 30 gems + 2000 gold
//   - all hitters: 1000 gold (proportional do dmg jeszcze + base 1000)
//
// HP scaling celuje w 1-3 dni życia bossa przy aktywnej populacji ~100-500
// graczy × 3 hits = 300-1500 hits/day × ~1500 avg dmg = 450k-2.25M dmg/day.
// Tier 1 baseHp 1.5M, +500K na tier.

import type { CharacterClass, IconName } from '@grodno/shared';
import type { CombatFighter } from './arena.js';

export type WorldBossPhase = 1 | 2 | 3;

export interface WorldBossTemplate {
  slug: string;
  name: string;
  icon: IconName;
  flavor: string;
  /** HP na tier 1. Skaluje się przez computeWorldBossHp(). */
  baseHp: number;
  /** 0..4 — pozycja w rotacji. (tier-1) % 5 mapuje. */
  rotationIndex: number;
}

// Nazwy + flavor matchują brand voice — Bareja na grzybkach, deadpan dry.
// Bossy 1-4: rosnący tier zagrożenia. Boss 5: finalny tier cyklu.
//
// HP tunowane do populacji ~50-300 active graczy × 3 hits × ~800 avg dmg
// = 120K-720K/dzień. Tier 1 = 150K → kill w ~6h-1.5 dnia. Skala +25%
// na tier i populacja rośnie wraz z czasem życia gry.
export const WORLD_BOSS_TEMPLATES: readonly WorldBossTemplate[] = [
  {
    slug: 'kruwial-bagienny',
    name: 'Kruwiał Bagienny',
    icon: 'skull-mage',
    flavor: 'Utopiec-pradziad. Trzy wieki w mule, jeden uraz.',
    baseHp: 150_000,
    rotationIndex: 0,
  },
  {
    slug: 'macica-goblinow',
    name: 'Macica Goblinów',
    icon: 'crown-goblin',
    flavor: 'Każdy goblin to jej syn. Nawet ten, którego nie znała.',
    baseHp: 200_000,
    rotationIndex: 1,
  },
  {
    slug: 'lich-podgrodzia-drugi',
    name: 'Lich Podgrodzia (Drugi)',
    icon: 'skull-lich',
    flavor: 'Pierwszy padł w gildii. Ten ma teraz pretensje.',
    baseHp: 250_000,
    rotationIndex: 2,
  },
  {
    slug: 'pijawnica-olbrzymka',
    name: 'Pijawnica Olbrzymka',
    icon: 'mouse',
    flavor: 'Ssie. Wytrwale. Bez emocji.',
    baseHp: 300_000,
    rotationIndex: 3,
  },
  {
    slug: 'cien-wybudzonego',
    name: 'Cień Wybudzonego',
    icon: 'skull-mage',
    flavor: 'Nie wiadomo czego cień. Wiadomo, że gryzie.',
    baseHp: 400_000,
    rotationIndex: 4,
  },
];

export const WORLD_BOSS_HITS_PER_DAY = 3;

/** Skalowanie HP z tier'em — +25% na tier dla wolniejszej eskalacji niż gildia. */
export function computeWorldBossHp(baseHp: number, tier: number): number {
  return Math.floor(baseHp * (1 + (tier - 1) * 0.25));
}

/** Lookup templatu po tier'ze (rotacja 5-element). */
export function worldBossTemplateForTier(tier: number): WorldBossTemplate {
  const idx = (tier - 1) % WORLD_BOSS_TEMPLATES.length;
  return WORLD_BOSS_TEMPLATES[idx]!;
}

/** Faza HP. Pure — używana też po stronie UI dla phase indicator. */
export function computePhase(hpCurrent: number, hpMax: number): WorldBossPhase {
  const ratio = hpCurrent / hpMax;
  if (ratio > 0.66) return 1;
  if (ratio > 0.33) return 2;
  return 3;
}

/** Klasy które dostają phase-bonus w danej fazie. Faza 3 = wszyscy. */
export function classesAdvantageousIn(phase: WorldBossPhase): readonly CharacterClass[] {
  if (phase === 1) return ['warrior', 'rogue'];
  if (phase === 2) return ['mage'];
  return ['warrior', 'rogue', 'mage'];
}

/**
 * Damage formula z phase bonus.
 *   base = (atk + mag) * 2 + lvl * 30
 *   tierScale = 1 + tier*0.04
 *   variance = 0.85..1.15
 *   phaseBonus = phaseMatch ? 1.5 : 1.0
 *   tapMul = 0.6..1.4 (z tap-mini-gry; 1.0 gdy nie używana)
 *   bossDef = tier * 25
 *   final = max(100, base * tierScale * phaseBonus * variance * tapMul - bossDef)
 *   cap: hpCurrent (ostatni hit nie przekracza)
 *
 * Skalibrowane tak, że L13 (atk 80, mag 10) z phase match robi ~700-900,
 * L25 (atk 200, mag 20) robi ~1500-2000. Boss tier 1 = 150K HP →
 * ~75-200 contributors per kill. Bez phase match damage jest ~60% niższy
 * (motywacja do wyczekania właściwej fazy).
 */
export function rollWorldBossDamage(
  fighter: CombatFighter,
  tier: number,
  hpCurrent: number,
  hpMax: number,
  tapMul: number = 1,
): { dmg: number; phase: WorldBossPhase; phaseMatched: boolean } {
  const phase = computePhase(hpCurrent, hpMax);
  const advantageous = classesAdvantageousIn(phase);
  const phaseMatched = advantageous.includes(fighter.cls);

  const baseDamage = (fighter.atk + fighter.mag) * 2 + fighter.lvl * 30;
  const tierScale = 1 + tier * 0.04;
  const variance = 0.85 + Math.random() * 0.3;
  const bossDef = tier * 25;
  const phaseBonus = phaseMatched ? 1.5 : 1.0;
  const raw = Math.max(
    100,
    Math.floor(baseDamage * tierScale * phaseBonus * variance * tapMul - bossDef),
  );
  return { dmg: Math.min(raw, hpCurrent), phase, phaseMatched };
}

/**
 * Tier reward distribution. Po killu serwer iteruje leaderboard i przyznaje
 * dla każdego rank'a odpowiednie nagrody. Zwraca też total dmg dla bonus
 * proporcjonalnego (każdy hitter dostaje base 1000g + 1g per 1000 dmg).
 */
export interface WorldBossKillRewardForRank {
  gold: number;
  gems: number;
  /** True dla rank #1 — uniwersalny tytuł "Pogromca {bossa}" (do future scope). */
  isKiller: boolean;
}

export function rewardForRank(rank: number, tier: number): WorldBossKillRewardForRank {
  const tierMul = 1 + (tier - 1) * 0.1;
  if (rank === 1) {
    return {
      gold: Math.floor(10_000 * tierMul),
      gems: Math.floor(300 * tierMul),
      isKiller: true,
    };
  }
  if (rank <= 10) {
    return {
      gold: Math.floor(5_000 * tierMul),
      gems: Math.floor(100 * tierMul),
      isKiller: false,
    };
  }
  if (rank <= 100) {
    return {
      gold: Math.floor(2_000 * tierMul),
      gems: Math.floor(30 * tierMul),
      isKiller: false,
    };
  }
  return {
    gold: Math.floor(1_000 * tierMul),
    gems: 0,
    isKiller: false,
  };
}

/** Bonus proporcjonalny do dmg (per hitter, niezależnie od rank'a). 1g / 1000 dmg, cap 5000. */
export function damageBonusGold(totalDmg: number): number {
  return Math.min(5_000, Math.floor(totalDmg / 1_000));
}

/**
 * Echa Wybudzonego per hit. Base 5-10 + scaling z tier'em + bonus za phase
 * match. Killer dostaje dodatkowy bonus w router'ze (post-kill).
 *   base = 5 + floor(tier * 0.5)
 *   variance = floor(random * 6)  (0..5)
 *   phaseBonus = phaseMatched ? +3 : 0
 *   total = base + variance + phaseBonus
 *
 * Tier 1: 5-13. Tier 5: 7-15. Tier 10: 10-18. 3 hits/day = ~30-50/dzień.
 */
export function rollEchoesDrop(tier: number, phaseMatched: boolean): number {
  const base = 5 + Math.floor(tier * 0.5);
  const variance = Math.floor(Math.random() * 6);
  const phaseBonus = phaseMatched ? 3 : 0;
  return base + variance + phaseBonus;
}

/** Killer bonus — duży one-shot za zadanie killing blow. */
export function killerEchoBonus(tier: number): number {
  return 25 + tier * 5;
}

// ===== Tap fury mini-game =====
//
// Gracz zamiast jednego klika dostaje 4-sec okno na maksymalnie szybkie
// tapowanie sprite'a bossa. Liczba tapów mapuje się na multiplier do dmg
// (0.6..1.4 liniowo) który mnoży się z istniejącą wariancją 0.85..1.15.
// Przy 25+ tapach dochodzi +50% bonusu do ech (bonus za zaangażowanie).
// Server-authoritative: klampowanie tap rate do 12/sec (anti-bot), session
// store w pamięci z TTL 30s i jedną aktywną sesją per character.

export const TAP_FURY_DURATION_MS = 4000;
export const TAP_FURY_MIN_TAPS = 5;
export const TAP_FURY_MAX_TAPS = 30;
/** Cap tap rate dla anti-bot (taps/sec). 4s × 12 = 48, ale MAX_TAPS=30 wcześniej clampuje. */
export const TAP_FURY_TAP_RATE_CAP = 12;
/** Próg ech-bonusu — gracz zaangażowany dostaje +50% ech. */
export const TAP_FURY_ECHOES_BONUS_THRESHOLD = 25;
export const TAP_FURY_ECHOES_BONUS_PCT = 0.5;
const TAP_FURY_SESSION_TTL_MS = 30_000;

/**
 * Klampuje tap count: floor=MIN_TAPS, ceil=min(MAX_TAPS, durationSec * RATE_CAP).
 * Użyte server-side w commitHit żeby klient nie mógł wysłać `taps=999`.
 */
export function clampTapCount(taps: number, durationMs: number): number {
  const rateMax = Math.floor((durationMs / 1000) * TAP_FURY_TAP_RATE_CAP);
  const ceiling = Math.min(TAP_FURY_MAX_TAPS, rateMax);
  if (taps < TAP_FURY_MIN_TAPS) return TAP_FURY_MIN_TAPS;
  if (taps > ceiling) return ceiling;
  return Math.floor(taps);
}

/**
 * Liniowy mnożnik dmg z tap count. Wymaga już sclampowanego inputu z
 * `clampTapCount`. Min taps → 0.6×, max taps → 1.4×, połowa → 1.0×.
 */
export function tapMultiplier(clampedTaps: number): number {
  const t = (clampedTaps - TAP_FURY_MIN_TAPS) / (TAP_FURY_MAX_TAPS - TAP_FURY_MIN_TAPS);
  return 0.6 + t * 0.8;
}

/** +50% ech jeśli gracz przekroczył próg engagement'u. */
export function applyTapBonusToEchoes(baseEchoes: number, taps: number): number {
  if (taps < TAP_FURY_ECHOES_BONUS_THRESHOLD) return baseEchoes;
  return Math.floor(baseEchoes * (1 + TAP_FURY_ECHOES_BONUS_PCT));
}

// ===== Hit session store =====
//
// Wzorzec mirror'ujący `combat.ts:99-193` (CombatSession map z TTL).
// Multi-instance deploy → przenieść do Redis. Single-instance OK.

export interface WorldBossHitSession {
  sessionId: string;
  userId: string;
  characterId: string;
  bossId: string;
  bossTier: number;
  /** Date.now() w momencie startHit. Driver dla anti-cheat duration check. */
  startedAt: number;
  /** True po consumeAcomicie commitHit (idempotency guard). */
  committed: boolean;
}

const HIT_SESSIONS = new Map<string, WorldBossHitSession>();

export function createHitSession(s: WorldBossHitSession): void {
  HIT_SESSIONS.set(s.sessionId, s);
  reapHitSessions();
}

export function getHitSession(sessionId: string): WorldBossHitSession | null {
  reapHitSessions();
  return HIT_SESSIONS.get(sessionId) ?? null;
}

/** Anti-cheat: maks 1 aktywna sesja per character (mirror `findCharSession`). */
export function findCharHitSession(characterId: string): WorldBossHitSession | null {
  reapHitSessions();
  for (const s of HIT_SESSIONS.values()) {
    if (s.characterId === characterId) return s;
  }
  return null;
}

export function deleteHitSession(sessionId: string): void {
  HIT_SESSIONS.delete(sessionId);
}

function reapHitSessions(): void {
  const now = Date.now();
  for (const [id, s] of HIT_SESSIONS) {
    if (now - s.startedAt > TAP_FURY_SESSION_TTL_MS) HIT_SESSIONS.delete(id);
  }
}
