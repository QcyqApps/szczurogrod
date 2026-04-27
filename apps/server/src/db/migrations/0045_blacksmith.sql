-- Kowal Zygmunt (Priorytet 6 z docs/features-vs-sf.md).
--
-- Dodaje:
-- - character_items.enhancement_level (0..10) — per item upgrade level.
--   Aplikowane przez applyEnhancementToStats przy equip/display.
-- - characters.scrap — zasób z dismantle, gated cost na upgrade itemów.
--
-- Dismantle: item → scrap (1/3/8/20 wg rarity). Upgrade: gold + scrap, fail
-- rate na +7+, gwarantowane za 5 gemów (gem sink). Potions nie są enhanceable.

ALTER TABLE "character_items"
  ADD COLUMN IF NOT EXISTS "enhancement_level" smallint NOT NULL DEFAULT 0;

ALTER TABLE "characters"
  ADD COLUMN IF NOT EXISTS "scrap" integer NOT NULL DEFAULT 0;
