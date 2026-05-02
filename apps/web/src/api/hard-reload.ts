// Hard refresh dla web — mockuje Ctrl+F5. Service worker nie ma w grze
// (Vite SPA bez PWA), ale na wypadek przyszłych dodatków wyrejestrowujemy
// sw + czyścimy Cache Storage. Potem reload z timestampem w query, żeby
// CDN/przeglądarka pobrały świeży bundle (`index-XXXX.js` ma już hash, ale
// `index.html` nie — to ono linkuje do nowego bundle'a).
//
// Capacitor: na natywnej powłoce reload nie ma sensu (bundle leci z assets/).
// Funkcja wciąż działa, ale wywołujemy ją tylko z web (przez `useIsNative()`
// gate w bannerze).

export async function hardReload(): Promise<void> {
  try {
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (err) {
    console.warn('[hardReload] cache clear failed', err);
  }
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch (err) {
    console.warn('[hardReload] sw unregister failed', err);
  }
  const url = new URL(window.location.href);
  // Cache-bust HTML (i przy okazji bundle, bo nowy index.html linkuje do
  // nowych asset hashy). `_v` jest czysto cosmetic — przeglądarka ignoruje
  // go w request, ale nie bierze z cache jeśli URL się różni.
  url.searchParams.set('_v', String(Date.now()));
  window.location.href = url.toString();
}
