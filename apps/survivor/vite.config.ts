import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  // Sub-path deploy: prod serwuje Okruchy pod /survivor (ratburg.com/survivor,
  // szczurogrod.pl/survivor). `base` przepisuje wszystkie asset URLe w buildzie
  // (`/assets/*` → `/survivor/assets/*`) żeby reverse proxy mógł zmappować
  // path-prefix bez rewrite'owania response body. Capacitor build (mobile,
  // ładuje pliki z file://) wymaga root'a — przepuść `VITE_BUILD_BASE=/` przy
  // mobile:build żeby nadpisać. Dev (port 5174 standalone) używa root'a
  // automatycznie — base działa tylko w build outputzie.
  base: process.env.VITE_BUILD_BASE ?? '/survivor/',
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  // Port 5174 — apps/web ma 5173, więc oba mogą jechać równolegle pod
  // `pnpm dev` bez kolizji.
  server: {
    host: true,
    port: 5174,
  },
});
