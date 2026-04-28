// Native In-App Purchase bridge — wraps `cordova-plugin-purchase` (Fovea)
// behind a small Promise-based API tailored to the gem shop screen.
//
// Flow:
//   1. `initBilling(productIds)` — call once on app boot inside a native
//      runtime. Registers SKUs with the plugin and triggers a Play Store
//      catalog fetch so localized prices are available.
//   2. `getProduct(productId)` — read the cached, localized price.
//   3. `purchase(productId)` — kicks off Play Billing UI; resolves with a
//      `{ productId, purchaseToken }` once the user has paid AND the
//      plugin sees a valid receipt. Server is then expected to call
//      `gemShop.verifyPlay` and only after that should the client call
//      `finishPurchase` (which acks/consumes natively).
//
// Plugin internals (`store.when().approved(...)`) are translated into a
// single per-call promise so the React layer never sees the global event
// stream. Approval AND server-verify are decoupled — the server is
// authoritative for crediting; the plugin is just the UX layer.
//
// Web fallback: every export is a no-op or throws BILLING_NOT_NATIVE so
// calling code can branch with `isNative()` defensively without crashing
// during dev in a desktop browser.

import 'cordova-plugin-purchase/www/store.js';
import { isNative } from '@/api/use-is-native';

interface CdvProduct {
  id: string;
  title: string;
  description: string;
  pricing: { price: string; currency: string } | undefined;
  getOffer(): { id: string } | null;
  owned: boolean;
  state: string;
}

interface CdvTransaction {
  finish(): Promise<void>;
}

interface CdvPurchase {
  productId: string;
  transactionId: string;
  purchaseToken: string;
  isPending: boolean;
  isAcknowledged: boolean;
  transaction: CdvTransaction;
}

// Plugin attaches itself to the global `CdvPurchase` namespace.
declare global {
  interface Window {
    CdvPurchase?: {
      store: CdvStore;
      ProductType: { CONSUMABLE: string };
      Platform: { GOOGLE_PLAY: string };
      LogLevel: { DEBUG: number; INFO: number; WARN: number; ERROR: number };
    };
  }
}

interface CdvStore {
  verbosity: number;
  register(products: { id: string; type: string; platform: string }[]): void;
  initialize(platforms: string[]): Promise<unknown>;
  get(productId: string): CdvProduct | null;
  when(): {
    productUpdated(cb: (p: CdvProduct) => void): void;
    approved(cb: (p: CdvPurchase) => Promise<void> | void): void;
    finished(cb: (p: CdvPurchase) => void): void;
  };
  order(offer: { id: string }): Promise<unknown>;
}

let initPromise: Promise<void> | null = null;
const pendingApprovals = new Map<string, (purchase: CdvPurchase) => void>();

export interface NativeProduct {
  productId: string;
  title: string;
  description: string;
  /** Localized price string from Play Billing (e.g. "19,99 zł"). */
  priceLabel: string | null;
  currency: string | null;
}

export interface NativePurchase {
  productId: string;
  purchaseToken: string;
  /** Plugin's own internal handle so we can call `finishPurchase` later. */
  _internal: CdvPurchase;
}

export class BillingError extends Error {
  constructor(
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export function initBilling(productIds: readonly string[]): Promise<void> {
  if (!isNative()) return Promise.resolve();
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const ns = window.CdvPurchase;
    if (!ns) throw new BillingError('PLUGIN_MISSING');

    ns.store.verbosity = ns.LogLevel.WARN;
    ns.store.register(
      productIds.map((id) => ({
        id,
        type: ns.ProductType.CONSUMABLE,
        platform: ns.Platform.GOOGLE_PLAY,
      })),
    );

    // Approved hook fires when Google reports a valid purchase. We park the
    // CdvPurchase in `pendingApprovals` keyed by productId so the matching
    // `purchase()` promise can resolve. We deliberately do NOT call
    // `purchase.finish()` here — that's the caller's job after server verify.
    ns.store.when().approved(async (purchase) => {
      const resolver = pendingApprovals.get(purchase.productId);
      if (resolver) {
        pendingApprovals.delete(purchase.productId);
        resolver(purchase);
      }
      // If no resolver, we're here because the app reopened with a pending
      // purchase. The screen-level recovery hook will pick it up on its
      // own poll (TODO: future work — a `getPendingPurchases()` export).
    });

    await ns.store.initialize([ns.Platform.GOOGLE_PLAY]);
  })().catch((err) => {
    initPromise = null;
    throw err;
  });

  return initPromise;
}

export function getProduct(productId: string): NativeProduct | null {
  if (!isNative()) return null;
  const ns = window.CdvPurchase;
  if (!ns) return null;
  const p = ns.store.get(productId);
  if (!p) return null;
  return {
    productId: p.id,
    title: p.title,
    description: p.description,
    priceLabel: p.pricing?.price ?? null,
    currency: p.pricing?.currency ?? null,
  };
}

/**
 * Kicks off the Play Billing flow for `productId`. Resolves once Google has
 * confirmed payment and the plugin has surfaced a purchaseToken. The
 * server-side `verifyPlay` mutation is the next caller's job; once it
 * succeeds (status='credited' or 'already_credited'), call
 * `finishPurchase(result)` to consume on the device.
 */
export function purchase(productId: string): Promise<NativePurchase> {
  if (!isNative()) {
    return Promise.reject(new BillingError('BILLING_NOT_NATIVE'));
  }
  const ns = window.CdvPurchase;
  if (!ns) return Promise.reject(new BillingError('PLUGIN_MISSING'));
  const product = ns.store.get(productId);
  if (!product) return Promise.reject(new BillingError('UNKNOWN_PRODUCT'));
  const offer = product.getOffer();
  if (!offer) return Promise.reject(new BillingError('NO_OFFER'));

  return new Promise<NativePurchase>((resolve, reject) => {
    pendingApprovals.set(productId, (cdvPurchase) => {
      resolve({
        productId: cdvPurchase.productId,
        purchaseToken: cdvPurchase.purchaseToken,
        _internal: cdvPurchase,
      });
    });
    ns.store.order(offer).catch((err: unknown) => {
      pendingApprovals.delete(productId);
      reject(new BillingError('ORDER_FAILED', String(err)));
    });
  });
}

/**
 * Tells Google + the plugin we've successfully credited the gems server-side,
 * so the SKU is consumable again. Safe to call multiple times — the plugin
 * de-dupes.
 */
export async function finishPurchase(p: NativePurchase): Promise<void> {
  if (!isNative()) return;
  await p._internal.transaction.finish();
}
