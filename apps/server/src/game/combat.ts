// Server-authoritative combat engine. RNG runs here; client never touches dmg math.

import type {
  CharacterClass,
  EnemyAbility,
  Rarity,
  StatusEffect,
} from '@grodno/shared';
import { REGISTRY, type EnemyTemplate, type ItemTemplate, type MobTier } from '../content/registry.js';
import type { LootTemplate } from './quests.js';

export type { MobTier, EnemyTemplate };

/**
 * Seed-source shape — DB-hydrated EnemyTemplate minus fields derived per-tier
 * during seeding (see content/seed.ts): `def`, `cooldownSec`, `dailyLimit`.
 * Runtime reads from REGISTRY still yield the full EnemyTemplate.
 */
export type EnemyDef = Omit<
  EnemyTemplate,
  'def' | 'cooldownSec' | 'dailyLimit' | 'abilities'
>;

// Pulled from the prototype dungeon roster; server is the source of truth.
// HP values are post-balance-pass (migration 0016): T1 ×1.30, T2 ×1.60, T3 ×1.70,
// T4 ×1.90 vs. original numbers. Keep in sync with the SQL UPDATE so fresh DBs
// see the same curve as migrated ones.
export const DUNGEON_ENEMIES: readonly EnemyDef[] = [
  // Tier 1 — L1-4 (Akt I early)
  { slug: 'goblin-scav', name: 'Goblin Śmieciarz', lvl: 2, hp: 78, atk: 5, gold: 35, xp: 22, requiredLvl: 1, tier: 1 },
  { slug: 'rat-giant', name: 'Szczur Olbrzym', lvl: 3, hp: 98, atk: 6, gold: 40, xp: 28, requiredLvl: 2, tier: 1 },
  { slug: 'slime-green', name: 'Zielony Slime', lvl: 3, hp: 143, atk: 4, gold: 50, xp: 32, requiredLvl: 2, tier: 1 },
  { slug: 'kobold-thief', name: 'Kobold Złodziej', lvl: 4, hp: 91, atk: 8, gold: 70, xp: 38, requiredLvl: 3, tier: 1 },
  { slug: 'goblin-warrior', name: 'Goblin Wojownik', lvl: 4, hp: 124, atk: 9, gold: 80, xp: 45, requiredLvl: 3, tier: 1 },
  // Tier 2 — L5-8 (Akt II)
  { slug: 'cave-spider', name: 'Jaskiniowy Pająk', lvl: 5, hp: 136, atk: 11, gold: 90, xp: 55, requiredLvl: 5, tier: 2 },
  { slug: 'skeleton-soldier', name: 'Szkielet Żołnierz', lvl: 5, hp: 208, atk: 10, gold: 100, xp: 60, requiredLvl: 5, tier: 2 },
  { slug: 'bat-dire', name: 'Dire Bat', lvl: 6, hp: 160, atk: 12, gold: 110, xp: 70, requiredLvl: 6, tier: 2 },
  { slug: 'troll-cave', name: 'Troll Jaskiniowy', lvl: 7, hp: 352, atk: 14, gold: 180, xp: 110, requiredLvl: 7, tier: 2 },
  { slug: 'demon-imp', name: 'Imp', lvl: 7, hp: 240, atk: 16, gold: 200, xp: 125, requiredLvl: 7, tier: 2 },
  { slug: 'ogre-brute', name: 'Ogr Brutal', lvl: 8, hp: 448, atk: 15, gold: 240, xp: 150, requiredLvl: 8, tier: 2 },
  { slug: 'skeleton-captain', name: 'Szkielet Kapitana', lvl: 8, hp: 320, atk: 17, gold: 260, xp: 165, requiredLvl: 8, tier: 2 },
  // Tier 3 — L9-12 (Akt III mid)
  { slug: 'goblin-shaman', name: 'Goblin Szaman', lvl: 9, hp: 289, atk: 22, gold: 320, xp: 200, requiredLvl: 10, tier: 3 },
  { slug: 'minotaur', name: 'Minotaur', lvl: 9, hp: 578, atk: 18, gold: 360, xp: 220, requiredLvl: 10, tier: 3 },
  { slug: 'slime-shadow', name: 'Mroczny Slime', lvl: 10, hp: 442, atk: 16, gold: 380, xp: 240, requiredLvl: 11, tier: 3 },
  { slug: 'wraith', name: 'Widmo', lvl: 10, hp: 306, atk: 26, gold: 420, xp: 270, requiredLvl: 12, tier: 3 },
  // Tier 4 — L13-15 (Akt III late)
  { slug: 'hobgoblin-king', name: 'Król Hobgoblinów', lvl: 12, hp: 988, atk: 22, gold: 800, xp: 500, requiredLvl: 13, tier: 4 },
  // Chapter 2 teaser — dostępne od L16+
  { slug: 'bone-dragon', name: 'Kościany Smok', lvl: 14, hp: 1292, atk: 28, gold: 1200, xp: 780, requiredLvl: 16, tier: 4 },
  { slug: 'void-horror', name: 'Pustkowy Horror', lvl: 16, hp: 1615, atk: 32, gold: 1800, xp: 1100, requiredLvl: 18, tier: 4 },
  // Dungeon bosses (Etap 1). tier=4 ale DEF i stats wyższe niż regular mobki.
  // Seed per-slug DEF override w content/seed.ts (BOSS_SLUGS ma custom DEF).
  { slug: 'rat-king-baltazar', name: 'Szczurzy Król Baltazar', lvl: 6, hp: 480, atk: 14, gold: 250, xp: 150, requiredLvl: 6, tier: 4 },
  { slug: 'kosciej-elder', name: 'Kosciej Starszy', lvl: 11, hp: 880, atk: 22, gold: 600, xp: 360, requiredLvl: 11, tier: 4 },
  { slug: 'lord-of-the-peaks', name: 'Władca Turni', lvl: 18, hp: 2000, atk: 36, gold: 2200, xp: 1400, requiredLvl: 18, tier: 4 },

  // ================= CHAPTER 2 · PUSZCZA CIEŃ · TIER 5 =================
  // Szlaki Leśne (L16-20)
  { slug: 'forest-bandit', name: 'Leśny Bandyta', lvl: 16, hp: 380, atk: 18, gold: 480, xp: 300, requiredLvl: 16, tier: 5 },
  { slug: 'boar-tusk', name: 'Dzik Kłoposty', lvl: 17, hp: 680, atk: 20, gold: 520, xp: 340, requiredLvl: 17, tier: 5 },
  { slug: 'goblin-scout', name: 'Zwiadowca Goblinów', lvl: 18, hp: 420, atk: 24, gold: 560, xp: 380, requiredLvl: 18, tier: 5 },
  { slug: 'wolf-pack', name: 'Wilk Watahy', lvl: 19, hp: 520, atk: 26, gold: 600, xp: 420, requiredLvl: 19, tier: 5 },
  { slug: 'treant-young', name: 'Młody Drzewiec', lvl: 20, hp: 880, atk: 22, gold: 680, xp: 470, requiredLvl: 20, tier: 5 },
  // Kurhany Starych Bogów (L21-25)
  { slug: 'ghoul-risen', name: 'Upiór Wstały', lvl: 21, hp: 560, atk: 28, gold: 740, xp: 520, requiredLvl: 21, tier: 5 },
  { slug: 'skeleton-priest', name: 'Szkielet Kapłana', lvl: 22, hp: 500, atk: 30, gold: 820, xp: 580, requiredLvl: 22, tier: 5 },
  { slug: 'bone-golem', name: 'Kościany Golem', lvl: 23, hp: 1100, atk: 26, gold: 900, xp: 640, requiredLvl: 23, tier: 5 },
  { slug: 'wraith-howler', name: 'Widmo Wyjące', lvl: 24, hp: 620, atk: 34, gold: 980, xp: 720, requiredLvl: 24, tier: 5 },
  { slug: 'lich-acolyte', name: 'Adept Lisza', lvl: 25, hp: 680, atk: 36, gold: 1060, xp: 800, requiredLvl: 25, tier: 5 },
  // Serce Puszczy (L26-30)
  { slug: 'dryad-matron', name: 'Dziewonia Starsza', lvl: 26, hp: 780, atk: 32, gold: 1180, xp: 900, requiredLvl: 26, tier: 5 },
  { slug: 'treant-elder', name: 'Drzewiec Pradawny', lvl: 27, hp: 1400, atk: 30, gold: 1300, xp: 1000, requiredLvl: 27, tier: 5 },
  { slug: 'corrupted-deer', name: 'Skażony Jeleń', lvl: 28, hp: 860, atk: 40, gold: 1420, xp: 1120, requiredLvl: 28, tier: 5 },
  { slug: 'mist-wraith', name: 'Widmo Mgły', lvl: 29, hp: 740, atk: 38, gold: 1560, xp: 1240, requiredLvl: 29, tier: 5 },
  { slug: 'shadow-beast', name: 'Bestia Cienia', lvl: 30, hp: 1000, atk: 42, gold: 1700, xp: 1380, requiredLvl: 30, tier: 5 },
  // Bosse regionu 2 (tier 5, cooldown 1h, daily_limit 1, abilities w migracji 0026)
  { slug: 'wilkolak-matecznika', name: 'Wilkołak Matecznika', lvl: 22, hp: 2600, atk: 48, gold: 3200, xp: 2200, requiredLvl: 22, tier: 5 },
  { slug: 'strzygon-dziadowski', name: 'Strzygoń Dziadowski', lvl: 27, hp: 3600, atk: 56, gold: 4800, xp: 3400, requiredLvl: 27, tier: 5 },
  { slug: 'panna-leszczyna', name: 'Panna Leszczyna', lvl: 32, hp: 5200, atk: 66, gold: 7000, xp: 5200, requiredLvl: 32, tier: 5 },

  // ================= CHAPTER 4 · GRANIE STRZELISTYCH IGLIC · TIER 7 =================
  // Wysokogórskie pustkowia (L48-65). HP/ATK skalowane od tier-5 boss baseline ×1.5.
  // 4 normalne moby + 2 bossy. Daily limit 1 (tier 7), cooldown 60 min.
  { slug: 'swiszcz-hardy', name: 'Świszcz Hardy', lvl: 48, hp: 1400, atk: 72, gold: 2400, xp: 1900, requiredLvl: 48, tier: 7 },
  { slug: 'straznik-granii', name: 'Strażnik Granii', lvl: 51, hp: 2200, atk: 80, gold: 2900, xp: 2300, requiredLvl: 51, tier: 7 },
  { slug: 'lodowy-tropiciel', name: 'Lodowy Tropiciel', lvl: 54, hp: 1700, atk: 92, gold: 3500, xp: 2800, requiredLvl: 54, tier: 7 },
  { slug: 'mrozny-upior', name: 'Mroźny Upior', lvl: 57, hp: 1900, atk: 100, gold: 4200, xp: 3400, requiredLvl: 57, tier: 7 },
  // Bosse Granii — daily_limit 1, cooldown 60min, BOSS_SLUGS dostają +50% DEF.
  { slug: 'ognista-pani', name: 'Ognista Pani', lvl: 60, hp: 7800, atk: 120, gold: 9500, xp: 7200, requiredLvl: 60, tier: 7 },
  { slug: 'skarbnik-otchlani', name: 'Skarbnik Otchłani', lvl: 65, hp: 12000, atk: 145, gold: 14000, xp: 11000, requiredLvl: 65, tier: 7 },
];

export function getEnemy(slug: string): EnemyTemplate | null {
  return REGISTRY.enemies.get(slug) ?? null;
}

export interface CombatSession {
  combatId: string;
  userId: string;
  characterId: string;
  /**
   * Source of this combat. Dungeon = regular mob/boss with XP/loot/kill-log
   * rewards. Tower = Wieża Bezdenna floor boss — no XP, no mob loot; victory
   * bumps `tower_progress.current_floor` and grants gold/gems.
   */
  kind: 'dungeon' | 'tower';
  /**
   * Only set for `kind='tower'` — which floor this boss belongs to. Used by
   * the victory path in tower router to compute reward + update progress.
   */
  towerFloor?: number;
  enemy: EnemyTemplate;
  enemyHp: number;
  playerHp: number;
  playerHpMax: number;
  playerMp: number;
  playerMpMax: number;
  /** Effective stats at engage time: base + equipped items + companion buffs. */
  playerAtk: number;
  playerDef: number;
  playerMag: number;
  playerSpd: number;
  playerCls: CharacterClass;
  /**
   * Companion `healBonus` (0..1) cached at engage — multiplies potion HP/MP
   * heal amounts. 0 when no companion is hired or the buff doesn't apply.
   */
  playerHealBonus: number;
  /**
   * True when engage consumed an active trop on this enemy. Drives gold×2 /
   * xp×2 / drop-rate×1.5 in `applyVictoryReward`. Set once at engage; removing
   * the track row happens before the session is created.
   */
  trackBonus: boolean;
  /**
   * Aktywne statusy (DOT, debuffy) nałożone na gracza w tej walce. Tickowane
   * na początku każdej tury gracza. Po walce znikają — nie persystują.
   */
  playerStatus: StatusEffect[];
  /**
   * Turns remaining until MOCNY is available again. Starts at 0 (ready), set to
   * `HEAVY_COOLDOWN_TURNS` after a heavy swing, decrements on every other turn
   * (including heal). Exposed to the client so the button can show the badge.
   */
  heavyCooldown: number;
  status: 'fight' | 'victory' | 'defeat';
  rewardApplied: boolean;
  createdAt: number;
}

/** How many turns MOCNY is locked after use. */
export const HEAVY_COOLDOWN_TURNS = 3;

// In-memory session store. For multi-instance deployments move to Redis.
const SESSIONS = new Map<string, CombatSession>();
const SESSION_TTL_MS = 10 * 60_000;

export function createSession(s: CombatSession): void {
  SESSIONS.set(s.combatId, s);
  reapSessions();
}

export function getSession(combatId: string): CombatSession | null {
  reapSessions();
  return SESSIONS.get(combatId) ?? null;
}

export function deleteSession(combatId: string): void {
  SESSIONS.delete(combatId);
}

function reapSessions(): void {
  const now = Date.now();
  for (const [id, s] of SESSIONS) {
    if (now - s.createdAt > SESSION_TTL_MS) SESSIONS.delete(id);
  }
}

export interface AttackRoll {
  dmg: number;
  crit: boolean;
  /** True when a heavy swing rolled a miss — `dmg` is 0 in that case. */
  miss: boolean;
}

export interface EnemyAttackRoll {
  dmg: number;
  /** True when the player's SPD-based dodge nullified the hit — `dmg` is 0. */
  dodged: boolean;
}

export interface PlayerCombatStats {
  atk: number;
  mag: number;
  spd: number;
}

export interface PlayerDefenseStats {
  def: number;
  spd: number;
}

const CRIT_RATE = 0.2;
// Tuned down from 1.8 in the 0016 balance pass — 1.8 one-shot same-tier mobs
// with modest gear. 1.6 keeps crits noticeable (+60% over a regular hit) but
// removes the "win the fight in one button" pattern.
const CRIT_MULT = 1.6;

// Balance pass 3: po migracji 0016 HP mobów poszło w górę, ale skalowanie
// ATK graczem przez trening u Trenera + gear nadal pozwala na 70+ dmg per hit
// na L7. Halvujemy kontrybucję ATK/MAG w formule — gear i trening dalej są
// ważne, ale hity na mid-level mobach już nie one-shotują. Flat floor
// (`*_BASE_FLAT`) zostaje żeby postać bez ekwipunku nie waliła za 1.
const PLAYER_ATK_SCALE = 0.5;
const PLAYER_NORM_FLAT = 4;
const PLAYER_HEAVY_FLAT = 4; // same as norm; heavy extracts extra via ×1.6
const PLAYER_MAGIC_FLAT = 8;

/**
 * Dodge caps by class. Warrior tanks hits (low cap); rogue is the dedicated
 * evasion class; mage needs dodge to survive low HP.
 */
export const DODGE_CAP_BY_CLASS: Record<CharacterClass, number> = {
  warrior: 0.25,
  rogue: 0.4,
  mage: 0.4,
};

/**
 * Symmetric armor-reduction curve. `raw × 100 / (100 + def)` asymptotes to 0 %
 * with no cap and no breakpoints — DEF 10 mitigates ~9 %, DEF 50 mitigates 33 %,
 * DEF 100 mitigates 50 %. Output is clamped to `≥ 1` so an un-winnable wall is
 * never constructed: a maxed-def enemy still takes 1 dmg per hit.
 */
export function reduce(raw: number, def: number): number {
  if (raw <= 0) return 0;
  return Math.max(1, Math.ceil((raw * 100) / (100 + Math.max(0, def))));
}

/** Heavy swings miss more for clumsy characters; rogues barely miss. */
function heavyMissRate(spd: number): number {
  return Math.max(0.05, 0.25 - spd * 0.006);
}

export function rollPlayerAttack(
  kind: 'norm' | 'heavy' | 'magic',
  eff: PlayerCombatStats,
  enemyDef: number,
): AttackRoll {
  // Heavy can fan the air — short-circuit before any other math so a missed
  // swing never accidentally crits or chews mitigation.
  if (kind === 'heavy' && Math.random() < heavyMissRate(eff.spd)) {
    return { dmg: 0, crit: false, miss: true };
  }

  const crit = Math.random() < CRIT_RATE;
  let raw: number;
  let effectiveDef = enemyDef;

  if (kind === 'magic') {
    raw = eff.mag * PLAYER_ATK_SCALE + PLAYER_MAGIC_FLAT + Math.random() * 8;
    // Armor pierce — magic bypasses half the target's physical plating.
    effectiveDef = Math.floor(enemyDef * 0.5);
  } else if (kind === 'heavy') {
    raw =
      (eff.atk * PLAYER_ATK_SCALE + PLAYER_HEAVY_FLAT) * 1.6 + Math.random() * 8;
  } else {
    raw = eff.atk * PLAYER_ATK_SCALE + PLAYER_NORM_FLAT + Math.random() * 6;
  }

  if (crit) raw *= CRIT_MULT;
  const dmg = reduce(Math.round(raw), effectiveDef);
  return { dmg, crit, miss: false };
}

export interface EnemyAttackRollFull extends EnemyAttackRoll {
  /** Która umiejętność zaprocowała (lub null). Klient używa do log'a i ikony. */
  abilityUsed: EnemyAbility | null;
  /** Status nałożony na gracza tą turą (lub null). Tylko `poison` aktualnie. */
  statusApplied: StatusEffect | null;
}

/**
 * Wybiera ability które zaprocuje w tej turze — pierwszy wchodzący z listy
 * liczony po `chance`. Jeśli lista ma jedno wejście, to prosty flip monety.
 * Zaprojektowane pod obecny seed (każdy mob ma 0 lub 1 ability); struktura
 * znosi więcej jeśli w przyszłości dorzucimy multi-ability casterów.
 */
function pickAbility(abilities: readonly EnemyAbility[]): EnemyAbility | null {
  for (const ability of abilities) {
    if (Math.random() < ability.chance) return ability;
  }
  return null;
}

export function rollEnemyAttack(
  enemyAtk: number,
  player: PlayerDefenseStats,
  charClass: CharacterClass,
  abilities: readonly EnemyAbility[] = [],
): EnemyAttackRollFull {
  const cap = DODGE_CAP_BY_CLASS[charClass];
  const dodgeChance = Math.min(cap, Math.max(0, player.spd) * 0.01);
  if (Math.random() < dodgeChance) {
    return { dmg: 0, dodged: true, abilityUsed: null, statusApplied: null };
  }
  const ability = pickAbility(abilities);
  // `magic` i `armor_pierce` przepychają się przez połowę DEF (mirror player
  // magic pierce). `poison` hituje normalnie i aplikuje DOT.
  const pierced =
    ability?.kind === 'magic' || ability?.kind === 'armor_pierce';
  const effectiveDef = pierced ? Math.floor(player.def * 0.5) : player.def;
  const raw = Math.round(enemyAtk + Math.random() * 4);
  const dmg = reduce(raw, effectiveDef);
  const statusApplied: StatusEffect | null =
    ability?.kind === 'poison'
      ? {
          kind: 'poison',
          dmgPerTurn: ability.dmgPerTurn,
          turnsRemaining: ability.turns,
        }
      : null;
  return { dmg, dodged: false, abilityUsed: ability, statusApplied };
}

/**
 * Ticks active DOTs on the player at the start of the player's turn. Returns
 * total damage dealt this tick and the decremented status list (entries with
 * 0 turns remaining are dropped). Caller applies `dmg` to `playerHp` and
 * replaces `session.playerStatus` with the returned list.
 */
export function tickPlayerStatus(status: readonly StatusEffect[]): {
  dmg: number;
  next: StatusEffect[];
} {
  let dmg = 0;
  const next: StatusEffect[] = [];
  for (const s of status) {
    dmg += s.dmgPerTurn;
    const remaining = s.turnsRemaining - 1;
    if (remaining > 0) {
      next.push({ ...s, turnsRemaining: remaining });
    }
  }
  return { dmg, next };
}

/**
 * Re-apply a status: if same kind already present, refresh to the new duration
 * (don't stack). Returns a fresh list.
 */
export function applyStatus(
  existing: readonly StatusEffect[],
  incoming: StatusEffect,
): StatusEffect[] {
  const filtered = existing.filter((s) => s.kind !== incoming.kind);
  return [...filtered, incoming];
}

// ===========================================================================
// Mob loot pools — SEED SOURCE ONLY. Runtime readers pull from REGISTRY.
// `rollMobLoot` below uses REGISTRY.mobLoot; these TS arrays are only
// imported by content/seed.ts to hydrate a fresh DB.
// ===========================================================================

const MELEE: readonly CharacterClass[] = ['warrior', 'rogue'];
const CASTER: readonly CharacterClass[] = ['mage'];

interface MobLootPool {
  dropRate: number; // 0-1 chance on kill
  items: readonly LootTemplate[];
}

export const MOB_LOOT_POOLS: Record<MobTier, MobLootPool> = {
  1: {
    dropRate: 0.25,
    items: [
      { name: 'Ostra Drzazga', icon: 'dagger-splinter', rarity: 'common', slot: 'weapon', atk: 2, desc: 'Spiczasta. Tyle musi wystarczyć.', allowedClasses: MELEE },
      { name: 'Różdżka Pączka', icon: 'orb', rarity: 'common', slot: 'weapon', mag: 3, desc: 'Pachnie ciastem. Działa.', allowedClasses: CASTER },
      { name: 'Obszarpana Czapka', icon: 'helmet', rarity: 'common', slot: 'head', def: 2, desc: 'Kiedyś wełniana. Kiedyś.' },
      { name: 'Płócienne Rękawice', icon: 'gloves-cloth', rarity: 'common', slot: 'hands', def: 1, desc: 'Raczej dla ciepła niż obrony.' },
      { name: 'Mikstura Pierwsza Lepsza', icon: 'potion-first', rarity: 'common', slot: 'potion', desc: 'Leczy trochę. Albo wcale.' },
      { name: 'Szczurzy Ząb', icon: 'amulet-rat-tooth', rarity: 'rare', slot: 'neck', mag: 3, desc: 'Kolekcjonerska wartość niewielka. Magia — zaskakująco.' },
      { name: 'Goblinka Tarcza', icon: 'shield-item', rarity: 'rare', slot: 'off', def: 5, desc: 'Pomalowana w kogucik.' },
    ],
  },
  2: {
    dropRate: 0.3,
    items: [
      { name: 'Miecz Ducha', icon: 'sword', rarity: 'rare', slot: 'weapon', atk: 9, desc: 'Lekko prześwituje.', allowedClasses: MELEE },
      { name: 'Kostur Szpiega', icon: 'orb', rarity: 'rare', slot: 'weapon', mag: 11, desc: 'Szepcze to, co inni myślą.', allowedClasses: CASTER },
      { name: 'Kolczuga Kowalowej', icon: 'chestplate-smith', rarity: 'rare', slot: 'chest', def: 9, desc: 'Kowal zrobił. Kowalowa dopracowała.' },
      { name: 'Buty Pająka', icon: 'boots', rarity: 'rare', slot: 'feet', def: 6, desc: 'Chodzisz po ścianach. Chwilowo.' },
      { name: 'Pierścień Szeptu', icon: 'ring', rarity: 'rare', slot: 'ring', mag: 7, desc: 'Zawsze wiesz co mówią inni.' },
      { name: 'Mikstura Średniego HP', icon: 'potion-medium', rarity: 'rare', slot: 'potion', desc: 'Działa. Smak — pomijalny.' },
      { name: 'Sztylet Imp-a', icon: 'dagger', rarity: 'epic', slot: 'weapon', atk: 13, desc: 'Gryzie ogniem.', allowedClasses: MELEE },
      { name: 'Orb Impowej Igraszki', icon: 'orb', rarity: 'epic', slot: 'weapon', mag: 16, desc: 'Gra w kości sam ze sobą.', allowedClasses: CASTER },
    ],
  },
  3: {
    dropRate: 0.35,
    items: [
      { name: 'Topór Minotaura', icon: 'sword', rarity: 'rare', slot: 'weapon', atk: 14, desc: 'Ciężki. Ale ty też.', allowedClasses: MELEE },
      { name: 'Różdżka Szamana', icon: 'orb', rarity: 'rare', slot: 'weapon', mag: 16, desc: 'Wieczorem świeci.', allowedClasses: CASTER },
      { name: 'Płaszcz Cienia', icon: 'chestplate', rarity: 'epic', slot: 'chest', def: 14, mag: 3, desc: 'Cichy jak myśl.' },
      { name: 'Pierścień Widma', icon: 'ring', rarity: 'epic', slot: 'ring', mag: 12, desc: 'Palec prześwituje.' },
      { name: 'Amulet Szamana', icon: 'necklace', rarity: 'epic', slot: 'neck', mag: 14, desc: 'Wie, którą ręką się witać.' },
      { name: 'Sztylet Mrocznego Slime-a', icon: 'dagger', rarity: 'epic', slot: 'weapon', atk: 20, desc: 'Lepki i skuteczny.', allowedClasses: MELEE },
      { name: 'Kostur Mrocznego Sabatu', icon: 'orb', rarity: 'epic', slot: 'weapon', mag: 22, desc: 'Przy pełni mruczy.', allowedClasses: CASTER },
      { name: 'Obsydianowa Korona', icon: 'helmet', rarity: 'legendary', slot: 'head', def: 22, mag: 10, desc: 'Waży jak obowiązek.' },
    ],
  },
  4: {
    dropRate: 0.4,
    items: [
      { name: 'Topór Tronowy', icon: 'sword', rarity: 'epic', slot: 'weapon', atk: 26, desc: 'Rozpoznaje koronowane głowy.', allowedClasses: MELEE },
      { name: 'Kostur Tronowy', icon: 'orb', rarity: 'epic', slot: 'weapon', mag: 30, desc: 'Głosi wyroki za ciebie.', allowedClasses: CASTER },
      { name: 'Peleryna Kata', icon: 'chestplate', rarity: 'epic', slot: 'chest', def: 20, desc: 'Wywija się teatralnie.' },
      { name: 'Sztylet Smoczy', icon: 'dagger', rarity: 'legendary', slot: 'weapon', atk: 38, desc: 'Z łuski. Z pyska. Z kolekcji.', allowedClasses: MELEE },
      { name: 'Berło Pustki', icon: 'orb', rarity: 'legendary', slot: 'weapon', mag: 44, desc: 'Pije światło wokół siebie.', allowedClasses: CASTER },
      { name: 'Pierścień Hobgoblin Kinga', icon: 'ring', rarity: 'legendary', slot: 'ring', mag: 20, desc: 'Nosi go Król. I ty, dzisiaj.' },
      { name: 'Diadem Tronowy', icon: 'crown-throne', rarity: 'legendary', slot: 'head', def: 28, mag: 16, desc: 'Klejnot środkowy — oko Pustki. Patrzy wstecz.' },
    ],
  },
  // Tier 5 — Chapter 2 (Puszcza Cień, L16-32). Mocniejsze statsy, rzadsze
  // wpadki common'a. Pool można odświeżyć po pierwszych tygodniach rozgrywki
  // — na razie zestaw jest „puszczański" (korzenie, kości, mgła, księżyc).
  5: {
    dropRate: 0.45,
    items: [
      { name: 'Miecz Borowy', icon: 'sword-bor', rarity: 'rare', slot: 'weapon', atk: 22, desc: 'Gałąź z runą. Tnie czysto.', allowedClasses: MELEE },
      { name: 'Kostur Runowy', icon: 'staff-rune', rarity: 'rare', slot: 'weapon', mag: 26, desc: 'Pamięta każdy przesąd.', allowedClasses: CASTER },
      { name: 'Kolczuga Watahy', icon: 'chestplate-pack', rarity: 'epic', slot: 'chest', def: 26, atk: 4, desc: 'Ogniwa kute na poroża.' },
      { name: 'Buty Kurhanne', icon: 'boots-kurhan', rarity: 'epic', slot: 'feet', def: 18, mag: 4, desc: 'Stąpają ciszej niż mgła.' },
      { name: 'Pierścień Puszczański', icon: 'ring-forest', rarity: 'epic', slot: 'ring', mag: 18, def: 6, desc: 'Zielony błysk w środku. Żywy.' },
      { name: 'Mikstura Mocna HP', icon: 'potion-big', rarity: 'epic', slot: 'potion', desc: 'Stawia na nogi. Dosłownie.' },
      { name: 'Sztylet Mgły', icon: 'dagger-mist', rarity: 'legendary', slot: 'weapon', atk: 46, desc: 'Znika kiedy tego potrzebujesz.', allowedClasses: MELEE },
      { name: 'Kostur Starszej', icon: 'staff-elder', rarity: 'legendary', slot: 'weapon', mag: 52, desc: 'Mówi głosem babci. Tej, o której się nie mówi.', allowedClasses: CASTER },
    ],
  },
  // Tier 6 — Chapter 3 (Bagna Czarnej Strzygi, L33-50). Błotno-strzygoński
  // set: żelazne hufnale, topielcze szaty, czarne runy. Legendary bardzo
  // realne, common ekstremalnie rzadki — to endgame farm.
  6: {
    dropRate: 0.5,
    items: [
      { name: 'Żelazny Hufnal', icon: 'sword-hufnal', rarity: 'rare', slot: 'weapon', atk: 30, desc: 'Ktoś go wyjął z kogoś. Lepiej nie pytać.', allowedClasses: MELEE },
      { name: 'Trzcinowa Fujarka', icon: 'pipe-reed', rarity: 'rare', slot: 'weapon', mag: 36, desc: 'Fałszuje celowo. Komary tego nie znoszą.', allowedClasses: CASTER },
      { name: 'Pancerz z Sieci Bagiennej', icon: 'chestplate-net', rarity: 'epic', slot: 'chest', def: 32, desc: 'Mokry po deszczu, mokry też bez.' },
      { name: 'Rękawice Topielca', icon: 'gloves-drowned', rarity: 'epic', slot: 'hands', atk: 8, def: 16, desc: 'Lepkie. Przyjmuje się to na dobre.' },
      { name: 'Pierścień Mglistych Przysiąg', icon: 'ring-mist-oath', rarity: 'epic', slot: 'ring', mag: 22, def: 8, desc: 'Wiesz że to błąd. Nosisz mimo to.' },
      { name: 'Mikstura Czarnego Zaufania', icon: 'potion-black', rarity: 'epic', slot: 'potion', desc: 'Smakuje szumowinami. Robi swoje.' },
      { name: 'Głownia Upiora', icon: 'blade-wraith', rarity: 'legendary', slot: 'weapon', atk: 58, desc: 'Tnie cień przed ciałem.', allowedClasses: MELEE },
      { name: 'Runoryt Czarnej Wody', icon: 'staff-runestone', rarity: 'legendary', slot: 'weapon', mag: 66, desc: 'Czyta runy z błota. Niektóre się odczytuje.', allowedClasses: CASTER },
      { name: 'Amulet Strzygoński', icon: 'amulet-strzyga', rarity: 'legendary', slot: 'neck', mag: 28, def: 14, desc: 'Wisi. Nie śpi.' },
    ],
  },
  // Tier 7 — Chapter 4 (Granie Strzelistych Iglic, L48-65). Górskie ostrza,
  // mroźne runy, kamienie strażnika. Loot dropuje też z bossów Q48/Q50,
  // poza unique drops (klasowe legendarie idą oddzielnie).
  7: {
    dropRate: 0.55,
    items: [
      { name: 'Mróźny Topór Halnego', icon: 'axe-frost', rarity: 'rare', slot: 'weapon', atk: 38, desc: 'Tnie wiatr. Wiatr zauważa.', allowedClasses: MELEE },
      { name: 'Berło Iglicy Skalnej', icon: 'staff-spire', rarity: 'rare', slot: 'weapon', mag: 44, desc: 'Z kawałka strzelistej iglicy. Wciąż zimny.', allowedClasses: CASTER },
      { name: 'Płaszcz z Pumy Halnej', icon: 'cloak-mountain', rarity: 'epic', slot: 'chest', def: 38, desc: 'Puma znikła w halnym. Płaszcz został.' },
      { name: 'Hełm Skarbnika', icon: 'helm-skarbnik', rarity: 'epic', slot: 'head', def: 26, mag: 8, desc: 'Lampka kopalniana wciąż się tli. Cicho.' },
      { name: 'Pierścień Mroźnej Iglicy', icon: 'ring-frost-spire', rarity: 'epic', slot: 'ring', mag: 26, def: 10, desc: 'Palec marznie. Zaklęcia — niekoniecznie.' },
      { name: 'Eliksir Halnego Wiatru', icon: 'potion-wind', rarity: 'epic', slot: 'potion', desc: 'Smak — kwaśny. Skutek — zaskakujący.' },
      { name: 'Berło Ognistej Pani', icon: 'staff-flame', rarity: 'legendary', slot: 'weapon', mag: 78, desc: 'Płonie nawet na halnym. Niewdzięczne.', allowedClasses: CASTER },
      { name: 'Sztylet Łowczyni Granii', icon: 'dagger-spire', rarity: 'legendary', slot: 'weapon', atk: 70, desc: 'Cięcie raz. Drugi raz nie potrzeba.', allowedClasses: MELEE },
      { name: 'Amulet Smoka Halnego', icon: 'amulet-skarbnik', rarity: 'legendary', slot: 'neck', mag: 32, def: 18, desc: 'Smok dawno nie żyje. Amulet o tym nie wie.' },
    ],
  },
};

export const RARITY_WEIGHTS: Record<MobTier, Record<Rarity, number>> = {
  1: { common: 80, rare: 20, epic: 0, legendary: 0 },
  2: { common: 50, rare: 40, epic: 10, legendary: 0 },
  3: { common: 30, rare: 40, epic: 25, legendary: 5 },
  4: { common: 10, rare: 20, epic: 45, legendary: 25 },
  // Tier 5 — epickie dominują, legendary dobre szanse, common już tylko symbol.
  5: { common: 5, rare: 20, epic: 45, legendary: 30 },
  // Tier 6 — endgame. Legendary jest normą, common znika całkiem.
  6: { common: 0, rare: 15, epic: 45, legendary: 40 },
  // Tier 7 — Granie. Najwyższy szczyt — legendary normą, rare prawie nie ma.
  7: { common: 0, rare: 10, epic: 40, legendary: 50 },
};

export function rollRarity(weights: Record<Rarity, number>): Rarity {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const rarity of ['common', 'rare', 'epic', 'legendary'] as Rarity[]) {
    roll -= weights[rarity];
    if (roll <= 0) return rarity;
  }
  return 'common';
}

/**
 * Roll a combat drop. Returns null if no drop or pool empty for class.
 * Process: drop-rate gate → rarity roll → pick random item of that rarity
 * from the tier pool, filtered by class. Falls back to any rarity if the
 * specific rarity tier has no items for this class.
 *
 * Reads tier config + items from the content registry (DB-backed).
 */
export function rollMobLoot(
  tier: MobTier,
  cls: CharacterClass,
  /** Multiplier on the pool's base drop rate (capped at 1.0). 1 = normal, 1.5 = wytropiony. */
  dropRateMult = 1,
): ItemTemplate | null {
  const pool = REGISTRY.mobLoot.get(tier);
  if (!pool) return null;
  const effectiveDropRate = Math.min(1, pool.dropRate * dropRateMult);
  if (Math.random() >= effectiveDropRate) return null;

  const rarity = rollRarity(pool.rarityWeights);
  const accessible = pool.items.filter(
    (i) => !i.allowedClasses || i.allowedClasses.includes(cls),
  );
  if (accessible.length === 0) return null;

  const matching = accessible.filter((i) => i.rarity === rarity);
  const fallback = matching.length > 0 ? matching : accessible;
  return fallback[Math.floor(Math.random() * fallback.length)];
}
