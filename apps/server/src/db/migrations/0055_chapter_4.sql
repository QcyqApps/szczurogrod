-- Chapter 4: Granie Strzelistych Iglic. Region 4, akt-6, L48-65.
-- Polski folk-horror górski: świszcz, strażnik, lodowy tropiciel, mroźny upiór,
-- Ognista Pani (mid-boss), Skarbnik Otchłani (final). 2 lochy, 6 mobów T7,
-- 9 unikatowych drop'ów loot pool, 6 boss-quest weapons (Q48/Q50 × 3 klasy),
-- 3 shop listingi, 5 quest templates Q46-Q50, region+mapa.
--
-- Mirror względem TS arrays (game/combat.ts DUNGEON_ENEMIES tier 7,
-- MOB_LOOT_POOLS[7], RARITY_WEIGHTS[7], game/quests.ts Q46-Q50, BOSS_UNIQUE_DROPS,
-- game/dungeons.ts REGIONS+DUNGEONS+DUNGEON_MOBS, game/shop.ts SHOP_CATALOG).
-- ON CONFLICT DO NOTHING wszędzie — idempotentne, seed.ts top-up'uje
-- co już zaaplikowane.

-- ============ Region ============
INSERT INTO "regions" ("slug", "name", "sort_order")
VALUES ('granie-strzelistych', 'Granie Strzelistych Iglic', 4)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

-- ============ 2 lochy ============
INSERT INTO "dungeons" ("slug", "region_slug", "name", "desc", "required_lvl", "prerequisite_dungeon_slug", "boss_enemy_slug", "map_x", "map_y", "sort_order")
VALUES
  ('lodowa-jaskinia',   'granie-strzelistych', 'Lodowa Jaskinia',
    'Wąskie wejście, szerokie echo. Świszcze przekrzykują halny.',
    48, 'czarna-obrzednica', 'ognista-pani',     200, 600, 1),
  ('otchlan-skarbnika', 'granie-strzelistych', 'Otchłań Skarbnika',
    'Stare sztolnie pod szczytem. Lampka kopalniana wciąż świeci. Sama.',
    56, 'lodowa-jaskinia',   'skarbnik-otchlani', 750, 250, 2)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

-- ============ 6 mobów T7 (4 normal + 2 boss) ============
-- Normal T7: cooldown 3600s (60 min), daily_limit 1.
-- Boss T7: def +50% premium (per BOSS_SLUGS w seed.ts), cooldown 3600s.
INSERT INTO "enemy_templates" ("slug", "name", "lvl", "hp", "atk", "def", "gold", "xp", "required_lvl", "tier", "cooldown_sec", "daily_limit", "abilities")
VALUES
  -- Lodowa Jaskinia (L48-54)
  ('swiszcz-hardy',        'Świszcz Hardy',         48, 1400,  72, 58, 2400,  1900, 48, 7, 3600, 1,
    '[{"kind":"poison","chance":0.30,"dmgPerTurn":12,"turns":3}]'::jsonb),
  ('straznik-granii',      'Strażnik Granii',       51, 2200,  80, 58, 2900,  2300, 51, 7, 3600, 1,
    '[{"kind":"armor_pierce","chance":0.55}]'::jsonb),
  ('lodowy-tropiciel',     'Lodowy Tropiciel',      54, 1700,  92, 58, 3500,  2800, 54, 7, 3600, 1,
    '[{"kind":"poison","chance":0.40,"dmgPerTurn":15,"turns":4}]'::jsonb),
  -- Otchłań Skarbnika (L57+)
  ('mrozny-upior',         'Mroźny Upior',          57, 1900, 100, 58, 4200,  3400, 57, 7, 3600, 1,
    '[{"kind":"magic","chance":0.55}]'::jsonb),
  -- Bossy T7 — daily 1, cooldown 60min, +50% def (87 zamiast 58)
  ('ognista-pani',         'Ognista Pani',          60, 7800, 120, 87, 9500,  7200, 60, 7, 3600, 1,
    '[{"kind":"armor_pierce","chance":1.0},{"kind":"magic","chance":0.60}]'::jsonb),
  ('skarbnik-otchlani',    'Skarbnik Otchłani',     65,12000, 145, 87,14000, 11000, 65, 7, 3600, 1,
    '[{"kind":"armor_pierce","chance":1.0},{"kind":"magic","chance":0.50},{"kind":"poison","chance":0.45,"dmgPerTurn":24,"turns":5}]'::jsonb)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

-- ============ mob_tier_config: tier 7 ============
-- drop_rate 0.55. Legendary normą, common znika całkiem (rarity_weights).
INSERT INTO "mob_tier_config" ("tier", "drop_rate", "rarity_weights")
VALUES (7, '0.55', '{"common":0,"rare":10,"epic":40,"legendary":50}'::jsonb)
ON CONFLICT ("tier") DO NOTHING;--> statement-breakpoint

-- ============ 9 unikatowych item'ów T7 (loot pool) ============
-- Mountain set: lód + skała + halny + Ognista Pani relicts. Slug pattern item_t7_*.
INSERT INTO "item_templates" ("id", "name", "icon", "slot", "rarity", "atk", "def", "mag", "desc", "hp_heal", "mp_heal", "allowed_classes")
VALUES
  ('item_t7_topor_frost',  'Mróźny Topór Halnego',         'axe-frost',         'weapon', 'rare',      38, NULL, NULL, 'Tnie wiatr. Wiatr zauważa.',                            0, 0, '["warrior","rogue"]'::jsonb),
  ('item_t7_berlo_iglicy', 'Berło Iglicy Skalnej',         'staff-spire',       'weapon', 'rare',    NULL, NULL,   44, 'Z kawałka strzelistej iglicy. Wciąż zimny.',            0, 0, '["mage"]'::jsonb),
  ('item_t7_plaszcz',      'Płaszcz z Pumy Halnej',        'cloak-mountain',    'chest',  'epic',    NULL,   38, NULL, 'Puma znikła w halnym. Płaszcz został.',                 0, 0, NULL),
  ('item_t7_helm_skarb',   'Hełm Skarbnika',               'helm-skarbnik',     'head',   'epic',    NULL,   26,    8, 'Lampka kopalniana wciąż się tli. Cicho.',               0, 0, NULL),
  ('item_t7_pierscien',    'Pierścień Mroźnej Iglicy',     'ring-frost-spire',  'ring',   'epic',    NULL,   10,   26, 'Palec marznie. Zaklęcia — niekoniecznie.',              0, 0, NULL),
  ('item_t7_eliksir_wind', 'Eliksir Halnego Wiatru',       'potion-wind',       'potion', 'epic',    NULL, NULL, NULL, 'Smak — kwaśny. Skutek — zaskakujący.',                160, 100, NULL),
  ('item_t7_berlo_flame',  'Berło Ognistej Pani',          'staff-flame',       'weapon', 'legendary', NULL, NULL,  78, 'Płonie nawet na halnym. Niewdzięczne.',                0, 0, '["mage"]'::jsonb),
  ('item_t7_sztylet',      'Sztylet Łowczyni Granii',      'dagger-spire',      'weapon', 'legendary',  70, NULL, NULL, 'Cięcie raz. Drugi raz nie potrzeba.',                  0, 0, '["warrior","rogue"]'::jsonb),
  ('item_t7_amulet',       'Amulet Smoka Halnego',         'amulet-skarbnik',   'neck',   'legendary', NULL,   18,   32, 'Smok dawno nie żyje. Amulet o tym nie wie.',           0, 0, NULL)
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint

-- ============ mob_loot_entries T7 ============
INSERT INTO "mob_loot_entries" ("tier", "item_template_id") VALUES
  (7, 'item_t7_topor_frost'),
  (7, 'item_t7_berlo_iglicy'),
  (7, 'item_t7_plaszcz'),
  (7, 'item_t7_helm_skarb'),
  (7, 'item_t7_pierscien'),
  (7, 'item_t7_eliksir_wind'),
  (7, 'item_t7_berlo_flame'),
  (7, 'item_t7_sztylet'),
  (7, 'item_t7_amulet')
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- ============ Quest templates Q46-Q50 ============
INSERT INTO "quest_templates" ("id", "title", "desc", "icon", "diff", "gold", "xp", "item_chance", "duration", "required_lvl", "chapter", "reward_keys")
VALUES
  ('q46', 'Halny po Bagnach',      'Wiatr przyniósł kogoś z gór. Albo coś. Sprawdź u Świszcza.',
    'mushroom', 'Trudne',  38000,  30000, 60, 1800000, 48, 'akt-6', 0),
  ('q47', 'Strażnik na Iglicy',    'Pasterze mówią o kamieniu który chodzi. Trudno powiedzieć czy żartują.',
    'rock',     'Ekstr.',  55000,  44000, 70, 2100000, 50, 'akt-6', 0),
  ('q48', 'Ognista Pani',          'Mid-boss. Słyszała że góry są zimne. Postanowiła to naprawić. Sprzeciw się.',
    'crown',    'Boss',   120000,  96000,100, 3000000, 52, 'akt-6', 5),
  ('q49', 'Tropy w Lodzie',        'Coś tropi was od trzech dni. Zatrzymajcie to, zanim was dopadnie.',
    'bolt',     'Ekstr.',  78000,  62000, 75, 2700000, 56, 'akt-6', 0),
  ('q50', 'Skarbnik Otchłani',     'Final. Sztolnia. Lampka kopalniana. Skarbnik liczy kości. Twoje też.',
    'crown',    'Boss',   220000, 180000,100, 3600000, 60, 'akt-6', 5)
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint

-- ============ 6 boss-quest unique weapons (Q48/Q50 × 3 klasy) ============
-- Slot: weapon. Stats progressing od Q45 baseline (atk 220, mag 248).
-- Q48 +10-25%, Q50 kolejny +10-15%. Polish flavor jak BOSS_UNIQUE_DROPS.
INSERT INTO "item_templates" ("id", "name", "icon", "slot", "rarity", "atk", "def", "mag", "desc", "hp_heal", "mp_heal", "allowed_classes")
VALUES
  -- Q48: Ognista Pani
  ('bd_q48_warrior',  'Topór Płomienny',         'axe-flame-lady',       'weapon', 'legendary', 245, NULL, NULL, 'Pyta o miarę. Sam ją odmierza.',                       0, 0, '["warrior"]'::jsonb),
  ('bd_q48_rogue',    'Sztylety Płomienne',      'daggers-flame',        'weapon', 'legendary', 218, NULL, NULL, 'Dwa cięcia. Pierwsze rzeźbi, drugie kończy.',          0, 0, '["rogue"]'::jsonb),
  ('bd_q48_mage',     'Berło Pani Ognia',        'sceptre-flame-lady',   'weapon', 'legendary', NULL, NULL, 275, 'Pamięta każdą iskrę. Każdą zwraca.',                   0, 0, '["mage"]'::jsonb),
  -- Q50: Skarbnik Otchłani
  ('bd_q50_warrior',  'Topór Halnego Wodza',     'axe-warlord',          'weapon', 'legendary', 280, NULL, NULL, 'Tnie wiatr. Wiatr tnie cię w odpowiedzi.',             0, 0, '["warrior"]'::jsonb),
  ('bd_q50_rogue',    'Łuk Mroźnej Iglicy',      'bow-frost-spire',      'weapon', 'legendary', 250, NULL, NULL, 'Strzela tylko raz. Drugi raz nie potrzeba.',           0, 0, '["rogue"]'::jsonb),
  ('bd_q50_mage',     'Berło Skarbnika',         'sceptre-skarbnik',     'weapon', 'legendary', NULL, NULL, 320, 'Liczy kości. Twoje też. Cierpliwie.',                  0, 0, '["mage"]'::jsonb)
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint

-- ============ 6 boss_unique_drops mappings ============
INSERT INTO "boss_unique_drops" ("quest_id", "cls", "item_template_id")
VALUES
  ('q48', 'warrior', 'bd_q48_warrior'),
  ('q48', 'rogue',   'bd_q48_rogue'),
  ('q48', 'mage',    'bd_q48_mage'),
  ('q50', 'warrior', 'bd_q50_warrior'),
  ('q50', 'rogue',   'bd_q50_rogue'),
  ('q50', 'mage',    'bd_q50_mage')
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- ============ 3 nowe shop items akt-6 ============
INSERT INTO "item_templates" ("id", "name", "icon", "slot", "rarity", "atk", "def", "mag", "desc", "hp_heal", "mp_heal", "allowed_classes")
VALUES
  ('shop_s48', 'Eliksir Wysokogórski',  'potion-altitude',  'potion', 'epic',      NULL, NULL, NULL, 'Leczy 1200 HP + 320 MP. Smak — tylko halny.',          1200, 320, NULL),
  ('shop_s52', 'Buty Halnego',           'boots-mountain',  'feet',   'epic',      NULL,   34, NULL, '+34 DEF, +6 SPD. Trzymają na lodzie. Pasterz przeprosił.', 0,   0, NULL),
  ('shop_s60', 'Rękawice Pasterza',      'gloves-shepherd', 'hands',  'legendary',   12,   30, NULL, '+30 DEF, +12 ATK. Wełna z owcy która znikła.',         0,   0, NULL)
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint

INSERT INTO "shop_listings" ("id", "item_template_id", "price", "uses_gems", "required_lvl")
VALUES
  ('s48', 'shop_s48',  1800, false, 48),
  ('s52', 'shop_s52', 32000, false, 52),
  ('s60', 'shop_s60', 48000, false, 60)
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint

-- ============ 6 mob → dungeon mappings ============
-- Lodowy-tropiciel patroluje obie strony Granii (intentional dwa wpisy).
INSERT INTO "dungeon_mobs" ("dungeon_slug", "enemy_slug", "sort_order") VALUES
  ('lodowa-jaskinia',   'swiszcz-hardy',     1),
  ('lodowa-jaskinia',   'straznik-granii',   2),
  ('lodowa-jaskinia',   'lodowy-tropiciel',  3),
  ('otchlan-skarbnika', 'lodowy-tropiciel',  1),
  ('otchlan-skarbnika', 'mrozny-upior',      2),
  ('otchlan-skarbnika', 'ognista-pani',      3)
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- ============ Chapter 4 achievementy ============
INSERT INTO "achievement_templates" ("id", "name", "desc", "icon", "tier", "category", "threshold", "reward_gold", "reward_gems", "sort_order")
VALUES
  ('chapter_10',          'Pani uciszona',       'Pokonaj Ognistą Panią. Halny ucichł.',                            'castle', 'silver',    'progression', 1,  3500, 35, 33),
  ('chapter_11',          'Skarbnik liczy dalej','Pokonaj Skarbnika Otchłani. Sztolnia pamięta. Ty też.',           'castle', 'legendary', 'progression', 1, 12000,110, 34),
  ('boss_duo_mountains',  'Granie zdobyte',      'Pokonaj oboje bossów Granii Strzelistych Iglic.',                 'crown',  'legendary', 'combat',      2,  7500,140, 12),
  ('level_125',           'Granicznik',          'Osiągnij LVL 125. Granie patrzą z góry. Ty patrzysz z dołu.',     'bolt',   'legendary', 'progression', 125, 30000,300, 43)
ON CONFLICT ("id") DO NOTHING;
