ALTER TABLE "characters" ALTER COLUMN "xp" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "xp_max" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "xp_max" SET DEFAULT 60;