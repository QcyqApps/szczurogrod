// Inicjalizacja Capacitor pluginów — runtime-conditional. Na webie
// `Capacitor.isNativePlatform()` zwraca false i każdy `await` poniżej jest
// no-op (pluginy mają web fallback'i). Na Androidzie/iOS startuje natywny path.

import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { GEM_PRODUCT_IDS } from '@grodno/shared';
import { initBilling } from './billing';

export function initNative(): void {
  if (!Capacitor.isNativePlatform()) return;

  // Status bar — wyłączamy overlay nad WebView, żeby system bar wziął swoją
  // przestrzeń poza WebView'em (content nie chowa się za godziną/ikonami).
  // Dolna nav bar Androida normalnie też nie przykrywa WebView w tym trybie.
  // Dla edge-cases (telefon z gesture nav, notche, etc.) `env(safe-area-inset-*)`
  // w global.css zapewnia drugi layer obrony.
  void StatusBar.setOverlaysWebView({ overlay: false });
  // Style + bg — Light bo status bar pokazujemy na parchmentowym tle gry
  // (cale UI ma ciepłą paletę). Dark style = ciemne ikony/tekst statusu,
  // czytelne na jasnym tle. Bg ustawiamy na parchment żeby zlewało się z appką.
  void StatusBar.setStyle({ style: Style.Dark });
  void StatusBar.setBackgroundColor({ color: '#f3ead9' });

  // Hide splash po pierwszym render'cie (Capacitor pokazuje splash do
  // momentu aż JS odpali). Daje płynne przejście bez „white flash".
  void SplashScreen.hide();

  // Back button — Android hardware back. Bez handler'a domyślnie minimalizuje
  // app. Sensowniej: jeśli historia routera ma cofnij, cofamy; jeśli nie,
  // pytamy czy zamknąć (lub po prostu minimalize).
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      void CapApp.minimizeApp();
    }
  });

  // Google Play Billing — register SKUs early so the catalog is warm by the
  // time the user opens the gem shop. `initBilling` is idempotent and any
  // failures here just leave the shop in unconfigured-mode (the screen
  // shows a "try again" hint instead of the buy buttons).
  initBilling(GEM_PRODUCT_IDS).catch((err) => {
    console.error('[billing] init failed', err);
  });
}
