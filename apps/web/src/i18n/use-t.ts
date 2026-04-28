// Translation hook. Użycie: `const t = useT(); <span>{t('btn.ok')}</span>`.
//
// Hook re-renderuje komponent przy zmianie języka (Zustand subscription).
// Brakujący klucz → fallback do PL (zawsze obecny) + console.warn'em w dev.

import { useLangStore } from './store';
import { dict, type DictKey } from './dict';

export function useT(): (key: DictKey) => string {
  const lang = useLangStore((s) => s.lang);
  return (key) => {
    const entry = dict[key];
    if (!entry) {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] missing key: ${String(key)}`);
      }
      return String(key);
    }
    return entry[lang] ?? entry.pl;
  };
}

/**
 * Wariant non-hook do użycia w callback'ach / poza React'em (np. w toast
 * messages generowanych w mutation onError). Czyta language ze store snapshotu
 * w momencie wywołania — nie reaguje na późniejszą zmianę języka.
 */
export function tStatic(key: DictKey): string {
  const lang = useLangStore.getState().lang;
  const entry = dict[key];
  return entry?.[lang] ?? entry?.pl ?? String(key);
}
