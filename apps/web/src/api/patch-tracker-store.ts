// Zapamiętuje id ostatnio widzianego patcha. Jeśli `patches.list` zwraca
// nowszy entry niż `lastSeenPatchId`, klient pokazuje banner zachęcający
// do hard-refresha. localStorage persist'owany — gracz zamykając grę
// w połowie patcha widzi banner przy ponownym wejściu, dopóki nie kliknie
// „Co nowego" / „Odśwież" (oba wywołują markSeen z najnowszym id).

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface PatchTrackerState {
  lastSeenPatchId: string | null;
  markSeen: (id: string) => void;
}

export const usePatchTrackerStore = create<PatchTrackerState>()(
  persist(
    (set) => ({
      lastSeenPatchId: null,
      markSeen: (id) => set({ lastSeenPatchId: id }),
    }),
    {
      name: 'grodno-patch-tracker-v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
