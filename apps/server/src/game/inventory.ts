import { and, eq, sql } from 'drizzle-orm';
import { characterItems } from '../db/schema.js';
import type { Db } from '../db/client.js';
import { REGISTRY, type ItemTemplate } from '../content/registry.js';

/** Hard cap on rows in character_items per character. Matches UI (PLECAK n/24). */
export const BAG_CAP = 24;

/**
 * Count items the character owns. Works with both top-level `db` and a
 * transaction handle (tx) since both expose the same `.select()` surface.
 */
export async function getBagCount(
  db: Pick<Db, 'select'>,
  characterId: string,
): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(characterItems)
    .where(eq(characterItems.characterId, characterId));
  return row?.n ?? 0;
}

/**
 * Inserts a potion or stacks it onto an existing (same template_id) row.
 * Returns the target row id on success. Returns null only when a NEW stack
 * would exceed BAG_CAP.
 *
 * Stacking only applies to slot='potion'. Non-potion items go through the
 * normal insert path with the standard bag cap check.
 *
 * The potion's display fields are resolved at read time from
 * `REGISTRY.items.get(templateId)`. The snapshot columns on character_items
 * are populated defensively so legacy fallback keeps working if the template
 * is ever removed.
 */
export async function insertOrStackPotion(
  db: Pick<Db, 'select' | 'insert' | 'update'>,
  characterId: string,
  templateId: string,
  source: string,
): Promise<{ id: string } | null> {
  const tpl = REGISTRY.items.get(templateId);
  if (!tpl) {
    throw new Error(`insertOrStackPotion: unknown item template ${templateId}`);
  }
  if (tpl.slot !== 'potion') {
    throw new Error(`insertOrStackPotion: template ${templateId} is not a potion (${tpl.slot})`);
  }
  const [existing] = await db
    .select({ id: characterItems.id, qty: characterItems.qty })
    .from(characterItems)
    .where(
      and(
        eq(characterItems.characterId, characterId),
        eq(characterItems.slot, 'potion'),
        eq(characterItems.templateId, templateId),
      ),
    )
    .limit(1);
  if (existing) {
    await db
      .update(characterItems)
      .set({ qty: existing.qty + 1 })
      .where(eq(characterItems.id, existing.id));
    return { id: existing.id };
  }
  if ((await getBagCount(db, characterId)) >= BAG_CAP) return null;
  const [inserted] = await db
    .insert(characterItems)
    .values(itemTemplateToRowValues(tpl, characterId, source))
    .returning({ id: characterItems.id });
  return { id: inserted.id };
}

/**
 * Build character_items insert values from an ItemTemplate. Sets template_id
 * + snapshots the template fields (name/icon/slot/rarity/stats/desc) so that
 * if the template is later removed, legacy fallback in rowToItem still works.
 */
export function itemTemplateToRowValues(
  tpl: ItemTemplate,
  characterId: string,
  source: string,
): typeof characterItems.$inferInsert {
  return {
    characterId,
    templateId: tpl.id,
    name: tpl.name,
    icon: tpl.icon,
    slot: tpl.slot,
    rarity: tpl.rarity,
    atk: tpl.atk ?? null,
    def: tpl.def ?? null,
    mag: tpl.mag ?? null,
    desc: tpl.desc,
    source,
    qty: 1,
  };
}
