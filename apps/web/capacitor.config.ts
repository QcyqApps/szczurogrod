import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor config dla mobilnego buildu Szczurogrodu.
 *
 * **Tryb live** (domyślny od 0.10.0): `server.url` wskazuje na produkcyjny
 * web — natywny shell ładuje stronę z sieci, nie z bundle'a `assets/public`.
 * Każdy `pnpm deploy` na webie = instant update w apce, bez nowego AAB do
 * Play Console. Game jest server-authoritative więc i tak wymaga sieci, więc
 * tracimy zero (offline'u nie było).
 *
 * Trade-off: cold start na słabej sieci pokazywałby biały ekran zanim
 * dociągnie HTML/JS. Zabezpieczenie: SplashScreen z `launchAutoHide:true`
 * + 10s failsafe. JS po pierwszym render'cie woła `SplashScreen.hide()`
 * (z fadeOut). Worst case (sieć padła) — splash schodzi sam po 10s i gracz
 * widzi natywny error WebView.
 *
 * UWAGA — appId jest stały po publikacji na Google Play. Zmiana = nowa
 * aplikacja, nowy listing, gracze tracą zakupy. `com.ratburg` zarezerwowane
 * w Play Console — TYLKO ten string przejdzie upload AAB.
 *
 * `androidScheme: 'http'` — historyczne, gdy bundle był ładowany lokalnie
 * (`http://localhost/`). Z `server.url` ignored, ale zostawiamy gdyby ktoś
 * chciał przełączyć na bundle mode (zakomentowanie `server.url`).
 */
const config: CapacitorConfig = {
  appId: 'com.ratburg',
  appName: 'Szczurogród',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'http',
    // SPA host (kontener `grodno-web` w nginx) — TU jest zbudowany web bundle.
    // `tidle.ovh/grodno` to BACKEND API (Fastify), nie ma tam statycznego SPA;
    // wczytanie tego URL w WebView dawało 404 "Route get:/ not found".
    // Bundle deployowany na ratburg.com ma `VITE_API_URL=https://tidle.ovh/grodno`
    // wbakerowane (patrz docs/nginx.conf).
    url: 'https://ratburg.com/',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      // 10s failsafe — JS powinien zawołać `SplashScreen.hide()` znacznie
      // wcześniej (zwykle <2s na WiFi). Jeśli sieć padła i JS nie startuje,
      // splash schodzi sam i player widzi natywny error WebView zamiast
      // zawieszonej pustki.
      launchShowDuration: 10_000,
      launchAutoHide: true,
      backgroundColor: '#2a1a3a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      // Spinner mówi „ładuję" zamiast statycznej grafiki — robi się jasne
      // że to nie freeze. Material progress, kolor brand'owy.
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#ffc830',
    },
  },
};

export default config;
