-- World boss system — server-wide raid (Phase 1: MVP).
--
-- Pojedynczy boss żyje jednocześnie na cały serwer. Wszyscy gracze
-- (niezależnie od gildii) mogą bić 3×/dzień. Po killu spawn'uje się
-- następny tier. Status='active' egzekwowany unikalnym częściowym indeksem,
-- żeby równoległe inserty nie stworzyły dwóch aktywnych bossów.

CREATE TABLE world_bosses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier integer NOT NULL,
  boss_slug varchar(64) NOT NULL,
  hp_max integer NOT NULL,
  hp_current integer NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'active',
  killing_blow_char_id uuid REFERENCES characters(id) ON DELETE SET NULL,
  spawned_at timestamptz NOT NULL DEFAULT now(),
  killed_at timestamptz
);

-- Tylko jeden active na cały serwer.
CREATE UNIQUE INDEX world_bosses_one_active_idx
  ON world_bosses ((1)) WHERE status = 'active';

CREATE INDEX world_bosses_tier_idx ON world_bosses (tier DESC);

CREATE TABLE world_boss_hits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boss_id uuid NOT NULL REFERENCES world_bosses(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  dmg integer NOT NULL,
  -- Faza HP w momencie hit'a (1/2/3) — pozwala policzyć w którego klasa
  -- dostała phase-bonus, gdyby trzeba było tier statystyk.
  phase smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX world_boss_hits_boss_dmg_idx ON world_boss_hits (boss_id, dmg DESC);
CREATE INDEX world_boss_hits_char_idx ON world_boss_hits (character_id, created_at DESC);

-- Per-character daily counter — równoległy do raid_hits_today (gildia).
ALTER TABLE characters
  ADD COLUMN world_boss_hits_today smallint NOT NULL DEFAULT 0,
  ADD COLUMN last_world_boss_hit_date varchar(10) NOT NULL DEFAULT '';
