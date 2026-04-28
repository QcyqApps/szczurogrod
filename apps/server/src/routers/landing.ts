// Public landing snapshot — desktop side panels.
//
// Single endpoint `landing.public` returns top players, recent chronicle,
// and quick stats. Works without authentication so anonymous visitors on
// the marketing/desktop shell see live world activity. If a session
// happens to be present, also returns `myRank` with the viewer's standing.
//
// Cached in-process for 30s — these are read-mostly aggregates and the
// landing rail repaints every render of AppFrame, so we throttle DB hits.

import { and, asc, desc, eq, gt, isNull, isNotNull, sql } from 'drizzle-orm';
import type {
  CharacterClass,
  ChronicleEntry,
  LandingPublicResponse,
  LeaderboardCharEntry,
} from '@grodno/shared';
import type { Db } from '../db/client.js';
import { characters, guilds } from '../db/schema.js';
import { listChronicleEntries } from '../game/chronicle.js';
import { publicProcedure, router } from '../trpc/trpc.js';

const TOP_N = 8;
const CHRONICLE_N = 8;
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const CACHE_TTL_MS = 30_000;

interface CachedSnapshot {
  expires: number;
  data: Omit<LandingPublicResponse, 'myRank'>;
}

let cache: CachedSnapshot | null = null;

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

async function publicChronicle(db: Db): Promise<ChronicleEntry[]> {
  const all = await listChronicleEntries(db);
  return all.slice(0, CHRONICLE_N);
}

async function quickStats(db: Db): Promise<LandingPublicResponse['stats']> {
  const since = new Date(Date.now() - ONLINE_WINDOW_MS);
  const [online] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(characters)
    .where(gt(characters.lastSeenAt, since));
  const [total] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(characters);
  const [guildCount] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(guilds)
    .where(isNull(guilds.disbandedAt));
  return {
    onlineCount: online?.n ?? 0,
    totalCharacters: total?.n ?? 0,
    totalGuilds: guildCount?.n ?? 0,
  };
}

async function loadSnapshot(db: Db): Promise<Omit<LandingPublicResponse, 'myRank'>> {
  const now = Date.now();
  if (cache && cache.expires > now) return cache.data;
  const [top, chronicle, stats] = await Promise.all([
    topByLevel(db),
    publicChronicle(db),
    quickStats(db),
  ]);
  const data = { topByLevel: top, chronicle, stats };
  cache = { data, expires: now + CACHE_TTL_MS };
  return data;
}

async function loadMyRank(
  db: Db,
  userId: string,
): Promise<LandingPublicResponse['myRank']> {
  const [me] = await db
    .select({
      id: characters.id,
      lvl: characters.lvl,
      xp: characters.xp,
      createdAt: characters.createdAt,
      arenaPoints: characters.arenaPoints,
    })
    .from(characters)
    .where(eq(characters.userId, userId))
    .limit(1);
  if (!me) return null;

  const [levelAhead] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(characters)
    .where(
      sql`(${characters.lvl}, ${characters.xp}) > (${me.lvl}, ${me.xp})`,
    );
  const [arenaAhead] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(characters)
    .where(
      and(
        gt(characters.arenaPoints, me.arenaPoints),
        isNotNull(characters.id),
      ),
    );
  return {
    lvl: me.lvl,
    levelPos: (levelAhead?.n ?? 0) + 1,
    arenaPoints: me.arenaPoints,
    arenaPos: (arenaAhead?.n ?? 0) + 1,
  };
}

export const landingRouter = router({
  public: publicProcedure.query(async ({ ctx }): Promise<LandingPublicResponse> => {
    const snapshot = await loadSnapshot(ctx.db);
    const myRank = ctx.userId ? await loadMyRank(ctx.db, ctx.userId) : null;
    return { ...snapshot, myRank };
  }),
});
