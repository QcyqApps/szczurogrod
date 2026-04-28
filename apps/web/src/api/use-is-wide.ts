// Reactive `min-width: 1280px` query — desktop side panels only render when
// the viewport can actually fit them around the 402px phone mockup without
// crowding. Small laptops (901–1279px) keep the bare-phone layout so the
// mockup stays the focal point.

import { useSyncExternalStore } from 'react';

const WIDE_QUERY = '(min-width: 1280px)';

function getMQ(): MediaQueryList | null {
  if (typeof window === 'undefined') return null;
  return window.matchMedia(WIDE_QUERY);
}

export function useIsWide(): boolean {
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
