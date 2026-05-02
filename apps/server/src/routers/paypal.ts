// PayPal router — web checkout flow, server-authoritative.
//
// Endpoints:
//   - createOrder (protected) — bierze packId, woła PayPal createOrder z
//     server-authoritative amountem, zwraca PayPal orderId. Klient przekazuje
//     orderId do PayPal Buttons SDK.
//   - captureOrder (protected) — po onApprove. Captureuje przez PayPal,
//     idempotentnie wpisuje do gem_purchases (UNIQUE platform/tx) i kredytuje
//     character.gems. Race z webhook'iem benigne — UNIQUE constraint blokuje
//     double-credit.
//
// Idempotency key = PayPal capture id (NIE order id; capture jest atomic
// per-payment). Status 'verified' → 'consumed' nie ma sensu dla PayPal
// (brak consume API jak w Google Play), więc lądujemy od razu w 'consumed'.

import { TRPCError } from '@trpc/server';
import { eq, sql } from 'drizzle-orm';
import {
  paypalCaptureOrderInputSchema,
  paypalCaptureOrderResponseSchema,
  paypalCreateOrderInputSchema,
  paypalCreateOrderResponseSchema,
  type PaypalCaptureOrderResponse,
  type PaypalCreateOrderResponse,
} from '@grodno/shared';
import { REGISTRY } from '../content/registry.js';
import { characterItems, characters, gemPurchases } from '../db/schema.js';
import { itemTemplateToRowValues } from '../game/inventory.js';
import { extendSubscription } from '../game/subscription.js';
import {
  findPaypalTarget,
  priceToPayPalAmount,
} from '../game/gemPackages.js';
import {
  captureOrder,
  createOrder,
  isPayPalConfigured,
  PayPalError,
} from '../services/paypal.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

const PLATFORM_PAYPAL = 'paypal';

/**
 * Idempotentnie kredytuje gemy z PayPal capture. Wywoływane z `captureOrder`
 * mutation oraz z webhook handler'a (PAYMENT.CAPTURE.COMPLETED). UNIQUE
 * (platform, tx) blokuje double-grant gdy oba dotrą jednocześnie.
 *
 * `characterId` jest verified server-side — pochodzi z custom_id w capture
 * obiekcie (`<charId>:<packId>`), które ustawiamy przy createOrder. Nie
 * ufamy klientowi.
 */
export async function grantPayPalCapture(
  db: typeof import('../db/client.js').db,
  args: {
    captureId: string;
    characterId: string;
    packId: string;
    amountValue: string;
    currency: string;
  },
): Promise<{ status: 'credited' | 'already_credited'; gemsGranted: number; characterGems: number }> {
  const target = findPaypalTarget(args.packId);
  if (!target) {
    throw new PayPalError('UNKNOWN_PACK', args.packId);
  }
  const expectedAmount = priceToPayPalAmount(target.pkg.priceGrosze);
  if (args.amountValue !== expectedAmount || args.currency !== target.pkg.currency) {
    // Nie kredytujemy jeśli capture amount nie zgadza się z server-authoritative
    // ceną pakietu. Defenduje przed manual'nym mutowaniem orderu po naszej stronie.
    throw new PayPalError(
      'AMOUNT_MISMATCH',
      `${args.currency} ${args.amountValue} vs ${target.pkg.currency} ${expectedAmount}`,
    );
  }

  const pkg = target.pkg;
  const totalGems = pkg.gems + Math.floor((pkg.gems * pkg.bonus) / 100);
  const amountMicros = pkg.priceGrosze * 10_000; // PLN grosze → micros (1 PLN = 1_000_000)

  const inserted = await db
    .insert(gemPurchases)
    .values({
      characterId: args.characterId,
      platform: PLATFORM_PAYPAL,
      productId: pkg.id,
      transactionId: args.captureId,
      status: 'consumed',
      gemsGranted: totalGems,
      amountMicros,
      currency: pkg.currency,
    })
    .onConflictDoNothing({
      target: [gemPurchases.platform, gemPurchases.transactionId],
    })
    .returning({ id: gemPurchases.id });

  const [char] = await db
    .select({ id: characters.id, gems: characters.gems })
    .from(characters)
    .where(eq(characters.id, args.characterId))
    .limit(1);

  if (!char) {
    throw new PayPalError('CHARACTER_GONE');
  }

  if (inserted.length === 0) {
    return { status: 'already_credited', gemsGranted: totalGems, characterGems: char.gems };
  }

  // Bundle delivery — gold + items oprócz gemów. Robione PO insert do
  // gem_purchases (UNIQUE blokuje retry), więc duplicate-grant nie zdarzy się.
  // Items lecą jako osobne characterItems rows; jeden bundle może zawierać
  // ten sam template_id wielokrotnie ("Eliksir Many ×5") — każda kopia osobny row.
  if (target.kind === 'bundle') {
    const bundle = target.pkg;
    if (bundle.goldBonus && bundle.goldBonus > 0) {
      await db
        .update(characters)
        .set({ gold: sql`${characters.gold} + ${bundle.goldBonus}` })
        .where(eq(characters.id, args.characterId));
    }
    if (bundle.itemTemplateIds && bundle.itemTemplateIds.length > 0) {
      const rows: (typeof characterItems.$inferInsert)[] = [];
      for (const tplName of bundle.itemTemplateIds) {
        // bundle config trzyma NAZWY (`Miecz Świtu` etc.), bo `REGISTRY.items`
        // jest keyowany content-hashem niemożliwym do zhardcoded'owania.
        const tpl = REGISTRY.itemsByName.get(tplName);
        if (!tpl) {
          // Missing template = content drift (rename, removal). Skipujemy ten
          // item, ale gemy + gold idą. Logujemy żeby content team poprawił config.
          console.warn(`[paypal] bundle ${bundle.id}: item "${tplName}" not in registry, skipping`);
          continue;
        }
        rows.push(itemTemplateToRowValues(tpl, args.characterId, 'bundle'));
      }
      if (rows.length > 0) {
        await db.insert(characterItems).values(rows);
      }
    }
  }

  const [updated] = await db
    .update(characters)
    .set({ gems: sql`${characters.gems} + ${totalGems}` })
    .where(eq(characters.id, args.characterId))
    .returning({ gems: characters.gems });

  // Subskrypcja Szczurogród+ dla paczek z `subscriptionDays` (vip30 — 30 dni
  // +20% XP). Cap 90 dni, gdy gracz już ma aktywną — extendSubscription
  // dodaje od `until`, nie od `now`.
  if (target.kind === 'gems' && target.pkg.subscriptionDays && target.pkg.subscriptionDays > 0) {
    const [charSub] = await db
      .select({ szczurogrodPlusUntil: characters.szczurogrodPlusUntil })
      .from(characters)
      .where(eq(characters.id, args.characterId))
      .limit(1);
    const newUntil = extendSubscription(
      charSub?.szczurogrodPlusUntil ?? null,
      target.pkg.subscriptionDays,
    );
    await db
      .update(characters)
      .set({ szczurogrodPlusUntil: newUntil, updatedAt: new Date() })
      .where(eq(characters.id, args.characterId));
  }

  return {
    status: 'credited',
    gemsGranted: totalGems,
    characterGems: updated?.gems ?? char.gems + totalGems,
  };
}

export const paypalRouter = router({
  createOrder: protectedProcedure
    .input(paypalCreateOrderInputSchema)
    .mutation(async ({ ctx, input }): Promise<PaypalCreateOrderResponse> => {
      if (!isPayPalConfigured()) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'PAYPAL_NOT_CONFIGURED' });
      }
      const target = findPaypalTarget(input.packId);
      if (!target) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'UNKNOWN_PACK' });
      }
      const [char] = await ctx.db
        .select({ id: characters.id })
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);
      if (!char) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found.' });
      }

      try {
        const order = await createOrder({
          amountValue: priceToPayPalAmount(target.pkg.priceGrosze),
          currency: target.pkg.currency,
          packId: target.pkg.id,
          characterId: char.id,
        });
        return paypalCreateOrderResponseSchema.parse({ orderId: order.id });
      } catch (err) {
        const msg = err instanceof PayPalError ? err.code : 'CREATE_ORDER_FAILED';
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: msg });
      }
    }),

  captureOrder: protectedProcedure
    .input(paypalCaptureOrderInputSchema)
    .mutation(async ({ ctx, input }): Promise<PaypalCaptureOrderResponse> => {
      const reject = (reason: string, characterGems: number): PaypalCaptureOrderResponse =>
        paypalCaptureOrderResponseSchema.parse({
          status: 'rejected',
          gemsGranted: 0,
          characterGems,
          reason,
        });

      const [char] = await ctx.db
        .select({ id: characters.id, gems: characters.gems })
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);
      if (!char) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found.' });
      }

      let captureRes;
      try {
        captureRes = await captureOrder(input.orderId);
      } catch (err) {
        const msg = err instanceof PayPalError ? err.code : 'CAPTURE_FAILED';
        return reject(msg, char.gems);
      }
      if (captureRes.capture.status !== 'COMPLETED') {
        return reject(`STATUS_${captureRes.capture.status}`, char.gems);
      }

      // custom_id = `${characterId}:${packId}` (set przy createOrder).
      // Re-verify że capture należy do tej postaci — defenduje przed
      // przeklejeniem orderId od innego gracza.
      const customId = captureRes.capture.custom_id ?? '';
      const [customCharId, customPackId] = customId.split(':');
      if (customCharId !== char.id || customPackId !== input.packId) {
        return reject('CUSTOM_ID_MISMATCH', char.gems);
      }

      try {
        const result = await grantPayPalCapture(ctx.db, {
          captureId: captureRes.capture.id,
          characterId: char.id,
          packId: input.packId,
          amountValue: captureRes.capture.amount.value,
          currency: captureRes.capture.amount.currency_code,
        });
        return paypalCaptureOrderResponseSchema.parse({
          status: result.status,
          gemsGranted: result.gemsGranted,
          characterGems: result.characterGems,
          reason: null,
        });
      } catch (err) {
        const msg = err instanceof PayPalError ? err.code : 'GRANT_FAILED';
        return reject(msg, char.gems);
      }
    }),
});
