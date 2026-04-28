-- Premium currency purchases — idempotent ledger for Google Play (and any
-- future web processor). Every successful credit hits this table first;
-- characters.gems update piggybacks on the same transaction.
--
-- Idempotency: UNIQUE (platform, transaction_id) blocks double-credit when
-- the same purchaseToken arrives twice (verify retry, network glitch,
-- delayed webhook). Status FSM: pending → verified (gems credited) →
-- consumed (Google ack'd). Refunded is a terminal observation logged from
-- Voided Purchases API or Pub/Sub RTDN (later phase).

CREATE TABLE IF NOT EXISTS "gem_purchases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "character_id" uuid NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  -- 'play' = Google Play Billing. Future: 'web' if a processor ever happens.
  "platform" varchar(16) NOT NULL,
  -- Product SKU as configured in Play Console (e.g. 'gems_p3').
  "product_id" varchar(64) NOT NULL,
  -- Play purchaseToken (~700 chars). Wide enough for future processors too.
  "transaction_id" varchar(1024) NOT NULL,
  -- 'pending' | 'verified' | 'consumed' | 'refunded'. Drives client UI
  -- when users land back in app after a partial flow (paid, didn't ack).
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  -- Snapshot of the catalog at purchase time. Locked-in once verified so
  -- subsequent catalog edits never affect a granted credit.
  "gems_granted" integer NOT NULL DEFAULT 0,
  "amount_micros" bigint,
  "currency" varchar(8),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "gem_purchases_platform_tx_unique"
  ON "gem_purchases" ("platform", "transaction_id");

CREATE INDEX IF NOT EXISTS "gem_purchases_character_idx"
  ON "gem_purchases" ("character_id", "created_at" DESC);
