-- Akt V — Bagna Czarnej Strzygi, shop listings L33-50.
-- 8 nowych wpisów w sklepie Jacka: 2 mikstury (rare/legendary) + 2 bronie
-- (melee + caster na L35) + 4 części ekwipunku (chest L38, hands L42, neck L44,
-- feet L46) + 1 potion L50. Ceny skalowane z tier'em content'u.
--
-- Dodatkowo: UPDATE dla istniejących item_templates z błędnymi ikonami w TS
-- SHOP_CATALOG (seven-league-boots, cuirass-leather, potion-warrior, orb-dawn
-- itd.) — ikony były wcześniej poprawione w migracji 0031 via item name,
-- ale nie wszystkie shop-only itemy były w tamtej liście.

-- ============ 8 nowych item_templates (shop akt-5) ============
INSERT INTO "item_templates" ("id", "name", "icon", "slot", "rarity", "atk", "def", "mag", "desc", "hp_heal", "mp_heal", "allowed_classes")
VALUES
  ('shop_bagno_pot_rare',     'Mikstura Bagienna',       'potion-marsh',     'potion', 'rare',     NULL, NULL, NULL, 'Leczy 420 HP. Podbite błotem — liczy się intencja.',    420,   0, NULL),
  ('shop_bagno_flail',        'Kiścień Łowcy',           'flail-hunter',     'weapon', 'epic',       52, NULL, NULL, 'Krótki trzonek, długa pamięć.',                           0,   0, '["warrior","rogue"]'::jsonb),
  ('shop_bagno_pipe',         'Fujarka Pasterza',        'pipe-shepherd',    'weapon', 'epic',     NULL, NULL,   58, 'Pasterz umarł, owce poszły same.',                         0,   0, '["mage"]'::jsonb),
  ('shop_bagno_chestplate',   'Pancerz Trzcinowy',       'chestplate-reed',  'chest',  'epic',     NULL,   32, NULL, 'Szeleści. Bardzo szeleści.',                                0,   0, NULL),
  ('shop_bagno_gloves',       'Rękawice Błotne',         'gloves-mud',       'hands',  'epic',        4,   22, NULL, 'Lepkie na uścisk ręki.',                                    0,   0, NULL),
  ('shop_bagno_amulet',       'Amulet Grzybiarki',       'amulet-mushroom',  'neck',   'legendary',NULL,    8,   18, 'Znany z dobrych zbiorów.',                                  0,   0, NULL),
  ('shop_bagno_boots',        'Buty Smolne',             'boots-tar',        'feet',   'epic',     NULL,   26, NULL, 'Kapią w progu. Zostań bosy.',                               0,   0, NULL),
  ('shop_bagno_pot_big',      'Wielka Mikstura Czarna',  'potion-black-big', 'potion', 'legendary',NULL, NULL, NULL, 'Leczy 900 HP + 240 MP. Nie pytaj co zawiera.',            900, 240, NULL)
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint

-- ============ 8 nowych shop_listings ============
INSERT INTO "shop_listings" ("id", "item_template_id", "price", "uses_gems", "required_lvl")
VALUES
  ('s33',  'shop_bagno_pot_rare',     600,   false, 33),
  ('s35',  'shop_bagno_flail',     12000,   false, 35),
  ('s35m', 'shop_bagno_pipe',      12000,   false, 35),
  ('s38',  'shop_bagno_chestplate',14500,   false, 38),
  ('s42',  'shop_bagno_gloves',    18000,   false, 42),
  ('s44',  'shop_bagno_amulet',    22000,   false, 44),
  ('s46',  'shop_bagno_boots',     25000,   false, 46),
  ('s50',  'shop_bagno_pot_big',    1200,   false, 50)
ON CONFLICT ("id") DO NOTHING;
