import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor config dla Szczurogród: Okruchy.
 *
 * Osobny appId (`com.ratburg.survivor`) — drugi listing na Google Play pod
 * tym samym dev account. Backend współdzielony z apps/web (jeden Fastify
 * proces, dwa routery), więc VITE_API_URL ten sam.
 *
 * Workflow przy publish'u (M5+):
 *   1. `pnpm --filter @grodno/survivor add @capacitor/core @capacitor/android @capacitor/cli`
 *   2. `cd apps/survivor && pnpm exec npx cap add android`
 *   3. `VITE_API_URL=https://api.example.com pnpm --filter @grodno/survivor mobile:build`
 *   4. `pnpm --filter @grodno/survivor cap:open:android`
 *
 * UWAGA — appId jest stały po publikacji. Zmiana = nowa aplikacja, nowy
 * listing, gracze tracą postęp w nowej apce.
 */
const config: CapacitorConfig = {
  appId: 'com.ratburg.survivor',
  appName: 'Szczurogród: Okruchy',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'http',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      backgroundColor: '#2a1810',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
