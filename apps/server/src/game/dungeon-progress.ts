// Unlock logika lochów. Reguły:
// - Loch bez prerequisite → otwarty gdy char.lvl >= dungeon.requiredLvl.
// - Loch z prerequisite → otwarty gdy LVL OK AND prerequisite w cleared set.
// - Loch cleared gdy slug w `character_dungeon_clears`.
//
// `computeDungeonStatus` jest pure (dostaje set cleared slugów + lvl), dzięki
// czemu da się go testować bez DB. Router ładuje set raz, potem iteruje.

import type { DungeonStatus } from '@grodno/shared';
import type { DungeonTemplate } from '../content/registry.js';

export interface DungeonStatusResult {
  status: DungeonStatus;
  /** Human-readable reason gdy status='locked'. Null dla unlocked/cleared. */
  lockReason: string | null;
}

export function computeDungeonStatus(
  dungeon: DungeonTemplate,
  charLvl: number,
  clearedSlugs: ReadonlySet<string>,
): DungeonStatusResult {
  if (clearedSlugs.has(dungeon.slug)) {
    return { status: 'cleared', lockReason: null };
  }
  if (charLvl < dungeon.requiredLvl) {
    return {
      status: 'locked',
      lockReason: `Odblokowane od LVL ${dungeon.requiredLvl}`,
    };
  }
  if (
    dungeon.prerequisiteDungeonSlug !== null &&
    !clearedSlugs.has(dungeon.prerequisiteDungeonSlug)
  ) {
    return {
      status: 'locked',
      lockReason: 'Pokonaj bossa poprzedniego lochu',
    };
  }
  return { status: 'unlocked', lockReason: null };
}

/**
 * Zwraca slugi mobów (regular + bossy) dostępnych dla gracza w oparciu o
 * unlock'i — używane przez tropy, żeby nie rolować mobów z zamkniętych lochów.
 */
export function listUnlockedEnemySlugs(
  dungeons: readonly DungeonTemplate[],
  charLvl: number,
  clearedSlugs: ReadonlySet<string>,
): Set<string> {
  const out = new Set<string>();
  for (const d of dungeons) {
    const { status } = computeDungeonStatus(d, charLvl, clearedSlugs);
    if (status === 'locked') continue;
    for (const m of d.mobSlugs) out.add(m);
    out.add(d.bossEnemySlug);
  }
  return out;
}

// ===========================================================================
// ============ Chain unlock w obrębie pojedynczego lochu =====================
// ===========================================================================
// W lochu moby odblokowują się sekwencyjnie — pokonanie N-tego otwiera N+1-szy.
// Boss wymaga ubicia wszystkich zwykłych mobów. LVL-gate działa niezależnie
// (mob może być chain-unlocked, ale nadal LVL-locked).

export interface MobChainStatus {
  slug: string;
  /** True gdy łańcuch dopuszcza engage (nie mieszać z LVL/cooldown/klucze). */
  unlocked: boolean;
  /** Polska etykieta gdy `unlocked=false`; null gdy otwarte. */
  reason: string | null;
}

/**
 * Liczy chain-unlock dla każdego moba w danym lochu + bossa. Pure — nie dotyka
 * DB, operuje na zbiorze `killedSlugs` (postać ubiła tego moba ≥1 raz wg
 * `character_enemy_kills`). `enemyNames` pozwala wstawić ludzką nazwę
 * poprzedniego moba w tekst uzasadnienia.
 */
export function computeDungeonMobChainStatus(
  dungeon: DungeonTemplate,
  killedSlugs: ReadonlySet<string>,
  enemyNames: ReadonlyMap<string, string>,
): Map<string, MobChainStatus> {
  const out = new Map<string, MobChainStatus>();

  // Regular mobki — sort_order ustalony w DB (REGISTRY hydrate zachowuje porządek).
  for (let i = 0; i < dungeon.mobSlugs.length; i += 1) {
    const slug = dungeon.mobSlugs[i];
    if (i === 0) {
      out.set(slug, { slug, unlocked: true, reason: null });
      continue;
    }
    const prevSlug = dungeon.mobSlugs[i - 1];
    const prevKilled = killedSlugs.has(prevSlug);
    out.set(slug, {
      slug,
      unlocked: prevKilled,
      reason: prevKilled ? null : `Najpierw pokonaj: ${enemyNames.get(prevSlug) ?? prevSlug}`,
    });
  }

  // Boss wymaga ubicia wszystkich regular mobów w lochu.
  const allRegularKilled = dungeon.mobSlugs.every((s) => killedSlugs.has(s));
  out.set(dungeon.bossEnemySlug, {
    slug: dungeon.bossEnemySlug,
    unlocked: allRegularKilled,
    reason: allRegularKilled ? null : 'Pokonaj najpierw wszystkie potwory lochu',
  });

  return out;
}
