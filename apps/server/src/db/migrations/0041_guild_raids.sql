-- Guildie — Phase 4. Rajdy continuous S&F.
--
-- Continuous: każda gildia ma max 1 active bossa. Członek 3 hity/dzień.
-- Po killu — spawn next tier (natychmiast), reward split po contributors,
-- chronicle + achievement.
--
-- Dodaje:
-- - guild_members.raid_hits_today + last_raid_hit_date (UTC tracking)
-- - guild_raid_boss_templates (static pool, seedowany z TS)
-- - guild_raid_bosses (per-guild, status active/killed, tier rośnie)
-- - guild_raid_hits (audit per hit, powered leaderboard)

-- ============ guild_members — hit tracking ============
ALTER TABLE "guild_members"
  ADD COLUMN IF NOT EXISTS "raid_hits_today" smallint NOT NULL DEFAULT 0;

ALTER TABLE "guild_members"
  ADD COLUMN IF NOT EXISTS "last_raid_hit_date" varchar(10) NOT NULL DEFAULT '';

-- ============ guild_raid_boss_templates (static catalog) ============
CREATE TABLE IF NOT EXISTS "guild_raid_boss_templates" (
  "slug"            varchar(64) PRIMARY KEY,
  "name"            varchar(80) NOT NULL,
  "icon"            varchar(64) NOT NULL,
  "base_hp"         integer NOT NULL,
  "flavor"          varchar(200) NOT NULL DEFAULT '',
  "rotation_index"  smallint NOT NULL
);

-- ============ guild_raid_bosses ============
CREATE TABLE IF NOT EXISTS "guild_raid_bosses" (
  "id"                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "guild_id"               uuid NOT NULL REFERENCES "guilds"("id") ON DELETE CASCADE,
  "tier"                   integer NOT NULL,
  "boss_slug"              varchar(64) NOT NULL,
  "hp_max"                 integer NOT NULL,
  "hp_current"             integer NOT NULL,
  "status"                 varchar(16) NOT NULL DEFAULT 'active',
  "killing_blow_char_id"   uuid REFERENCES "characters"("id") ON DELETE SET NULL,
  "spawned_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "killed_at"              timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "guild_raid_bosses_guild_status_idx"
  ON "guild_raid_bosses" ("guild_id", "status");
CREATE INDEX IF NOT EXISTS "guild_raid_bosses_guild_tier_idx"
  ON "guild_raid_bosses" ("guild_id", "tier");

-- ============ guild_raid_hits ============
CREATE TABLE IF NOT EXISTS "guild_raid_hits" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "boss_id"       uuid NOT NULL REFERENCES "guild_raid_bosses"("id") ON DELETE CASCADE,
  "character_id"  uuid NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "dmg"           integer NOT NULL,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "guild_raid_hits_boss_dmg_idx"
  ON "guild_raid_hits" ("boss_id", "dmg");
CREATE INDEX IF NOT EXISTS "guild_raid_hits_char_idx"
  ON "guild_raid_hits" ("character_id", "created_at");
