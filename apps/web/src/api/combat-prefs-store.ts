// Preferencje auto-walki (Symuluj) — persystowane w localStorage żeby
// ustawienia przetrwały między walkami i odświeżeniami strony. Serwer nie
// wie o tym nic; to czysta konfiguracja klienta.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CombatPrefs {
  /** Auto-pij miksturę HP gdy HP spadnie poniżej progu (40%). */
  simAutoHeal: boolean;
  /** Sim wbija MOCNY gdy zdjęty z cooldownu. */
  simUseHeavy: boolean;
  /** Sim rzuca MAGIA gdy MP ≥ 10. */
  simUseMagic: boolean;
  setSimAutoHeal: (v: boolean) => void;
  setSimUseHeavy: (v: boolean) => void;
  setSimUseMagic: (v: boolean) => void;
}

export const useCombatPrefs = create<CombatPrefs>()(
  persist(
    (set) => ({
      simAutoHeal: true,
      simUseHeavy: true,
      simUseMagic: true,
      setSimAutoHeal: (v) => set({ simAutoHeal: v }),
      setSimUseHeavy: (v) => set({ simUseHeavy: v }),
      setSimUseMagic: (v) => set({ simUseMagic: v }),
    }),
    { name: 'grodno-combat-prefs-v1' },
  ),
);
