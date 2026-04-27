import { TRPCError } from '@trpc/server';
import { asc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { reloadContent } from '../content/registry.js';
import type { Db } from '../db/client.js';
import {
  companionTemplates,
  dailyLadder,
  enemyTemplates,
  itemTemplates,
  mobTierConfig,
  questTemplates,
  shopListings,
} from '../db/schema.js';
import { adminProcedure, router } from '../trpc/trpc.js';

/**
 * Admin endpoints. Gated by the `x-admin-token` request header matching
 * the ADMIN_TOKEN env var (see `adminProcedure` in trpc/trpc.ts). Intended
 * flow: player opens /admin in the web app, enters the token, edits content
 * via tRPC mutations, each mutation auto-reloads REGISTRY so the change is
 * visible to every player immediately — no redeploy, no manual reload.
 *
 * Deleting a row referenced by a junction table (shop_listings,
 * mob_loot_entries, etc.) fails on FK restrict; that's intentional. The
 * admin must clear pool entries first.
 */

async function reloadAndReturn<T>(db: Db, payload: T): Promise<T & { reloadedAt: number }> {
  await reloadContent(db);
  return { ...payload, reloadedAt: Date.now() };
}

const itemSlotEnumValues = [
  'head',
  'neck',
  'chest',
  'weapon',
  'off',
  'hands',
  'ring',
  'feet',
  'potion',
  'any',
] as const;
const rarityValues = ['common', 'rare', 'epic', 'legendary'] as const;
const classValues = ['warrior', 'mage', 'rogue'] as const;

const itemTemplateInputSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(80),
  icon: z.string().min(1).max(64),
  slot: z.enum(itemSlotEnumValues),
  rarity: z.enum(rarityValues),
  atk: z.number().int().nullable().optional(),
  def: z.number().int().nullable().optional(),
  mag: z.number().int().nullable().optional(),
  desc: z.string().nullable().optional(),
  allowedClasses: z.array(z.enum(classValues)).nullable().optional(),
});

const itemTemplateUpdateSchema = itemTemplateInputSchema.partial().extend({
  id: z.string().min(1).max(64),
});

const itemTemplatesRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select().from(itemTemplates).orderBy(asc(itemTemplates.id));
    return rows;
  }),

  create: adminProcedure.input(itemTemplateInputSchema).mutation(async ({ ctx, input }) => {
    await ctx.db.insert(itemTemplates).values({
      id: input.id,
      name: input.name,
      icon: input.icon,
      slot: input.slot,
      rarity: input.rarity,
      atk: input.atk ?? null,
      def: input.def ?? null,
      mag: input.mag ?? null,
      desc: input.desc ?? null,
      allowedClasses: input.allowedClasses ?? null,
    });
    return reloadAndReturn(ctx.db, { ok: true as const, id: input.id });
  }),

  update: adminProcedure.input(itemTemplateUpdateSchema).mutation(async ({ ctx, input }) => {
    const { id, ...patch } = input;
    const update: Record<string, unknown> = {};
    if ('name' in patch) update.name = patch.name;
    if ('icon' in patch) update.icon = patch.icon;
    if ('slot' in patch) update.slot = patch.slot;
    if ('rarity' in patch) update.rarity = patch.rarity;
    if ('atk' in patch) update.atk = patch.atk ?? null;
    if ('def' in patch) update.def = patch.def ?? null;
    if ('mag' in patch) update.mag = patch.mag ?? null;
    if ('desc' in patch) update.desc = patch.desc ?? null;
    if ('allowedClasses' in patch) update.allowedClasses = patch.allowedClasses ?? null;
    if (Object.keys(update).length === 0) {
      return reloadAndReturn(ctx.db, { ok: true as const, id });
    }
    const result = await ctx.db
      .update(itemTemplates)
      .set(update)
      .where(eq(itemTemplates.id, id))
      .returning({ id: itemTemplates.id });
    if (result.length === 0) {
      throw new TRPCError({ code: 'NOT_FOUND', message: `item_templates.${id} not found` });
    }
    return reloadAndReturn(ctx.db, { ok: true as const, id });
  }),

  remove: adminProcedure
    .input(z.object({ id: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db
          .delete(itemTemplates)
          .where(eq(itemTemplates.id, input.id))
          .returning({ id: itemTemplates.id });
        if (result.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `item_templates.${input.id} not found`,
          });
        }
        return reloadAndReturn(ctx.db, { ok: true as const, id: input.id });
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        const msg = err instanceof Error ? err.message : String(err);
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Cannot delete (in use by shop_listings / loot pools?): ${msg}`,
        });
      }
    }),
});

// -------- shop_listings --------

const shopListingInputSchema = z.object({
  id: z.string().min(1).max(64),
  itemTemplateId: z.string().min(1).max(64),
  price: z.number().int().min(0),
  usesGems: z.boolean(),
  requiredLvl: z.number().int().min(1).max(100),
});

const shopListingsRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(shopListings).orderBy(asc(shopListings.id));
  }),

  create: adminProcedure.input(shopListingInputSchema).mutation(async ({ ctx, input }) => {
    await ctx.db.insert(shopListings).values(input);
    return reloadAndReturn(ctx.db, { ok: true as const, id: input.id });
  }),

  update: adminProcedure
    .input(shopListingInputSchema.partial().extend({ id: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...patch } = input;
      if (Object.keys(patch).length === 0) {
        return reloadAndReturn(ctx.db, { ok: true as const, id });
      }
      const result = await ctx.db
        .update(shopListings)
        .set(patch)
        .where(eq(shopListings.id, id))
        .returning({ id: shopListings.id });
      if (result.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `shop_listings.${id} not found` });
      }
      return reloadAndReturn(ctx.db, { ok: true as const, id });
    }),

  remove: adminProcedure
    .input(z.object({ id: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(shopListings)
        .where(eq(shopListings.id, input.id))
        .returning({ id: shopListings.id });
      if (result.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `shop_listings.${input.id} not found`,
        });
      }
      return reloadAndReturn(ctx.db, { ok: true as const, id: input.id });
    }),
});

// -------- quest_templates --------

const questTemplateInputSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().min(1).max(80),
  desc: z.string(),
  icon: z.string().min(1).max(64),
  diff: z.enum(['Łatwe', 'Średnie', 'Trudne', 'Ekstr.', 'Boss']),
  gold: z.number().int().min(0),
  xp: z.number().int().min(0),
  itemChance: z.number().int().min(0).max(100),
  duration: z.number().int().min(1000),
  requiredLvl: z.number().int().min(1).max(100),
  chapter: z.enum(['akt-1', 'akt-2', 'akt-3', 'akt-4', 'akt-5']),
});

const questTemplatesRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(questTemplates).orderBy(asc(questTemplates.requiredLvl));
  }),

  create: adminProcedure.input(questTemplateInputSchema).mutation(async ({ ctx, input }) => {
    await ctx.db.insert(questTemplates).values(input);
    return reloadAndReturn(ctx.db, { ok: true as const, id: input.id });
  }),

  update: adminProcedure
    .input(questTemplateInputSchema.partial().extend({ id: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...patch } = input;
      if (Object.keys(patch).length === 0) {
        return reloadAndReturn(ctx.db, { ok: true as const, id });
      }
      const result = await ctx.db
        .update(questTemplates)
        .set(patch)
        .where(eq(questTemplates.id, id))
        .returning({ id: questTemplates.id });
      if (result.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `quest_templates.${id} not found` });
      }
      return reloadAndReturn(ctx.db, { ok: true as const, id });
    }),

  remove: adminProcedure
    .input(z.object({ id: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(questTemplates)
        .where(eq(questTemplates.id, input.id))
        .returning({ id: questTemplates.id });
      if (result.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `quest_templates.${input.id} not found`,
        });
      }
      return reloadAndReturn(ctx.db, { ok: true as const, id: input.id });
    }),
});

// -------- enemy_templates --------

const enemyTemplateInputSchema = z.object({
  slug: z.string().min(1).max(64),
  name: z.string().min(1).max(80),
  lvl: z.number().int().min(1).max(100),
  hp: z.number().int().min(1),
  atk: z.number().int().min(0),
  gold: z.number().int().min(0),
  xp: z.number().int().min(0),
  requiredLvl: z.number().int().min(1).max(100),
  tier: z.number().int().min(1).max(4),
});

const enemyTemplatesRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(enemyTemplates).orderBy(asc(enemyTemplates.requiredLvl));
  }),

  create: adminProcedure.input(enemyTemplateInputSchema).mutation(async ({ ctx, input }) => {
    await ctx.db.insert(enemyTemplates).values(input);
    return reloadAndReturn(ctx.db, { ok: true as const, slug: input.slug });
  }),

  update: adminProcedure
    .input(enemyTemplateInputSchema.partial().extend({ slug: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const { slug, ...patch } = input;
      if (Object.keys(patch).length === 0) {
        return reloadAndReturn(ctx.db, { ok: true as const, slug });
      }
      const result = await ctx.db
        .update(enemyTemplates)
        .set(patch)
        .where(eq(enemyTemplates.slug, slug))
        .returning({ slug: enemyTemplates.slug });
      if (result.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `enemy_templates.${slug} not found`,
        });
      }
      return reloadAndReturn(ctx.db, { ok: true as const, slug });
    }),

  remove: adminProcedure
    .input(z.object({ slug: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(enemyTemplates)
        .where(eq(enemyTemplates.slug, input.slug))
        .returning({ slug: enemyTemplates.slug });
      if (result.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `enemy_templates.${input.slug} not found`,
        });
      }
      return reloadAndReturn(ctx.db, { ok: true as const, slug: input.slug });
    }),
});

// -------- companion_templates --------

const companionBuffSchema = z.object({
  atkBonus: z.number().int().optional(),
  magBonus: z.number().int().optional(),
  lootBonusPct: z.number().int().min(0).max(100).optional(),
  healBonus: z.number().min(0).max(1).optional(),
});

const companionTemplateInputSchema = z.object({
  slug: z.string().min(1).max(64),
  name: z.string().min(1).max(80),
  cls: z.enum(['warrior', 'mage', 'rogue']),
  lvl: z.number().int().min(1).max(100),
  price: z.number().int().min(0),
  trait: z.string(),
  buff: companionBuffSchema,
});

const companionTemplatesRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(companionTemplates).orderBy(asc(companionTemplates.slug));
  }),

  create: adminProcedure
    .input(companionTemplateInputSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(companionTemplates).values(input);
      return reloadAndReturn(ctx.db, { ok: true as const, slug: input.slug });
    }),

  update: adminProcedure
    .input(companionTemplateInputSchema.partial().extend({ slug: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const { slug, ...patch } = input;
      if (Object.keys(patch).length === 0) {
        return reloadAndReturn(ctx.db, { ok: true as const, slug });
      }
      const result = await ctx.db
        .update(companionTemplates)
        .set(patch)
        .where(eq(companionTemplates.slug, slug))
        .returning({ slug: companionTemplates.slug });
      if (result.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `companion_templates.${slug} not found`,
        });
      }
      return reloadAndReturn(ctx.db, { ok: true as const, slug });
    }),

  remove: adminProcedure
    .input(z.object({ slug: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(companionTemplates)
        .where(eq(companionTemplates.slug, input.slug))
        .returning({ slug: companionTemplates.slug });
      if (result.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `companion_templates.${input.slug} not found`,
        });
      }
      return reloadAndReturn(ctx.db, { ok: true as const, slug: input.slug });
    }),
});

// -------- daily_ladder (update-only, fixed 7 rows) --------

const dailyLadderUpdateSchema = z.object({
  day: z.number().int().min(1).max(7),
  kind: z.enum(['gold', 'xp', 'potion', 'gem', 'gift', 'crown']).optional(),
  v: z.string().max(16).optional(),
  gold: z.number().int().min(0).optional(),
  gems: z.number().int().min(0).optional(),
  xp: z.number().int().min(0).optional(),
  itemTemplateId: z.string().max(64).nullable().optional(),
});

const dailyLadderRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(dailyLadder).orderBy(asc(dailyLadder.day));
  }),

  update: adminProcedure.input(dailyLadderUpdateSchema).mutation(async ({ ctx, input }) => {
    const { day, ...patch } = input;
    if (Object.keys(patch).length === 0) {
      return reloadAndReturn(ctx.db, { ok: true as const, day });
    }
    const result = await ctx.db
      .update(dailyLadder)
      .set(patch)
      .where(eq(dailyLadder.day, day))
      .returning({ day: dailyLadder.day });
    if (result.length === 0) {
      throw new TRPCError({ code: 'NOT_FOUND', message: `daily_ladder.day=${day} not found` });
    }
    return reloadAndReturn(ctx.db, { ok: true as const, day });
  }),
});

// -------- mob_tier_config (update-only, fixed 4 rows) --------

const mobTierUpdateSchema = z.object({
  tier: z.number().int().min(1).max(4),
  dropRate: z.number().min(0).max(1).optional(),
  rarityWeights: z
    .object({
      common: z.number().int().min(0),
      rare: z.number().int().min(0),
      epic: z.number().int().min(0),
      legendary: z.number().int().min(0),
    })
    .optional(),
});

const mobTierConfigRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(mobTierConfig).orderBy(asc(mobTierConfig.tier));
  }),

  update: adminProcedure.input(mobTierUpdateSchema).mutation(async ({ ctx, input }) => {
    const { tier, dropRate, rarityWeights } = input;
    const patch: Record<string, unknown> = {};
    if (dropRate !== undefined) patch.dropRate = dropRate.toFixed(2);
    if (rarityWeights !== undefined) patch.rarityWeights = rarityWeights;
    if (Object.keys(patch).length === 0) {
      return reloadAndReturn(ctx.db, { ok: true as const, tier });
    }
    const result = await ctx.db
      .update(mobTierConfig)
      .set(patch)
      .where(eq(mobTierConfig.tier, tier))
      .returning({ tier: mobTierConfig.tier });
    if (result.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `mob_tier_config.tier=${tier} not found`,
      });
    }
    return reloadAndReturn(ctx.db, { ok: true as const, tier });
  }),
});

export const adminRouter = router({
  /**
   * Lightweight per-table counts dla CMS tab labelek. Jedna round-trip
   * z 7 COUNT(*) — cheaper niż fetchowanie każdej tabeli przez jej
   * dedykowany list endpoint.
   */
  counts: adminProcedure.query(async ({ ctx }) => {
    const [items] = await ctx.db.select({ n: sql<number>`count(*)::int` }).from(itemTemplates);
    const [shop] = await ctx.db.select({ n: sql<number>`count(*)::int` }).from(shopListings);
    const [quests] = await ctx.db.select({ n: sql<number>`count(*)::int` }).from(questTemplates);
    const [enemies] = await ctx.db.select({ n: sql<number>`count(*)::int` }).from(enemyTemplates);
    const [companions] = await ctx.db
      .select({ n: sql<number>`count(*)::int` })
      .from(companionTemplates);
    const [daily] = await ctx.db.select({ n: sql<number>`count(*)::int` }).from(dailyLadder);
    const [mobTiers] = await ctx.db.select({ n: sql<number>`count(*)::int` }).from(mobTierConfig);
    return {
      items: items?.n ?? 0,
      shop: shop?.n ?? 0,
      quests: quests?.n ?? 0,
      enemies: enemies?.n ?? 0,
      companions: companions?.n ?? 0,
      daily: daily?.n ?? 0,
      mobTiers: mobTiers?.n ?? 0,
    };
  }),
  reload: adminProcedure.mutation(async ({ ctx }) => {
    const reg = await reloadContent(ctx.db);
    return {
      ok: true as const,
      reloadedAt: Date.now(),
      counts: {
        items: reg.items.size,
        enemies: reg.enemies.size,
        quests: reg.quests.size,
        companions: reg.companions.size,
        shop: reg.shop.size,
        mobLootTiers: reg.mobLoot.size,
        questLootDifficulties: reg.questLoot.size,
        bossDrops: reg.bossDrops.size,
        dailyLadder: reg.dailyLadder.length,
        mounts: reg.mounts.size,
        regions: reg.regions.size,
        dungeons: reg.dungeons.size,
      },
    };
  }),
  itemTemplates: itemTemplatesRouter,
  shopListings: shopListingsRouter,
  questTemplates: questTemplatesRouter,
  enemyTemplates: enemyTemplatesRouter,
  companionTemplates: companionTemplatesRouter,
  dailyLadder: dailyLadderRouter,
  mobTierConfig: mobTierConfigRouter,
});
