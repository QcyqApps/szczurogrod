// Scrapbook — Priorytet 3 z docs/features-vs-sf.md.
//
// Katalog znalezionych itemów per-postać. Buff'y skalowane progowo:
// 25% → +1% XP, 50% → +3% gold, 75% → +5% damage, 100% → +2% drop.
// Buffy aplikowane w arena.fight + guildRaids.hit (nie w PvE — zachowuje
// balance aktów 1-5, mirror altar buff philosophy).
//
// Insert pattern: wszędzie gdzie grantujemy item (quests.collect, combat.applyVictoryReward,
// shop.buy, daily.claim) wołamy `registerScrapbookFind(tx, charId, itemTemplateId)`.

import { eq, sql } from 'drizzle-orm';
import { SCRAPBOOK_THRESHOLDS, type ScrapbookBuffs } from '@grodno/shared';
import type { Db } from '../db/client.js';
import type { CombatFighter } from './arena.js';
import { characterScrapbook, itemTemplates } from '../db/schema.js';

/**
 * Zwraca łączną liczbę itemów w katalogu (REGISTRY). Tylko template-owane
 * itemy — legacy snapshot-only nie liczymy (nie można ich "znaleźć" po nazwie).
 */
export async function getTotalItemCount(db: Db): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(itemTemplates);
  return row?.count ?? 0;
}

/**
 * Liczba znalezionych itemów per gracz.
 */
export async function getFoundCount(db: Db, characterId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(characterScrapbook)
    .where(eq(characterScrapbook.characterId, characterId));
  return row?.count ?? 0;
}

/**
 * Oblicza aktywne buffy scrapbook'a na podstawie % wypełnienia.
 * Każdy próg dodaje osobny bonus (NIE zastępuje poprzedni — kumulatywne).
 */
export function computeScrapbookBuffs(foundCount: number, totalCount: number): ScrapbookBuffs {
  const fillPct = totalCount > 0 ? Math.floor((foundCount / totalCount) * 100) : 0;
  return {
    fillPct,
    foundCount,
    totalCount,
    xpPct: fillPct >= SCRAPBOOK_THRESHOLDS.xp.pct ? SCRAPBOOK_THRESHOLDS.xp.bonus : 0,
    goldPct: fillPct >= SCRAPBOOK_THRESHOLDS.gold.pct ? SCRAPBOOK_THRESHOLDS.gold.bonus : 0,
    damagePct: fillPct >= SCRAPBOOK_THRESHOLDS.damage.pct ? SCRAPBOOK_THRESHOLDS.damage.bonus : 0,
    dropPct: fillPct >= SCRAPBOOK_THRESHOLDS.drop.pct ? SCRAPBOOK_THRESHOLDS.drop.bonus : 0,
  };
}

/**
 * Rejestruje znalezienie itemu w scrapbook'u. Insert ignore przy duplikacie —
 * bez overhead'u jeśli już znaleziony. Call everywhere we grant items.
 *
 * templateId = null (legacy snapshot-only items) → skip cicho. Nie wszystkie
 * itemy w bagu mają template_id (patrz CLAUDE.md gotcha `character_items.template_id`).
 *
 * Accepts both top-level `db` i transaction handle (`tx`) — Pick signature
 * dla kompatybilności z miejscami inserting inside transaction'ów.
 */
export async function registerScrapbookFind(
  db: Pick<Db, 'insert'>,
  characterId: string,
  itemTemplateId: string | null | undefined,
): Promise<void> {
  if (!itemTemplateId) return;
  await db
    .insert(characterScrapbook)
    .values({ characterId, itemTemplateId })
    .onConflictDoNothing();
}

/**
 * Load buffs for character — used by arena.fight + guildRaids.hit.
 * 2 queries, ale każda cheap (count agregat).
 */
export async function loadScrapbookBuffs(
  db: Db,
  characterId: string,
): Promise<ScrapbookBuffs> {
  const [foundRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(characterScrapbook)
    .where(eq(characterScrapbook.characterId, characterId));
  const [totalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(itemTemplates);
  return computeScrapbookBuffs(foundRow?.count ?? 0, totalRow?.count ?? 0);
}

/**
 * Mnoży atk + mag o (1 + damagePct/100). Aplikowane w arena.fight + raid
 * po guild war buffs (altar). Scrapbook damage progresja stackuje z altar'em.
 */
export function applyScrapbookDamageBuff(
  fighter: CombatFighter,
  buffs: ScrapbookBuffs,
): CombatFighter {
  if (buffs.damagePct === 0) return fighter;
  const mult = 1 + buffs.damagePct / 100;
  return {
    ...fighter,
    atk: Math.floor(fighter.atk * mult),
    mag: Math.floor(fighter.mag * mult),
  };
}

/**
 * Gold bonus dla arena/raid rewards. Mnoży wartość o (1 + goldPct/100).
 * Zwraca ceiling'owaną liczbę całkowitą.
 */
export function applyScrapbookGoldBonus(amount: number, buffs: ScrapbookBuffs): number {
  if (buffs.goldPct === 0) return amount;
  return Math.ceil(amount * (1 + buffs.goldPct / 100));
}
