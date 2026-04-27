-- Backfill character_items.template_id for rows written before the content
-- migration. Rows that can't be matched by (name, rarity, slot) stay NULL
-- and fall back to their snapshot columns via rowToItem.
UPDATE "character_items" ci
SET "template_id" = it.id
FROM "item_templates" it
WHERE ci.template_id IS NULL
  AND ci.name = it.name
  AND ci.rarity = it.rarity
  AND ci.slot = it.slot;
--> statement-breakpoint
-- After backfill, merge duplicate potion stacks that now share a template_id.
-- (Before this migration, identical potions from different sources stacked by
-- name — but insertOrStackPotion now stacks by template_id. Without this merge
-- a character could end up with two rows of e.g. 'Mikstura HP common'.)
WITH dupes AS (
  SELECT
    character_id,
    template_id,
    SUM(qty)::int AS total_qty,
    MIN(created_at) AS keep_created_at
  FROM "character_items"
  WHERE slot = 'potion' AND template_id IS NOT NULL
  GROUP BY character_id, template_id
  HAVING COUNT(*) > 1
),
keepers AS (
  SELECT ci.id AS keep_id, d.character_id, d.template_id, d.total_qty
  FROM dupes d
  JOIN "character_items" ci
    ON ci.character_id = d.character_id
   AND ci.template_id = d.template_id
   AND ci.created_at = d.keep_created_at
)
UPDATE "character_items" ci
SET qty = k.total_qty
FROM keepers k
WHERE ci.id = k.keep_id;
--> statement-breakpoint
DELETE FROM "character_items" ci
USING (
  SELECT
    character_id,
    template_id,
    MIN(created_at) AS keep_created_at
  FROM "character_items"
  WHERE slot = 'potion' AND template_id IS NOT NULL
  GROUP BY character_id, template_id
  HAVING COUNT(*) > 1
) d
WHERE ci.character_id = d.character_id
  AND ci.template_id = d.template_id
  AND ci.slot = 'potion'
  AND ci.created_at <> d.keep_created_at;
