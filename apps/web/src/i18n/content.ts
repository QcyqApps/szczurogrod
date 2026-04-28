// Content-translation maps (PL→EN) keyed by server slug/id. Server stays
// PL-only (existing seed data); these maps override at render time when the
// active language is EN. Missing entries fall back to PL transparently.
//
// Layout: one nested record per content category. Each entry holds the EN
// values for the fields displayed to the player. PL is the implicit fallback,
// so we don't store it here.

import { useLangStore } from './store';

export interface ItemEN {
  name?: string;
  desc?: string;
}
export interface EnemyEN {
  name?: string;
}
export interface QuestEN {
  title?: string;
  desc?: string;
}
export interface CompanionEN {
  name?: string;
  trait?: string;
}
export interface MountEN {
  name?: string;
  desc?: string;
}
export interface RaidBossEN {
  name?: string;
  flavor?: string;
}
export interface GuildBuildingEN {
  name?: string;
}
export interface RegionEN {
  name?: string;
}
export interface DungeonEN {
  name?: string;
  desc?: string;
}
export interface AchievementEN {
  name?: string;
  desc?: string;
}
export interface BlessingEN {
  name?: string;
  desc?: string;
}
export interface OracleEN {
  text?: string;
}
export interface CurseEN {
  name?: string;
  desc?: string;
}

// Items are keyed by their PL name (the server-returned identifier — IDs are
// content-hash and not stable across shop/loot/boss-drop sources). Everything
// else is keyed by slug or template id.
export const CONTENT_EN = {
  itemsByName: {} as Record<string, ItemEN>,
  enemies: {} as Record<string, EnemyEN>,
  quests: {} as Record<string, QuestEN>,
  companions: {} as Record<string, CompanionEN>,
  mounts: {} as Record<string, MountEN>,
  raidBosses: {} as Record<string, RaidBossEN>,
  guildBuildings: {} as Record<string, GuildBuildingEN>,
  regions: {} as Record<string, RegionEN>,
  dungeons: {} as Record<string, DungeonEN>,
  achievements: {} as Record<string, AchievementEN>,
  blessings: {} as Record<string, BlessingEN>,
  oracle: {} as Record<string, OracleEN>,
  curses: {} as Record<string, CurseEN>,
};

type ContentLookup = (key: string | null | undefined, fallback: string) => string;

interface ContentTranslator {
  /** Item lookup by PL name — server returns name in PL on every item shape. */
  itemName: ContentLookup;
  itemDesc: ContentLookup;
  enemyName: ContentLookup;
  questTitle: ContentLookup;
  questDesc: ContentLookup;
  companionName: ContentLookup;
  companionTrait: ContentLookup;
  mountName: ContentLookup;
  mountDesc: ContentLookup;
  raidBossName: ContentLookup;
  raidBossFlavor: ContentLookup;
  guildBuildingName: ContentLookup;
  regionName: ContentLookup;
  dungeonName: ContentLookup;
  dungeonDesc: ContentLookup;
  achievementName: ContentLookup;
  achievementDesc: ContentLookup;
  blessingName: ContentLookup;
  blessingDesc: ContentLookup;
  curseName: ContentLookup;
  curseDesc: ContentLookup;
  oracleText: ContentLookup;
}

function makeLookup<T>(
  isEn: () => boolean,
  bag: Record<string, T>,
  field: keyof T,
): ContentLookup {
  return (key, fallback) => {
    if (!isEn() || !key) return fallback;
    const v = bag[key]?.[field];
    return typeof v === 'string' && v.length > 0 ? v : fallback;
  };
}

/**
 * Hook returning translators for every content category. Use field-specific
 * helpers (`itemName(id, fallback)`) at the React render site — fallback is
 * the original PL string from the server.
 */
export function useContentT(): ContentTranslator {
  const lang = useLangStore((s) => s.lang);
  const isEn = () => lang === 'en';
  return {
    itemName: makeLookup(isEn, CONTENT_EN.itemsByName, 'name'),
    itemDesc: makeLookup(isEn, CONTENT_EN.itemsByName, 'desc'),
    enemyName: makeLookup(isEn, CONTENT_EN.enemies, 'name'),
    questTitle: makeLookup(isEn, CONTENT_EN.quests, 'title'),
    questDesc: makeLookup(isEn, CONTENT_EN.quests, 'desc'),
    companionName: makeLookup(isEn, CONTENT_EN.companions, 'name'),
    companionTrait: makeLookup(isEn, CONTENT_EN.companions, 'trait'),
    mountName: makeLookup(isEn, CONTENT_EN.mounts, 'name'),
    mountDesc: makeLookup(isEn, CONTENT_EN.mounts, 'desc'),
    raidBossName: makeLookup(isEn, CONTENT_EN.raidBosses, 'name'),
    raidBossFlavor: makeLookup(isEn, CONTENT_EN.raidBosses, 'flavor'),
    guildBuildingName: makeLookup(isEn, CONTENT_EN.guildBuildings, 'name'),
    regionName: makeLookup(isEn, CONTENT_EN.regions, 'name'),
    dungeonName: makeLookup(isEn, CONTENT_EN.dungeons, 'name'),
    dungeonDesc: makeLookup(isEn, CONTENT_EN.dungeons, 'desc'),
    achievementName: makeLookup(isEn, CONTENT_EN.achievements, 'name'),
    achievementDesc: makeLookup(isEn, CONTENT_EN.achievements, 'desc'),
    blessingName: makeLookup(isEn, CONTENT_EN.blessings, 'name'),
    blessingDesc: makeLookup(isEn, CONTENT_EN.blessings, 'desc'),
    curseName: makeLookup(isEn, CONTENT_EN.curses, 'name'),
    curseDesc: makeLookup(isEn, CONTENT_EN.curses, 'desc'),
    oracleText: makeLookup(isEn, CONTENT_EN.oracle, 'text'),
  };
}
