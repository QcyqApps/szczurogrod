// Admin token do wywoływania gate'owanych endpointów (admin.reload, admin.*).
// Persystowany w localStorage żeby raz wklejony token przetrwał refresh.
// Nie miesza się z auth-store — admin-token to osobna dimensja (ADMIN_TOKEN
// w env serwera), nie wymaga logowania usera.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminState {
  token: string | null;
  setToken: (t: string | null) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (t) => set({ token: t && t.trim() ? t.trim() : null }),
    }),
    { name: 'grodno-admin-v1' },
  ),
);
