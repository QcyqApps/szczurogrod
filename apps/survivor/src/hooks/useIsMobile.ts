// Same media-query hook as apps/web's `useIsMobile`. Breakpoint at 1000px
// because the landscape phone frame is wider (920px + chrome) than the
// portrait one — at <1000px we drop to fullscreen mobile layout.

import { useSyncExternalStore } from 'react';

const MOBILE_QUERY = '(max-width: 1000px)';

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
