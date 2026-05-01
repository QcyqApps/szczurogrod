// Cookie-backed storage adapter for zustand `persist`. Pourquoi: localStorage
// is scoped per origin (scheme + host + PORT). W dev środowisku idle
// (localhost:5173) i Okruchy (localhost:5174) to różne origins → separate
// localStorage. Cookies natomiast są scoped per host (without port), więc
// `document.cookie` na `localhost` jest współdzielone przez oba dev serwery.
// To pozwala na shared session: login w idle → automatycznie zalogowany
// w Okruchach (i odwrotnie).
//
// Production (różne subdomeny): jeśli prod kiedyś wyląduje na `app.ratburg.com`
// + `okruchy.ratburg.com`, trzeba dodać Domain=`.ratburg.com` żeby cookie
// się dzielił. Hosting na single-domain (path-based routing) lub same hostname
// nie wymaga Domain attribute.
//
// Migration from localStorage: jeśli cookie pusty a localStorage ma starą
// wartość pod tym samym kluczem, przepisujemy do cookie i czyścimy
// localStorage. Idempotentne.
//
// (Plik zduplikowany 1:1 w apps/web/src/api/cookie-storage.ts — oba apps
// używają tego samego shape adaptera, ale są niezależnymi paczkami i nie
// dzielą browser-only kodu przez packages/shared (tam runtime Zod + types).)

const COOKIE_PATH = '/';
const COOKIE_MAX_AGE_DAYS = 30;

function isSecureOrigin(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === 'https:';
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const target = `${name}=`;
  const parts = document.cookie ? document.cookie.split(/; ?/) : [];
  for (const part of parts) {
    if (part.startsWith(target)) {
      try {
        return decodeURIComponent(part.slice(target.length));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `path=${COOKIE_PATH}`,
    `max-age=${maxAge}`,
    'samesite=lax',
  ];
  if (isSecureOrigin()) parts.push('secure');
  document.cookie = parts.join('; ');
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=${COOKIE_PATH}; max-age=0; samesite=lax`;
}

/** Storage adapter w shape oczekiwanym przez zustand `persist({ storage })`.
 * Synchroniczne API (zustand obsługuje async też, ale cookie czyta się od ręki). */
export const cookieStorage = {
  getItem(name: string): string | null {
    const fromCookie = readCookie(name);
    if (fromCookie !== null) return fromCookie;
    // Migration: localStorage → cookie. Jeśli mamy starą wartość pod tym
    // samym kluczem, przepisujemy do cookie i czyścimy localStorage.
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const fromLs = window.localStorage.getItem(name);
        if (fromLs !== null) {
          writeCookie(name, fromLs);
          window.localStorage.removeItem(name);
          return fromLs;
        }
      } catch {
        /* ignore */
      }
    }
    return null;
  },
  setItem(name: string, value: string): void {
    writeCookie(name, value);
  },
  removeItem(name: string): void {
    deleteCookie(name);
  },
};
