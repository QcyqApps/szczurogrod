-- "Klucze do lochu" = main throttle for combat. Each engage consumes 1 key.
-- 15 cap, +1 per 15 min (offline too, via read-time regen in me.get).
-- Existing characters default to 15 so no one gets punished on rollout.
ALTER TABLE "characters" ADD COLUMN "dungeon_keys" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "last_key_tick_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint

-- Reward hooks: daily ladder + quest templates can grant keys on claim/collect.
-- 0 = no keys (default); tunable per-row in CMS.
ALTER TABLE "daily_ladder" ADD COLUMN "keys" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "quest_templates" ADD COLUMN "reward_keys" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint

-- Seed: day 3 of weekly ladder = 2 keys bonus.
UPDATE "daily_ladder" SET "keys" = 2 WHERE "day" = 3;--> statement-breakpoint

-- Boss quests (chapter finales) award 5 keys alongside standard gold/xp/unique drop.
UPDATE "quest_templates" SET "reward_keys" = 5 WHERE "id" IN ('q5', 'q10', 'q15');
