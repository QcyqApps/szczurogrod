// PayPal REST API client — minimal surface dla Checkout flow.
//
// Server-side flow:
//   1. createOrder({ amount, currency, packId, characterId }) → orderId
//      Klient bierze orderId, przekazuje do PayPal Buttons SDK na froncie.
//      Gracz autoryzuje płatność u PayPala (popup/redirect).
//   2. captureOrder(orderId) → captureId, status
//      Po onApprove klient woła nasz captureOrder mutation; my captureujemy
//      przez PayPala, dostajemy captureId, idempotentnie kredytujemy gemy.
//   3. webhook /webhooks/paypal — async backstop. PayPal sam pinguje serwer
//      eventem PAYMENT.CAPTURE.COMPLETED. Verify signature → idempotent grant.
//
// Auth: OAuth 2.0 Client Credentials grant. Token cache'owany w pamięci
// (PayPal zwraca expires_in = 32400s = 9h). Re-fetch gdy ttl < 5 min.
//
// Idempotency: każdy createOrder dostaje custom_id = `${characterId}:${packId}`
// + invoice_id = nowy uuid. Nasz `gem_purchases.transaction_id` to
// PayPal capture ID (NIE order ID — capture jest atomic, order może mieć
// wiele captures jeśli partial). UNIQUE (platform='paypal', tx) blocks
// double-credit z race między onApprove i webhook.

import { randomUUID } from 'node:crypto';
import { env } from '../env.js';

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}
let tokenCache: TokenCache | null = null;
const TOKEN_REFETCH_BUFFER_MS = 5 * 60_000;

export interface PayPalCreateOrderArgs {
  amountValue: string;     // e.g. "19.99"
  currency: string;        // e.g. "PLN"
  packId: string;
  characterId: string;
}

export interface PayPalOrder {
  id: string;
  status: string;
}

export interface PayPalCapture {
  id: string;
  status: string;
  amount: { value: string; currency_code: string };
  custom_id?: string;
  invoice_id?: string;
}

export interface PayPalCaptureResponse {
  id: string;
  status: string;
  capture: PayPalCapture;
}

export class PayPalError extends Error {
  constructor(public readonly code: string, message?: string) {
    super(message ?? code);
  }
}

export function isPayPalConfigured(): boolean {
  return Boolean(env.PAYPAL_API_KEY && env.PAYPAL_SECRET);
}

async function getAccessToken(): Promise<string> {
  if (!env.PAYPAL_API_KEY || !env.PAYPAL_SECRET) {
    throw new PayPalError('PAYPAL_NOT_CONFIGURED');
  }
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - now > TOKEN_REFETCH_BUFFER_MS) {
    return tokenCache.accessToken;
  }
  const basic = Buffer.from(`${env.PAYPAL_API_KEY}:${env.PAYPAL_SECRET}`).toString('base64');
  const res = await fetch(`${env.PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const body = await res.text();
    throw new PayPalError('TOKEN_FETCH_FAILED', `${res.status} ${body}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return data.access_token;
}

export async function createOrder(args: PayPalCreateOrderArgs): Promise<PayPalOrder> {
  const token = await getAccessToken();
  const invoiceId = randomUUID();
  const res = await fetch(`${env.PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      // PayPal best practice — id idempotency klienta. Powtórki tego samego
      // request'u zwracają ten sam order zamiast nowego.
      'PayPal-Request-Id': invoiceId,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: args.packId,
          // custom_id ląduje na webhook'ach + capture object — pozwala
          // server-side zmappować capture → character bez query do DB.
          custom_id: `${args.characterId}:${args.packId}`,
          invoice_id: invoiceId,
          amount: {
            currency_code: args.currency,
            value: args.amountValue,
          },
        },
      ],
      application_context: {
        brand_name: 'Szczurogród',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new PayPalError('CREATE_ORDER_FAILED', `${res.status} ${body}`);
  }
  const data = (await res.json()) as PayPalOrder;
  return data;
}

export async function captureOrder(orderId: string): Promise<PayPalCaptureResponse> {
  const token = await getAccessToken();
  const res = await fetch(`${env.PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new PayPalError('CAPTURE_FAILED', `${res.status} ${body}`);
  }
  const data = (await res.json()) as {
    id: string;
    status: string;
    purchase_units: Array<{
      payments?: { captures?: PayPalCapture[] };
    }>;
  };
  const capture = data.purchase_units[0]?.payments?.captures?.[0];
  if (!capture) throw new PayPalError('NO_CAPTURE_IN_RESPONSE');
  return { id: data.id, status: data.status, capture };
}

/**
 * Verifyfikuje webhook signature przez PayPal'owy `verify-webhook-signature`
 * endpoint. Wymaga `PAYPAL_WEBHOOK_ID` (z dashboardu PayPal). Headers:
 * `paypal-auth-algo`, `paypal-cert-url`, `paypal-transmission-id`,
 * `paypal-transmission-sig`, `paypal-transmission-time`.
 */
export async function verifyWebhookSignature(
  headers: Record<string, string | string[] | undefined>,
  rawBody: string,
): Promise<boolean> {
  if (!env.PAYPAL_WEBHOOK_ID) return false;
  const get = (k: string): string => {
    const v = headers[k.toLowerCase()];
    if (Array.isArray(v)) return v[0] ?? '';
    return v ?? '';
  };
  const token = await getAccessToken();
  const res = await fetch(`${env.PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: get('paypal-auth-algo'),
      cert_url: get('paypal-cert-url'),
      transmission_id: get('paypal-transmission-id'),
      transmission_sig: get('paypal-transmission-sig'),
      transmission_time: get('paypal-transmission-time'),
      webhook_id: env.PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(rawBody),
    }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { verification_status: string };
  return data.verification_status === 'SUCCESS';
}
