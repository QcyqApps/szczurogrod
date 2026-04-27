CREATE TYPE "public"."buff_kind" AS ENUM('hp_max_pct', 'mp_max_pct', 'atk_flat', 'def_flat', 'mag_flat', 'spd_flat');--> statement-breakpoint
CREATE TABLE "character_buffs" (
	"character_id" uuid NOT NULL,
	"kind" "buff_kind" NOT NULL,
	"magnitude" smallint NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_item_id" varchar(64),
	CONSTRAINT "character_buffs_character_id_kind_pk" PRIMARY KEY("character_id","kind")
);
--> statement-breakpoint
ALTER TABLE "item_templates" ADD COLUMN "buff_kind" "buff_kind";--> statement-breakpoint
ALTER TABLE "item_templates" ADD COLUMN "buff_magnitude" smallint;--> statement-breakpoint
ALTER TABLE "item_templates" ADD COLUMN "buff_duration_hours" smallint;--> statement-breakpoint
ALTER TABLE "character_buffs" ADD CONSTRAINT "character_buffs_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;