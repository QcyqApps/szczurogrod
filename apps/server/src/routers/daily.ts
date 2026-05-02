import { TRPCError } from '@trpc/server';
import { desc, eq } from 'drizzle-orm';
import type { DailyClaimResult, DailyStatus } from '@grodno/shared';
import { REGISTRY } from '../content/registry.js';
import { characterItems, characters, dailyClaims } from '../db/schema.js';
import { computeStreakForToday, dayToLadderIndex, isoDateUTC } from '../game/daily.js';
import { DUNGEON_KEYS_MAX } from '../game/dungeon-keys.js';
import {
  BAG_CAP,
  getBagCount,
  insertOrStackPotion,
  itemTemplateToRowValues,
} from '../game/inventory.js';
import type { AchievementUnlockPayload } from '@grodno/shared';
import {
  collectLevelBumps,
  collectSetMax,
} from '../game/achievements.js';
import { logLevelMilestone, MILESTONES } from '../game/chronicle.js';
import { applyXpGain } from '../game/leveling.js';
import { applyXpBonus } from '../game/subscription.js';
import { registerScrapbookFind } from '../game/scrapbook.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

/**
 * Reward multiplier scaled by character level. L1-4 ×1, L5-9 ×1.5, L10-14 ×2,
 * L15-19 ×2.5, L20+ capped at ×3. Capping matters because the level system is
 * uncapped — without a ceiling a L100 player would get ×11 daily and L500
 * player ×51.
 */
function levelMultiplier(lvl: number): number {
  return Math.min(3, 1 + Math.floor(lvl / 5) * 0.5);
}

async function loadCharacterAndLastClaim(
  db: typeof import('../db/client.js').db,
  userId: string,
) {
  const [char] = await db
    .select()
    .from(characters)
    .where(eq(characters.userId, userId))
    .limit(1);
  if (!char) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
  }
  const [lastClaim] = await db
    .select()
    .from(dailyClaims)
    .where(eq(dailyClaims.characterId, char.id))
    .orderBy(desc(dailyClaims.createdAt))
    .limit(1);
  return { char, lastClaim: lastClaim ?? null };
}

export const dailyRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }): Promise<DailyStatus> => {
    const { lastClaim } = await loadCharacterAndLastClaim(ctx.db, ctx.userId);
    const today = isoDateUTC();
    const lastDate = lastClaim?.claimedDate ?? null;
    const claimedToday = lastDate === today;
    const nextStreak = computeStreakForToday(lastDate, lastClaim?.streakDay ?? 0, today);
    return {
      day: claimedToday ? (lastClaim?.streakDay ?? 1) : nextStreak,
      streak: lastClaim?.streakDay ?? 0,
      claimedToday,
      lastClaimDate: lastDate,
    };
  }),

  claim: protectedProcedure.mutation(async ({ ctx }): Promise<DailyClaimResult> => {
    const { char, lastClaim } = await loadCharacterAndLastClaim(ctx.db, ctx.userId);
    const today = isoDateUTC();
    if (lastClaim?.claimedDate === today) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Already claimed today' });
    }
    const streakDay = computeStreakForToday(
      lastClaim?.claimedDate ?? null,
      lastClaim?.streakDay ?? 0,
      today,
    );
    const reward = REGISTRY.dailyLadder[dayToLadderIndex(streakDay)];
    if (!reward) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Daily ladder missing' });
    }

    const mult = levelMultiplier(char.lvl);
    const goldDelta = Math.round(reward.gold * mult);
    const xpDeltaRaw = Math.round(reward.xp * mult);
    // Szczurogród+ bonus +20% XP — wpinany przed applyXpGain.
    const xpDelta = applyXpBonus(char, xpDeltaRaw);
    const gemsDelta = reward.gems; // gems nie skalują — są drogą walutą
    // Keys don't scale — a key is a key; day-3 gives 2, doesn't become 6 at L30.
    const keysDelta = Math.min(reward.keys, DUNGEON_KEYS_MAX - char.dungeonKeys);

    const leveling = applyXpGain(char, xpDelta);
    let itemAwarded: NonNullable<DailyClaimResult['item']> | null = null;

    await ctx.db.transaction(async (tx) => {
      await tx
        .update(characters)
        .set({
          gold: char.gold + goldDelta,
          gems: char.gems + gemsDelta,
          dungeonKeys: char.dungeonKeys + keysDelta,
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
        .where(eq(characters.id, char.id));
      await tx
        .insert(dailyClaims)
        .values({ characterId: char.id, claimedDate: today, streakDay });

      // Daily itemy są uniwersalne (potion/gift/crown). Stackujemy potion-sloty,
      // resztę (any) wstawiamy zwykłym insertem z bag-cap check.
      const rewardItem = reward.item;
      if (rewardItem) {
        if (rewardItem.slot === 'potion') {
          const stored = await insertOrStackPotion(tx, char.id, rewardItem.id, 'daily');
          if (stored) {
            await registerScrapbookFind(tx, char.id, rewardItem.id);
            itemAwarded = {
              name: rewardItem.name,
              icon: rewardItem.icon,
              rarity: rewardItem.rarity,
            };
          }
        } else if ((await getBagCount(tx, char.id)) < BAG_CAP) {
          await tx
            .insert(characterItems)
            .values(itemTemplateToRowValues(rewardItem, char.id, 'daily'));
          await registerScrapbookFind(tx, char.id, rewardItem.id);
          itemAwarded = {
            name: rewardItem.name,
            icon: rewardItem.icon,
            rarity: rewardItem.rarity,
          };
        }
      }
    });

    // Kroniki milestone — fire-and-forget po commicie.
    for (const up of leveling.ups) {
      if (MILESTONES.includes(up.toLevel)) {
        logLevelMilestone(ctx.db, char.id, char.name, up.toLevel).catch((e) =>
          console.error('[chronicle] logLevelMilestone failed', e),
        );
      }
    }

    // Achievements: daily streak + level bumps — collectujemy unlocki żeby
    // zwrócić w response (klient pokaże modal).
    const unlocks: AchievementUnlockPayload[] = [];
    await collectSetMax(unlocks, ctx.db, char.id, 'daily_7', streakDay);
    await collectSetMax(unlocks, ctx.db, char.id, 'daily_30', streakDay);
    if (leveling.ups.length > 0) {
      await collectLevelBumps(unlocks, ctx.db, char.id, leveling.progression.lvl);
    }

    return {
      day: streakDay,
      streak: streakDay,
      gold: goldDelta,
      xp: xpDelta,
      keys: keysDelta,
      item: itemAwarded,
      unlockedAchievements: unlocks,
    };
  }),
});
