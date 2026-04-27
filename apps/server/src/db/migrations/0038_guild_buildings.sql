-- Guildie — Phase 2. Skarbiec + budynki.
--
-- Dodaje:
-- - guilds.last_withdrawal_date + daily_withdrawal_sum (daily cap tracking UTC)
-- - guild_building_templates (static catalog, seedowany z TS array)
-- - guild_buildings (per-guild levele, PK (guildId, slug))
-- - guild_treasury_logs (immutable audit: deposit/withdraw/upgrade)
--
-- Buffy z altar'a aplikowane tylko w arena.fight (i przyszłych wojnach/rajdach).
-- NIE wchodzą do PvE combat.engage ani quests.collect — per decyzja user'a.

-- ============ guilds — nowe kolumny ============
ALTER TABLE "guilds"
  ADD COLUMN IF NOT EXISTS "last_withdrawal_date" varchar(10) NOT NULL DEFAULT '';

ALTER TABLE "guilds"
  ADD COLUMN IF NOT EXISTS "daily_withdrawal_sum" bigint NOT NULL DEFAULT 0;

-- ============ guild_building_templates (static catalog) ============
CREATE TABLE IF NOT EXISTS "guild_building_templates" (
  "slug"       varchar(32) PRIMARY KEY,
  "name"       varchar(80) NOT NULL,
  "icon"       varchar(64) NOT NULL,
  "max_level"  smallint NOT NULL,
  "cost_curve" jsonb NOT NULL,
  "buff_spec"  jsonb NOT NULL
);

-- ============ guild_buildings (per-guild levele) ============
CREATE TABLE IF NOT EXISTS "guild_buildings" (
  "guild_id"    uuid NOT NULL REFERENCES "guilds"("id") ON DELETE CASCADE,
  "slug"        varchar(32) NOT NULL,
  "level"       smallint NOT NULL DEFAULT 0,
  "upgraded_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "guild_buildings_pk" PRIMARY KEY ("guild_id", "slug")
);

-- ============ guild_treasury_logs (immutable audit) ============
CREATE TABLE IF NOT EXISTS "guild_treasury_logs" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "guild_id"      uuid NOT NULL REFERENCES "guilds"("id") ON DELETE CASCADE,
  "actor_char_id" uuid REFERENCES "characters"("id") ON DELETE SET NULL,
  "actor_name"    varchar(20) NOT NULL,
  "kind"          varchar(20) NOT NULL,
  "gold_delta"    bigint NOT NULL,
  "gems_delta"    integer NOT NULL,
  "memo"          varchar(128) NOT NULL DEFAULT '',
  "created_at"    timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "guild_treasury_logs_guild_created_idx"
  ON "guild_treasury_logs" ("guild_id", "created_at");
