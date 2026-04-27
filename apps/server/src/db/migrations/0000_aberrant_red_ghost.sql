CREATE TYPE "public"."character_class" AS ENUM('warrior', 'mage', 'rogue');--> statement-breakpoint
CREATE TYPE "public"."quest_state" AS ENUM('idle', 'active', 'done');--> statement-breakpoint
CREATE TABLE "character_quests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"quest_id" varchar(64) NOT NULL,
	"state" "quest_state" DEFAULT 'idle' NOT NULL,
	"ends_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(20) NOT NULL,
	"cls" character_class NOT NULL,
	"lvl" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"xp_max" integer DEFAULT 1000 NOT NULL,
	"hp" integer NOT NULL,
	"hp_max" integer NOT NULL,
	"mp" integer NOT NULL,
	"mp_max" integer NOT NULL,
	"gold" bigint DEFAULT 0 NOT NULL,
	"gems" integer DEFAULT 0 NOT NULL,
	"stamina" integer DEFAULT 10 NOT NULL,
	"stamina_max" integer DEFAULT 10 NOT NULL,
	"stats" jsonb NOT NULL,
	"appearance" jsonb NOT NULL,
	"last_tick_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"claimed_date" varchar(10) NOT NULL,
	"streak_day" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(254),
	"password_hash" text,
	"is_guest" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_quests" ADD CONSTRAINT "character_quests_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_claims" ADD CONSTRAINT "daily_claims_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "character_quest_unique" ON "character_quests" USING btree ("character_id","quest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "characters_user_unique" ON "characters" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");