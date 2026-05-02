import { TRPCError } from '@trpc/server';
import { and, eq, sql } from 'drizzle-orm';
import type { CharacterClass, InventoryItem, Rarity, SellItemResult } from '@grodno/shared';
import { equipItemInputSchema, isDaggerWeapon, itemIdInputSchema } from '@grodno/shared';
import { REGISTRY, type ItemTemplate } from '../content/registry.js';
import { characterItems, characters } from '../db/schema.js';
import { applyBuff, type BuffKind } from '../game/buffs.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

const SELL_BASE: Record<Rarity, number> = { common: 8, rare: 30, epic: 100, legendary: 350 };
const SELL_STAT_MULT: Record<Rarity, number> = { common: 3, rare: 5, epic: 10, legendary: 18 };

/**
 * Resolve display + stats for a character_items row. When a template_id is
 * set and still exists in the registry, read from the template (so DB edits
 * propagate). Otherwise fall back to the row snapshot (legacy rows from
 * before the content migration, or templates since removed).
 */
function resolveTemplate(
  row: typeof characterItems.$inferSelect,
): ItemTemplate | null {
  return row.templateId ? (REGISTRY.items.get(row.templateId) ?? null) : null;
}

function computeSellPrice(row: typeof characterItems.$inferSelect): number {
  const tpl = resolveTemplate(row);
  const atk = tpl?.atk ?? row.atk ?? 0;
  const def = tpl?.def ?? row.def ?? 0;
  const mag = tpl?.mag ?? row.mag ?? 0;
  const rarity = tpl?.rarity ?? row.rarity;
  return Math.max(1, SELL_BASE[rarity] + (atk + def + mag) * SELL_STAT_MULT[rarity]);
}

function rowToItem(row: typeof characterItems.$inferSelect): InventoryItem {
  const tpl = resolveTemplate(row);
  return {
    id: row.id,
    name: tpl?.name ?? row.name,
    icon: tpl?.icon ?? row.icon,
    // slot/rarity are immutable identity — always read from the row (templates
    // shouldn't change these, and we need them for indexes and partial uniques).
    slot: row.slot,
    rarity: row.rarity,
    atk: tpl?.atk ?? row.atk,
    def: tpl?.def ?? row.def,
    mag: tpl?.mag ?? row.mag,
    // Heal values live only on templates — legacy rows (tpl missing) default to 0,
    // which effectively makes them non-drinkable. Acceptable for now.
    hpHeal: tpl?.hpHeal ?? 0,
    mpHeal: tpl?.mpHeal ?? 0,
    desc: tpl?.desc ?? row.desc,
    equippedSlot: row.equippedSlot,
    sellPrice: computeSellPrice(row),
    qty: row.qty,
    enhancementLevel: row.enhancementLevel,
  };
}

async function requireCharacter(
  db: typeof import('../db/client.js').db,
  userId: string,
) {
  const [char] = await db
    .select({
      id: characters.id,
      hp: characters.hp,
      hpMax: characters.hpMax,
      gold: characters.gold,
      cls: characters.cls,
    })
    .from(characters)
    .where(eq(characters.userId, userId))
    .limit(1);
  if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
  return char;
}

export const inventoryRouter = router({
  list: protectedProcedure.query(async ({ ctx }): Promise<InventoryItem[]> => {
    const char = await requireCharacter(ctx.db, ctx.userId);
    const rows = await ctx.db
      .select()
      .from(characterItems)
      .where(eq(characterItems.characterId, char.id));
    return rows.map(rowToItem);
  }),

  equip: protectedProcedure.input(equipItemInputSchema).mutation(async ({ ctx, input }) => {
    const char = await requireCharacter(ctx.db, ctx.userId);
    const [item] = await ctx.db
      .select()
      .from(characterItems)
      .where(and(eq(characterItems.id, input.itemId), eq(characterItems.characterId, char.id)))
      .limit(1);
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' });
    if (item.slot === 'potion' || item.slot === 'any') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Item is not equippable' });
    }

    // Standardowo slot itemu musi się zgadzać z targetSlot. Wyjątek: łotrzyk
    // może założyć sztylet (broń typu dagger) w slot off-hand zamiast tarczy
    // (dual-wield). Tylko ta jedna kombinacja.
    const tpl = resolveTemplate(item);
    const itemIcon = tpl?.icon ?? item.icon;
    const isDualWieldOffSlot =
      input.targetSlot === 'off' &&
      item.slot === 'weapon' &&
      (char.cls as CharacterClass) === 'rogue' &&
      isDaggerWeapon({ slot: item.slot, icon: itemIcon });

    if (item.slot !== input.targetSlot && !isDualWieldOffSlot) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Item fits slot ${item.slot}, not ${input.targetSlot}`,
      });
    }
    await ctx.db.transaction(async (tx) => {
      // Unequip whatever is currently in that slot
      await tx
        .update(characterItems)
        .set({ equippedSlot: null })
        .where(
          and(
            eq(characterItems.characterId, char.id),
            eq(characterItems.equippedSlot, input.targetSlot),
          ),
        );
      await tx
        .update(characterItems)
        .set({ equippedSlot: input.targetSlot })
        .where(eq(characterItems.id, input.itemId));
    });
    return { ok: true };
  }),

  unequip: protectedProcedure.input(itemIdInputSchema).mutation(async ({ ctx, input }) => {
    const char = await requireCharacter(ctx.db, ctx.userId);
    const result = await ctx.db
      .update(characterItems)
      .set({ equippedSlot: null })
      .where(and(eq(characterItems.id, input.itemId), eq(characterItems.characterId, char.id)))
      .returning({ id: characterItems.id });
    if (result.length === 0) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' });
    }
    return { ok: true };
  }),

  drop: protectedProcedure.input(itemIdInputSchema).mutation(async ({ ctx, input }) => {
    const char = await requireCharacter(ctx.db, ctx.userId);
    const result = await ctx.db
      .delete(characterItems)
      .where(and(eq(characterItems.id, input.itemId), eq(characterItems.characterId, char.id)))
      .returning({ id: characterItems.id });
    if (result.length === 0) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' });
    }
    return { ok: true };
  }),

  sell: protectedProcedure
    .input(itemIdInputSchema)
    .mutation(async ({ ctx, input }): Promise<SellItemResult> => {
      const char = await requireCharacter(ctx.db, ctx.userId);
      const [item] = await ctx.db
        .select()
        .from(characterItems)
        .where(and(eq(characterItems.id, input.itemId), eq(characterItems.characterId, char.id)))
        .limit(1);
      if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' });
      const price = computeSellPrice(item);
      const newGold = char.gold + price;
      await ctx.db.transaction(async (tx) => {
        if (item.qty > 1) {
          await tx
            .update(characterItems)
            .set({ qty: item.qty - 1 })
            .where(eq(characterItems.id, input.itemId));
        } else {
          await tx.delete(characterItems).where(eq(characterItems.id, input.itemId));
        }
        await tx
          .update(characters)
          .set({ gold: sql`${characters.gold} + ${price}`, updatedAt: new Date() })
          .where(eq(characters.id, char.id));
      });
      return { gold: newGold, price };
    }),

  usePotion: protectedProcedure.input(itemIdInputSchema).mutation(async ({ ctx, input }) => {
    const char = await requireCharacter(ctx.db, ctx.userId);
    const [item] = await ctx.db
      .select()
      .from(characterItems)
      .where(and(eq(characterItems.id, input.itemId), eq(characterItems.characterId, char.id)))
      .limit(1);
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' });
    if (item.slot !== 'potion') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Item is not a potion' });
    }
    const tpl = resolveTemplate(item);

    // Rozróżniamy dwie kategorie mikstur:
    // 1) Classic heal — restore HP (+ opcjonalnie MP) na miejscu. Baseline
    //    wg rarity gdy template brak (legacy wiersze); jeśli template ma
    //    `hpHeal > 0`, używamy tej wartości zamiast baseline'u.
    // 2) Timed buff — gdy template ma `buffKind` ustawiony, odpala applyBuff
    //    z override semantics (override starej mikstury tej samej kategorii).
    // Mikstura może być "mixed" — mieć zarówno hpHeal jak i buffKind. Wtedy
    // robimy oba. Obecna pula items tego nie ma, ale contract to dopuszcza.
    const baselineHeal =
      item.rarity === 'legendary' ? 200 : item.rarity === 'rare' ? 100 : 50;
    const hpHeal = tpl?.hpHeal && tpl.hpHeal > 0 ? tpl.hpHeal : tpl?.buffKind ? 0 : baselineHeal;
    const mpHeal = tpl?.mpHeal ?? 0;
    const buffKind = tpl?.buffKind ? (tpl.buffKind as BuffKind) : null;
    const buffMagnitude = tpl?.buffMagnitude ?? 0;
    const buffHours = tpl?.buffDurationHours ?? 0;
    const sourceItemId = tpl?.id ?? null;

    let buffExpiresAt: Date | null = null;
    await ctx.db.transaction(async (tx) => {
      if (hpHeal > 0 || mpHeal > 0) {
        const newHp = Math.min(char.hpMax, char.hp + hpHeal);
        await tx
          .update(characters)
          .set({ hp: newHp, updatedAt: new Date() })
          .where(eq(characters.id, char.id));
        if (mpHeal > 0) {
          await tx
            .update(characters)
            .set({ mp: sql`LEAST(${characters.mpMax}, ${characters.mp} + ${mpHeal})`, updatedAt: new Date() })
            .where(eq(characters.id, char.id));
        }
      }
      if (buffKind && buffMagnitude > 0 && buffHours > 0) {
        buffExpiresAt = await applyBuff(
          tx,
          char.id,
          buffKind,
          buffMagnitude,
          buffHours,
          sourceItemId,
          new Date(),
        );
      }
      if (item.qty > 1) {
        await tx
          .update(characterItems)
          .set({ qty: item.qty - 1 })
          .where(eq(characterItems.id, input.itemId));
      } else {
        await tx.delete(characterItems).where(eq(characterItems.id, input.itemId));
      }
    });
    return {
      healed: hpHeal,
      mpHealed: mpHeal,
      buffKind,
      buffMagnitude: buffKind ? buffMagnitude : 0,
      buffExpiresAt: buffExpiresAt ? (buffExpiresAt as Date).getTime() : null,
    };
  }),
});
