// Baba Jaga — zdejmuje klątwy za gold (per-klątwa) albo za gemy (all-in-one).
//
// Flow: klątwa = wiersz w `character_buffs` z is_curse=true. Baba Jaga:
//   - `status` → lista aktywnych klątw + per-klątwa cena gold (scaled by LVL)
//   - `remove` → zdejmij jedną po slug'u
//   - `removeAll` → zdejmij wszystkie naraz za gemy (premium)
//
// Cena zdjęcia liczona server-side z LVL (anti-cheat). Formuła mirror'uje
// Panteleon: `base * (1 + lvl^1.6 / 10)`, base 80g (taniej niż blessing —
// zdejmowanie klątwy to „naprawa", nie „ulepszenie").

import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import {
  GEM_SINK_COSTS,
  witchRemoveInputSchema,
  type ActiveCurse,
  type WitchRemoveAllResponse,
  type WitchRemoveResponse,
  type WitchStatusResponse,
} from '@grodno/shared';
import { characterBuffs, characters } from '../db/schema.js';
import { loadActiveBuffs } from '../game/buffs.js';
import { getCurse } from '../game/curses.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

/** Cena zdjęcia pojedynczej klątwy. Base 80g, scaled identycznie jak blessing
 *  (uzasadnienie: Baba Jaga konkuruje z Panteleonem o ten sam wallet share). */
function computeRemoveCost(charLvl: number): number {
  const mult = 1 + Math.pow(Math.max(1, charLvl), 1.6) / 10;
  return Math.round(80 * mult);
}

export const witchRouter = router({
  status: protectedProcedure.query(async ({ ctx }): Promise<WitchStatusResponse> => {
    const [char] = await ctx.db
      .select({ id: characters.id, lvl: characters.lvl })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });

    const active = await loadActiveBuffs(ctx.db, char.id);
    const curses: ActiveCurse[] = [];
    const removeCost = computeRemoveCost(char.lvl);
    for (const b of active) {
      if (!b.isCurse) continue;
      const tpl = b.sourceItemId ? getCurse(b.sourceItemId) : null;
      curses.push({
        slug: b.sourceItemId ?? `unknown-${b.kind}`,
        kind: b.kind,
        name: tpl?.name ?? 'Klątwa Bezimienna',
        desc: tpl?.desc ?? 'Coś złego. Baba Jaga wie co.',
        magnitude: b.magnitude,
        expiresAt: b.expiresAt.getTime(),
        removeCostGold: removeCost,
      });
    }

    return {
      curses,
      removeAllCostGems: curses.length > 0 ? GEM_SINK_COSTS.witchRemoveAll : null,
    };
  }),

  remove: protectedProcedure
    .input(witchRemoveInputSchema)
    .mutation(async ({ ctx, input }): Promise<WitchRemoveResponse> => {
      const [char] = await ctx.db
        .select()
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);
      if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });

      const cost = computeRemoveCost(char.lvl);
      if (char.gold < cost) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Brak gold'a (${cost}). Masz ${char.gold}.`,
        });
      }

      // Potwierdź że klątwa o tym slug'u istnieje + jest aktywna (anti-cheat).
      const active = await loadActiveBuffs(ctx.db, char.id);
      const curse = active.find((b) => b.isCurse && b.sourceItemId === input.slug);
      if (!curse) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Klątwy już nie ma. Baba Jaga robi sobie kawę.',
        });
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .delete(characterBuffs)
          .where(
            and(
              eq(characterBuffs.characterId, char.id),
              eq(characterBuffs.kind, curse.kind),
              eq(characterBuffs.isCurse, true),
            ),
          );
        await tx
          .update(characters)
          .set({ gold: char.gold - cost, updatedAt: new Date() })
          .where(eq(characters.id, char.id));
      });

      return { ok: true as const, gold: char.gold - cost };
    }),

  removeAll: protectedProcedure.mutation(async ({ ctx }): Promise<WitchRemoveAllResponse> => {
    const [char] = await ctx.db
      .select()
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });

    const cost = GEM_SINK_COSTS.witchRemoveAll;
    if (char.gems < cost) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Brak gemów (${cost}). Masz ${char.gems}.`,
      });
    }

    const active = await loadActiveBuffs(ctx.db, char.id);
    const curses = active.filter((b) => b.isCurse);
    if (curses.length === 0) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Nie masz żadnych klątw. Baba Jaga by Cię i tak obciążyła, ale nie wypada.',
      });
    }

    await ctx.db.transaction(async (tx) => {
      await tx
        .delete(characterBuffs)
        .where(
          and(eq(characterBuffs.characterId, char.id), eq(characterBuffs.isCurse, true)),
        );
      await tx
        .update(characters)
        .set({ gems: char.gems - cost, updatedAt: new Date() })
        .where(eq(characters.id, char.id));
    });

    return {
      ok: true as const,
      gems: char.gems - cost,
      removedCount: curses.length,
    };
  }),
});
