-- Scrapbook (Priorytet 3 z docs/features-vs-sf.md).
--
-- Kolekcja znalezionych itemów per-postać. Unique pair (characterId, itemTemplateId).
-- Procent wypełnienia nadaje permanentne buffy (XP/gold/damage/drop rate) —
-- aplikowane w arena.fight + guildRaids.hit. Insert pattern:
-- ON CONFLICT DO NOTHING wszędzie gdzie grantujemy items.
--
-- Entry NIE znika gdy gracz sprzeda item — raz znaleziony = wiecznie w albumie.

CREATE TABLE IF NOT EXISTS "character_scrapbook" (
  "character_id"     uuid NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "item_template_id" varchar(64) NOT NULL REFERENCES "item_templates"("id") ON DELETE CASCADE,
  "found_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "character_scrapbook_pk" PRIMARY KEY ("character_id", "item_template_id")
);

CREATE INDEX IF NOT EXISTS "character_scrapbook_char_idx"
  ON "character_scrapbook" ("character_id");
