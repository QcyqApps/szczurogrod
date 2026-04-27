import { TRPCError } from '@trpc/server';
import { eq, sql } from 'drizzle-orm';
import type { ActiveCompanion, CompanionOffer } from '@grodno/shared';
import { GEM_SINK_COSTS, hireCompanionInputSchema } from '@grodno/shared';
import { REGISTRY, type CompanionTemplate } from '../content/registry.js';
import { characterCompanions, characters } from '../db/schema.js';
import { getChapterByLevel } from '../game/chapters.js';
import {
  computeHealerCost,
  getCompanion,
  getRumorsForDate,
  HEALER_COOLDOWN_MS,
} from '../game/tavern.js';
import { isoDateUTC } from '../game/daily.js';
import { protectedProcedure, publicProcedure, router } from '../trpc/trpc.js';

function templateToOffer(t: CompanionTemplate): CompanionOffer {
  return {
    slug: t.slug,
    name: t.name,
    cls: t.cls,
    lvl: t.lvl,
    price: t.price,
    trait: t.trait,
  };
}

export const tavernRouter = router({
  listCompanions: publicProcedure.query((): CompanionOffer[] =>
    [...REGISTRY.companions.values()].map(templateToOffer),
  ),

  getRumors: protectedProcedure.query(async ({ ctx }): Promise<string[]> => {
    const [row] = await ctx.db
      .select({ lvl: characters.lvl })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    const chapter = getChapterByLevel(row?.lvl ?? 1).id;
    return getRumorsForDate(isoDateUTC(), 3, chapter);
  }),

  getActive: protectedProcedure.query(async ({ ctx }): Promise<ActiveCompanion | null> => {
    const [char] = await ctx.db
      .select({ id: characters.id })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) return null;
    const [row] = await ctx.db
      .select()
      .from(characterCompanions)
      .where(eq(characterCompanions.characterId, char.id))
      .limit(1);
    if (!row) return null;
    const tpl = getCompanion(row.companionSlug);
    if (!tpl) return null;
    return { ...templateToOffer(tpl), hiredAt: row.hiredAt.getTime() };
  }),

  hire: protectedProcedure.input(hireCompanionInputSchema).mutation(async ({ ctx, input }) => {
    const tpl = getCompanion(input.slug);
    if (!tpl) throw new TRPCError({ code: 'NOT_FOUND', message: 'Unknown companion' });

    const [char] = await ctx.db
      .select()
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });

    const [existing] = await ctx.db
      .select({ id: characterCompanions.id })
      .from(characterCompanions)
      .where(eq(characterCompanions.characterId, char.id))
      .limit(1);
    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Already have a companion — dismiss first',
      });
    }

    if (char.gold < tpl.price) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not enough gold' });
    }

    await ctx.db.transaction(async (tx) => {
      await tx
        .update(characters)
        .set({ gold: char.gold - tpl.price, updatedAt: new Date() })
        .where(eq(characters.id, char.id));
      await tx.insert(characterCompanions).values({
        characterId: char.id,
        companionSlug: tpl.slug,
      });
    });

    return { ok: true };
  }),

  dismiss: protectedProcedure.mutation(async ({ ctx }) => {
    const [char] = await ctx.db
      .select({ id: characters.id })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
    await ctx.db
      .delete(characterCompanions)
      .where(eq(characterCompanions.characterId, char.id));
    return { ok: true };
  }),

  healFull: protectedProcedure.mutation(async ({ ctx }) => {
    const [char] = await ctx.db
      .select()
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });

    const now = new Date();
    if (char.lastHealerAt) {
      const ready = char.lastHealerAt.getTime() + HEALER_COOLDOWN_MS;
      if (ready > now.getTime()) {
        const minsLeft = Math.ceil((ready - now.getTime()) / 60_000);
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Uzdrowiciel odpoczywa jeszcze ${minsLeft} min.`,
        });
      }
    }

    const cost = computeHealerCost(char.lvl);
    if (char.gold < cost) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Za mało złota' });
    }

    // Full heal + reset regen anchors so we don't "owe" the player ticks that
    // accumulated while max-HP-but-not-drawn-down.
    await ctx.db
      .update(characters)
      .set({
        gold: char.gold - cost,
        hp: char.hpMax,
        mp: char.mpMax,
        lastHpTickAt: now,
        lastMpTickAt: now,
        lastHealerAt: now,
        updatedAt: now,
      })
      .where(eq(characters.id, char.id));

    return {
      ok: true,
      cost,
      hp: char.hpMax,
      mp: char.mpMax,
      nextReadyAt: now.getTime() + HEALER_COOLDOWN_MS,
    };
  }),

  /**
   * Gem sink: natychmiast heal pełny HP/MP z bypass 1h cooldownu healera.
   * Nie zeruje `lastHealerAt` — jeśli regular healer był na cooldownie, zostanie.
   */
  healInstant: protectedProcedure.mutation(async ({ ctx }) => {
    const [char] = await ctx.db
      .select()
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });
    const cost = GEM_SINK_COSTS.healInstant;
    if (char.gems < cost) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Brak gemów (${cost}).` });
    }
    if (char.hp >= char.hpMax && char.mp >= char.mpMax) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'HP i MP już pełne.' });
    }
    const now = new Date();
    await ctx.db
      .update(characters)
      .set({
        gems: sql`${characters.gems} - ${cost}`,
        hp: char.hpMax,
        mp: char.mpMax,
        lastHpTickAt: now,
        lastMpTickAt: now,
        updatedAt: now,
      })
      .where(eq(characters.id, char.id));
    return { ok: true, cost };
  }),

  /**
   * Gem sink: refresh offer kompanów — nowa oferta na dziś (reroll).
   * Implementacja: nasz tavern.listCompanions zwraca WSZYSTKICH z registry,
   * oferta nie ma osobnego gate'owania per-dzień. Reroll w tym systemie
   * pełni rolę flavor / reset seen-state (klient może trzymać "last seen offer
   * hash" i resetować). Server po prostu odejmuje gemy i zwraca nowy batch
   * (same lista, ale można dodać per-char limitów w przyszłości).
   */
  rerollCompanions: protectedProcedure.mutation(async ({ ctx }) => {
    const [char] = await ctx.db
      .select({ id: characters.id, gems: characters.gems })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });
    const cost = GEM_SINK_COSTS.rerollCompanions;
    if (char.gems < cost) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Brak gemów (${cost}).` });
    }
    await ctx.db
      .update(characters)
      .set({ gems: sql`${characters.gems} - ${cost}` })
      .where(eq(characters.id, char.id));
    return { ok: true, cost };
  }),
});
