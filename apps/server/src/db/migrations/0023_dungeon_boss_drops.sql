-- Unikatowe dropy dungeon-bossów. Każdy z 3 bossów daje 1 item per klasa
-- (warrior / mage / rogue) — 9 itemów razem.
--
-- Konwencja slotów żeby nie duplikować broni z quest-bossów Q5/Q10/Q15:
--   Baltazar (L6)    → chest (epic)
--   Kosciej (L11)    → neck (epic)
--   Władca Turni(L18)→ off-hand (legendary)
--
-- Balans startowy; admin tuni w DataGrip + admin.reload.

-- ============ Tabela ============
CREATE TABLE IF NOT EXISTS "dungeon_boss_drops" (
  "boss_enemy_slug" varchar(64) NOT NULL REFERENCES "enemy_templates"("slug") ON DELETE CASCADE,
  "cls" "character_class" NOT NULL,
  "item_template_id" varchar(64) NOT NULL REFERENCES "item_templates"("id") ON DELETE CASCADE,
  PRIMARY KEY ("boss_enemy_slug", "cls")
);--> statement-breakpoint

-- ============ 9 nowych itemów ============
INSERT INTO "item_templates" ("id", "name", "icon", "slot", "rarity", "atk", "def", "mag", "desc", "hp_heal", "mp_heal", "allowed_classes")
VALUES
  -- Baltazar (L6, chest, epic)
  ('db_baltazar_warrior', 'Kirys Szczurołapa',   'cuirass-leather', 'chest', 'epic',  5, 10, NULL, 'Gruba skóra. Gryzienie nieuniknione.', 0, 0, '["warrior"]'::jsonb),
  ('db_baltazar_mage',    'Szata Kanalarza',     'cloak-shadow',    'chest', 'epic',  NULL, 6, 12, 'Absorbuje wilgoć i klątwy.',           0, 0, '["mage"]'::jsonb),
  ('db_baltazar_rogue',   'Płaszcz z Futer',     'cuirass-mist',    'chest', 'epic',  8, 8, NULL, 'Zgryziony. Ciepły. Czujny.',            0, 0, '["rogue"]'::jsonb),
  -- Kosciej (L11, neck, epic)
  ('db_kosciej_warrior',  'Zęby Koscieja',       'chain-crown',      'neck', 'epic', 12, 4, NULL, 'Jeszcze gryzą. Nerwowo.',               0, 0, '["warrior"]'::jsonb),
  ('db_kosciej_mage',     'Czaszka Maga',        'amulet-catacombs', 'neck', 'epic', NULL, NULL, 18, 'Mamrocze podczas snu. Radzi cicho.',  0, 0, '["mage"]'::jsonb),
  ('db_kosciej_rogue',    'Kość Palca',          'amulet-shaman',    'neck', 'epic', 10, 6, NULL, 'Wciąż wskazuje drogę. W dół.',          0, 0, '["rogue"]'::jsonb),
  -- Władca Turni (L18, off, legendary)
  ('db_peaks_warrior',    'Tarcza z Grani',      'shield-item',      'off',  'legendary',  8, 25, NULL, 'Waży tyle co góra. Zatrzymuje tyle.',       0, 0, '["warrior"]'::jsonb),
  ('db_peaks_mage',       'Orb Pustkowia',       'orb-dawn',         'off',  'legendary', NULL, 10, 30, 'Odpowiada na pytania których nie zadałeś.', 0, 0, '["mage"]'::jsonb),
  ('db_peaks_rogue',      'Drugi Sztylet',       'dagger-dragon',    'off',  'legendary', 22, 8, NULL, 'Potrzebny gdy pierwszy gubi ostrze.',       0, 0, '["rogue"]'::jsonb)
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint

-- ============ 9 mapowań drop'ów ============
INSERT INTO "dungeon_boss_drops" ("boss_enemy_slug", "cls", "item_template_id")
VALUES
  ('rat-king-baltazar', 'warrior', 'db_baltazar_warrior'),
  ('rat-king-baltazar', 'mage',    'db_baltazar_mage'),
  ('rat-king-baltazar', 'rogue',   'db_baltazar_rogue'),
  ('kosciej-elder',     'warrior', 'db_kosciej_warrior'),
  ('kosciej-elder',     'mage',    'db_kosciej_mage'),
  ('kosciej-elder',     'rogue',   'db_kosciej_rogue'),
  ('lord-of-the-peaks', 'warrior', 'db_peaks_warrior'),
  ('lord-of-the-peaks', 'mage',    'db_peaks_mage'),
  ('lord-of-the-peaks', 'rogue',   'db_peaks_rogue')
ON CONFLICT DO NOTHING;
