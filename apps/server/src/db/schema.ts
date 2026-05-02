// Drizzle schema — source of truth for Postgres structure.

import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import type {
  Appearance,
  CharacterClass,
  CharacterStats,
  ChroniclePayload,
  EnemyAbility,
  QuestState,
  Rarity,
} from '@grodno/shared';

// ========== Enums ==========
export const characterClassEnum = pgEnum('character_class', ['warrior', 'mage', 'rogue']);
export const questStateEnum = pgEnum('quest_state', ['idle', 'active', 'done']);
export const itemSlotEnum = pgEnum('item_slot', [
  'head',
  'neck',
  'chest',
  'weapon',
  'off',
  'hands',
  'ring',
  'feet',
  'potion',
  'any',
]);
export const itemRarityEnum = pgEnum('item_rarity', ['common', 'rare', 'epic', 'legendary']);
export const equippedSlotEnum = pgEnum('equipped_slot', [
  'head',
  'neck',
  'chest',
  'weapon',
  'off',
  'hands',
  'ring',
  'feet',
]);
export const guildRankEnum = pgEnum('guild_rank', ['leader', 'officer', 'member', 'recruit']);

// Timed buffy z elixirów. `*_pct` = mnożnik do hpMax/mpMax (wyraż w procentach,
// int: 25 = +25%). `*_flat` = sztywne +N do staty (atk/def/mag/spd). Jedna
// kategoria = jeden aktywny buff per postać (override semantics — nowy override
// starego), żeby nie stackowało do absurdu.
export const buffKindEnum = pgEnum('buff_kind', [
  'hp_max_pct',
  'mp_max_pct',
  'atk_flat',
  'def_flat',
  'mag_flat',
  'spd_flat',
]);

// ========== Users ==========
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 254 }),
    passwordHash: text('password_hash'),
    isGuest: boolean('is_guest').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex('users_email_unique').on(t.email),
  }),
);

// ========== Refresh tokens ==========
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ========== Characters ==========
export const characters = pgTable(
  'characters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 20 }).notNull(),
    cls: characterClassEnum('cls').notNull(),
    lvl: integer('lvl').notNull().default(1),
    // xp + xpMax are bigint (not integer) because the uncapped leveling curve
    // grows past int32 around L100. Stored as JS `number` via Drizzle's bigint
    // mode — safe up to 2⁵³ which covers L200+ with plenty of headroom.
    xp: bigint('xp', { mode: 'number' }).notNull().default(0),
    xpMax: bigint('xp_max', { mode: 'number' }).notNull().default(60),
    hp: integer('hp').notNull(),
    hpMax: integer('hp_max').notNull(),
    mp: integer('mp').notNull(),
    mpMax: integer('mp_max').notNull(),
    gold: bigint('gold', { mode: 'number' }).notNull().default(0),
    gems: integer('gems').notNull().default(0),
    stamina: integer('stamina').notNull().default(10),
    staminaMax: integer('stamina_max').notNull().default(10),
    stats: jsonb('stats').$type<CharacterStats>().notNull(),
    appearance: jsonb('appearance').$type<Appearance>().notNull(),
    lastTickAt: timestamp('last_tick_at', { withTimezone: true }).notNull().defaultNow(),
    /** HP regen accumulator; advances by consumed ticks only (see game/regen.ts). */
    lastHpTickAt: timestamp('last_hp_tick_at', { withTimezone: true }).notNull().defaultNow(),
    /** MP regen accumulator; advances by consumed ticks only. */
    lastMpTickAt: timestamp('last_mp_tick_at', { withTimezone: true }).notNull().defaultNow(),
    /** Tavern healer cooldown anchor. NULL = never used. */
    lastHealerAt: timestamp('last_healer_at', { withTimezone: true }),
    /** Current dungeon-keys saldo (cap `DUNGEON_KEYS_MAX = 15`). Consumed per engage. */
    dungeonKeys: integer('dungeon_keys').notNull().default(15),
    /** Dungeon-key regen accumulator; +1 per 15 min, offline included. */
    lastKeyTickAt: timestamp('last_key_tick_at', { withTimezone: true }).notNull().defaultNow(),
    /**
     * Track auto-roll accumulator. Empty slots get a fresh trop every
     * `TRACK_ROLL_INTERVAL_MS = 1h`; advances by consumed ticks only.
     */
    lastTrackRollAt: timestamp('last_track_roll_at', { withTimezone: true }).notNull().defaultNow(),
    /** Slug of rented mount from `mount_templates`. NULL = brak wynajmu. */
    mountSlug: varchar('mount_slug', { length: 64 }),
    /** Rental expiry. Past = lazy-expired, bonus no longer applies. */
    mountExpiresAt: timestamp('mount_expires_at', { withTimezone: true }),
    /**
     * Ostatnie me.get — bazowy timestamp do wyliczania offline-progress summary.
     * Przy każdym me.get: snapshot pre-regen → regen → diff → jeśli elapsed
     * >= OFFLINE_THRESHOLD, zwracamy summary. Update last_seen_at = now.
     */
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    /** Arena Elo-ish points (start 1000). Steruje matchmaking + leaderboard. */
    arenaPoints: integer('arena_points').notNull().default(1000),
    arenaWins: integer('arena_wins').notNull().default(0),
    arenaLosses: integer('arena_losses').notNull().default(0),
    /** Walk dzisiaj; reset po UTC rollover'ze tracked przez arenaLastFightDate. */
    arenaFightsToday: integer('arena_fights_today').notNull().default(0),
    arenaLastFightDate: varchar('arena_last_fight_date', { length: 10 }),
    /** Kolejne wygrane z rzędu. Reset na loss, bump na win. Driver arena_streak_5. */
    arenaCurrentStreak: integer('arena_current_streak').notNull().default(0),
    /**
     * Guild membership — denormalized dla me.get (unika JOIN'a). Uniqueness
     * per-postać egzekwowana na `guild_members.characterId` unique indexie.
     * ON DELETE SET NULL — gdy gildia się rozwiązuje, członkowie wracają do
     * NULL bez utraty postaci.
     */
    guildId: uuid('guild_id'),
    guildRank: varchar('guild_rank', { length: 16 }),
    /**
     * Raid hits dziś — przeniesione z guild_members żeby leave/rejoin nie
     * resetował licznika. Counter żyje na postaci, niezależnie od członkostwa.
     * Reset na UTC rollover via lastRaidHitDate compare.
     */
    raidHitsToday: smallint('raid_hits_today').notNull().default(0),
    lastRaidHitDate: varchar('last_raid_hit_date', { length: 10 }).notNull().default(''),
    /**
     * World boss hits dziś — równoległy do raid (gildia), ale dla server-wide
     * bossa. 3/dzień, reset UTC. Niezależny od gildii — solo gracze też biją.
     */
    worldBossHitsToday: smallint('world_boss_hits_today').notNull().default(0),
    lastWorldBossHitDate: varchar('last_world_boss_hit_date', { length: 10 })
      .notNull()
      .default(''),
    /**
     * Echa Wybudzonego — waluta dropowana z każdego hit'a w world boss.
     * Tradeable w `worldBoss.shop` na gemy/scrap/gold/extra hit. Nie resetuje
     * się — akumulujące się saldo lifetime.
     */
    echoes: integer('echoes').notNull().default(0),
    /** Ostatni rename imienia postaci (gem sink). 30-dniowy cooldown, NULL = never renamed. */
    lastRenameAt: timestamp('last_rename_at', { withTimezone: true }),
    /** Zasób "złom" z dismantle u Kowala Zygmunta. Gated na upgrade itemów. */
    scrap: integer('scrap').notNull().default(0),
    /**
     * Gem-sink: ile razy postać odświeżyła sklep w dniu `shopRefreshDate`.
     * Resetuje się przy zmianie UTC daty. Driver scaling cost:
     * cost(count) = 10 * 2^count, cap 160 (game/shop.ts).
     */
    shopRefreshCountToday: integer('shop_refresh_count_today').notNull().default(0),
    /** ISO date (UTC) ostatniego odświeżenia. NULL = nigdy nie użyte. */
    shopRefreshDate: varchar('shop_refresh_date', { length: 10 }),
    /**
     * Karciarz Franek: ISO date (UTC) kiedy postać wzięła darmowy rzut dziś.
     * NULL lub data inna niż `isoDateUTC()` → darmowy rzut dostępny. Extra
     * rzuty płatne są gemami, bez trackingu (gemy odliczane przy roll'u).
     */
    diceFreeUsedDate: varchar('dice_free_used_date', { length: 10 }),
    /**
     * Wróżka Hanusia — taki sam mechanizm jak Franek. 1 darmowy pull / UTC
     * dzień; extra płatne 3 gemami. Data porównywana z `isoDateUTC()`.
     */
    oracleFreeUsedDate: varchar('oracle_free_used_date', { length: 10 }),
    /**
     * Mnich Panteleon — timestamp ostatniego błogosławieństwa. 30-min
     * cooldown między dowolnymi dwoma blessing'ami, inaczej gracz kupowałby
     * wszystkie 6 naraz za grosz. NULL = nigdy nie użyte.
     */
    lastBlessingAt: timestamp('last_blessing_at', { withTimezone: true }),
    /**
     * "Praca" — długoterminowe idle questy. Gracz wybiera czas (1..8h),
     * postać "idzie do pracy", po upływie odbiera nagrodę (gold + xp).
     * `workStartedAt` + `workEndsAt` oba NULL = brak aktywnej pracy.
     * `workKind` = slug template'a (np. 'tragarz', 'piekarz') dla flavor.
     */
    workStartedAt: timestamp('work_started_at', { withTimezone: true }),
    workEndsAt: timestamp('work_ends_at', { withTimezone: true }),
    workKind: varchar('work_kind', { length: 32 }),
    /**
     * Szczurogród+ subskrypcja — aktywna gdy `now < szczurogrodPlusUntil`.
     * Daje +20% XP do wszystkich źródeł. Płatna w gemach (`me.buySzczurogrodPlus`),
     * extends do max +90 dni do przodu (anti-stacking lifetime). NULL = nigdy
     * nie kupione lub wygasło dawno temu (lazy — nie czyścimy NULL'em).
     */
    szczurogrodPlusUntil: timestamp('szczurogrod_plus_until', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userCharacterIdx: uniqueIndex('characters_user_unique').on(t.userId),
  }),
);

// ========== Character quest state ==========
// Which quests the character has started/completed. Template quests live in code.
export const characterQuests = pgTable(
  'character_quests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    questId: varchar('quest_id', { length: 64 }).notNull(),
    state: questStateEnum('state').notNull().default('idle'),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    charQuestIdx: uniqueIndex('character_quest_unique').on(t.characterId, t.questId),
  }),
);

// ========== Character items ==========
// Each row is an instance owned by a character.
//
// `templateId` references a row in `item_templates` (the DB-backed catalog).
// New inserts always set it; the server resolves name/icon/desc/stats from the
// template at read time so that edits in DB propagate to existing owners.
//
// Legacy rows (from before the DB-backed-content migration) may have
// templateId = NULL and carry the original snapshot in name/icon/slot/rarity/
// atk/def/mag/desc. `rowToItem` falls back to those columns when no template
// is resolved. Slot + rarity are kept on every row regardless (needed for
// indexes and partial-unique constraints).
export const characterItems = pgTable('character_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  characterId: uuid('character_id')
    .notNull()
    .references(() => characters.id, { onDelete: 'cascade' }),
  templateId: varchar('template_id', { length: 64 }),
  name: varchar('name', { length: 80 }).notNull(),
  icon: varchar('icon', { length: 64 }).notNull(),
  slot: itemSlotEnum('slot').notNull(),
  rarity: itemRarityEnum('rarity').notNull(),
  atk: integer('atk'),
  def: integer('def'),
  mag: integer('mag'),
  desc: text('desc'),
  equippedSlot: equippedSlotEnum('equipped_slot'),
  source: varchar('source', { length: 32 }).notNull().default('unknown'),
  /** Only potions stack (slot='potion'). Non-potion rows stay at qty=1. */
  qty: integer('qty').notNull().default(1),
  /**
   * Enhancement level (Kowal Zygmunt). 0 = unenhanced, 1..10 upgrade levels.
   * Aplikowane przez applyEnhancementToStats przy equip/display. Potiony
   * ignorują (slot='potion' never enhanced).
   */
  enhancementLevel: smallint('enhancement_level').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ========== Character companions (Tawerna) ==========
// Unique per character — only one companion at a time.
export const characterCompanions = pgTable(
  'character_companions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    companionSlug: varchar('companion_slug', { length: 64 }).notNull(),
    hiredAt: timestamp('hired_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    oneCompanionPerCharacter: uniqueIndex('character_companions_unique').on(t.characterId),
  }),
);

// ========== Dungeon tracks (tropy) ==========
// Max 3 rows per character (PK covers char + slot 0..2). Each slot holds one
// active trop on a specific mob, TTL 2h. Expired rows are swept at read time
// in me.get; new ones auto-roll every hour when a slot is free. Engaging the
// wytropionego moba deletes the row on engage and grants gold×2 / xp×2 /
// drop×1.5 on victory.
export const characterTracks = pgTable(
  'character_tracks',
  {
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    slotIndex: smallint('slot_index').notNull(),
    enemySlug: varchar('enemy_slug', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.characterId, t.slotIndex] }),
  }),
);

// ========== Character buffs (timed elixir effects) ==========
// Jeden wiersz = jeden aktywny buff danej kategorii. PK (character_id, kind)
// wymusza override semantics — ponowne użycie mikstury tej samej kategorii
// nadpisuje magnitude + expires_at zamiast stack'ować N aktywnych buff'ów.
// Wiersze NIE są usuwane automatycznie — `me.get` lazy-purge'uje przy
// odczycie (expires_at < now). Do combat/pathway'y używają `loadActiveBuffs`
// który filtruje in-flight.
export const characterBuffs = pgTable(
  'character_buffs',
  {
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    kind: buffKindEnum('kind').notNull(),
    /** `*_pct` → procent (25 = +25% hpMax). `*_flat` → płaski delta statu.
     *  Zawsze DODATNI; sign'a określa `is_curse` (true = odejmuj). */
    magnitude: smallint('magnitude').notNull(),
    /** Unix ms dopinany przy apply'u — lazy-purge porównuje z `now`. */
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
    /** Template id mikstury która była źródłem buff'a — do UI (nazwa, ikona).
     *  Dla klątw: slug klątwy (np. 'curse-weakness'). */
    sourceItemId: varchar('source_item_id', { length: 64 }),
    /**
     * True = klątwa (ujemny efekt, zdejmowalna u Baby Jagi). False = buff.
     * Część PK — gracz może mieć JEDNOCZEŚNIE +8 ATK blessing i -5 ATK klątwę;
     * aggregateBuffs sumuje je z przeciwnymi znakami.
     */
    isCurse: boolean('is_curse').notNull().default(false),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.characterId, t.kind, t.isCurse] }),
  }),
);

// ========== Shop purchase log ==========
// One row per (character, listing, UTC date). Prevents re-buying the same
// listing on the same day — shop refreshes at UTC midnight. Rows are kept
// forever (cheap; small table per character).
export const shopPurchases = pgTable(
  'shop_purchases',
  {
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    listingId: varchar('listing_id', { length: 64 }).notNull(),
    purchasedDate: varchar('purchased_date', { length: 10 }).notNull(), // ISO YYYY-MM-DD UTC
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.characterId, t.listingId, t.purchasedDate] }),
  }),
);

// ========== Season Pass (Priorytet 8 z features-vs-sf.md) ==========
// 30-dniowy battle pass z resetu miesięcznego (UTC first-of-month).
// Dual track (free + premium za 500💎 przed końcem sezonu).
// Progress: +1 XP za combat win, +5 XP za quest collect.
// Wymagane XP na tier N: 10 × N (linear; tier 30 = 300 XP).
// Claims trackowane bitmapą (int32 → 30 bitów z zapasem).
export const characterSeasonPass = pgTable(
  'character_season_pass',
  {
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    /** ISO date UTC first-of-month — np. "2026-04-01". Upsert w me.get
     *  przy zmianie miesiąca (poprzedni sezon wygasł, start nowy). */
    seasonStart: varchar('season_start', { length: 10 }).notNull(),
    xp: integer('xp').notNull().default(0),
    /** true = wykupiony premium track dla tego sezonu. Po zmianie sezonu
     *  wraca do false (nowy upsert). */
    isPremium: boolean('is_premium').notNull().default(false),
    /** Bitmapa 30 bitów: bit N = tier N+1 odebrany na free track. */
    claimedFreeBitmap: integer('claimed_free_bitmap').notNull().default(0),
    /** Analogicznie dla premium track. Player nie może claim'ować premium
     *  dopóki `isPremium=true`. */
    claimedPremiumBitmap: integer('claimed_premium_bitmap').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.characterId, t.seasonStart] }),
  }),
);

// ========== Daily claim log ==========
export const dailyClaims = pgTable('daily_claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  characterId: uuid('character_id')
    .notNull()
    .references(() => characters.id, { onDelete: 'cascade' }),
  claimedDate: varchar('claimed_date', { length: 10 }).notNull(), // ISO YYYY-MM-DD
  streakDay: integer('streak_day').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ===========================================================================
// ========================== Content templates ==============================
// ===========================================================================
// Previously these lived as static TS arrays in `game/*.ts`. They're now
// DB-backed so edits propagate to all players without a redeploy. The TS
// arrays remain only as seed-if-empty source for fresh databases. Admin
// edits via DataGrip + call POST /trpc/admin.reload to refresh the
// in-memory content registry.

// ========== Item templates ==========
// Unified catalog of every item that can end up in a character's inventory:
// shop items, quest loot, mob loot, boss unique drops, daily reward items.
// Consumers JOIN by id to resolve display + stats.
export const itemTemplates = pgTable('item_templates', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 80 }).notNull(),
  icon: varchar('icon', { length: 64 }).notNull(),
  slot: itemSlotEnum('slot').notNull(),
  rarity: itemRarityEnum('rarity').notNull(),
  atk: integer('atk'),
  def: integer('def'),
  mag: integer('mag'),
  desc: text('desc'),
  /** HP restored when drunk in combat. 0 for non-potion items. */
  hpHeal: smallint('hp_heal').notNull().default(0),
  /** MP restored when drunk in combat. 0 for HP-only / non-potion items. */
  mpHeal: smallint('mp_heal').notNull().default(0),
  /** null = universal; otherwise array of CharacterClass slugs that may own it. */
  allowedClasses: jsonb('allowed_classes').$type<readonly CharacterClass[] | null>(),
  /**
   * Kind of timed buff this potion grants when drunk. NULL = classic heal potion
   * (uses `hp_heal`/`mp_heal`). Applied by `inventory.usePotion` — inserts/overrides
   * a row in `character_buffs`. Non-potion slots leave this NULL.
   */
  buffKind: buffKindEnum('buff_kind'),
  /**
   * Magnitude of the buff. `*_pct` kinds → percent (25 = +25%). `*_flat` kinds →
   * raw stat delta. NULL when `buff_kind` is NULL.
   */
  buffMagnitude: smallint('buff_magnitude'),
  /**
   * Time-to-live in hours after apply. NULL when `buff_kind` is NULL. Typical
   * values: 6, 12.
   */
  buffDurationHours: smallint('buff_duration_hours'),
});

// ========== Enemy templates ==========
// Replaces DUNGEON_ENEMIES in game/combat.ts.
export const enemyTemplates = pgTable('enemy_templates', {
  slug: varchar('slug', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 80 }).notNull(),
  lvl: integer('lvl').notNull(),
  hp: integer('hp').notNull(),
  atk: integer('atk').notNull(),
  /** Armor value applied via `reduce(raw, def)` when the enemy is hit. */
  def: smallint('def').notNull().default(0),
  gold: integer('gold').notNull(),
  xp: integer('xp').notNull(),
  requiredLvl: integer('required_lvl').notNull(),
  /** 1..4 — drives loot pool + rarity weights. */
  tier: smallint('tier').notNull(),
  /** Seconds after a kill before this mob can be re-engaged. */
  cooldownSec: smallint('cooldown_sec').notNull().default(30),
  /** Max kills per UTC day, per character. Resets at 00:00 UTC. */
  dailyLimit: smallint('daily_limit').notNull().default(25),
  /** Proc-based combat abilities (magic pierce, poison DOT, armor pierce). */
  abilities: jsonb('abilities').$type<readonly EnemyAbility[]>().notNull().default([]),
});

// ========== Character enemy kill log ==========
// One row per (character, enemy slug) tracking the cooldown + daily quota.
// `kills_today` resets when `today_date` differs from `isoDateUTC()` — done
// read-time in combat.engage so stale dates don't block a fresh UTC day.
export const characterEnemyKills = pgTable(
  'character_enemy_kills',
  {
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    enemySlug: varchar('enemy_slug', { length: 64 }).notNull(),
    /** Timestamp of the most recent victory. Null until first kill. */
    lastKilledAt: timestamp('last_killed_at', { withTimezone: true }),
    killsToday: integer('kills_today').notNull().default(0),
    /** ISO YYYY-MM-DD UTC. Mismatched against today = reset kills_today to 0. */
    todayDate: varchar('today_date', { length: 10 }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.characterId, t.enemySlug] }),
  }),
);

// ========== Quest templates ==========
// Replaces QUEST_TEMPLATES in game/quests.ts.
export const questTemplates = pgTable('quest_templates', {
  id: varchar('id', { length: 64 }).primaryKey(),
  title: varchar('title', { length: 80 }).notNull(),
  desc: text('desc').notNull(),
  icon: varchar('icon', { length: 64 }).notNull(),
  diff: varchar('diff', { length: 16 }).notNull(),
  gold: integer('gold').notNull(),
  xp: integer('xp').notNull(),
  itemChance: integer('item_chance').notNull(),
  duration: integer('duration').notNull(),
  requiredLvl: integer('required_lvl').notNull(),
  chapter: varchar('chapter', { length: 16 }).notNull(),
  /** Bonus dungeon keys awarded on `quests.collect`. 0 = none. Boss quests = 5. */
  rewardKeys: smallint('reward_keys').notNull().default(0),
});

// ========== Companion templates ==========
// Replaces COMPANIONS in game/tavern.ts.
export const companionTemplates = pgTable('companion_templates', {
  slug: varchar('slug', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 80 }).notNull(),
  cls: characterClassEnum('cls').notNull(),
  lvl: integer('lvl').notNull(),
  price: integer('price').notNull(),
  trait: text('trait').notNull(),
  buff: jsonb('buff').$type<{
    atkBonus?: number;
    magBonus?: number;
    lootBonusPct?: number;
    healBonus?: number;
  }>().notNull(),
});

// ========== Mount templates (Stajnie) ==========
// Rentable mounts. Player rents one at a time for `rentalHours` (default 24h);
// while active, newly-started quests have their duration reduced by `speedPct`
// percent. Rental info lives on `characters.mount_slug` + `mount_expires_at`.
export const mountTemplates = pgTable('mount_templates', {
  slug: varchar('slug', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  /** GameIcon name — compact-style 'horse' icon recommended. */
  icon: varchar('icon', { length: 64 }).notNull(),
  desc: varchar('desc', { length: 240 }).notNull(),
  /** 0..80 — percent reduction applied to `tpl.duration` on `quests.start`. */
  speedPct: smallint('speed_pct').notNull(),
  price: integer('price').notNull(),
  rentalHours: smallint('rental_hours').notNull().default(24),
  requiredLvl: integer('required_lvl').notNull().default(1),
  sortOrder: smallint('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ========== Shop listings ==========
// Each listing is an item_template for sale + its price/gating. Replaces
// SHOP_CATALOG in game/shop.ts. Listing IDs match the legacy 's1', 's4m' etc.
export const shopListings = pgTable('shop_listings', {
  id: varchar('id', { length: 64 }).primaryKey(),
  itemTemplateId: varchar('item_template_id', { length: 64 })
    .notNull()
    .references(() => itemTemplates.id, { onDelete: 'restrict' }),
  price: integer('price').notNull(),
  usesGems: boolean('uses_gems').notNull().default(false),
  requiredLvl: integer('required_lvl').notNull(),
});

// ========== Mob loot config (per tier) ==========
// Drop rate gate + rarity weights. Replaces MOB_LOOT_POOLS + RARITY_WEIGHTS.
export const mobTierConfig = pgTable('mob_tier_config', {
  tier: smallint('tier').primaryKey(),
  dropRate: numeric('drop_rate', { precision: 3, scale: 2 }).notNull(),
  rarityWeights: jsonb('rarity_weights').$type<Record<Rarity, number>>().notNull(),
});

// ========== Mob loot entries (pool membership) ==========
export const mobLootEntries = pgTable(
  'mob_loot_entries',
  {
    tier: smallint('tier')
      .notNull()
      .references(() => mobTierConfig.tier, { onDelete: 'cascade' }),
    itemTemplateId: varchar('item_template_id', { length: 64 })
      .notNull()
      .references(() => itemTemplates.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.tier, t.itemTemplateId] }),
  }),
);

// ========== Quest loot entries (pool membership by difficulty) ==========
export const questLootEntries = pgTable(
  'quest_loot_entries',
  {
    difficulty: varchar('difficulty', { length: 16 }).notNull(),
    itemTemplateId: varchar('item_template_id', { length: 64 })
      .notNull()
      .references(() => itemTemplates.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.difficulty, t.itemTemplateId] }),
  }),
);

// ========== Boss unique drops ==========
// (questId, class) → exactly one item_template guaranteed.
export const bossUniqueDrops = pgTable(
  'boss_unique_drops',
  {
    questId: varchar('quest_id', { length: 64 })
      .notNull()
      .references(() => questTemplates.id, { onDelete: 'cascade' }),
    cls: characterClassEnum('cls').notNull(),
    itemTemplateId: varchar('item_template_id', { length: 64 })
      .notNull()
      .references(() => itemTemplates.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.questId, t.cls] }),
  }),
);

// ========== Daily ladder ==========
// 7 rows, streakDay 1..7. Replaces DAILY_LADDER in game/daily.ts.
export const dailyLadder = pgTable('daily_ladder', {
  day: smallint('day').primaryKey(),
  kind: varchar('kind', { length: 16 }).notNull(),
  v: varchar('v', { length: 16 }).notNull(),
  gold: integer('gold').notNull().default(0),
  gems: integer('gems').notNull().default(0),
  xp: integer('xp').notNull().default(0),
  /** Dungeon keys awarded on this day's `daily.claim`. 0 = none. */
  keys: smallint('keys').notNull().default(0),
  itemTemplateId: varchar('item_template_id', { length: 64 }).references(
    () => itemTemplates.id,
    { onDelete: 'set null' },
  ),
});

// ========== Arena matches ==========
// Historia pojedynków. Każdy `fight` → jeden wiersz. Defender może być
// NPC (defender_id NULL, slug w payload'cie) lub real playerem.
// Log tury NIE zapisujemy — koszt zbyt wysoki, klient dostaje log w response'ie.
export const arenaMatches = pgTable(
  'arena_matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    attackerId: uuid('attacker_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    /** NULL = NPC opponent (defenderSlug w payload'cie). */
    defenderId: uuid('defender_id').references(() => characters.id, {
      onDelete: 'set null',
    }),
    defenderKind: varchar('defender_kind', { length: 16 }).notNull(),
    defenderSlug: varchar('defender_slug', { length: 64 }).notNull(),
    attackerName: varchar('attacker_name', { length: 20 }).notNull(),
    attackerCls: varchar('attacker_cls', { length: 16 }).notNull(),
    attackerLvl: integer('attacker_lvl').notNull(),
    defenderName: varchar('defender_name', { length: 40 }).notNull(),
    defenderCls: varchar('defender_cls', { length: 16 }).notNull(),
    defenderLvl: integer('defender_lvl').notNull(),
    defenderPower: integer('defender_power').notNull(),
    wonByAttacker: boolean('won_by_attacker').notNull(),
    pointsDelta: integer('points_delta').notNull(),
    goldReward: integer('gold_reward').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    attackerIdx: index('arena_matches_attacker_idx').on(t.attackerId, t.createdAt),
    defenderIdx: index('arena_matches_defender_idx').on(t.defenderId, t.createdAt),
  }),
);

// ========== Guilds (Phase 1) ==========
// Gildie — S&F-like. Org record + członkowie + chat + zaproszenia.
// Phase 2+ dodaje: treasury_logs, buildings, wars, raids.
//
// Design decisions:
// - Jedna gildia per postać — uniqueIndex na guild_members.characterId mirror
//   character_companions pattern.
// - Leader FK z ON DELETE RESTRICT — nie da się usunąć postaci-lidera bez
//   transferu lub disband'u. Chroni przed sierocymi gildiami.
// - disbandedAt timestamptz NULL dla soft-delete — historia chat'u + logów
//   przetrwa rozwiązanie gildii.
// - characters.guildId denormalizowany dla me.get (fast path bez JOIN).
export const guilds = pgTable(
  'guilds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 24 }).notNull(),
    tag: varchar('tag', { length: 5 }).notNull(),
    motto: varchar('motto', { length: 80 }).notNull().default(''),
    emblemKind: varchar('emblem_kind', { length: 16 }).notNull().default('shield'),
    emblemColor: varchar('emblem_color', { length: 7 }).notNull().default('#c83232'),
    leaderCharId: uuid('leader_char_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'restrict' }),
    level: smallint('level').notNull().default(1),
    glory: integer('glory').notNull().default(0),
    treasuryGold: bigint('treasury_gold', { mode: 'number' }).notNull().default(0),
    treasuryGems: integer('treasury_gems').notNull().default(0),
    memberCap: smallint('member_cap').notNull().default(10),
    requiredLvl: integer('required_lvl').notNull().default(5),
    isOpen: boolean('is_open').notNull().default(true),
    /** Soft-delete — rozwiązane gildie zostają w DB żeby chat/logi przetrwały. */
    disbandedAt: timestamp('disbanded_at', { withTimezone: true }),
    /** Daily withdraw tracking (UTC date "yyyy-mm-dd"). Reset przy pierwszym withdraw po zmianie daty. */
    lastWithdrawalDate: varchar('last_withdrawal_date', { length: 10 }).notNull().default(''),
    /** Suma złota wypłaconego "dzisiaj" (UTC). Porównywana z cap'em (20% + vault). */
    dailyWithdrawalSum: bigint('daily_withdrawal_sum', { mode: 'number' }).notNull().default(0),
    /** Ostatnia data (UTC) kiedy gildia wypowiedziała wojnę. 1 deklaracja/dzień. */
    lastWarDeclaredDate: varchar('last_war_declared_date', { length: 10 }).notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    nameIdx: uniqueIndex('guilds_name_unique').on(t.name),
    tagIdx: uniqueIndex('guilds_tag_unique').on(t.tag),
    gloryIdx: index('guilds_glory_idx').on(t.glory),
    browseIdx: index('guilds_browse_idx').on(t.isOpen, t.requiredLvl),
  }),
);

// Członkostwo + rola. PK (guildId, characterId), unique na characterId
// egzekwuje 1-gildia-per-postać. ON DELETE CASCADE — gdy postać kasowana,
// członkostwo znika (ale gildia już została przekazana innemu liderowi via
// FK RESTRICT na leaderCharId).
export const guildMembers = pgTable(
  'guild_members',
  {
    guildId: uuid('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    rank: guildRankEnum('rank').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    contributedGold: bigint('contributed_gold', { mode: 'number' }).notNull().default(0),
    contributedGems: integer('contributed_gems').notNull().default(0),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.guildId, t.characterId] }),
    charUnique: uniqueIndex('guild_members_char_unique').on(t.characterId),
    rankIdx: index('guild_members_rank_idx').on(t.guildId, t.rank),
  }),
);

// Chat — append-only. authorCharId SET NULL żeby wiadomości nie znikały po
// wyjściu członka (historia czytelna). authorName + authorCls snapshotowane.
export const guildChatMessages = pgTable(
  'guild_chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    authorCharId: uuid('author_char_id').references(() => characters.id, {
      onDelete: 'set null',
    }),
    authorName: varchar('author_name', { length: 20 }).notNull(),
    authorCls: characterClassEnum('author_cls').notNull(),
    body: varchar('body', { length: 500 }).notNull(),
    /** 'chat' | 'system' (auto-msg: dołączenie, wojna, etc.) */
    kind: varchar('kind', { length: 16 }).notNull().default('chat'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    guildCreatedIdx: index('guild_chat_guild_created_idx').on(t.guildId, t.createdAt),
  }),
);

// Zaproszenia dwukierunkowe — invite (guild→player) LUB apply (player→guild).
// Wygasają po 7 dniach (expiresAt). PK (guildId, characterId) — blokuje
// duplikaty (player może mieć max 1 invite/apply per gildia).
export const guildInvites = pgTable(
  'guild_invites',
  {
    guildId: uuid('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    /** 'invite' = guild → player; 'apply' = player → guild */
    direction: varchar('direction', { length: 8 }).notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.guildId, t.characterId] }),
    charExpiryIdx: index('guild_invites_char_expiry_idx').on(t.characterId, t.expiresAt),
  }),
);

// Phase 2 — Skarbiec, budynki.

// Static catalog budynków. Seedowany z TS array (game/guild-buildings.ts).
// costCurve = array per-level (index 0 = L1 cost). buffSpec jsonb zależy od
// kind: altar -> {atkPct,magPct,defPct}, fortress -> {memberCapBonus},
// vault -> {withdrawCapPct extra}.
export const guildBuildingTemplates = pgTable('guild_building_templates', {
  slug: varchar('slug', { length: 32 }).primaryKey(),
  name: varchar('name', { length: 80 }).notNull(),
  icon: varchar('icon', { length: 64 }).notNull(),
  maxLevel: smallint('max_level').notNull(),
  costCurve: jsonb('cost_curve').notNull(),
  buffSpec: jsonb('buff_spec').notNull(),
});

// Per-gildia levele budynków. PK (guildId, slug). Brak wiersza = level 0.
export const guildBuildings = pgTable(
  'guild_buildings',
  {
    guildId: uuid('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    slug: varchar('slug', { length: 32 }).notNull(),
    level: smallint('level').notNull().default(0),
    upgradedAt: timestamp('upgraded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.guildId, t.slug] }),
  }),
);

// Phase 3 — Wojny gildii (S&F gauntlet).
//
// Flow: officer/leader declare wojny → server tworzy scheduled row z
// scheduledAt = now + 24h. Oba strony committują członków (max 15/side).
// Lider/oficer reorderuje commited participants (orderIndex 0..14).
// Scheduler (setInterval 60s) resolve'uje po scheduledAt: gauntlet S&F
// z carryover HP, log jsonb, winner zyskuje glory + gold, log zostaje.

export const guildWars = pgTable(
  'guild_wars',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    attackerGuildId: uuid('attacker_guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    defenderGuildId: uuid('defender_guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    /** 'scheduled' (oczekuje), 'resolving' (cron przejął), 'resolved', 'cancelled' (forfeit). */
    status: varchar('status', { length: 16 }).notNull().default('scheduled'),
    /** Unix ms — kiedy cron zacznie rozwiązywać wojnę. */
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    winnerGuildId: uuid('winner_guild_id').references(() => guilds.id, {
      onDelete: 'set null',
    }),
    /** Liczba wygranych duelów attacker'a (0..15). */
    attackerScore: smallint('attacker_score').notNull().default(0),
    defenderScore: smallint('defender_score').notNull().default(0),
    /** Chwała zwycięzcy (+25 default). Loser traci połowę (floor 0). */
    gloryDelta: integer('glory_delta').notNull().default(0),
    /** Nagroda finansowa — transferowana ze przegrywającego do zwycięzcy. */
    goldPrize: bigint('gold_prize', { mode: 'number' }).notNull().default(0),
    /** Per-runda log gauntletu (jsonb array). */
    log: jsonb('log'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    attackerCreatedIdx: index('guild_wars_attacker_created_idx').on(
      t.attackerGuildId,
      t.createdAt,
    ),
    defenderCreatedIdx: index('guild_wars_defender_created_idx').on(
      t.defenderGuildId,
      t.createdAt,
    ),
    statusSchedIdx: index('guild_wars_status_sched_idx').on(t.status, t.scheduledAt),
  }),
);

export const guildWarParticipants = pgTable(
  'guild_war_participants',
  {
    warId: uuid('war_id')
      .notNull()
      .references(() => guildWars.id, { onDelete: 'cascade' }),
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    /** 'attacker' | 'defender' */
    side: varchar('side', { length: 8 }).notNull(),
    /** 0..14 — kolejność w gauntlet'cie. 99 = niedostosowany (fallback append). */
    orderIndex: smallint('order_index').notNull().default(99),
    /** Snapshot CombatFighter przy commit (z guild buffs wciskniętymi). */
    snapshot: jsonb('snapshot').notNull(),
    /** Wypełnione przez resolver — czy fighter odniósł zwycięstwo w swoim duelu. */
    wonDuel: boolean('won_duel'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.warId, t.characterId] }),
    warSideOrderIdx: index('guild_war_participants_war_side_order_idx').on(
      t.warId,
      t.side,
      t.orderIndex,
    ),
  }),
);

// Phase 4 — Rajdy continuous S&F.
//
// Continuous loop: każda gildia ma zawsze max 1 aktywnego bossa (status=active).
// Członkowie mają 3 hity/dzień/osoba. Po zabiciu — status=killed, spawn next
// tier row automatycznie, reward proportional do contributions.

// Pula bossów seedowana z TS (game/guild-raids.ts). 5 template'ów, rotation
// przez (tier - 1) % 5. HP skalowany: template.baseHp * (1 + (tier-1)*0.3).
export const guildRaidBossTemplates = pgTable('guild_raid_boss_templates', {
  slug: varchar('slug', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 80 }).notNull(),
  icon: varchar('icon', { length: 64 }).notNull(),
  baseHp: integer('base_hp').notNull(),
  flavor: varchar('flavor', { length: 200 }).notNull().default(''),
  /** Kolejność w rotacji (0..4). (tier-1) % 5 mapuje do templatu. */
  rotationIndex: smallint('rotation_index').notNull(),
});

// Per-guild boss rows. Max 1 active per guild (status='active'). Po killu,
// status→'killed', natychmiast insert'owany nowy row z tier+1.
export const guildRaidBosses = pgTable(
  'guild_raid_bosses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    /** Rośnie nieskończenie (1, 2, 3, ...). Rotation przez (tier-1) % 5. */
    tier: integer('tier').notNull(),
    bossSlug: varchar('boss_slug', { length: 64 }).notNull(),
    hpMax: integer('hp_max').notNull(),
    hpCurrent: integer('hp_current').notNull(),
    /** 'active' | 'killed' */
    status: varchar('status', { length: 16 }).notNull().default('active'),
    killingBlowCharId: uuid('killing_blow_char_id').references(
      () => characters.id,
      { onDelete: 'set null' },
    ),
    spawnedAt: timestamp('spawned_at', { withTimezone: true }).notNull().defaultNow(),
    killedAt: timestamp('killed_at', { withTimezone: true }),
  },
  (t) => ({
    guildStatusIdx: index('guild_raid_bosses_guild_status_idx').on(t.guildId, t.status),
    guildTierIdx: index('guild_raid_bosses_guild_tier_idx').on(t.guildId, t.tier),
  }),
);

// World boss — single boss serwer-wide. Status='active' chroniony przez
// partial unique index w migracji 0061: tylko jeden active w jednym czasie.
// Killing blow → status='killed', natychmiast insert next tier (continuous).
export const worldBosses = pgTable(
  'world_bosses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Nieskończony scaling. Rotation slug przez (tier-1) % 5. */
    tier: integer('tier').notNull(),
    bossSlug: varchar('boss_slug', { length: 64 }).notNull(),
    hpMax: integer('hp_max').notNull(),
    hpCurrent: integer('hp_current').notNull(),
    /** 'active' | 'killed' */
    status: varchar('status', { length: 16 }).notNull().default('active'),
    killingBlowCharId: uuid('killing_blow_char_id').references(
      () => characters.id,
      { onDelete: 'set null' },
    ),
    spawnedAt: timestamp('spawned_at', { withTimezone: true }).notNull().defaultNow(),
    killedAt: timestamp('killed_at', { withTimezone: true }),
  },
  (t) => ({
    tierIdx: index('world_bosses_tier_idx').on(t.tier),
  }),
);

// Log hit'ów per boss. Używany do leaderboard'u i tier reward distribution.
export const worldBossHits = pgTable(
  'world_boss_hits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bossId: uuid('boss_id')
      .notNull()
      .references(() => worldBosses.id, { onDelete: 'cascade' }),
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    dmg: integer('dmg').notNull(),
    /** Faza HP w momencie hit'a (1/2/3). Phase 1 = >66% HP, 2 = 33-66%, 3 = <33%. */
    phase: smallint('phase').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    bossDmgIdx: index('world_boss_hits_boss_dmg_idx').on(t.bossId, t.dmg),
    charIdx: index('world_boss_hits_char_idx').on(t.characterId, t.createdAt),
  }),
);

// Log wszystkich hit'ów. Używane do leaderboard'u + split reward'a po killu.
export const guildRaidHits = pgTable(
  'guild_raid_hits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bossId: uuid('boss_id')
      .notNull()
      .references(() => guildRaidBosses.id, { onDelete: 'cascade' }),
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    dmg: integer('dmg').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    bossDmgIdx: index('guild_raid_hits_boss_dmg_idx').on(t.bossId, t.dmg),
    charIdx: index('guild_raid_hits_char_idx').on(t.characterId, t.createdAt),
  }),
);

// Audit log skarbca — immutable. Deposit/withdraw/building_upgrade każda
// akcja wpływająca na treasury ma tu wiersz. goldDelta/gemsDelta signed
// (ujemne = wypłata/koszt).
export const guildTreasuryLogs = pgTable(
  'guild_treasury_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    actorCharId: uuid('actor_char_id').references(() => characters.id, {
      onDelete: 'set null',
    }),
    actorName: varchar('actor_name', { length: 20 }).notNull(),
    /** 'deposit' | 'withdraw' | 'building_upgrade' | 'war_reward' | 'raid_reward' */
    kind: varchar('kind', { length: 20 }).notNull(),
    goldDelta: bigint('gold_delta', { mode: 'number' }).notNull(),
    gemsDelta: integer('gems_delta').notNull(),
    memo: varchar('memo', { length: 128 }).notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    guildCreatedIdx: index('guild_treasury_logs_guild_created_idx').on(
      t.guildId,
      t.createdAt,
    ),
  }),
);

// ========== Chronicle events (Kroniki Szczurogrodu) ==========
// Eventy prawdziwych graczy, które zasilają feed "KRONIKI" na ekranie Miasta.
// Kind-specific payload jest renderowany w `game/chronicle.ts::renderChronicleEvent`.
// Dedup unikatem (character_id, dedup_key) — ten sam boss/drop/milestone nie
// trafia dwa razy. Retention: router zwraca ORDER BY created_at DESC LIMIT N.
export const chronicleEvents = pgTable(
  'chronicle_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    kind: varchar('kind', { length: 32 }).notNull(),
    payload: jsonb('payload').$type<ChroniclePayload>().notNull(),
    dedupKey: varchar('dedup_key', { length: 128 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    dedupIdx: uniqueIndex('chronicle_events_dedup_unique').on(t.characterId, t.dedupKey),
    createdIdx: index('chronicle_events_created_idx').on(t.createdAt),
  }),
);

// ========== Town chronicles (Claude-generated flavor NPC) ==========
// Batch ~20 per dzień UTC, globalny (bez klasy). Losowo wybierany w
// `game/town-chronicle.ts::pickChronicle`. Wzorzec 1:1 z `town_flavors` minus
// wymiar klasy — kroniki widzą wszyscy gracze jednakowe.
export const townChronicles = pgTable(
  'town_chronicles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    generatedDate: varchar('generated_date', { length: 10 }).notNull(), // ISO YYYY-MM-DD (UTC)
    textPl: text('text_pl').notNull(),
    textEn: text('text_en'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    dateTextIdx: uniqueIndex('town_chronicles_date_text_unique').on(t.generatedDate, t.textPl),
  }),
);

// ========== Regions (mapa świata) ==========
// Obecnie 1 region (Okolice Szczurogrodu); kolejne będą dodawane gdy content
// przekroczy ~15 lochów. Mapa renderowana per-region w ScreenWorldMap.
export const regions = pgTable('regions', {
  slug: varchar('slug', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  sortOrder: smallint('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ========== Dungeons ==========
// Każdy loch grupuje N mobów (przez `dungeon_mobs`) + jednego bossa
// (`boss_enemy_slug`). Unlock: requiredLvl (twardy) + prerequisiteDungeonSlug
// (miękki, jeśli ustawiony — gracz musi mieć clear poprzedniego bossa w
// `character_dungeon_clears`). `mapX`/`mapY` to pozycja w 0..1000 na SVG
// danego regionu (resize'owalne) — klient skaluje do aktualnego viewBoxa.
export const dungeons = pgTable('dungeons', {
  slug: varchar('slug', { length: 64 }).primaryKey(),
  regionSlug: varchar('region_slug', { length: 64 })
    .notNull()
    .references(() => regions.slug, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  desc: text('desc').notNull(),
  requiredLvl: integer('required_lvl').notNull().default(1),
  /** Nullable — pierwszy loch regionu nie ma poprzednika. */
  prerequisiteDungeonSlug: varchar('prerequisite_dungeon_slug', { length: 64 }),
  /** Boss który kończy ten loch. Wymagany (choć może wskazywać na TBD placeholder). */
  bossEnemySlug: varchar('boss_enemy_slug', { length: 64 }).notNull(),
  /** Pozycja na SVG: 0..1000 × 0..1000. Klient interpoluje do viewBoxa. */
  mapX: smallint('map_x').notNull().default(500),
  mapY: smallint('map_y').notNull().default(500),
  sortOrder: smallint('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ========== Dungeon mobs (junction) ==========
// Które moby należą do którego lochu. Boss jest OSOBNO w `dungeons.boss_enemy_slug`
// — tutaj trzymamy tylko "regular" mobki. Ten sam mob może być w wielu lochach
// (gdyby kiedyś zaszła potrzeba; schema na to pozwala, ale w praktyce unikamy).
export const dungeonMobs = pgTable(
  'dungeon_mobs',
  {
    dungeonSlug: varchar('dungeon_slug', { length: 64 })
      .notNull()
      .references(() => dungeons.slug, { onDelete: 'cascade' }),
    enemySlug: varchar('enemy_slug', { length: 64 })
      .notNull()
      .references(() => enemyTemplates.slug, { onDelete: 'cascade' }),
    sortOrder: smallint('sort_order').notNull().default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.dungeonSlug, t.enemySlug] }),
  }),
);

// ========== Dungeon boss unique drops ==========
// Odpowiednik `boss_unique_drops` ale dla dungeon-bossów (klucz: enemy slug
// zamiast quest id). Każdy z 3 bossów ma po 1 unikalnym dropie per klasa
// (warrior/mage/rogue). Rolowane w `combat.applyVictoryReward` gdy zabity
// mob jest bossem któregoś z `dungeons.boss_enemy_slug`.
export const dungeonBossDrops = pgTable(
  'dungeon_boss_drops',
  {
    bossEnemySlug: varchar('boss_enemy_slug', { length: 64 })
      .notNull()
      .references(() => enemyTemplates.slug, { onDelete: 'cascade' }),
    cls: characterClassEnum('cls').notNull(),
    itemTemplateId: varchar('item_template_id', { length: 64 })
      .notNull()
      .references(() => itemTemplates.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.bossEnemySlug, t.cls] }),
  }),
);

// ========== Character dungeon clears ==========
// Wpis = ten gracz pokonał bossa tego lochu = loch "clear". Wpis jest
// warunkiem odblokowania kolejnego lochu, którego `prerequisite_dungeon_slug`
// wskazuje na ten slug. Idempotentne przez PK — re-kill bossa nie duplikuje.
export const characterDungeonClears = pgTable(
  'character_dungeon_clears',
  {
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    dungeonSlug: varchar('dungeon_slug', { length: 64 })
      .notNull()
      .references(() => dungeons.slug, { onDelete: 'cascade' }),
    clearedAt: timestamp('cleared_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.characterId, t.dungeonSlug] }),
  }),
);

// ========== Wieża Bezdenna (Priorytet 4) ==========
//
// Endless dungeon: gracz wchodzi, walczy z losowym skalowanym bossem. Win →
// floor++. Loss → `failed_at` timestamp + 15min cooldown (bypass za 5 gemów).
// Reset tygodniowy (UTC monday): `week_start` string "yyyy-mm-dd", przy
// zmianie — `current_floor` resetuje do 1, `best_floor_this_week` zachowuje
// rekord z poprzedniego tygodnia do leaderboardu.
//
// Leaderboard: query top-N z `tower_progress where week_start = current`
// order by `best_floor_this_week DESC`.
export const towerProgress = pgTable('tower_progress', {
  characterId: uuid('character_id')
    .primaryKey()
    .references(() => characters.id, { onDelete: 'cascade' }),
  /** Bieżące piętro (1 = start, przegrana NIE zmniejsza). */
  currentFloor: integer('current_floor').notNull().default(1),
  /** Najwyższe zdobyte piętro w tym tygodniu — dla leaderboardu. */
  bestFloorThisWeek: integer('best_floor_this_week').notNull().default(0),
  /** ISO date poniedziałku tygodnia (UTC). Używane do weekly reset detection. */
  weekStart: varchar('week_start', { length: 10 }).notNull().default(''),
  /** Gdy gracz padł — cooldown 15 min albo gem resurrection. NULL = ready. */
  failedAt: timestamp('failed_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ========== Scrapbook (kolekcja znalezionych itemów) ==========
// Każdy item zdropowany/kupiony/otrzymany przez gracza trafia tu RAZ. Unique
// pair (characterId, itemTemplateId). Procent wypełnienia nadaje permanentne
// buffy (XP/gold/damage/drop) — aplikowane w arena.fight + guildRaids.hit.
//
// Insert pattern: ON CONFLICT DO NOTHING wszędzie gdzie grantujemy items.
// Nie wymazujemy entry gdy gracz sprzeda item — raz znaleziony, na zawsze w albumie.
export const characterScrapbook = pgTable(
  'character_scrapbook',
  {
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    itemTemplateId: varchar('item_template_id', { length: 64 })
      .notNull()
      .references(() => itemTemplates.id, { onDelete: 'cascade' }),
    foundAt: timestamp('found_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.characterId, t.itemTemplateId] }),
    charIdx: index('character_scrapbook_char_idx').on(t.characterId),
  }),
);

// ========== Achievements ==========
// Templates: statyczny katalog (seed'owany w migracji). Każde osiągnięcie ma
// `threshold` — liczbę potrzebną do odblokowania — i opcjonalne rewardy
// (gold/gems). `category` grupuje do zakładek w UI. `tier` nadaje wizualny
// prestige (bronze→legendary) osobno od progresji LVL.
export const achievementTemplates = pgTable('achievement_templates', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  desc: text('desc').notNull(),
  icon: varchar('icon', { length: 64 }).notNull(),
  /** 'bronze' | 'silver' | 'gold' | 'legendary' — wizualny tier, nie powiązany z progresją. */
  tier: varchar('tier', { length: 16 }).notNull(),
  /** 'combat' | 'loot' | 'progression' | 'economy' — grupa do zakładek. */
  category: varchar('category', { length: 32 }).notNull(),
  /** Progress wymagany do odblokowania (1 = flag, >1 = counter). */
  threshold: integer('threshold').notNull(),
  rewardGold: integer('reward_gold').notNull().default(0),
  rewardGems: integer('reward_gems').notNull().default(0),
  sortOrder: smallint('sort_order').notNull().default(0),
});

// Per-player progress. Wpis powstaje przy pierwszym bump'ie; `unlockedAt`
// null = in progress, not null = odblokowane i reward wydany.
export const characterAchievements = pgTable(
  'character_achievements',
  {
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    achievementId: varchar('achievement_id', { length: 64 })
      .notNull()
      .references(() => achievementTemplates.id, { onDelete: 'cascade' }),
    progress: integer('progress').notNull().default(0),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.characterId, t.achievementId] }),
  }),
);

// ========== Town flavor texts ==========
// One-liner quips shown on the town screen when a character enters. Claude
// generates a batch of ~25 per class per day on first request; subsequent
// requests pick one at random. See `game/town-flavor.ts` for generation logic.
export const townFlavors = pgTable(
  'town_flavors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    generatedDate: varchar('generated_date', { length: 10 }).notNull(), // ISO YYYY-MM-DD (UTC)
    cls: characterClassEnum('cls').notNull(),
    textPl: text('text_pl').notNull(),
    // Nullable bo migracja 0066 nie backfilluje starych rekordów (klucz =
    // (date, cls), więc dzisiejszy batch w trakcie pierwszej deploya będzie
    // PL-only — fallback w pickFlavor kieruje EN'em na PL gdy NULL).
    textEn: text('text_en'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    dateClsIdx: uniqueIndex('town_flavors_date_cls_text_unique').on(
      t.generatedDate,
      t.cls,
      t.textPl,
    ),
  }),
);

// ========== Premium currency purchases ==========
// Idempotent ledger of every gem purchase from any payment platform.
// Mobile (Capacitor) → Google Play; web has no payment surface today.
//
// `(platform, transactionId)` is the idempotency key — UNIQUE constraint
// prevents double-credit if the verify endpoint is called twice (network
// retry, app reopens with pending purchase, etc.). The first INSERT wins;
// the second hits the constraint and the server treats it as a benign
// replay.
export const gemPurchases = pgTable(
  'gem_purchases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    platform: varchar('platform', { length: 16 }).notNull(),
    productId: varchar('product_id', { length: 64 }).notNull(),
    transactionId: varchar('transaction_id', { length: 1024 }).notNull(),
    status: varchar('status', { length: 16 }).notNull().default('pending'),
    gemsGranted: integer('gems_granted').notNull().default(0),
    amountMicros: bigint('amount_micros', { mode: 'number' }),
    currency: varchar('currency', { length: 8 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    platformTxIdx: uniqueIndex('gem_purchases_platform_tx_unique').on(
      t.platform,
      t.transactionId,
    ),
    characterIdx: index('gem_purchases_character_idx').on(t.characterId, t.createdAt),
  }),
);

// ========== Survivor (Szczurogród: Okruchy) ==========
// Spinoff survival rougelike. Shares `users` (single account spans both
// games) but has independent progression: own currency (`okruchy`), own
// stage unlocks, own skill tree. No FK to `characters` — survivor app does
// not require a Szczurogród character to play.

export const survivorRunStatusEnum = pgEnum('survivor_run_status', [
  'active',
  'won',
  'lost',
  'rejected',
]);

/** Per-attempt audit row. Inserted by `survivor.startRun` (status `active`),
 * updated to `won/lost/rejected` by `finishRun`. `seed` lets us replay a run
 * deterministically if anti-cheat ever needs it. */
export const survivorRuns = pgTable(
  'survivor_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    stageId: integer('stage_id').notNull(),
    seed: bigint('seed', { mode: 'number' }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    durationMs: integer('duration_ms'),
    kills: integer('kills'),
    bossKilled: boolean('boss_killed').notNull().default(false),
    okruchyEarned: integer('okruchy_earned').notNull().default(0),
    status: survivorRunStatusEnum('status').notNull().default('active'),
  },
  (t) => ({
    userIdx: index('survivor_runs_user_idx').on(t.userId, t.startedAt),
  }),
);

/** Per-user meta progression. One row per user (PK = userId). Lazily inserted
 * on first `getHub` if missing — never deleted (cascades from users). */
export const survivorMeta = pgTable('survivor_meta', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  okruchy: integer('okruchy').notNull().default(0),
  maxStageUnlocked: integer('max_stage_unlocked').notNull().default(1),
  totalRuns: integer('total_runs').notNull().default(0),
  totalKills: integer('total_kills').notNull().default(0),
  /** map of stageId -> bestDurationMs (boss-killed runs only). */
  bestDurationMsByStage: jsonb('best_duration_ms_by_stage').notNull().default({}),
  /** Cross-game XP progression bar fill — okruchy z runów dolewają tu, po
   * przekroczeniu IDLE_XP_BAR_THRESHOLD generowany jest pending grant
   * w `survivor_idle_xp_grants`. Reset do 0 (z carryover'em remaindera)
   * przy każdym wygenerowanym grant'cie. Bar rośnie tylko gdy user ma
   * character'a w idle (w przeciwnym razie progress nie ma gdzie iść). */
  idleXpProgress: integer('idle_xp_progress').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Pending XP grants generated z runów Okruchów. Czekają na claim po stronie
 * idle game'a — `survivor.claimIdleXp` znajduje wszystkie pending dla usera,
 * sumuje xpAmount, aplikuje przez applyXpGain do characters w jednej
 * transakcji, i markuje claimed_at = now(). xp_amount jest snapshot'em
 * obliczonym w momencie generowania (`survivorXpPackageAmount(idleLvl)`),
 * więc reward nie zmienia się jeśli gracz urośnie zanim claimnie. */
export const survivorIdleXpGrants = pgTable(
  'survivor_idle_xp_grants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    xpAmount: integer('xp_amount').notNull(),
    generatedAt: timestamp('generated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    claimedAt: timestamp('claimed_at', { withTimezone: true }),
  },
  (t) => ({
    pendingIdx: index('survivor_idle_xp_grants_pending_idx').on(t.userId, t.generatedAt),
  }),
);

/** Skill tree progression — composite PK (userId, nodeId). Server validates
 * `level <= maxLevel(nodeId)` and consumes okruchy on `unlockSkill`. */
export const survivorSkillProgression = pgTable(
  'survivor_skill_progression',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    nodeId: varchar('node_id', { length: 64 }).notNull(),
    level: integer('level').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.nodeId] }),
  }),
);

// ========== Patch log ==========
// Lista wersji/changelog'ów wystawiana graczom. Polling co kilka minut z
// klienta wykrywa nowy wpis i pokazuje banner „Pojawiła się aktualizacja —
// odśwież stronę". Pisanie: skrypt `scripts/add-patch.ts` (wymaga
// PROD_DATABASE_URL env). Brak admin endpointu w API — patch log nie jest
// edytowany przez gracza ani przez UI w grze.

export const patches = pgTable(
  'patches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Semver albo dowolna etykieta. Pokazywana w UI obok tytułu. */
    version: varchar('version', { length: 64 }).notNull(),
    titlePl: varchar('title_pl', { length: 255 }).notNull(),
    /** Markdown / plain text PL. Renderujemy paragrafami. */
    bodyPl: text('body_pl').notNull(),
    titleEn: varchar('title_en', { length: 255 }).notNull(),
    /** Markdown / plain text EN. */
    bodyEn: text('body_en').notNull(),
    releasedAt: timestamp('released_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    releasedIdx: index('patches_released_idx').on(t.releasedAt),
  }),
);

// Helper to avoid unused-import warning for state string literal type while keeping the
// enum<->TS union aligned. Phantom cast exported for tests.
export type StoredQuestState = QuestState;

// ========== Relations ==========
export const usersRelations = relations(users, ({ one, many }) => ({
  character: one(characters, { fields: [users.id], references: [characters.userId] }),
  refreshTokens: many(refreshTokens),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, { fields: [characters.userId], references: [users.id] }),
  quests: many(characterQuests),
  dailyClaims: many(dailyClaims),
  items: many(characterItems),
  companion: one(characterCompanions, {
    fields: [characters.id],
    references: [characterCompanions.characterId],
  }),
}));

export const characterCompanionsRelations = relations(characterCompanions, ({ one }) => ({
  character: one(characters, {
    fields: [characterCompanions.characterId],
    references: [characters.id],
  }),
}));

export const characterItemsRelations = relations(characterItems, ({ one }) => ({
  character: one(characters, {
    fields: [characterItems.characterId],
    references: [characters.id],
  }),
}));

export const characterQuestsRelations = relations(characterQuests, ({ one }) => ({
  character: one(characters, {
    fields: [characterQuests.characterId],
    references: [characters.id],
  }),
}));
