import { TRPCError } from '@trpc/server';
import { asc, eq, inArray, sql } from 'drizzle-orm';
import type { ChronicleListResponse, TownTopWarResponse } from '@grodno/shared';
import { characters, guilds, guildWars } from '../db/schema.js';
import { listChronicleEntries } from '../game/chronicle.js';
import { pickFlavor } from '../game/town-flavor.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

// Cache server-wide top war query — robi 1 SQL z 2 join'ami i wszyscy gracze
// odpalają to co minutę z `ScreenTown`. 30s TTL = max ~2 query/min nawet gdy
// 1000 graczy online. Single-instance — jeśli kiedyś multi-deploy → Redis.
const TOP_WAR_TTL_MS = 30_000;
let topWarCache: { ts: number; value: TownTopWarResponse } | null = null;

export function invalidateTopWarCache(): void {
  topWarCache = null;
}

export const townRouter = router({
  flavor: protectedProcedure.query(async ({ ctx }) => {
    const [char] = await ctx.db
      .select({ cls: characters.cls })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
    const text = await pickFlavor(ctx.db, char.cls);
    return { text };
  }),

  chronicle: protectedProcedure.query(async ({ ctx }): Promise<ChronicleListResponse> => {
    const entries = await listChronicleEntries(ctx.db);
    return { entries };
  }),

  topWar: protectedProcedure.query(async ({ ctx }): Promise<TownTopWarResponse> => {
    const now = Date.now();
    if (topWarCache && now - topWarCache.ts < TOP_WAR_TTL_MS) {
      return topWarCache.value;
    }
    // Top: resolving > scheduled; w obrębie statusu — najbliższy scheduledAt.
    const [row] = await ctx.db
      .select({
        id: guildWars.id,
        status: guildWars.status,
        scheduledAt: guildWars.scheduledAt,
        attackerGuildId: guildWars.attackerGuildId,
        defenderGuildId: guildWars.defenderGuildId,
      })
      .from(guildWars)
      .where(inArray(guildWars.status, ['scheduled', 'resolving']))
      .orderBy(
        sql`case ${guildWars.status} when 'resolving' then 0 else 1 end`,
        asc(guildWars.scheduledAt),
      )
      .limit(1);
    if (!row) {
      const value: TownTopWarResponse = { war: null };
      topWarCache = { ts: now, value };
      return value;
    }
    const guildRows = await ctx.db
      .select({ id: guilds.id, name: guilds.name, tag: guilds.tag })
      .from(guilds)
      .where(inArray(guilds.id, [row.attackerGuildId, row.defenderGuildId]));
    const attacker = guildRows.find((g) => g.id === row.attackerGuildId);
    const defender = guildRows.find((g) => g.id === row.defenderGuildId);
    if (!attacker || !defender) {
      const value: TownTopWarResponse = { war: null };
      topWarCache = { ts: now, value };
      return value;
    }
    const value: TownTopWarResponse = {
      war: {
        warId: row.id,
        attackerName: attacker.name,
        attackerTag: attacker.tag,
        defenderName: defender.name,
        defenderTag: defender.tag,
        status: row.status as 'scheduled' | 'resolving',
        scheduledAt: row.scheduledAt.getTime(),
      },
    };
    topWarCache = { ts: now, value };
    return value;
  }),
});
