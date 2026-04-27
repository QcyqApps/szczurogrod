import { TRPCError } from '@trpc/server';
import { and, eq, gt } from 'drizzle-orm';
import type { Track, TrackListResponse } from '@grodno/shared';
import { trackRerollInputSchema } from '@grodno/shared';
import { REGISTRY } from '../content/registry.js';
import {
  characterDungeonClears,
  characters,
  characterTracks,
} from '../db/schema.js';
import { listUnlockedEnemySlugs } from '../game/dungeon-progress.js';
import {
  rollTrackEnemy,
  TRACK_REROLL_GEM_COST,
  TRACK_ROLL_INTERVAL_MS,
  TRACK_SLOTS_MAX,
  trackExpiryFromNow,
} from '../game/tracks.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

function rowToTrack(
  row: typeof characterTracks.$inferSelect,
): Track | null {
  const enemy = REGISTRY.enemies.get(row.enemySlug);
  if (!enemy) return null; // templates deleted w CMS — filtrujemy out
  return {
    slot: row.slotIndex,
    enemySlug: row.enemySlug,
    enemyName: enemy.name,
    enemyTier: enemy.tier,
    expiresAt: row.expiresAt.getTime(),
  };
}

export const tracksRouter = router({
  list: protectedProcedure.query(async ({ ctx }): Promise<TrackListResponse> => {
    const [char] = await ctx.db
      .select({ id: characters.id, lastTrackRollAt: characters.lastTrackRollAt })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) {
      return {
        tracks: [],
        slotsMax: TRACK_SLOTS_MAX,
        rerollCost: TRACK_REROLL_GEM_COST,
        nextRollAt: null,
      };
    }
    // Zwracamy tylko nie-wygasłe; me.get i tak usuwa stare, ale `list` wołany
    // niezależnie — filtrujemy defensywnie.
    const rows = await ctx.db
      .select()
      .from(characterTracks)
      .where(
        and(
          eq(characterTracks.characterId, char.id),
          gt(characterTracks.expiresAt, new Date()),
        ),
      );
    const tracks = rows
      .map(rowToTrack)
      .filter((t): t is Track => t !== null)
      .sort((a, b) => a.slot - b.slot);
    // `nextRollAt` = kiedy następny pusty slot dostanie trop. Null jeśli
    // wszystko pełne (nic się nie dzieje — applyTrackRegen zresetuje wtedy
    // timestamp na me.get'cie). Gdy saldo < max: lastTrackRollAt + 1h.
    const nextRollAt =
      tracks.length < TRACK_SLOTS_MAX
        ? char.lastTrackRollAt.getTime() + TRACK_ROLL_INTERVAL_MS
        : null;
    return {
      tracks,
      slotsMax: TRACK_SLOTS_MAX,
      rerollCost: TRACK_REROLL_GEM_COST,
      nextRollAt,
    };
  }),

  reroll: protectedProcedure
    .input(trackRerollInputSchema)
    .mutation(async ({ ctx, input }): Promise<Track> => {
      const [char] = await ctx.db
        .select()
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);
      if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
      if (char.gems < TRACK_REROLL_GEM_COST) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Za mało gemów (potrzeba ${TRACK_REROLL_GEM_COST}).`,
        });
      }

      // Zobacz pozostałe aktywne tropy żeby nie wylosować duplikatu.
      const activeRows = await ctx.db
        .select()
        .from(characterTracks)
        .where(
          and(
            eq(characterTracks.characterId, char.id),
            gt(characterTracks.expiresAt, new Date()),
          ),
        );
      const otherSlugs = activeRows
        .filter((r) => r.slotIndex !== input.slot)
        .map((r) => r.enemySlug);
      // Filtruj po odblokowanych lochach — reroll nie "obchodzi" chain unlock.
      const clearRows = await ctx.db
        .select({ slug: characterDungeonClears.dungeonSlug })
        .from(characterDungeonClears)
        .where(eq(characterDungeonClears.characterId, char.id));
      const clearedSlugs = new Set(clearRows.map((r) => r.slug));
      const allowedSlugs = listUnlockedEnemySlugs(
        REGISTRY.dungeonsList,
        char.lvl,
        clearedSlugs,
      );
      const newSlug = rollTrackEnemy(char.lvl, otherSlugs, allowedSlugs);
      if (!newSlug) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Brak dostępnych potworów do wytropienia.',
        });
      }

      const now = new Date();
      const expires = trackExpiryFromNow(now);

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(characters)
          .set({ gems: char.gems - TRACK_REROLL_GEM_COST, updatedAt: now })
          .where(eq(characters.id, char.id));
        // Upsert — slot może być pusty albo miał inny trop.
        await tx
          .insert(characterTracks)
          .values({
            characterId: char.id,
            slotIndex: input.slot,
            enemySlug: newSlug,
            expiresAt: expires,
          })
          .onConflictDoUpdate({
            target: [characterTracks.characterId, characterTracks.slotIndex],
            set: { enemySlug: newSlug, expiresAt: expires, createdAt: now },
          });
      });

      const enemy = REGISTRY.enemies.get(newSlug);
      if (!enemy) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Enemy vanished mid-reroll' });
      }
      return {
        slot: input.slot,
        enemySlug: newSlug,
        enemyName: enemy.name,
        enemyTier: enemy.tier,
        expiresAt: expires.getTime(),
      };
    }),
});
