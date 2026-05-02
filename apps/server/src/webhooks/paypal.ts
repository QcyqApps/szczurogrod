// PayPal webhook handler — async backstop dla synchronicznego captureOrder.
//
// PayPal wysyła event PAYMENT.CAPTURE.COMPLETED do `/webhooks/paypal`. My:
//   1. Bierzemy raw body (do verify signature) + headers.
//   2. Wołamy /v1/notifications/verify-webhook-signature → SUCCESS lub odrzut.
//   3. Wyciągamy capture id, custom_id (`<charId>:<packId>`), amount.
//   4. Wołamy `grantPayPalCapture` (idempotent — UNIQUE platform/tx).
//
// Webhook bywa retry'owany (PayPal robi do 25 prób w 72h), więc
// idempotency jest critical. Dla setup'u w PayPal Dashboard:
//   Webhooks → Add → URL: https://<host>/webhooks/paypal
//   Subscribed events: PAYMENT.CAPTURE.COMPLETED (minimum)
//   Optional: PAYMENT.CAPTURE.DENIED, REFUNDED — TODO future polish.
//
// Bez `PAYPAL_WEBHOOK_ID` w env serwer odrzuca każdy event jako forged.

import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Db } from '../db/client.js';
import { grantPayPalCapture } from '../routers/paypal.js';
import { verifyWebhookSignature } from '../services/paypal.js';

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: {
    id: string;
    custom_id?: string;
    invoice_id?: string;
    amount?: { value: string; currency_code: string };
    status?: string;
  };
}

export function registerPayPalWebhook(app: FastifyInstance, db: Db): void {
  // Fastify domyślnie parse'uje JSON, ale do verify signature potrzebujemy
  // raw body identyczne co dostała PayPal. Najprościej — re-stringify
  // sparsowany body (PayPal `verify-webhook-signature` akceptuje
  // znormalizowany JSON pod warunkiem że whitespace był zachowany przez
  // serializer; ich docs explicite pokazują re-serialize jako akceptowane).
  app.post('/webhooks/paypal', async (req: FastifyRequest, reply) => {
    const event = req.body as PayPalWebhookEvent | undefined;
    if (!event || !event.event_type) {
      return reply.code(400).send({ ok: false, reason: 'BAD_PAYLOAD' });
    }

    const rawBody = JSON.stringify(event);
    const verified = await verifyWebhookSignature(req.headers, rawBody);
    if (!verified) {
      app.log.warn({ eventId: event.id }, 'paypal webhook: signature failed');
      return reply.code(401).send({ ok: false, reason: 'BAD_SIGNATURE' });
    }

    if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
      // Ignoruj inne eventy (DENIED, REFUNDED itd.) — handluj je jak
      // dorobimy refund flow. Zwracamy 200 żeby PayPal nie retry'ował.
      return reply.code(200).send({ ok: true, ignored: event.event_type });
    }

    const customId = event.resource.custom_id ?? '';
    const [characterId, packId] = customId.split(':');
    const amount = event.resource.amount;
    if (!characterId || !packId || !amount) {
      app.log.warn({ eventId: event.id, customId }, 'paypal webhook: missing fields');
      return reply.code(200).send({ ok: false, reason: 'MISSING_CUSTOM_ID' });
    }

    try {
      const result = await grantPayPalCapture(db, {
        captureId: event.resource.id,
        characterId,
        packId,
        amountValue: amount.value,
        currency: amount.currency_code,
      });
      app.log.info(
        { eventId: event.id, captureId: event.resource.id, status: result.status },
        'paypal webhook: granted',
      );
      return reply.code(200).send({ ok: true, status: result.status });
    } catch (err) {
      app.log.error({ err, eventId: event.id }, 'paypal webhook: grant failed');
      // 200 z błędem w body — PayPal retry'uje na 5xx. Większość naszych
      // błędów (AMOUNT_MISMATCH, UNKNOWN_PACK) nie są retry'owalne, więc
      // 200 jest właściwsze. Logujemy żeby admin mógł przeczytać.
      return reply.code(200).send({ ok: false, reason: 'GRANT_FAILED' });
    }
  });
}
