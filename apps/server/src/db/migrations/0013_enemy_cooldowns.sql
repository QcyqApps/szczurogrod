-- Per-mob cooldown + daily kill cap. Cooldown starts on victory, daily count
-- resets at 00:00 UTC (same cadence as quests/daily/shop). Balance is mirrored
-- in the seed derivation in content/seed.ts — these defaults fill existing
-- rows so deployed DBs pick up the new rules without a re-seed.
ALTER TABLE "enemy_templates" ADD COLUMN "cooldown_sec" smallint DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "enemy_templates" ADD COLUMN "daily_limit" smallint DEFAULT 25 NOT NULL;--> statement-breakpoint
UPDATE "enemy_templates" SET "cooldown_sec" = CASE "tier"
  WHEN 1 THEN 30
  WHEN 2 THEN 90
  WHEN 3 THEN 240
  WHEN 4 THEN 1200
  ELSE 30
END;--> statement-breakpoint
UPDATE "enemy_templates" SET "daily_limit" = CASE "tier"
  WHEN 1 THEN 25
  WHEN 2 THEN 12
  WHEN 3 THEN 6
  WHEN 4 THEN 2
  ELSE 25
END;--> statement-breakpoint

-- One row per (character, enemy slug). `kills_today` resets when
-- `today_date` stops matching isoDateUTC(). `last_killed_at` is null until the
-- first victory, then drives the cooldown gate on subsequent engages.
CREATE TABLE "character_enemy_kills" (
  "character_id" uuid NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "enemy_slug" varchar(64) NOT NULL,
  "last_killed_at" timestamp with time zone,
  "kills_today" integer DEFAULT 0 NOT NULL,
  "today_date" varchar(10) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "character_enemy_kills_pk" PRIMARY KEY ("character_id", "enemy_slug")
);
