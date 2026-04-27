-- Gildie — achievementy Phase 3. Wojny.
-- 3 hook'i: guildWars.declare (bump war_declared), scheduler (war_first_win,
-- war_wins_N przy każdym resolve gdy moja strona wygrała).

INSERT INTO "achievement_templates" ("id", "name", "desc", "icon", "tier", "category", "threshold", "reward_gold", "reward_gems", "sort_order")
VALUES
  ('guild_war_declared',   'Wojownik z papieru',    'Wypowiedz pierwszą wojnę gildyjną. Dłoń na tarczy.',          'crossed', 'bronze', 'combat', 1,  300,  5, 60),
  ('guild_war_first_win',  'Pierwsza wygrana wojna', 'Wygraj pierwszą wojnę gildyjną. Sztandar zostaje.',          'banner',  'silver', 'combat', 1, 1000, 15, 61),
  ('guild_war_wins_10',    'Bywalec wojen',         'Wygraj 10 wojen gildyjnych. Kronikarz podpisuje.',           'crown',   'gold',   'combat', 10, 3000, 40, 62)
ON CONFLICT ("id") DO NOTHING;
