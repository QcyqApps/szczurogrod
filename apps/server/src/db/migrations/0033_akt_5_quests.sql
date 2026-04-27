-- Akt V — Bagna Czarnej Strzygi, questy L33-50.
-- 4 regular (q31-q34, diff Ekstr.) + 3 bossy (q35/q40/q45).
-- Każdy boss dostaje 3-klasową parkę unikalnych broni legendary (9 itemów)
-- przez `boss_unique_drops` (odrębne od `dungeon_boss_drops` — te ostatnie
-- to buty feet w migracji 0030).

-- ============ 7 quest_templates akt-5 ============
INSERT INTO "quest_templates" ("id", "title", "desc", "icon", "diff", "gold", "xp", "item_chance", "duration", "required_lvl", "chapter", "reward_keys")
VALUES
  ('q31', 'Chusteczki babci topielczycy', 'Zgubiła. Jak zwykle. Tym razem w trzcinach. Wiesz gdzie szukać.',      'scroll',   'Ekstr.',   8500,   6500, 60,  900000, 33, 'akt-5', 0),
  ('q32', 'Trzciny na strzechę',           'Karczma dziurawa. Trzciny miękkie. Ropuchy nieprzyjemne.',            'mushroom', 'Ekstr.',  11000,   8800, 65, 1080000, 36, 'akt-5', 0),
  ('q33', 'Cierniowe mazidło',             'Zielarka potrzebuje żywicy z Cierniaków. Pełzających. Żywych.',      'mushroom', 'Ekstr.',  15000,  12000, 70, 1320000, 40, 'akt-5', 0),
  ('q34', 'Ołtarzowa woda',                'Z czarnego stawu przy ołtarzu. Nie pij. Nie patrz.',                  'potion',   'Ekstr.',  22000,  18000, 75, 1500000, 45, 'akt-5', 0),
  ('q35', 'Zasmucony Topielec Starszy',    'Boss Mielizn. Kiedyś ktoś, teraz — wyłącznie mokrość z pretensjami.', 'crown',    'Boss',    55000,  44000, 100, 2100000, 35, 'akt-5', 5),
  ('q40', 'Upiór Drwala',                  'Boss Gąszczu. Rąbał, rąbie, nie przestanie. Przekonaj go.',           'crown',    'Boss',    85000,  68000, 100, 2700000, 40, 'akt-5', 5),
  ('q45', 'Czarna Strzyga',                'Finał. Altana. Ołtarz. Strzyga. Jedno z nich nie wróci.',             'crown',    'Boss',   160000, 130000, 100, 3600000, 47, 'akt-5', 5)
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint

-- ============ 9 item_templates — boss quest weapons ============
INSERT INTO "item_templates" ("id", "name", "icon", "slot", "rarity", "atk", "def", "mag", "desc", "hp_heal", "mp_heal", "allowed_classes")
VALUES
  -- q35 Zasmucony Topielec Starszy
  ('bq_q35_warrior', 'Kiścień Topielca',   'flail-drowned',     'weapon', 'legendary', 118, NULL, NULL, 'Głowa na łańcuchu. Cicho chlupie.',                 0, 0, '["warrior","rogue"]'::jsonb),
  ('bq_q35_rogue',   'Nóż Rybaka',         'knife-fisherman',   'weapon', 'legendary', 108, NULL, NULL, 'Rybia łuska w rękojeści. Łap i nie patrz.',         0, 0, '["warrior","rogue"]'::jsonb),
  ('bq_q35_mage',    'Laska Drifująca',    'staff-drifting',    'weapon', 'legendary', NULL, NULL,  132, 'Gałązki wiszą. Same się zaplątują.',                0, 0, '["mage"]'::jsonb),
  -- q40 Upiór Drwala
  ('bq_q40_warrior', 'Topór Nawiedzony',   'axe-haunted',       'weapon', 'legendary', 148, NULL, NULL, 'Rąbie sam. Czasem o północy.',                      0, 0, '["warrior","rogue"]'::jsonb),
  ('bq_q40_rogue',   'Siekierka Cieśli',   'hatchet-carpenter', 'weapon', 'legendary', 134, NULL, NULL, 'Miała kiedyś właściciela. Ma go nadal.',            0, 0, '["warrior","rogue"]'::jsonb),
  ('bq_q40_mage',    'Kostur Sękaty',      'staff-forked',      'weapon', 'legendary', NULL, NULL,  162, 'Rozwidlony jak droga do piekła.',                   0, 0, '["mage"]'::jsonb),
  -- q45 Czarna Strzyga (FINAL)
  ('bq_q45_warrior', 'Szabla Strzygi',     'saber-strzyga',     'weapon', 'legendary', 220, NULL, NULL, 'Tnie cień. Tnie cisza. Tnie wszystko.',             0, 0, '["warrior","rogue"]'::jsonb),
  ('bq_q45_rogue',   'Szpony Strzygi',     'claws-strzyga',     'weapon', 'legendary', 198, NULL, NULL, 'Cztery ostrza. Cztery grzechy. Wybierz.',           0, 0, '["warrior","rogue"]'::jsonb),
  ('bq_q45_mage',    'Ossuarium Strzygi',  'staff-ossuary',     'weapon', 'legendary', NULL, NULL,  248, 'Czaszka mówi imionami. Słyszysz swoje.',            0, 0, '["mage"]'::jsonb)
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint

-- ============ 9 boss_unique_drops mappings ============
INSERT INTO "boss_unique_drops" ("quest_id", "cls", "item_template_id")
VALUES
  ('q35', 'warrior', 'bq_q35_warrior'),
  ('q35', 'rogue',   'bq_q35_rogue'),
  ('q35', 'mage',    'bq_q35_mage'),
  ('q40', 'warrior', 'bq_q40_warrior'),
  ('q40', 'rogue',   'bq_q40_rogue'),
  ('q40', 'mage',    'bq_q40_mage'),
  ('q45', 'warrior', 'bq_q45_warrior'),
  ('q45', 'rogue',   'bq_q45_rogue'),
  ('q45', 'mage',    'bq_q45_mage')
ON CONFLICT DO NOTHING;
