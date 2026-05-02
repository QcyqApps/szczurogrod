// Single source of truth dla URL'a side-game'u "Okruchy" (apps/survivor).
//
// Prod: served same-origin pod /survivor (ratburg.com/survivor,
// szczurogrod.pl/survivor — reverse proxy mappuje path-prefix do
// apps/survivor/dist). Dev: standalone Vite na :5174 (pnpm dev odpala oba).
// LAN dev (telefon na 192.168.0.x:5173) hit'uje 192.168.0.x:5174.
export function getSurvivorUrl(): string {
  if (typeof window === 'undefined') return '/survivor';
  const { protocol, hostname } = window.location;
  if (hostname === 'localhost' || hostname.startsWith('192.168.')) {
    return `${protocol}//${hostname}:5174`;
  }
  return '/survivor';
}
