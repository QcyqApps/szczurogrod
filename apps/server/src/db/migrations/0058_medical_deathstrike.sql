ALTER TABLE "characters" ADD COLUMN "work_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "work_ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "work_kind" varchar(32);