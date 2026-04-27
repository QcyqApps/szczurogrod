// Runtime media query hook. Zwraca `true` gdy viewport <= 900px (telefon/tablet).
// Używa useSyncExternalStore żeby re-render był synchroniczny z CSS media query
// (bez flicker'a przy resize). Breakpoint 900px wybrany żeby 402px mockup miał
// sensowny margines na mniejszych laptopach (400px mockup + 400px na tło po bokach).

import { useSyncExternalStore } from 'react';

const MOBILE_QUERY = '(max-width: 900px)';

function getMQ(): MediaQueryList | null {
  if (typeof window === 'undefined') return null;
  return window.matchMedia(MOBILE_QUERY);
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = getMQ();
      if (!mq) return () => undefined;
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => getMQ()?.matches ?? false,
    () => false,
  );
}
