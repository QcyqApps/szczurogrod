// In-memory content registry. Populated by `loadContent(db)` at server boot
// from the DB-backed content tables, then refreshed by `reloadContent(db)`
// when admin calls the `admin.reload` endpoint. Readers in `game/*.ts` and
// `routers/*.ts` pull their data from this module instead of static arrays.
//
// TS arrays in `game/*.ts` remain only as seed-if-empty source in `seed.ts`.

import { asc } from 'drizzle-orm';
import type {
  CharacterClass,
  EnemyAbility,
  IconName,
  ItemSlot,
  QuestDifficulty,
  Rarity,
} from '@grodno/shared';
import type { Db } from '../db/client.js';
import {
  achievementTemplates,
  bossUniqueDrops,
  companionTemplates,
  dailyLadder,
  dungeonBossDrops,
  dungeonMobs,
  dungeons,
  enemyTemplates,
  itemTemplates,
  mobLootEntries,
  mobTierConfig,
  mountTemplates,
  questLootEntries,
  questTemplates,
  regions,
  shopListings,
} from '../db/schema.js';

export type MobTier = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ItemTemplate {
  id: string;
  name: string;
  icon: IconName;
  slot: ItemSlot;
  rarity: Rarity;
  atk?: number | null;
  def?: number | null;
  mag?: number | null;
  /** HP restored when drunk in combat. 0 for non-potions. */
  hpHeal: number;
  /** MP restored when drunk in combat. 0 for HP-only or non-potions. */
  mpHeal: number;
  desc: string | null;
  allowedClasses?: readonly CharacterClass[] | null;
  /**
   * Timed-buff contract. Gdy `buffKind` jest ustawiony — wypicie mikstury
   * odpala `applyBuff` zamiast zwykłego hp/mp heal'a (albo obok niego, gdy
   * template ma też `hpHeal > 0`). `buffMagnitude`/`buffDurationHours` muszą
   * być wtedy też ustawione. NULL = klasyczna mikstura / nie-mikstura.
   */
  buffKind?: string | null;
  buffMagnitude?: number | null;
  buffDurationHours?: number | null;
}

export interface EnemyTemplate {
  slug: string;
  name: string;
  lvl: number;
  hp: number;
  atk: number;
  /** Defense applied via `reduce(raw, def)` when hit. Seeded per tier. */
  def: number;
  gold: number;
  xp: number;
  requiredLvl: number;
  tier: MobTier;
  /** Seconds after a victory before this mob can be engaged again. */
  cooldownSec: number;
  /** Per-UTC-day kill cap (resets at 00:00 UTC). */
  dailyLimit: number;
  /** Proc-based combat abilities. Empty array = plain physical-only mob. */
  abilities: readonly EnemyAbility[];
}

export interface QuestTemplate {
  id: string;
  title: string;
  desc: string;
  icon: IconName;
  diff: QuestDifficulty;
  gold: number;
  xp: number;
  itemChance: number;
  duration: number;
  requiredLvl: number;
  chapter: 'akt-1' | 'akt-2' | 'akt-3' | 'akt-4' | 'akt-5' | 'akt-6';
  /** Bonus dungeon keys awarded when the quest is collected. 0 = no bonus. */
  rewardKeys: number;
}

export interface CompanionBuff {
  atkBonus?: number;
  magBonus?: number;
  lootBonusPct?: number;
  /** 0..1 fractional bonus on potion healing (e.g. 0.2 → +20% HP/MP per potion). */
  healBonus?: number;
}

export interface CompanionTemplate {
  slug: string;
  name: string;
  cls: CharacterClass;
  lvl: number;
  price: number;
  trait: string;
  buff: CompanionBuff;
}

export interface ShopListing {
  id: string;
  item: ItemTemplate;
  price: number;
  usesGems: boolean;
  requiredLvl: number;
}

export interface MobLootPool {
  dropRate: number;
  rarityWeights: Record<Rarity, number>;
  items: readonly ItemTemplate[];
}

export interface RegionTemplate {
  slug: string;
  name: string;
  sortOrder: number;
}

export interface DungeonTemplate {
  slug: string;
  regionSlug: string;
  name: string;
  desc: string;
  requiredLvl: number;
  /** Null = pierwszy loch regionu (brak prerequisite). */
  prerequisiteDungeonSlug: string | null;
  bossEnemySlug: string;
  mapX: number;
  mapY: number;
  sortOrder: number;
  /** Regular mob slugi w kolejności wyświetlania; boss OSOBNO (bossEnemySlug). */
  mobSlugs: readonly string[];
}

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'legendary';
export type AchievementCategory = 'combat' | 'loot' | 'progression' | 'economy';

export interface AchievementTemplate {
  id: string;
  name: string;
  desc: string;
  icon: string;
  tier: AchievementTier;
  category: AchievementCategory;
  threshold: number;
  rewardGold: number;
  rewardGems: number;
  sortOrder: number;
}

export interface MountTemplate {
  slug: string;
  name: string;
  icon: string;
  desc: string;
  /** 0..80 — % redukcji `tpl.duration` w `quests.start` gdy mount aktywny. */
  speedPct: number;
  price: number;
  rentalHours: number;
  requiredLvl: number;
  sortOrder: number;
}

export interface DailyDayReward {
  day: number;
  kind: 'gold' | 'xp' | 'potion' | 'gem' | 'gift' | 'crown';
  v: string | number;
  gold: number;
  gems: number;
  xp: number;
  /** Dungeon keys granted on claim of this day. 0 = none. */
  keys: number;
  item: ItemTemplate | null;
}

export interface ContentRegistry {
  items: Map<string, ItemTemplate>;
  enemies: Map<string, EnemyTemplate>;
  quests: Map<string, QuestTemplate>;
  companions: Map<string, CompanionTemplate>;
  shop: Map<string, ShopListing>;
  mobLoot: Map<MobTier, MobLootPool>;
  questLoot: Map<QuestDifficulty, readonly ItemTemplate[]>;
  bossDrops: Map<string, Partial<Record<CharacterClass, ItemTemplate>>>;
  dailyLadder: readonly DailyDayReward[];
  mounts: Map<string, MountTemplate>;
  mountsList: readonly MountTemplate[];
  regions: Map<string, RegionTemplate>;
  regionsList: readonly RegionTemplate[];
  dungeons: Map<string, DungeonTemplate>;
  dungeonsList: readonly DungeonTemplate[];
  /** Lookup: enemySlug → dungeonSlug (regular mob OR boss). Zbudowany raz przy load. */
  enemyToDungeon: Map<string, string>;
  /** Per-boss unikatowy drop branżowany po klasie postaci. Klucz = boss enemy slug. */
  dungeonBossDrops: Map<string, Partial<Record<CharacterClass, ItemTemplate>>>;
  achievements: Map<string, AchievementTemplate>;
  achievementsList: readonly AchievementTemplate[];
}

function emptyRegistry(): ContentRegistry {
  return {
    items: new Map(),
    enemies: new Map(),
    quests: new Map(),
    companions: new Map(),
    shop: new Map(),
    mobLoot: new Map(),
    questLoot: new Map(),
    bossDrops: new Map(),
    dailyLadder: [],
    mounts: new Map(),
    mountsList: [],
    regions: new Map(),
    regionsList: [],
    dungeons: new Map(),
    dungeonsList: [],
    enemyToDungeon: new Map(),
    dungeonBossDrops: new Map(),
    achievements: new Map(),
    achievementsList: [],
  };
}

// Mutable singleton. Atomic-swapped by reloadContent() so in-flight readers
// keep working on the old snapshot until they re-read REGISTRY.
export let REGISTRY: ContentRegistry = emptyRegistry();

function rowToItemTemplate(row: typeof itemTemplates.$inferSelect): ItemTemplate {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon as IconName,
    slot: row.slot,
    rarity: row.rarity,
    atk: row.atk,
    def: row.def,
    mag: row.mag,
    hpHeal: row.hpHeal,
    mpHeal: row.mpHeal,
    desc: row.desc,
    allowedClasses: row.allowedClasses ?? null,
    buffKind: row.buffKind ?? null,
    buffMagnitude: row.buffMagnitude ?? null,
    buffDurationHours: row.buffDurationHours ?? null,
  };
}

export async function buildRegistry(db: Db): Promise<ContentRegistry> {
  const reg = emptyRegistry();

  const itemRows = await db.select().from(itemTemplates);
  for (const row of itemRows) {
    reg.items.set(row.id, rowToItemTemplate(row));
  }

  const enemyRows = await db.select().from(enemyTemplates);
  for (const row of enemyRows) {
    reg.enemies.set(row.slug, {
      slug: row.slug,
      name: row.name,
      lvl: row.lvl,
      hp: row.hp,
      atk: row.atk,
      def: row.def,
      gold: row.gold,
      xp: row.xp,
      requiredLvl: row.requiredLvl,
      tier: row.tier as MobTier,
      cooldownSec: row.cooldownSec,
      dailyLimit: row.dailyLimit,
      abilities: row.abilities ?? [],
    });
  }

  const questRows = await db.select().from(questTemplates);
  for (const row of questRows) {
    reg.quests.set(row.id, {
      id: row.id,
      title: row.title,
      desc: row.desc,
      icon: row.icon as IconName,
      diff: row.diff as QuestDifficulty,
      gold: row.gold,
      xp: row.xp,
      itemChance: row.itemChance,
      duration: row.duration,
      requiredLvl: row.requiredLvl,
      chapter: row.chapter as 'akt-1' | 'akt-2' | 'akt-3' | 'akt-4',
      rewardKeys: row.rewardKeys,
    });
  }

  const companionRows = await db.select().from(companionTemplates);
  for (const row of companionRows) {
    reg.companions.set(row.slug, {
      slug: row.slug,
      name: row.name,
      cls: row.cls,
      lvl: row.lvl,
      price: row.price,
      trait: row.trait,
      buff: row.buff,
    });
  }

  const shopRows = await db.select().from(shopListings);
  for (const row of shopRows) {
    const item = reg.items.get(row.itemTemplateId);
    if (!item) {
      throw new Error(
        `shop_listings.${row.id} references missing item_template ${row.itemTemplateId}`,
      );
    }
    reg.shop.set(row.id, {
      id: row.id,
      item,
      price: row.price,
      usesGems: row.usesGems,
      requiredLvl: row.requiredLvl,
    });
  }

  const tierRows = await db.select().from(mobTierConfig);
  const lootRows = await db.select().from(mobLootEntries);
  for (const tierRow of tierRows) {
    const tier = tierRow.tier as MobTier;
    const items: ItemTemplate[] = [];
    for (const entry of lootRows) {
      if (entry.tier !== tier) continue;
      const item = reg.items.get(entry.itemTemplateId);
      if (!item) {
        throw new Error(
          `mob_loot_entries(tier=${tier}) references missing item_template ${entry.itemTemplateId}`,
        );
      }
      items.push(item);
    }
    reg.mobLoot.set(tier, {
      dropRate: Number(tierRow.dropRate),
      rarityWeights: tierRow.rarityWeights,
      items,
    });
  }

  const questLootRows = await db.select().from(questLootEntries);
  const byDifficulty = new Map<string, ItemTemplate[]>();
  for (const entry of questLootRows) {
    const item = reg.items.get(entry.itemTemplateId);
    if (!item) {
      throw new Error(
        `quest_loot_entries(diff=${entry.difficulty}) references missing item_template ${entry.itemTemplateId}`,
      );
    }
    const arr = byDifficulty.get(entry.difficulty) ?? [];
    arr.push(item);
    byDifficulty.set(entry.difficulty, arr);
  }
  for (const [diff, items] of byDifficulty) {
    reg.questLoot.set(diff as QuestDifficulty, items);
  }

  const bossRows = await db.select().from(bossUniqueDrops);
  for (const entry of bossRows) {
    const item = reg.items.get(entry.itemTemplateId);
    if (!item) {
      throw new Error(
        `boss_unique_drops(${entry.questId}, ${entry.cls}) references missing item_template ${entry.itemTemplateId}`,
      );
    }
    const byClass = reg.bossDrops.get(entry.questId) ?? {};
    byClass[entry.cls] = item;
    reg.bossDrops.set(entry.questId, byClass);
  }

  const ladderRows = await db.select().from(dailyLadder).orderBy(asc(dailyLadder.day));
  reg.dailyLadder = ladderRows.map((row) => ({
    day: row.day,
    kind: row.kind as DailyDayReward['kind'],
    v: row.v,
    gold: row.gold,
    gems: row.gems,
    xp: row.xp,
    keys: row.keys,
    item: row.itemTemplateId ? (reg.items.get(row.itemTemplateId) ?? null) : null,
  }));

  const mountRows = await db
    .select()
    .from(mountTemplates)
    .orderBy(asc(mountTemplates.sortOrder), asc(mountTemplates.price));
  const mountsList: MountTemplate[] = [];
  for (const row of mountRows) {
    const tpl: MountTemplate = {
      slug: row.slug,
      name: row.name,
      icon: row.icon,
      desc: row.desc,
      speedPct: row.speedPct,
      price: row.price,
      rentalHours: row.rentalHours,
      requiredLvl: row.requiredLvl,
      sortOrder: row.sortOrder,
    };
    reg.mounts.set(row.slug, tpl);
    mountsList.push(tpl);
  }
  reg.mountsList = mountsList;

  // --- Regions + Dungeons + Dungeon mobs ---
  const regionRows = await db.select().from(regions).orderBy(asc(regions.sortOrder));
  const regionsList: RegionTemplate[] = [];
  for (const row of regionRows) {
    const tpl: RegionTemplate = {
      slug: row.slug,
      name: row.name,
      sortOrder: row.sortOrder,
    };
    reg.regions.set(row.slug, tpl);
    regionsList.push(tpl);
  }
  reg.regionsList = regionsList;

  const dungeonMobRows = await db
    .select()
    .from(dungeonMobs)
    .orderBy(asc(dungeonMobs.sortOrder));
  const mobsByDungeon = new Map<string, string[]>();
  for (const row of dungeonMobRows) {
    const arr = mobsByDungeon.get(row.dungeonSlug) ?? [];
    arr.push(row.enemySlug);
    mobsByDungeon.set(row.dungeonSlug, arr);
  }

  const dungeonRows = await db.select().from(dungeons).orderBy(asc(dungeons.sortOrder));
  const dungeonsList: DungeonTemplate[] = [];
  for (const row of dungeonRows) {
    const mobSlugs = mobsByDungeon.get(row.slug) ?? [];
    const tpl: DungeonTemplate = {
      slug: row.slug,
      regionSlug: row.regionSlug,
      name: row.name,
      desc: row.desc,
      requiredLvl: row.requiredLvl,
      prerequisiteDungeonSlug: row.prerequisiteDungeonSlug,
      bossEnemySlug: row.bossEnemySlug,
      mapX: row.mapX,
      mapY: row.mapY,
      sortOrder: row.sortOrder,
      mobSlugs,
    };
    reg.dungeons.set(row.slug, tpl);
    dungeonsList.push(tpl);

    // Build reverse lookup enemy→dungeon for quick checks in combat.engage.
    for (const mobSlug of mobSlugs) {
      reg.enemyToDungeon.set(mobSlug, row.slug);
    }
    reg.enemyToDungeon.set(row.bossEnemySlug, row.slug);
  }
  reg.dungeonsList = dungeonsList;

  // --- Dungeon boss drops (per boss × klasa → ItemTemplate) ---
  const dropRows = await db.select().from(dungeonBossDrops);
  for (const row of dropRows) {
    const item = reg.items.get(row.itemTemplateId);
    if (!item) {
      throw new Error(
        `dungeon_boss_drops(${row.bossEnemySlug}, ${row.cls}) references missing item_template ${row.itemTemplateId}`,
      );
    }
    const byClass = reg.dungeonBossDrops.get(row.bossEnemySlug) ?? {};
    byClass[row.cls] = item;
    reg.dungeonBossDrops.set(row.bossEnemySlug, byClass);
  }

  // --- Achievements ---
  const achRows = await db
    .select()
    .from(achievementTemplates)
    .orderBy(asc(achievementTemplates.sortOrder));
  const achList: AchievementTemplate[] = [];
  for (const row of achRows) {
    const tpl: AchievementTemplate = {
      id: row.id,
      name: row.name,
      desc: row.desc,
      icon: row.icon,
      tier: row.tier as AchievementTier,
      category: row.category as AchievementCategory,
      threshold: row.threshold,
      rewardGold: row.rewardGold,
      rewardGems: row.rewardGems,
      sortOrder: row.sortOrder,
    };
    reg.achievements.set(row.id, tpl);
    achList.push(tpl);
  }
  reg.achievementsList = achList;

  return reg;
}

export async function loadContent(db: Db): Promise<void> {
  REGISTRY = await buildRegistry(db);
  console.log(
    `[content] loaded ${REGISTRY.items.size} items, ${REGISTRY.enemies.size} enemies, ` +
      `${REGISTRY.quests.size} quests, ${REGISTRY.companions.size} companions, ` +
      `${REGISTRY.shop.size} shop listings, ${REGISTRY.mobLoot.size} mob tiers, ` +
      `${REGISTRY.questLoot.size} quest-loot difficulties, ${REGISTRY.bossDrops.size} boss drops, ` +
      `${REGISTRY.dailyLadder.length} daily ladder rows, ${REGISTRY.mounts.size} mounts, ` +
      `${REGISTRY.regions.size} regions, ${REGISTRY.dungeons.size} dungeons, ` +
      `${REGISTRY.dungeonBossDrops.size} dungeon boss drops, ` +
      `${REGISTRY.achievements.size} achievements`,
  );
}

export async function reloadContent(db: Db): Promise<ContentRegistry> {
  REGISTRY = await buildRegistry(db);
  return REGISTRY;
}
