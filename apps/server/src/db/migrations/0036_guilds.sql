-- Guildie — Phase 1 MVP. Org record + członkowie + chat + zaproszenia.
-- Phase 2+ dodaje: treasury_logs, buildings, wars, raids (osobne migracje).
--
-- Design:
-- - Unique(guild.name), unique(guild.tag) — brak duplikatów nazwy.
-- - guild_members.characterId unique — 1 gildia per postać.
-- - leader_char_id FK RESTRICT — nie da się skasować postaci-lidera bez
--   transferu lub disband'u.
-- - disbanded_at timestamptz NULL dla soft-delete (historia chat'u żyje).
-- - characters.guild_id denormalizowany dla me.get (fast path bez JOIN).

-- ============ Enum guild_rank ============
DO $$ BEGIN
  CREATE TYPE "guild_rank" AS ENUM ('leader', 'officer', 'member', 'recruit');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- ============ Tabela guilds ============
CREATE TABLE IF NOT EXISTS "guilds" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(24) NOT NULL,
  "tag" varchar(5) NOT NULL,
  "motto" varchar(80) NOT NULL DEFAULT '',
  "emblem_kind" varchar(16) NOT NULL DEFAULT 'shield',
  "emblem_color" varchar(7) NOT NULL DEFAULT '#c83232',
  "leader_char_id" uuid NOT NULL REFERENCES "characters"("id") ON DELETE RESTRICT,
  "level" smallint NOT NULL DEFAULT 1,
  "glory" integer NOT NULL DEFAULT 0,
  "treasury_gold" bigint NOT NULL DEFAULT 0,
  "treasury_gems" integer NOT NULL DEFAULT 0,
  "member_cap" smallint NOT NULL DEFAULT 10,
  "required_lvl" integer NOT NULL DEFAULT 5,
  "is_open" boolean NOT NULL DEFAULT true,
  "disbanded_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "guilds_name_unique" ON "guilds" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "guilds_tag_unique" ON "guilds" ("tag");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guilds_glory_idx" ON "guilds" ("glory");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guilds_browse_idx" ON "guilds" ("is_open", "required_lvl");--> statement-breakpoint

-- ============ Tabela guild_members ============
CREATE TABLE IF NOT EXISTS "guild_members" (
  "guild_id" uuid NOT NULL REFERENCES "guilds"("id") ON DELETE CASCADE,
  "character_id" uuid NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "rank" "guild_rank" NOT NULL,
  "joined_at" timestamp with time zone NOT NULL DEFAULT now(),
  "contributed_gold" bigint NOT NULL DEFAULT 0,
  "contributed_gems" integer NOT NULL DEFAULT 0,
  "last_active_at" timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY ("guild_id", "character_id")
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "guild_members_char_unique" ON "guild_members" ("character_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guild_members_rank_idx" ON "guild_members" ("guild_id", "rank");--> statement-breakpoint

-- ============ Tabela guild_chat_messages ============
CREATE TABLE IF NOT EXISTS "guild_chat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "guild_id" uuid NOT NULL REFERENCES "guilds"("id") ON DELETE CASCADE,
  "author_char_id" uuid REFERENCES "characters"("id") ON DELETE SET NULL,
  "author_name" varchar(20) NOT NULL,
  "author_cls" "character_class" NOT NULL,
  "body" varchar(500) NOT NULL,
  "kind" varchar(16) NOT NULL DEFAULT 'chat',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "guild_chat_guild_created_idx" ON "guild_chat_messages" ("guild_id", "created_at");--> statement-breakpoint

-- ============ Tabela guild_invites ============
CREATE TABLE IF NOT EXISTS "guild_invites" (
  "guild_id" uuid NOT NULL REFERENCES "guilds"("id") ON DELETE CASCADE,
  "character_id" uuid NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "direction" varchar(8) NOT NULL,
  "created_by" uuid NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY ("guild_id", "character_id")
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "guild_invites_char_expiry_idx" ON "guild_invites" ("character_id", "expires_at");--> statement-breakpoint

-- ============ Kolumny na characters ============
ALTER TABLE "characters"
  ADD COLUMN IF NOT EXISTS "guild_id" uuid,
  ADD COLUMN IF NOT EXISTS "guild_rank" varchar(16);--> statement-breakpoint

-- FK osobno — żeby móc dodać SET NULL zachowanie nawet jak kolumna już istnieje.
DO $$ BEGIN
  ALTER TABLE "characters"
    ADD CONSTRAINT "characters_guild_id_fk"
    FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
