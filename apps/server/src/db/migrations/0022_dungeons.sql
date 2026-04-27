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
-- Piwnice Miasta (L1-5) — 6 mobów
INSERT INTO "dungeon_mobs" ("dungeon_slug", "enemy_slug", "sort_order") VALUES
  ('piwnice-miasta', 'goblin-scav',     1),
  ('piwnice-miasta', 'rat-giant',       2),
  ('piwnice-miasta', 'slime-green',     3),
  ('piwnice-miasta', 'kobold-thief',    4),
  ('piwnice-miasta', 'goblin-warrior',  5),
  ('piwnice-miasta', 'cave-spider',     6)
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- Stare Katakumby (L5-8) — 6 mobów
INSERT INTO "dungeon_mobs" ("dungeon_slug", "enemy_slug", "sort_order") VALUES
  ('stare-katakumby', 'skeleton-soldier', 1),
  ('stare-katakumby', 'bat-dire',         2),
  ('stare-katakumby', 'troll-cave',       3),
  ('stare-katakumby', 'demon-imp',        4),
  ('stare-katakumby', 'ogre-brute',       5),
  ('stare-katakumby', 'skeleton-captain', 6)
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- Mroczna Grań (L10-18) — 7 mobów (w tym 3 quest-bossy jako regularne moby
-- najwyższego tieru; ich boss-quest identity Q5/Q10/Q15 pozostaje oddzielna
-- od dungeon-boss identity nowych 3 bossów).
INSERT INTO "dungeon_mobs" ("dungeon_slug", "enemy_slug", "sort_order") VALUES
  ('mroczna-gran', 'goblin-shaman',  1),
  ('mroczna-gran', 'minotaur',       2),
  ('mroczna-gran', 'slime-shadow',   3),
  ('mroczna-gran', 'wraith',         4),
  ('mroczna-gran', 'hobgoblin-king', 5),
  ('mroczna-gran', 'bone-dragon',    6),
  ('mroczna-gran', 'void-horror',    7)
ON CONFLICT DO NOTHING;
