ALTER TABLE "characters" ADD COLUMN "last_hp_tick_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "last_mp_tick_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
-- Nullable — never-used sentinel. Set on every call to tavern.healFull.
ALTER TABLE "characters" ADD COLUMN "last_healer_at" timestamp with time zone;
