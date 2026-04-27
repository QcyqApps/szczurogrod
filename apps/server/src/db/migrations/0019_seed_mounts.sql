-- Seed produkcyjny stajni. `seedIfEmpty` odpala się tylko gdy item_templates
-- jest pusta — istniejące bazy (w tym prod) nie dostaną mountów tą drogą.
-- Migracja wstawia 3 tier'y ze źródła w `game/mounts.ts`. `ON CONFLICT (slug)
-- DO NOTHING` żeby re-run nie wybuchł; edycje balansu rób potem w DataGrip
-- + POST /trpc/admin.reload.
INSERT INTO "mount_templates" ("slug", "name", "icon", "desc", "speed_pct", "price", "rental_hours", "required_lvl", "sort_order")
VALUES
  ('mount-kucyk',  'Kucyk Bogdan',     'pony',     'Stary, ale idzie równo. Nie pyta o cel.',    20,   400, 24,  1, 1),
  ('mount-szkapa', 'Szkapa Kazimierz', 'horse',    'Nerwowy. Szybki. Ma zdanie na każdy temat.', 40,  1500, 24,  5, 2),
  ('mount-ogier',  'Ogier Bojowy',     'warhorse', 'Gryzie. Kopie. Dowozi.',                     60,  4500, 24, 10, 3)
ON CONFLICT ("slug") DO NOTHING;
