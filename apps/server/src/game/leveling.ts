// Level-up curve and stat growth. Pure functions — no DB access; the routers
// call these after awarding XP to compute the new character state.

import type { CharacterClass, CharacterStats } from '@grodno/shared';
import { getChapterUnlockedAt } from './chapters.js';

/**
 * XP required to go from level N to N+1.
 *
 * The level system is **uncapped** — there is no MAX_LEVEL constant. Progression
 * is structured in bands:
 *
 *   L1–L30   = early game     (current curated content lives here)
 *   L30–L60  = mid game       (future content)
 *   L60–L100 = late game      (future content)
 *   L100+    = retention endgame (pure grind for long-haul players)
 *
 * Current content (15 questów, 19 mobów, 20 shop listings) is designed to
 * bring a fresh player to roughly L15–L16 by doing each quest once + farming
 * mobs. L15+ is idle grind until more content ships.
 *
 * Hand-tuned table covers L1–L14 (content band early). From L15 onwards
 * `xpFormula` takes over: `20 000 × 1.14^(n-15)`. That ramp gives:
 *   L16 ≈ 20k · L30 ≈ 140k · L60 ≈ 7M · L100 ≈ 1.2B · L200 ≈ 2.5 × 10¹⁴.
 *
 * Boss partial-level constraint preserved: q5(900 XP)/L5, q10(2800)/L10,
 * q14(4500)/L14, q15(10k)/L15 all land between 50–62 % of the target level.
 */
const XP_TO_NEXT: Record<number, number> = {
  1: 60,
  2: 120,
  3: 240,
  4: 400,
  5: 1_500,
  6: 1_500,
  7: 1_800,
  8: 2_200,
  9: 2_600,
  10: 4_500,
  11: 2_500,
  12: 3_000,
  13: 3_500,
  14: 4_500,
};

/**
 * Fallback for L15 and above. Starts at 20 000 (L15→L16 — q15 boss at L15
 * gives 10k = 50 % of this threshold) and grows 14 % per level. JS `number`
 * stays safe until L200+, `characters.xp_max` is bigint so no int32 overflow.
 */
function xpFormula(level: number): number {
  return Math.round(20_000 * Math.pow(1.14, level - 15));
}

export function xpToNext(level: number): number {
  return XP_TO_NEXT[level] ?? xpFormula(level);
}

interface ClassGrowth {
  hp: number;
  mp: number;
}

// Per-level auto growth applied on level-up, before item bonuses. Stats
// (atk/def/mag/spd) do NOT auto-grow — they're purchased via Trener.
const CLASS_GROWTH: Record<CharacterClass, ClassGrowth> = {
  warrior: { hp: 14, mp: 3 },
  mage: { hp: 8, mp: 10 },
  rogue: { hp: 10, mp: 5 },
};

/** Stamina max rises by 1 every 5 levels. Returns the cap for a given level. */
export function staminaMaxForLevel(level: number): number {
  return 10 + Math.floor(level / 5);
}

export interface LevelUpInfo {
  fromLevel: number;
  toLevel: number;
  hpGain: number;
  mpGain: number;
  staminaGain: number;
  newXpMax: number;
  chapterUnlock: {
    id: 'akt-1' | 'akt-2' | 'akt-3' | 'akt-4' | 'akt-5' | 'akt-6';
    name: string;
    subtitle: string;
    flavor: string;
  } | null;
}

/** Slice of character progression fields mutated on XP gain. */
export interface CharacterProgression {
  cls: CharacterClass;
  lvl: number;
  xp: number;
  xpMax: number;
  hp: number;
  hpMax: number;
  mp: number;
  mpMax: number;
  stamina: number;
  staminaMax: number;
}

export interface LevelUpResult {
  /** Progression state after all level-ups are applied. */
  progression: CharacterProgression;
  /**
   * One entry per level crossed. Usually 0 or 1; can be >1 if a single reward
   * spans multiple levels (e.g. low-level big XP boss).
   */
  ups: LevelUpInfo[];
}

/**
 * Apply gained XP to a character slice, cascading through any level-ups. Each
 * level crossed: xpMax advances, HP/MP bump by class template (also restored to
 * full), stamina cap may rise. Stats (atk/def/mag/spd) untouched — those come
 * from Trener. No level cap; the `xpFormula` fallback keeps thresholds growing
 * past the hand-tuned table indefinitely.
 */
export function applyXpGain(
  char: CharacterProgression,
  xpGained: number,
): LevelUpResult {
  if (xpGained <= 0) {
    return {
      progression: { ...char, xp: char.xp + Math.max(0, xpGained) },
      ups: [],
    };
  }

  const ups: LevelUpInfo[] = [];
  let xp = char.xp + xpGained;
  let lvl = char.lvl;
  let xpMax = char.xpMax;
  let hpMax = char.hpMax;
  let mpMax = char.mpMax;
  let staminaMax = char.staminaMax;

  while (xp >= xpMax) {
    const growth = CLASS_GROWTH[char.cls];
    const fromLevel = lvl;
    xp -= xpMax;
    lvl += 1;
    hpMax += growth.hp;
    mpMax += growth.mp;
    const newStaminaMax = staminaMaxForLevel(lvl);
    const staminaGain = newStaminaMax - staminaMax;
    staminaMax = newStaminaMax;
    const newXpMax = xpToNext(lvl);
    ups.push({
      fromLevel,
      toLevel: lvl,
      hpGain: growth.hp,
      mpGain: growth.mp,
      staminaGain,
      newXpMax,
      chapterUnlock: null,
    });
    xpMax = newXpMax;
  }

  const leveled = ups.length > 0;
  return {
    progression: {
      cls: char.cls,
      lvl,
      xp,
      xpMax,
      hpMax,
      mpMax,
      staminaMax,
      hp: leveled ? hpMax : char.hp,
      mp: leveled ? mpMax : char.mp,
      stamina: leveled ? Math.max(char.stamina, staminaMax) : char.stamina,
    },
    ups,
  };
}

/**
 * Summarize multiple level-ups into a single payload for the client modal.
 * Used when a single reward crosses several levels at once (rare, but possible
 * with boss quests). Also detects chapter unlocks between from→to levels.
 */
export function summarizeLevelUps(ups: readonly LevelUpInfo[]): LevelUpInfo | null {
  if (ups.length === 0) return null;
  const first = ups[0];
  const last = ups[ups.length - 1];
  // Chapter unlock: scan all newly-reached levels (fromLevel+1 .. toLevel) for
  // a chapter gate; report the highest one crossed.
  let chapterUnlock: LevelUpInfo['chapterUnlock'] = null;
  for (let lvl = first.fromLevel + 1; lvl <= last.toLevel; lvl += 1) {
    const ch = getChapterUnlockedAt(lvl);
    if (ch) {
      chapterUnlock = { id: ch.id, name: ch.name, subtitle: ch.subtitle, flavor: ch.flavor };
    }
  }
  return {
    fromLevel: first.fromLevel,
    toLevel: last.toLevel,
    hpGain: ups.reduce((a, u) => a + u.hpGain, 0),
    mpGain: ups.reduce((a, u) => a + u.mpGain, 0),
    staminaGain: ups.reduce((a, u) => a + u.staminaGain, 0),
    newXpMax: last.newXpMax,
    chapterUnlock,
  };
}

/** Stat-related helper: base max stats implied by class preset — reused in tests. */
export function classStarterStats(cls: CharacterClass): CharacterStats {
  const starters: Record<CharacterClass, CharacterStats> = {
    warrior: { atk: 18, def: 14, mag: 4, spd: 7 },
    mage: { atk: 6, def: 8, mag: 22, spd: 9 },
    rogue: { atk: 14, def: 10, mag: 6, spd: 16 },
  };
  return starters[cls];
}
