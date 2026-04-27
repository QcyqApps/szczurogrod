CREATE TABLE "character_season_pass" (
	"character_id" uuid NOT NULL,
	"season_start" varchar(10) NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"claimed_free_bitmap" integer DEFAULT 0 NOT NULL,
	"claimed_premium_bitmap" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_season_pass_character_id_season_start_pk" PRIMARY KEY("character_id","season_start")
);
--> statement-breakpoint
ALTER TABLE "character_season_pass" ADD CONSTRAINT "character_season_pass_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;