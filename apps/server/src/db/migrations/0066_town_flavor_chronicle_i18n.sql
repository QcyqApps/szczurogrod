-- Town flavor + chronicle i18n: rename existing `text` → `text_pl`, add
-- nullable `text_en`. Stare wpisy zostają z NULL EN (nigdy nieczytane bo
-- batch'e są daily UTC; gracz EN'em zobaczy fallback do PL na dzisiejszy
-- batch dopóki nie zregeneruje się bilingual). Następne batch'e wstawiają
-- oba języki.

-- ===== town_flavors =====
ALTER TABLE "town_flavors" RENAME COLUMN "text" TO "text_pl";
ALTER TABLE "town_flavors" ADD COLUMN "text_en" text;

-- Index wcześniej miał `text` w nazwie; rebuild na text_pl żeby unique-key
-- nadal chronił przed dup'ami w obrębie (data, klasa).
DROP INDEX "town_flavors_date_cls_text_unique";
CREATE UNIQUE INDEX "town_flavors_date_cls_text_unique"
  ON "town_flavors" ("generated_date", "cls", "text_pl");

-- ===== town_chronicles =====
ALTER TABLE "town_chronicles" RENAME COLUMN "text" TO "text_pl";
ALTER TABLE "town_chronicles" ADD COLUMN "text_en" text;

DROP INDEX "town_chronicles_date_text_unique";
CREATE UNIQUE INDEX "town_chronicles_date_text_unique"
  ON "town_chronicles" ("generated_date", "text_pl");
