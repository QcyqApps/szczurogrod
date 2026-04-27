// Kolejka modali odblokowanych osiągnięć. Nie persystowana — jak gracz
// wyjdzie z apki w środku modala, to przepadają (są na serwerze, można je
// zobaczyć w ekranie OSIĄGNIĘCIA). App.tsx subskrybuje head kolejki i
// renderuje modal aż gracz kliknie OK → `shift()`.

import { create } from 'zustand';
import type { AchievementUnlockPayload } from '@grodno/shared';

interface UnlockQueueState {
  queue: AchievementUnlockPayload[];
  push: (unlocks: readonly AchievementUnlockPayload[]) => void;
  shift: () => void;
}

export const useUnlockQueue = create<UnlockQueueState>((set) => ({
  queue: [],
  push: (unlocks) =>
    set((state) => ({ queue: [...state.queue, ...unlocks] })),
  shift: () => set((state) => ({ queue: state.queue.slice(1) })),
}));
