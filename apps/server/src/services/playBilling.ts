// Google Play Developer API client — verifies & acknowledges purchase tokens
// returned by the in-app Billing flow on Android.
//
// Setup (one-time, in Play Console):
//   1. Setup → API access → Create new service account (links to GCP project)
//   2. Grant role: "View financial data, orders, and cancellation survey
//      responses" + "Manage orders and subscriptions"
//   3. Download the JSON key. Two ways to feed it to the server:
//        a. ENV: GOOGLE_PLAY_SERVICE_ACCOUNT_JSON='<full json string>'
//        b. FILE: GOOGLE_PLAY_SERVICE_ACCOUNT_FILE=/secrets/play-sa.json
//      ENV is friendlier for Docker — secret manager → env injection.
//   4. ENV: GOOGLE_PLAY_PACKAGE_NAME='com.ratburg' (matches capacitor.config.ts)
//
// If neither env is set, `verifyPurchase` throws CONFIG_MISSING — the server
// still boots so dev environments without a service account work, but
// `gemShop.verifyPlay` returns a 503-equivalent error to the client.

import { google, type androidpublisher_v3 } from 'googleapis';
import { env } from '../env.js';

let cachedClient: androidpublisher_v3.Androidpublisher | null = null;
let configChecked = false;
let configError: string | null = null;

function getClient(): androidpublisher_v3.Androidpublisher {
  if (cachedClient) return cachedClient;
  if (configChecked && configError) {
    throw new Error(configError);
  }
  configChecked = true;

  let credentials: { client_email: string; private_key: string };

  if (env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = JSON.parse(env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON);
      credentials = {
        client_email: parsed.client_email,
        private_key: parsed.private_key,
      };
    } catch (e) {
      configError = 'PLAY_BILLING_BAD_JSON';
      throw new Error(configError);
    }
  } else if (env.GOOGLE_PLAY_SERVICE_ACCOUNT_FILE) {
    // Lazy fs import — keeps test envs without filesystem access happy.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs') as typeof import('node:fs');
    try {
      const raw = fs.readFileSync(env.GOOGLE_PLAY_SERVICE_ACCOUNT_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      credentials = {
        client_email: parsed.client_email,
        private_key: parsed.private_key,
      };
    } catch {
      configError = 'PLAY_BILLING_BAD_FILE';
      throw new Error(configError);
    }
  } else {
    configError = 'PLAY_BILLING_NOT_CONFIGURED';
    throw new Error(configError);
  }

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  cachedClient = google.androidpublisher({ version: 'v3', auth });
  return cachedClient;
}

export interface VerifiedPurchase {
  /** Google's productId — re-checked against catalog before crediting. */
  productId: string;
  /** Order ID from Google's billing system. */
  orderId: string | null;
  /** 0 = Purchased, 1 = Cancelled, 2 = Pending. Only 0 should credit. */
  purchaseState: number;
  /** 0 = NotAcked, 1 = Acked. Server must ack within 3 days or Google refunds. */
  acknowledgementState: number;
  /** Region/country code from Google. May be null. */
  regionCode: string | null;
  /** Unix ms when the purchase was made. */
  purchaseTimeMillis: number | null;
}

/**
 * Verifies a Google Play purchase token. Throws on transport/auth errors;
 * returns null if Google reports the token doesn't exist (consumed,
 * spoofed, or wrong package).
 */
export async function verifyPurchase(
  productId: string,
  purchaseToken: string,
): Promise<VerifiedPurchase | null> {
  const packageName = env.GOOGLE_PLAY_PACKAGE_NAME;
  if (!packageName) throw new Error('PLAY_BILLING_NO_PACKAGE_NAME');

  const client = getClient();

  let res: { data: androidpublisher_v3.Schema$ProductPurchase };
  try {
    res = await client.purchases.products.get({
      packageName,
      productId,
      token: purchaseToken,
    });
  } catch (err) {
    const e = err as { code?: number };
    // 410 Gone → token already consumed; 404 → not found. Both = invalid.
    if (e.code === 404 || e.code === 410) return null;
    throw err;
  }

  const d = res.data;
  return {
    productId,
    orderId: d.orderId ?? null,
    purchaseState: d.purchaseState ?? 1,
    acknowledgementState: d.acknowledgementState ?? 0,
    regionCode: d.regionCode ?? null,
    purchaseTimeMillis: d.purchaseTimeMillis ? Number(d.purchaseTimeMillis) : null,
  };
}

/**
 * Marks a purchase as consumed in Google's system — frees the user to buy the
 * same SKU again (gem packs are consumable). Should be called only AFTER the
 * server has credited gems to the character to keep the operation idempotent
 * even if the consume call fails partway.
 */
export async function consumePurchase(
  productId: string,
  purchaseToken: string,
): Promise<void> {
  const packageName = env.GOOGLE_PLAY_PACKAGE_NAME;
  if (!packageName) throw new Error('PLAY_BILLING_NO_PACKAGE_NAME');
  const client = getClient();
  await client.purchases.products.consume({
    packageName,
    productId,
    token: purchaseToken,
  });
}

/**
 * Surface for tests / health checks — returns true iff env is configured well
 * enough for `verifyPurchase` to attempt a network call.
 */
export function isPlayBillingConfigured(): boolean {
  return Boolean(
    env.GOOGLE_PLAY_PACKAGE_NAME &&
      (env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON || env.GOOGLE_PLAY_SERVICE_ACCOUNT_FILE),
  );
}
