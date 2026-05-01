CREATE TYPE "public"."survivor_run_status" AS ENUM('active', 'won', 'lost', 'rejected');--> statement-breakpoint
CREATE TABLE "survivor_meta" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"okruchy" integer DEFAULT 0 NOT NULL,
	"max_stage_unlocked" integer DEFAULT 1 NOT NULL,
	"total_runs" integer DEFAULT 0 NOT NULL,
	"total_kills" integer DEFAULT 0 NOT NULL,
	"best_duration_ms_by_stage" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survivor_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stage_id" integer NOT NULL,
	"seed" bigint NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_ms" integer,
	"kills" integer,
	"boss_killed" boolean DEFAULT false NOT NULL,
	"okruchy_earned" integer DEFAULT 0 NOT NULL,
	"status" "survivor_run_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survivor_skill_progression" (
	"user_id" uuid NOT NULL,
	"node_id" varchar(64) NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "survivor_skill_progression_user_id_node_id_pk" PRIMARY KEY("user_id","node_id")
);
--> statement-breakpoint
ALTER TABLE "survivor_meta" ADD CONSTRAINT "survivor_meta_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survivor_runs" ADD CONSTRAINT "survivor_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survivor_skill_progression" ADD CONSTRAINT "survivor_skill_progression_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "survivor_runs_user_idx" ON "survivor_runs" USING btree ("user_id","started_at");
