-- Gem sinks blitz (Priorytet 1 z docs/features-vs-sf.md).
--
-- Dodaje kolumnę `characters.last_rename_at` dla rename-cooldown (30 dni).
-- Reszta sinków nie wymaga schema changes — operują na existing kolumnach
-- (gems, arena_fights_today, raid_hits_today, dungeon_keys, stamina, etc.).

ALTER TABLE "characters"
  ADD COLUMN IF NOT EXISTS "last_rename_at" timestamp with time zone;
