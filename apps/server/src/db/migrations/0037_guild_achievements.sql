-- Gildie — achievementy Phase 1.
-- 5 hook'ów w routers/guild.ts (create, acceptInvite/approveApplication,
-- chat.send, promote→officer, create/transferLeader).

INSERT INTO "achievement_templates" ("id", "name", "desc", "icon", "tier", "category", "threshold", "reward_gold", "reward_gems", "sort_order")
VALUES
  ('guild_first_create', 'Założyciel',          'Załóż gildię. Pieczęć położona.',                    'castle',  'silver',   'economy',     1,  500,  10, 50),
  ('guild_first_join',   'Pierwsza gildia',     'Dołącz do gildii. Rekrut z nadzieją.',               'banner',  'bronze',   'economy',     1,  200,   0, 51),
  ('guild_officer_rank', 'Pasyjka oficerska',   'Zostań oficerem gildii. Znajdź sobie rekrutów.',     'banner',  'silver',   'economy',     1,  800,  10, 52),
  ('guild_leader_rank',  'Wódz gildyjny',       'Zostań liderem gildii. Komuś trzeba rozkazywać.',    'crown',   'gold',     'economy',     1, 2000,  25, 53),
  ('guild_chat_chatty_100', 'Gadułka',          '100 wiadomości na czacie gildii. Naród pogadał sobie.', 'scroll', 'bronze',  'economy',   100,  400,   5, 54)
ON CONFLICT ("id") DO NOTHING;
