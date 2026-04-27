import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { shopBuyInputSchema } from '@grodno/shared';
import { REGISTRY } from '../content/registry.js';
import { characterItems, characters, shopPurchases } from '../db/schema.js';
import type { AchievementUnlockPayload } from '@grodno/shared';
import { collectBump } from '../game/achievements.js';
import { isoDateUTC } from '../game/daily.js';
import {
  BAG_CAP,
  getBagCount,
  insertOrStackPotion,
  itemTemplateToRowValues,
} from '../game/inventory.js';
import { registerScrapbookFind } from '../game/scrapbook.js';
import {
  buildShopSeed,
  computeShopRefreshCost,
  filterShopPool,
  getShopListing,
  pickDailyShopListings,
} from '../game/shop.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

/**
 * Zwraca aktualny licznik odświeżeń dziś — 0 gdy `shopRefreshDate` to inna
 * UTC data niż dzisiejsza (lazy reset bez dodatkowej mutacji).
 */
function resolveRefreshCountToday(
  shopRefreshDate: string | null,
  shopRefreshCountToday: number,
  today: string,
): number {
  return shopRefreshDate === today ? shopRefreshCountToday : 0;
}

export const shopRouter = router({
  catalog: protectedProcedure.query(async ({ ctx }) => {
    const [char] = await ctx.db
      .select({
        id: characters.id,
        lvl: characters.lvl,
        cls: characters.cls,
        shopRefreshCountToday: characters.shopRefreshCountToday,
        shopRefreshDate: characters.shopRefreshDate,
      })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    const lvl = char?.lvl ?? 1;
    const cls = char?.cls;
    const today = isoDateUTC();
    // Pull today's purchases for this character — tiny set (bounded by visible
    // listings), so a Set lookup is fine. Shop refreshes at 00:00 UTC when
    // `isoDateUTC()` rolls over and the rows stop matching. Gem-sink refresh
    // usuwa wiersze dla dzisiejszej daty — sold-out się odblokowuje.
    const soldToday = char
      ? new Set(
          (
            await ctx.db
              .select({ listingId: shopPurchases.listingId })
              .from(shopPurchases)
              .where(
                and(
                  eq(shopPurchases.characterId, char.id),
                  eq(shopPurchases.purchasedDate, today),
                ),
              )
          ).map((r) => r.listingId),
        )
      : new Set<string>();
    const refreshCountToday = char
      ? resolveRefreshCountToday(char.shopRefreshDate, char.shopRefreshCountToday, today)
      : 0;
    // Random roll 6 listingów — seed z (charId, today, refreshCount). Manual
    // refresh bumpuje count → inny seed → inne 6. Filtr klasy/LVL zostaje.
    const pool = filterShopPool([...REGISTRY.shop.values()], lvl, cls);
    const picked = char
      ? pickDailyShopListings(pool, buildShopSeed(char.id, today, refreshCountToday))
      : pool.slice(0, 6);
    const items = picked.map((l) => ({
      id: l.id,
      name: l.item.name,
      icon: l.item.icon,
      rarity: l.item.rarity,
      slot: l.item.slot,
      atk: l.item.atk ?? 0,
      def: l.item.def ?? 0,
      mag: l.item.mag ?? 0,
      hpHeal: l.item.hpHeal,
      mpHeal: l.item.mpHeal,
      price: l.price,
      desc: l.item.desc ?? '',
      gems: l.usesGems,
      requiredLvl: l.requiredLvl,
      soldOut: soldToday.has(l.id),
    }));
    return {
      items,
      refreshCost: computeShopRefreshCost(refreshCountToday),
      refreshCountToday,
    };
  }),

  /**
   * Ręczne odświeżenie sklepu za gemy. Usuwa wiersze `shop_purchases` dla
   * bieżącej UTC daty → wszystkie listingi wracają jako dostępne do kupna.
   * Koszt skaluje się per count/day: 10 → 20 → 40 → 80 → 160 (cap).
   */
  refresh: protectedProcedure.mutation(async ({ ctx }) => {
    const [char] = await ctx.db
      .select()
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });

    const today = isoDateUTC();
    const countToday = resolveRefreshCountToday(
      char.shopRefreshDate,
      char.shopRefreshCountToday,
      today,
    );
    const cost = computeShopRefreshCost(countToday);
    if (char.gems < cost) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Brak gemów (${cost}). Masz ${char.gems}.`,
      });
    }

    await ctx.db.transaction(async (tx) => {
      await tx
        .delete(shopPurchases)
        .where(
          and(
            eq(shopPurchases.characterId, char.id),
            eq(shopPurchases.purchasedDate, today),
          ),
        );
      await tx
        .update(characters)
        .set({
          gems: char.gems - cost,
          shopRefreshCountToday: countToday + 1,
          shopRefreshDate: today,
          updatedAt: new Date(),
        })
        .where(eq(characters.id, char.id));
    });

    const newCount = countToday + 1;
    return {
      ok: true as const,
      cost,
      refreshCountToday: newCount,
      refreshCost: computeShopRefreshCost(newCount),
    };
  }),

  buy: protectedProcedure.input(shopBuyInputSchema).mutation(async ({ ctx, input }) => {
    const listing = getShopListing(input.itemId);
    if (!listing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Unknown item' });
    const { item, price, usesGems, requiredLvl } = listing;

    const [char] = await ctx.db
      .select()
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });

    if (char.lvl < requiredLvl) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Przedmiot dostępny od LVL ${requiredLvl}`,
      });
    }

    if (item.allowedClasses && !item.allowedClasses.includes(char.cls)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Ten przedmiot nie jest dla twojej klasy.',
      });
    }

    // Anti-cheat: kupowany listing musi być w aktualnym rollu postaci. Bez
    // tego klient mógłby POST'ować dowolny shop ID — semantyka losowania
    // ginie. Rebuildujemy seed'a z identycznych parametrów co w catalog.
    const todayForRoll = isoDateUTC();
    const refreshCountForRoll = resolveRefreshCountToday(
      char.shopRefreshDate,
      char.shopRefreshCountToday,
      todayForRoll,
    );
    const rolledPool = filterShopPool([...REGISTRY.shop.values()], char.lvl, char.cls);
    const rolledIds = new Set(
      pickDailyShopListings(rolledPool, buildShopSeed(char.id, todayForRoll, refreshCountForRoll)).map(
        (l) => l.id,
      ),
    );
    if (!rolledIds.has(input.itemId)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Ten przedmiot nie jest dziś w sklepie.',
      });
    }

    const currency = usesGems ? 'gems' : 'gold';
    const current = usesGems ? char.gems : char.gold;
    if (current < price) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Not enough ${currency}`,
      });
    }

    // One-per-UTC-day gate. Check before the transaction so an already-bought
    // listing returns a friendly 403 instead of hitting the PK violation.
    const today = isoDateUTC();
    const [existingPurchase] = await ctx.db
      .select({ listingId: shopPurchases.listingId })
      .from(shopPurchases)
      .where(
        and(
          eq(shopPurchases.characterId, char.id),
          eq(shopPurchases.listingId, input.itemId),
          eq(shopPurchases.purchasedDate, today),
        ),
      )
      .limit(1);
    if (existingPurchase) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Kupione dzisiaj. Wróć jutro — oferta się odświeży.',
      });
    }

    await ctx.db.transaction(async (tx) => {
      if (item.slot === 'potion') {
        const stored = await insertOrStackPotion(tx, char.id, item.id, 'shop');
        if (stored === null) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Plecak pełny (${BAG_CAP}/${BAG_CAP}). Sprzedaj coś, nieborak.`,
          });
        }
      } else {
        if ((await getBagCount(tx, char.id)) >= BAG_CAP) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Plecak pełny (${BAG_CAP}/${BAG_CAP}). Sprzedaj coś, nieborak.`,
          });
        }
        await tx
          .insert(characterItems)
          .values(itemTemplateToRowValues(item, char.id, 'shop'));
      }
      await registerScrapbookFind(tx, char.id, item.id);
      if (usesGems) {
        await tx
          .update(characters)
          .set({ gems: char.gems - price, updatedAt: new Date() })
          .where(eq(characters.id, char.id));
      } else {
        await tx
          .update(characters)
          .set({ gold: char.gold - price, updatedAt: new Date() })
          .where(eq(characters.id, char.id));
      }
      await tx.insert(shopPurchases).values({
        characterId: char.id,
        listingId: input.itemId,
        purchasedDate: today,
      });
    });

    const unlocks: AchievementUnlockPayload[] = [];
    await collectBump(unlocks, ctx.db, char.id, 'first_shop_buy');
    await collectBump(unlocks, ctx.db, char.id, 'shop_buy_50');

    return { ok: true, unlockedAchievements: unlocks };
  }),
});
