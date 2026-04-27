-- Guildie — Phase 3. Wojny gildii (S&F gauntlet).
--
-- Dodaje:
-- - guilds.last_war_declared_date (1 wojna/dzień cooldown)
-- - guild_wars (org record wojny, status, snapshot log jsonb)
-- - guild_war_participants (PK warId+characterId, side, orderIndex, snapshot jsonb)
--
-- Scheduler (setInterval 60s) scan'uje status='scheduled' AND scheduled_at <= now.
-- Gauntlet: atak[0..14] vs obrona[0..14] z carryover HP, winner zostaje.

-- ============ guilds — cooldown kolumna ============
ALTER TABLE "guilds"
  ADD COLUMN IF NOT EXISTS "last_war_declared_date" varchar(10) NOT NULL DEFAULT '';

-- ============ guild_wars ============
CREATE TABLE IF NOT EXISTS "guild_wars" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "attacker_guild_id" uuid NOT NULL REFERENCES "guilds"("id") ON DELETE CASCADE,
  "defender_guild_id" uuid NOT NULL REFERENCES "guilds"("id") ON DELETE CASCADE,
  "status"            varchar(16) NOT NULL DEFAULT 'scheduled',
  "scheduled_at"      timestamp with time zone NOT NULL,
  "resolved_at"       timestamp with time zone,
  "winner_guild_id"   uuid REFERENCES "guilds"("id") ON DELETE SET NULL,
  "attacker_score"    smallint NOT NULL DEFAULT 0,
  "defender_score"    smallint NOT NULL DEFAULT 0,
  "glory_delta"       integer NOT NULL DEFAULT 0,
  "gold_prize"        bigint NOT NULL DEFAULT 0,
  "log"               jsonb,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "guild_wars_attacker_created_idx"
  ON "guild_wars" ("attacker_guild_id", "created_at");
CREATE INDEX IF NOT EXISTS "guild_wars_defender_created_idx"
  ON "guild_wars" ("defender_guild_id", "created_at");
CREATE INDEX IF NOT EXISTS "guild_wars_status_sched_idx"
  ON "guild_wars" ("status", "scheduled_at");

-- ============ guild_war_participants ============
CREATE TABLE IF NOT EXISTS "guild_war_participants" (
  "war_id"       uuid NOT NULL REFERENCES "guild_wars"("id") ON DELETE CASCADE,
  "character_id" uuid NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "side"         varchar(8) NOT NULL,
  "order_index"  smallint NOT NULL DEFAULT 99,
  "snapshot"     jsonb NOT NULL,
  "won_duel"     boolean,
  CONSTRAINT "guild_war_participants_pk" PRIMARY KEY ("war_id", "character_id")
);

CREATE INDEX IF NOT EXISTS "guild_war_participants_war_side_order_idx"
  ON "guild_war_participants" ("war_id", "side", "order_index");
