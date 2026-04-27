CREATE TABLE "town_flavors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generated_date" varchar(10) NOT NULL,
	"cls" character_class NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "town_flavors_date_cls_text_unique" ON "town_flavors" USING btree ("generated_date","cls","text");