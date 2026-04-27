-- Osiągnięcia (Etap 1). Statyczny katalog + per-gracz progress.
--
-- Kategorie: combat / loot / progression / economy.
-- Tier: bronze → silver → gold → legendary (wizualny prestige).
-- Rewardy: gold/gems dorzucany do characters przy unlock'u.
--
-- Hook'i bump'ów w routerach: combat, quests, stables, shop, trainer, daily,
-- plus leveling call-sites. Każde osiągnięcie odpalane przez bumpAchievement
-- lub setAchievementMax w `game/achievements.ts`.

CREATE TABLE IF NOT EXISTS "achievement_templates" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "name" varchar(120) NOT NULL,
  "desc" text NOT NULL,
  "icon" varchar(64) NOT NULL,
  "tier" varchar(16) NOT NULL,
  "category" varchar(32) NOT NULL,
  "threshold" integer NOT NULL,
  "reward_gold" integer DEFAULT 0 NOT NULL,
  "reward_gems" integer DEFAULT 0 NOT NULL,
  "sort_order" smallint DEFAULT 0 NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "character_achievements" (
  "character_id" uuid NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "achievement_id" varchar(64) NOT NULL REFERENCES "achievement_templates"("id") ON DELETE CASCADE,
  "progress" integer DEFAULT 0 NOT NULL,
  "unlocked_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("character_id", "achievement_id")
);--> statement-breakpoint

-- ============ Seed achievementów ============
INSERT INTO "achievement_templates" ("id", "name", "desc", "icon", "tier", "category", "threshold", "reward_gold", "reward_gems", "sort_order")
VALUES
  -- Combat
  ('first_blood',   'Pierwsza krew',       'Pokonaj pierwszego potwora. Bez presji.',         'sword',    'bronze',    'combat',      1,   50,  0,  1),
  ('slayer_10',     'Ciepłe miecze',       'Pokonaj 10 potworów.',                            'sword',    'bronze',    'combat',     10,  100,  0,  2),
  ('slayer_100',    'Pogromca',            'Pokonaj 100 potworów. Ranek w ranek.',            'sword',    'silver',    'combat',    100,  500,  5,  3),
  ('slayer_1000',   'Rzeźnik',             '1000 potworów. Nikt nie liczy. Poza tobą.',       'sword',    'gold',      'combat',   1000, 2500, 25,  4),
  ('first_boss',    'Strach ma wielkie oczy', 'Pokonaj pierwszego bossa.',                    'crown',    'silver',    'combat',      1,  300,  5,  5),
  ('boss_trio',     'Zabójca Królów',      'Pokonaj wszystkich trzech bossów regionu.',       'crown',    'legendary', 'combat',      3, 2000, 50,  6),
  -- Loot
  ('first_rare',    'Błyskotka',           'Zdobądź pierwszy rzadki przedmiot.',              'gift',     'bronze',    'loot',        1,   50,  0, 10),
  ('first_epic',    'Epicki znalazca',     'Zdobądź pierwszy epicki przedmiot.',              'gift',     'silver',    'loot',        1,  250,  5, 11),
  ('first_legendary', 'Legenda',           'Zdobądź pierwszy legendarny przedmiot.',          'gift',     'gold',      'loot',        1,  750, 15, 12),
  ('legendary_collector', 'Kolekcjoner',   'Zbierz 5 legendarnych przedmiotów.',              'chest',    'legendary', 'loot',        5, 3000, 50, 13),
  -- Progression
  ('level_5',       'Rekrut',              'Osiągnij LVL 5.',                                 'bolt',     'bronze',    'progression', 5,  100,  0, 20),
  ('level_10',      'Weteran',             'Osiągnij LVL 10.',                                'bolt',     'silver',    'progression', 10, 400,  5, 21),
  ('level_15',      'Bohater',             'Osiągnij LVL 15.',                                'bolt',     'gold',      'progression', 15,  1000, 15, 22),
  ('level_25',      'Legenda gildii',      'Osiągnij LVL 25.',                                'bolt',     'legendary', 'progression', 25,  3000, 50, 23),
  ('chapter_1',     'Piwnice wyczyszczone', 'Pokonaj Szczurzego Króla Baltazara.',            'castle',   'silver',    'progression', 1,  500, 10, 24),
  ('chapter_2',     'Katakumby wyczyszczone', 'Pokonaj Koscieja Starszego.',                   'castle',   'gold',      'progression', 1, 1500, 20, 25),
  ('chapter_3',     'Władca Grani',        'Pokonaj Władcę Turni.',                           'castle',   'legendary', 'progression', 1, 4000, 50, 26),
  -- Economy
  ('first_quest',   'Pierwszy krok',       'Ukończ pierwszy quest.',                          'scroll',   'bronze',    'economy',     1,   50,  0, 30),
  ('quest_50',      'Kurier koronny',      'Ukończ 50 questów.',                              'scroll',   'silver',    'economy',    50,  800, 10, 31),
  ('first_shop_buy', 'Klient Jacka',       'Kup coś w sklepie.',                              'shop',     'bronze',    'economy',     1,    0,  1, 32),
  ('trainer_10',    'Cierpliwy uczeń',     'Wykup 10 statów u Trenera.',                      'spark',    'silver',    'economy',    10,  300,  5, 33),
  ('first_mount',   'Trzeci w drodze',     'Wynajmij pierwszego wierzchowca.',                'horse',    'bronze',    'economy',     1,  100,  0, 34),
  ('daily_7',       'Tydzień dyscypliny',  'Utrzymaj 7-dniową passę daily.',                  'gift',     'gold',      'economy',     7,  500, 10, 35)
ON CONFLICT ("id") DO NOTHING;
