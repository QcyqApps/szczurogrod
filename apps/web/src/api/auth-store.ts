// Client-side auth token storage. Persisted via cookieStorage adapter
// (cross-port shareable on `localhost`) so single login działa w idle
// i w Okruchach. Server remains authoritative for everything else.

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { cookieStorage } from './cookie-storage';

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
