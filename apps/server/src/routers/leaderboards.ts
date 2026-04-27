// Hall of Fame — unified rankingi.
//
// Jeden endpoint `all` zwraca 4 listy top-10:
//   - byLevel:        ranking po `lvl` (tiebreak: xp DESC, createdAt ASC)
//   - byAchievements: ranking po liczbie unlock'niętych achievementów
//   - byArena:        wrap historic arena leaderboard
//   - byGuilds:       ranking gildii po glory + member count
//
// Zero schema changes — wszystko liczone z istniejących tabel. 4 query
// w paraleli, każda cheap (limit 10).

import { asc, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import type {
  CharacterClass,
  LeaderboardCharEntry,
  LeaderboardGuildEntry,
  LeaderboardsResponse,
} from '@grodno/shared';
import type { Db } from '../db/client.js';
import {
  characterAchievements,
  characters,
  guildMembers,
  guilds,
} from '../db/schema.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

const TOP_N = 10;

async function topByLevel(db: Db): Promise<LeaderboardCharEntry[]> {
  const rows = await db
    .select({
      id: characters.id,
      name: characters.name,
      cls: characters.cls,
      lvl: characters.lvl,
    })
    .from(characters)
    .orderBy(desc(characters.lvl), desc(characters.xp), asc(characters.createdAt))
    .limit(TOP_N);
  return rows.map((r, i) => ({
    characterId: r.id,
    pos: i + 1,
    name: r.name,
    cls: r.cls as CharacterClass,
    lvl: r.lvl,
    value: r.lvl,
  }));
}

async function topByAchievements(db: Db): Promise<LeaderboardCharEntry[]> {
  const rows = await db
    .select({
      characterId: characterAchievements.characterId,
      count: sql<number>`count(*)::int`,
      name: characters.name,
      cls: characters.cls,
      lvl: characters.lvl,
    })
    .from(characterAchievements)
    .innerJoin(characters, eq(characters.id, characterAchievements.characterId))
    .where(isNotNull(characterAchievements.unlockedAt))
    .groupBy(
      characterAchievements.characterId,
      characters.name,
      characters.cls,
      characters.lvl,
    )
    .orderBy(desc(sql`count(*)`))
    .limit(TOP_N);
  return rows.map((r, i) => ({
    characterId: r.characterId,
    pos: i + 1,
    name: r.name,
    cls: r.cls as CharacterClass,
    lvl: r.lvl,
    value: r.count,
  }));
}

async function topByArena(db: Db): Promise<LeaderboardCharEntry[]> {
  const rows = await db
    .select({
      id: characters.id,
      name: characters.name,
      cls: characters.cls,
      lvl: characters.lvl,
      arenaPoints: characters.arenaPoints,
    })
    .from(characters)
    .orderBy(desc(characters.arenaPoints), asc(characters.createdAt))
    .limit(TOP_N);
  return rows.map((r, i) => ({
    characterId: r.id,
    pos: i + 1,
    name: r.name,
    cls: r.cls as CharacterClass,
    lvl: r.lvl,
    value: r.arenaPoints,
  }));
}

async function topByGuilds(db: Db): Promise<LeaderboardGuildEntry[]> {
  const rows = await db
    .select({
      id: guilds.id,
      name: guilds.name,
      tag: guilds.tag,
      glory: guilds.glory,
      memberCount: sql<number>`(SELECT COUNT(*)::int FROM ${guildMembers} WHERE ${guildMembers.guildId} = ${guilds.id})`,
    })
    .from(guilds)
    .where(isNull(guilds.disbandedAt))
    .orderBy(desc(guilds.glory), asc(guilds.createdAt))
    .limit(TOP_N);
  return rows.map((r, i) => ({
    guildId: r.id,
    pos: i + 1,
    name: r.name,
    tag: r.tag,
    glory: r.glory,
    memberCount: r.memberCount,
  }));
}

export const leaderboardsRouter = router({
  all: protectedProcedure.query(async ({ ctx }): Promise<LeaderboardsResponse> => {
    const [byLevel, byAchievements, byArena, byGuilds] = await Promise.all([
      topByLevel(ctx.db),
      topByAchievements(ctx.db),
      topByArena(ctx.db),
      topByGuilds(ctx.db),
    ]);
    return { byLevel, byAchievements, byArena, byGuilds };
  }),
});
