-- Arena PvP (MVP). Async snapshot duels z Elo-ish rankingiem.
--
-- Matchmaking: ±3 LVL band w obrębie graczy + NPC synth fallback gdy pool
-- cienkie. Combat: server auto-battle (reuse reduce() + rollPlayerAttack
-- semantics). Reward: gold, brak XP/loot — żeby arena nie była bypass'em
-- dla gate'owanych questów.
--
-- Daily limit: ARENA_FIGHTS_PER_DAY = 5, reset po UTC date rollover'ze
-- (tracked przez arena_last_fight_date).

ALTER TABLE "characters"
  ADD COLUMN IF NOT EXISTS "arena_points"       integer      NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS "arena_wins"         integer      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "arena_losses"       integer      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "arena_fights_today" integer      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "arena_last_fight_date" varchar(10);

-- Leaderboard index — ORDER BY arena_points DESC, ograniczone do LIMIT 10.
CREATE INDEX IF NOT EXISTS "characters_arena_points_idx"
  ON "characters" ("arena_points" DESC);

-- Arena achievements — hook'owane w routers/arena.ts:fight.
INSERT INTO "achievement_templates" ("id", "name", "desc", "icon", "tier", "category", "threshold", "reward_gold", "reward_gems", "sort_order")
VALUES
  ('arena_first_win', 'Pierwsza krew (areny)', 'Wygraj pierwszy pojedynek. Tłum zareagował ciszą.', 'crossed', 'bronze', 'combat', 1,  100,  0,  9),
  ('arena_wins_10',   'Duelant',               'Wygraj 10 pojedynków.',                             'crossed', 'silver', 'combat', 10, 1200, 15, 10)
ON CONFLICT ("id") DO NOTHING;
