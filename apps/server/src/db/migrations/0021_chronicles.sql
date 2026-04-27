-- Kroniki Szczurogrodu: hybrydowy feed eventów prawdziwych graczy + flavor NPC.
--
-- chronicle_events — eventy gry: boss_kill (ukończony boss quest), legendary_drop
-- (legendarny loot z moba), level_milestone (5/10/15/20/30/50/75/100 lvl).
-- Dedup unikalnym `(character_id, dedup_key)` — ten sam boss/drop/level nie
-- loguje się dwa razy dla tego samego gracza. Inni gracze dostają własne
-- wiersze. Router czyta ostatnie N rekordów, cleanup nie jest potrzebny w MVP.
--
-- town_chronicles — batch flavor'ów generowany przez Claude raz dziennie.
-- Globalny (brak klasy — kroniki są te same dla wszystkich). Fallback kiedy
-- real eventów jest mało.
CREATE TABLE IF NOT EXISTS "chronicle_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "character_id" uuid NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "kind" varchar(32) NOT NULL,
  "payload" jsonb NOT NULL,
  "dedup_key" varchar(128) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "chronicle_events_dedup_unique"
  ON "chronicle_events" ("character_id", "dedup_key");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "chronicle_events_created_idx"
  ON "chronicle_events" ("created_at");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "town_chronicles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "generated_date" varchar(10) NOT NULL,
  "text" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "town_chronicles_date_text_unique"
  ON "town_chronicles" ("generated_date", "text");
