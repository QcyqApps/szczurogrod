CREATE TYPE "public"."equipped_slot" AS ENUM('head', 'neck', 'chest', 'weapon', 'off', 'hands', 'ring', 'feet');--> statement-breakpoint
CREATE TYPE "public"."item_rarity" AS ENUM('common', 'rare', 'epic', 'legendary');--> statement-breakpoint
CREATE TYPE "public"."item_slot" AS ENUM('head', 'neck', 'chest', 'weapon', 'off', 'hands', 'ring', 'feet', 'potion', 'any');--> statement-breakpoint
CREATE TABLE "character_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"icon" varchar(64) NOT NULL,
	"slot" "item_slot" NOT NULL,
	"rarity" "item_rarity" NOT NULL,
	"atk" integer,
	"def" integer,
	"mag" integer,
	"desc" text,
	"equipped_slot" "equipped_slot",
	"source" varchar(32) DEFAULT 'unknown' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_items" ADD CONSTRAINT "character_items_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;