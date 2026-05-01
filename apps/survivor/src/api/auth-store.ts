// Auth tokens for the survivor app. Same shape, same key (`grodno-auth`),
// same cookieStorage adapter co apps/web — login w idle automatycznie loguje
// do Okruchów (i odwrotnie). cookieStorage używa document.cookie który jest
// scoped per host (NIE per port), więc localhost:5173 i localhost:5174
// dzielą session.
//
// One-time cleanup: stary `survivor-auth` localStorage key (per-port) usuwamy
// żeby nie zostawiać dead state'u po migracji.

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { cookieStorage } from './cookie-storage';

if (typeof window !== 'undefined') {
  try { window.localStorage.removeItem('survivor-auth'); } catch { /* ignore */ }
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string | null;
  isGuest: boolean;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  email: string | null;
  isGuest: boolean;
  setTokens: (tokens: AuthTokens) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      email: null,
      isGuest: false,
      setTokens: ({ accessToken, refreshToken, userId, email, isGuest }) =>
        set({ accessToken, refreshToken, userId, email, isGuest }),
      clear: () =>
        set({
          accessToken: null,
          refreshToken: null,
          userId: null,
          email: null,
          isGuest: false,
        }),
    }),
    {
      name: 'grodno-auth',
      version: 2,
      storage: createJSONStorage(() => cookieStorage),
    },
  ),
);
