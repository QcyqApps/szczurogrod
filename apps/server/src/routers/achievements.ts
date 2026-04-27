import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { characters } from '../db/schema.js';
import { listAchievementsForCharacter } from '../game/achievements.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

export const achievementsRouter = router({
  /**
   * Pełna lista osiągnięć z progresem i statusem unlock dla aktualnej postaci.
   * Client renderuje z pogrupowaniem po `category`.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const [char] = await ctx.db
      .select({ id: characters.id })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
    }
    const items = await listAchievementsForCharacter(ctx.db, char.id);
    return { items };
  }),
});
