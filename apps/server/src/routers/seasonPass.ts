// Season Pass router — status, claim, buyPremium.
//
// Monthly reset: status jako pierwszy używa currentSeasonStart() i jeśli row
// dla bieżącego seasonStart nie istnieje → INSERT z zerowymi wartościami.
// Poprzednie sezony zostają w DB jako historia (nie czyścimy, taniutko —
// <50 wierszy per rok per player).

import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import {
  seasonPassClaimInputSchema,
  type SeasonPassBuyPremiumResponse,
  type SeasonPassClaimResponse,
  type SeasonPassStatusResponse,
} from '@grodno/shared';
import { characterItems, characters, characterSeasonPass } from '../db/schema.js';
import {
  BAG_CAP,
  getBagCount,
  insertOrStackPotion,
  itemTemplateToRowValues,
} from '../game/inventory.js';
import { REGISTRY } from '../content/registry.js';
import { applyXpGain, summarizeLevelUps } from '../game/leveling.js';
import { registerScrapbookFind } from '../game/scrapbook.js';
import { applyXpBonus } from '../game/subscription.js';
import {
  FREE_TRACK,
  PREMIUM_TRACK,
  SEASON_PASS_PREMIUM_COST_GEMS,
  currentSeasonStart,
  getTierReward,
  isTierClaimed,
  markTierClaimed,
  tierFromXp,
  xpRequiredForTier,
} from '../game/season-pass.js';
import { protectedProcedure, router } from '../trpc/trpc.js';
import type { Db } from '../db/client.js';

/** Unix ms pierwszego dnia następnego miesiąca UTC — koniec bieżącego sezonu. */
function seasonEndAtMs(now: Date = new Date()): number {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  return Date.UTC(y, m + 1, 1, 0, 0, 0, 0);
}

/**
 * Upsert wiersza season_pass dla aktualnego sezonu. Zwraca aktualny stan.
 * Jeżeli gracz nie ma row'a dla tego miesiąca — tworzy fresh (xp=0, bitmaps=0).
 * Po zmianie miesiąca stary wiersz zostaje w DB (historia, taniutko).
 */
export async function ensureCurrentSeasonPass(
  db: Pick<Db, 'select' | 'insert'>,
  characterId: string,
  now: Date = new Date(),
) {
  const seasonStart = currentSeasonStart(now);
  const [existing] = await db
    .select()
    .from(characterSeasonPass)
    .where(
      and(
        eq(characterSeasonPass.characterId, characterId),
        eq(characterSeasonPass.seasonStart, seasonStart),
      ),
    )
    .limit(1);
  if (existing) return existing;
  // Fresh row — user's pierwsze wejście w tym miesiącu lub pierwszy ever.
  await db
    .insert(characterSeasonPass)
    .values({
      characterId,
      seasonStart,
      xp: 0,
      isPremium: false,
      claimedFreeBitmap: 0,
      claimedPremiumBitmap: 0,
    })
    .onConflictDoNothing();
  const [fresh] = await db
    .select()
    .from(characterSeasonPass)
    .where(
      and(
        eq(characterSeasonPass.characterId, characterId),
        eq(characterSeasonPass.seasonStart, seasonStart),
      ),
    )
    .limit(1);
  return fresh!;
}

/**
 * Hook wywoływany z combat/quests routerów: dodaje XP do Season Pass.
 * Transparentne dla CALLER'a — idempotentne na racach (jeden UPDATE).
 * Nie rzuca błędów; loguje i przepuszcza (XP pass to nie krytyczna ścieżka).
 */
export async function addSeasonPassXp(
  db: Pick<Db, 'select' | 'insert' | 'update'>,
  characterId: string,
  xpDelta: number,
  now: Date = new Date(),
): Promise<void> {
  if (xpDelta <= 0) return;
  try {
    const row = await ensureCurrentSeasonPass(db, characterId, now);
    await db
      .update(characterSeasonPass)
      .set({ xp: row.xp + xpDelta, updatedAt: now })
      .where(
        and(
          eq(characterSeasonPass.characterId, characterId),
          eq(characterSeasonPass.seasonStart, row.seasonStart),
        ),
      );
  } catch (err) {
    console.warn('[season-pass] addSeasonPassXp failed', err);
  }
}

export const seasonPassRouter = router({
  status: protectedProcedure.query(async ({ ctx }): Promise<SeasonPassStatusResponse> => {
    const [char] = await ctx.db
      .select({ id: characters.id })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });

    const row = await ensureCurrentSeasonPass(ctx.db, char.id);
    return {
      seasonStart: row.seasonStart,
      xp: row.xp,
      currentTier: tierFromXp(row.xp),
      isPremium: row.isPremium,
      freeTrack: FREE_TRACK.map((t) => ({
        gold: t.gold,
        gems: t.gems,
        xp: t.xp,
        keys: t.keys,
        itemName: t.itemName,
        itemIcon: t.itemIcon,
        itemRarity: t.itemRarity,
      })),
      premiumTrack: PREMIUM_TRACK.map((t) => ({
        gold: t.gold,
        gems: t.gems,
        xp: t.xp,
        keys: t.keys,
        itemName: t.itemName,
        itemIcon: t.itemIcon,
        itemRarity: t.itemRarity,
      })),
      claimedFreeBitmap: row.claimedFreeBitmap,
      claimedPremiumBitmap: row.claimedPremiumBitmap,
      premiumCostGems: SEASON_PASS_PREMIUM_COST_GEMS,
      seasonEndAt: seasonEndAtMs(),
    };
  }),

  claim: protectedProcedure
    .input(seasonPassClaimInputSchema)
    .mutation(async ({ ctx, input }): Promise<SeasonPassClaimResponse> => {
      const [char] = await ctx.db
        .select()
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);
      if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });

      const row = await ensureCurrentSeasonPass(ctx.db, char.id);

      // Walidacja: (1) tier osiągnięty, (2) odpowiedni track, (3) nie claim'owany.
      const requiredXp = xpRequiredForTier(input.tier);
      if (row.xp < requiredXp) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Za mało XP (${row.xp}/${requiredXp}). Walcz więcej.`,
        });
      }
      if (input.track === 'premium' && !row.isPremium) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Premium track wymaga wykupienia sezonowego przepustki.',
        });
      }
      const bitmap =
        input.track === 'free' ? row.claimedFreeBitmap : row.claimedPremiumBitmap;
      if (isTierClaimed(bitmap, input.tier)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Tier ${input.tier} (${input.track}) już odebrany.`,
        });
      }
      const reward = getTierReward(input.tier, input.track);
      if (!reward) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Nieznany tier.' });
      }

      // Apply reward atomowo.
      let newGold = char.gold;
      let newGems = char.gems;
      let levelUpInfo: SeasonPassClaimResponse['levelUp'] = null;

      await ctx.db.transaction(async (tx) => {
        // 1. Mark tier claim'ed w bitmapie.
        const field =
          input.track === 'free'
            ? characterSeasonPass.claimedFreeBitmap
            : characterSeasonPass.claimedPremiumBitmap;
        const newBitmap = markTierClaimed(bitmap, input.tier);
        await tx
          .update(characterSeasonPass)
          .set({
            [input.track === 'free' ? 'claimedFreeBitmap' : 'claimedPremiumBitmap']: newBitmap,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(characterSeasonPass.characterId, char.id),
              eq(characterSeasonPass.seasonStart, row.seasonStart),
            ),
          );
        void field;

        // 2. Gold/gems → characters.
        const goldDelta = reward.gold ?? 0;
        const gemsDelta = reward.gems ?? 0;
        newGold = char.gold + goldDelta;
        newGems = char.gems + gemsDelta;
        const keysDelta = reward.keys ?? 0;
        await tx
          .update(characters)
          .set({
            gold: newGold,
            gems: newGems,
            dungeonKeys: char.dungeonKeys + keysDelta,
            updatedAt: new Date(),
          })
          .where(eq(characters.id, char.id));

        // 3. XP z level-up cascade.
        if (reward.xp && reward.xp > 0) {
          const xpGain = applyXpBonus(char, reward.xp);
          const { progression, ups } = applyXpGain(
            {
              cls: char.cls,
              lvl: char.lvl,
              xp: char.xp,
              xpMax: char.xpMax,
              hp: char.hp,
              hpMax: char.hpMax,
              mp: char.mp,
              mpMax: char.mpMax,
              stamina: char.stamina,
              staminaMax: char.staminaMax,
            },
            xpGain,
          );
          await tx
            .update(characters)
            .set({
              lvl: progression.lvl,
              xp: progression.xp,
              xpMax: progression.xpMax,
              hp: progression.hp,
              hpMax: progression.hpMax,
              mp: progression.mp,
              mpMax: progression.mpMax,
              stamina: progression.stamina,
              staminaMax: progression.staminaMax,
              updatedAt: new Date(),
            })
            .where(eq(characters.id, char.id));
          const summary = summarizeLevelUps(ups);
          if (summary) levelUpInfo = summary;
        }

        // 4. Item — registered w REGISTRY przez content-hash nazwy.
        if (reward.itemName && reward.itemIcon && reward.itemRarity) {
          // Szukamy item template po nazwie; seed.ts hydruje SP items.
          const tpl = [...REGISTRY.items.values()].find(
            (i) => i.name === reward.itemName && i.rarity === reward.itemRarity,
          );
          if (tpl) {
            if (tpl.slot === 'potion') {
              const stored = await insertOrStackPotion(tx, char.id, tpl.id, 'daily');
              if (stored) await registerScrapbookFind(tx, char.id, tpl.id);
            } else if ((await getBagCount(tx, char.id)) < BAG_CAP) {
              await tx.insert(characterItems).values(itemTemplateToRowValues(tpl, char.id, 'daily'));
              await registerScrapbookFind(tx, char.id, tpl.id);
            }
            // Jeśli plecak pełny → item przepada. Gracz może claim'ować później.
            // (Alternative: fallback na 500g. MVP — prosty drop.)
          }
        }
      });

      return {
        ok: true as const,
        reward: {
          gold: reward.gold,
          gems: reward.gems,
          xp: reward.xp,
          keys: reward.keys,
          itemName: reward.itemName,
          itemIcon: reward.itemIcon,
          itemRarity: reward.itemRarity,
        },
        newXp: row.xp,
        newGold,
        newGems,
        levelUp: levelUpInfo,
      };
    }),

  buyPremium: protectedProcedure.mutation(
    async ({ ctx }): Promise<SeasonPassBuyPremiumResponse> => {
      const [char] = await ctx.db
        .select()
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);
      if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });

      const row = await ensureCurrentSeasonPass(ctx.db, char.id);
      if (row.isPremium) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Premium już aktywny w tym sezonie.',
        });
      }
      if (char.gems < SEASON_PASS_PREMIUM_COST_GEMS) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Brak gemów (${SEASON_PASS_PREMIUM_COST_GEMS}). Masz ${char.gems}.`,
        });
      }

      const newGems = char.gems - SEASON_PASS_PREMIUM_COST_GEMS;
      await ctx.db.transaction(async (tx) => {
        await tx
          .update(characterSeasonPass)
          .set({ isPremium: true, updatedAt: new Date() })
          .where(
            and(
              eq(characterSeasonPass.characterId, char.id),
              eq(characterSeasonPass.seasonStart, row.seasonStart),
            ),
          );
        await tx
          .update(characters)
          .set({ gems: newGems, updatedAt: new Date() })
          .where(eq(characters.id, char.id));
      });

      return { ok: true as const, newGems };
    },
  ),
});
