import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import type { DiscordClaimResponse } from '@grodno/shared';
import { characterAchievements, characters } from '../db/schema.js';
import {
  bumpAchievement,
  listAchievementsForCharacter,
  tplToUnlockPayload,
} from '../game/achievements.js';
import { REGISTRY } from '../content/registry.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

const DISCORD_ACHIEVEMENT_ID = 'discord_joined';

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

  /**
   * Player potwierdza dołączenie do Discorda — otwiera link i klika „Dołączyłem".
   * Honor-system, ale unlock idempotentny (drugi claim → alreadyClaimed:true).
   */
  claimDiscord: protectedProcedure.mutation(async ({ ctx }): Promise<DiscordClaimResponse> => {
    const [char] = await ctx.db
      .select({ id: characters.id })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
    }
    const tpl = REGISTRY.achievements.get(DISCORD_ACHIEVEMENT_ID);
    if (!tpl) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Achievement template missing — uruchom admin.reload.',
      });
    }
    const [existing] = await ctx.db
      .select({ unlockedAt: characterAchievements.unlockedAt })
      .from(characterAchievements)
      .where(
        and(
          eq(characterAchievements.characterId, char.id),
          eq(characterAchievements.achievementId, DISCORD_ACHIEVEMENT_ID),
        ),
      )
      .limit(1);
    if (existing?.unlockedAt) {
      return { alreadyClaimed: true, unlocked: null };
    }
    const { unlockedTemplate } = await bumpAchievement(ctx.db, char.id, DISCORD_ACHIEVEMENT_ID, 1);
    return {
      alreadyClaimed: false,
      unlocked: unlockedTemplate ? tplToUnlockPayload(unlockedTemplate) : null,
    };
  }),
});
