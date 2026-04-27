-- Track one-per-day shop purchases per character. PK covers (character, listing,
-- date), so the same listing can be bought on consecutive days but not twice in
-- one UTC day. The shop effectively refreshes at 00:00 UTC — same cadence as
-- quests and daily rewards.
CREATE TABLE "shop_purchases" (
  "character_id" uuid NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "listing_id" varchar(64) NOT NULL,
  "purchased_date" varchar(10) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "shop_purchases_pk" PRIMARY KEY ("character_id", "listing_id", "purchased_date")
);
