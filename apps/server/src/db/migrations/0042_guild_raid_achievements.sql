-- Guildie — achievementy Phase 4. Rajdy.
-- Hook'i: guildRaids.hit (bump first_hit przy pierwszym hicie; killblow gdy HP -> 0;
-- kills_N progress dla każdego członka gildii gdy boss ubity).

INSERT INTO "achievement_templates" ("id", "name", "desc", "icon", "tier", "category", "threshold", "reward_gold", "reward_gems", "sort_order")
VALUES
  ('guild_raid_first_hit',  'Pierwsze uderzenie',   'Uderz bossa rajdu. Coś tam zapisali w pamiętniku.',   'sword',  'bronze', 'combat', 1,  200,   5, 70),
  ('guild_raid_killblow',   'Bijca bossa',          'Zadaj ostatnie trafienie bossowi rajdu. Kronikarz zapisuje.', 'skull-mage', 'silver', 'combat', 1, 1000, 15, 71),
  ('guild_raid_kills_5',    'Łowca zmór',           '5 bossów rajdu padło od twojej gildii. Nie liczą, ale wiedzą.', 'skull-lich', 'silver', 'combat', 5, 2000, 25, 72),
  ('guild_raid_kills_25',   'Plaga zmór',           '25 bossów rajdu padło. Nagrody rosną.',               'crown',   'gold',   'combat', 25, 5000, 60, 73)
ON CONFLICT ("id") DO NOTHING;
