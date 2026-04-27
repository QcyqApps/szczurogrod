// Pure helpers dla Kowal Zygmunt (enhancement levels itemów). Wspólne dla
// web+server: klient używa do preview + character-sheet display, serwer
// do realnego kalkulowania bonusów w combat/arena. Trzymanie formuły w
// jednym miejscu eliminuje mirror-drift.

export const MAX_ENHANCEMENT_LEVEL = 10;

/**
 * Mnożnik statów dla danego enhancement level.
 * Level 1..5: +5% per level (1.05..1.25)
 * Level 6..10: +10% per level (1.35..1.75)
 * Level 0: 1.0 (no change)
 */
export function computeEnhancementMultiplier(level: number): number {
  if (level <= 0) return 1;
  const clamped = Math.min(level, MAX_ENHANCEMENT_LEVEL);
  if (clamped <= 5) return 1 + clamped * 0.05;
  return 1.25 + (clamped - 5) * 0.1;
}

/**
 * Pojedynczy stat po enhancement. Gwarantuje minimum `+level` punktów ponad
 * bazę (dla niezerowych statów), bo `floor(base * mult)` na małych bazkach
 * (np. atk=2) dawało deltę 0 i UX „upgrade nic nie robi".
 *
 * Dla dużych bazek (legendary, atk=46) multiplier wygrywa nad `base + level`
 * — progression scales with stats, nie z linearem.
 */
export function enhanceStat(base: number, level: number): number {
  const b = Math.max(0, base);
  if (b === 0) return 0;
  const mult = computeEnhancementMultiplier(level);
  const scaled = Math.floor(b * mult);
  const linearFloor = b + Math.max(0, level);
  return Math.max(scaled, linearFloor);
}

/**
 * Aplikuje enhancement do obiektu ze statami. Używane i server-side
 * (loadEquipBonuses, blacksmith preview) i client-side (character sheet
 * modal, inventory tooltips).
 */
export function applyEnhancementToStats(
  baseStats: { atk?: number | null; def?: number | null; mag?: number | null },
  level: number,
): { atk: number; def: number; mag: number } {
  return {
    atk: enhanceStat(baseStats.atk ?? 0, level),
    def: enhanceStat(baseStats.def ?? 0, level),
    mag: enhanceStat(baseStats.mag ?? 0, level),
  };
}
