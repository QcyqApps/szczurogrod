import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import type {
  DungeonSummary,
  RegionSummary,
  WorldGetResponse,
} from '@grodno/shared';
import { REGISTRY } from '../content/registry.js';
import { characterDungeonClears, characters } from '../db/schema.js';
import { computeDungeonStatus } from '../game/dungeon-progress.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

export const worldRouter = router({
  /**
   * Zwraca pełną mapę świata z statusami per gracz:
   * - regions (posortowane po sortOrder)
   * - dungeons per region (posortowane po sortOrder) z statusem locked/unlocked/cleared
   * - bossEnemySlug + podstawowe info o bossie dla UI preview'u
   */
  get: protectedProcedure.query(async ({ ctx }): Promise<WorldGetResponse> => {
    const [char] = await ctx.db
      .select({ id: characters.id, lvl: characters.lvl })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });

    const clearRows = await ctx.db
      .select({ dungeonSlug: characterDungeonClears.dungeonSlug })
      .from(characterDungeonClears)
      .where(eq(characterDungeonClears.characterId, char.id));
    const clearedSlugs = new Set(clearRows.map((r) => r.dungeonSlug));

    const regions: RegionSummary[] = REGISTRY.regionsList.map((region) => {
      const dungeons: DungeonSummary[] = REGISTRY.dungeonsList
        .filter((d) => d.regionSlug === region.slug)
        .map((d) => {
          const { status, lockReason } = computeDungeonStatus(d, char.lvl, clearedSlugs);
          const bossEnemy = REGISTRY.enemies.get(d.bossEnemySlug);
          if (!bossEnemy) {
            throw new Error(
              `Dungeon ${d.slug} references missing boss enemy ${d.bossEnemySlug}`,
            );
          }
          return {
            slug: d.slug,
            name: d.name,
            desc: d.desc,
            requiredLvl: d.requiredLvl,
            prerequisiteDungeonSlug: d.prerequisiteDungeonSlug,
            mapX: d.mapX,
            mapY: d.mapY,
            sortOrder: d.sortOrder,
            status,
            lockReason,
            mobCount: d.mobSlugs.length,
            boss: {
              slug: bossEnemy.slug,
              name: bossEnemy.name,
              lvl: bossEnemy.lvl,
              requiredLvl: bossEnemy.requiredLvl,
            },
          };
        });
      return {
        slug: region.slug,
        name: region.name,
        sortOrder: region.sortOrder,
        dungeons,
      };
    });

    return { regions, charLvl: char.lvl };
  }),
});
