-- Chapter 3: Bagna Czarnej Strzygi. Region 3, akt-5, L33-50.
-- Polski folk-horror: topielce, upiory, strzyga w samym środku mokradeł.
-- 3 lochy, 15 mobów T6 + 3 bossy, 9 unikatowych drop'ów (slot: feet —
-- pozostały wolny po R1=chest/neck/off i R2=hands/ring/head).
--
-- Zmiany atomic: region → dungeons → enemy_templates → mob_tier_config(tier 6)
-- → mob_loot_entries (T6 reuses T5 pool + patrz seed.ts MOB_LOOT_POOLS[6])
-- → item_templates (9) → dungeon_boss_drops (9) → dungeon_mobs (15)
-- → achievement_templates (chapter_7/8/9 + boss_trio_swamp + slayer_10000).

-- ============ Region ============
INSERT INTO "regions" ("slug", "name", "sort_order")
VALUES ('bagna-czarnej-strzygi', 'Bagna Czarnej Strzygi', 3)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

-- ============ 3 lochy ============
-- mapX/mapY pozycjonowane w 0..1000 viewbox'ie SVG. Odwzorowują:
-- Mielizny (200, 720) — brzeg, zachód-południe;
-- Gąszcz (520, 420) — centrum, czarne lustro wody;
-- Obrzędnica (800, 180) — wysep w północnym-wschodzie, altana Strzygi.
INSERT INTO "dungeons" ("slug", "region_slug", "name", "desc", "required_lvl", "prerequisite_dungeon_slug", "boss_enemy_slug", "map_x", "map_y", "sort_order")
VALUES
  ('mielizny-topielcow',  'bagna-czarnej-strzygi', 'Mielizny Topielców',
    'Woda dochodzi do kolan. Później wyżej. Ktoś łapie za kostkę.',
    33, 'serce-puszczy',           'zasmucony-topielec-starszy', 200, 720, 1),
  ('gaszcz-bolesny',      'bagna-czarnej-strzygi', 'Gąszcz Bolesny',
    'Drzewa martwe, ale rosną. Ktoś słyszał, że tu ktoś rąbał.',
    40, 'mielizny-topielcow',      'upior-drwala',                520, 420, 2),
  ('czarna-obrzednica',   'bagna-czarnej-strzygi', 'Czarna Obrzędnica',
    'Wyspa z altaną. Altana z ołtarzem. Ołtarz z czegoś, co pamięta.',
    47, 'gaszcz-bolesny',          'czarna-strzyga',              800, 180, 3)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

-- ============ 15 mobów T6 + 3 bossy ============
-- Regular T6: cooldown 2400s (40 min) dla regular, 3600s dla bossów.
-- daily_limit 1 dla regular T6 (endgame — czekasz do UTC rollover).
-- Bossy T6 mają def +50% (wszędzie używamy BOSS_SLUGS premium w seed.ts).
INSERT INTO "enemy_templates" ("slug", "name", "lvl", "hp", "atk", "def", "gold", "xp", "required_lvl", "tier", "cooldown_sec", "daily_limit", "abilities")
VALUES
  -- Mielizny Topielców (L33-37)
  ('topielec-maly',       'Topielec Mały',         33, 1200, 48, 42, 1800, 1500, 33, 6, 2400, 1,
    '[{"kind":"poison","chance":0.35,"dmgPerTurn":10,"turns":3}]'::jsonb),
  ('blotna-pijawka',      'Błotna Pijawka',        34, 1000, 52, 40, 1900, 1600, 34, 6, 2400, 1,
    '[{"kind":"poison","chance":0.50,"dmgPerTurn":8,"turns":4}]'::jsonb),
  ('zabnik-dwukrotny',    'Żabnik Dwukrotny',      35, 1400, 50, 44, 2000, 1700, 35, 6, 2400, 1, '[]'::jsonb),
  ('larwa-trzcinowa',     'Larwa Trzcinowa',       36, 1100, 56, 42, 2100, 1800, 36, 6, 2400, 1,
    '[{"kind":"poison","chance":0.40,"dmgPerTurn":12,"turns":3}]'::jsonb),
  ('mgielny-duch',        'Mgielny Duch',          37, 1300, 54, 40, 2200, 1950, 37, 6, 2400, 1,
    '[{"kind":"magic","chance":0.50}]'::jsonb),
  -- Gąszcz Bolesny (L38-42)
  ('cierniak-pelzajacy',  'Cierniak Pełzający',    38, 1500, 58, 46, 2400, 2100, 38, 6, 2400, 1, '[]'::jsonb),
  ('dziadek-z-trzciny',   'Dziadek z Trzciny',     39, 1350, 60, 44, 2550, 2250, 39, 6, 2400, 1,
    '[{"kind":"magic","chance":0.40},{"kind":"poison","chance":0.25,"dmgPerTurn":10,"turns":3}]'::jsonb),
  ('kikut-chodzacy',      'Kikut Chodzący',        40, 1800, 56, 52, 2700, 2400, 40, 6, 2400, 1,
    '[{"kind":"armor_pierce","chance":0.45}]'::jsonb),
  ('ropuch-straznik',     'Ropuch Strażnik',       41, 1600, 62, 48, 2850, 2550, 41, 6, 2400, 1,
    '[{"kind":"poison","chance":0.55,"dmgPerTurn":14,"turns":4}]'::jsonb),
  ('zelazny-komar',       'Żelazny Komar',         42, 1250, 68, 42, 3000, 2700, 42, 6, 2400, 1,
    '[{"kind":"armor_pierce","chance":0.60}]'::jsonb),
  -- Czarna Obrzędnica (L43-48)
  ('sluga-strzygi',       'Sługa Strzygi',         44, 1700, 66, 48, 3300, 3000, 44, 6, 2400, 1,
    '[{"kind":"magic","chance":0.50}]'::jsonb),
  ('nietoperz-upiora',    'Nietoperz Upiora',      45, 1500, 70, 46, 3450, 3200, 45, 6, 2400, 1,
    '[{"kind":"magic","chance":0.55},{"kind":"poison","chance":0.25,"dmgPerTurn":12,"turns":3}]'::jsonb),
  ('slepy-oracz',         'Ślepy Oracz',           46, 2000, 68, 52, 3600, 3400, 46, 6, 2400, 1, '[]'::jsonb),
  ('kocica-obrzedowa',    'Kocica Obrzędowa',      47, 1700, 74, 48, 3800, 3600, 47, 6, 2400, 1,
    '[{"kind":"magic","chance":0.60}]'::jsonb),
  ('pan-ogrodow',         'Pan Ogrodów Sczeźnienia', 48, 2200, 72, 54, 4000, 3800, 48, 6, 2400, 1,
    '[{"kind":"armor_pierce","chance":0.50},{"kind":"magic","chance":0.40}]'::jsonb),
  -- Bossy regionu 3
  ('zasmucony-topielec-starszy', 'Zasmucony Topielec Starszy', 38, 6800, 78, 100, 8500, 6500, 38, 6, 3600, 1,
    '[{"kind":"armor_pierce","chance":1.0},{"kind":"poison","chance":0.50,"dmgPerTurn":18,"turns":4}]'::jsonb),
  ('upior-drwala',        'Upiór Drwala',          43, 9200, 90, 115, 11500, 9000, 43, 6, 3600, 1,
    '[{"kind":"armor_pierce","chance":1.0},{"kind":"magic","chance":0.45}]'::jsonb),
  ('czarna-strzyga',      'Czarna Strzyga',        50,13500,110, 135, 16000,13500, 50, 6, 3600, 1,
    '[{"kind":"armor_pierce","chance":1.0},{"kind":"magic","chance":0.55},{"kind":"poison","chance":0.40,"dmgPerTurn":22,"turns":5}]'::jsonb)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

-- ============ mob_tier_config: tier 6 ============
-- drop_rate 0.50 — endgame norm. RARITY_WEIGHTS pomija common całkiem,
-- legendary porównywalne do epic.
INSERT INTO "mob_tier_config" ("tier", "drop_rate", "rarity_weights")
VALUES (6, '0.50', '{"common":0,"rare":15,"epic":45,"legendary":40}'::jsonb)
ON CONFLICT ("tier") DO NOTHING;--> statement-breakpoint

-- ============ 9 unikatowych item'ów T6 z MOB_LOOT_POOLS ============
-- Id patternem item_<12-hex>; namesy z game/combat.ts MOB_LOOT_POOLS[6].
-- Te same template'y wpadną też jako regular drops (przez mob_loot_entries).
INSERT INTO "item_templates" ("id", "name", "icon", "slot", "rarity", "atk", "def", "mag", "desc", "hp_heal", "mp_heal", "allowed_classes")
VALUES
  ('item_t6_hufnal',       'Żelazny Hufnal',              'sword',       'weapon', 'rare',      30, NULL, NULL, 'Ktoś go wyjął z kogoś. Lepiej nie pytać.',          0, 0, '["warrior","rogue"]'::jsonb),
  ('item_t6_fujarka',      'Trzcinowa Fujarka',           'orb',         'weapon', 'rare',    NULL, NULL,   36, 'Fałszuje celowo. Komary tego nie znoszą.',          0, 0, '["mage"]'::jsonb),
  ('item_t6_siec',         'Pancerz z Sieci Bagiennej',   'chestplate',  'chest',  'epic',    NULL,   32, NULL, 'Mokry po deszczu, mokry też bez.',                  0, 0, NULL),
  ('item_t6_rekawice',     'Rękawice Topielca',           'gloves',      'hands',  'epic',       8,   16, NULL, 'Lepkie. Przyjmuje się to na dobre.',                0, 0, NULL),
  ('item_t6_pierscien',    'Pierścień Mglistych Przysiąg','ring',        'ring',   'epic',    NULL,    8,   22, 'Wiesz że to błąd. Nosisz mimo to.',                 0, 0, NULL),
  ('item_t6_mikstura',     'Mikstura Czarnego Zaufania',  'potion',      'potion', 'epic',    NULL, NULL, NULL, 'Smakuje szumowinami. Robi swoje.',                140, 80, NULL),
  ('item_t6_glownia',      'Głownia Upiora',              'dagger',      'weapon', 'legendary',  58, NULL, NULL, 'Tnie cień przed ciałem.',                          0, 0, '["warrior","rogue"]'::jsonb),
  ('item_t6_runoryt',      'Runoryt Czarnej Wody',        'orb',         'weapon', 'legendary', NULL, NULL,   66, 'Czyta runy z błota. Niektóre się odczytuje.',       0, 0, '["mage"]'::jsonb),
  ('item_t6_amulet',       'Amulet Strzygoński',          'necklace',    'neck',   'legendary', NULL,   14,   28, 'Wisi. Nie śpi.',                                    0, 0, NULL)
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint

-- ============ mob_loot_entries T6 ============
-- Wpisujemy cały pool T6 zdefiniowany powyżej. NIE reusujemy T5 automatem
-- (T5 ma leśny flavor, T6 ma bagienny — chcemy separację wizualną).
INSERT INTO "mob_loot_entries" ("tier", "item_template_id") VALUES
  (6, 'item_t6_hufnal'),
  (6, 'item_t6_fujarka'),
  (6, 'item_t6_siec'),
  (6, 'item_t6_rekawice'),
  (6, 'item_t6_pierscien'),
  (6, 'item_t6_mikstura'),
  (6, 'item_t6_glownia'),
  (6, 'item_t6_runoryt'),
  (6, 'item_t6_amulet')
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- ============ 9 unikatowych boss drops (slot: feet) ============
-- Każdy boss × 3 klasy → pair feet legendary. Slot 'feet' nieużywany przez R1/R2.
INSERT INTO "item_templates" ("id", "name", "icon", "slot", "rarity", "atk", "def", "mag", "desc", "hp_heal", "mp_heal", "allowed_classes")
VALUES
  -- Zasmucony Topielec Starszy (L38) — feet legendary
  ('db_topielec_warrior',  'Buciory Topielca',             'boots',       'feet',  'legendary',  18,   26, NULL, 'Chlupią sentymentalnie.',                          0, 0, '["warrior"]'::jsonb),
  ('db_topielec_mage',     'Kalosze Kąpielowe',            'boots',       'feet',  'legendary', NULL,   14,   32, 'Nie przemakają — sama woda już w środku.',         0, 0, '["mage"]'::jsonb),
  ('db_topielec_rogue',    'Lekkie Brodzaki',              'boots',       'feet',  'legendary',  24,   14, NULL, 'Cichsze niż pamięć. Suchsze niż nie.',             0, 0, '["rogue"]'::jsonb),
  -- Upiór Drwala (L43) — feet legendary
  ('db_drwal_warrior',     'Onuce Drwala',                 'boots',       'feet',  'legendary',  26,   30, NULL, 'Pachną żywicą. I czym innym.',                     0, 0, '["warrior"]'::jsonb),
  ('db_drwal_mage',        'Mokasyny Pniaka',              'boots',       'feet',  'legendary', NULL,   18,   38, 'Korzeniem do ziemi. Ugnie ci się kolano.',         0, 0, '["mage"]'::jsonb),
  ('db_drwal_rogue',       'Chodaki Kikutowe',             'boots',       'feet',  'legendary',  32,   18, NULL, 'Stąpają osobno. Nie zawsze razem.',                0, 0, '["rogue"]'::jsonb),
  -- Czarna Strzyga (L50) — feet legendary
  ('db_strzyga_warrior',   'Okucia Strzygi',               'boots',       'feet',  'legendary',  34,   40, NULL, 'Metal cięższy niż wspomnienie. Nie gubi się.',     0, 0, '["warrior"]'::jsonb),
  ('db_strzyga_mage',      'Sandały Obrzędu',              'boots',       'feet',  'legendary', NULL,   22,   48, 'Popiół pod stopą. Robisz to specjalnie.',          0, 0, '["mage"]'::jsonb),
  ('db_strzyga_rogue',     'Mokradła Nocne',               'boots',       'feet',  'legendary',  40,   24, NULL, 'Nie zostawiają śladu. Zostawiają historię.',       0, 0, '["rogue"]'::jsonb)
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint

-- ============ 9 mapowań drop'ów ============
INSERT INTO "dungeon_boss_drops" ("boss_enemy_slug", "cls", "item_template_id")
VALUES
  ('zasmucony-topielec-starszy', 'warrior', 'db_topielec_warrior'),
  ('zasmucony-topielec-starszy', 'mage',    'db_topielec_mage'),
  ('zasmucony-topielec-starszy', 'rogue',   'db_topielec_rogue'),
  ('upior-drwala',               'warrior', 'db_drwal_warrior'),
  ('upior-drwala',               'mage',    'db_drwal_mage'),
  ('upior-drwala',               'rogue',   'db_drwal_rogue'),
  ('czarna-strzyga',             'warrior', 'db_strzyga_warrior'),
  ('czarna-strzyga',             'mage',    'db_strzyga_mage'),
  ('czarna-strzyga',             'rogue',   'db_strzyga_rogue')
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- ============ 15 mob → dungeon mappings ============
INSERT INTO "dungeon_mobs" ("dungeon_slug", "enemy_slug", "sort_order") VALUES
  ('mielizny-topielcow', 'topielec-maly',    1),
  ('mielizny-topielcow', 'blotna-pijawka',   2),
  ('mielizny-topielcow', 'zabnik-dwukrotny', 3),
  ('mielizny-topielcow', 'larwa-trzcinowa',  4),
  ('mielizny-topielcow', 'mgielny-duch',     5),
  ('gaszcz-bolesny', 'cierniak-pelzajacy', 1),
  ('gaszcz-bolesny', 'dziadek-z-trzciny',  2),
  ('gaszcz-bolesny', 'kikut-chodzacy',     3),
  ('gaszcz-bolesny', 'ropuch-straznik',    4),
  ('gaszcz-bolesny', 'zelazny-komar',      5),
  ('czarna-obrzednica', 'sluga-strzygi',   1),
  ('czarna-obrzednica', 'nietoperz-upiora',2),
  ('czarna-obrzednica', 'slepy-oracz',     3),
  ('czarna-obrzednica', 'kocica-obrzedowa',4),
  ('czarna-obrzednica', 'pan-ogrodow',     5)
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- ============ Chapter 3 achievementy ============
INSERT INTO "achievement_templates" ("id", "name", "desc", "icon", "tier", "category", "threshold", "reward_gold", "reward_gems", "sort_order")
VALUES
  ('chapter_7',        'Topielcy uciszeni',    'Pokonaj Zasmuconego Topielca Starszego. Wody znów milczą.',     'castle', 'silver',    'progression', 1,  2000, 25, 30),
  ('chapter_8',        'Drwal spokojny',        'Pokonaj Upiora Drwala. Siekiera leży.',                          'castle', 'gold',      'progression', 1,  4500, 40, 31),
  ('chapter_9',        'Strzyga nie wróci',     'Pokonaj Czarną Strzygę. Ale wrócisz ty — z butami w błocie.',   'castle', 'legendary', 'progression', 1, 10000, 90, 32),
  ('boss_trio_swamp',  'Bagna oczyszczone',     'Pokonaj wszystkich trzech bossów Bagien Czarnej Strzygi.',      'crown',  'legendary', 'combat',      3,  6000,120, 11),
  ('slayer_10000',     'Masowy wyludniacz',     '10 000 potworów. Ktoś jeszcze liczy?',                          'sword',  'legendary', 'combat',  10000, 20000,200,  9),
  ('level_100',        'Setka',                 'Osiągnij LVL 100. Starcy mówią: „Znaliśmy takiego kiedyś."',    'bolt',   'legendary', 'progression',100, 25000,250, 42)
ON CONFLICT ("id") DO NOTHING;
