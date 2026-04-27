CREATE TABLE "character_companions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"companion_slug" varchar(64) NOT NULL,
	"hired_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_companions" ADD CONSTRAINT "character_companions_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "character_companions_unique" ON "character_companions" USING btree ("character_id");