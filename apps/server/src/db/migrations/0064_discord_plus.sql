-- Discord achievement + Szczurogród+ subskrypcja.
--
-- Dwie zmiany:
-- 1. Nowy achievement `discord_joined` (manual claim po dołączeniu do Discorda).
--    Threshold=1, reward 200g + 5 gemów. Bronze, kategoria 'economy'
--    (brak osobnej 'social' — nie chcemy mnożyć kategorii dla jednego entry).
-- 2. Kolumna `characters.szczurogrod_plus_until` — timestamp wygaśnięcia
--    subskrypcji. NULL = nigdy nie aktywna lub wygasła. Gdy now < until →
--    +20% XP do wszystkich źródeł.

ALTER TABLE characters
  ADD COLUMN szczurogrod_plus_until timestamptz;

INSERT INTO "achievement_templates"
  ("id", "name", "desc", "icon", "tier", "category", "threshold", "reward_gold", "reward_gems", "sort_order")
VALUES
  ('discord_joined', 'Społecznik', 'Dołączyłeś do Discorda Szczurogrodu. Jesteś z nami.', 'megaphone', 'bronze', 'economy', 1, 200, 5, 50)
ON CONFLICT ("id") DO NOTHING;
