import { useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, TRPCClientError, type TRPCLink } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import { Capacitor } from '@capacitor/core';
import superjson from 'superjson';
import { useAdminStore } from '@/admin/admin-store';
import { useAuthStore } from './auth-store';
import { trpc } from './trpc';
import type { AppRouter } from '@grodno/server';

/**
 * API endpoint base URL.
 *
 *   - Explicit `VITE_API_URL` env wins (for production / custom setups).
 *     **Wymagane przy build'cie mobilnym** — w Capacitorze `window.location.hostname`
 *     to `localhost` (androidScheme: 'https'), więc fallback nie zadziała na
 *     prawdziwym urządzeniu. Build mobilny: `VITE_API_URL=https://api.szczurogrod.pl pnpm mobile:build`.
 *   - W przeglądarce fallback: `{protocol}//{hostname}:4000` — loading z
 *     `http://192.168.0.202:5173` (telefon na LAN) routuje API do
 *     `http://192.168.0.202:4000` automatycznie.
 *   - SSR / non-browser fallback: `http://localhost:4000`.
 */
const API_URL = ((): string => {
  const explicit = import.meta.env.VITE_API_URL as string | undefined;
  if (explicit) return explicit;
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    // Brak VITE_API_URL na natywnym build'cie = bug. Loud warn — devtools w
    // chrome://inspect/#devices pokażą to przy pierwszym render'ze.
    console.error(
      '[trpc] VITE_API_URL not set in native build — API calls will fail. ' +
        'Rebuild with VITE_API_URL=<production-url> pnpm mobile:build',
    );
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }
  return 'http://localhost:4000';
})();

/**
 * Auto-refresh access token on UNAUTHORIZED errors.
 *
 * Access JWT żyje 15 min, refresh token 30 dni. Bez tego linka klient po
 * 15 minutach idle (telefon w tle, focus na inną kartę) dostaje "need to
 * sign in" przy następnym query. Link łapie UNAUTHORIZED, woła auth.refresh
 * przez raw fetch (omijamy trpc client żeby nie recursować po samym sobie),
 * zapisuje nowe tokeny w auth-store i retry'uje original op.
 *
 * Concurrent calls share single `refreshPromise` żeby N równoległych queries
 * nie wystrzeliło N refresh requests przy expired tokenie.
 */
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(apiUrl: string): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${apiUrl}/trpc/auth.refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: { refreshToken } }),
      });
      if (!res.ok) return false;
      const body = (await res.json()) as {
        result?: { data?: { json?: unknown } };
      };
      const data = body.result?.data?.json as
        | {
            accessToken: string;
            refreshToken: string;
            userId: string;
            email: string | null;
            isGuest: boolean;
          }
        | undefined;
      if (!data?.accessToken) return false;
      useAuthStore.getState().setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        userId: data.userId,
        email: data.email,
        isGuest: data.isGuest,
      });
      return true;
    } catch (err) {
      console.error('[trpc] auth.refresh failed', err);
      return false;
    } finally {
      // Reset po krótkiej ciszy żeby następne UNAUTHORIZED (np. po godzinach)
      // mogło się odświeżyć ponownie.
      setTimeout(() => {
        refreshPromise = null;
      }, 100);
    }
  })();
  return refreshPromise;
}

function makeRefreshLink(apiUrl: string): TRPCLink<AppRouter> {
  return () => ({ next, op }) =>
    observable((observer) => {
      let attempted = false;
      const start = () => {
        const sub = next(op).subscribe({
          next: (v) => observer.next(v),
          complete: () => observer.complete(),
          async error(err) {
            const code = (err as TRPCClientError<AppRouter>).data?.code;
            const hasRefresh = Boolean(useAuthStore.getState().refreshToken);
            if (
              !attempted &&
              code === 'UNAUTHORIZED' &&
              hasRefresh &&
              op.path !== 'auth.refresh'
            ) {
              attempted = true;
              const ok = await refreshAccessToken(apiUrl);
              if (ok) {
                start();
                return;
              }
              // Refresh nieudany → wyczyść auth żeby UI przekierował do login.
              useAuthStore.getState().clear();
            }
            observer.error(err as TRPCClientError<AppRouter>);
          },
        });
        cleanups.push(() => sub.unsubscribe());
      };
      const cleanups: Array<() => void> = [];
      start();
      return () => cleanups.forEach((fn) => fn());
    });
}

export function TrpcProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry(failureCount, err) {
              // Don't retry auth failures — let the UI react instead.
              if (err instanceof TRPCClientError && err.data?.code === 'UNAUTHORIZED') {
                return false;
              }
              return failureCount < 2;
            },
            staleTime: 30_000,
          },
        },
      }),
  );

  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [
          makeRefreshLink(API_URL),
          httpBatchLink({
            url: `${API_URL}/trpc`,
            transformer: superjson,
            async headers() {
              const headers: Record<string, string> = {};
              const token = useAuthStore.getState().accessToken;
              if (token) headers.authorization = `Bearer ${token}`;
              const adminToken = useAdminStore.getState().token;
              if (adminToken) headers['x-admin-token'] = adminToken;
              return headers;
            },
          }),
        ],
      }),
    [],
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
