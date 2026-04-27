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
  // `host: true` binds to 0.0.0.0 so the dev server is reachable from other
  // devices on the LAN (e.g. a phone at http://192.168.0.202:5173).
  server: {
    host: true,
    port: 5173,
  },
});
