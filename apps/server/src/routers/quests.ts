import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import type { Quest, QuestReward } from '@grodno/shared';
import {
  collectQuestInputSchema,
  computeQuestSkipFullCost,
  computeQuestSkipHalfCost,
  skipQuestInputSchema,
  startQuestInputSchema,
} from '@grodno/shared';
import { REGISTRY } from '../content/registry.js';
import { characterCompanions, characterItems, characterQuests, characters } from '../db/schema.js';
import { loadScrapbookBuffs, registerScrapbookFind } from '../game/scrapbook.js';
import { DUNGEON_KEYS_MAX } from '../game/dungeon-keys.js';
import {
  BAG_CAP,
  getBagCount,
  insertOrStackPotion,
  itemTemplateToRowValues,
} from '../game/inventory.js';
import type { AchievementUnlockPayload } from '@grodno/shared';
import {
  collectBump,
  collectLevelBumps,
} from '../game/achievements.js';
import {
  logBossKill,
  logLegendaryDrop,
  logLevelMilestone,
  MILESTONES,
} from '../game/chronicle.js';
import { applyXpGain, summarizeLevelUps } from '../game/leveling.js';
import { applyMountSpeed, getActiveMount } from '../game/mounts.js';
import { getBossUniqueDrop, getQuestTemplate, rollLoot } from '../game/quests.js';
import { SEASON_PASS_XP_PER_QUEST_COLLECT } from '../game/season-pass.js';
import { addSeasonPassXp } from './seasonPass.js';
import { applyStaminaRegen } from '../game/stamina.js';
import { getCompanion } from '../game/tavern.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

/**
 * Epoch millis of the next 00:00 UTC strictly after `ref`. Used to compute
 * when a completed quest becomes startable again — quest cooldowns align with
 * the daily reward boundary so players have one clear reset rhythm.
 */
function nextUtcMidnight(ref: Date): number {
  return Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() + 1);
}

/** True if `collectedAt` occurred on an earlier UTC calendar day than `now`. */
function isStaleDone(collectedAt: Date, now: Date): boolean {
  return nextUtcMidnight(collectedAt) <= now.getTime();
}

export const questsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const [char] = await ctx.db
      .select({ id: characters.id, lvl: characters.lvl })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) return [] as Quest[];

    const rows = await ctx.db
      .select()
      .from(characterQuests)
      .where(eq(characterQuests.characterId, char.id));
    const byId = new Map(rows.map((r) => [r.questId, r]));
    const now = new Date();

    // Show quests up to 1 tier above current level (UI greys out locked ones);
    // deeper-future questy są ukryte żeby nie rozlewać listy.
    const templates = [...REGISTRY.quests.values()];
    return templates
      .filter((tpl) => tpl.requiredLvl <= char.lvl + 1)
      .map<Quest>((tpl) => {
        const row = byId.get(tpl.id);
        // A quest collected before today's UTC boundary is already refreshed —
        // the DB row still says 'done' until the next start/collect writes to
        // it, but the client should see it as 'idle' and offer the start
        // button. `start` uses onConflictDoUpdate so it'll overwrite safely.
        let state = row?.state ?? 'idle';
        let availableAt: number | null = null;
        if (state === 'done' && row) {
          if (isStaleDone(row.updatedAt, now)) {
            state = 'idle';
          } else {
            availableAt = nextUtcMidnight(row.updatedAt);
          }
        }
        return {
          ...tpl,
          state,
          endsAt: row?.endsAt ? row.endsAt.getTime() : 0,
          availableAt,
        };
      });
  }),

  start: protectedProcedure.input(startQuestInputSchema).mutation(async ({ ctx, input }) => {
    const tpl = getQuestTemplate(input.questId);
    if (!tpl) throw new TRPCError({ code: 'NOT_FOUND', message: 'Unknown quest' });

    const [char] = await ctx.db
      .select()
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });

    if (char.lvl < tpl.requiredLvl) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Quest dostępny od LVL ${tpl.requiredLvl}`,
      });
    }

    // Reject starts while the quest is in its daily cooldown — the UI hides
    // the start button in that state, but don't let hand-crafted requests
    // farm the same quest repeatedly within a day.
    const [existingRow] = await ctx.db
      .select()
      .from(characterQuests)
      .where(
        and(
          eq(characterQuests.characterId, char.id),
          eq(characterQuests.questId, tpl.id),
        ),
      )
      .limit(1);
    const startNow = new Date();
    if (
      existingRow &&
      existingRow.state === 'done' &&
      !isStaleDone(existingRow.updatedAt, startNow)
    ) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Quest już wykonany dzisiaj — wróć po 00:00 UTC',
      });
    }
    if (existingRow && existingRow.state === 'active') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Quest już w toku' });
    }

    const regen = applyStaminaRegen(char.stamina, char.staminaMax, char.lastTickAt);
    if (regen.stamina < 1) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not enough stamina' });
    }

    const now = startNow;
    // Aktywny wierzchowiec skraca `tpl.duration` o `speedPct`. Stosujemy tylko
    // dla *nowych* questów — questy w toku mają `endsAt` zamrożony na moment
    // startu, mount po fakcie niczego nie przyspiesza.
    const mount = getActiveMount(char, now);
    const effectiveDuration = applyMountSpeed(tpl.duration, mount);
    const endsAt = new Date(now.getTime() + effectiveDuration);
    await ctx.db.transaction(async (tx) => {
      await tx
        .update(characters)
        .set({ stamina: regen.stamina - 1, lastTickAt: regen.lastTickAt, updatedAt: now })
        .where(eq(characters.id, char.id));
      await tx
        .insert(characterQuests)
        .values({
          characterId: char.id,
          questId: tpl.id,
          state: 'active',
          endsAt,
          startedAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [characterQuests.characterId, characterQuests.questId],
          set: { state: 'active', endsAt, startedAt: now, updatedAt: now },
        });
    });

    return { questId: tpl.id, endsAt: endsAt.getTime() };
  }),

  collect: protectedProcedure
    .input(collectQuestInputSchema)
    .mutation(async ({ ctx, input }): Promise<QuestReward> => {
      const tpl = getQuestTemplate(input.questId);
      if (!tpl) throw new TRPCError({ code: 'NOT_FOUND', message: 'Unknown quest' });

      const [char] = await ctx.db
        .select()
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);
      if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });

      const [questRow] = await ctx.db
        .select()
        .from(characterQuests)
        .where(
          and(
            eq(characterQuests.characterId, char.id),
            eq(characterQuests.questId, tpl.id),
          ),
        )
        .limit(1);
      if (!questRow || questRow.state !== 'active') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Quest is not active',
        });
      }
      if (!questRow.endsAt || questRow.endsAt.getTime() > Date.now()) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Quest timer not finished',
        });
      }

      // Companion loot bonus (Cichobieg: +12% rare loot chance).
      const [companionRow] = await ctx.db
        .select({ slug: characterCompanions.companionSlug })
        .from(characterCompanions)
        .where(eq(characterCompanions.characterId, char.id))
        .limit(1);
      const lootBonusPct = companionRow
        ? (getCompanion(companionRow.slug)?.buff.lootBonusPct ?? 0)
        : 0;
      const effectiveChance = Math.min(100, tpl.itemChance + lootBonusPct);

      // Boss quests deliver a class-specific unique drop; regular quests roll
      // random from their difficulty pool, filtered by class.
      const uniqueDrop = getBossUniqueDrop(tpl.id, char.cls);
      const loot = uniqueDrop ?? rollLoot(tpl.diff, effectiveChance, char.cls);
      // Scrapbook +1% XP @ 25% wypełnienia. Mnoży tylko XP — gold quest
      // pozostaje surowy (scrapbook gold celuje arena/raid/PvE-mob loop).
      const scrapbookBuffs = await loadScrapbookBuffs(ctx.db, char.id);
      const xpGain = Math.ceil(tpl.xp * (1 + scrapbookBuffs.xpPct / 100));
      const leveling = applyXpGain(char, xpGain);
      const levelUp = summarizeLevelUps(leveling.ups);

      // Boss quests dorzucają klucze do puli (cap DUNGEON_KEYS_MAX) — mechanika
      // z mig 0014. rewardKeys to zawsze liczba (DB column default 0, bossowie 5).
      const rewardKeys = tpl.rewardKeys;
      const keysDelta = Math.min(rewardKeys, DUNGEON_KEYS_MAX - char.dungeonKeys);

      const reward: QuestReward = await ctx.db.transaction(async (tx) => {
        await tx
          .update(characters)
          .set({
            gold: char.gold + tpl.gold,
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
          .update(characterQuests)
          .set({ state: 'done', updatedAt: new Date() })
          .where(eq(characterQuests.id, questRow.id));

        let insertedItem: QuestReward['item'] = null;
        if (loot) {
          if (loot.slot === 'potion') {
            const stored = await insertOrStackPotion(tx, char.id, loot.id, 'quest');
            if (stored) {
              await registerScrapbookFind(tx, char.id, loot.id);
              insertedItem = {
                id: stored.id,
                name: loot.name,
                icon: loot.icon,
                rarity: loot.rarity,
              };
            }
          } else if ((await getBagCount(tx, char.id)) < BAG_CAP) {
            const [row] = await tx
              .insert(characterItems)
              .values(itemTemplateToRowValues(loot, char.id, 'quest'))
              .returning({ id: characterItems.id });
            await registerScrapbookFind(tx, char.id, loot.id);
            insertedItem = {
              id: row.id,
              name: loot.name,
              icon: loot.icon,
              rarity: loot.rarity,
            };
          }
        }

        return {
          gold: tpl.gold,
          xp: xpGain,
          keys: keysDelta,
          item: insertedItem,
          levelUp,
        };
      });

      // Kroniki — logujemy po commicie transakcji. Insert .catch() żeby błąd w
      // kronice nigdy nie przebił sukcesu questu.
      if (['q5', 'q10', 'q15'].includes(tpl.id)) {
        logBossKill(ctx.db, char.id, char.name, tpl.id, tpl.title).catch((e) =>
          console.error('[chronicle] logBossKill failed', e),
        );
      }
      if (reward.item && loot?.rarity === 'legendary') {
        logLegendaryDrop(ctx.db, char.id, char.name, loot.name).catch((e) =>
          console.error('[chronicle] logLegendaryDrop failed', e),
        );
      }
      for (const up of leveling.ups) {
        if (MILESTONES.includes(up.toLevel)) {
          logLevelMilestone(ctx.db, char.id, char.name, up.toLevel).catch((e) =>
            console.error('[chronicle] logLevelMilestone failed', e),
          );
        }
      }

      // Achievements — quest completion + legendary loot + level bumps.
      const unlocks: AchievementUnlockPayload[] = [];
      await collectBump(unlocks, ctx.db, char.id, 'first_quest');
      await collectBump(unlocks, ctx.db, char.id, 'quest_50');
      await collectBump(unlocks, ctx.db, char.id, 'quest_100');
      await collectBump(unlocks, ctx.db, char.id, 'quest_250');
      if (reward.item && loot) {
        const lootAchId =
          loot.rarity === 'rare'
            ? 'first_rare'
            : loot.rarity === 'epic'
              ? 'first_epic'
              : loot.rarity === 'legendary'
                ? 'first_legendary'
                : null;
        if (lootAchId) {
          await collectBump(unlocks, ctx.db, char.id, lootAchId);
        }
        if (loot.rarity === 'legendary') {
          await collectBump(unlocks, ctx.db, char.id, 'legendary_collector');
          await collectBump(unlocks, ctx.db, char.id, 'legendary_collector_25');
        }
      }
      if (leveling.ups.length > 0) {
        await collectLevelBumps(unlocks, ctx.db, char.id, leveling.progression.lvl);
      }

      // Season Pass — +5 XP za każdy collect'owany quest.
      await addSeasonPassXp(ctx.db, char.id, SEASON_PASS_XP_PER_QUEST_COLLECT);

      return { ...reward, unlockedAchievements: unlocks };
    }),

  skip: protectedProcedure.input(skipQuestInputSchema).mutation(async ({ ctx, input }) => {
    const tpl = getQuestTemplate(input.questId);
    if (!tpl) throw new TRPCError({ code: 'NOT_FOUND', message: 'Unknown quest' });

    const [char] = await ctx.db
      .select()
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });

    const [questRow] = await ctx.db
      .select()
      .from(characterQuests)
      .where(
        and(
          eq(characterQuests.characterId, char.id),
          eq(characterQuests.questId, tpl.id),
        ),
      )
      .limit(1);
    if (!questRow || questRow.state !== 'active' || !questRow.endsAt) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Quest is not active' });
    }
    const remaining = Math.max(0, questRow.endsAt.getTime() - Date.now());
    const cost = computeQuestSkipFullCost(remaining);
    if (char.gems < cost) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not enough gems' });
    }

    const now = new Date();
    await ctx.db.transaction(async (tx) => {
      await tx
        .update(characters)
        .set({ gems: char.gems - cost, updatedAt: now })
        .where(eq(characters.id, char.id));
      await tx
        .update(characterQuests)
        .set({ endsAt: now, updatedAt: now })
        .where(eq(characterQuests.id, questRow.id));
    });

    return { cost };
  }),

  /**
   * Gem sink: skip 50% remaining czasu questa za dynamiczny koszt.
   * Cena = połowa pełnego skipu (zaokrąglona w górę, min 1). Adekwatna do
   * czasu oszczędzonego — dla 90s quest full=3/half=2, dla 15min full=30/half=15.
   */
  skipHalf: protectedProcedure.input(skipQuestInputSchema).mutation(async ({ ctx, input }) => {
    const tpl = getQuestTemplate(input.questId);
    if (!tpl) throw new TRPCError({ code: 'NOT_FOUND', message: 'Unknown quest' });
    const [char] = await ctx.db
      .select()
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
    const [questRow] = await ctx.db
      .select()
      .from(characterQuests)
      .where(
        and(
          eq(characterQuests.characterId, char.id),
          eq(characterQuests.questId, tpl.id),
        ),
      )
      .limit(1);
    if (!questRow || questRow.state !== 'active' || !questRow.endsAt) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Quest is not active' });
    }
    const now = new Date();
    const remaining = Math.max(0, questRow.endsAt.getTime() - now.getTime());
    if (remaining < 30_000) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Quest kończy się za mniej niż 30s.' });
    }
    const cost = computeQuestSkipHalfCost(remaining);
    if (char.gems < cost) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Brak gemów (${cost}).` });
    }
    const newEndsAt = new Date(now.getTime() + Math.floor(remaining / 2));
    await ctx.db.transaction(async (tx) => {
      await tx
        .update(characters)
        .set({ gems: char.gems - cost, updatedAt: now })
        .where(eq(characters.id, char.id));
      await tx
        .update(characterQuests)
        .set({ endsAt: newEndsAt, updatedAt: now })
        .where(eq(characterQuests.id, questRow.id));
    });
    return { cost, newEndsAt: newEndsAt.getTime() };
  }),
});
