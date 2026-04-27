-- Stajnie: wynajem wierzchowca skracającego czas questów. Jeden aktywny mount
-- na postać (kolumny bezpośrednio na `characters` — jak companion). Mount
-- expiruje lazy — gdy `mount_expires_at <= now()`, bonus po prostu przestaje
-- się stosować w `quests.start`; nie ma background-sweepa. Content (katalog
-- wierzchowców) żyje w `mount_templates` — edytowalne w DataGrip + admin.reload.
CREATE TABLE IF NOT EXISTS "mount_templates" (
  "slug" varchar(64) PRIMARY KEY NOT NULL,
  "name" varchar(120) NOT NULL,
  "icon" varchar(64) NOT NULL,
  "desc" varchar(240) NOT NULL,
  "speed_pct" smallint NOT NULL,
  "price" integer NOT NULL,
  "rental_hours" smallint DEFAULT 24 NOT NULL,
  "required_lvl" integer DEFAULT 1 NOT NULL,
  "sort_order" smallint DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "characters" ADD COLUMN "mount_slug" varchar(64);--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "mount_expires_at" timestamp with time zone;
