// Admin auth token for the /admin CMS. Stored in localStorage so the session
// survives reloads. Completely separate from the player auth-store — an admin
// can be logged in as a regular player at the same time.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdminState {
  token: string | null;
  setToken: (token: string) => void;
  clear: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      clear: () => set({ token: null }),
    }),
    { name: 'grodno-admin', version: 1 },
  ),
);
