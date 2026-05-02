// Gem shop — premium currency catalog + Play Billing verification.
//
// Two endpoints:
//   - list (public)           catalog of gem packages + readiness flag
//   - verifyPlay (protected)  validates a Play purchaseToken against the
//                             Developer API, credits gems atomically,
//                             marks the row consumed, and ack's with Google
//
// Idempotency: every credit goes through `gem_purchases` first with a UNIQUE
// constraint on `(platform, transaction_id)`. A duplicate verifyPlay call —
// network retry, app reopen — hits the constraint, server returns
// `already_credited` without touching `characters.gems` again.
//
// Failure modes (all return 200 with `status` + `reason`, never throw to
// the client unless input is malformed):
//   - rejected/SKU_MISMATCH       client claims productId X but token has Y
//   - rejected/PURCHASE_STATE     Google reports cancelled/pending — refuse
//   - rejected/UNKNOWN_PRODUCT    catalog drift; server doesn't know this SKU
//   - rejected/INVALID_TOKEN      Google 404/410 — token never existed or expired
//   - rejected/PLAY_NOT_CONFIGURED  service account not set (dev / staging)

import { TRPCError } from '@trpc/server';
import { eq, sql } from 'drizzle-orm';
import { extendSubscription } from '../game/subscription.js';
import {
  gemShopListResponseSchema,
  verifyPlayPurchaseInputSchema,
  verifyPlayPurchaseResponseSchema,
  type GemShopListResponse,
  type VerifyPlayPurchaseResponse,
} from '@grodno/shared';
import { REGISTRY } from '../content/registry.js';
import { characters, gemPurchases } from '../db/schema.js';
import { BUNDLE_PACKAGES, findPackageByProductId, GEM_PACKAGES } from '../game/gemPackages.js';
import {
  consumePurchase,
  isPlayBillingConfigured,
  verifyPurchase,
} from '../services/playBilling.js';
import { isPayPalConfigured } from '../services/paypal.js';
import { protectedProcedure, publicProcedure, router } from '../trpc/trpc.js';

const PLATFORM_PLAY = 'play';

export const gemShopRouter = router({
  list: publicProcedure.query((): GemShopListResponse => {
    return gemShopListResponseSchema.parse({
      packages: GEM_PACKAGES.map((p) => ({
        id: p.id,
        gems: p.gems,
        bonus: p.bonus,
        googlePlayProductId: p.googlePlayProductId,
        priceGrosze: p.priceGrosze,
        currency: p.currency,
      })),
      playBillingReady: isPlayBillingConfigured(),
      paypalReady: isPayPalConfigured(),
    });
  }),

  /**
   * Item preview dla wszystkich bundle'i w `BUNDLE_PACKAGES`. Klient renderuje
   * bundle'y z hardcoded'em; tutaj zwracamy faktyczne template stats z REGISTRY,
   * żeby gracz mógł kliknąć na item w bundle i zobaczyć co dostanie.
   * Per-templateId aggregowane qty (bundle b2 ma s-buff-mp25 ×5 → qty=5).
   */
  bundlePreview: publicProcedure.query(() => {
    const previews: Array<{
      bundleId: string;
      items: Array<{
        templateId: string;
        qty: number;
        name: string;
        icon: string;
        slot: string;
        rarity: string;
        atk: number;
        def: number;
        mag: number;
        hpHeal: number;
        mpHeal: number;
        desc: string;
        allowedClasses: readonly string[] | null;
      }>;
    }> = [];

    for (const bundle of BUNDLE_PACKAGES) {
      if (!bundle.itemTemplateIds || bundle.itemTemplateIds.length === 0) continue;
      // `itemTemplateIds` w bundle config to NAZWY itemów. Aggregate by name → qty.
      const qtyByName = new Map<string, number>();
      for (const name of bundle.itemTemplateIds) {
        qtyByName.set(name, (qtyByName.get(name) ?? 0) + 1);
      }
      const items: Array<{
        templateId: string;
        qty: number;
        name: string;
        icon: string;
        slot: string;
        rarity: string;
        atk: number;
        def: number;
        mag: number;
        hpHeal: number;
        mpHeal: number;
        desc: string;
        allowedClasses: readonly string[] | null;
      }> = [];
      for (const [tplName, qty] of qtyByName) {
        const tpl = REGISTRY.itemsByName.get(tplName);
        if (!tpl) continue; // content drift — skip silently
        items.push({
          // Klient klucze przez `templateId` (nazwa) — server zwraca tę samą nazwę,
          // więc bundleItemMap.get(name) hit się dopasuje.
          templateId: tplName,
          qty,
          name: tpl.name,
          icon: tpl.icon,
          slot: tpl.slot,
          rarity: tpl.rarity,
          atk: tpl.atk ?? 0,
          def: tpl.def ?? 0,
          mag: tpl.mag ?? 0,
          hpHeal: tpl.hpHeal ?? 0,
          mpHeal: tpl.mpHeal ?? 0,
          desc: tpl.desc ?? '',
          allowedClasses: tpl.allowedClasses ?? null,
        });
      }
      previews.push({ bundleId: bundle.id, items });
    }

    return { bundles: previews };
  }),

  verifyPlay: protectedProcedure
    .input(verifyPlayPurchaseInputSchema)
    .mutation(async ({ ctx, input }): Promise<VerifyPlayPurchaseResponse> => {
      const reject = (
        reason: string,
        characterGems: number,
      ): VerifyPlayPurchaseResponse =>
        verifyPlayPurchaseResponseSchema.parse({
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

      const pkg = findPackageByProductId(input.productId);
      if (!pkg) return reject('UNKNOWN_PRODUCT', char.gems);

      // Idempotency probe — short-circuit before bothering Google. If we
      // already have a verified row for this token, just echo success.
      const [existing] = await ctx.db
        .select({
          status: gemPurchases.status,
          gemsGranted: gemPurchases.gemsGranted,
          characterId: gemPurchases.characterId,
        })
        .from(gemPurchases)
        .where(
          sql`${gemPurchases.platform} = ${PLATFORM_PLAY}
              AND ${gemPurchases.transactionId} = ${input.purchaseToken}`,
        )
        .limit(1);
      if (existing) {
        if (existing.characterId !== char.id) {
          // Token previously used by a different character — treat as rejection.
          return reject('TOKEN_BOUND_TO_OTHER_CHAR', char.gems);
        }
        if (existing.status === 'verified' || existing.status === 'consumed') {
          return verifyPlayPurchaseResponseSchema.parse({
            status: 'already_credited',
            gemsGranted: existing.gemsGranted,
            characterGems: char.gems,
            reason: null,
          });
        }
        // status === 'pending' (rare): fall through to re-verify.
      }

      if (!isPlayBillingConfigured()) {
        return reject('PLAY_NOT_CONFIGURED', char.gems);
      }

      let verified;
      try {
        verified = await verifyPurchase(input.productId, input.purchaseToken);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'PLAY_VERIFY_ERROR';
        return reject(msg, char.gems);
      }
      if (!verified) return reject('INVALID_TOKEN', char.gems);
      if (verified.purchaseState !== 0) return reject('PURCHASE_STATE', char.gems);
      if (verified.productId !== pkg.googlePlayProductId) {
        return reject('SKU_MISMATCH', char.gems);
      }

      const totalGems = pkg.gems + Math.floor((pkg.gems * pkg.bonus) / 100);

      // Atomic credit. Insert ledger row first; UNIQUE (platform, tx) blocks
      // a concurrent retry. On conflict we land in the existing-row branch
      // above on the next call — but if the conflict happens *here* we just
      // skip the gems update and return `already_credited`.
      const inserted = await ctx.db
        .insert(gemPurchases)
        .values({
          characterId: char.id,
          platform: PLATFORM_PLAY,
          productId: pkg.googlePlayProductId,
          transactionId: input.purchaseToken,
          status: 'verified',
          gemsGranted: totalGems,
          amountMicros: null,
          currency: verified.regionCode ?? null,
        })
        .onConflictDoNothing({
          target: [gemPurchases.platform, gemPurchases.transactionId],
        })
        .returning({ id: gemPurchases.id });

      if (inserted.length === 0) {
        return verifyPlayPurchaseResponseSchema.parse({
          status: 'already_credited',
          gemsGranted: totalGems,
          characterGems: char.gems,
          reason: null,
        });
      }

      const [updated] = await ctx.db
        .update(characters)
        .set({ gems: sql`${characters.gems} + ${totalGems}` })
        .where(eq(characters.id, char.id))
        .returning({ gems: characters.gems });
      const newGems = updated?.gems ?? char.gems + totalGems;

      // Subskrypcja Szczurogród+ — paczki z `subscriptionDays` (vip30) extendują
      // `szczurogrodPlusUntil` o N dni (cap 90 dni). Anti-stack przez extendSubscription.
      if (pkg.subscriptionDays && pkg.subscriptionDays > 0) {
        const [charSub] = await ctx.db
          .select({ szczurogrodPlusUntil: characters.szczurogrodPlusUntil })
          .from(characters)
          .where(eq(characters.id, char.id))
          .limit(1);
        const newUntil = extendSubscription(
          charSub?.szczurogrodPlusUntil ?? null,
          pkg.subscriptionDays,
        );
        await ctx.db
          .update(characters)
          .set({ szczurogrodPlusUntil: newUntil, updatedAt: new Date() })
          .where(eq(characters.id, char.id));
      }

      // Best-effort consume — frees the SKU for repurchase. If this fails
      // (network, transient Google hiccup) we mark status='verified' and
      // a follow-up endpoint / cron can sweep for unconsumed-but-credited
      // rows. Player still has their gems regardless.
      consumePurchase(pkg.googlePlayProductId, input.purchaseToken)
        .then(() =>
          ctx.db
            .update(gemPurchases)
            .set({ status: 'consumed', updatedAt: new Date() })
            .where(eq(gemPurchases.transactionId, input.purchaseToken)),
        )
        .catch((e) => {
          console.error('[gemShop.verifyPlay] consume failed', e);
        });

      return verifyPlayPurchaseResponseSchema.parse({
        status: 'credited',
        gemsGranted: totalGems,
        characterGems: newGems,
        reason: null,
      });
    }),
});
