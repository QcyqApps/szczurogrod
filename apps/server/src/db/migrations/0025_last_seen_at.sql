-- Offline progress summary. `last_seen_at` to anchor dla liczenia co się
-- nazbierało "gdy cię nie było". me.get robi snapshot przed regen'ami,
-- regen'uje, liczy delta, jeśli elapsed >= threshold — zwraca summary.
-- Istniejące postacie dostają NOW() żeby pierwszy login po migracji nie
-- zalewał modalem (mogliby grać chwilę temu).
ALTER TABLE "characters"
  ADD COLUMN "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL;
