import type { IconName } from './icons';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type QuestDifficulty = 'Łatwe' | 'Średnie' | 'Trudne' | 'Ekstr.' | 'Boss';
export type QuestState = 'idle' | 'active' | 'done';

export interface Quest {
  id: string;
  title: string;
  desc: string;
  icon: IconName;
  diff: QuestDifficulty;
  gold: number;
  xp: number;
  itemChance: number;
  duration: number;
  state: QuestState;
  endsAt: number;
  /**
   * Unix millis when a `done` quest becomes startable again. `null` when the
   * quest is already available (state is `idle` or `active`, or the cooldown
   * has elapsed). Quests refresh at 00:00 UTC, matching the daily reset.
   */
  availableAt: number | null;
  /** Minimal character level to see this quest in the list. */
  requiredLvl: number;
  /** Which act this belongs to — used for UI grouping. */
  chapter: 'akt-1' | 'akt-2' | 'akt-3' | 'akt-4' | 'akt-5' | 'akt-6';
  /**
   * Bonus dungeon keys awarded on `quests.collect`. Optional on the seed-source
   * side (treated as 0 when absent); always a number on DB-hydrated registry
   * reads. Boss quests (q5/q10/q15) = 5, everyone else = 0.
   */
  rewardKeys?: number;
}

export interface LootItem {
  id?: string;
  name: string;
  icon: IconName;
  rarity: Rarity;
  qty?: number;
}

export interface QuestReward {
  gold: number;
  xp: number;
  gems?: number;
  /** Dungeon keys granted by this claim. 0 or omitted = none. */
  keys?: number;
  item?: LootItem | null;
  /** Level-up summary when the XP gain caused one or more awansows. */
  levelUp?: {
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
  } | null;
  /**
   * Osiągnięcia odblokowane tym collectem. Pusta = brak zmian.
   * Typ w `schemas.ts::AchievementUnlockPayload` — unikamy circular import
   * przez duck-type kompatybilny object shape.
   */
  unlockedAchievements?: Array<{
    id: string;
    name: string;
    icon: string;
    tier: 'bronze' | 'silver' | 'gold' | 'legendary';
    rewardGold: number;
    rewardGems: number;
  }>;
}

export interface Stamina {
  cur: number;
  max: number;
}
