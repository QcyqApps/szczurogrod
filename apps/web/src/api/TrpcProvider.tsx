import { useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, TRPCClientError } from '@trpc/client';
import { Capacitor } from '@capacitor/core';
import superjson from 'superjson';
import { useAdminStore } from '@/admin/admin-store';
import { useAuthStore } from './auth-store';
import { trpc } from './trpc';

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
