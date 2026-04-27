import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import type { ActiveMount, MountOffer, StablesListResponse } from '@grodno/shared';
import { rentMountInputSchema } from '@grodno/shared';
import type { AchievementUnlockPayload } from '@grodno/shared';
import { REGISTRY, type MountTemplate } from '../content/registry.js';
import { characters } from '../db/schema.js';
import { collectBump } from '../game/achievements.js';
import { getActiveMount } from '../game/mounts.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

function templateToOffer(t: MountTemplate): MountOffer {
  return {
    slug: t.slug,
    name: t.name,
    icon: t.icon,
    desc: t.desc,
    speedPct: t.speedPct,
    price: t.price,
    rentalHours: t.rentalHours,
    requiredLvl: t.requiredLvl,
  };
}

function activeFromChar(
  char: { mountSlug: string | null; mountExpiresAt: Date | null },
  now: Date,
): ActiveMount | null {
  const tpl = getActiveMount(char, now);
  if (!tpl || !char.mountExpiresAt) return null;
  return {
    slug: tpl.slug,
    name: tpl.name,
    icon: tpl.icon,
    speedPct: tpl.speedPct,
    expiresAt: char.mountExpiresAt.getTime(),
  };
}

export const stablesRouter = router({
  list: protectedProcedure.query(async ({ ctx }): Promise<StablesListResponse> => {
    const [char] = await ctx.db
      .select({
        lvl: characters.lvl,
        gold: characters.gold,
        mountSlug: characters.mountSlug,
        mountExpiresAt: characters.mountExpiresAt,
      })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });

    const now = new Date();
    // Analogicznie do shop.catalog: pokazuj jeden tier do przodu, żeby gracz
    // widział do czego dąży. Mutacja i tak re-check'uje requiredLvl.
    const mounts = REGISTRY.mountsList
      .filter((m) => m.requiredLvl <= char.lvl + 2)
      .map(templateToOffer);

    // Podpowiedź o kolejnym unlocku — liczona po WSZYSTKICH mountach (nie
    // tylko widocznych), żeby gracz wiedział że coś jeszcze czeka za progiem
    // `char.lvl + 2`. Null = wszystkie dostępne.
    const lockedRequirements = REGISTRY.mountsList
      .map((m) => m.requiredLvl)
      .filter((lvl) => lvl > char.lvl);
    const nextUnlockLvl =
      lockedRequirements.length > 0 ? Math.min(...lockedRequirements) : null;

    return {
      mounts,
      active: activeFromChar(char, now),
      gold: char.gold,
      lvl: char.lvl,
      nextUnlockLvl,
    };
  }),

  getActive: protectedProcedure.query(async ({ ctx }): Promise<ActiveMount | null> => {
    const [char] = await ctx.db
      .select({
        mountSlug: characters.mountSlug,
        mountExpiresAt: characters.mountExpiresAt,
      })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) return null;
    return activeFromChar(char, new Date());
  }),

  rent: protectedProcedure.input(rentMountInputSchema).mutation(async ({ ctx, input }) => {
    const tpl = REGISTRY.mounts.get(input.slug);
    if (!tpl) throw new TRPCError({ code: 'NOT_FOUND', message: 'Nieznany wierzchowiec' });

    const [char] = await ctx.db
      .select()
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });

    if (char.lvl < tpl.requiredLvl) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Wierzchowiec dostępny od LVL ${tpl.requiredLvl}`,
      });
    }

    const now = new Date();
    const active = getActiveMount(char, now);
    if (active) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Wierzchowiec już w stajni. Wróć po wygaśnięciu najmu.',
      });
    }

    if (char.gold < tpl.price) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Za mało złota' });
    }

    const expiresAt = new Date(now.getTime() + tpl.rentalHours * 3_600_000);
    await ctx.db
      .update(characters)
      .set({
        gold: char.gold - tpl.price,
        mountSlug: tpl.slug,
        mountExpiresAt: expiresAt,
        updatedAt: now,
      })
      .where(eq(characters.id, char.id));

    const unlocks: AchievementUnlockPayload[] = [];
    await collectBump(unlocks, ctx.db, char.id, 'first_mount');

    return {
      ok: true,
      cost: tpl.price,
      active: {
        slug: tpl.slug,
        name: tpl.name,
        icon: tpl.icon,
        speedPct: tpl.speedPct,
        expiresAt: expiresAt.getTime(),
      } satisfies ActiveMount,
      unlockedAchievements: unlocks,
    };
  }),
});
