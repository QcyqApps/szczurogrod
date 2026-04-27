-- Chapter 2: Puszcza Cień. Nowy region, 3 lochy, 15 mobów T5 + 3 bossy,
-- 9 unikalnych drop'ów (hands/ring/head). Otwiera content L16-32 — ponad
-- L15 cliff'em, który istniał po Władcy Turni.
--
-- Zmiany atomic: region → dungeons → enemy_templates → mob_tier_config(tier 5)
-- → mob_loot_entries (T5 reuses T4 pool + kilka nowych) → item_templates (9)
-- → dungeon_boss_drops (9) → dungeon_mobs (15).

-- ============ Region ============
INSERT INTO "regions" ("slug", "name", "sort_order")
VALUES ('puszcza-cien', 'Puszcza Cień', 2)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

-- ============ 3 lochy ============
INSERT INTO "dungeons" ("slug", "region_slug", "name", "desc", "required_lvl", "prerequisite_dungeon_slug", "boss_enemy_slug", "map_x", "map_y", "sort_order")
VALUES
  ('szlaki-lesne',          'puszcza-cien', 'Szlaki Leśne',
    'Ścieżki wijące się między drzewami. Las wie, kto idzie.',
    16, 'mroczna-gran',         'wilkolak-matecznika', 200, 300, 1),
  ('kurhany-starych-bogow', 'puszcza-cien', 'Kurhany Starych Bogów',
    'Stare kamienie. Starsze kości. Jeszcze starsze obietnice.',
    22, 'szlaki-lesne',         'strzygon-dziadowski', 500, 600, 2),
  ('serce-puszczy',         'puszcza-cien', 'Serce Puszczy',
    'Tu las się nie kończy. Tu las zaczyna.',
    28, 'kurhany-starych-bogow','panna-leszczyna',     800, 300, 3)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

-- ============ 15 mobów + 3 bossy T5 ============
-- cooldown_sec=1800 (30min) i daily_limit=2 dla regular T5; bossy mają 3600/1.
-- abilities ustawiamy jsonb per slug — skalowanie z designu regionu.
INSERT INTO "enemy_templates" ("slug", "name", "lvl", "hp", "atk", "def", "gold", "xp", "required_lvl", "tier", "cooldown_sec", "daily_limit", "abilities")
VALUES
  -- Szlaki Leśne
  ('forest-bandit',       'Leśny Bandyta',       16,  380, 18, 30,  480,  300, 16, 5, 1800, 2, '[]'::jsonb),
  ('boar-tusk',           'Dzik Kłoposty',       17,  680, 20, 32,  520,  340, 17, 5, 1800, 2, '[]'::jsonb),
  ('goblin-scout',        'Zwiadowca Goblinów',  18,  420, 24, 30,  560,  380, 18, 5, 1800, 2,
    '[{"kind":"poison","chance":0.25,"dmgPerTurn":5,"turns":3}]'::jsonb),
  ('wolf-pack',           'Wilk Watahy',         19,  520, 26, 32,  600,  420, 19, 5, 1800, 2, '[]'::jsonb),
  ('treant-young',        'Młody Drzewiec',      20,  880, 22, 40,  680,  470, 20, 5, 1800, 2,
    '[{"kind":"armor_pierce","chance":0.35}]'::jsonb),
  -- Kurhany Starych Bogów
  ('ghoul-risen',         'Upiór Wstały',        21,  560, 28, 34,  740,  520, 21, 5, 1800, 2,
    '[{"kind":"poison","chance":0.40,"dmgPerTurn":6,"turns":3}]'::jsonb),
  ('skeleton-priest',     'Szkielet Kapłana',    22,  500, 30, 32,  820,  580, 22, 5, 1800, 2,
    '[{"kind":"magic","chance":0.45}]'::jsonb),
  ('bone-golem',          'Kościany Golem',      23, 1100, 26, 48,  900,  640, 23, 5, 1800, 2, '[]'::jsonb),
  ('wraith-howler',       'Widmo Wyjące',        24,  620, 34, 34,  980,  720, 24, 5, 1800, 2,
    '[{"kind":"magic","chance":0.50}]'::jsonb),
  ('lich-acolyte',        'Adept Lisza',         25,  680, 36, 36, 1060,  800, 25, 5, 1800, 2,
    '[{"kind":"magic","chance":0.40},{"kind":"poison","chance":0.25,"dmgPerTurn":7,"turns":3}]'::jsonb),
  -- Serce Puszczy
  ('dryad-matron',        'Dziewonia Starsza',   26,  780, 32, 36, 1180,  900, 26, 5, 1800, 2,
    '[{"kind":"magic","chance":0.45}]'::jsonb),
  ('treant-elder',        'Drzewiec Pradawny',   27, 1400, 30, 52, 1300, 1000, 27, 5, 1800, 2,
    '[{"kind":"armor_pierce","chance":0.50}]'::jsonb),
  ('corrupted-deer',      'Skażony Jeleń',       28,  860, 40, 36, 1420, 1120, 28, 5, 1800, 2, '[]'::jsonb),
  ('mist-wraith',         'Widmo Mgły',          29,  740, 38, 38, 1560, 1240, 29, 5, 1800, 2,
    '[{"kind":"magic","chance":0.55}]'::jsonb),
  ('shadow-beast',        'Bestia Cienia',       30, 1000, 42, 40, 1700, 1380, 30, 5, 1800, 2,
    '[{"kind":"poison","chance":0.30,"dmgPerTurn":8,"turns":3}]'::jsonb),
  -- Bossy regionu 2
  ('wilkolak-matecznika', 'Wilkołak Matecznika', 22, 2600, 48, 60, 3200, 2200, 22, 5, 3600, 1,
    '[{"kind":"armor_pierce","chance":1.0}]'::jsonb),
  ('strzygon-dziadowski', 'Strzygoń Dziadowski', 27, 3600, 56, 70, 4800, 3400, 27, 5, 3600, 1,
    '[{"kind":"armor_pierce","chance":1.0},{"kind":"poison","chance":0.40,"dmgPerTurn":10,"turns":4}]'::jsonb),
  ('panna-leszczyna',     'Panna Leszczyna',     32, 5200, 66, 85, 7000, 5200, 32, 5, 3600, 1,
    '[{"kind":"armor_pierce","chance":1.0},{"kind":"magic","chance":0.50},{"kind":"poison","chance":0.30,"dmgPerTurn":14,"turns":5}]'::jsonb)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

-- ============ mob_tier_config: tier 5 ============
-- drop_rate 0.45 — wyższe od T4, RARITY_WEIGHTS lean w stronę epic/legendary.
INSERT INTO "mob_tier_config" ("tier", "drop_rate", "rarity_weights")
VALUES (5, '0.45', '{"common":5,"rare":20,"epic":45,"legendary":30}'::jsonb)
ON CONFLICT ("tier") DO NOTHING;--> statement-breakpoint

-- ============ mob_loot_entries dla T5 ============
-- Reusujemy topowe pool T4 (mocne epic/legendary) — mobi T5 lecą po tych samych
-- itemach. Gdy chcesz dodać dedykowane „puszczańskie" — rozbuduj pool po MVP.
INSERT INTO "mob_loot_entries" ("tier", "item_template_id")
SELECT 5, mle.item_template_id FROM "mob_loot_entries" mle WHERE mle.tier = 4
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- ============ 9 unikatowych dropów bossów ============
INSERT INTO "item_templates" ("id", "name", "icon", "slot", "rarity", "atk", "def", "mag", "desc", "hp_heal", "mp_heal", "allowed_classes")
VALUES
  -- Wilkołak Matecznika (L22, hands, legendary)
  ('db_wolf_warrior',   'Łapy Matecznika',    'gloves',       'hands', 'legendary', 14, 18, NULL, 'Pazury wrastają w kość. Twoją.',                0, 0, '["warrior"]'::jsonb),
  ('db_wolf_mage',      'Szpony Księżyca',    'gloves-rough', 'hands', 'legendary', NULL, 10, 20, 'Przy pełni mruczą. Nie pytaj co.',              0, 0, '["mage"]'::jsonb),
  ('db_wolf_rogue',     'Pazury Watahy',      'gloves-rough', 'hands', 'legendary', 22, 10, NULL, 'Tępią się tylko po kościach. Nie po skórze.',   0, 0, '["rogue"]'::jsonb),
  -- Strzygoń Dziadowski (L27, ring, legendary)
  ('db_strzygon_warrior','Pierścień Grobowy', 'ring',          'ring',  'legendary', 16, 12, NULL, 'Zabiera ciepło. Daje siłę.',                    0, 0, '["warrior"]'::jsonb),
  ('db_strzygon_mage',   'Sygnet Upiora',     'ring-wraith',   'ring',  'legendary', NULL, NULL, 24, 'Szeptem wzywa poprzedniego właściciela.',    0, 0, '["mage"]'::jsonb),
  ('db_strzygon_rogue',  'Obrączka Cienia',   'ring-flight',   'ring',  'legendary', 20, 14, NULL, 'Nie ma jej, gdy patrzysz wprost.',             0, 0, '["rogue"]'::jsonb),
  -- Panna Leszczyna (L32, head, legendary)
  ('db_leszcz_warrior',  'Hełm Puszczy',      'helm-hunter',   'head',  'legendary', 20, 22, NULL, 'Poroże wystaje. Przyzwyczaisz się.',            0, 0, '["warrior"]'::jsonb),
  ('db_leszcz_mage',     'Wieniec Starszej',  'crown-throne',  'head',  'legendary', NULL, 10, 32, 'Liście żyją. Kłaniają się o świcie.',          0, 0, '["mage"]'::jsonb),
  ('db_leszcz_rogue',    'Maska Liści',       'hat-rag',       'head',  'legendary', 26, 18, NULL, 'Ukrywa twarz. Ukrywa zamiary.',                0, 0, '["rogue"]'::jsonb)
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint

-- ============ 9 mapowań drop'ów ============
INSERT INTO "dungeon_boss_drops" ("boss_enemy_slug", "cls", "item_template_id")
VALUES
  ('wilkolak-matecznika', 'warrior', 'db_wolf_warrior'),
  ('wilkolak-matecznika', 'mage',    'db_wolf_mage'),
  ('wilkolak-matecznika', 'rogue',   'db_wolf_rogue'),
  ('strzygon-dziadowski', 'warrior', 'db_strzygon_warrior'),
  ('strzygon-dziadowski', 'mage',    'db_strzygon_mage'),
  ('strzygon-dziadowski', 'rogue',   'db_strzygon_rogue'),
  ('panna-leszczyna',     'warrior', 'db_leszcz_warrior'),
  ('panna-leszczyna',     'mage',    'db_leszcz_mage'),
  ('panna-leszczyna',     'rogue',   'db_leszcz_rogue')
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- ============ 15 mob → dungeon mappings ============
INSERT INTO "dungeon_mobs" ("dungeon_slug", "enemy_slug", "sort_order") VALUES
  ('szlaki-lesne', 'forest-bandit', 1),
  ('szlaki-lesne', 'boar-tusk',     2),
  ('szlaki-lesne', 'goblin-scout',  3),
  ('szlaki-lesne', 'wolf-pack',     4),
  ('szlaki-lesne', 'treant-young',  5),
  ('kurhany-starych-bogow', 'ghoul-risen',     1),
  ('kurhany-starych-bogow', 'skeleton-priest', 2),
  ('kurhany-starych-bogow', 'bone-golem',      3),
  ('kurhany-starych-bogow', 'wraith-howler',   4),
  ('kurhany-starych-bogow', 'lich-acolyte',    5),
  ('serce-puszczy', 'dryad-matron',   1),
  ('serce-puszczy', 'treant-elder',   2),
  ('serce-puszczy', 'corrupted-deer', 3),
  ('serce-puszczy', 'mist-wraith',    4),
  ('serce-puszczy', 'shadow-beast',   5)
ON CONFLICT DO NOTHING;
