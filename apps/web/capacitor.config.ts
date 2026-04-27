import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor config dla mobilnego buildu Szczurogrodu.
 *
 * `webDir` wskazuje na output `vite build`. Workflow:
 *   1. `VITE_API_URL=https://api.example.com pnpm --filter @grodno/web build`
 *   2. `pnpm --filter @grodno/web cap:sync`
 *   3. `pnpm --filter @grodno/web cap:open:android` → otwiera Android Studio
 *
 * UWAGA — appId jest stały po publikacji na Google Play. Zmiana = nowa
 * aplikacja, nowy listing, gracze tracą zakupy. Zmień TERAZ jeśli
 * `pl.szczurogrod.app` nie pasuje (zwykle: kup domenę, użyj jej w reverse).
 *
 * `androidScheme: 'http'` — WebView ładuje aplikację z `http://localhost/`.
 * Powód: API (dev `http://LAN_IP:4000`, prod `https://api.szczurogrod.pl`)
 * — gdyby strona była po HTTPS to dev path łapie Mixed Content blocking.
 * HTTP→HTTPS upgrade działa, więc prod też OK.
 *
 * Trade-off: tracimy „secure context" status w WebView (crypto.subtle,
 * service workers, geolocation). Gra nie używa żadnego z tych — wszystkie
 * RNG/auth/economy są server-side, persistence przez localStorage który
 * działa bez secure context.
 */
const config: CapacitorConfig = {
  appId: 'pl.szczurogrod.app',
  appName: 'Szczurogród',
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
      backgroundColor: '#2a1a3a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
