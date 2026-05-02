import { z } from 'zod';

// ========== Primitives ==========
export const characterClassSchema = z.enum(['warrior', 'mage', 'rogue']);

export const appearanceSchema = z.object({
  skin: z.enum(['pale', 'medium', 'tan', 'dark', 'green']),
  hairStyle: z.enum(['bald', 'short', 'messy', 'long', 'mohawk', 'ponytail']),
  hairColor: z.enum(['black', 'brown', 'blond', 'red', 'white', 'purple']),
  beardStyle: z.enum(['none', 'stubble', 'full', 'goatee']),
  eyes: z.enum(['normal', 'angry', 'sleepy', 'glow']),
  eyeColor: z.enum(['brown', 'blue', 'green', 'yellow', 'red']),
  mouth: z.enum(['neutral', 'smirk', 'grin', 'grim']),
  accessory: z.enum(['none', 'scar', 'eyepatch', 'monocle', 'mask']),
  headwear: z.enum([
    'auto',
    'none',
    'helmet',
    'wizardHat',
    'hood',
    'crown',
    'bandana',
    'dragonHelm',
    'lichCrown',
    'valkyrieHelm',
    'archmageHat',
    'shadowVeil',
    'goldenLaurel',
    'hornedHelm',
  ]),
  armor: z.enum(['plain', 'plate', 'scale', 'arcane', 'bone', 'dragon']).default('plain'),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Accent color must be #rrggbb hex'),
  unlockedCosmetics: z.array(z.string()).default([]),
});

// ========== Auth ==========
export const registerInputSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(5).max(200),
});

export const loginInputSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
});

/** Guest → registered account upgrade. Wymaga aktywnej guest sesji
 *  (protectedProcedure). Zachowuje wszystkie character/progress data,
 *  tylko dopina email + hasło i zdejmuje flagę guest. */
export const linkAccountInputSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(5).max(200),
});

export const guestInputSchema = z.object({});

export const deleteAccountInputSchema = z.object({
  password: z.string().max(200).optional(),
  confirm: z.literal('USUŃ'),
});

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  userId: z.string().uuid(),
  email: z.string().nullable(),
  isGuest: z.boolean(),
  hasCharacter: z.boolean(),
});

// ========== Character creation ==========
export const starterBonusSchema = z.enum(['gold', 'gems', 'potion', 'scroll']);

export const createCharacterInputSchema = z.object({
  cls: characterClassSchema,
  name: z.string().trim().min(1).max(20),
  appearance: appearanceSchema,
  bonus: starterBonusSchema,
});

// ========== Appearance update ==========
export const updateAppearanceInputSchema = z.object({
  appearance: appearanceSchema,
});

// ========== Chapters ==========
export const chapterIdSchema = z.enum(['akt-1', 'akt-2', 'akt-3', 'akt-4', 'akt-5', 'akt-6']);
export type ChapterId = z.infer<typeof chapterIdSchema>;

// ========== Level-up ==========
export const chapterUnlockSchema = z.object({
  id: chapterIdSchema,
  name: z.string(),
  subtitle: z.string(),
  flavor: z.string(),
});

export const levelUpInfoSchema = z.object({
  fromLevel: z.number().int(),
  toLevel: z.number().int(),
  hpGain: z.number().int(),
  mpGain: z.number().int(),
  staminaGain: z.number().int(),
  newXpMax: z.number().int(),
  chapterUnlock: chapterUnlockSchema.nullable(),
});
export type ChapterUnlock = z.infer<typeof chapterUnlockSchema>;
export type LevelUpInfo = z.infer<typeof levelUpInfoSchema>;

// ========== Quest intents ==========
export const questIdSchema = z.string().min(1).max(64);

export const startQuestInputSchema = z.object({ questId: questIdSchema });
export const collectQuestInputSchema = z.object({ questId: questIdSchema });
export const skipQuestInputSchema = z.object({ questId: questIdSchema });

// ========== Achievements — unlock payload (musi być przed combat*ResultSchema) ==========
/**
 * Lekki payload zwracany w odpowiedziach mutacji gdy bump podczas akcji
 * odblokował osiągnięcie. Klient kolejkuje modale po stronie `useUnlockQueue`.
 */
export const achievementUnlockPayloadSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  tier: z.enum(['bronze', 'silver', 'gold', 'legendary']),
  rewardGold: z.number().int().min(0),
  rewardGems: z.number().int().min(0),
});
export type AchievementUnlockPayload = z.infer<typeof achievementUnlockPayloadSchema>;

// ========== Combat intents ==========
export const combatEngageInputSchema = z.object({
  enemySlug: z.string().min(1).max(64),
  // Tryb seryjny — pomiń per-mob cooldown. Daily limit i koszt klucza nadal
  // egzekwowane. Cooldown to UX gate (anti-spam), nie anti-cheat — daily cap
  // zostaje twardym murem przeciw farmingowi.
  bypassCooldown: z.boolean().optional(),
});

export const combatAttackInputSchema = z.object({
  combatId: z.string().uuid(),
  kind: z.enum(['norm', 'heavy', 'magic']),
});

export const combatHealInputSchema = z.object({
  combatId: z.string().uuid(),
  /** Which potion to drink. Must be in the character's bag, slot='potion', qty > 0. */
  itemId: z.string().uuid(),
});

/** Leaving a combat session mid-fight (or acknowledging victory/defeat). */
export const combatEndInputSchema = z.object({
  combatId: z.string().uuid(),
});

// ========== Enemy abilities + status effects ==========
/**
 * Procowe mechaniki mobów stosowane w `rollEnemyAttack`. Discriminated union;
 * seeded per-slug w migracji 0017. `chance` to prawdopodobieństwo procu
 * (0..1). Dla `magic` i `armor_pierce` proc oznacza "ten atak ignoruje 50%
 * DEF gracza"; dla `poison` aplikuje DOT na gracza.
 */
export const enemyAbilitySchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('magic'), chance: z.number().min(0).max(1) }),
  z.object({
    kind: z.literal('poison'),
    chance: z.number().min(0).max(1),
    dmgPerTurn: z.number().int().min(1),
    turns: z.number().int().min(1),
  }),
  z.object({ kind: z.literal('armor_pierce'), chance: z.number().min(0).max(1) }),
]);
export type EnemyAbility = z.infer<typeof enemyAbilitySchema>;
export type EnemyAbilityKind = EnemyAbility['kind'];

/** Aktywny efekt nałożony na gracza (obecnie tylko poison). */
export const statusEffectSchema = z.object({
  kind: z.literal('poison'),
  dmgPerTurn: z.number().int().min(1),
  turnsRemaining: z.number().int().min(0),
});
export type StatusEffect = z.infer<typeof statusEffectSchema>;

export const combatStateSchema = z.object({
  combatId: z.string().uuid(),
  enemySlug: z.string(),
  enemyName: z.string(),
  enemyLvl: z.number().int(),
  enemyHp: z.number().int(),
  enemyHpMax: z.number().int(),
  enemyGold: z.number().int(),
  enemyXp: z.number().int(),
  /** Enemy armor, exposed so the client can preview post-reduction dmg ranges. */
  enemyDef: z.number().int(),
  playerHp: z.number().int(),
  playerHpMax: z.number().int(),
  playerMp: z.number().int(),
  playerMpMax: z.number().int(),
  /** Effective stats post-equip + companion buffs — used by client damage preview. */
  playerAtk: z.number().int(),
  playerMag: z.number().int(),
  playerSpd: z.number().int(),
  playerDef: z.number().int(),
  /** Turns remaining until MOCNY is usable again (0 = ready). */
  heavyCooldown: z.number().int().min(0),
  /** True when engage consumed an active trop — rewards doubled on victory. */
  trackBonus: z.boolean(),
  /** Active DOTs / debuffs on the player. Empty if clean. */
  playerStatus: z.array(statusEffectSchema),
  status: z.enum(['fight', 'victory', 'defeat']),
});

export const combatLootSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  icon: z.string(),
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']),
});
export type CombatLoot = z.infer<typeof combatLootSchema>;

/**
 * Payload dołączany do turn/heal result gdy walka toczy się w Wieży Bezdennej.
 * Dungeon-mode zawsze null. Tower-mode: po zwycięstwie wypełnia `reward` +
 * `newFloor` + `newBestFloor`; po porażce wypełnia `failedUntil`.
 */
export const towerCombatOutcomeSchema = z.object({
  newFloor: z.number().int().min(1),
  newBestFloor: z.number().int().min(0),
  reward: z
    .object({
      gold: z.number().int().min(0),
      gems: z.number().int().min(0),
      isMilestone: z.boolean(),
    })
    .nullable(),
  /** Unix ms cooldownu po padnięciu. null = walka jeszcze się nie skończyła / wygrana. */
  failedUntil: z.number().int().nullable(),
});
export type TowerCombatOutcome = z.infer<typeof towerCombatOutcomeSchema>;

export const combatTurnResultSchema = z.object({
  state: combatStateSchema,
  playerDmg: z.number().int(),
  playerCrit: z.boolean(),
  playerMiss: z.boolean(),
  enemyDmg: z.number().int(),
  enemyDodged: z.boolean(),
  /** Which ability the enemy just used this turn (if any). UI uses it for log + icon. */
  enemyAbility: enemyAbilitySchema.nullable(),
  /** Damage inflicted by existing DOTs at the start of player's turn. 0 if none. */
  playerStatusDmg: z.number().int().min(0),
  reward: z.object({ gold: z.number().int(), xp: z.number().int() }).nullable(),
  /** True when this session is benefitting from an active trop (gold×2 / xp×2 / drop×1.5). */
  trackBonus: z.boolean(),
  levelUp: levelUpInfoSchema.nullable(),
  loot: combatLootSchema.nullable(),
  /** Osiągnięcia odblokowane tą akcją. Pusta gdy nic. */
  unlockedAchievements: z.array(achievementUnlockPayloadSchema).default([]),
  /** Tower-mode meta. null w dungeon-mode; nonnull gdy walka to Wieża. */
  tower: towerCombatOutcomeSchema.nullable(),
});

export const combatHealResultSchema = z.object({
  state: combatStateSchema,
  /** Potion that was consumed — used by the client to animate/log. */
  itemId: z.string().uuid(),
  itemName: z.string(),
  healedHp: z.number().int(),
  healedMp: z.number().int(),
  /** Enemy counter-attack damage after the heal. Healing consumes a turn. */
  enemyDmg: z.number().int(),
  enemyDodged: z.boolean(),
  enemyAbility: enemyAbilitySchema.nullable(),
  playerStatusDmg: z.number().int().min(0),
  unlockedAchievements: z.array(achievementUnlockPayloadSchema).default([]),
  /** Tower-mode meta — porażka ustawia `failedUntil`. Heal nigdy nie wygrywa
   *  więc reward/newFloor są tu zbędne (defeat-only payload). */
  tower: towerCombatOutcomeSchema.nullable(),
});

export type CombatState = z.infer<typeof combatStateSchema>;
export type CombatTurnResult = z.infer<typeof combatTurnResultSchema>;
export type CombatHealResult = z.infer<typeof combatHealResultSchema>;

// ========== Shop ==========
export const shopBuyInputSchema = z.object({
  itemId: z.string().min(1).max(64),
});

// ========== Daily ==========
/** Cap długości streaka — mirror `DAILY_STREAK_CAP` z serwera (game/daily.ts).
 *  28-dniowy kalendarz (Priorytet 5). Jeżeli podbijasz cap, zmień w obu
 *  miejscach + dodaj wpisy do `DAILY_LADDER` / `DAY_REWARDS`. */
export const DAILY_STREAK_CAP = 28;

export const dailyStatusSchema = z.object({
  day: z.number().int().min(1).max(DAILY_STREAK_CAP),
  streak: z.number().int().min(0),
  claimedToday: z.boolean(),
  lastClaimDate: z.string().nullable(),
});

export const dailyClaimResultSchema = z.object({
  day: z.number().int().min(1).max(DAILY_STREAK_CAP),
  streak: z.number().int(),
  gold: z.number().int(),
  xp: z.number().int(),
  /** Bonus dungeon keys granted by this day's row (0 on days without keys). */
  keys: z.number().int().min(0),
  item: z
    .object({
      name: z.string(),
      icon: z.string(),
      rarity: z.enum(['common', 'rare', 'epic', 'legendary']),
    })
    .nullable(),
  unlockedAchievements: z.array(achievementUnlockPayloadSchema).default([]),
});

export type DailyStatus = z.infer<typeof dailyStatusSchema>;
export type DailyClaimResult = z.infer<typeof dailyClaimResultSchema>;

// ========== Praca (długie idle questy, 1..8h) ==========
export const WORK_DURATIONS = [1, 2, 4, 8] as const;
export type WorkDurationHours = (typeof WORK_DURATIONS)[number];

export const workKindSchema = z.object({
  slug: z.string(),
  name: z.string(),
  flavor: z.string(),
});
export type WorkKind = z.infer<typeof workKindSchema>;

export const workOptionSchema = z.object({
  kindSlug: z.string(),
  hours: z.number().int().min(1).max(8),
  goldReward: z.number().int().min(0),
  xpReward: z.number().int().min(0),
});
export type WorkOption = z.infer<typeof workOptionSchema>;

export const workActiveSchema = z.object({
  kind: workKindSchema,
  durationHours: z.number().int().min(1).max(8),
  startedAt: z.number().int(),
  endsAt: z.number().int(),
  /** Czy zakończona — gracz może odebrać. */
  ready: z.boolean(),
  /** Preview pełnej nagrody (gold/xp obliczone serwerowo). */
  reward: z.object({ gold: z.number().int(), xp: z.number().int() }),
  /** Preview częściowej nagrody przy wyjściu teraz (pro-rata po elapsed). */
  partial: z.object({ gold: z.number().int(), xp: z.number().int() }),
});
export type WorkActive = z.infer<typeof workActiveSchema>;

export const workStatusResponseSchema = z.object({
  active: workActiveSchema.nullable(),
  /** Lista dostępnych zleceń + opcji długości. */
  kinds: z.array(workKindSchema),
  options: z.array(workOptionSchema),
});
export type WorkStatusResponse = z.infer<typeof workStatusResponseSchema>;

export const workStartInputSchema = z.object({
  kindSlug: z.string(),
  durationHours: z.number().int().min(1).max(8),
});
export type WorkStartInput = z.infer<typeof workStartInputSchema>;

export const workClaimResponseSchema = z.object({
  gold: z.number().int(),
  xp: z.number().int(),
  /** True jeśli odebrana wcześniej (pro-rata) — UI używa do innego komunikatu. */
  partial: z.boolean(),
  levelUp: levelUpInfoSchema.nullable(),
});
export type WorkClaimResponse = z.infer<typeof workClaimResponseSchema>;

// ========== Trener ==========
export const statKeySchema = z.enum(['atk', 'def', 'mag', 'spd']);

export const trainerQuoteSchema = z.object({
  stats: z.object({
    atk: z.number().int(),
    def: z.number().int(),
    mag: z.number().int(),
    spd: z.number().int(),
  }),
  nextCost: z.object({
    atk: z.number().int(),
    def: z.number().int(),
    mag: z.number().int(),
    spd: z.number().int(),
  }),
  gold: z.number().int(),
});

export const trainerBuyInputSchema = z.object({
  stat: statKeySchema,
});

export type StatKey = z.infer<typeof statKeySchema>;
export type TrainerQuote = z.infer<typeof trainerQuoteSchema>;

// ========== Tavern ==========
export const companionClassSchema = z.enum(['warrior', 'mage', 'rogue']);

export const companionOfferSchema = z.object({
  slug: z.string().min(1).max(64),
  name: z.string(),
  cls: companionClassSchema,
  lvl: z.number().int(),
  price: z.number().int(),
  trait: z.string(),
});

export const activeCompanionSchema = companionOfferSchema.extend({
  hiredAt: z.number().int(),
});

export const hireCompanionInputSchema = z.object({
  slug: z.string().min(1).max(64),
});

export type CompanionOffer = z.infer<typeof companionOfferSchema>;
export type ActiveCompanion = z.infer<typeof activeCompanionSchema>;

// ========== Stajnie (mounts) ==========
export const mountOfferSchema = z.object({
  slug: z.string().min(1).max(64),
  name: z.string(),
  icon: z.string(),
  desc: z.string(),
  /** Procent skrócenia czasu questów (0..80). */
  speedPct: z.number().int().min(0).max(80),
  price: z.number().int().min(0),
  rentalHours: z.number().int().min(1),
  requiredLvl: z.number().int().min(1),
});

export const activeMountSchema = z.object({
  slug: z.string(),
  name: z.string(),
  icon: z.string(),
  speedPct: z.number().int().min(0).max(80),
  /** Unix ms — klient liczy countdown do wygaśnięcia. */
  expiresAt: z.number().int(),
});

export const rentMountInputSchema = z.object({
  slug: z.string().min(1).max(64),
});

export const stablesListResponseSchema = z.object({
  mounts: z.array(mountOfferSchema),
  active: activeMountSchema.nullable(),
  gold: z.number().int().min(0),
  lvl: z.number().int().min(1),
  /**
   * LVL najniższego wierzchowca, którego gracz jeszcze nie może wynająć.
   * `null` = wszystko już dostępne (żaden mount nie ma requiredLvl > char.lvl).
   * Klient pokazuje "Kolejny wierzchowiec po osiągnięciu LVL X".
   */
  nextUnlockLvl: z.number().int().min(1).nullable(),
});

export type MountOffer = z.infer<typeof mountOfferSchema>;
export type ActiveMount = z.infer<typeof activeMountSchema>;
export type RentMountInput = z.infer<typeof rentMountInputSchema>;
export type StablesListResponse = z.infer<typeof stablesListResponseSchema>;

// ========== Inventory ==========
export const itemSlotSchema = z.enum([
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
export const equippedSlotSchema = z.enum([
  'head',
  'neck',
  'chest',
  'weapon',
  'off',
  'hands',
  'ring',
  'feet',
]);
export const raritySchema = z.enum(['common', 'rare', 'epic', 'legendary']);

export const inventoryItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  icon: z.string(),
  slot: itemSlotSchema,
  rarity: raritySchema,
  atk: z.number().int().nullable().optional(),
  def: z.number().int().nullable().optional(),
  mag: z.number().int().nullable().optional(),
  /** Potion heal values. 0 for non-potions; potions always set at least one. */
  hpHeal: z.number().int().min(0),
  mpHeal: z.number().int().min(0),
  desc: z.string().nullable().optional(),
  equippedSlot: equippedSlotSchema.nullable(),
  sellPrice: z.number().int(),
  qty: z.number().int().min(1),
  /** Enhancement level 0..10 (Kowal). Display: "+N". Potions always 0. */
  enhancementLevel: z.number().int().min(0).max(10).default(0),
});

export const itemIdInputSchema = z.object({ itemId: z.string().uuid() });
export const equipItemInputSchema = z.object({
  itemId: z.string().uuid(),
  targetSlot: equippedSlotSchema,
});

export const sellItemResultSchema = z.object({
  gold: z.number().int(),
  price: z.number().int(),
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type ItemSlot = z.infer<typeof itemSlotSchema>;
export type EquippedSlot = z.infer<typeof equippedSlotSchema>;
export type SellItemResult = z.infer<typeof sellItemResultSchema>;

// ========== Tropy (dungeon tracks) ==========
export const trackSchema = z.object({
  slot: z.number().int().min(0).max(2),
  enemySlug: z.string(),
  enemyName: z.string(),
  enemyTier: z.number().int().min(1).max(4),
  /** Unix ms of expiry. Client shows countdown. */
  expiresAt: z.number().int(),
});

export const trackListResponseSchema = z.object({
  tracks: z.array(trackSchema),
  /** Max slots (3) — sent so client doesn't hardcode it. */
  slotsMax: z.number().int().min(1).max(8),
  /** Gem cost for rerolling a single slot. */
  rerollCost: z.number().int().min(0),
  /**
   * Unix millis when the next empty slot will be auto-filled. `null` when all
   * slots are already occupied (no pending roll). Client runs a live countdown
   * off this value.
   */
  nextRollAt: z.number().int().nullable(),
});

export const trackRerollInputSchema = z.object({
  slot: z.number().int().min(0).max(2),
});

export type Track = z.infer<typeof trackSchema>;
export type TrackListResponse = z.infer<typeof trackListResponseSchema>;

// ========== Combat enemies filter ==========
export const combatEnemiesInputSchema = z
  .object({
    /** Gdy podany, lista ogranicza się do mobów + bossa tego lochu. */
    dungeonSlug: z.string().min(1).max(64).optional(),
  })
  .optional();
export type CombatEnemiesInput = z.infer<typeof combatEnemiesInputSchema>;

// ========== Mapa świata / Lochy ==========
export const dungeonStatusSchema = z.enum(['locked', 'unlocked', 'cleared']);
export type DungeonStatus = z.infer<typeof dungeonStatusSchema>;

export const dungeonBossPreviewSchema = z.object({
  slug: z.string(),
  name: z.string(),
  lvl: z.number().int(),
  requiredLvl: z.number().int(),
});

export const dungeonSummarySchema = z.object({
  slug: z.string(),
  name: z.string(),
  desc: z.string(),
  requiredLvl: z.number().int(),
  /** Null dla pierwszego lochu w regionie. */
  prerequisiteDungeonSlug: z.string().nullable(),
  /** Pozycja na mapie, 0..1000 w logicznym układzie. */
  mapX: z.number().int(),
  mapY: z.number().int(),
  sortOrder: z.number().int(),
  status: dungeonStatusSchema,
  /** Powód zablokowania (dla UI tooltip) gdy status='locked'. null gdy otwarty. */
  lockReason: z.string().nullable(),
  /** Liczba regular mobów (bez bossa). */
  mobCount: z.number().int().min(0),
  boss: dungeonBossPreviewSchema,
});
export type DungeonSummary = z.infer<typeof dungeonSummarySchema>;

export const regionSummarySchema = z.object({
  slug: z.string(),
  name: z.string(),
  sortOrder: z.number().int(),
  dungeons: z.array(dungeonSummarySchema),
});
export type RegionSummary = z.infer<typeof regionSummarySchema>;

export const worldGetResponseSchema = z.object({
  regions: z.array(regionSummarySchema),
  charLvl: z.number().int().min(1),
});
export type WorldGetResponse = z.infer<typeof worldGetResponseSchema>;

// ========== Kroniki Szczurogrodu ==========
export const chroniclePayloadSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('boss_kill'),
    questId: z.string(),
    questTitle: z.string(),
    heroName: z.string(),
  }),
  z.object({
    kind: z.literal('legendary_drop'),
    itemName: z.string(),
    heroName: z.string(),
  }),
  z.object({
    kind: z.literal('level_milestone'),
    level: z.number().int().min(1),
    heroName: z.string(),
  }),
  z.object({
    kind: z.literal('achievement_unlock'),
    heroName: z.string(),
    achievementId: z.string(),
    achievementName: z.string(),
    tier: z.enum(['bronze', 'silver', 'gold', 'legendary']),
  }),
  z.object({
    kind: z.literal('arena_victory'),
    heroName: z.string(),
    opponentName: z.string(),
    pointsDelta: z.number().int(),
  }),
  z.object({
    kind: z.literal('arena_streak'),
    heroName: z.string(),
    streak: z.number().int().min(2),
  }),
  z.object({
    kind: z.literal('guild_founded'),
    heroName: z.string(),
    guildName: z.string(),
  }),
  z.object({
    kind: z.literal('guild_joined'),
    heroName: z.string(),
    guildName: z.string(),
  }),
  z.object({
    kind: z.literal('guild_war_won'),
    heroName: z.string(),
    guildName: z.string(),
    opponentName: z.string(),
    attackerScore: z.number().int(),
    defenderScore: z.number().int(),
  }),
  z.object({
    kind: z.literal('guild_raid_killed'),
    heroName: z.string(),
    guildName: z.string(),
    bossName: z.string(),
    tier: z.number().int().min(1),
  }),
  z.object({
    kind: z.literal('world_boss_killed'),
    heroName: z.string(),
    bossName: z.string(),
    tier: z.number().int().min(1),
    /** Liczba uczestników (hitterów) */
    contributors: z.number().int().min(1),
  }),
]);
export type ChroniclePayload = z.infer<typeof chroniclePayloadSchema>;
export type ChronicleKind = ChroniclePayload['kind'];

export const chronicleEntrySchema = z.object({
  id: z.string(),
  /** Renderowany tekst po polsku — fallback gdy klient nie ma matching
   *  template'u dla payload.kind, oraz dla flavor/seed którego nie ma EN
   *  wersji. Zostaje jako contract dla starych klientów. */
  text: z.string(),
  /** 'event' = prawdziwy gracz, 'flavor' = NPC Claude-generated / seed. */
  source: z.enum(['event', 'flavor']),
  /** Unix ms dla eventów; null dla flavoru. */
  createdAt: z.number().int().nullable(),
  /** Strukturalny payload dla event — klient renderuje przez i18n
   *  templates w aktualnym języku. null dla flavor/seed. */
  payload: chroniclePayloadSchema.nullable(),
  /** Index template'u (server-computed `hashIndex(stableKey, pool.length)`)
   *  dla deterministycznego wyboru wariantu po stronie klienta. null dla
   *  flavor/seed. */
  templateIdx: z.number().int().min(0).nullable(),
});
export type ChronicleEntry = z.infer<typeof chronicleEntrySchema>;

export const chronicleListResponseSchema = z.object({
  entries: z.array(chronicleEntrySchema),
});
export type ChronicleListResponse = z.infer<typeof chronicleListResponseSchema>;

// ========== Gem shop ==========
export const gemPurchaseInputSchema = z.object({
  packId: z.string().min(1).max(64),
});

// Catalog entry returned by `gemShop.list`. Native (Capacitor) build czyta
// localized price z Play Billing plugin'u; web (PayPal) używa `priceGrosze`
// + `currency` z serwera (server-authoritative — klient amount'u nie wysyła).
export const gemPackageSchema = z.object({
  id: z.string(),
  gems: z.number().int().min(1),
  bonus: z.number().int().min(0),
  googlePlayProductId: z.string(),
  priceGrosze: z.number().int().min(0),
  currency: z.literal('PLN'),
});
export type GemPackage = z.infer<typeof gemPackageSchema>;

export const gemShopListResponseSchema = z.object({
  packages: z.array(gemPackageSchema),
  /** True iff env has package + service account; lets the client warn when
   *  the server is in unconfigured-mode (purchase will return PLAY_NOT_CONFIGURED). */
  playBillingReady: z.boolean(),
  /** True gdy server ma PayPal API key+secret. Klient (web) używa do gating'u
   *  PayPal Buttons render — bez creds renderuje fallback. */
  paypalReady: z.boolean(),
});
export type GemShopListResponse = z.infer<typeof gemShopListResponseSchema>;

export const verifyPlayPurchaseInputSchema = z.object({
  productId: z.string().min(1).max(64),
  purchaseToken: z.string().min(1).max(2048),
});
export type VerifyPlayPurchaseInput = z.infer<typeof verifyPlayPurchaseInputSchema>;

export const verifyPlayPurchaseResponseSchema = z.object({
  status: z.enum(['credited', 'already_credited', 'pending', 'rejected']),
  gemsGranted: z.number().int().min(0),
  /** New character.gems balance after credit. Echoed for client UI without
   *  forcing an extra `me.get` round-trip. */
  characterGems: z.number().int().min(0),
  /** Server's reason string when status === 'rejected' (for telemetry, not UX). */
  reason: z.string().nullable(),
});
export type VerifyPlayPurchaseResponse = z.infer<typeof verifyPlayPurchaseResponseSchema>;

// ===== PayPal Checkout (web fallback) =====
// Klient nie wysyła amount'u — server bierze go z GEM_PACKAGES po packId.
export const paypalCreateOrderInputSchema = z.object({
  packId: z.string().min(1).max(64),
});
export type PaypalCreateOrderInput = z.infer<typeof paypalCreateOrderInputSchema>;

export const paypalCreateOrderResponseSchema = z.object({
  orderId: z.string(),
});
export type PaypalCreateOrderResponse = z.infer<typeof paypalCreateOrderResponseSchema>;

export const paypalCaptureOrderInputSchema = z.object({
  orderId: z.string().min(1).max(64),
  packId: z.string().min(1).max(64),
});
export type PaypalCaptureOrderInput = z.infer<typeof paypalCaptureOrderInputSchema>;

export const paypalCaptureOrderResponseSchema = z.object({
  status: z.enum(['credited', 'already_credited', 'rejected']),
  gemsGranted: z.number().int().min(0),
  characterGems: z.number().int().min(0),
  reason: z.string().nullable(),
});
export type PaypalCaptureOrderResponse = z.infer<typeof paypalCaptureOrderResponseSchema>;

// ========== Arena ==========
// Rival — może być real player (id = character uuid) lub NPC synth
// (id = "npc:<slug>", nie persystuje między fight calls — regeneruje się
// w list(), fight() reseeduje deterministycznie z seed'a).
export const arenaRivalSchema = z.object({
  id: z.string(),
  kind: z.enum(['player', 'npc']),
  name: z.string(),
  cls: z.enum(['warrior', 'mage', 'rogue']),
  lvl: z.number().int().min(1),
  power: z.number().int().min(0),
  arenaPoints: z.number().int().min(0),
});
export type ArenaRival = z.infer<typeof arenaRivalSchema>;

export const arenaLeaderboardEntrySchema = z.object({
  pos: z.number().int().min(1),
  name: z.string(),
  cls: z.enum(['warrior', 'mage', 'rogue']),
  lvl: z.number().int().min(1),
  arenaPoints: z.number().int().min(0),
  arenaWins: z.number().int().min(0),
});
export type ArenaLeaderboardEntry = z.infer<typeof arenaLeaderboardEntrySchema>;

export const arenaStatsSchema = z.object({
  arenaPoints: z.number().int().min(0),
  arenaWins: z.number().int().min(0),
  arenaLosses: z.number().int().min(0),
  fightsToday: z.number().int().min(0),
  fightsMax: z.number().int().min(0),
  rank: z.number().int().min(1).nullable(),
});
export type ArenaStats = z.infer<typeof arenaStatsSchema>;

export const arenaListResponseSchema = z.object({
  stats: arenaStatsSchema,
  rivals: z.array(arenaRivalSchema),
  leaderboard: z.array(arenaLeaderboardEntrySchema),
});
export type ArenaListResponse = z.infer<typeof arenaListResponseSchema>;

export const arenaFightInputSchema = z.object({
  rivalId: z.string().min(1).max(128),
});
export type ArenaFightInput = z.infer<typeof arenaFightInputSchema>;

// Log turn: kto atakuje, raw damage przed reduce, final damage po reduce,
// czy crit. Klient renderuje po kolei.
export const arenaLogEntrySchema = z.object({
  turn: z.number().int().min(1),
  side: z.enum(['you', 'rival']),
  dmg: z.number().int().min(0),
  crit: z.boolean(),
  remainingHp: z.number().int().min(0),
});
export type ArenaLogEntry = z.infer<typeof arenaLogEntrySchema>;

export const arenaFightResultSchema = z.object({
  won: z.boolean(),
  pointsDelta: z.number().int(),
  goldReward: z.number().int().min(0),
  rival: arenaRivalSchema,
  log: z.array(arenaLogEntrySchema),
  newArenaPoints: z.number().int().min(0),
  fightsToday: z.number().int().min(0),
  currentStreak: z.number().int().min(0),
  unlockedAchievements: z.array(achievementUnlockPayloadSchema).optional().default([]),
});
export type ArenaFightResult = z.infer<typeof arenaFightResultSchema>;

// Pełny snapshot statów rivala — fetchowany na hover/confirm, pokazuje
// gracza czym go przewyższa / ustępuje przed pojedynkiem.
export const arenaRivalDetailsInputSchema = z.object({
  rivalId: z.string().min(1).max(128),
});
export type ArenaRivalDetailsInput = z.infer<typeof arenaRivalDetailsInputSchema>;

export const arenaRivalDetailsSchema = z.object({
  rival: arenaRivalSchema,
  atk: z.number().int(),
  def: z.number().int(),
  mag: z.number().int(),
  spd: z.number().int(),
  hpMax: z.number().int(),
});
export type ArenaRivalDetails = z.infer<typeof arenaRivalDetailsSchema>;

// Historia walk — gracz widzi ostatnie N pojedynków.
export const arenaMatchRowSchema = z.object({
  id: z.string(),
  /** 'attacker' = gracz wszczął walkę; 'defender' = ktoś go zaatakował. */
  role: z.enum(['attacker', 'defender']),
  opponentName: z.string(),
  opponentCls: z.enum(['warrior', 'mage', 'rogue']),
  opponentLvl: z.number().int().min(1),
  opponentKind: z.enum(['player', 'npc']),
  won: z.boolean(),
  pointsDelta: z.number().int(),
  goldReward: z.number().int(),
  createdAt: z.number().int(),
});
export type ArenaMatchRow = z.infer<typeof arenaMatchRowSchema>;

export const arenaHistoryResponseSchema = z.object({
  matches: z.array(arenaMatchRowSchema),
});
export type ArenaHistoryResponse = z.infer<typeof arenaHistoryResponseSchema>;

// ========== Guilds ==========
export const guildRankSchema = z.enum(['leader', 'officer', 'member', 'recruit']);
export type GuildRank = z.infer<typeof guildRankSchema>;

export const guildEmblemKindSchema = z.enum(['shield', 'tower', 'skull', 'book']);
export type GuildEmblemKind = z.infer<typeof guildEmblemKindSchema>;

export const guildSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  tag: z.string(),
  motto: z.string(),
  emblemKind: guildEmblemKindSchema,
  emblemColor: z.string(),
  level: z.number().int().min(1),
  glory: z.number().int().min(0),
  memberCount: z.number().int().min(0),
  memberCap: z.number().int().min(1),
  requiredLvl: z.number().int().min(1),
  isOpen: z.boolean(),
});
export type GuildSummary = z.infer<typeof guildSummarySchema>;

export const guildMemberSchema = z.object({
  characterId: z.string(),
  name: z.string(),
  cls: z.enum(['warrior', 'mage', 'rogue']),
  lvl: z.number().int().min(1),
  rank: guildRankSchema,
  joinedAt: z.number().int(),
  lastActiveAt: z.number().int(),
  contributedGold: z.number().int().min(0),
  contributedGems: z.number().int().min(0),
});
export type GuildMember = z.infer<typeof guildMemberSchema>;

export const guildChatMessageSchema = z.object({
  id: z.string(),
  authorCharId: z.string().nullable(),
  authorName: z.string(),
  authorCls: z.enum(['warrior', 'mage', 'rogue']),
  body: z.string(),
  kind: z.enum(['chat', 'system']),
  createdAt: z.number().int(),
});
export type GuildChatMessage = z.infer<typeof guildChatMessageSchema>;

export const guildInviteSchema = z.object({
  guildId: z.string(),
  guildName: z.string(),
  guildTag: z.string(),
  direction: z.enum(['invite', 'apply']),
  createdBy: z.string(),
  expiresAt: z.number().int(),
});
export type GuildInvite = z.infer<typeof guildInviteSchema>;

export const guildCreateInputSchema = z.object({
  name: z.string().min(3).max(24),
  tag: z.string().min(2).max(5),
  emblemKind: guildEmblemKindSchema,
  emblemColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Kolor musi być #rrggbb'),
  motto: z.string().max(80).default(''),
});
export type GuildCreateInput = z.infer<typeof guildCreateInputSchema>;

export const guildGetResponseSchema = z.object({
  guild: guildSummarySchema.extend({
    leaderCharId: z.string(),
    treasuryGold: z.number().int().min(0),
    treasuryGems: z.number().int().min(0),
  }),
  members: z.array(guildMemberSchema),
  myRank: guildRankSchema,
});
export type GuildGetResponse = z.infer<typeof guildGetResponseSchema>;

export const guildBrowseInputSchema = z.object({
  query: z.string().max(40).optional(),
  page: z.number().int().min(0).default(0),
});
export type GuildBrowseInput = z.infer<typeof guildBrowseInputSchema>;

export const guildBrowseResponseSchema = z.object({
  guilds: z.array(guildSummarySchema),
  hasMore: z.boolean(),
});
export type GuildBrowseResponse = z.infer<typeof guildBrowseResponseSchema>;

export const guildCharIdInputSchema = z.object({
  characterId: z.string().uuid(),
});
export type GuildCharIdInput = z.infer<typeof guildCharIdInputSchema>;

export const guildIdInputSchema = z.object({
  guildId: z.string().uuid(),
});
export type GuildIdInput = z.infer<typeof guildIdInputSchema>;

export const guildChatListInputSchema = z.object({
  before: z.number().int().optional(),
});
export type GuildChatListInput = z.infer<typeof guildChatListInputSchema>;

export const guildChatListResponseSchema = z.object({
  messages: z.array(guildChatMessageSchema),
});
export type GuildChatListResponse = z.infer<typeof guildChatListResponseSchema>;

export const guildChatSendInputSchema = z.object({
  body: z.string().min(1).max(500),
});
export type GuildChatSendInput = z.infer<typeof guildChatSendInputSchema>;

export const guildChatDeleteInputSchema = z.object({
  messageId: z.string().uuid(),
});
export type GuildChatDeleteInput = z.infer<typeof guildChatDeleteInputSchema>;

export const guildUpdateMottoInputSchema = z.object({
  motto: z.string().max(80),
});

export const guildUpdateEmblemInputSchema = z.object({
  emblemKind: guildEmblemKindSchema,
  emblemColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export const guildUpdateOpennessInputSchema = z.object({
  isOpen: z.boolean(),
  requiredLvl: z.number().int().min(1).max(100),
});

export const guildMyInvitesResponseSchema = z.object({
  invites: z.array(guildInviteSchema),
});
export type GuildMyInvitesResponse = z.infer<typeof guildMyInvitesResponseSchema>;

export const guildPendingApplicationSchema = z.object({
  characterId: z.string(),
  name: z.string(),
  cls: characterClassSchema,
  lvl: z.number().int().min(1),
  createdAt: z.number().int(),
  expiresAt: z.number().int(),
});
export type GuildPendingApplication = z.infer<typeof guildPendingApplicationSchema>;

export const guildPendingApplicationsResponseSchema = z.object({
  applications: z.array(guildPendingApplicationSchema),
});
export type GuildPendingApplicationsResponse = z.infer<
  typeof guildPendingApplicationsResponseSchema
>;

export const guildSearchCharacterInputSchema = z.object({
  query: z.string().min(3).max(20),
});
export type GuildSearchCharacterInput = z.infer<typeof guildSearchCharacterInputSchema>;

export const guildSearchCharacterResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  cls: characterClassSchema,
  lvl: z.number().int().min(1),
});
export type GuildSearchCharacterResult = z.infer<typeof guildSearchCharacterResultSchema>;

export const guildSearchCharacterResponseSchema = z.object({
  results: z.array(guildSearchCharacterResultSchema),
});
export type GuildSearchCharacterResponse = z.infer<typeof guildSearchCharacterResponseSchema>;

// ========== Guild treasury (Phase 2) ==========

export const guildTreasuryDepositInputSchema = z
  .object({
    gold: z.number().int().min(0).max(10_000_000).default(0),
    gems: z.number().int().min(0).max(100_000).default(0),
  })
  .refine((v) => v.gold > 0 || v.gems > 0, {
    message: 'Podaj kwotę złota lub gemów.',
  });
export type GuildTreasuryDepositInput = z.infer<typeof guildTreasuryDepositInputSchema>;

export const guildTreasuryWithdrawInputSchema = z
  .object({
    gold: z.number().int().min(0).max(10_000_000).default(0),
    gems: z.number().int().min(0).max(100_000).default(0),
  })
  .refine((v) => v.gold > 0 || v.gems > 0, {
    message: 'Podaj kwotę złota lub gemów.',
  });
export type GuildTreasuryWithdrawInput = z.infer<typeof guildTreasuryWithdrawInputSchema>;

export const guildTreasuryLogEntrySchema = z.object({
  id: z.string(),
  actorName: z.string(),
  kind: z.enum(['deposit', 'withdraw', 'building_upgrade', 'war_reward', 'raid_reward']),
  goldDelta: z.number().int(),
  gemsDelta: z.number().int(),
  memo: z.string(),
  createdAt: z.number().int(),
});
export type GuildTreasuryLogEntry = z.infer<typeof guildTreasuryLogEntrySchema>;

export const guildTreasuryLogResponseSchema = z.object({
  entries: z.array(guildTreasuryLogEntrySchema),
  dailyWithdrawalSum: z.number().int().min(0),
  dailyWithdrawalCap: z.number().int().min(0),
});
export type GuildTreasuryLogResponse = z.infer<typeof guildTreasuryLogResponseSchema>;

// ========== Guild buildings (Phase 2) ==========

export const guildBuildingBuffSpecSchema = z.union([
  z.object({
    kind: z.literal('fortress'),
    memberCapByLevel: z.array(z.number().int()),
  }),
  z.object({
    kind: z.literal('altar'),
    atkPctByLevel: z.array(z.number()),
    magPctByLevel: z.array(z.number()),
    defPctByLevel: z.array(z.number()),
  }),
  z.object({
    kind: z.literal('vault'),
    extraWithdrawPctByLevel: z.array(z.number()),
  }),
]);
export type GuildBuildingBuffSpec = z.infer<typeof guildBuildingBuffSpecSchema>;

export const guildBuildingEntrySchema = z.object({
  slug: z.string(),
  name: z.string(),
  icon: z.string(),
  desc: z.string(),
  level: z.number().int().min(0),
  maxLevel: z.number().int().min(1),
  /** Koszt kolejnego upgrade'u. `null` gdy max'd. */
  nextCost: z
    .object({
      gold: z.number().int().min(0),
      gems: z.number().int().min(0),
      guildLvl: z.number().int().min(1),
    })
    .nullable(),
  buffSpec: guildBuildingBuffSpecSchema,
});
export type GuildBuildingEntry = z.infer<typeof guildBuildingEntrySchema>;

export const guildBuildingsListResponseSchema = z.object({
  buildings: z.array(guildBuildingEntrySchema),
  guildLevel: z.number().int().min(1),
  treasuryGold: z.number().int().min(0),
  treasuryGems: z.number().int().min(0),
});
export type GuildBuildingsListResponse = z.infer<typeof guildBuildingsListResponseSchema>;

export const guildBuildingUpgradeInputSchema = z.object({
  slug: z.string().min(1).max(32),
});
export type GuildBuildingUpgradeInput = z.infer<typeof guildBuildingUpgradeInputSchema>;

// ========== Guild wars (Phase 3 — S&F gauntlet) ==========

export const guildWarStatusSchema = z.enum([
  'scheduled',
  'resolving',
  'resolved',
  'cancelled',
]);
export type GuildWarStatus = z.infer<typeof guildWarStatusSchema>;

export const guildWarSideSchema = z.enum(['attacker', 'defender']);
export type GuildWarSide = z.infer<typeof guildWarSideSchema>;

export const guildWarParticipantSchema = z.object({
  characterId: z.string(),
  name: z.string(),
  cls: characterClassSchema,
  lvl: z.number().int().min(1),
  side: guildWarSideSchema,
  orderIndex: z.number().int().min(0).max(99),
  /** Persisted po resolve. `null` przed resolvem. */
  wonDuel: z.boolean().nullable(),
});
export type GuildWarParticipant = z.infer<typeof guildWarParticipantSchema>;

export const guildWarRoundSchema = z.object({
  round: z.number().int().min(0),
  attackerCharId: z.string(),
  attackerName: z.string(),
  attackerHpBefore: z.number().int().min(0),
  defenderCharId: z.string(),
  defenderName: z.string(),
  defenderHpBefore: z.number().int().min(0),
  winner: guildWarSideSchema,
  winnerHpAfter: z.number().int().min(0),
  duelLog: z.array(arenaLogEntrySchema),
});
export type GuildWarRound = z.infer<typeof guildWarRoundSchema>;

export const guildWarSummarySchema = z.object({
  id: z.string(),
  attackerGuildId: z.string(),
  attackerGuildName: z.string(),
  attackerGuildTag: z.string(),
  defenderGuildId: z.string(),
  defenderGuildName: z.string(),
  defenderGuildTag: z.string(),
  status: guildWarStatusSchema,
  scheduledAt: z.number().int(),
  resolvedAt: z.number().int().nullable(),
  winnerGuildId: z.string().nullable(),
  attackerScore: z.number().int().min(0),
  defenderScore: z.number().int().min(0),
  goldPrize: z.number().int().min(0),
  gloryDelta: z.number().int(),
  createdAt: z.number().int(),
});
export type GuildWarSummary = z.infer<typeof guildWarSummarySchema>;

export const guildWarDetailsSchema = guildWarSummarySchema.extend({
  participants: z.array(guildWarParticipantSchema),
  /** Null gdy war nieresolvowana lub bez rund (forfeit). */
  rounds: z.array(guildWarRoundSchema).nullable(),
  /** Czy ja jestem w attacker czy defender gildii (ułatwia UI). */
  mySide: guildWarSideSchema.nullable(),
  /** Czy commitowalem — null gdy nie. */
  myOrderIndex: z.number().int().nullable(),
});
export type GuildWarDetails = z.infer<typeof guildWarDetailsSchema>;

// --- inputs ---

export const guildWarsDeclareInputSchema = z.object({
  defenderGuildId: z.string().uuid(),
});
export type GuildWarsDeclareInput = z.infer<typeof guildWarsDeclareInputSchema>;

export const guildWarsIdInputSchema = z.object({
  warId: z.string().uuid(),
});
export type GuildWarsIdInput = z.infer<typeof guildWarsIdInputSchema>;

export const guildWarsReorderInputSchema = z.object({
  warId: z.string().uuid(),
  orders: z.array(
    z.object({
      characterId: z.string().uuid(),
      orderIndex: z.number().int().min(0).max(14),
    }),
  ),
});
export type GuildWarsReorderInput = z.infer<typeof guildWarsReorderInputSchema>;

// --- responses ---

export const guildWarsListResponseSchema = z.object({
  active: guildWarSummarySchema.nullable(),
  recent: z.array(guildWarSummarySchema),
});
export type GuildWarsListResponse = z.infer<typeof guildWarsListResponseSchema>;

export const guildWarsBrowseTargetSchema = z.object({
  id: z.string(),
  name: z.string(),
  tag: z.string(),
  emblemKind: guildEmblemKindSchema,
  emblemColor: z.string(),
  memberCount: z.number().int(),
  avgLvl: z.number(),
  glory: z.number().int().min(0),
});
export type GuildWarsBrowseTarget = z.infer<typeof guildWarsBrowseTargetSchema>;

export const guildWarsBrowseResponseSchema = z.object({
  myAvgLvl: z.number(),
  targets: z.array(guildWarsBrowseTargetSchema),
});
export type GuildWarsBrowseResponse = z.infer<typeof guildWarsBrowseResponseSchema>;

// ========== Wieża Bezdenna (Priorytet 4 z features-vs-sf.md) ==========

export const towerBossSchema = z.object({
  name: z.string(),
  /** Legacy GameIcon name — keep dla starszych klientów. Portret preferuje `monsterSlug`. */
  icon: z.string(),
  /** Slug receptury w `apps/web/src/components/monsters/recipes.ts`. Klient rysuje Monster. */
  monsterSlug: z.string(),
  floor: z.number().int().min(1),
  atk: z.number().int().min(0),
  def: z.number().int().min(0),
  mag: z.number().int().min(0),
  hpMax: z.number().int().min(1),
  cls: characterClassSchema,
});
export type TowerBoss = z.infer<typeof towerBossSchema>;

export const towerCurrentResponseSchema = z.object({
  currentFloor: z.number().int().min(1),
  bestFloorThisWeek: z.number().int().min(0),
  weekStart: z.string(),
  nextResetAt: z.number().int(),
  boss: towerBossSchema,
  /** Unix ms kiedy skończy się cooldown (null = ready to climb). */
  failedUntil: z.number().int().nullable(),
  gemResurrectCost: z.number().int().min(0),
});
export type TowerCurrentResponse = z.infer<typeof towerCurrentResponseSchema>;

/**
 * Response z `tower.engage` — otwiera aktywną walkę z bossem piętra. Gracz
 * dalej klika ataki przez `combat.attack` (session kind='tower' w silniku).
 * Zwracany CombatState jest pełnym stanem sesji — UI renderuje ekran walki
 * identycznie jak w lochach.
 */
export const towerEngageResponseSchema = combatStateSchema;
export type TowerEngageResponse = z.infer<typeof towerEngageResponseSchema>;

export const towerResurrectResponseSchema = z.object({
  ok: z.literal(true),
  cost: z.number().int().min(0),
});
export type TowerResurrectResponse = z.infer<typeof towerResurrectResponseSchema>;

export const towerLeaderboardEntrySchema = z.object({
  characterId: z.string(),
  name: z.string(),
  cls: characterClassSchema,
  lvl: z.number().int().min(1),
  bestFloor: z.number().int().min(0),
});
export type TowerLeaderboardEntry = z.infer<typeof towerLeaderboardEntrySchema>;

export const towerLeaderboardResponseSchema = z.object({
  weekStart: z.string(),
  nextResetAt: z.number().int(),
  entries: z.array(towerLeaderboardEntrySchema),
});
export type TowerLeaderboardResponse = z.infer<typeof towerLeaderboardResponseSchema>;

// ========== Blacksmith (Priorytet 6 z features-vs-sf.md) ==========

export const blacksmithDismantleInputSchema = z.object({
  itemId: z.string().uuid(),
});
export type BlacksmithDismantleInput = z.infer<typeof blacksmithDismantleInputSchema>;

export const blacksmithDismantleResponseSchema = z.object({
  ok: z.literal(true),
  scrapGained: z.number().int().min(1),
  totalScrap: z.number().int().min(0),
});
export type BlacksmithDismantleResponse = z.infer<typeof blacksmithDismantleResponseSchema>;

export const blacksmithUpgradeInputSchema = z.object({
  itemId: z.string().uuid(),
  useGemGuarantee: z.boolean().default(false),
});
export type BlacksmithUpgradeInput = z.infer<typeof blacksmithUpgradeInputSchema>;

export const blacksmithUpgradeResponseSchema = z.object({
  ok: z.literal(true),
  success: z.boolean(),
  newLevel: z.number().int().min(0).max(10),
  goldSpent: z.number().int().min(0),
  scrapSpent: z.number().int().min(0),
  gemsSpent: z.number().int().min(0),
});
export type BlacksmithUpgradeResponse = z.infer<typeof blacksmithUpgradeResponseSchema>;

export const blacksmithPreviewInputSchema = z.object({
  itemId: z.string().uuid(),
});
export type BlacksmithPreviewInput = z.infer<typeof blacksmithPreviewInputSchema>;

export const blacksmithPreviewResponseSchema = z.object({
  currentLevel: z.number().int().min(0).max(10),
  currentStats: z.object({ atk: z.number().int(), def: z.number().int(), mag: z.number().int() }),
  nextStats: z
    .object({ atk: z.number().int(), def: z.number().int(), mag: z.number().int() })
    .nullable(),
  /** Koszty kolejnego upgrade'u. null gdy na max. */
  cost: z
    .object({ gold: z.number().int(), scrap: z.number().int() })
    .nullable(),
  /** Szansa sukcesu 0..1. 1 = zawsze się uda. */
  successRate: z.number().min(0).max(1),
  /** Koszt gem guarantee (stały). */
  gemGuaranteeCost: z.number().int().min(0),
  scrapOwned: z.number().int().min(0),
  goldOwned: z.number().int().min(0),
  gemsOwned: z.number().int().min(0),
});
export type BlacksmithPreviewResponse = z.infer<typeof blacksmithPreviewResponseSchema>;

// ========== Scrapbook (Priorytet 3 z features-vs-sf.md) ==========

export const scrapbookEntrySchema = z.object({
  itemTemplateId: z.string(),
  name: z.string(),
  icon: z.string(),
  slot: z.string(),
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']),
  /** null = nie znaleziony (szary w UI). */
  foundAt: z.number().int().nullable(),
});
export type ScrapbookEntry = z.infer<typeof scrapbookEntrySchema>;

export const scrapbookBuffsSchema = z.object({
  /** Bieżący % wypełnienia (0..100). */
  fillPct: z.number().min(0).max(100),
  foundCount: z.number().int().min(0),
  totalCount: z.number().int().min(0),
  /** Active buffs at current fill level. */
  xpPct: z.number().min(0),
  goldPct: z.number().min(0),
  damagePct: z.number().min(0),
  dropPct: z.number().min(0),
});
export type ScrapbookBuffs = z.infer<typeof scrapbookBuffsSchema>;

export const scrapbookListResponseSchema = z.object({
  entries: z.array(scrapbookEntrySchema),
  buffs: scrapbookBuffsSchema,
});
export type ScrapbookListResponse = z.infer<typeof scrapbookListResponseSchema>;

/**
 * Progowe buffy scrapbook'a. Każdy próg dodaje kumulatywnie nowy bonus.
 * - 25% wypełnienia: +1% XP (w arena/raid)
 * - 50%: +3% gold (w arena/raid)
 * - 75%: +5% damage (w arena/raid)
 * - 100%: +2% drop rate (all sources)
 *
 * Buffy NIE wchodzą do PvE (per decyzja user'a consistent z altar).
 */
export const SCRAPBOOK_THRESHOLDS = {
  xp: { pct: 25, bonus: 1 },
  gold: { pct: 50, bonus: 3 },
  damage: { pct: 75, bonus: 5 },
  drop: { pct: 100, bonus: 2 },
} as const;

// ========== Gem sinks (Priorytet 1 z features-vs-sf.md) ==========

export const renameCharacterInputSchema = z.object({
  name: z.string().trim().min(1).max(20),
});
export type RenameCharacterInput = z.infer<typeof renameCharacterInputSchema>;

/**
 * Koszty gem-sinków — ujednolicone dla klienta i serwera. Zmiana tutaj =
 * zmiana w cost display + walidacji mutation jednocześnie.
 */
export const GEM_SINK_COSTS = {
  healInstant: 3,
  extraArenaFight: 5,
  extraRaidHit: 5,
  /** Bypass world boss daily limit (3/dzień). Premium wersja — droższa
   *  niż raid bo damage per hit jest dużo wyższy + dostęp do leaderboard'u. */
  extraWorldBossHit: 8,
  extraKey: 3,
  staminaRefill: 8,
  renameCharacter: 50,
  rerollCompanions: 10,
  extraDiceRoll: 5,
  extraOraclePull: 3,
  /** Baba Jaga — zdjęcie wszystkich klątw naraz. Cena stała; pojedyncze
   *  usunięcie liczone per-klątwa w gold'zie (scaled by LVL). */
  witchRemoveAll: 8,
  /** Zmiana wyglądu po stworzeniu postaci. Cosmetic only. */
  redoAppearance: 25,
  /** Bypass per-mob daily kill limit (wszyscy mobki naraz, dziś UTC). */
  resetDailyMobs: 20,
  /** Bypass cooldown pojedynczego mob'a po killu (per slug). */
  skipBossCooldown: 5,
} as const;

export const skipBossCooldownInputSchema = z.object({
  enemySlug: z.string().min(1).max(64),
});
export type SkipBossCooldownInput = z.infer<typeof skipBossCooldownInputSchema>;
export type GemSinkCosts = typeof GEM_SINK_COSTS;

/**
 * Cena pełnego skipu questa — 1 gem za każde zaczęte 30s pozostałego czasu,
 * minimum 1. Dla 90s zostających = 3 gemy, dla 15 min = 30 gemów.
 * Użyte przez `quests.skip` (serwer) i ScreenQuests (klient) — trzymaj
 * formułę tu, mirrors są niepotrzebne.
 */
export function computeQuestSkipFullCost(remainingMs: number): number {
  return Math.max(1, Math.ceil(Math.max(0, remainingMs) / 30_000));
}

/**
 * Cena skipu o 50% — połowa pełnego skipu (zaokrąglona w górę), min 1.
 * Intencja: skrócenie czasu o połowę kosztuje połowę ceny pełnego skipu.
 * Dla 90s: full=3 → half=2. Dla 15min: full=30 → half=15. Dla <60s: half=1.
 */
export function computeQuestSkipHalfCost(remainingMs: number): number {
  return Math.max(1, Math.ceil(computeQuestSkipFullCost(remainingMs) / 2));
}

export const RENAME_COOLDOWN_DAYS = 30;
export const STAMINA_REFILL_AMOUNT = 10;

// ========== Season Pass (Priorytet 8) ==========

/** Cena wykupienia premium track'a. Mirror z server game/season-pass.ts. */
export const SEASON_PASS_PREMIUM_COST_GEMS = 300;

export const seasonPassTierRewardSchema = z.object({
  gold: z.number().int().optional(),
  gems: z.number().int().optional(),
  xp: z.number().int().optional(),
  keys: z.number().int().optional(),
  itemName: z.string().optional(),
  itemIcon: z.string().optional(),
  itemRarity: z.enum(['common', 'rare', 'epic', 'legendary']).optional(),
});
export type SeasonPassTierReward = z.infer<typeof seasonPassTierRewardSchema>;

export const seasonPassStatusResponseSchema = z.object({
  /** ISO date UTC first-of-month — kiedy zaczął się aktualny sezon. */
  seasonStart: z.string(),
  xp: z.number().int().min(0),
  /** 1..SEASON_PASS_TIER_COUNT. 0 = nic jeszcze nie zdobyte. */
  currentTier: z.number().int(),
  isPremium: z.boolean(),
  /** Per-tier reward freeTrack[i] = tier i+1 free reward. */
  freeTrack: z.array(seasonPassTierRewardSchema),
  premiumTrack: z.array(seasonPassTierRewardSchema),
  /** Bitmapa: bit N = tier N+1 odebrany na free (0-indexed w protocol'u). */
  claimedFreeBitmap: z.number().int(),
  claimedPremiumBitmap: z.number().int(),
  premiumCostGems: z.number().int(),
  /** Unix ms kiedy sezon się kończy (UTC first-of-next-month). */
  seasonEndAt: z.number().int(),
});
export type SeasonPassStatusResponse = z.infer<typeof seasonPassStatusResponseSchema>;

export const seasonPassClaimInputSchema = z.object({
  tier: z.number().int().min(1).max(30),
  track: z.enum(['free', 'premium']),
});
export type SeasonPassClaimInput = z.infer<typeof seasonPassClaimInputSchema>;

export const seasonPassClaimResponseSchema = z.object({
  ok: z.literal(true),
  reward: seasonPassTierRewardSchema,
  newXp: z.number().int(),
  newGold: z.number().int(),
  newGems: z.number().int(),
  levelUp: z
    .object({
      fromLevel: z.number().int(),
      toLevel: z.number().int(),
      hpGain: z.number().int(),
      mpGain: z.number().int(),
      staminaGain: z.number().int(),
      newXpMax: z.number().int(),
      chapterUnlock: z
        .object({
          id: z.enum(['akt-1', 'akt-2', 'akt-3', 'akt-4', 'akt-5', 'akt-6']),
          name: z.string(),
          subtitle: z.string(),
          flavor: z.string(),
        })
        .nullable(),
    })
    .nullable(),
});
export type SeasonPassClaimResponse = z.infer<typeof seasonPassClaimResponseSchema>;

export const seasonPassBuyPremiumResponseSchema = z.object({
  ok: z.literal(true),
  newGems: z.number().int(),
});
export type SeasonPassBuyPremiumResponse = z.infer<typeof seasonPassBuyPremiumResponseSchema>;

// ========== Baba Jaga — remove curses (Priorytet 7) ==========

export const activeCurseSchema = z.object({
  /** Slug klątwy (np. 'curse-weakness'). */
  slug: z.string(),
  kind: z.enum(['hp_max_pct', 'mp_max_pct', 'atk_flat', 'def_flat', 'mag_flat', 'spd_flat']),
  name: z.string(),
  desc: z.string(),
  magnitude: z.number().int(),
  /** Unix ms. */
  expiresAt: z.number().int(),
  /** Cena zdjęcia tej konkretnej klątwy w gold. Scaled by char LVL. */
  removeCostGold: z.number().int(),
});
export type ActiveCurse = z.infer<typeof activeCurseSchema>;

export const witchStatusResponseSchema = z.object({
  curses: z.array(activeCurseSchema),
  /** Cena zdjęcia wszystkich naraz (gemy). Null gdy brak klątw. */
  removeAllCostGems: z.number().int().nullable(),
});
export type WitchStatusResponse = z.infer<typeof witchStatusResponseSchema>;

export const witchRemoveInputSchema = z.object({
  /** Slug klątwy do zdjęcia. */
  slug: z.string().min(1).max(64),
});
export type WitchRemoveInput = z.infer<typeof witchRemoveInputSchema>;

export const witchRemoveResponseSchema = z.object({
  ok: z.literal(true),
  gold: z.number().int(),
});
export type WitchRemoveResponse = z.infer<typeof witchRemoveResponseSchema>;

export const witchRemoveAllResponseSchema = z.object({
  ok: z.literal(true),
  gems: z.number().int(),
  removedCount: z.number().int(),
});
export type WitchRemoveAllResponse = z.infer<typeof witchRemoveAllResponseSchema>;

// ========== Mnich Panteleon — blessings / temporary buffs (Priorytet 7) ==========

/** Oferta błogosławieństwa — content-grade dane (name, cost, effect). */
export const blessingOfferSchema = z.object({
  id: z.string(),
  name: z.string(),
  desc: z.string(),
  icon: z.string(),
  kind: z.enum(['hp_max_pct', 'mp_max_pct', 'atk_flat', 'def_flat', 'mag_flat', 'spd_flat']),
  magnitude: z.number().int(),
  durationHours: z.number().int(),
  costGold: z.number().int(),
});
export type BlessingOffer = z.infer<typeof blessingOfferSchema>;

export const blessingStatusResponseSchema = z.object({
  offers: z.array(blessingOfferSchema),
  /** Unix ms kiedy kolejne błogosławieństwo będzie dostępne. Null = teraz. */
  cooldownReadyAt: z.number().int().nullable(),
});
export type BlessingStatusResponse = z.infer<typeof blessingStatusResponseSchema>;

export const blessingBuyInputSchema = z.object({
  id: z.string().min(1).max(32),
});
export type BlessingBuyInput = z.infer<typeof blessingBuyInputSchema>;

export const blessingBuyResponseSchema = z.object({
  ok: z.literal(true),
  /** Bieżące gold po odjęciu kosztu. */
  gold: z.number().int(),
  /** Unix ms wygaśnięcia świeżo zaaplikowanego buff'a. */
  buffExpiresAt: z.number().int(),
  /** Świeży cooldown ready — klient pokazuje countdown do następnego. */
  cooldownReadyAt: z.number().int().nullable(),
});
export type BlessingBuyResponse = z.infer<typeof blessingBuyResponseSchema>;

// ========== Wróżka Hanusia — Oracle / daily draws (Priorytet 7) ==========

/** Status Wyroczni — czy darmowy pull dostępny + cena extra. */
export const oracleStatusResponseSchema = z.object({
  freeAvailable: z.boolean(),
  extraCostGems: z.number().int().min(0),
  nextFreeAt: z.number().int(),
});
export type OracleStatusResponse = z.infer<typeof oracleStatusResponseSchema>;

export const oraclePullInputSchema = z.object({
  useFree: z.boolean(),
});
export type OraclePullInput = z.infer<typeof oraclePullInputSchema>;

export const oracleRewardKindSchema = z.enum([
  'gold',
  'xp',
  'potion',
  'common_item',
  'rare_item',
]);
export type OracleRewardKind = z.infer<typeof oracleRewardKindSchema>;

/** Response z `oracle.pull` — zawiera nagrodę + ewentualne level-up info
 *  gdy kategoria = xp i gracz przekroczył próg. */
export const oraclePullResponseSchema = z.object({
  kind: oracleRewardKindSchema,
  gold: z.number().int().min(0),
  xp: z.number().int().min(0),
  item: z
    .object({
      id: z.string(),
      name: z.string(),
      icon: z.string(),
      rarity: z.enum(['common', 'rare', 'epic', 'legendary']),
      slot: z.string(),
    })
    .nullable(),
  flavor: z.string(),
  status: oracleStatusResponseSchema,
  /** Null gdy kind !== 'xp' lub brak level-up'a. Klient odpala LevelUpModal. */
  levelUp: z
    .object({
      fromLevel: z.number().int(),
      toLevel: z.number().int(),
      hpGain: z.number().int(),
      mpGain: z.number().int(),
      staminaGain: z.number().int(),
      newXpMax: z.number().int(),
      chapterUnlock: z
        .object({
          id: z.enum(['akt-1', 'akt-2', 'akt-3', 'akt-4', 'akt-5', 'akt-6']),
          name: z.string(),
          subtitle: z.string(),
          flavor: z.string(),
        })
        .nullable(),
    })
    .nullable(),
});
export type OraclePullResponse = z.infer<typeof oraclePullResponseSchema>;

// ========== Karciarz Franek — daily dice (Priorytet 7) ==========

/** Status widoku Kości — czy darmowy rzut dostępny + ile kosztuje extra. */
export const diceStatusResponseSchema = z.object({
  freeAvailable: z.boolean(),
  extraCostGems: z.number().int().min(0),
  /** Unix ms północy UTC — klient liczy countdown do następnego darmowego. */
  nextFreeAt: z.number().int(),
});
export type DiceStatusResponse = z.infer<typeof diceStatusResponseSchema>;

/** Input do `dice.roll`: czy zużywamy darmową, czy płacimy gemami. */
export const diceRollInputSchema = z.object({
  useFree: z.boolean(),
});
export type DiceRollInput = z.infer<typeof diceRollInputSchema>;

export const diceRewardKindSchema = z.enum(['nothing', 'gold', 'rare_item', 'gems']);
export type DiceRewardKind = z.infer<typeof diceRewardKindSchema>;

/** Response po wykonaniu rzutu — klient animuje `roll` potem pokazuje reward. */
export const diceRollResponseSchema = z.object({
  roll: z.number().int().min(1).max(10),
  kind: diceRewardKindSchema,
  gold: z.number().int().min(0),
  gems: z.number().int().min(0),
  /** Gdy `kind === 'rare_item'` — info o dropie (dla toast'a/modal'a). */
  item: z
    .object({
      id: z.string(),
      name: z.string(),
      icon: z.string(),
      rarity: z.enum(['common', 'rare', 'epic', 'legendary']),
    })
    .nullable(),
  /** Flavor line — serwer wybiera Polish quip zależnie od wyniku. */
  flavor: z.string(),
  /** Odświeżony status po rolce (darmowa właśnie zużyta lub gemy odjęte). */
  status: diceStatusResponseSchema,
});
export type DiceRollResponse = z.infer<typeof diceRollResponseSchema>;

// ========== Dev-only (gem shop bypass) ==========

export const devGrantPurchaseInputSchema = z.object({
  /** ID packu/bundle/special/vip z klienta — do memo w response. */
  packId: z.string().min(1).max(32),
  gems: z.number().int().min(0).max(10_000).default(0),
  gold: z.number().int().min(0).max(1_000_000).default(0),
});
export type DevGrantPurchaseInput = z.infer<typeof devGrantPurchaseInputSchema>;

export const devGrantPurchaseResponseSchema = z.object({
  ok: z.literal(true),
  grantedGems: z.number().int().min(0),
  grantedGold: z.number().int().min(0),
});
export type DevGrantPurchaseResponse = z.infer<typeof devGrantPurchaseResponseSchema>;

// ========== Guild raids (Phase 4 — continuous S&F) ==========

export const guildRaidBossSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  icon: z.string(),
  flavor: z.string(),
  tier: z.number().int().min(1),
  hpMax: z.number().int().min(1),
  hpCurrent: z.number().int().min(0),
  spawnedAt: z.number().int(),
});
export type GuildRaidBoss = z.infer<typeof guildRaidBossSchema>;

export const guildRaidLeaderboardEntrySchema = z.object({
  characterId: z.string(),
  name: z.string(),
  cls: characterClassSchema,
  totalDmg: z.number().int().min(0),
  hitCount: z.number().int().min(0),
});
export type GuildRaidLeaderboardEntry = z.infer<typeof guildRaidLeaderboardEntrySchema>;

export const guildRaidCurrentResponseSchema = z.object({
  boss: guildRaidBossSchema,
  myHitsToday: z.number().int().min(0),
  myHitsMax: z.number().int().min(0),
  leaderboard: z.array(guildRaidLeaderboardEntrySchema),
});
export type GuildRaidCurrentResponse = z.infer<typeof guildRaidCurrentResponseSchema>;

export const guildRaidHitResponseSchema = z.object({
  dmg: z.number().int().min(0),
  hpRemaining: z.number().int().min(0),
  killed: z.boolean(),
  /** Gdy killed=true — preview następnego tier'a. */
  nextBoss: guildRaidBossSchema.nullable(),
  /** Gdy killed=true — reward split dla mojej gildii. */
  rewardGold: z.number().int().min(0),
  rewardGems: z.number().int().min(0),
  myHitsToday: z.number().int().min(0),
  myHitsMax: z.number().int().min(0),
  unlockedAchievements: z.array(achievementUnlockPayloadSchema).optional(),
});
export type GuildRaidHitResponse = z.infer<typeof guildRaidHitResponseSchema>;

export const guildRaidHistoryEntrySchema = z.object({
  id: z.string(),
  tier: z.number().int().min(1),
  bossName: z.string(),
  bossIcon: z.string(),
  hpMax: z.number().int().min(1),
  killedAt: z.number().int(),
  killingBlowCharName: z.string().nullable(),
});
export type GuildRaidHistoryEntry = z.infer<typeof guildRaidHistoryEntrySchema>;

export const guildRaidHistoryResponseSchema = z.object({
  entries: z.array(guildRaidHistoryEntrySchema),
});
export type GuildRaidHistoryResponse = z.infer<typeof guildRaidHistoryResponseSchema>;

// ========== World boss (Phase 1: server-wide raid) ==========

export const worldBossPhaseSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);
export type WorldBossPhase = z.infer<typeof worldBossPhaseSchema>;

export const worldBossSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  icon: z.string(),
  flavor: z.string(),
  tier: z.number().int().min(1),
  hpMax: z.number().int().min(1),
  hpCurrent: z.number().int().min(0),
  /** Aktualna faza HP — 1 (>66%), 2 (33-66%), 3 (<33%). */
  phase: worldBossPhaseSchema,
  /** Klasy które dostają +50% damage w obecnej fazie. */
  advantageousClasses: z.array(characterClassSchema),
  spawnedAt: z.number().int(),
});
export type WorldBoss = z.infer<typeof worldBossSchema>;

export const worldBossLeaderboardEntrySchema = z.object({
  characterId: z.string(),
  name: z.string(),
  cls: characterClassSchema,
  totalDmg: z.number().int().min(0),
  hitCount: z.number().int().min(0),
});
export type WorldBossLeaderboardEntry = z.infer<typeof worldBossLeaderboardEntrySchema>;

export const worldBossCurrentResponseSchema = z.object({
  boss: worldBossSchema,
  myHitsToday: z.number().int().min(0),
  myHitsMax: z.number().int().min(0),
  myTotalDmg: z.number().int().min(0),
  myRank: z.number().int().min(0).nullable(),
  /** Liczba wszystkich graczy którzy uderzyli aktywnego bossa. */
  totalHitters: z.number().int().min(0),
  /** Top 50. */
  leaderboard: z.array(worldBossLeaderboardEntrySchema),
});
export type WorldBossCurrentResponse = z.infer<typeof worldBossCurrentResponseSchema>;

export const worldBossHitResponseSchema = z.object({
  dmg: z.number().int().min(0),
  /** Faza w momencie tego konkretnego hit'a (mogła zmienić się po hit'cie). */
  phaseAtHit: worldBossPhaseSchema,
  /** True gdy moja klasa była advantageous w fazie hit'a. */
  phaseMatched: z.boolean(),
  /** Echa Wybudzonego dropnięte z tego hita. */
  echoesDrop: z.number().int().min(0),
  hpRemaining: z.number().int().min(0),
  killed: z.boolean(),
  /** Gdy killed=true — preview następnego tier'a. */
  nextBoss: worldBossSchema.nullable(),
  /** Reward dla TEJ postaci po killu. 0 gdy killed=false. */
  rewardGold: z.number().int().min(0),
  rewardGems: z.number().int().min(0),
  /** Mój rank na finalnej leaderboard po killu (1=top). null gdy killed=false. */
  finalRank: z.number().int().min(1).nullable(),
  /** True gdy ja zadałem killing blow. */
  isKiller: z.boolean(),
  myHitsToday: z.number().int().min(0),
  myHitsMax: z.number().int().min(0),
  unlockedAchievements: z.array(achievementUnlockPayloadSchema).optional(),
  /** Server-clamped tap count (0 gdy bossAlreadyDead). */
  taps: z.number().int().nonnegative().optional(),
  /** Damage multiplier z tap-mini-gry (0.6..1.4, 1.0 dla refundu). */
  tapMultiplier: z.number().optional(),
  /** True gdy commit trafił na bossa już ubitego — uderzenie zwrócone, brak nagród. */
  bossAlreadyDead: z.boolean().optional(),
});
export type WorldBossHitResponse = z.infer<typeof worldBossHitResponseSchema>;

/** Reservation response — klient otwiera tap-modal z tymi parametrami. */
export const worldBossStartHitResponseSchema = z.object({
  sessionId: z.string().uuid(),
  durationMs: z.number().int().positive(),
  minTaps: z.number().int().nonnegative(),
  maxTaps: z.number().int().positive(),
});
export type WorldBossStartHitResponse = z.infer<typeof worldBossStartHitResponseSchema>;

/** Commit input — sessionId z startHit, taps liczone klientowsko (server clampuje). */
export const worldBossCommitHitInputSchema = z.object({
  sessionId: z.string().uuid(),
  taps: z.number().int().min(0).max(200),
});
export type WorldBossCommitHitInput = z.infer<typeof worldBossCommitHitInputSchema>;

export const worldBossHistoryEntrySchema = z.object({
  id: z.string(),
  tier: z.number().int().min(1),
  bossName: z.string(),
  bossIcon: z.string(),
  hpMax: z.number().int().min(1),
  killedAt: z.number().int(),
  killingBlowCharName: z.string().nullable(),
  /** Mój rank w tej walce (jeśli brałem udział). */
  myRank: z.number().int().min(1).nullable(),
  myDmg: z.number().int().min(0),
});
export type WorldBossHistoryEntry = z.infer<typeof worldBossHistoryEntrySchema>;

export const worldBossHistoryResponseSchema = z.object({
  entries: z.array(worldBossHistoryEntrySchema),
});
export type WorldBossHistoryResponse = z.infer<typeof worldBossHistoryResponseSchema>;

export const worldBossShopRewardKindSchema = z.enum([
  'gems',
  'scrap',
  'gold',
  'extra_hit',
]);
export type WorldBossShopRewardKind = z.infer<typeof worldBossShopRewardKindSchema>;

export const worldBossShopOfferSchema = z.object({
  slug: z.string(),
  i18nKey: z.string(),
  icon: z.string(),
  cost: z.number().int().min(1),
  reward: z.object({
    kind: worldBossShopRewardKindSchema,
    amount: z.number().int().min(1),
  }),
});
export type WorldBossShopOfferDTO = z.infer<typeof worldBossShopOfferSchema>;

export const worldBossShopListResponseSchema = z.object({
  myEchoes: z.number().int().min(0),
  offers: z.array(worldBossShopOfferSchema),
});
export type WorldBossShopListResponse = z.infer<typeof worldBossShopListResponseSchema>;

export const worldBossShopBuyInputSchema = z.object({
  offerSlug: z.string().min(1).max(64),
});
export type WorldBossShopBuyInput = z.infer<typeof worldBossShopBuyInputSchema>;

export const worldBossShopBuyResponseSchema = z.object({
  spent: z.number().int().min(0),
  echoesAfter: z.number().int().min(0),
  reward: z.object({
    kind: worldBossShopRewardKindSchema,
    amount: z.number().int().min(1),
  }),
});
export type WorldBossShopBuyResponse = z.infer<typeof worldBossShopBuyResponseSchema>;

// ========== Patch log ==========
//
// Klient pull'uje `patches.list` co ~5 minut. Jeśli najnowszy id różni się
// od localStorage `lastSeenPatchId`, banner zachęca do hard-refresha
// (window.location.reload + cache clear). Tylko web — w Capacitorze
// banner jest pomijany.

export const patchSchema = z.object({
  id: z.string().uuid(),
  version: z.string().min(1).max(64),
  title: z.string().min(1).max(255),
  body: z.string(),
  /** Unix ms. */
  releasedAt: z.number().int().nonnegative(),
});
export type Patch = z.infer<typeof patchSchema>;

export const patchListResponseSchema = z.object({
  entries: z.array(patchSchema),
});
export type PatchListResponse = z.infer<typeof patchListResponseSchema>;

// ========== Hall of Fame / Kroniki Chwały (unified leaderboards) ==========
//
// Cztery taby agregowanych rankingów: poziom, achievementy, arena, gildie.
// Top-10 każdy. Server liczy z istniejących tabel (zero schema changes).

export const leaderboardCharEntrySchema = z.object({
  characterId: z.string(),
  pos: z.number().int().min(1),
  name: z.string(),
  cls: z.enum(['warrior', 'mage', 'rogue']),
  lvl: z.number().int().min(1),
  /** Wartość metryki dla rankingu: lvl / liczba achievementów / arenaPoints. */
  value: z.number().int().min(0),
});
export type LeaderboardCharEntry = z.infer<typeof leaderboardCharEntrySchema>;

export const leaderboardGuildEntrySchema = z.object({
  guildId: z.string(),
  pos: z.number().int().min(1),
  name: z.string(),
  tag: z.string(),
  glory: z.number().int().min(0),
  memberCount: z.number().int().min(0),
});
export type LeaderboardGuildEntry = z.infer<typeof leaderboardGuildEntrySchema>;

export const leaderboardsResponseSchema = z.object({
  byLevel: z.array(leaderboardCharEntrySchema),
  byAchievements: z.array(leaderboardCharEntrySchema),
  byArena: z.array(leaderboardCharEntrySchema),
  byGuilds: z.array(leaderboardGuildEntrySchema),
});
export type LeaderboardsResponse = z.infer<typeof leaderboardsResponseSchema>;

// ========== Public landing page (desktop side panels) ==========
//
// Cached, lightweight snapshot for unauthenticated visitors on the desktop
// shell. One round-trip wraps top players, latest chronicle entries, and
// quick stats so anonymous browsers see life in the world before they sign in.

export const landingPublicResponseSchema = z.object({
  topByLevel: z.array(leaderboardCharEntrySchema),
  chronicle: z.array(chronicleEntrySchema),
  stats: z.object({
    onlineCount: z.number().int().min(0),
    totalCharacters: z.number().int().min(0),
    totalGuilds: z.number().int().min(0),
  }),
  myRank: z
    .object({
      lvl: z.number().int().min(1),
      levelPos: z.number().int().min(1).nullable(),
      arenaPoints: z.number().int().min(0),
      arenaPos: z.number().int().min(1).nullable(),
    })
    .nullable(),
});
export type LandingPublicResponse = z.infer<typeof landingPublicResponseSchema>;

// ========== Discord claim ==========
//
// Gracz klika „Dołączyłem do Discorda" — server bumpuje achievement i jeśli
// to pierwsze odblokowanie, zwraca payload (klient pokazuje modal).
// Idempotentny — drugi claim zwraca alreadyClaimed:true bez nagrody.

export const discordClaimResponseSchema = z.object({
  alreadyClaimed: z.boolean(),
  unlocked: achievementUnlockPayloadSchema.nullable(),
});
export type DiscordClaimResponse = z.infer<typeof discordClaimResponseSchema>;

// ========== Szczurogród+ subscription ==========
//
// Subskrypcja premium za gemy. +20% XP do każdego gain'u (quests, combat,
// daily, work, oracle, season pass, survivor idle XP claim).
// Cap stack do 90 dni od chwili zakupu — anti-hoard.

export const buySzczurogrodPlusResponseSchema = z.object({
  ok: z.literal(true),
  cost: z.number().int().nonnegative(),
  szczurogrodPlusUntil: z.number().int().nonnegative(),
});
export type BuySzczurogrodPlusResponse = z.infer<typeof buySzczurogrodPlusResponseSchema>;

// Type re-exports for convenience
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type LinkAccountInput = z.infer<typeof linkAccountInputSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type CreateCharacterInput = z.infer<typeof createCharacterInputSchema>;
export type StarterBonus = z.infer<typeof starterBonusSchema>;
export type UpdateAppearanceInput = z.infer<typeof updateAppearanceInputSchema>;
export type StartQuestInput = z.infer<typeof startQuestInputSchema>;
export type CollectQuestInput = z.infer<typeof collectQuestInputSchema>;
export type SkipQuestInput = z.infer<typeof skipQuestInputSchema>;
export type CombatEngageInput = z.infer<typeof combatEngageInputSchema>;
export type CombatAttackInput = z.infer<typeof combatAttackInputSchema>;
export type ShopBuyInput = z.infer<typeof shopBuyInputSchema>;
export type GemPurchaseInput = z.infer<typeof gemPurchaseInputSchema>;
