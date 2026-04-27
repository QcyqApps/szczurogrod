// Blacksmith router — Kowal Zygmunt (Priorytet 6).
//
// 3 endpointy: preview, dismantle, upgrade.
//
// - preview: pokazuje next level cost + success rate + current/next stats.
// - dismantle: sprzedaje item za scrap (rarity × 1/3/8/20). Usuwa row z bag.
// - upgrade: increment enhancement level. Bezpieczne 1..6, 7..10 może failować
//   (item nie znika — po prostu nie upgrade'uje). Gem guarantee (5g) zawsze
//   succeedd.

import { TRPCError } from '@trpc/server';
import { and, eq, sql } from 'drizzle-orm';
import type {
  BlacksmithDismantleResponse,
  BlacksmithPreviewResponse,
  BlacksmithUpgradeResponse,
  Rarity,
} from '@grodno/shared';
import {
  blacksmithDismantleInputSchema,
  blacksmithPreviewInputSchema,
  blacksmithUpgradeInputSchema,
} from '@grodno/shared';
import { characterItems, characters } from '../db/schema.js';
import {
  GEM_GUARANTEE_COST,
  applyEnhancementToStats,
  computeDismantleScrap,
  computeUpgradeCost,
  computeUpgradeSuccessRate,
  rollUpgradeSuccess,
} from '../game/blacksmith.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

async function requireChar(
  db: import('../db/client.js').Db,
  userId: string,
): Promise<typeof characters.$inferSelect> {
  const [char] = await db.select().from(characters).where(eq(characters.userId, userId)).limit(1);
  if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });
  return char;
}

async function requireItem(
  db: import('../db/client.js').Db,
  characterId: string,
  itemId: string,
): Promise<typeof characterItems.$inferSelect> {
  const [item] = await db
    .select()
    .from(characterItems)
    .where(and(eq(characterItems.id, itemId), eq(characterItems.characterId, characterId)))
    .limit(1);
  if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'Przedmiot nieznaleziony.' });
  if (item.slot === 'potion') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Potiony nie są obsługiwane u Kowala.',
    });
  }
  return item;
}

export const blacksmithRouter = router({
  preview: protectedProcedure
    .input(blacksmithPreviewInputSchema)
    .query(async ({ ctx, input }): Promise<BlacksmithPreviewResponse> => {
      const char = await requireChar(ctx.db, ctx.userId);
      const item = await requireItem(ctx.db, char.id, input.itemId);
      const current = applyEnhancementToStats(item, item.enhancementLevel);
      const cost = computeUpgradeCost(item.enhancementLevel);
      const next = cost ? applyEnhancementToStats(item, item.enhancementLevel + 1) : null;
      return {
        currentLevel: item.enhancementLevel,
        currentStats: current,
        nextStats: next,
        cost,
        successRate: computeUpgradeSuccessRate(item.enhancementLevel),
        gemGuaranteeCost: GEM_GUARANTEE_COST,
        scrapOwned: char.scrap,
        goldOwned: char.gold,
        gemsOwned: char.gems,
      };
    }),

  dismantle: protectedProcedure
    .input(blacksmithDismantleInputSchema)
    .mutation(async ({ ctx, input }): Promise<BlacksmithDismantleResponse> => {
      const char = await requireChar(ctx.db, ctx.userId);
      const item = await requireItem(ctx.db, char.id, input.itemId);
      if (item.equippedSlot !== null) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Najpierw zdejmij przedmiot z postaci.',
        });
      }
      const scrapGained = computeDismantleScrap(item.rarity as Rarity);

      let totalScrap = 0;
      await ctx.db.transaction(async (tx) => {
        await tx.delete(characterItems).where(eq(characterItems.id, item.id));
        const [updated] = await tx
          .update(characters)
          .set({
            scrap: sql`${characters.scrap} + ${scrapGained}`,
            updatedAt: new Date(),
          })
          .where(eq(characters.id, char.id))
          .returning({ scrap: characters.scrap });
        totalScrap = updated?.scrap ?? char.scrap + scrapGained;
      });

      return { ok: true, scrapGained, totalScrap };
    }),

  upgrade: protectedProcedure
    .input(blacksmithUpgradeInputSchema)
    .mutation(async ({ ctx, input }): Promise<BlacksmithUpgradeResponse> => {
      const char = await requireChar(ctx.db, ctx.userId);
      const item = await requireItem(ctx.db, char.id, input.itemId);
      const cost = computeUpgradeCost(item.enhancementLevel);
      if (!cost) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Przedmiot już maksymalny.' });
      }
      const gemsSpent = input.useGemGuarantee ? GEM_GUARANTEE_COST : 0;
      if (char.gold < cost.gold) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Za mało złota.' });
      }
      if (char.scrap < cost.scrap) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Za mało złomu.' });
      }
      if (char.gems < gemsSpent) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Za mało gemów.' });
      }

      const success = rollUpgradeSuccess(item.enhancementLevel, input.useGemGuarantee);
      const newLevel = success ? item.enhancementLevel + 1 : item.enhancementLevel;

      await ctx.db.transaction(async (tx) => {
        // Zasoby zawsze konsumowane (nawet przy fail — to jest stake).
        await tx
          .update(characters)
          .set({
            gold: char.gold - cost.gold,
            scrap: char.scrap - cost.scrap,
            gems: char.gems - gemsSpent,
            updatedAt: new Date(),
          })
          .where(eq(characters.id, char.id));
        if (success) {
          await tx
            .update(characterItems)
            .set({ enhancementLevel: newLevel })
            .where(eq(characterItems.id, item.id));
        }
      });

      return {
        ok: true,
        success,
        newLevel,
        goldSpent: cost.gold,
        scrapSpent: cost.scrap,
        gemsSpent,
      };
    }),
});
