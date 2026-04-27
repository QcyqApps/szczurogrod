-- Achievementy Chapter 2 + endgame. Dopełnienie katalogu po Puszczy Cień.
--
-- Combat: boss_trio_forest (3 bossy Region 2), slayer_5000 (endgame farm).
-- Progression: chapter_4/5/6 (Wilkołak / Strzygoń / Panna Leszczyna),
-- level_50 / level_75 (milestone'y ponad L25).
--
-- Hook'i: combat.applyVictoryReward (chapter_4/5/6, boss_trio_forest,
-- slayer_5000), LEVEL_ACHIEVEMENTS (level_50 / level_75).

INSERT INTO "achievement_templates" ("id", "name", "desc", "icon", "tier", "category", "threshold", "reward_gold", "reward_gems", "sort_order")
VALUES
  -- Combat endgame
  ('boss_trio_forest', 'Puszcza oczyszczona', 'Pokonaj wszystkich trzech bossów Puszczy Cień.', 'crown', 'legendary', 'combat',       3, 4000,  80,  7),
  ('slayer_5000',      'Wyludniacz',          '5000 potworów. Ktoś musiał.',                    'sword', 'legendary', 'combat',    5000, 10000, 100,  8),
  -- Progression — Region 2 bossy
  ('chapter_4',        'Wilczy sen',          'Pokonaj Wilkołaka Matecznika. Księżyc zajął się swoimi sprawami.', 'castle', 'silver',    'progression', 1,  800,  15, 27),
  ('chapter_5',        'Kurhan zamknięty',    'Pokonaj Strzygonia Dziadowskiego. Dziadek już nie wraca.',         'castle', 'gold',      'progression', 1, 2000,  30, 28),
  ('chapter_6',        'Las oddycha',         'Pokonaj Pannę Leszczynę. Puszcza wreszcie mruga.',                 'castle', 'legendary', 'progression', 1, 5000,  60, 29),
  -- Progression — endgame level'e
  ('level_50',         'Mistrz cechu',        'Osiągnij LVL 50.',                               'bolt',  'legendary', 'progression',  50,  6000,  75, 40),
  ('level_75',         'Pomnik przy rynku',   'Osiągnij LVL 75.',                               'bolt',  'legendary', 'progression',  75, 12000, 120, 41)
ON CONFLICT ("id") DO NOTHING;
