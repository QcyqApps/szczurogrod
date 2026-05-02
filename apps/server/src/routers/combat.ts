import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { and, eq, gt, isNotNull, sql } from 'drizzle-orm';
import type {
  CombatHealResult,
  CombatState,
  CombatTurnResult,
  LevelUpInfo,
  TowerCombatOutcome,
} from '@grodno/shared';
import {
  combatAttackInputSchema,
  combatEnemiesInputSchema,
  combatEndInputSchema,
  combatEngageInputSchema,
  combatHealInputSchema,
  skipBossCooldownInputSchema,
} from '@grodno/shared';
import { REGISTRY, type EnemyTemplate } from '../content/registry.js';
import {
  characterCompanions,
  characterDungeonClears,
  characterEnemyKills,
  characterItems,
  characterTracks,
  characters,
  towerProgress,
} from '../db/schema.js';
import type { AchievementUnlockPayload } from '@grodno/shared';
import { GEM_SINK_COSTS } from '@grodno/shared';
import {
  collectBump,
  collectLevelBumps,
} from '../game/achievements.js';
import {
  aggregateBuffs,
  applyBuff,
  effectiveMax,
  loadActiveBuffs,
} from '../game/buffs.js';
import { rollCurse, shouldSpawnCurse } from '../game/curses.js';
import { SEASON_PASS_XP_PER_COMBAT_WIN } from '../game/season-pass.js';
import { addSeasonPassXp } from './seasonPass.js';
import {
  logBossKill,
  logLegendaryDrop,
  logLevelMilestone,
  MILESTONES,
} from '../game/chronicle.js';
import { isoDateUTC } from '../game/daily.js';
import {
  computeDungeonMobChainStatus,
  computeDungeonStatus,
} from '../game/dungeon-progress.js';
import {
  BAG_CAP,
  getBagCount,
  insertOrStackPotion,
  itemTemplateToRowValues,
} from '../game/inventory.js';
import { applyXpGain, summarizeLevelUps } from '../game/leveling.js';
import {
  applyStatus,
  createSession,
  deleteSession,
  findCharSession,
  getEnemy,
  getSession,
  HEAVY_COOLDOWN_TURNS,
  rollEnemyAttack,
  rollMobLoot,
  rollPlayerAttack,
  tickPlayerStatus,
  type CombatSession,
} from '../game/combat.js';
import {
  applyKeyRegen,
  DUNGEON_KEYS_MAX,
  KEY_COST_PER_FIGHT,
  KEY_REGEN_MS,
} from '../game/dungeon-keys.js';
import { applyHpRegen, applyMpRegen } from '../game/regen.js';
import { isWorking, WORKING_BLOCKS_COMBAT_MESSAGE } from '../game/work.js';
import { registerScrapbookFind } from '../game/scrapbook.js';
import { getCompanion } from '../game/tavern.js';
import {
  TOWER_FAIL_COOLDOWN_MS,
  computeFloorReward,
} from '../game/tower.js';
import { applyScrapbookGoldBonus, loadScrapbookBuffs } from '../game/scrapbook.js';
import {
  TRACK_DROP_RATE_MULT,
  TRACK_GOLD_MULT,
  TRACK_XP_MULT,
} from '../game/tracks.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

/** Engage is blocked below this HP so players don't zone in and instantly die. */
export const HP_ENGAGE_MIN = 20;

function toCombatState(s: CombatSession): CombatState {
  return {
    combatId: s.combatId,
    enemySlug: s.enemy.slug,
    enemyName: s.enemy.name,
    enemyLvl: s.enemy.lvl,
    enemyHp: s.enemyHp,
    enemyHpMax: s.enemy.hp,
    enemyGold: s.enemy.gold,
    enemyXp: s.enemy.xp,
    enemyDef: s.enemy.def,
    playerHp: s.playerHp,
    playerHpMax: s.playerHpMax,
    playerMp: s.playerMp,
    playerMpMax: s.playerMpMax,
    playerAtk: s.playerAtk,
    playerMag: s.playerMag,
    playerSpd: s.playerSpd,
    playerDef: s.playerDef,
    heavyCooldown: s.heavyCooldown,
    trackBonus: s.trackBonus,
    playerStatus: s.playerStatus,
    status: s.status,
  };
}

function requireOwnedSession(combatId: string, userId: string): CombatSession {
  const s = getSession(combatId);
  if (!s) throw new TRPCError({ code: 'NOT_FOUND', message: 'Combat session not found' });
  if (s.userId !== userId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your combat session' });
  }
  return s;
}

interface VictoryOutcome {
  levelUp: LevelUpInfo | null;
  loot: {
    id: string;
    name: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  } | null;
  unlockedAchievements: AchievementUnlockPayload[];
}

async function applyVictoryReward(
  db: typeof import('../db/client.js').db,
  s: CombatSession,
): Promise<VictoryOutcome> {
  if (s.rewardApplied) return { levelUp: null, loot: null, unlockedAchievements: [] };
  s.rewardApplied = true;
  const [row] = await db
    .select({
      name: characters.name,
      cls: characters.cls,
      lvl: characters.lvl,
      xp: characters.xp,
      xpMax: characters.xpMax,
      gold: characters.gold,
      hpMax: characters.hpMax,
      mp: characters.mp,
      mpMax: characters.mpMax,
      stamina: characters.stamina,
      staminaMax: characters.staminaMax,
    })
    .from(characters)
    .where(eq(characters.id, s.characterId))
    .limit(1);
  if (!row) return { levelUp: null, loot: null, unlockedAchievements: [] };

  // Wytropiony mob daje gold×2, xp×2, drop×1.5. Flaga ustawiona przy engage;
  // bonus dotyczy TYLKO tej walki. Track row został już usunięty przy engage.
  const goldBase = s.trackBonus ? s.enemy.gold * TRACK_GOLD_MULT : s.enemy.gold;
  const xpBase = s.trackBonus ? s.enemy.xp * TRACK_XP_MULT : s.enemy.xp;
  const dropRateMult = s.trackBonus ? TRACK_DROP_RATE_MULT : 1;

  // Scrapbook buffy: +1% XP @ 25% wypełnienia, +3% gold @ 50%. Stackuje się
  // z trackBonus (multiplikatywnie). Aplikujemy do PvE bazowych nagród —
  // arena/tower mają osobne flow z tym samym helperem.
  const scrapbookBuffs = await loadScrapbookBuffs(db, s.characterId);
  const goldGain = applyScrapbookGoldBonus(goldBase, scrapbookBuffs);
  const xpGain = Math.ceil(xpBase * (1 + scrapbookBuffs.xpPct / 100));

  const leveling = applyXpGain(
    {
      cls: row.cls,
      lvl: row.lvl,
      xp: row.xp,
      xpMax: row.xpMax,
      hp: s.playerHp,
      hpMax: row.hpMax,
      mp: s.playerMp,
      mpMax: row.mpMax,
      stamina: row.stamina,
      staminaMax: row.staminaMax,
    },
    xpGain,
  );
  const levelUp = summarizeLevelUps(leveling.ups);

  await db
    .update(characters)
    .set({
      gold: row.gold + goldGain,
      lvl: leveling.progression.lvl,
      xp: leveling.progression.xp,
      xpMax: leveling.progression.xpMax,
      hp: leveling.progression.hp,
      hpMax: leveling.progression.hpMax,
      mp: leveling.progression.mp,
      mpMax: leveling.progression.mpMax,
      stamina: leveling.progression.stamina,
      staminaMax: leveling.progression.staminaMax,
      updatedAt: new Date(),
    })
    .where(eq(characters.id, s.characterId));

  // Reflect new hp/mp caps into the ongoing session for display.
  s.playerHp = leveling.progression.hp;
  s.playerHpMax = leveling.progression.hpMax;
  s.playerMp = leveling.progression.mp;
  s.playerMpMax = leveling.progression.mpMax;

  // Loot path — dungeon boss → gwarantowany unikat klasowy; inaczej → mob-tier roll.
  // Unikat jest ZAWSZE, re-kill bossa po UTC rollu też go da (jak q5/q10/q15
  // quest bossów). Gracz może to dropnąć/sprzedać jeśli ma już duplikat.
  const bossDrop = REGISTRY.dungeonBossDrops.get(s.enemy.slug)?.[row.cls] ?? null;
  const lootTpl = bossDrop ?? rollMobLoot(s.enemy.tier, row.cls, dropRateMult);
  let loot: VictoryOutcome['loot'] = null;
  if (lootTpl) {
    if (lootTpl.slot === 'potion') {
      const stored = await insertOrStackPotion(db, s.characterId, lootTpl.id, 'combat');
      if (stored) {
        await registerScrapbookFind(db, s.characterId, lootTpl.id);
        loot = {
          id: stored.id,
          name: lootTpl.name,
          icon: lootTpl.icon,
          rarity: lootTpl.rarity,
        };
      }
    } else if ((await getBagCount(db, s.characterId)) < BAG_CAP) {
      const [inserted] = await db
        .insert(characterItems)
        .values(itemTemplateToRowValues(lootTpl, s.characterId, 'combat'))
        .returning({ id: characterItems.id });
      await registerScrapbookFind(db, s.characterId, lootTpl.id);
      loot = {
        id: inserted.id,
        name: lootTpl.name,
        icon: lootTpl.icon,
        rarity: lootTpl.rarity,
      };
    }
  }

  // Bump the kill log. Upsert against (character, slug); reset kills_today
  // when we've crossed into a new UTC day since the last kill. Cooldown clock
  // starts ticking from `last_killed_at`.
  const now = new Date();
  const today = isoDateUTC();
  await db
    .insert(characterEnemyKills)
    .values({
      characterId: s.characterId,
      enemySlug: s.enemy.slug,
      lastKilledAt: now,
      killsToday: 1,
      todayDate: today,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [characterEnemyKills.characterId, characterEnemyKills.enemySlug],
      set: {
        lastKilledAt: now,
        // Same-day kill → +1. Different day → reset to 1.
        killsToday: sql`CASE WHEN ${characterEnemyKills.todayDate} = ${today}
          THEN ${characterEnemyKills.killsToday} + 1 ELSE 1 END`,
        todayDate: today,
        updatedAt: now,
      },
    });

  // Kroniki — fire-and-forget po commicie.
  if (lootTpl?.rarity === 'legendary' && loot) {
    logLegendaryDrop(db, s.characterId, row.name, lootTpl.name).catch((e) =>
      console.error('[chronicle] logLegendaryDrop failed', e),
    );
  }
  for (const up of leveling.ups) {
    if (MILESTONES.includes(up.toLevel)) {
      logLevelMilestone(db, s.characterId, row.name, up.toLevel).catch((e) =>
        console.error('[chronicle] logLevelMilestone failed', e),
      );
    }
  }

  // Dungeon clear — jeśli zabity mob to boss któregoś z lochów, zapisz clear.
  // ON CONFLICT DO NOTHING → re-kill bossa nie duplikuje wiersza, chain unlock
  // liczy się od pierwszego zabicia. Dodatkowo wrzucamy do kroniki (dedup per
  // enemy slug — tylko pierwszy raz w życiu gracza).
  const clearedDungeon = REGISTRY.dungeonsList.find(
    (d) => d.bossEnemySlug === s.enemy.slug,
  );
  // `freshDungeonClear` = true gdy ten insert faktycznie dodał wiersz
  // (pierwsze ubicie tego bossa); false gdy ON CONFLICT DO NOTHING'a (re-kill).
  // Używamy `.returning()` — w Postgresie zwraca wstawione wiersze tylko dla
  // faktycznych inserów, więc pusta tablica = kolizja = re-kill.
  let freshDungeonClear = false;
  if (clearedDungeon) {
    const inserted = await db
      .insert(characterDungeonClears)
      .values({ characterId: s.characterId, dungeonSlug: clearedDungeon.slug })
      .onConflictDoNothing()
      .returning({ dungeonSlug: characterDungeonClears.dungeonSlug });
    freshDungeonClear = inserted.length > 0;
    logBossKill(db, s.characterId, row.name, s.enemy.slug, s.enemy.name).catch((e) =>
      console.error('[chronicle] logBossKill (dungeon) failed', e),
    );
  }

  // Achievements — await + collect żeby zwrócić unlocki w response'ie
  // (client queue'uje modal).
  const unlocks: AchievementUnlockPayload[] = [];
  await collectBump(unlocks, db, s.characterId, 'first_blood');
  await collectBump(unlocks, db, s.characterId, 'slayer_10');
  await collectBump(unlocks, db, s.characterId, 'slayer_100');
  await collectBump(unlocks, db, s.characterId, 'slayer_1000');

  if (s.enemy.tier === 4 || s.enemy.tier === 5 || s.enemy.tier === 6) {
    await collectBump(unlocks, db, s.characterId, 'first_boss');
  }
  await collectBump(unlocks, db, s.characterId, 'slayer_5000');
  await collectBump(unlocks, db, s.characterId, 'slayer_10000');
  if (clearedDungeon) {
    // boss_trio / _forest / _swamp bumpują tylko przy świeżym clear'ze (żeby
    // re-kille tego samego bossa nie liczyły się wielokrotnie do trio).
    const REGION_1_BOSSES = new Set(['rat-king-baltazar', 'kosciej-elder', 'lord-of-the-peaks']);
    const REGION_2_BOSSES = new Set(['wilkolak-matecznika', 'strzygon-dziadowski', 'panna-leszczyna']);
    const REGION_3_BOSSES = new Set(['zasmucony-topielec-starszy', 'upior-drwala', 'czarna-strzyga']);
    if (freshDungeonClear) {
      // Meta: wszystkie 9 lochów zaliczonych — osobny achievement.
      await collectBump(unlocks, db, s.characterId, 'all_dungeons');
      if (REGION_1_BOSSES.has(clearedDungeon.bossEnemySlug)) {
        await collectBump(unlocks, db, s.characterId, 'boss_trio');
      }
      if (REGION_2_BOSSES.has(clearedDungeon.bossEnemySlug)) {
        await collectBump(unlocks, db, s.characterId, 'boss_trio_forest');
      }
      if (REGION_3_BOSSES.has(clearedDungeon.bossEnemySlug)) {
        await collectBump(unlocks, db, s.characterId, 'boss_trio_swamp');
      }
    }
    const chapterAchId = {
      'rat-king-baltazar': 'chapter_1',
      'kosciej-elder': 'chapter_2',
      'lord-of-the-peaks': 'chapter_3',
      'wilkolak-matecznika': 'chapter_4',
      'strzygon-dziadowski': 'chapter_5',
      'panna-leszczyna': 'chapter_6',
      'zasmucony-topielec-starszy': 'chapter_7',
      'upior-drwala': 'chapter_8',
      'czarna-strzyga': 'chapter_9',
    }[clearedDungeon.bossEnemySlug];
    if (chapterAchId) {
      // Chapter-achievements threshold=1 → idempotentne (unlocked_at blokuje
      // drugie wejście do "unlocked" branch), więc bump zawsze jest OK.
      await collectBump(unlocks, db, s.characterId, chapterAchId);
    }
  }

  if (loot) {
    const lootAchId =
      loot.rarity === 'rare'
        ? 'first_rare'
        : loot.rarity === 'epic'
          ? 'first_epic'
          : loot.rarity === 'legendary'
            ? 'first_legendary'
            : null;
    if (lootAchId) {
      await collectBump(unlocks, db, s.characterId, lootAchId);
    }
    if (loot.rarity === 'legendary') {
      await collectBump(unlocks, db, s.characterId, 'legendary_collector');
      await collectBump(unlocks, db, s.characterId, 'legendary_collector_25');
    }
  }

  if (leveling.ups.length > 0) {
    await collectLevelBumps(unlocks, db, s.characterId, leveling.progression.lvl);
  }

  // Season Pass progression — +1 XP za każdy combat win w dungeonie.
  // Fire-and-forget, bez blokowania rewarda głównego.
  await addSeasonPassXp(db, s.characterId, SEASON_PASS_XP_PER_COMBAT_WIN);

  return { levelUp, loot, unlockedAchievements: unlocks };
}

/**
 * Tower victory — zastępuje dungeon-ową logikę nagród. Floor++, gold/gems
 * reward (milestones co 10 pięter), update `tower_progress`. Bez XP, bez
 * mob-loot rolla, bez kill-log/dungeon-clear side-effects. `scrapbook`
 * gold bonus dotyczy Wieży tak samo jak lochów — to kolekcjonerski buff
 * czytany przy każdym źródle golda.
 */
async function applyTowerVictory(
  db: typeof import('../db/client.js').db,
  s: CombatSession,
): Promise<TowerCombatOutcome> {
  if (s.rewardApplied || s.towerFloor == null) {
    return {
      newFloor: s.towerFloor ?? 1,
      newBestFloor: 0,
      reward: null,
      failedUntil: null,
    };
  }
  s.rewardApplied = true;

  const floor = s.towerFloor;
  const reward = computeFloorReward(floor);
  const scrapbookBuffs = await loadScrapbookBuffs(db, s.characterId);
  const goldWithBonus = applyScrapbookGoldBonus(reward.gold, scrapbookBuffs);

  const now = new Date();
  const [row] = await db
    .select({
      gold: characters.gold,
      gems: characters.gems,
    })
    .from(characters)
    .where(eq(characters.id, s.characterId))
    .limit(1);
  if (!row) {
    return {
      newFloor: floor,
      newBestFloor: 0,
      reward: null,
      failedUntil: null,
    };
  }

  const [progressRow] = await db
    .select()
    .from(towerProgress)
    .where(eq(towerProgress.characterId, s.characterId))
    .limit(1);

  // Anti-cheat: jeśli aktualne piętro nie zgadza się z piętrem sesji,
  // ktoś już skomitował victory dla tej walki (np. parallel-tab exploit
  // przeszedł wcześniejsze gate'y). No-op zamiast podwójnej nagrody.
  if (progressRow && progressRow.currentFloor !== floor) {
    return {
      newFloor: progressRow.currentFloor,
      newBestFloor: progressRow.bestFloorThisWeek,
      reward: null,
      failedUntil: null,
    };
  }

  const newFloor = floor + 1;
  const newBest = Math.max(progressRow?.bestFloorThisWeek ?? 0, floor);

  await db.transaction(async (tx) => {
    await tx
      .update(characters)
      .set({
        gold: row.gold + goldWithBonus,
        gems: row.gems + reward.gems,
        // HP/MP z bieżącej sesji (combat.attack już obciął po turze).
        hp: s.playerHp,
        mp: s.playerMp,
        updatedAt: now,
      })
      .where(eq(characters.id, s.characterId));
    await tx
      .update(towerProgress)
      .set({
        currentFloor: newFloor,
        bestFloorThisWeek: newBest,
        failedAt: null,
        updatedAt: now,
      })
      .where(eq(towerProgress.characterId, s.characterId));
  });

  return {
    newFloor,
    newBestFloor: newBest,
    reward: {
      gold: goldWithBonus,
      gems: reward.gems,
      isMilestone: reward.isMilestone,
    },
    failedUntil: null,
  };
}

/**
 * Tower defeat — ustawia `failedAt` na teraz. Cooldown 15 min (bypass za
 * gemy przez `tower.resurrect`). HP=1 i tak zostało ustawione w głównej
 * ścieżce attack/heal, więc tu tylko znacznik porażki.
 */
async function applyTowerDefeat(
  db: typeof import('../db/client.js').db,
  characterId: string,
): Promise<TowerCombatOutcome> {
  const now = new Date();
  await db
    .update(towerProgress)
    .set({ failedAt: now, updatedAt: now })
    .where(eq(towerProgress.characterId, characterId));
  const [progressRow] = await db
    .select()
    .from(towerProgress)
    .where(eq(towerProgress.characterId, characterId))
    .limit(1);
  return {
    newFloor: progressRow?.currentFloor ?? 1,
    newBestFloor: progressRow?.bestFloorThisWeek ?? 0,
    reward: null,
    failedUntil: now.getTime() + TOWER_FAIL_COOLDOWN_MS,
  };
}

export const combatRouter = router({
  enemies: protectedProcedure.input(combatEnemiesInputSchema).query(async ({ ctx, input }) => {
    const [char] = await ctx.db
      .select({ id: characters.id, lvl: characters.lvl })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    const charLvl = char?.lvl ?? 1;

    // Gdy dungeonSlug podany → filtruj do regularnych mobów + bossa tego lochu.
    // Bez level-ahead bufora: w viewie lochu gracz widzi dokładnie to, co w nim
    // jest (włącznie z bossem gdy LVL-gated). Flat list zostaje dla backward
    // compat (gdy input pusty).
    const dungeonSlug = input?.dungeonSlug;
    const dungeon = dungeonSlug ? REGISTRY.dungeons.get(dungeonSlug) : null;

    let visible: EnemyTemplate[];
    if (dungeon) {
      // Porządek musi pasować do chain-unlock: regular moby wg dungeon.mobSlugs
      // (sort_order w DB), boss zawsze na końcu. Sort po requiredLvl był buggy
      // gdy dwa moby mają ten sam LVL — np. Mroczna Grań (goblin-shaman i
      // minotaur oba L10), UI rysował minotaura jako pierwszego, ale chain
      // traktował goblin-shamana jako pierwszego → „pierwszy" potwór w UI
      // pokazywał się jako zablokowany, drugi jako otwarty.
      const bySlug = new Map([...REGISTRY.enemies.values()].map((e) => [e.slug, e]));
      visible = [
        ...dungeon.mobSlugs.map((slug) => bySlug.get(slug)).filter((e): e is EnemyTemplate => !!e),
        ...(bySlug.has(dungeon.bossEnemySlug) ? [bySlug.get(dungeon.bossEnemySlug)!] : []),
      ];
    } else {
      // Show enemies up to 2 levels above the character, so the UI can grey out
      // the next tier without leaking the entire late-game roster.
      visible = [...REGISTRY.enemies.values()]
        .filter((e) => e.requiredLvl <= charLvl + 2)
        .sort((a, b) => a.requiredLvl - b.requiredLvl);
    }

    // Pull this character's kill log for the visible roster so the client can
    // render per-tile kill counters + cooldown timers. Small table; scan is
    // cheap. Stale dates are implicitly treated as "0 kills today".
    const today = isoDateUTC();
    const killRows = char
      ? await ctx.db
          .select()
          .from(characterEnemyKills)
          .where(eq(characterEnemyKills.characterId, char.id))
      : [];
    const killBySlug = new Map(killRows.map((r) => [r.enemySlug, r] as const));

    // Chain unlock — tylko w trybie per-dungeon. W flat-view kill chain nie
    // ma sensu (nie ma pojęcia "poprzednik"). `killedEverSlugs` obejmuje każdy
    // mob ubity choć raz (row istnieje w character_enemy_kills).
    const killedEverSlugs = new Set(killRows.map((r) => r.enemySlug));
    const enemyNames = new Map([...REGISTRY.enemies.values()].map((e) => [e.slug, e.name]));
    const chainStatus = dungeon
      ? computeDungeonMobChainStatus(dungeon, killedEverSlugs, enemyNames)
      : null;

    return visible.map((e) => {
      const row = killBySlug.get(e.slug);
      const killsToday = row && row.todayDate === today ? row.killsToday : 0;
      const nextAvailableAt = row?.lastKilledAt
        ? row.lastKilledAt.getTime() + e.cooldownSec * 1000
        : null;
      // `isBoss` = ten slug jest bossEnemySlug w którymkolwiek zarejestrowanym
      // lochu. Klient używa do wyróżnienia kafelka na ScreenDungeon.
      const isBoss = REGISTRY.dungeonsList.some((d) => d.bossEnemySlug === e.slug);
      const chain = chainStatus?.get(e.slug);
      return {
        slug: e.slug,
        name: e.name,
        lvl: e.lvl,
        hp: e.hp,
        atk: e.atk,
        gold: e.gold,
        xp: e.xp,
        requiredLvl: e.requiredLvl,
        tier: e.tier,
        available: e.requiredLvl <= charLvl,
        cooldownSec: e.cooldownSec,
        dailyLimit: e.dailyLimit,
        killsToday,
        /** Unix millis when the mob becomes engageable again, or null if ready. */
        nextAvailableAt:
          nextAvailableAt !== null && nextAvailableAt > Date.now() ? nextAvailableAt : null,
        /** Proc abilities — klient rysuje mały badge per-kind obok statów moba. */
        abilities: e.abilities,
        /** true gdy slug jest bossem któregoś z lochów. UI ozdabia kafelek. */
        isBoss,
        /**
         * Chain unlock w obrębie lochu. true = poprzednik pokonany (lub to
         * pierwszy mob); false = jeszcze zablokowany. W flat-view zawsze true.
         */
        unlockedInChain: chain?.unlocked ?? true,
        /** Tekst tooltip gdy `unlockedInChain=false`; null gdy otwarty. */
        chainReason: chain?.reason ?? null,
      };
    });
  }),

  engage: protectedProcedure
    .input(combatEngageInputSchema)
    .mutation(async ({ ctx, input }): Promise<CombatState> => {
      const enemy = getEnemy(input.enemySlug);
      if (!enemy) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Unknown enemy' });
      }
      const [char] = await ctx.db
        .select()
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);
      if (!char) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
      }
      if (isWorking(char)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: WORKING_BLOCKS_COMBAT_MESSAGE });
      }
      if (findCharSession(char.id)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Masz już otwartą walkę. Skończ ją albo poczekaj aż wygaśnie.',
        });
      }
      if (char.lvl < enemy.requiredLvl) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Przeciwnik dostępny od LVL ${enemy.requiredLvl}`,
        });
      }

      // Dungeon gate — mob musi być w odblokowanym lochu dla tego gracza.
      // Gdy mob nie należy do żadnego lochu (legacy / quest-only), brak gating.
      const dungeonSlug = REGISTRY.enemyToDungeon.get(enemy.slug);
      if (dungeonSlug) {
        const dungeon = REGISTRY.dungeons.get(dungeonSlug);
        if (dungeon) {
          const clearRows = await ctx.db
            .select({ slug: characterDungeonClears.dungeonSlug })
            .from(characterDungeonClears)
            .where(eq(characterDungeonClears.characterId, char.id));
          const clearedSlugs = new Set(clearRows.map((r) => r.slug));
          const { status, lockReason } = computeDungeonStatus(
            dungeon,
            char.lvl,
            clearedSlugs,
          );
          if (status === 'locked') {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message:
                lockReason ?? `Loch „${dungeon.name}" jeszcze niedostępny.`,
            });
          }

          // Chain gate — moby w lochu odblokowują się sekwencyjnie, boss po
          // ubiciu wszystkich regular mobów. Bazuje na character_enemy_kills
          // (row istnieje ⇒ mob ubity choć raz w życiu gracza).
          const killRows = await ctx.db
            .select({ slug: characterEnemyKills.enemySlug })
            .from(characterEnemyKills)
            .where(eq(characterEnemyKills.characterId, char.id));
          const killedEver = new Set(killRows.map((r) => r.slug));
          const enemyNames = new Map(
            [...REGISTRY.enemies.values()].map((e) => [e.slug, e.name]),
          );
          const chain = computeDungeonMobChainStatus(dungeon, killedEver, enemyNames);
          const mobStatus = chain.get(enemy.slug);
          if (mobStatus && !mobStatus.unlocked) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: mobStatus.reason ?? 'Ten potwór jeszcze nie odkryty.',
            });
          }
        }
      }

      // Apply regen first — a player who waited out cooldowns in town should
      // see fresh HP/MP/keys, not the pre-regen snapshot. Keys power the new
      // throttle introduced in migration 0014 (max 15, +1 per 15 min).
      const now = new Date();
      const hpRegen = applyHpRegen(char.hp, char.hpMax, char.lastHpTickAt, now);
      const mpRegen = applyMpRegen(char.mp, char.mpMax, char.lastMpTickAt, now);
      const keyRegen = applyKeyRegen(
        char.dungeonKeys,
        DUNGEON_KEYS_MAX,
        char.lastKeyTickAt,
        now,
      );
      // Local mutations so downstream logic sees the post-regen snapshot.
      char.hp = hpRegen.value;
      char.mp = mpRegen.value;
      char.dungeonKeys = keyRegen.value;

      if (char.hp < HP_ENGAGE_MIN) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Za mało HP, aby ruszyć w bój (min. ${HP_ENGAGE_MIN}).`,
        });
      }
      if (char.dungeonKeys < KEY_COST_PER_FIGHT) {
        // Compute time until next key: since applyKeyRegen advances lastTickAt
        // by whole ticks only, the remaining budget is a clean subtract.
        const msUntilNext = KEY_REGEN_MS - (now.getTime() - keyRegen.lastTickAt.getTime());
        const minUntilNext = Math.max(1, Math.ceil(msUntilNext / 60_000));
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Brak klucza do lochu. Następny za ${minUntilNext} min.`,
        });
      }

      // Per-mob cooldown + daily kill cap. Look up the kill log row; if it's
      // for a previous UTC day we've rolled over so the count resets implicitly
      // (we consult `isoDateUTC()` at gate-check time, the row itself is
      // rewritten on next victory).
      const today = isoDateUTC();
      const [killRow] = await ctx.db
        .select()
        .from(characterEnemyKills)
        .where(
          and(
            eq(characterEnemyKills.characterId, char.id),
            eq(characterEnemyKills.enemySlug, enemy.slug),
          ),
        )
        .limit(1);
      const killsToday = killRow && killRow.todayDate === today ? killRow.killsToday : 0;
      if (killsToday >= enemy.dailyLimit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Dzienny limit ubitych osiągnięty (${enemy.dailyLimit}). Wróć jutro.`,
        });
      }
      if (killRow?.lastKilledAt && !input.bypassCooldown) {
        const cooldownEnd = killRow.lastKilledAt.getTime() + enemy.cooldownSec * 1000;
        if (cooldownEnd > now.getTime()) {
          const remaining = Math.ceil((cooldownEnd - now.getTime()) / 1000);
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Potwór jeszcze się nie pozbierał. Daj mu ${remaining}s.`,
          });
        }
      }

      // All gates passed → commit the key deduction + regen advance in one
      // UPDATE. Deduct happens on engage (not post-victory) so an engage→flee
      // loop can't farm free attempts at a boss.
      char.dungeonKeys = char.dungeonKeys - KEY_COST_PER_FIGHT;
      await ctx.db
        .update(characters)
        .set({
          hp: hpRegen.value,
          lastHpTickAt: hpRegen.lastTickAt,
          mp: mpRegen.value,
          lastMpTickAt: mpRegen.lastTickAt,
          dungeonKeys: char.dungeonKeys,
          lastKeyTickAt: keyRegen.lastTickAt,
        })
        .where(eq(characters.id, char.id));

      const [companionRow] = await ctx.db
        .select({ slug: characterCompanions.companionSlug })
        .from(characterCompanions)
        .where(eq(characterCompanions.characterId, char.id))
        .limit(1);
      const buff = companionRow ? getCompanion(companionRow.slug)?.buff ?? null : null;

      // Czy ten mob jest wytropiony? Jeśli tak — konsumujemy slot (usuwamy
      // row) i flagujemy sesję. Bonus gold×2/xp×2/drop×1.5 zadziała dopiero w
      // applyVictoryReward. Expired tracks są odfiltrowane przez gt(now).
      const [trackRow] = await ctx.db
        .select()
        .from(characterTracks)
        .where(
          and(
            eq(characterTracks.characterId, char.id),
            eq(characterTracks.enemySlug, enemy.slug),
            gt(characterTracks.expiresAt, now),
          ),
        )
        .limit(1);
      const trackBonus = Boolean(trackRow);
      if (trackRow) {
        await ctx.db
          .delete(characterTracks)
          .where(
            and(
              eq(characterTracks.characterId, char.id),
              eq(characterTracks.slotIndex, trackRow.slotIndex),
            ),
          );
      }

      // Sum equipped item bonuses — previously ignored in combat, which turned
      // shop weapons into cosmetics. Potions (slot='potion') carry no stats.
      const equipped = await ctx.db
        .select({
          atk: characterItems.atk,
          def: characterItems.def,
          mag: characterItems.mag,
        })
        .from(characterItems)
        .where(
          and(
            eq(characterItems.characterId, char.id),
            isNotNull(characterItems.equippedSlot),
          ),
        );
      const equipBonus = equipped.reduce<{ atk: number; def: number; mag: number }>(
        (acc, row) => ({
          atk: acc.atk + (row.atk ?? 0),
          def: acc.def + (row.def ?? 0),
          mag: acc.mag + (row.mag ?? 0),
        }),
        { atk: 0, def: 0, mag: 0 },
      );

      // Timed elixir buffy — doliczamy flat-delta stats + % hp/mp max do caps.
      // Session snapshot'uje caps w momencie engage'u; jeśli buff wygaśnie
      // w trakcie walki, cap NIE spada mid-fight (UX decyzja).
      const elixirBuffs = await loadActiveBuffs(ctx.db, char.id, new Date());
      const bd = aggregateBuffs(elixirBuffs);
      const hpMaxEff = effectiveMax(char.hpMax, bd.hpMaxPct);
      const mpMaxEff = effectiveMax(char.mpMax, bd.mpMaxPct);

      const session: CombatSession = {
        combatId: randomUUID(),
        userId: ctx.userId,
        characterId: char.id,
        kind: 'dungeon',
        enemy,
        enemyHp: enemy.hp,
        playerHp: Math.min(char.hp, hpMaxEff),
        playerHpMax: hpMaxEff,
        playerMp: Math.min(char.mp, mpMaxEff),
        playerMpMax: mpMaxEff,
        playerAtk: char.stats.atk + equipBonus.atk + (buff?.atkBonus ?? 0) + bd.atkFlat,
        playerDef: char.stats.def + equipBonus.def + bd.defFlat,
        playerMag: char.stats.mag + equipBonus.mag + (buff?.magBonus ?? 0) + bd.magFlat,
        playerSpd: char.stats.spd + bd.spdFlat,
        playerCls: char.cls,
        playerHealBonus: buff?.healBonus ?? 0,
        heavyCooldown: 0,
        trackBonus,
        playerStatus: [],
        status: 'fight',
        rewardApplied: false,
        createdAt: Date.now(),
      };
      createSession(session);
      return toCombatState(session);
    }),

  attack: protectedProcedure
    .input(combatAttackInputSchema)
    .mutation(async ({ ctx, input }): Promise<CombatTurnResult> => {
      const s = requireOwnedSession(input.combatId, ctx.userId);
      if (s.status !== 'fight') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Combat already ended' });
      }
      if (input.kind === 'magic' && s.playerMp < 10) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not enough MP' });
      }
      if (input.kind === 'heavy' && s.heavyCooldown > 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `MOCNY jeszcze niegotowy (${s.heavyCooldown})`,
        });
      }

      // === 1. Tick active status effects (DOTs) at the start of the turn ===
      // Applies BEFORE the player swings — a poisoned player who one-shots the
      // mob still eats this turn's poison damage. Defeat-from-DOT is possible
      // but we handle it after the player's attack landed, so UI reports the
      // kill first and the dot damage second in the log.
      const statusTick = tickPlayerStatus(s.playerStatus);
      s.playerStatus = statusTick.next;
      s.playerHp = Math.max(0, s.playerHp - statusTick.dmg);

      const playerRoll = rollPlayerAttack(
        input.kind,
        { atk: s.playerAtk, mag: s.playerMag, spd: s.playerSpd },
        s.enemy.def,
      );
      // MP is spent even on a missed cast — committing to the spell, not landing it.
      if (input.kind === 'magic') s.playerMp = Math.max(0, s.playerMp - 10);
      // Cooldown is consumed by the swing (hit or miss) — the animation, the
      // stance, the commit. A whiffed heavy still locks the cooldown.
      if (input.kind === 'heavy') {
        s.heavyCooldown = HEAVY_COOLDOWN_TURNS;
      } else if (s.heavyCooldown > 0) {
        s.heavyCooldown -= 1;
      }
      s.enemyHp = Math.max(0, s.enemyHp - playerRoll.dmg);

      let enemyDmg = 0;
      let enemyDodged = false;
      let enemyAbility: CombatTurnResult['enemyAbility'] = null;
      let levelUp: LevelUpInfo | null = null;
      let loot: CombatTurnResult['loot'] = null;
      let unlockedAchievements: AchievementUnlockPayload[] = [];
      let tower: TowerCombatOutcome | null = null;
      // Player could have been killed by the DOT before even attacking —
      // resolve that first; otherwise proceed to the enemy turn normally.
      if (s.playerHp <= 0) {
        s.status = 'defeat';
        await ctx.db
          .update(characters)
          .set({ hp: 1, updatedAt: new Date() })
          .where(eq(characters.id, s.characterId));
        if (s.kind === 'tower') {
          tower = await applyTowerDefeat(ctx.db, s.characterId);
        }
      } else if (s.enemyHp <= 0) {
        s.status = 'victory';
        if (s.kind === 'tower') {
          tower = await applyTowerVictory(ctx.db, s);
        } else {
          const outcome = await applyVictoryReward(ctx.db, s);
          levelUp = outcome.levelUp;
          loot = outcome.loot;
          unlockedAchievements = outcome.unlockedAchievements;
        }
      } else {
        const enemyRoll = rollEnemyAttack(
          s.enemy.atk,
          { def: s.playerDef, spd: s.playerSpd },
          s.playerCls,
          s.enemy.abilities,
        );
        enemyDmg = enemyRoll.dmg;
        enemyDodged = enemyRoll.dodged;
        enemyAbility = enemyRoll.abilityUsed;
        if (enemyRoll.statusApplied) {
          s.playerStatus = applyStatus(s.playerStatus, enemyRoll.statusApplied);
        }
        s.playerHp = Math.max(0, s.playerHp - enemyDmg);
        if (s.playerHp <= 0) {
          s.status = 'defeat';
          await ctx.db
            .update(characters)
            .set({ hp: 1, updatedAt: new Date() })
            .where(eq(characters.id, s.characterId));
          if (s.kind === 'tower') {
            tower = await applyTowerDefeat(ctx.db, s.characterId);
          }
        }
      }

      // Klątwa po przegranej z bossem (tier ≥ 3) w dungeon combat. Tower ma
      // własny fail-cooldown, nie dodajemy tam klątw. 25% szans na klątwę
      // (`CURSE_SPAWN_CHANCE`). Klątwa dzieli slot z pozytywnymi buff'ami —
      // PK `(char_id, kind, is_curse)` pozwala na koegzystencję.
      if (s.status === 'defeat' && s.kind === 'dungeon' && shouldSpawnCurse(s.enemy.tier)) {
        const curse = rollCurse();
        try {
          await applyBuff(
            ctx.db,
            s.characterId,
            curse.kind,
            curse.magnitude,
            curse.durationHours,
            curse.slug,
            new Date(),
            true, // isCurse
          );
        } catch (err) {
          // Klątwa to nie showstopper — loguj i idź dalej. Gracz straci
          // klątwę przy następnej porażce, no big deal.
          console.warn('[combat] curse apply failed', err);
        }
      }

      return {
        state: toCombatState(s),
        playerDmg: playerRoll.dmg,
        playerCrit: playerRoll.crit,
        playerMiss: playerRoll.miss,
        enemyDmg,
        enemyDodged,
        enemyAbility,
        playerStatusDmg: statusTick.dmg,
        trackBonus: s.trackBonus,
        // Gold/XP w payloadzie odzwierciedlają faktycznie przyznane (×2 dla
        // wytropionego moba) — klient pokazuje dokładnie co wpadło.
        reward:
          s.status === 'victory' && s.kind === 'dungeon'
            ? {
                gold: s.trackBonus ? s.enemy.gold * TRACK_GOLD_MULT : s.enemy.gold,
                xp: s.trackBonus ? s.enemy.xp * TRACK_XP_MULT : s.enemy.xp,
              }
            : null,
        levelUp,
        loot,
        unlockedAchievements,
        tower,
      };
    }),

  heal: protectedProcedure
    .input(combatHealInputSchema)
    .mutation(async ({ ctx, input }): Promise<CombatHealResult> => {
      const s = requireOwnedSession(input.combatId, ctx.userId);
      if (s.status !== 'fight') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Combat already ended' });
      }

      // Potion ownership: must be this character's row, a potion, with qty > 0
      // and at least one heal value. Template is resolved from REGISTRY since
      // heal values live there (not snapshotted on character_items).
      const [itemRow] = await ctx.db
        .select()
        .from(characterItems)
        .where(
          and(
            eq(characterItems.id, input.itemId),
            eq(characterItems.characterId, s.characterId),
          ),
        )
        .limit(1);
      if (!itemRow) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Nie masz tej mikstury' });
      }
      if (itemRow.slot !== 'potion' || itemRow.qty <= 0) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'To nie mikstura' });
      }
      const tpl = itemRow.templateId ? REGISTRY.items.get(itemRow.templateId) : undefined;
      const baseHpHeal = tpl?.hpHeal ?? 0;
      const baseMpHeal = tpl?.mpHeal ?? 0;
      if (baseHpHeal <= 0 && baseMpHeal <= 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Ta mikstura nic nie leczy',
        });
      }
      // Companion `healBonus` (Olaf: 0.2) scales both vectors. Round after
      // scaling so +20% of 40 HP reads as 48, not 48.0.
      const mult = 1 + s.playerHealBonus;
      const hpHeal = Math.round(baseHpHeal * mult);
      const mpHeal = Math.round(baseMpHeal * mult);

      const beforeHp = s.playerHp;
      const beforeMp = s.playerMp;
      s.playerHp = Math.min(s.playerHpMax, s.playerHp + hpHeal);
      s.playerMp = Math.min(s.playerMpMax, s.playerMp + mpHeal);
      const healedHp = s.playerHp - beforeHp;
      const healedMp = s.playerMp - beforeMp;
      // Heal eats a turn, so the heavy cooldown ticks down.
      if (s.heavyCooldown > 0) s.heavyCooldown -= 1;

      // Consume one charge — delete the row if this was the last one.
      if (itemRow.qty <= 1) {
        await ctx.db.delete(characterItems).where(eq(characterItems.id, itemRow.id));
      } else {
        await ctx.db
          .update(characterItems)
          .set({ qty: itemRow.qty - 1 })
          .where(eq(characterItems.id, itemRow.id));
      }

      // Heal zjada turę — tak samo ticknie status (poison), tak samo moby mogą
      // użyć ability w kontrze. Potion zregenerował HP zanim zadziała DOT,
      // więc nie da się "zchewlić" trucizny w jednej turze — DOT leci ZA
      // healem. Trade-off: mocny potion vs ewentualne dodatkowe ticks.
      const statusTick = tickPlayerStatus(s.playerStatus);
      s.playerStatus = statusTick.next;
      s.playerHp = Math.max(0, s.playerHp - statusTick.dmg);
      // Heal consumes a turn — enemy counter-attacks. Same shape as combat.attack
      // so the player can't just chug potions for free.
      const enemyRoll = rollEnemyAttack(
        s.enemy.atk,
        { def: s.playerDef, spd: s.playerSpd },
        s.playerCls,
        s.enemy.abilities,
      );
      if (enemyRoll.statusApplied) {
        s.playerStatus = applyStatus(s.playerStatus, enemyRoll.statusApplied);
      }
      s.playerHp = Math.max(0, s.playerHp - enemyRoll.dmg);
      let tower: TowerCombatOutcome | null = null;
      if (s.playerHp <= 0) {
        s.status = 'defeat';
        await ctx.db
          .update(characters)
          .set({ hp: 1, updatedAt: new Date() })
          .where(eq(characters.id, s.characterId));
        if (s.kind === 'tower') {
          tower = await applyTowerDefeat(ctx.db, s.characterId);
        }
      }

      const itemName = tpl?.name ?? itemRow.name;
      return {
        state: toCombatState(s),
        itemId: itemRow.id,
        itemName,
        healedHp,
        healedMp,
        enemyDmg: enemyRoll.dmg,
        enemyDodged: enemyRoll.dodged,
        enemyAbility: enemyRoll.abilityUsed,
        playerStatusDmg: statusTick.dmg,
        // Heale nie triggerują osiągnięć w obecnym designie — zawsze pusto.
        unlockedAchievements: [],
        tower,
      };
    }),

  end: protectedProcedure
    .input(combatEndInputSchema)
    .mutation(async ({ ctx, input }) => {
      const s = requireOwnedSession(input.combatId, ctx.userId);
      // Persist mid-fight player hp when they leave voluntarily.
      if (s.status === 'fight') {
        await ctx.db
          .update(characters)
          .set({ hp: s.playerHp, mp: s.playerMp, updatedAt: new Date() })
          .where(eq(characters.id, s.characterId));
      }
      deleteSession(input.combatId);
      return { ok: true };
    }),

  /**
   * Gem sink: dokup extra dungeon key poza cap'em (15). Bypass limit —
   * gracz może kupić tyle ile gemów wystarczy. Regen po kupieniu nadal
   * dąży do cap=15, ale bieżący stan może być > 15.
   */
  buyExtraKey: protectedProcedure.mutation(async ({ ctx }) => {
    const [char] = await ctx.db
      .select()
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });
    const cost = GEM_SINK_COSTS.extraKey;
    if (char.gems < cost) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Brak gemów (${cost}).` });
    }
    await ctx.db
      .update(characters)
      .set({
        gems: sql`${characters.gems} - ${cost}`,
        dungeonKeys: sql`${characters.dungeonKeys} + 1`,
      })
      .where(eq(characters.id, char.id));
    return { ok: true, cost };
  }),

  /**
   * Gem sink: zeruje per-mob `kills_today` dla bieżącej UTC daty u tego gracza.
   * Pozwala dalej grindować mobki które już osiągnęły dzienny cap (tier-1: 25,
   * skalujące w dół dla wyższych tierów). Cooldown'y per-kill zostają.
   */
  resetDailyMobs: protectedProcedure.mutation(async ({ ctx }) => {
    const [char] = await ctx.db
      .select()
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });
    const cost = GEM_SINK_COSTS.resetDailyMobs;
    if (char.gems < cost) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Brak gemów (${cost}).` });
    }
    const today = isoDateUTC();
    await ctx.db.transaction(async (tx) => {
      await tx
        .update(characters)
        .set({ gems: sql`${characters.gems} - ${cost}` })
        .where(eq(characters.id, char.id));
      await tx
        .update(characterEnemyKills)
        .set({ killsToday: 0, updatedAt: new Date() })
        .where(
          and(
            eq(characterEnemyKills.characterId, char.id),
            eq(characterEnemyKills.todayDate, today),
          ),
        );
    });
    return { ok: true, cost };
  }),

  /**
   * Gem sink: zeruje cooldown po killu dla pojedynczego mob'a. Daily limit
   * (`kills_today`) zostaje — nie pomija dziennego cap'a, tylko pozwala bić
   * teraz zamiast czekać 30s-2min pomiędzy walkami.
   */
  skipBossCooldown: protectedProcedure
    .input(skipBossCooldownInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [char] = await ctx.db
        .select()
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);
      if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });
      const cost = GEM_SINK_COSTS.skipBossCooldown;
      if (char.gems < cost) {
        throw new TRPCError({ code: 'FORBIDDEN', message: `Brak gemów (${cost}).` });
      }
      // Walk row musi istnieć (gracz musiał kogoś zabić żeby był cooldown).
      const [killRow] = await ctx.db
        .select()
        .from(characterEnemyKills)
        .where(
          and(
            eq(characterEnemyKills.characterId, char.id),
            eq(characterEnemyKills.enemySlug, input.enemySlug),
          ),
        )
        .limit(1);
      if (!killRow || !killRow.lastKilledAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Ten mob nie ma jeszcze cooldownu — walcz normalnie.',
        });
      }
      await ctx.db.transaction(async (tx) => {
        await tx
          .update(characters)
          .set({ gems: sql`${characters.gems} - ${cost}` })
          .where(eq(characters.id, char.id));
        await tx
          .update(characterEnemyKills)
          .set({ lastKilledAt: null, updatedAt: new Date() })
          .where(
            and(
              eq(characterEnemyKills.characterId, char.id),
              eq(characterEnemyKills.enemySlug, input.enemySlug),
            ),
          );
      });
      return { ok: true, cost };
    }),
});
