ALTER TABLE "enemy_templates" ADD COLUMN "def" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Seed per-tier defense baseline. Tunable later via CMS.
UPDATE "enemy_templates" SET "def" = CASE "tier"
  WHEN 1 THEN 2
  WHEN 2 THEN 6
  WHEN 3 THEN 12
  WHEN 4 THEN 20
  ELSE 0
END;--> statement-breakpoint
-- Boss-flavored mobs get a +50% DEF premium so armor piercing magic actually matters.
UPDATE "enemy_templates" SET "def" = ceil("def" * 1.5)
WHERE slug IN ('hobgoblin-king', 'bone-dragon', 'void-horror');