import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import type { TrainerQuote } from '@grodno/shared';
import { trainerBuyInputSchema } from '@grodno/shared';
import type { AchievementUnlockPayload } from '@grodno/shared';
import { characters } from '../db/schema.js';
import { collectBump } from '../game/achievements.js';
import { computeQuote, statCost } from '../game/trainer.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

export const trainerRouter = router({
  getQuote: protectedProcedure.query(async ({ ctx }): Promise<TrainerQuote> => {
    const [row] = await ctx.db
      .select({ stats: characters.stats, gold: characters.gold })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!row) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
    }
    return {
      stats: row.stats,
      nextCost: computeQuote(row.stats),
      gold: row.gold,
    };
  }),

  buyStat: protectedProcedure.input(trainerBuyInputSchema).mutation(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .select({ id: characters.id, stats: characters.stats, gold: characters.gold })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!row) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
    }
    const current = row.stats[input.stat];
    const cost = statCost(current);
    if (row.gold < cost) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Not enough gold (${cost})` });
    }
    const newStats = { ...row.stats, [input.stat]: current + 1 };
    await ctx.db
      .update(characters)
      .set({
        stats: newStats,
        gold: row.gold - cost,
        updatedAt: new Date(),
      })
      .where(eq(characters.id, row.id));

    const unlocks: AchievementUnlockPayload[] = [];
    await collectBump(unlocks, ctx.db, row.id, 'trainer_10');
    await collectBump(unlocks, ctx.db, row.id, 'trainer_50');

    return {
      stat: input.stat,
      newValue: current + 1,
      goldSpent: cost,
      goldRemaining: row.gold - cost,
      unlockedAchievements: unlocks,
    };
  }),
});
