// Seeds the content tables from the TS arrays in `game/*.ts`. Runs only if
// item_templates is empty — once the DB is populated, edits in DB are the
// source of truth and seeding is skipped. The TS arrays are retained purely
// as disaster-recovery hydration input.

import { createHash } from 'node:crypto';
import type { CharacterClass, ItemSlot, Rarity } from '@grodno/shared';
import type { Db } from '../db/client.js';
import {
  bossUniqueDrops,
  companionTemplates,
  dailyLadder,
  dungeonMobs,
  dungeons,
  enemyTemplates,
  guildBuildingTemplates,
  guildRaidBossTemplates,
  itemTemplates,
  mobLootEntries,
  mobTierConfig,
  mountTemplates,
  questLootEntries,
  questTemplates,
  regions,
  shopListings,
} from '../db/schema.js';
import { DUNGEON_ENEMIES, MOB_LOOT_POOLS, RARITY_WEIGHTS } from '../game/combat.js';
import { DAILY_LADDER } from '../game/daily.js';
import { DUNGEON_MOBS, DUNGEONS, REGIONS } from '../game/dungeons.js';
import { GUILD_BUILDING_TEMPLATES } from '../game/guild-buildings.js';
import { RAID_BOSS_TEMPLATES } from '../game/guild-raids.js';
import { MOUNT_TEMPLATES } from '../game/mounts.js';
import {
  BOSS_UNIQUE_DROPS,
  QUEST_LOOT,
  QUEST_TEMPLATES,
  type LootTemplate,
} from '../game/quests.js';
import { SHOP_CATALOG } from '../game/shop.js';
import { COMPANIONS } from '../game/tavern.js';

interface ItemShape {
  name: string;
  icon: string;
  slot: ItemSlot;
  rarity: Rarity;
  atk?: number;
  def?: number;
  mag?: number;
  desc?: string | null;
  allowedClasses?: readonly CharacterClass[];
  /** Opcjonalny timed buff — patrz `game/buffs.ts::BuffKind`. Wypicie mikstury
   *  z `buffKind` ustawionym odpala `applyBuff` (override per kategoria). */
  buffKind?:
    | 'hp_max_pct'
    | 'mp_max_pct'
    | 'atk_flat'
    | 'def_flat'
    | 'mag_flat'
    | 'spd_flat';
  buffMagnitude?: number;
  buffDurationHours?: number;
}

/** Deterministic content-hash id so identical items across pools share one template row. */
function contentId(item: ItemShape): string {
  const canon = JSON.stringify([
    item.name,
    item.rarity,
    item.slot,
    item.atk ?? null,
    item.def ?? null,
    item.mag ?? null,
    item.desc ?? null,
    [...(item.allowedClasses ?? [])].sort(),
    item.buffKind ?? null,
    item.buffMagnitude ?? null,
    item.buffDurationHours ?? null,
  ]);
  const hash = createHash('sha1').update(canon).digest('hex').slice(0, 12);
  return `item_${hash}`;
}

/**
 * Default HP heal by rarity when an item is a potion. Tunable per-item in CMS
 * post-seed; seed only sets a sensible baseline.
 */
const POTION_HP_HEAL: Record<Rarity, number> = {
  common: 40,
  rare: 80,
  epic: 140,
  legendary: 220,
};
/** Name-keyed overrides where the desc/lore demands a specific number. */
const POTION_HEAL_OVERRIDES: Record<string, { hp?: number; mp?: number }> = {
  'Mikstura Buraka': { hp: 80 },
};

function itemToInsertValues(item: ItemShape) {
  let hpHeal = 0;
  let mpHeal = 0;
  // Buff-mikstury nie heal'ują automatycznie — efekt timed zastępuje heal.
  // Regular mikstury (`buffKind` undefined) nadal dostają baseline heal.
  if (item.slot === 'potion' && !item.buffKind) {
    hpHeal = POTION_HP_HEAL[item.rarity] ?? 0;
    const override = POTION_HEAL_OVERRIDES[item.name];
    if (override?.hp !== undefined) hpHeal = override.hp;
    if (override?.mp !== undefined) mpHeal = override.mp;
  }
  return {
    id: contentId(item),
    name: item.name,
    icon: item.icon,
    slot: item.slot,
    rarity: item.rarity,
    atk: item.atk ?? null,
    def: item.def ?? null,
    mag: item.mag ?? null,
    hpHeal,
    mpHeal,
    desc: item.desc ?? null,
    allowedClasses: item.allowedClasses ?? null,
    buffKind: item.buffKind ?? null,
    buffMagnitude: item.buffMagnitude ?? null,
    buffDurationHours: item.buffDurationHours ?? null,
  };
}

export async function seedIfEmpty(db: Db): Promise<void> {
  // Bramka usunięta — wszystkie inserty są idempotentne przez
  // `onConflictDoNothing()`. Efekt: każdy boot dopina contentowy TS'owy top-up
  // na DB (np. nowe questy z akt-4 od razu trafiają do istniejącej bazy po
  // restarcie, bez potrzeby pisania bespoke'owych migracji data-seedujących).
  // Koszt: ~1s bulk-conflict-checków na boot, akceptowalne.

  // 1. Gather all distinct items across every pool.
  const allItems = new Map<string, ItemShape>();
  const add = (item: ItemShape) => {
    const id = contentId(item);
    if (!allItems.has(id)) allItems.set(id, item);
  };
  for (const shop of SHOP_CATALOG) add(shop);
  for (const items of Object.values(QUEST_LOOT)) for (const it of items) add(it);
  for (const pool of Object.values(MOB_LOOT_POOLS)) for (const it of pool.items) add(it);
  for (const byClass of Object.values(BOSS_UNIQUE_DROPS)) {
    for (const it of Object.values(byClass) as LootTemplate[]) add(it);
  }
  for (const day of DAILY_LADDER) {
    if (day.itemName && day.itemRarity) {
      add({
        name: day.itemName,
        icon: day.itemIcon ?? 'gift',
        slot: day.kind === 'potion' ? 'potion' : 'any',
        rarity: day.itemRarity,
        desc: 'Z codziennej skrzyni. Miłej zabawy.',
      });
    }
  }

  await db.transaction(async (tx) => {
    // 2. Insert item_templates.
    if (allItems.size > 0) {
      await tx
        .insert(itemTemplates)
        .values([...allItems.values()].map(itemToInsertValues))
        .onConflictDoNothing();
    }

    // 3. Insert enemy_templates. Tier drives DEF (migration 0008) plus cooldown +
    // daily kill cap (migration 0013). Bosses get a +50% DEF premium so armor
    // piercing matters. Values mirrored in the SQL migrations so deployed DBs
    // and fresh seeds stay aligned.
    const TIER_DEF: Record<number, number> = { 1: 2, 2: 6, 3: 12, 4: 20, 5: 30, 6: 42, 7: 58 };
    const TIER_COOLDOWN: Record<number, number> = {
      1: 30,
      2: 90,
      3: 240,
      4: 1200,
      5: 1800,
      6: 2400,
      7: 3600,
    };
    const TIER_DAILY_LIMIT: Record<number, number> = {
      1: 25,
      2: 12,
      3: 6,
      4: 2,
      5: 2,
      6: 1,
      7: 1,
    };
    const BOSS_SLUGS = new Set([
      'hobgoblin-king',
      'bone-dragon',
      'void-horror',
      'ognista-pani',
      'skarbnik-otchlani',
    ]);
    await tx
      .insert(enemyTemplates)
      .values(
        DUNGEON_ENEMIES.map((e) => {
          const baseDef = TIER_DEF[e.tier] ?? 0;
          const def = BOSS_SLUGS.has(e.slug) ? Math.ceil(baseDef * 1.5) : baseDef;
          return {
            slug: e.slug,
            name: e.name,
            lvl: e.lvl,
            hp: e.hp,
            atk: e.atk,
            def,
            gold: e.gold,
            xp: e.xp,
            requiredLvl: e.requiredLvl,
            tier: e.tier,
            cooldownSec: TIER_COOLDOWN[e.tier] ?? 30,
            dailyLimit: TIER_DAILY_LIMIT[e.tier] ?? 25,
            // Abilities: per-slug seed'y żyją w migracji 0017 (UPDATE WHERE
            // slug IN ...). Fresh DB przez `seed.ts` dostaje pusty array;
            // jeśli chcesz mieć od razu flavour, uruchom migracje po seed'ie.
            abilities: [],
          };
        }),
      )
      .onConflictDoNothing();

    // 4. Insert quest_templates.
    await tx
      .insert(questTemplates)
      .values(
        QUEST_TEMPLATES.map((q) => ({
          id: q.id,
          title: q.title,
          desc: q.desc,
          icon: q.icon,
          diff: q.diff,
          gold: q.gold,
          xp: q.xp,
          itemChance: q.itemChance,
          duration: q.duration,
          requiredLvl: q.requiredLvl,
          chapter: q.chapter,
          // Boss quests hardcoded here as a fallback so a fresh DB without the
          // 0014 migration's UPDATE still seeds them correctly. DB column default
          // is 0 for every other quest.
          rewardKeys: ['q5', 'q10', 'q15'].includes(q.id) ? 5 : 0,
        })),
      )
      .onConflictDoNothing();

    // 5. Insert companion_templates.
    await tx
      .insert(companionTemplates)
      .values(
        COMPANIONS.map((c) => ({
          slug: c.slug,
          name: c.name,
          cls: c.cls,
          lvl: c.lvl,
          price: c.price,
          trait: c.trait,
          buff: c.buff,
        })),
      )
      .onConflictDoNothing();

    // 6. Insert shop_listings — preserve legacy IDs (s1, s2, s4m, ...).
    await tx
      .insert(shopListings)
      .values(
        SHOP_CATALOG.map((s) => ({
          id: s.id,
          itemTemplateId: contentId(s),
          price: s.price,
          usesGems: Boolean(s.gems),
          requiredLvl: s.requiredLvl,
        })),
      )
      .onConflictDoNothing();

    // 7. Insert mob_tier_config + mob_loot_entries.
    await tx
      .insert(mobTierConfig)
      .values(
        (Object.entries(MOB_LOOT_POOLS) as [string, (typeof MOB_LOOT_POOLS)[1]][]).map(
          ([tier, pool]) => ({
            tier: Number(tier),
            dropRate: pool.dropRate.toFixed(2),
            rarityWeights: RARITY_WEIGHTS[Number(tier) as keyof typeof RARITY_WEIGHTS],
          }),
        ),
      )
      .onConflictDoNothing();

    const mobEntries: { tier: number; itemTemplateId: string }[] = [];
    for (const [tierStr, pool] of Object.entries(MOB_LOOT_POOLS)) {
      const tier = Number(tierStr);
      for (const item of pool.items) {
        mobEntries.push({ tier, itemTemplateId: contentId(item) });
      }
    }
    if (mobEntries.length > 0) {
      await tx.insert(mobLootEntries).values(mobEntries).onConflictDoNothing();
    }

    // 8. Insert quest_loot_entries.
    const questEntries: { difficulty: string; itemTemplateId: string }[] = [];
    for (const [difficulty, items] of Object.entries(QUEST_LOOT)) {
      for (const item of items) {
        questEntries.push({ difficulty, itemTemplateId: contentId(item) });
      }
    }
    if (questEntries.length > 0) {
      await tx.insert(questLootEntries).values(questEntries).onConflictDoNothing();
    }

    // 9. Insert boss_unique_drops.
    const bossEntries: { questId: string; cls: CharacterClass; itemTemplateId: string }[] = [];
    for (const [questId, byClass] of Object.entries(BOSS_UNIQUE_DROPS)) {
      for (const [cls, item] of Object.entries(byClass) as [CharacterClass, LootTemplate][]) {
        bossEntries.push({ questId, cls, itemTemplateId: contentId(item) });
      }
    }
    if (bossEntries.length > 0) {
      await tx.insert(bossUniqueDrops).values(bossEntries).onConflictDoNothing();
    }

    // 10. Insert daily_ladder.
    await tx
      .insert(dailyLadder)
      .values(
        DAILY_LADDER.map((d, idx) => ({
          day: idx + 1,
          kind: d.kind,
          v: String(d.v),
          gold: d.gold ?? 0,
          gems: d.gems ?? 0,
          xp: d.xp ?? 0,
          keys: d.keys ?? 0,
          itemTemplateId:
            d.itemName && d.itemRarity
              ? contentId({
                  name: d.itemName,
                  icon: d.itemIcon ?? 'gift',
                  slot: d.kind === 'potion' ? 'potion' : 'any',
                  rarity: d.itemRarity,
                  desc: 'Z codziennej skrzyni. Miłej zabawy.',
                })
              : null,
        })),
      )
      .onConflictDoNothing();

    // 11. Insert mount_templates (Stajnie).
    await tx
      .insert(mountTemplates)
      .values(
        MOUNT_TEMPLATES.map((m) => ({
          slug: m.slug,
          name: m.name,
          icon: m.icon,
          desc: m.desc,
          speedPct: m.speedPct,
          price: m.price,
          rentalHours: m.rentalHours,
          requiredLvl: m.requiredLvl,
          sortOrder: m.sortOrder,
        })),
      )
      .onConflictDoNothing();

    // 12. Insert regions + dungeons + dungeon_mobs (mapa świata).
    await tx
      .insert(regions)
      .values(
        REGIONS.map((r) => ({
          slug: r.slug,
          name: r.name,
          sortOrder: r.sortOrder,
        })),
      )
      .onConflictDoNothing();

    await tx
      .insert(dungeons)
      .values(
        DUNGEONS.map((d) => ({
          slug: d.slug,
          regionSlug: d.regionSlug,
          name: d.name,
          desc: d.desc,
          requiredLvl: d.requiredLvl,
          prerequisiteDungeonSlug: d.prerequisiteDungeonSlug,
          bossEnemySlug: d.bossEnemySlug,
          mapX: d.mapX,
          mapY: d.mapY,
          sortOrder: d.sortOrder,
        })),
      )
      .onConflictDoNothing();

    await tx
      .insert(dungeonMobs)
      .values(
        DUNGEON_MOBS.map((m) => ({
          dungeonSlug: m.dungeonSlug,
          enemySlug: m.enemySlug,
          sortOrder: m.sortOrder,
        })),
      )
      .onConflictDoNothing();

    // 13. Insert guild_building_templates (Phase 2 — fortress/altar/vault).
    await tx
      .insert(guildBuildingTemplates)
      .values(
        GUILD_BUILDING_TEMPLATES.map((b) => ({
          slug: b.slug,
          name: b.name,
          icon: b.icon,
          maxLevel: b.maxLevel,
          costCurve: b.costCurve,
          buffSpec: b.buffSpec,
        })),
      )
      .onConflictDoNothing();

    // 14. Insert guild_raid_boss_templates (Phase 4 — 5 bossów rotacyjnych).
    await tx
      .insert(guildRaidBossTemplates)
      .values(
        RAID_BOSS_TEMPLATES.map((b) => ({
          slug: b.slug,
          name: b.name,
          icon: b.icon,
          baseHp: b.baseHp,
          flavor: b.flavor,
          rotationIndex: b.rotationIndex,
        })),
      )
      .onConflictDoNothing();
  });

  console.log(
    `[seed] hydrated ${allItems.size} items, ${DUNGEON_ENEMIES.length} enemies, ` +
      `${QUEST_TEMPLATES.length} quests, ${COMPANIONS.length} companions, ` +
      `${SHOP_CATALOG.length} shop listings, ${Object.keys(MOB_LOOT_POOLS).length} mob tiers, ` +
      `${DAILY_LADDER.length} daily ladder rows, ${MOUNT_TEMPLATES.length} mounts, ` +
      `${REGIONS.length} regions, ${DUNGEONS.length} dungeons, ${DUNGEON_MOBS.length} dungeon mobs, ` +
      `${GUILD_BUILDING_TEMPLATES.length} guild buildings, ${RAID_BOSS_TEMPLATES.length} raid bosses`,
  );
}
