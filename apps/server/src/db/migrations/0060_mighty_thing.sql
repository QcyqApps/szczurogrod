ALTER TABLE "characters" ADD COLUMN "raid_hits_today" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "last_raid_hit_date" varchar(10) DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE "characters" c
SET "raid_hits_today" = m."raid_hits_today",
    "last_raid_hit_date" = m."last_raid_hit_date"
FROM "guild_members" m
WHERE c."id" = m."character_id";--> statement-breakpoint
ALTER TABLE "guild_members" DROP COLUMN "raid_hits_today";--> statement-breakpoint
ALTER TABLE "guild_members" DROP COLUMN "last_raid_hit_date";
