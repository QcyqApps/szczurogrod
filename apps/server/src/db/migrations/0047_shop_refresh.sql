-- Gem-sink: ręczne odświeżenie oferty sklepu (dotychczas tylko auto o 00:00 UTC).
--
-- Koszt skalowany: 10 * 2^count (10, 20, 40, 80, 160 cap), resetuje się z UTC
-- datą. Tracking per-postać:
--   shop_refresh_count_today  — ile razy odświeżono w `shop_refresh_date`
--   shop_refresh_date         — ISO date (UTC) ostatniego odświeżenia
--
-- Refresh mutation sam usuwa wiersze z `shop_purchases` dla bieżącego UTC dnia,
-- dzięki czemu katalog ponownie pokazuje wszystkie listingi jako dostępne.

ALTER TABLE "characters"
  ADD COLUMN IF NOT EXISTS "shop_refresh_count_today" integer NOT NULL DEFAULT 0;

ALTER TABLE "characters"
  ADD COLUMN IF NOT EXISTS "shop_refresh_date" varchar(10);
