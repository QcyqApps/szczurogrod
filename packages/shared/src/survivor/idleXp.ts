// Cross-game XP integration: Okruchy → Idle (Szczurogród).
//
// Każdy run w Okruchach napełnia pasek `idle_xp_progress` (1 okruch = 1 punkt
// progresu). Po przekroczeniu progu (IDLE_XP_BAR_THRESHOLD) pasek konwertuje
// się na pending grant z konkretnym XP amount obliczonym z formuły
// `survivorXpPackageAmount(idleLvl)`. Gracz claimuje pending grants po
// stronie idle game'a — `survivor.claimIdleXp` aplikuje sumaryczny XP do
// characters via applyXpGain (cascades level-ups).
//
// Design rationale:
// - Coupling progress with okruchy znaczy że tuning przyrostu paska jest
//   wbudowany w istniejący payout balance (kills × 2 × stageMult). Nie
//   trzeba osobnego systemu balansu.
// - XP amount scaling-by-level: package zawsze daje znaczący ułamek bieżącej
//   xpToNext gracza, więc na L1 pakiet to ~30 XP (50% level), a na L30 to
//   ~5600 XP (4% level). Nie psuje balansu idle'a, ale daje konkretny
//   feedback na każdym levelu.
// - Snapshot przy generowaniu (a nie przy claim'ie): jeśli gracz urośnie
//   zanim claimnie, paczka NIE się skaluje wzwyż. Sprawiedliwie dla obu
//   stron — gracz nie może "farmować na niskim potem claimować na wysokim".

/** Próg paska — ile punktów progresu (= ile okruchy z runów) wypełnia jeden
 * pakiet XP. 200 to ~1 stage 1 boss-clear lub ~0.3 stage 3 clear, więc
 * gracz dostaje pakiet co 1-3 runy (skaluje się z stagem). */
export const IDLE_XP_BAR_THRESHOLD = 200;

/** Floor XP amount — nawet na L1 pakiet daje co najmniej tyle. Zapobiega
 * mikroskopijnym rewardom na niskim levelu (gdzie xpToNext jest tiny). */
const IDLE_XP_PACKAGE_FLOOR = 30;

/** Procent xpToNext(currentLvl) zamieniany w jeden pakiet. 4% = ~25 paczek
 * potrzeba na cały level. Z threshold'em 200 i typowym ~150 okruchy/run:
 * gracz na poziomie 5 dostanie ~1 paczkę co run, każda warta ~75 XP =
 * 5% level / paczka. Na L30: ~4 paczki na level, każda ~5600 XP. */
const IDLE_XP_PACKAGE_FRACTION = 0.04;

/**
 * XP package amount jaki dostanie gracz claimujący jedną paczkę. Skaluje
 * się względem aktualnego progu xpToNext gracza, z floor'em żeby low-levels
 * też dostawali coś sensownego.
 *
 * @param idleLvl — bieżący level character'a w idle (NIE survivor okruchy stage)
 * @param xpToNext — wartość zwracana przez `xpToNext(idleLvl)` z game/leveling.ts
 *   (przekazywane jako parametr żeby nie duplikować formuły progresji w shared'zie)
 */
export function survivorXpPackageAmount(xpToNextValue: number): number {
  return Math.max(
    IDLE_XP_PACKAGE_FLOOR,
    Math.floor(xpToNextValue * IDLE_XP_PACKAGE_FRACTION),
  );
}
