CREATE TABLE "boss_unique_drops" (
	"quest_id" varchar(64) NOT NULL,
	"cls" character_class NOT NULL,
	"item_template_id" varchar(64) NOT NULL,
	CONSTRAINT "boss_unique_drops_quest_id_cls_pk" PRIMARY KEY("quest_id","cls")
);
--> statement-breakpoint
CREATE TABLE "companion_templates" (
	"slug" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"cls" character_class NOT NULL,
	"lvl" integer NOT NULL,
	"price" integer NOT NULL,
	"trait" text NOT NULL,
	"buff" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_ladder" (
	"day" smallint PRIMARY KEY NOT NULL,
	"kind" varchar(16) NOT NULL,
	"v" varchar(16) NOT NULL,
	"gold" integer DEFAULT 0 NOT NULL,
	"gems" integer DEFAULT 0 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"item_template_id" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "enemy_templates" (
	"slug" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"lvl" integer NOT NULL,
	"hp" integer NOT NULL,
	"atk" integer NOT NULL,
	"gold" integer NOT NULL,
	"xp" integer NOT NULL,
	"required_lvl" integer NOT NULL,
	"tier" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_templates" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"icon" varchar(64) NOT NULL,
	"slot" "item_slot" NOT NULL,
	"rarity" "item_rarity" NOT NULL,
	"atk" integer,
	"def" integer,
	"mag" integer,
	"desc" text,
	"allowed_classes" jsonb
);
--> statement-breakpoint
CREATE TABLE "mob_loot_entries" (
	"tier" smallint NOT NULL,
	"item_template_id" varchar(64) NOT NULL,
	CONSTRAINT "mob_loot_entries_tier_item_template_id_pk" PRIMARY KEY("tier","item_template_id")
);
--> statement-breakpoint
CREATE TABLE "mob_tier_config" (
	"tier" smallint PRIMARY KEY NOT NULL,
	"drop_rate" numeric(3, 2) NOT NULL,
	"rarity_weights" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quest_loot_entries" (
	"difficulty" varchar(16) NOT NULL,
	"item_template_id" varchar(64) NOT NULL,
	CONSTRAINT "quest_loot_entries_difficulty_item_template_id_pk" PRIMARY KEY("difficulty","item_template_id")
);
--> statement-breakpoint
CREATE TABLE "quest_templates" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"title" varchar(80) NOT NULL,
	"desc" text NOT NULL,
	"icon" varchar(64) NOT NULL,
	"diff" varchar(16) NOT NULL,
	"gold" integer NOT NULL,
	"xp" integer NOT NULL,
	"item_chance" integer NOT NULL,
	"duration" integer NOT NULL,
	"required_lvl" integer NOT NULL,
	"chapter" varchar(16) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_listings" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"item_template_id" varchar(64) NOT NULL,
	"price" integer NOT NULL,
	"uses_gems" boolean DEFAULT false NOT NULL,
	"required_lvl" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_items" ADD COLUMN "template_id" varchar(64);--> statement-breakpoint
ALTER TABLE "boss_unique_drops" ADD CONSTRAINT "boss_unique_drops_quest_id_quest_templates_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quest_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boss_unique_drops" ADD CONSTRAINT "boss_unique_drops_item_template_id_item_templates_id_fk" FOREIGN KEY ("item_template_id") REFERENCES "public"."item_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_ladder" ADD CONSTRAINT "daily_ladder_item_template_id_item_templates_id_fk" FOREIGN KEY ("item_template_id") REFERENCES "public"."item_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mob_loot_entries" ADD CONSTRAINT "mob_loot_entries_tier_mob_tier_config_tier_fk" FOREIGN KEY ("tier") REFERENCES "public"."mob_tier_config"("tier") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mob_loot_entries" ADD CONSTRAINT "mob_loot_entries_item_template_id_item_templates_id_fk" FOREIGN KEY ("item_template_id") REFERENCES "public"."item_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_loot_entries" ADD CONSTRAINT "quest_loot_entries_item_template_id_item_templates_id_fk" FOREIGN KEY ("item_template_id") REFERENCES "public"."item_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_listings" ADD CONSTRAINT "shop_listings_item_template_id_item_templates_id_fk" FOREIGN KEY ("item_template_id") REFERENCES "public"."item_templates"("id") ON DELETE restrict ON UPDATE no action;