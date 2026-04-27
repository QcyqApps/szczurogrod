-- Tropy: 3 aktywne sloty na postaci, TTL 2h. Walka z wytropionym mobem daje
-- gold×2, xp×2, drop-chance×1.5. Sloty auto-rollują się co godzinę (gdy któryś
-- jest pusty). Klucz z lochu wciąż kosztuje 1.

CREATE TABLE "character_tracks" (
  "character_id" uuid NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "slot_index" smallint NOT NULL,
  "enemy_slug" varchar(64) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "character_tracks_pk" PRIMARY KEY ("character_id", "slot_index"),
  CONSTRAINT "character_tracks_slot_range" CHECK ("slot_index" >= 0 AND "slot_index" < 3)
);--> statement-breakpoint

-- Timestamp dla auto-roll regenu — pattern jak last_key_tick_at. Advance'owany
-- tylko o skonsumowane "tiki" (patrz applyTrackRegen w game/tracks.ts).
ALTER TABLE "characters" ADD COLUMN "last_track_roll_at" timestamp with time zone DEFAULT now() NOT NULL;
