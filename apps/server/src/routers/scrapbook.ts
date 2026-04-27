// Scrapbook router — Priorytet 3.
//
// Jedyny endpoint: scrapbook.list. Zwraca wszystkie item templates + flag
// `foundAt` per-postać + current buffs z computeScrapbookBuffs.
//
// Hook'i insertowe (registerScrapbookFind) są w game/scrapbook.ts i są wołane
// z innych routerów (quests, combat, shop, daily) w miejscach grant'u items.

import { TRPCError } from '@trpc/server';
import { asc, desc, eq } from 'drizzle-orm';
import type { Rarity, ScrapbookListResponse } from '@grodno/shared';
import { characterScrapbook, characters, itemTemplates } from '../db/schema.js';
import { computeScrapbookBuffs } from '../game/scrapbook.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

export const scrapbookRouter = router({
  list: protectedProcedure.query(async ({ ctx }): Promise<ScrapbookListResponse> => {
    const [char] = await ctx.db
      .select({ id: characters.id })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });

    // 2 queries pattern: wszystkie templates + found set per char. Merge w aplikacji.
    // Prostsze niż LEFT JOIN który by wymagał OR IS NULL conditions.
    const allTemplates = await ctx.db
      .select({
        id: itemTemplates.id,
        name: itemTemplates.name,
        icon: itemTemplates.icon,
        slot: itemTemplates.slot,
        rarity: itemTemplates.rarity,
      })
      .from(itemTemplates)
      .orderBy(desc(itemTemplates.rarity), asc(itemTemplates.name));

    const foundRows = await ctx.db
      .select({
        itemTemplateId: characterScrapbook.itemTemplateId,
        foundAt: characterScrapbook.foundAt,
      })
      .from(characterScrapbook)
      .where(eq(characterScrapbook.characterId, char.id));

    const foundMap = new Map(foundRows.map((r) => [r.itemTemplateId, r.foundAt.getTime()]));

    const entries = allTemplates.map((t) => ({
      itemTemplateId: t.id,
      name: t.name,
      icon: t.icon,
      slot: t.slot,
      rarity: t.rarity as Rarity,
      foundAt: foundMap.get(t.id) ?? null,
    }));

    const buffs = computeScrapbookBuffs(foundRows.length, allTemplates.length);
    return { entries, buffs };
  }),
});
