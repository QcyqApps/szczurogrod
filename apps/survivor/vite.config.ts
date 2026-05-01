import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
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
