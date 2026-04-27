// Osiągnięcia — helpery do bump'owania progresu + detekcji unlock'u.
//
// Dwa tryby progresu:
// - **counter** (bumpAchievement): inkrementuje +delta. Używane dla „zrób N
//   razy" (slayer, quest_50, legendary_collector).
// - **max** (setAchievementMax): ustawia progress = max(current, value). Używane
//   dla „osiągnij wartość X" (level_10, level_15, LVL-tiery). Żeby spadek LVL
//   — czysto teoretyczny, bo LVL nie spada — nie cofał flagi.
//
// Gdy progress ≥ threshold ORAZ unlocked_at jest nullem, helper:
// 1. Ustawia unlocked_at = now
// 2. Dodaje reward_gold + reward_gems do `characters` (jeśli > 0)
// 3. Zwraca `{ unlockedTemplate }` żeby caller mógł np. powiadomić gracza
//
// Wszystkie helpery są fire-and-forget z perspektywy routerów (`.catch` na
// błąd, żeby achievement-fail nie przebijał sukcesu akcji gracza).

import { and, eq, sql } from 'drizzle-orm';
import type { AchievementUnlockPayload } from '@grodno/shared';
import type { Db } from '../db/client.js';
import { characterAchievements, characters } from '../db/schema.js';
import { REGISTRY, type AchievementTemplate } from '../content/registry.js';
import { logAchievementUnlock } from './chronicle.js';

/**
 * Po odblokowaniu achievementa — do kronik jako wpis „Bolek odhaczył: X".
 * Fire-and-forget żeby błąd kroniki nie przebił zwrotu unlocku.
 */
async function chronicleUnlock(
  db: Db,
  characterId: string,
  tpl: AchievementTemplate,
): Promise<void> {
  const [row] = await db
    .select({ name: characters.name })
    .from(characters)
    .where(eq(characters.id, characterId))
    .limit(1);
  if (!row) return;
  await logAchievementUnlock(db, characterId, row.name, tpl.id, tpl.name, tpl.tier);
}

/** Klienckie payload z odblokowanego szablonu. Mapuje do shared schema. */
export function tplToUnlockPayload(tpl: AchievementTemplate): AchievementUnlockPayload {
  return {
    id: tpl.id,
    name: tpl.name,
    icon: tpl.icon,
    tier: tpl.tier,
    rewardGold: tpl.rewardGold,
    rewardGems: tpl.rewardGems,
  };
}

/**
 * Pomocnik dla routerów: bumpuje i jeśli odblokowano, wpycha payload do
 * kolektor-arraya. Błąd bumpa nie przebija akcji głównej — catch + log.
 */
export async function collectBump(
  collector: AchievementUnlockPayload[],
  db: Db,
  characterId: string,
  achievementId: string,
  delta: number = 1,
): Promise<void> {
  try {
    const { unlockedTemplate } = await bumpAchievement(db, characterId, achievementId, delta);
    if (unlockedTemplate) collector.push(tplToUnlockPayload(unlockedTemplate));
  } catch (e) {
    console.error(`[ach] ${achievementId} failed`, e);
  }
}

/** Jak collectBump, ale dla setAchievementMax (value override zamiast delta). */
export async function collectSetMax(
  collector: AchievementUnlockPayload[],
  db: Db,
  characterId: string,
  achievementId: string,
  value: number,
): Promise<void> {
  try {
    const { unlockedTemplate } = await setAchievementMax(db, characterId, achievementId, value);
    if (unlockedTemplate) collector.push(tplToUnlockPayload(unlockedTemplate));
  } catch (e) {
    console.error(`[ach] ${achievementId} failed`, e);
  }
}

/** Jak bumpLevelAchievements, ale zbiera unlocki do kolektora. */
export async function collectLevelBumps(
  collector: AchievementUnlockPayload[],
  db: Db,
  characterId: string,
  newLevel: number,
): Promise<void> {
  for (const id of LEVEL_ACHIEVEMENTS) {
    await collectSetMax(collector, db, characterId, id, newLevel);
  }
}

export interface UnlockResult {
  /** Szablon, jeśli właśnie odblokowany tym bump'em. Null = brak zmiany. */
  unlockedTemplate: AchievementTemplate | null;
}

async function applyRewardIfNeeded(
  db: Db,
  characterId: string,
  tpl: AchievementTemplate,
): Promise<void> {
  if (tpl.rewardGold <= 0 && tpl.rewardGems <= 0) return;
  await db
    .update(characters)
    .set({
      gold: sql`${characters.gold} + ${tpl.rewardGold}`,
      gems: sql`${characters.gems} + ${tpl.rewardGems}`,
      updatedAt: new Date(),
    })
    .where(eq(characters.id, characterId));
}

/**
 * Inkrementuje progress o `delta` (default 1). Jeśli po bumpie progress ≥
 * threshold i unlocked_at nie było ustawione — ustawia timestamp + apply
 * reward.
 */
export async function bumpAchievement(
  db: Db,
  characterId: string,
  achievementId: string,
  delta: number = 1,
): Promise<UnlockResult> {
  const tpl = REGISTRY.achievements.get(achievementId);
  if (!tpl) return { unlockedTemplate: null };

  // Upsert progress += delta. Trzymamy unlocked_at niezmienione na conflict —
  // jeśli już odblokowane, dalsze bumpy nie resetują daty.
  await db
    .insert(characterAchievements)
    .values({
      characterId,
      achievementId,
      progress: delta,
      unlockedAt: null,
    })
    .onConflictDoUpdate({
      target: [characterAchievements.characterId, characterAchievements.achievementId],
      set: {
        progress: sql`${characterAchievements.progress} + ${delta}`,
        updatedAt: new Date(),
      },
    });

  const [row] = await db
    .select()
    .from(characterAchievements)
    .where(
      and(
        eq(characterAchievements.characterId, characterId),
        eq(characterAchievements.achievementId, achievementId),
      ),
    )
    .limit(1);
  if (!row) return { unlockedTemplate: null };

  if (row.unlockedAt === null && row.progress >= tpl.threshold) {
    await db
      .update(characterAchievements)
      .set({ unlockedAt: new Date() })
      .where(
        and(
          eq(characterAchievements.characterId, characterId),
          eq(characterAchievements.achievementId, achievementId),
        ),
      );
    await applyRewardIfNeeded(db, characterId, tpl);
    await chronicleUnlock(db, characterId, tpl).catch((e) => console.error("[ach] chronicleUnlock failed", e));
    return { unlockedTemplate: tpl };
  }
  return { unlockedTemplate: null };
}

/**
 * Ustawia progress = max(current, value). Dla milestone'ów typu „osiągnij LVL
 * N" — bump (incrementing) nie ma sensu, bo LVL jest stanem nie zdarzeniem.
 */
export async function setAchievementMax(
  db: Db,
  characterId: string,
  achievementId: string,
  value: number,
): Promise<UnlockResult> {
  const tpl = REGISTRY.achievements.get(achievementId);
  if (!tpl) return { unlockedTemplate: null };

  await db
    .insert(characterAchievements)
    .values({
      characterId,
      achievementId,
      progress: value,
      unlockedAt: null,
    })
    .onConflictDoUpdate({
      target: [characterAchievements.characterId, characterAchievements.achievementId],
      set: {
        progress: sql`GREATEST(${characterAchievements.progress}, ${value})`,
        updatedAt: new Date(),
      },
    });

  const [row] = await db
    .select()
    .from(characterAchievements)
    .where(
      and(
        eq(characterAchievements.characterId, characterId),
        eq(characterAchievements.achievementId, achievementId),
      ),
    )
    .limit(1);
  if (!row) return { unlockedTemplate: null };

  if (row.unlockedAt === null && row.progress >= tpl.threshold) {
    await db
      .update(characterAchievements)
      .set({ unlockedAt: new Date() })
      .where(
        and(
          eq(characterAchievements.characterId, characterId),
          eq(characterAchievements.achievementId, achievementId),
        ),
      );
    await applyRewardIfNeeded(db, characterId, tpl);
    await chronicleUnlock(db, characterId, tpl).catch((e) => console.error("[ach] chronicleUnlock failed", e));
    return { unlockedTemplate: tpl };
  }
  return { unlockedTemplate: null };
}

/**
 * Bumps reach_level_N achievements w oparciu o aktualny LVL. Używane w
 * level-up call-sites (quests.collect, combat.victory, daily.claim) po
 * zastosowaniu `applyXpGain`. Wywołuje setAchievementMax per milestone.
 */
const LEVEL_ACHIEVEMENTS: readonly string[] = [
  'level_5',
  'level_10',
  'level_15',
  'level_25',
  'level_50',
  'level_75',
  'level_100',
];

export async function bumpLevelAchievements(
  db: Db,
  characterId: string,
  newLevel: number,
): Promise<void> {
  for (const id of LEVEL_ACHIEVEMENTS) {
    await setAchievementMax(db, characterId, id, newLevel).catch((e) =>
      console.error(`[achievements] ${id} failed`, e),
    );
  }
}

/** Pobiera progress wszystkich osiągnięć dla danej postaci. */
export async function listAchievementsForCharacter(db: Db, characterId: string) {
  const rows = await db
    .select()
    .from(characterAchievements)
    .where(eq(characterAchievements.characterId, characterId));
  const byId = new Map(rows.map((r) => [r.achievementId, r]));
  return REGISTRY.achievementsList.map((tpl) => {
    const row = byId.get(tpl.id);
    const progress = Math.min(row?.progress ?? 0, tpl.threshold);
    return {
      id: tpl.id,
      name: tpl.name,
      desc: tpl.desc,
      icon: tpl.icon,
      tier: tpl.tier,
      category: tpl.category,
      threshold: tpl.threshold,
      rewardGold: tpl.rewardGold,
      rewardGems: tpl.rewardGems,
      progress,
      unlockedAt: row?.unlockedAt ? row.unlockedAt.getTime() : null,
    };
  });
}
