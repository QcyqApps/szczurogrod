import { TRPCError } from '@trpc/server';
import { and, eq, lt, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import type {
  Appearance,
  ArmorStyle,
  Character,
  HeadwearStyle,
  OfflineSummary,
} from '@grodno/shared';
import {
  APPEARANCE_DEFAULTS,
  COSMETIC_UNLOCK_COST,
  GEM_SINK_COSTS,
  PREMIUM_ARMORS,
  PREMIUM_HEADWEARS,
  RENAME_COOLDOWN_DAYS,
  STAMINA_REFILL_AMOUNT,
  cosmeticSlug,
  createCharacterInputSchema,
  deleteAccountInputSchema,
  isArmorPremium,
  isHeadwearPremium,
  renameCharacterInputSchema,
  updateAppearanceInputSchema,
} from '@grodno/shared';
import { verifyPassword } from '../auth/passwords.js';

/**
 * Minimalny czas nieobecności (ms) aby wygenerować offline-summary modal.
 * Krótsze gaps = zwykła nawigacja / refresh / chwila uwagi na inną kartę.
 * 30 min czuje się jak „byłem gdzieś indziej" bez spamowania modalem przy
 * każdym powrocie do okna.
 */
const OFFLINE_SUMMARY_THRESHOLD_MS = 30 * 60 * 1000;
import { REGISTRY } from '../content/registry.js';
import {
  characterDungeonClears,
  characters,
  characterTracks,
  guilds,
  users,
} from '../db/schema.js';
import {
  aggregateBuffs,
  effectiveMax,
  loadActiveBuffs,
  purgeExpiredBuffs,
  type ActiveBuff,
} from '../game/buffs.js';
import { CLASS_PRESETS } from '../game/classes.js';
import { listUnlockedEnemySlugs } from '../game/dungeon-progress.js';
import { applyKeyRegen, DUNGEON_KEYS_MAX } from '../game/dungeon-keys.js';
import { xpToNext } from '../game/leveling.js';
import { getActiveMount } from '../game/mounts.js';
import { applyHpRegen, applyMpRegen } from '../game/regen.js';
import { applyStaminaRegen } from '../game/stamina.js';
import {
  SZCZUROGROD_PLUS_DURATION_DAYS,
  SZCZUROGROD_PLUS_PRICE_GEMS,
  extendSubscription,
} from '../game/subscription.js';
import { computeHealerCost, HEALER_COOLDOWN_MS } from '../game/tavern.js';
import { getKind as getWorkKind } from '../game/work.js';
import {
  applyTrackRegen,
  rollTrackEnemy,
  TRACK_SLOTS_MAX,
  trackExpiryFromNow,
} from '../game/tracks.js';
import { invalidateUserCache, protectedProcedure, router } from '../trpc/trpc.js';

/**
 * Sanity check: jeśli `appearance` zawiera premium headwear/armor którego brak
 * w `unlockedSlugs`, rzuca TRPC FORBIDDEN. Używane przy redoAppearance —
 * creator path osobno zeruje premium (gracz na starcie nie ma unlock'ów).
 */
function ensurePremiumUnlocked(
  appearance: Appearance,
  unlockedSlugs: readonly string[],
): void {
  const set = new Set(unlockedSlugs);
  if (isHeadwearPremium(appearance.headwear)) {
    const slug = cosmeticSlug('headwear', appearance.headwear);
    if (!set.has(slug)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Najpierw odblokuj nakrycie głowy w sklepie (${COSMETIC_UNLOCK_COST}💎).`,
      });
    }
  }
  if (isArmorPremium(appearance.armor)) {
    const slug = cosmeticSlug('armor', appearance.armor);
    if (!set.has(slug)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Najpierw odblokuj zbroję w sklepie (${COSMETIC_UNLOCK_COST}💎).`,
      });
    }
  }
}

/**
 * Wymusza że creator/sandbox path nie pozwala wybrać premium na starcie —
 * tworząca postać postać nie ma jeszcze gemów ani unlock'ów. Po stworzeniu
 * gracz idzie do gem-shop'u (ScreenChar → ZMIEŃ WYGLĄD → odblokuj).
 */
function rejectPremiumInCreator(appearance: Appearance): void {
  if (isHeadwearPremium(appearance.headwear)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'To nakrycie głowy wymaga odblokowania po stworzeniu postaci.',
    });
  }
  if (isArmorPremium(appearance.armor)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Ta zbroja wymaga odblokowania po stworzeniu postaci.',
    });
  }
}

interface RegenSnapshot {
  stamina: number;
  lastTickAt: Date;
  hp: number;
  mp: number;
  keys: number;
  lastKeyTickAt: Date;
}

function healerReadyAtMs(row: typeof characters.$inferSelect): number | null {
  if (!row.lastHealerAt) return null;
  const ready = row.lastHealerAt.getTime() + HEALER_COOLDOWN_MS;
  return ready > Date.now() ? ready : null;
}

import type { Db } from '../db/client.js';

/**
 * Pobiera snapshot gildii postaci dla me.get. Używa denormalizowanego
 * characters.guildId (nie JOIN) + jedno lookup na guilds dla name/tag.
 * Zwraca null gdy nie w gildii lub gildia disbandowana.
 */
async function fetchCharacterGuild(
  db: Db,
  guildId: string | null,
  guildRank: string | null,
): Promise<Character['guild']> {
  if (!guildId || !guildRank) return null;
  const [g] = await db
    .select({ id: guilds.id, name: guilds.name, tag: guilds.tag, disbandedAt: guilds.disbandedAt })
    .from(guilds)
    .where(eq(guilds.id, guildId))
    .limit(1);
  if (!g || g.disbandedAt) return null;
  return {
    id: g.id,
    name: g.name,
    tag: g.tag,
    rank: guildRank as 'leader' | 'officer' | 'member' | 'recruit',
  };
}

function activeMountFor(
  row: typeof characters.$inferSelect,
  now: Date,
): Character['activeMount'] {
  const tpl = getActiveMount(row, now);
  if (!tpl || !row.mountExpiresAt) return null;
  return {
    slug: tpl.slug,
    name: tpl.name,
    icon: tpl.icon,
    speedPct: tpl.speedPct,
    expiresAt: row.mountExpiresAt.getTime(),
  };
}

function workSnapshotFor(
  row: typeof characters.$inferSelect,
  now: Date,
): Character['work'] {
  if (!row.workStartedAt || !row.workEndsAt || !row.workKind) return null;
  const kind = getWorkKind(row.workKind);
  if (!kind) return null;
  const endsAt = row.workEndsAt.getTime();
  return {
    kindSlug: kind.slug,
    kindName: kind.name,
    endsAt,
    ready: now.getTime() >= endsAt,
  };
}

function rowToCharacter(
  row: typeof characters.$inferSelect,
  regen: RegenSnapshot,
  now: Date,
  offlineSummary: OfflineSummary | null = null,
  newTrackSlugs: string[] = [],
  guild: Character['guild'] = null,
  activeBuffs: readonly ActiveBuff[] = [],
): Character {
  // Efektywny hpMax/mpMax z uwzględnieniem aktywnych buff'ów %. HP/MP zostały
  // już wyklampowane do effective cap w caller'ze (żeby regen widział bufowany
  // sufit). Tu tylko wysyłamy klientowi spójny obraz.
  const deltas = aggregateBuffs(activeBuffs);
  const hpMaxEff = effectiveMax(row.hpMax, deltas.hpMaxPct);
  const mpMaxEff = effectiveMax(row.mpMax, deltas.mpMaxPct);
  return {
    id: row.id,
    name: row.name,
    cls: row.cls,
    lvl: row.lvl,
    xp: row.xp,
    xpMax: row.xpMax,
    hp: regen.hp,
    hpMax: hpMaxEff,
    mp: regen.mp,
    mpMax: mpMaxEff,
    gold: row.gold,
    gems: row.gems,
    scrap: row.scrap,
    stamina: regen.stamina,
    staminaMax: row.staminaMax,
    stats: row.stats,
    appearance: row.appearance,
    lastTickAt: regen.lastTickAt.getTime(),
    createdAt: row.createdAt.getTime(),
    healerCost: computeHealerCost(row.lvl),
    healerReadyAt: healerReadyAtMs(row),
    dungeonKeys: regen.keys,
    dungeonKeysMax: DUNGEON_KEYS_MAX,
    lastKeyTickAt: regen.lastKeyTickAt.getTime(),
    activeMount: activeMountFor(row, now),
    offlineSummary,
    newTrackSlugs,
    guild,
    work: workSnapshotFor(row, now),
    activeBuffs: activeBuffs.map((b) => ({
      kind: b.kind,
      magnitude: b.magnitude,
      expiresAt: b.expiresAt.getTime(),
      sourceItemId: b.sourceItemId,
      isCurse: b.isCurse,
    })),
    szczurogrodPlusUntil: row.szczurogrodPlusUntil ? row.szczurogrodPlusUntil.getTime() : null,
  };
}

export const meRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select()
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!row) return null;
    const now = new Date();
    // Snapshot dla offline-summary — obserwujemy co się zmieni przez regen.
    const elapsedMs = now.getTime() - row.lastSeenAt.getTime();
    const snapHp = row.hp;
    const snapMp = row.mp;
    const snapStamina = row.stamina;
    const snapKeys = row.dungeonKeys;
    const snapHealerWasOnCooldown =
      row.lastHealerAt !== null && row.lastHealerAt.getTime() + HEALER_COOLDOWN_MS > row.lastSeenAt.getTime();

    // Purge wygasłych buff'ów PRZED regen'em — regen powinien capować do cap'a
    // który faktycznie jest aktywny _teraz_. Wiersze z expiresAt < now znikają,
    // a `loadActiveBuffs` zwraca tylko to co dalej działa.
    await purgeExpiredBuffs(ctx.db, row.id, now);
    const activeBuffs = await loadActiveBuffs(ctx.db, row.id, now);
    const buffDeltas = aggregateBuffs(activeBuffs);
    const hpMaxEff = effectiveMax(row.hpMax, buffDeltas.hpMaxPct);
    const mpMaxEff = effectiveMax(row.mpMax, buffDeltas.mpMaxPct);
    // Lazy-clamp — gdy buff % właśnie wygasł, current HP/MP mogło być ponad
    // nowym capem; regen robi min(new + delta, cap) więc to już załatwia.

    const stam = applyStaminaRegen(row.stamina, row.staminaMax, row.lastTickAt, now);
    const hp = applyHpRegen(row.hp, hpMaxEff, row.lastHpTickAt, now);
    const mp = applyMpRegen(row.mp, mpMaxEff, row.lastMpTickAt, now);
    const keys = applyKeyRegen(row.dungeonKeys, DUNGEON_KEYS_MAX, row.lastKeyTickAt, now);

    // --- Tropy: usuń expired + auto-roll w pustych slotach ---
    await ctx.db
      .delete(characterTracks)
      .where(
        and(
          eq(characterTracks.characterId, row.id),
          lt(characterTracks.expiresAt, now),
        ),
      );
    const activeTracks = await ctx.db
      .select()
      .from(characterTracks)
      .where(eq(characterTracks.characterId, row.id));
    const trackRegen = applyTrackRegen(activeTracks.length, row.lastTrackRollAt, now);
    const newLastTrackRollAt = trackRegen.lastRollAt;
    let tracksActuallyRolled = 0;
    const rolledSlugs: string[] = [];
    if (trackRegen.gained > 0) {
      // Znajdź wolne sloty (0..2) i wypełnij nowymi tropami; pomiń mob slugi
      // już zajęte żeby uniknąć duplikatów. Filtruj do mobów z odblokowanych
      // lochów — gracz nie rolowal się trop'a na mobka z lochu za zamkniętą bramą.
      const clearRows = await ctx.db
        .select({ slug: characterDungeonClears.dungeonSlug })
        .from(characterDungeonClears)
        .where(eq(characterDungeonClears.characterId, row.id));
      const clearedSlugs = new Set(clearRows.map((r) => r.slug));
      const allowedSlugs = listUnlockedEnemySlugs(
        REGISTRY.dungeonsList,
        row.lvl,
        clearedSlugs,
      );
      const takenSlots = new Set(activeTracks.map((t) => t.slotIndex));
      const takenSlugs = activeTracks.map((t) => t.enemySlug);
      const freeSlots: number[] = [];
      for (let i = 0; i < TRACK_SLOTS_MAX; i += 1) {
        if (!takenSlots.has(i)) freeSlots.push(i);
      }
      const toPlace = Math.min(trackRegen.gained, freeSlots.length);
      for (let i = 0; i < toPlace; i += 1) {
        const slot = freeSlots[i];
        const newSlug = rollTrackEnemy(row.lvl, takenSlugs, allowedSlugs);
        if (!newSlug) break; // pool wyczerpany dla tego lvla
        takenSlugs.push(newSlug);
        await ctx.db.insert(characterTracks).values({
          characterId: row.id,
          slotIndex: slot,
          enemySlug: newSlug,
          expiresAt: trackExpiryFromNow(now),
        });
        tracksActuallyRolled += 1;
        rolledSlugs.push(newSlug);
      }
    }

    // Single combined UPDATE — one round-trip. Zawsze odświeżamy last_seen_at,
    // żeby przyszłe me.get liczyły delta od teraz.
    await ctx.db
      .update(characters)
      .set({
        stamina: stam.stamina,
        lastTickAt: stam.lastTickAt,
        hp: hp.value,
        lastHpTickAt: hp.lastTickAt,
        mp: mp.value,
        lastMpTickAt: mp.lastTickAt,
        dungeonKeys: keys.value,
        lastKeyTickAt: keys.lastTickAt,
        lastTrackRollAt: newLastTrackRollAt,
        lastSeenAt: now,
      })
      .where(eq(characters.id, row.id));

    // Offline summary — tylko gdy gracz był faktycznie poza (>= 30 min). Dla
    // powtarzających się me.get w tej samej sesji (tab focus, polling) elapsed
    // jest sekundami → null → klient nie pokazuje modala.
    let offlineSummary: OfflineSummary | null = null;
    if (elapsedMs >= OFFLINE_SUMMARY_THRESHOLD_MS) {
      const hpGained = Math.max(0, hp.value - snapHp);
      const mpGained = Math.max(0, mp.value - snapMp);
      const staminaGained = Math.max(0, stam.stamina - snapStamina);
      const keysGained = Math.max(0, keys.value - snapKeys);
      const healerNowReady =
        snapHealerWasOnCooldown &&
        (row.lastHealerAt === null ||
          row.lastHealerAt.getTime() + HEALER_COOLDOWN_MS <= now.getTime());
      // Summary tylko jeśli faktycznie coś się zmieniło — gracz offline z
      // pełnym paskiem nie dostaje modala z samymi zerami.
      const anythingGained =
        hpGained > 0 ||
        mpGained > 0 ||
        staminaGained > 0 ||
        keysGained > 0 ||
        tracksActuallyRolled > 0 ||
        healerNowReady;
      if (anythingGained) {
        offlineSummary = {
          awayMs: elapsedMs,
          hpGained,
          mpGained,
          staminaGained,
          keysGained,
          tracksRolled: tracksActuallyRolled,
          healerReady: healerNowReady,
        };
      }
    }

    const guild = await fetchCharacterGuild(ctx.db, row.guildId, row.guildRank);
    return rowToCharacter(
      row,
      {
        stamina: stam.stamina,
        lastTickAt: stam.lastTickAt,
        hp: hp.value,
        mp: mp.value,
        keys: keys.value,
        lastKeyTickAt: keys.lastTickAt,
      },
      now,
      offlineSummary,
      rolledSlugs,
      guild,
      activeBuffs,
    );
  }),

  createCharacter: protectedProcedure
    .input(createCharacterInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({ id: characters.id })
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);
      if (existing.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Character already exists for this account',
        });
      }
      // Premium kosmetyki niedostępne na creatorze — gracz dopiero idzie do gem-shop'u.
      rejectPremiumInCreator(input.appearance);
      const preset = CLASS_PRESETS[input.cls];
      const startingGold = input.bonus === 'gold' ? 500 : 0;
      const startingGems = input.bonus === 'gems' ? 100 : 0;
      const now = new Date();
      const [row] = await ctx.db
        .insert(characters)
        .values({
          userId: ctx.userId,
          name: input.name,
          cls: input.cls,
          stats: preset.stats,
          // L1 starter — xpMax must track the leveling curve, not the 1000
          // column default inherited from the original schema.
          lvl: 1,
          xp: 0,
          xpMax: xpToNext(1),
          hp: preset.hp,
          hpMax: preset.hp,
          mp: preset.mp,
          mpMax: preset.mp,
          stamina: preset.stamina,
          staminaMax: preset.stamina,
          gold: startingGold,
          gems: startingGems,
          appearance: { ...input.appearance, unlockedCosmetics: [] },
          lastTickAt: now,
        })
        .returning();
      // New character gets 3 świeże tropy od razu — dobry onboarding, widzi
      // mechanikę od pierwszej wizyty w lochu. `rollTrackEnemy` filtruje do
      // mobów na jego poziomie i z odblokowanych lochów (L1 → Piwnice mobs only).
      const starterAllowed = listUnlockedEnemySlugs(
        REGISTRY.dungeonsList,
        row.lvl,
        new Set<string>(),
      );
      const takenSlugs: string[] = [];
      for (let slot = 0; slot < TRACK_SLOTS_MAX; slot += 1) {
        const slug = rollTrackEnemy(row.lvl, takenSlugs, starterAllowed);
        if (!slug) break;
        takenSlugs.push(slug);
        await ctx.db.insert(characterTracks).values({
          characterId: row.id,
          slotIndex: slot,
          enemySlug: slug,
          expiresAt: trackExpiryFromNow(now),
        });
      }
      // New character: no companion, no regen progress yet. Starts with full
      // key pool so the player can jump into combat immediately.
      return rowToCharacter(
        row,
        {
          stamina: row.stamina,
          lastTickAt: row.lastTickAt,
          hp: row.hp,
          mp: row.mp,
          keys: row.dungeonKeys,
          lastKeyTickAt: row.lastKeyTickAt,
        },
        now,
      );
    }),

  updateAppearance: protectedProcedure
    .input(updateAppearanceInputSchema)
    .mutation(async ({ ctx, input }) => {
      // Walidacja premium — używamy listy unlock'ów z DB, nie z input'a (klient
      // mógłby próbować podstawić własne).
      const [existing] = await ctx.db
        .select({ appearance: characters.appearance })
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
      }
      const existingUnlocked =
        (existing.appearance as Appearance | null)?.unlockedCosmetics ?? [];
      ensurePremiumUnlocked(input.appearance, existingUnlocked);
      const merged: Appearance = {
        ...input.appearance,
        unlockedCosmetics: existingUnlocked,
      };
      const [row] = await ctx.db
        .update(characters)
        .set({ appearance: merged, updatedAt: new Date() })
        .where(eq(characters.userId, ctx.userId))
        .returning();
      if (!row) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
      }
      const now = new Date();
      const activeBuffs = await loadActiveBuffs(ctx.db, row.id, now);
      const buffDeltas = aggregateBuffs(activeBuffs);
      const stam = applyStaminaRegen(row.stamina, row.staminaMax, row.lastTickAt, now);
      const hp = applyHpRegen(
        row.hp,
        effectiveMax(row.hpMax, buffDeltas.hpMaxPct),
        row.lastHpTickAt,
        now,
      );
      const mp = applyMpRegen(
        row.mp,
        effectiveMax(row.mpMax, buffDeltas.mpMaxPct),
        row.lastMpTickAt,
        now,
      );
      const keys = applyKeyRegen(row.dungeonKeys, DUNGEON_KEYS_MAX, row.lastKeyTickAt, now);
      return rowToCharacter(
        row,
        {
          stamina: stam.stamina,
          lastTickAt: stam.lastTickAt,
          hp: hp.value,
          mp: mp.value,
          keys: keys.value,
          lastKeyTickAt: keys.lastTickAt,
        },
        now,
        null,
        [],
        null,
        activeBuffs,
      );
    }),

  /**
   * Gem sink: instant refill +10 stamina. Uchronia przed czekaniem regen'u
   * (15s/stamina = 2.5 min dla +10). Cap na `staminaMax` — nie przebija.
   */
  refillStamina: protectedProcedure.mutation(async ({ ctx }) => {
    const [char] = await ctx.db
      .select()
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });
    const cost = GEM_SINK_COSTS.staminaRefill;
    if (char.gems < cost) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Brak gemów (${cost}).` });
    }
    if (char.stamina >= char.staminaMax) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Stamina już pełna.' });
    }
    const now = new Date();
    const newStamina = Math.min(char.staminaMax, char.stamina + STAMINA_REFILL_AMOUNT);
    await ctx.db
      .update(characters)
      .set({
        gems: sql`${characters.gems} - ${cost}`,
        stamina: newStamina,
        lastTickAt: now,
      })
      .where(eq(characters.id, char.id));
    return { ok: true, cost, stamina: newStamina };
  }),

  /**
   * Gem sink: zmiana imienia postaci. Cooldown 30 dni, unique name globally.
   * Koszt w gemach.
   */
  rename: protectedProcedure
    .input(renameCharacterInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [char] = await ctx.db
        .select()
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);
      if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });
      const cost = GEM_SINK_COSTS.renameCharacter;
      if (char.gems < cost) {
        throw new TRPCError({ code: 'FORBIDDEN', message: `Brak gemów (${cost}).` });
      }
      const now = new Date();
      if (char.lastRenameAt) {
        const cooldownEnd = char.lastRenameAt.getTime() + RENAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
        if (cooldownEnd > now.getTime()) {
          const daysLeft = Math.ceil((cooldownEnd - now.getTime()) / (24 * 60 * 60 * 1000));
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Jeszcze ${daysLeft} dni cooldownu.`,
          });
        }
      }
      const newName = input.name.trim();
      if (newName === char.name) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'To samo imię.' });
      }
      const [clash] = await ctx.db
        .select({ id: characters.id })
        .from(characters)
        .where(and(eq(characters.name, newName), ne(characters.id, char.id)))
        .limit(1);
      if (clash) {
        throw new TRPCError({ code: 'CONFLICT', message: 'To imię jest zajęte.' });
      }
      await ctx.db
        .update(characters)
        .set({
          name: newName,
          gems: sql`${characters.gems} - ${cost}`,
          lastRenameAt: now,
          updatedAt: now,
        })
        .where(eq(characters.id, char.id));
      return { ok: true, cost, name: newName };
    }),

  /**
   * Gem sink: zmiana wyglądu (hair/eyes/skin/accessory) po stworzeniu postaci.
   * `updateAppearance` jest free dla creator step; ten endpoint dodaje gem cost
   * dla post-creation cosmetic changes. Bez cooldownu — jeśli ktoś chce
   * codziennie inną fryzurę za 25💎, może.
   */
  redoAppearance: protectedProcedure
    .input(updateAppearanceInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [char] = await ctx.db
        .select({
          id: characters.id,
          gems: characters.gems,
          appearance: characters.appearance,
        })
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);
      if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });
      const cost = GEM_SINK_COSTS.redoAppearance;
      if (char.gems < cost) {
        throw new TRPCError({ code: 'FORBIDDEN', message: `Brak gemów (${cost}).` });
      }
      const existingUnlocked = (char.appearance as Appearance | null)?.unlockedCosmetics ?? [];
      ensurePremiumUnlocked(input.appearance, existingUnlocked);
      const merged: Appearance = {
        ...input.appearance,
        unlockedCosmetics: existingUnlocked,
      };
      await ctx.db
        .update(characters)
        .set({
          appearance: merged,
          gems: sql`${characters.gems} - ${cost}`,
          updatedAt: new Date(),
        })
        .where(eq(characters.id, char.id));
      return { ok: true, cost };
    }),

  /**
   * Permanent unlock kosmetyku premium za gemy. Slug w formacie
   * `headwear:<style>` lub `armor:<style>`. Po unlock'u gracz może swobodnie
   * używać tego cosmeticu w `redoAppearance`/`updateAppearance` bez dodatkowych
   * opłat. Idempotentny — drugi unlock tego samego slug'a zwraca `alreadyOwned`
   * bez deductu.
   */
  unlockCosmetic: protectedProcedure
    .input(
      z.object({
        slug: z
          .string()
          .regex(/^(headwear|armor):[a-zA-Z]+$/, 'Niepoprawny slug kosmetyku.'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [char] = await ctx.db
        .select({
          id: characters.id,
          gems: characters.gems,
          appearance: characters.appearance,
        })
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);
      if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });

      // Walidacja slug'a po stronie serwera — klient może wysłać dowolny string.
      const [kindRaw, valueRaw] = input.slug.split(':');
      let isValid = false;
      if (kindRaw === 'headwear' && PREMIUM_HEADWEARS.has(valueRaw as HeadwearStyle)) {
        isValid = true;
      } else if (kindRaw === 'armor' && PREMIUM_ARMORS.has(valueRaw as ArmorStyle)) {
        isValid = true;
      }
      if (!isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Nieznany lub niepremium kosmetyk.',
        });
      }

      const appearance = (char.appearance as Appearance | null) ?? null;
      const existingUnlocked = appearance?.unlockedCosmetics ?? [];
      if (existingUnlocked.includes(input.slug)) {
        return { ok: true, alreadyOwned: true, cost: 0, slug: input.slug };
      }

      const cost = COSMETIC_UNLOCK_COST;
      if (char.gems < cost) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Brak gemów (${cost}). Masz ${char.gems}.`,
        });
      }

      const newUnlocked = [...existingUnlocked, input.slug];
      const newAppearance: Appearance = {
        ...APPEARANCE_DEFAULTS,
        ...(appearance ?? {}),
        unlockedCosmetics: newUnlocked,
      };

      await ctx.db
        .update(characters)
        .set({
          appearance: newAppearance,
          gems: sql`${characters.gems} - ${cost}`,
          updatedAt: new Date(),
        })
        .where(eq(characters.id, char.id));

      return { ok: true, alreadyOwned: false, cost, slug: input.slug };
    }),

  /**
   * GDPR Art. 17 — right to erasure. Kasuje konto + wszystkie powiązane dane.
   *
   * Wymaga hasła dla nie-gości (verify zanim cokolwiek skasujemy). Gracze
   * goście potwierdzają tylko polem `confirm: 'USUŃ'`.
   *
   * Cascade chain (FK ON DELETE CASCADE):
   *   users → refreshTokens, characters
   *   characters → wszystkie character_* + arena/guild membership/chronicle/etc.
   *
   * Edge cases obsłużone ręcznie:
   * 1. Aktywny lider gildii (disbandedAt IS NULL) → blokujemy. Gracz musi
   *    najpierw przekazać przywództwo (`guild.transferLeader`) lub rozwiązać
   *    gildię (`guild.disband`). FK na guilds.leader_char_id ma ON DELETE
   *    RESTRICT — bez tego cascade by się wywalił.
   * 2. Lider rozwiązanej gildii (disbandedAt IS NOT NULL) → hard-delete
   *    gildię razem z kontem. Disbandowana gildia jest niedostępna dla nikogo,
   *    cascade kasuje chat/wojny/rajdy/budynki — ostatecznie zwalnia FK.
   *
   * Po skasowaniu klient powinien wyczyścić auth store i wrócić na splash.
   */
  deleteAccount: protectedProcedure
    .input(deleteAccountInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [user] = await ctx.db
        .select({ id: users.id, isGuest: users.isGuest, passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.id, ctx.userId))
        .limit(1);
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Konto nie istnieje.' });
      }

      if (!user.isGuest) {
        if (!input.password || !user.passwordHash) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Wpisz hasło aby potwierdzić usunięcie konta.',
          });
        }
        const ok = await verifyPassword(user.passwordHash, input.password);
        if (!ok) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Nieprawidłowe hasło.' });
        }
      }

      const [char] = await ctx.db
        .select({ id: characters.id })
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);

      if (char) {
        const ledGuilds = await ctx.db
          .select({ id: guilds.id, disbandedAt: guilds.disbandedAt })
          .from(guilds)
          .where(eq(guilds.leaderCharId, char.id));

        const activeLed = ledGuilds.find((g) => g.disbandedAt === null);
        if (activeLed) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message:
              'Jesteś liderem gildii. Najpierw przekaż przywództwo lub rozwiąż gildię.',
          });
        }

        // Disbandowane gildie z tym graczem jako leaderCharId — hard delete
        // żeby zwolnić FK RESTRICT. Cascade czyści chat/wojny/rajdy.
        for (const g of ledGuilds) {
          await ctx.db.delete(guilds).where(eq(guilds.id, g.id));
        }
      }

      await ctx.db.delete(users).where(eq(users.id, ctx.userId));
      invalidateUserCache(ctx.userId);

      return { ok: true };
    }),

  /**
   * Gem sink: kupno / przedłużenie Szczurogród+ (200💎 → +30 dni).
   * Stack do MAX 90 dni od chwili zakupu (anti-hoard). Aktywna subskrypcja
   * nadaje +20% XP do każdego gain'u (quests, combat, daily, work, oracle,
   * season pass, survivor idle XP).
   */
  buySzczurogrodPlus: protectedProcedure.mutation(async ({ ctx }) => {
    const [char] = await ctx.db
      .select({
        id: characters.id,
        gems: characters.gems,
        szczurogrodPlusUntil: characters.szczurogrodPlusUntil,
      })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });
    const cost = SZCZUROGROD_PLUS_PRICE_GEMS;
    if (char.gems < cost) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Brak gemów (${cost}).` });
    }
    const now = new Date();
    const newUntil = extendSubscription(
      char.szczurogrodPlusUntil,
      SZCZUROGROD_PLUS_DURATION_DAYS,
      now,
    );
    if (newUntil.getTime() <= (char.szczurogrodPlusUntil?.getTime() ?? 0)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Subskrypcja na maksymalnym poziomie (90 dni). Wróć później.',
      });
    }
    await ctx.db
      .update(characters)
      .set({
        gems: sql`${characters.gems} - ${cost}`,
        szczurogrodPlusUntil: newUntil,
        updatedAt: now,
      })
      .where(eq(characters.id, char.id));
    return { ok: true as const, cost, szczurogrodPlusUntil: newUntil.getTime() };
  }),
});
