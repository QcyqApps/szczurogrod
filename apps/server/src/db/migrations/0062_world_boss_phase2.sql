-- World boss Phase 2 — echoes currency + achievements.
--
-- Dodaje 5 achievementów (`world_boss_*`) wzorowane na guild_raid_*.
-- Echa Wybudzonego ('echoes') — nowa waluta drop'owana per hit, tradeable
-- w world boss shop (gem/scrap/gold/extra hit).

-- 1. Echoes column (immutable counter, akumulatywne, nie resetuje na nic).
ALTER TABLE characters
  ADD COLUMN echoes integer NOT NULL DEFAULT 0;

-- 2. Achievementy.
INSERT INTO "achievement_templates" ("id", "name", "desc", "icon", "tier", "category", "threshold", "reward_gold", "reward_gems", "sort_order")
VALUES
  ('world_boss_first_hit',  'Pierwsze pluniecie', 'Uderz Wybudzonego. Świat zauważył.',                          'sword',      'bronze', 'combat', 1,   300,  10, 80),
  ('world_boss_killblow',   'Ostatni cios',       'Zadaj killing blow Wybudzonemu. Pamiętają cię tylko żywi.',   'skull-mage', 'gold',   'combat', 1,  3000,  50, 81),
  ('world_boss_top10',      'W pierwszej dziesiątce', 'Znajdź się w top 10 contributorów po killu.',             'crown',      'silver', 'combat', 1,  1500,  25, 82),
  ('world_boss_kills_5',    'Stary uczestnik',    'Brałeś udział w 5 zabójstwach Wybudzonego.',                 'skull-lich', 'silver', 'combat', 5,  2000,  30, 83),
  ('world_boss_killblow_3', 'Trzykrotnik',        'Trzy razy ostatni cios. Statystycznie podejrzane.',          'crown',      'gold',   'combat', 3,  4000,  80, 84)
ON CONFLICT ("id") DO NOTHING;
