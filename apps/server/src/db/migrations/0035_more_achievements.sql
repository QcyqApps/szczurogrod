-- 9 nowych achievementów — rozwinięcie endgame'u (akt-5 gracz z content
-- L50+ potrzebuje więcej milestone'ów).
--
-- Kategorie: combat (1), loot (1), progression (1), economy (6).
-- Tier spread: silver(3), gold(2), legendary(4).

INSERT INTO "achievement_templates" ("id", "name", "desc", "icon", "tier", "category", "threshold", "reward_gold", "reward_gems", "sort_order")
VALUES
  -- Quest milestones (extend quest_50)
  ('quest_100',            'Stały kurier',         'Ukończ 100 questów. Karczmarz zna twoje zamówienie.',       'scroll',  'silver',   'economy',    100,  1800,  20, 36),
  ('quest_250',            'Legendarny listonosz', 'Ukończ 250 questów. Nikt już nie pamięta, jak się zaczęło.','scroll',  'legendary','economy',    250,  8000,  80, 37),
  -- Shop + trainer + daily extensions
  ('shop_buy_50',          'Bywalec',              'Kup 50 przedmiotów w sklepie.',                              'shop',    'silver',   'economy',     50,  1200,  15, 38),
  ('trainer_50',           'Mozolny uczeń',        'Wykup 50 statów u Trenera. Trener wie ile.',                 'spark',   'gold',     'economy',     50,  3000,  35, 39),
  ('daily_30',             'Miesięczna dyscyplina','Utrzymaj 30-dniową passę daily.',                            'gift',    'legendary','economy',     30,  6000,  70, 41),
  -- Arena endgame
  ('arena_streak_10',      'Dziesięć z rzędu',     '10 wygranych pod rząd. Łóżko puste trzeci tydzień.',         'crossed', 'gold',     'combat',      10,  3500,  45, 14),
  ('arena_wins_200',       'Panisko Areny',        'Wygraj 200 pojedynków. Ktoś ci nawet nie gratulował.',       'crossed', 'legendary','combat',     200, 15000, 150, 15),
  -- Loot + dungeon coverage
  ('legendary_collector_25', 'Legendarny skarbnik',  'Zbierz 25 legendarnych przedmiotów. Bagaż się napina.',   'chest',   'legendary','loot',       25,  8000,  80, 14),
  ('all_dungeons',         'Pełna mapa',           'Zaliczy wszystkie 9 lochów. Nic do zobaczenia, panie.',      'castle',  'legendary','progression', 9,  12000, 120, 43)
ON CONFLICT ("id") DO NOTHING;
