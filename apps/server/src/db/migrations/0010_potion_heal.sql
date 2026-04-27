ALTER TABLE "item_templates" ADD COLUMN "hp_heal" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "item_templates" ADD COLUMN "mp_heal" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Seed heal values for existing potions by rarity. Tunable later per-item in CMS.
UPDATE "item_templates" SET "hp_heal" = CASE "rarity"
  WHEN 'common' THEN 40
  WHEN 'rare' THEN 80
  WHEN 'epic' THEN 140
  WHEN 'legendary' THEN 220
  ELSE 0
END
WHERE "slot" = 'potion';--> statement-breakpoint
-- Mikstura Buraka's shop desc says "Leczy 80 HP" — bump it to match.
UPDATE "item_templates" SET "hp_heal" = 80 WHERE "name" = 'Mikstura Buraka';
