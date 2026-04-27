// Guild buildings router — Phase 2.
//
// 2 endpointy: list, upgrade.
// - list: wszyscy członkowie — podgląd levelów + next cost + buff preview.
// - upgrade: officer+ — wymaga guild treasury + guildLvl. Decrements treasury,
//   bumps building.level, log w guild_treasury_logs, fortress auto-bump memberCap.

import { TRPCError } from '@trpc/server';
import { and, eq, sql } from 'drizzle-orm';
import type { GuildBuildingBuffSpec, GuildBuildingsListResponse } from '@grodno/shared';
import { guildBuildingUpgradeInputSchema } from '@grodno/shared';
import {
  characters,
  guildBuildings,
  guildMembers,
  guildTreasuryLogs,
  guilds,
} from '../db/schema.js';
import {
  GUILD_BUILDING_TEMPLATES,
  fortressMemberCapBonus,
  nextUpgradeCost,
} from '../game/guild-buildings.js';
import { assertCan } from '../game/guild-permissions.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

async function requireChar(
  db: import('../db/client.js').Db,
  userId: string,
): Promise<typeof characters.$inferSelect> {
  const [char] = await db.select().from(characters).where(eq(characters.userId, userId)).limit(1);
  if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });
  return char;
}

async function resolveMyGuild(
  db: import('../db/client.js').Db,
  characterId: string,
): Promise<string> {
  const [row] = await db
    .select({ guildId: guildMembers.guildId })
    .from(guildMembers)
    .where(eq(guildMembers.characterId, characterId))
    .limit(1);
  if (!row) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Nie jesteś w gildii.' });
  }
  return row.guildId;
}

export const guildBuildingsRouter = router({
  list: protectedProcedure.query(async ({ ctx }): Promise<GuildBuildingsListResponse> => {
    const char = await requireChar(ctx.db, ctx.userId);
    const guildId = await resolveMyGuild(ctx.db, char.id);

    const [guild] = await ctx.db.select().from(guilds).where(eq(guilds.id, guildId)).limit(1);
    if (!guild) throw new TRPCError({ code: 'NOT_FOUND', message: 'Gildia nie istnieje.' });

    const levels = await ctx.db
      .select({ slug: guildBuildings.slug, level: guildBuildings.level })
      .from(guildBuildings)
      .where(eq(guildBuildings.guildId, guildId));
    const levelBySlug = new Map(levels.map((l) => [l.slug, l.level]));

    const buildings = GUILD_BUILDING_TEMPLATES.map((tpl) => {
      const level = levelBySlug.get(tpl.slug) ?? 0;
      const cost = nextUpgradeCost(tpl.slug, level);
      // Clone readonly arrays → mutable (zod inferred types są mutable).
      const buffSpec: GuildBuildingBuffSpec =
        tpl.buffSpec.kind === 'fortress'
          ? { kind: 'fortress', memberCapByLevel: [...tpl.buffSpec.memberCapByLevel] }
          : tpl.buffSpec.kind === 'altar'
            ? {
                kind: 'altar',
                atkPctByLevel: [...tpl.buffSpec.atkPctByLevel],
                magPctByLevel: [...tpl.buffSpec.magPctByLevel],
                defPctByLevel: [...tpl.buffSpec.defPctByLevel],
              }
            : {
                kind: 'vault',
                extraWithdrawPctByLevel: [...tpl.buffSpec.extraWithdrawPctByLevel],
              };
      return {
        slug: tpl.slug,
        name: tpl.name,
        icon: tpl.icon,
        desc: tpl.desc,
        level,
        maxLevel: tpl.maxLevel,
        nextCost: cost
          ? { gold: cost.gold, gems: cost.gems, guildLvl: cost.guildLvl ?? 1 }
          : null,
        buffSpec,
      };
    });

    return {
      buildings,
      guildLevel: guild.level,
      treasuryGold: guild.treasuryGold,
      treasuryGems: guild.treasuryGems,
    };
  }),

  upgrade: protectedProcedure
    .input(guildBuildingUpgradeInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      const { guildId } = await assertCan(ctx.db, char.id, 'buildingUpgrade');

      const tpl = GUILD_BUILDING_TEMPLATES.find((b) => b.slug === input.slug);
      if (!tpl) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nieznany budynek.' });
      }

      const [guild] = await ctx.db.select().from(guilds).where(eq(guilds.id, guildId)).limit(1);
      if (!guild) throw new TRPCError({ code: 'NOT_FOUND', message: 'Gildia nie istnieje.' });

      const [existing] = await ctx.db
        .select({ level: guildBuildings.level })
        .from(guildBuildings)
        .where(and(eq(guildBuildings.guildId, guildId), eq(guildBuildings.slug, input.slug)))
        .limit(1);
      const currentLevel = existing?.level ?? 0;

      const cost = nextUpgradeCost(input.slug, currentLevel);
      if (!cost) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Budynek maksymalny.' });
      }
      const requiredGuildLvl = cost.guildLvl ?? 1;
      if (guild.level < requiredGuildLvl) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Wymaga gildii LVL ${requiredGuildLvl}.`,
        });
      }
      if (guild.treasuryGold < cost.gold || guild.treasuryGems < cost.gems) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Skarbiec za pusty na taki upgrade.',
        });
      }

      const newLevel = currentLevel + 1;

      await ctx.db.transaction(async (tx) => {
        // 1. Upsert level.
        if (existing) {
          await tx
            .update(guildBuildings)
            .set({ level: newLevel, upgradedAt: new Date() })
            .where(
              and(eq(guildBuildings.guildId, guildId), eq(guildBuildings.slug, input.slug)),
            );
        } else {
          await tx.insert(guildBuildings).values({
            guildId,
            slug: input.slug,
            level: newLevel,
          });
        }

        // 2. Decrement treasury + fortress auto-bump memberCap.
        const memberCapBonus =
          tpl.slug === 'fortress' ? fortressMemberCapBonus(newLevel) : 0;
        const memberCapDelta = memberCapBonus - (tpl.slug === 'fortress'
          ? fortressMemberCapBonus(currentLevel)
          : 0);

        await tx
          .update(guilds)
          .set({
            treasuryGold: sql`${guilds.treasuryGold} - ${cost.gold}`,
            treasuryGems: sql`${guilds.treasuryGems} - ${cost.gems}`,
            memberCap:
              memberCapDelta !== 0
                ? sql`${guilds.memberCap} + ${memberCapDelta}`
                : guilds.memberCap,
            updatedAt: new Date(),
          })
          .where(eq(guilds.id, guildId));

        // 3. Log.
        await tx.insert(guildTreasuryLogs).values({
          guildId,
          actorCharId: char.id,
          actorName: char.name,
          kind: 'building_upgrade',
          goldDelta: -cost.gold,
          gemsDelta: -cost.gems,
          memo: `${tpl.name} L${newLevel}`,
        });
      });

      return {
        ok: true,
        slug: tpl.slug,
        newLevel,
      };
    }),
});
