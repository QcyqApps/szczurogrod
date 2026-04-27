-- Arena Phase 2 (produkcyjna). Historia walk + streak counter + rozszerzone
-- achievementy.
--
-- arena_matches: każdy pojedynek to jeden wiersz. Attacker + defender (real
-- player lub NPC slug), snapshot per-side (name, cls, lvl, power,
-- arenaPoints), wynik (won_by_attacker), pointsDelta attacker'a. Log tury
-- NIE persystujemy — zbyt duży koszt, klient dostaje go z `fight` response'u.
--
-- arena_current_streak: liczy kolejne wygrane z rzędu; reset na loss.
-- Driver dla arena_streak_5 achievementu.

CREATE TABLE IF NOT EXISTS "arena_matches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "attacker_id" uuid NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  -- NULL = NPC (brak PK do FK'ować); slug synth w payload'cie.
  "defender_id" uuid REFERENCES "characters"("id") ON DELETE SET NULL,
  "defender_kind" varchar(16) NOT NULL,
  "defender_slug" varchar(64) NOT NULL,
  "attacker_name" varchar(20) NOT NULL,
  "attacker_cls" varchar(16) NOT NULL,
  "attacker_lvl" integer NOT NULL,
  "defender_name" varchar(40) NOT NULL,
  "defender_cls" varchar(16) NOT NULL,
  "defender_lvl" integer NOT NULL,
  "defender_power" integer NOT NULL,
  "won_by_attacker" boolean NOT NULL,
  "points_delta" integer NOT NULL,
  "gold_reward" integer NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);--> statement-breakpoint

-- Indeksy pod history: „moje walki" (attacker_id) oraz „kto mnie bił"
-- (defender_id). Oba sortowane malejąco po czasie.
CREATE INDEX IF NOT EXISTS "arena_matches_attacker_idx"
  ON "arena_matches" ("attacker_id", "created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arena_matches_defender_idx"
  ON "arena_matches" ("defender_id", "created_at" DESC)
  WHERE "defender_id" IS NOT NULL;--> statement-breakpoint

-- Streak counter — inkrementowany na win, resetowany na loss.
ALTER TABLE "characters"
  ADD COLUMN IF NOT EXISTS "arena_current_streak" integer NOT NULL DEFAULT 0;--> statement-breakpoint

-- Nowe arena achievementy.
INSERT INTO "achievement_templates" ("id", "name", "desc", "icon", "tier", "category", "threshold", "reward_gold", "reward_gems", "sort_order")
VALUES
  ('arena_wins_50',   'Mistrz pojedynków', 'Wygraj 50 pojedynków w arenie.',                 'crossed', 'gold',      'combat',  50, 4000,  40, 11),
  ('arena_streak_5',  'Pięć z rzędu',      '5 wygranych pod rząd. Bez oddechu.',             'crossed', 'silver',   'combat',   5, 1000,  15, 12),
  ('arena_top_100',   'Pierwsza setka',    'Wejdź do TOP 100 areny.',                        'crown',   'gold',     'combat',   1, 2500,  30, 13)
ON CONFLICT ("id") DO NOTHING;
