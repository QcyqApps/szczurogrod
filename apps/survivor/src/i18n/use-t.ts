// React hook returning a memoized translator. Subscribes to lang changes via
// useLangStore so consuming components re-render on switch.

import { useCallback } from 'react';
import { DICT, type DictKey } from './dict';
import { useLangStore } from './store';

export function useT(): (key: DictKey) => string {
  const lang = useLangStore((s) => s.lang);
  return useCallback((key: DictKey) => DICT[key][lang], [lang]);
}
