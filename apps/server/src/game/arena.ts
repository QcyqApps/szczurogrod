// Arena — async PvP MVP. Server auto-battle na snapshot'ach.
//
// Dwa typy rivali:
// - real player (id = character uuid): ±3 LVL matchmaking, exclude self.
// - NPC synth (id = "npc:<lvl>:<seed>"): fallback gdy pool graczy w band'zie
//   cienkie. Stats scaled z LVL'u, klasa losowa, nazwa z puli. NIE persystuje
//   między request'ami — list() wylosowuje nowych; fight() dostaje slug
//   i deterministycznie regeneruje.
//
// Ranking: Elo-ish (start 1000). K=32. Tylko ATAKUJĄCY ma update stanu —
// defender nie traci punktów gdy jest offline. MVP — async asymmetry
// akceptowalna. Daily limit: ARENA_FIGHTS_PER_DAY = 5 per UTC day.
//
// Combat sim: turowy, obaj zaczynają full HP (snapshot time). Każda tura —
// atakujący wybiera akcję per-klasa heuristic (warrior: 60% norm / 40% heavy;
// rogue: 50% norm / 30% heavy / 20% magic; mage: 30% norm / 70% magic).
// Używa tych samych `reduce()`, `rollPlayerAttack` co PvE dla spójności.
// Max 40 tur — jeżeli obaj przeżyli, wygrywa ten z większym HP'em procentowo.

import { and, asc, desc, eq, lte, ne, or, sql } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { arenaMatches, characterItems, characters } from '../db/schema.js';
import type {
  ArenaLeaderboardEntry,
  ArenaLogEntry,
  ArenaMatchRow,
  ArenaRival,
  CharacterClass,
  CharacterStats,
} from '@grodno/shared';
import { applyEnhancementToStats } from './blacksmith.js';
import { rollPlayerAttack } from './combat.js';
import { isoDateUTC } from './daily.js';

export const ARENA_FIGHTS_PER_DAY = 5;
export const ARENA_STARTING_POINTS = 1000;
export const ARENA_ELO_K = 32;
export const ARENA_LVL_BAND = 3;
export const ARENA_MAX_TURNS = 40;

// NPC synth pool — nazwy deadpan, klasy losowe per seed.
const NPC_NAMES: readonly string[] = [
  'Gretka z Rzepnicy',
  'Mroczny Krzysio',
  'Magister Psikus',
  'Bolek Łopata',
  'Zbychu Bez Uszu',
  'Halina od Kur',
  'Stary Metodyk',
  'Lucek Jednoręki',
  'Paninka Z Piwnicy',
  'Kacper Zbyt Cichy',
  'Wiesia Mątwa',
  'Rysio Nie-Mag',
  'Jurek Wschodni',
  'Zenek Pochmurny',
  'Florka Rudowłosa',
];

const ALL_CLASSES: readonly CharacterClass[] = ['warrior', 'mage', 'rogue'];

export interface CombatFighter {
  /** Jak w CombatSession: effective po equip + buffy. */
  atk: number;
  def: number;
  mag: number;
  spd: number;
  hpMax: number;
  cls: CharacterClass;
  name: string;
  lvl: number;
}

/**
 * Power — syntetyczny wskaźnik siły dla UI. Tylko display; matchmaking leci
 * po LVL + Elo.
 */
export function computePower(
  atk: number,
  def: number,
  mag: number,
  spd: number,
  lvl: number,
): number {
  return Math.round(atk + def + mag + spd + lvl * 5);
}

/**
 * Aggreguje equipped item bonuses z DB dla danej postaci. Zwraca `{atk, def,
 * mag}` — arena nie używa MP ani potion'ów więc trzymamy się trzech statów.
 *
 * Enhancement level (Kowal Zygmunt) jest aplikowany per-item: stat × multiplier
 * z `computeEnhancementMultiplier`. Dla level=0 mult=1 (no change).
 */
export async function loadEquipBonuses(
  db: Db,
  characterId: string,
): Promise<{ atk: number; def: number; mag: number }> {
  const equipped = await db
    .select({
      atk: characterItems.atk,
      def: characterItems.def,
      mag: characterItems.mag,
      enhancementLevel: characterItems.enhancementLevel,
    })
    .from(characterItems)
    .where(
      and(
        eq(characterItems.characterId, characterId),
        sql`${characterItems.equippedSlot} IS NOT NULL`,
      ),
    );
  return equipped.reduce<{ atk: number; def: number; mag: number }>(
    (acc, row) => {
      const enhanced = applyEnhancementToStats(row, row.enhancementLevel);
      return {
        atk: acc.atk + enhanced.atk,
        def: acc.def + enhanced.def,
        mag: acc.mag + enhanced.mag,
      };
    },
    { atk: 0, def: 0, mag: 0 },
  );
}

/** Deterministic hash → uint32, użyte do seedowania NPC z slug'a. */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * NPC opponent z deterministycznym seed'em. Slug format: `npc:<lvl>:<idx>`
 * gdzie idx 0..N — list() generuje kolejne idx aż do zapełnienia 3 slotów.
 * fight() rebuild'uje te same staty z tego samego slug'a.
 */
export function synthesizeNpc(lvl: number, idx: number): {
  rival: ArenaRival;
  fighter: CombatFighter;
} {
  const id = `npc:${lvl}:${idx}`;
  const seed = hashSeed(id);
  const cls = ALL_CLASSES[seed % 3]!;
  const name = NPC_NAMES[seed % NPC_NAMES.length]!;

  // Stats scaled ~z trainerem mediana-gracza na tym LVL + lekki jitter.
  // Base = 8 + lvl × 2.5 → L10 ≈ 33, L25 ≈ 70. Wartości nieco niższe od
  // aktywnego real-playera żeby NPC był „trochę słabszy od gracza" —
  // zachęca do gry.
  const base = Math.floor(8 + lvl * 2.5);
  const jitter = () => ((seed >> 3) % 7) - 3; // -3..+3
  const atkBump = cls === 'warrior' ? 6 : cls === 'rogue' ? 3 : 0;
  const magBump = cls === 'mage' ? 8 : 0;
  const atk = Math.max(1, base + atkBump + jitter());
  const def = Math.max(1, base - 2 + jitter());
  const mag = Math.max(1, base + magBump + jitter());
  const spd = Math.max(1, base - 3 + jitter());
  // HP mirror gracza na tym LVL (patrz leveling.ts formula).
  const hpMax = 100 + lvl * 15;
  const power = computePower(atk, def, mag, spd, lvl);
  // NPC arena_points wycentrowane wokół 1000 z +−lvl×10 żeby ranking był
  // sensowny nawet przy tylko-NPC opponent'ach.
  const arenaPoints = Math.max(500, 1000 + (lvl - 10) * 10 + jitter() * 5);

  return {
    rival: {
      id,
      kind: 'npc',
      name,
      cls,
      lvl,
      power,
      arenaPoints,
    },
    fighter: { atk, def, mag, spd, hpMax, cls, name, lvl },
  };
}

/**
 * Listuje rivali dla areny: najpierw real players w ±3 LVL band'zie
 * (excluding self + same user's alt), potem NPC synth aż do 3 sztuk.
 */
export async function listArenaRivals(
  db: Db,
  selfCharId: string,
  selfUserId: string,
  selfLvl: number,
  limit: number = 3,
): Promise<ArenaRival[]> {
  const low = Math.max(1, selfLvl - ARENA_LVL_BAND);
  const high = selfLvl + ARENA_LVL_BAND;

  // Real players — same band, not self, not same user. ORDER BY RANDOM() OK
  // przy skali MVP (<10k chars). Later: cached pool + weighted matchmaking.
  const realRows = await db
    .select({
      id: characters.id,
      name: characters.name,
      cls: characters.cls,
      lvl: characters.lvl,
      stats: characters.stats,
      arenaPoints: characters.arenaPoints,
    })
    .from(characters)
    .where(
      and(
        ne(characters.id, selfCharId),
        ne(characters.userId, selfUserId),
        lte(characters.lvl, high),
        sql`${characters.lvl} >= ${low}`,
      ),
    )
    .orderBy(sql`random()`)
    .limit(limit);

  const out: ArenaRival[] = [];
  for (const r of realRows) {
    const bonuses = await loadEquipBonuses(db, r.id);
    const s = r.stats as CharacterStats;
    const atk = s.atk + bonuses.atk;
    const def = s.def + bonuses.def;
    const mag = s.mag + bonuses.mag;
    const spd = s.spd;
    out.push({
      id: r.id,
      kind: 'player',
      name: r.name,
      cls: r.cls as CharacterClass,
      lvl: r.lvl,
      power: computePower(atk, def, mag, spd, r.lvl),
      arenaPoints: r.arenaPoints,
    });
  }

  // Fill with NPCs. Seed idx od liczby real'i, żeby stabilnie generować
  // różnych NPC'ów między wywołaniami w obrębie jednej sesji UI.
  let idx = realRows.length;
  while (out.length < limit) {
    const npc = synthesizeNpc(selfLvl, idx);
    out.push(npc.rival);
    idx += 1;
  }

  return out;
}

/** Top-N po arena_points dla leaderboard panelu. */
export async function listLeaderboard(
  db: Db,
  topN: number = 10,
): Promise<ArenaLeaderboardEntry[]> {
  const rows = await db
    .select({
      name: characters.name,
      cls: characters.cls,
      lvl: characters.lvl,
      arenaPoints: characters.arenaPoints,
      arenaWins: characters.arenaWins,
    })
    .from(characters)
    .orderBy(desc(characters.arenaPoints), asc(characters.createdAt))
    .limit(topN);

  return rows.map((r, i) => ({
    pos: i + 1,
    name: r.name,
    cls: r.cls as CharacterClass,
    lvl: r.lvl,
    arenaPoints: r.arenaPoints,
    arenaWins: r.arenaWins,
  }));
}

/**
 * Własny ranking (1-indexed). NULL gdy postać jest poza top 500 (optymalizacja
 * — nie liczymy dla rank'ów które i tak się nie pokazują).
 */
export async function computeMyRank(
  db: Db,
  characterId: string,
): Promise<number | null> {
  const [self] = await db
    .select({ pts: characters.arenaPoints })
    .from(characters)
    .where(eq(characters.id, characterId))
    .limit(1);
  if (!self) return null;

  const [row] = await db
    .select({ higher: sql<number>`count(*)::int` })
    .from(characters)
    .where(sql`${characters.arenaPoints} > ${self.pts}`);
  const higher = row?.higher ?? 0;
  if (higher >= 500) return null;
  return higher + 1;
}

/**
 * Standard Elo. outcome = 1 (A wygrał) lub 0 (A przegrał). Zwraca delta
 * dla postaci A (postać B dostaje przeciwną wartość — ale w MVP nie
 * zapisujemy B).
 */
export function computeEloDelta(
  pointsA: number,
  pointsB: number,
  outcome: 0 | 1,
): number {
  const expected = 1 / (1 + Math.pow(10, (pointsB - pointsA) / 400));
  return Math.round(ARENA_ELO_K * (outcome - expected));
}

/** Per-klasa rozkład akcji — 3 wartości sumujące do 1, [norm, heavy, magic]. */
const CLASS_ACTION_MIX: Record<CharacterClass, readonly [number, number, number]> = {
  warrior: [0.6, 0.4, 0.0],
  rogue: [0.5, 0.3, 0.2],
  mage: [0.3, 0.0, 0.7],
};

function pickAction(cls: CharacterClass): 'norm' | 'heavy' | 'magic' {
  const [normP, heavyP] = CLASS_ACTION_MIX[cls];
  const r = Math.random();
  if (r < normP) return 'norm';
  if (r < normP + heavyP) return 'heavy';
  return 'magic';
}

/**
 * Wewnętrzny wariant z custom startHp. Używane przez gauntlet wojen gildyjnych
 * (carryover HP S&F-style). Zwraca też pozostałe HP zwycięzcy.
 *
 * youStartHp/rivalStartHp zamiast hpMax — pozwala fighter'owi wejść do
 * rundy już podrapanemu. Heavy-miss/crit/dodge logika identyczna z bazą.
 * Draw liczony tak samo (wyższy procent z hpMax = wygrywa).
 */
export function simulateDuelWithHp(
  you: CombatFighter,
  rival: CombatFighter,
  youStartHp: number,
  rivalStartHp: number,
): {
  youWon: boolean;
  log: ArenaLogEntry[];
  winnerHpRemaining: number;
} {
  const log: ArenaLogEntry[] = [];
  let yourHp = Math.min(youStartHp, you.hpMax);
  let rivalHp = Math.min(rivalStartHp, rival.hpMax);

  for (let turn = 1; turn <= ARENA_MAX_TURNS; turn++) {
    // Twoja tura
    const yourAction = pickAction(you.cls);
    const yourRoll = rollPlayerAttack(
      yourAction,
      { atk: you.atk, mag: you.mag, spd: you.spd },
      rival.def,
    );
    rivalHp = Math.max(0, rivalHp - yourRoll.dmg);
    log.push({
      turn,
      side: 'you',
      dmg: yourRoll.dmg,
      crit: yourRoll.crit,
      remainingHp: rivalHp,
    });
    if (rivalHp <= 0) return { youWon: true, log, winnerHpRemaining: yourHp };

    // Rival'ska tura — symetryczna.
    const rivalAction = pickAction(rival.cls);
    const rivalRoll = rollPlayerAttack(
      rivalAction,
      { atk: rival.atk, mag: rival.mag, spd: rival.spd },
      you.def,
    );
    const dodgeCap = you.cls === 'warrior' ? 0.25 : 0.4;
    const dodgeChance = Math.min(dodgeCap, you.spd * 0.01);
    const dodged = Math.random() < dodgeChance;
    const dmgIn = dodged ? 0 : rivalRoll.dmg;
    yourHp = Math.max(0, yourHp - dmgIn);
    log.push({
      turn,
      side: 'rival',
      dmg: dmgIn,
      crit: rivalRoll.crit && !dodged,
      remainingHp: yourHp,
    });
    if (yourHp <= 0) return { youWon: false, log, winnerHpRemaining: rivalHp };
  }

  // Draw @ ARENA_MAX_TURNS — wygrywa wyższy procent hpMax.
  const youPct = yourHp / you.hpMax;
  const rivalPct = rivalHp / rival.hpMax;
  const youWon = youPct >= rivalPct;
  return { youWon, log, winnerHpRemaining: youWon ? yourHp : rivalHp };
}

/**
 * Auto-battle dwóch fighterów. Zwraca wynik + log dla klienta. Obaj zaczynają
 * full HP. `youFirst: true` — gracz atakuje jako pierwszy (standard PvP
 * advantage dla atakującego).
 */
export function simulateDuel(
  you: CombatFighter,
  rival: CombatFighter,
): { youWon: boolean; log: ArenaLogEntry[] } {
  const { youWon, log } = simulateDuelWithHp(you, rival, you.hpMax, rival.hpMax);
  return { youWon, log };
}

/**
 * Reward formula — gold scaled z LVL'em, smaller consolation na loss. Nie
 * dajemy XP ani loot'u w MVP żeby arena nie była farm-bypass'em dla
 * content-gate'ów.
 */
export function computeGoldReward(lvl: number, won: boolean): number {
  return won ? 50 * lvl : 15 * lvl;
}

/**
 * Reset arena_fights_today gdy data się zmieniła (UTC rollover). Używane
 * w fight() przed inkrementem.
 */
export function resolveFightsToday(row: {
  arenaFightsToday: number;
  arenaLastFightDate: string | null;
}): number {
  const today = isoDateUTC();
  if (row.arenaLastFightDate === today) return row.arenaFightsToday;
  return 0;
}

/**
 * Listuje ostatnie N pojedynków gracza — jako attacker ORAZ defender (gdy
 * ktoś go zaatakował). `role` mapuje który wariant wiersza dotyczy request'era.
 */
export async function listArenaHistory(
  db: Db,
  characterId: string,
  limit: number = 10,
): Promise<ArenaMatchRow[]> {
  const rows = await db
    .select()
    .from(arenaMatches)
    .where(
      or(eq(arenaMatches.attackerId, characterId), eq(arenaMatches.defenderId, characterId)),
    )
    .orderBy(desc(arenaMatches.createdAt))
    .limit(limit);

  return rows.map((r) => {
    const isAttacker = r.attackerId === characterId;
    const role = isAttacker ? 'attacker' : 'defender';
    // Defender-perspective: won = !wonByAttacker; pointsDelta = -attacker's.
    const won = isAttacker ? r.wonByAttacker : !r.wonByAttacker;
    const pointsDelta = isAttacker ? r.pointsDelta : -r.pointsDelta;
    const opponentName = isAttacker ? r.defenderName : r.attackerName;
    const opponentCls = (isAttacker ? r.defenderCls : r.attackerCls) as CharacterClass;
    const opponentLvl = isAttacker ? r.defenderLvl : r.attackerLvl;
    const opponentKind = isAttacker
      ? (r.defenderKind as 'player' | 'npc')
      : 'player';
    // Gold reward — tylko attacker dostaje; defender widzi 0 w swojej historii.
    const goldReward = isAttacker ? r.goldReward : 0;
    return {
      id: r.id,
      role,
      opponentName,
      opponentCls,
      opponentLvl,
      opponentKind,
      won,
      pointsDelta,
      goldReward,
      createdAt: r.createdAt.getTime(),
    };
  });
}
