import { useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, TRPCClientError, type TRPCLink } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import superjson from 'superjson';
import { useAuthStore } from './auth-store';
import { trpc } from './trpc';
import type { AppRouter } from '@grodno/server';

/**
 * API endpoint base URL. Same fallback shape as apps/web — explicit
 * VITE_API_URL wins (production / Capacitor build), browser fallback uses
 * `{protocol}//{hostname}:4000`, SSR fallback `http://localhost:4000`.
 *
 * The survivor app and Szczurogród app talk to the *same* server process —
 * one Fastify instance hosts both routers. Auth tokens są wspólne (shared
 * `grodno-auth` localStorage), więc logowanie do idle = logowanie do Okruchów.
 */
const API_URL = ((): string => {
  const explicit = import.meta.env.VITE_API_URL as string | undefined;
  if (explicit) return explicit;
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }
  return 'http://localhost:4000';
})();

/**
 * Auto-refresh access token na UNAUTHORIZED. Mirror logiki z apps/web —
 * survivor dzieli ten sam auth-store, więc bez tego linka 15-minutowy
 * accessToken wygasłby tutaj przed idle i 401 wymusiłby clearAuth(), co
 * wylogowałoby gracza także z idle. Refresh ratuje shared session.
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
      const body = (await res.json()) as { result?: { data?: { json?: unknown } } };
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
      setTimeout(() => { refreshPromise = null; }, 100);
    }
  })();
  return refreshPromise;
}

function makeRefreshLink(apiUrl: string): TRPCLink<AppRouter> {
  return () => ({ next, op }) =>
    observable((observer) => {
      let attempted = false;
      const cleanups: Array<() => void> = [];
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
              if (ok) { start(); return; }
              useAuthStore.getState().clear();
            }
            observer.error(err as TRPCClientError<AppRouter>);
          },
        });
        cleanups.push(() => sub.unsubscribe());
      };
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
