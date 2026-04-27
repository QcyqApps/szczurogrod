-- Reorganizacja: flat list mobów → regiony + lochy z bossami + chain unlock.
--
-- 4 nowe tabele:
-- - regions              (slug → name) — wspólny kontener mapy
-- - dungeons             (slug → region, boss_enemy_slug, prerequisite, mapX/Y)
-- - dungeon_mobs         (junction dungeon↔enemy_templates dla "regular" mobów)
-- - character_dungeon_clears  (per-gracz log ubitych bossów → chain unlock)
--
-- + 3 nowe boss-moby w enemy_templates:
--   rat-king-baltazar (Piwnice L6)
--   kosciej-elder     (Katakumby L11)
--   lord-of-the-peaks (Mroczna Grań L18)
--
-- + seed regionu "Okolice Szczurogrodu", 3 lochów i przypięcie 19 istniejących
--   mobów do lochów wg tieru/LVL.

-- ============ Tabele ============
CREATE TABLE IF NOT EXISTS "regions" (
  "slug" varchar(64) PRIMARY KEY NOT NULL,
  "name" varchar(120) NOT NULL,
  "sort_order" smallint DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "dungeons" (
  "slug" varchar(64) PRIMARY KEY NOT NULL,
  "region_slug" varchar(64) NOT NULL REFERENCES "regions"("slug") ON DELETE CASCADE,
  "name" varchar(120) NOT NULL,
  "desc" text NOT NULL,
  "required_lvl" integer DEFAULT 1 NOT NULL,
  "prerequisite_dungeon_slug" varchar(64),
  "boss_enemy_slug" varchar(64) NOT NULL,
  "map_x" smallint DEFAULT 500 NOT NULL,
  "map_y" smallint DEFAULT 500 NOT NULL,
  "sort_order" smallint DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "dungeon_mobs" (
  "dungeon_slug" varchar(64) NOT NULL REFERENCES "dungeons"("slug") ON DELETE CASCADE,
  "enemy_slug" varchar(64) NOT NULL REFERENCES "enemy_templates"("slug") ON DELETE CASCADE,
  "sort_order" smallint DEFAULT 0 NOT NULL,
  PRIMARY KEY ("dungeon_slug", "enemy_slug")
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "character_dungeon_clears" (
  "character_id" uuid NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "dungeon_slug" varchar(64) NOT NULL REFERENCES "dungeons"("slug") ON DELETE CASCADE,
  "cleared_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("character_id", "dungeon_slug")
);--> statement-breakpoint

-- ============ 3 nowe bossy ============
-- tier=4 (top-tier, unikalny). Real throttle "raz dziennie" robi daily_limit=1
-- (reset o 00:00 UTC w combat.engage). cooldown_sec=3600 (1h) to dodatkowy
-- minimalny odstęp między engagami — mieści się w smallint (max 32767).
-- armor_pierce zawsze aktywny (chance=1.0) — klasyczny boss-fight feel.
-- Późniejsze dropy: boss_unique_drops per klasa (Etap 3).
INSERT INTO "enemy_templates" ("slug", "name", "lvl", "hp", "atk", "def", "gold", "xp", "required_lvl", "tier", "cooldown_sec", "daily_limit", "abilities")
VALUES
  ('rat-king-baltazar',  'Szczurzy Król Baltazar',  6,  480,  14, 30,  250,  150,  6, 4, 3600, 1,
    '[{"kind":"armor_pierce","chance":1.0}]'::jsonb),
  ('kosciej-elder',      'Kosciej Starszy',         11, 880,  22, 40,  600,  360, 11, 4, 3600, 1,
    '[{"kind":"armor_pierce","chance":1.0},{"kind":"magic","chance":0.40}]'::jsonb),
  ('lord-of-the-peaks',  'Władca Turni',            18, 2000, 36, 55, 2200, 1400, 18, 4, 3600, 1,
    '[{"kind":"armor_pierce","chance":1.0},{"kind":"magic","chance":0.40},{"kind":"poison","chance":0.30,"dmgPerTurn":6,"turns":4}]'::jsonb)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

-- ============ Region ============
INSERT INTO "regions" ("slug", "name", "sort_order")
VALUES ('okolice-szczurogrodu', 'Okolice Szczurogrodu', 1)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

-- ============ 3 lochy ============
-- Mapa 0..1000 × 0..1000. Ścieżka wije się od lewej do prawej.
-- Piwnice (dolny-lewy) → Katakumby (środek-góra) → Grań (prawy dół, widok turni).
INSERT INTO "dungeons" ("slug", "region_slug", "name", "desc", "required_lvl", "prerequisite_dungeon_slug", "boss_enemy_slug", "map_x", "map_y", "sort_order")
VALUES
  ('piwnice-miasta',  'okolice-szczurogrodu', 'Piwnice Miasta',
    'Pod miastem śmierdzi. Coś tam się rusza. Ktoś musi to sprawdzić.',
    1,  NULL,                'rat-king-baltazar',  180, 720, 1),
  ('stare-katakumby', 'okolice-szczurogrodu', 'Stare Katakumby',
    'Pamiętają czasy przed Szczurogrodem. Umarli pamiętają najdłużej.',
    6,  'piwnice-miasta',    'kosciej-elder',       500, 350, 2),
  ('mroczna-gran',    'okolice-szczurogrodu', 'Mroczna Grań',
    'Tam gdzie kamień zaczyna szeptać. Chodź się przekonaj.',
    10, 'stare-katakumby',   'lord-of-the-peaks',   820, 680, 3)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

-- ============ Przypisanie 19 mobów do lochów ============
-- USUNIĘTE: oryginalne INSERTy do dungeon_mobs zależały od enemy_slug'ów
-- (`goblin-scav`, `rat-giant`, ...) które żyją wyłącznie w TS array
-- DUNGEON_ENEMIES (apps/server/src/game/combat.ts) i są wstrzykiwane do
-- enemy_templates dopiero przez `seedIfEmpty(db)` w `content/seed.ts`,
-- które działa PO migracjach. Na świeżej bazie produkcyjnej FK
-- dungeon_mobs.enemy_slug → enemy_templates.slug walił constraint violation.
--
-- Naprawa: ten sam content (DUNGEON_MOBS w game/dungeons.ts) jest seedowany
-- przez seed.ts z onConflictDoNothing(). Migracja zostawia tylko schema +
-- regions/dungeons/3 nowe bossy; dungeon_mobs trafia z TS.
-- Dla DBek które już mają stary 0022 zaaplikowany — zero efektu (drizzle
-- nie przekompilowuje __drizzle_migrations według hashy plików).
