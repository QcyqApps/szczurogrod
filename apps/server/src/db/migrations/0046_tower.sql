-- Wieża Bezdenna (Priorytet 4 z docs/features-vs-sf.md).
--
-- Endless dungeon: gracz walczy z skalowanym bossem per floor. Win → floor++.
-- Loss → failed_at + 15min cooldown (bypass 5g). Reset tygodniowy UTC:
-- week_start to ISO date poniedziałku, przy zmianie current_floor → 1
-- i best_floor_this_week wraca do 0 (było leaderboard'em minionego tygodnia).

CREATE TABLE IF NOT EXISTS "tower_progress" (
  "character_id"             uuid PRIMARY KEY REFERENCES "characters"("id") ON DELETE CASCADE,
  "current_floor"            integer NOT NULL DEFAULT 1,
  "best_floor_this_week"     integer NOT NULL DEFAULT 0,
  "week_start"               varchar(10) NOT NULL DEFAULT '',
  "failed_at"                timestamp with time zone,
  "updated_at"               timestamp with time zone NOT NULL DEFAULT now()
);

-- Index dla leaderboardu (top N z current week).
CREATE INDEX IF NOT EXISTS "tower_progress_week_best_idx"
  ON "tower_progress" ("week_start", "best_floor_this_week");
