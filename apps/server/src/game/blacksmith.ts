// Kowal Zygmunt — Priorytet 6 z docs/features-vs-sf.md.
//
// Mechaniki:
// - **Dismantle** — sprzedaż itemu za "złom" (resource). Rarity → scrap amount.
// - **Upgrade** — enhancement level +1..+10. Każdy level daje +5%/+10% stats.
//   Fail rate na +7+ (item nie psuje się — po prostu nie upgrade'uje).
//   Gem sink: 5g gwarantuje success (bypass fail).
//
// Formuły pure enhancement (applyEnhancementToStats, computeEnhancementMultiplier,
// MAX_ENHANCEMENT_LEVEL) żyją w `@grodno/shared/enhancement`, bo klient używa ich
// do preview i character-sheet. Reszta (cost/success/dismantle + RNG roll) jest
// server-only.

import type { Rarity } from '@grodno/shared';
import { MAX_ENHANCEMENT_LEVEL } from '@grodno/shared';

export {
  MAX_ENHANCEMENT_LEVEL,
  applyEnhancementToStats,
  computeEnhancementMultiplier,
  enhanceStat,
} from '@grodno/shared';

/** Od którego levelu pojawia się szansa na failure. 1..6 zawsze succeed. */
export const ENHANCEMENT_SAFE_UP_TO = 6;
export const GEM_GUARANTEE_COST = 5;

/**
 * Dismantle reward — ile złomu dostaje gracz za rozprucie itemu.
 * Rarity: common 1, rare 3, epic 8, legendary 20.
 */
export function computeDismantleScrap(rarity: Rarity): number {
  switch (rarity) {
    case 'common':
      return 1;
    case 'rare':
      return 3;
    case 'epic':
      return 8;
    case 'legendary':
      return 20;
  }
}

/**
 * Koszt upgrade'u z poziomu `currentLevel` na `currentLevel + 1`.
 * - gold: 500 * (lvl+1)² — kwadratowa skala (trainer pattern). Level 0→1 = 500g,
 *   4→5 = 12500g, 9→10 = 50000g.
 * - scrap: 5 * (lvl+1) — liniowa skala. Level 0→1 = 5 scrap, 9→10 = 50.
 *
 * Zwraca null gdy na MAX_ENHANCEMENT_LEVEL (nie można dalej).
 */
export function computeUpgradeCost(
  currentLevel: number,
): { gold: number; scrap: number } | null {
  if (currentLevel >= MAX_ENHANCEMENT_LEVEL) return null;
  const nextLevel = currentLevel + 1;
  return {
    gold: 500 * nextLevel * nextLevel,
    scrap: 5 * nextLevel,
  };
}

/**
 * Success rate dla upgrade'u z `currentLevel` na `currentLevel + 1`.
 * Zwraca 1.0 dla bezpiecznych poziomów (<=6), potem maleje:
 * - +7: 90% (post-audyt 2026-04: było 80%)
 * - +8: 80%
 * - +9: 70%
 * - +10: 60%
 *
 * Smoother curve niż v1 — wcześniej skok 1.0 → 0.8 → 0.5 czuł się dramatyczny.
 * Expected attempts dla +10 z +0: ~10.5 (było ~13). Gem guarantee 5💎ich nadal
 * sensowny dla najtrudniejszego (+10) gracze, ale +7..+9 grindzie się znośnie.
 */
export function computeUpgradeSuccessRate(currentLevel: number): number {
  if (currentLevel < ENHANCEMENT_SAFE_UP_TO) return 1.0;
  // Level 6 → 7: 0.9, 7 → 8: 0.8, 8 → 9: 0.7, 9 → 10: 0.6
  return Math.max(0.6, 1.0 - (currentLevel - 5) * 0.1);
}

/**
 * Roll success. Zwraca true jeśli upgrade się uda. Jeśli `useGemGuarantee`
 * to zawsze true — gem sink gwarantuje.
 */
export function rollUpgradeSuccess(
  currentLevel: number,
  useGemGuarantee: boolean,
): boolean {
  if (useGemGuarantee) return true;
  return Math.random() < computeUpgradeSuccessRate(currentLevel);
}

