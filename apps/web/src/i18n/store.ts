import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Język UI gry. PL = polski (oryginalny), EN = angielski (domyślny dla
 * nowych instalacji).
 *
 * Wybór persystowany w localStorage — zostaje między sesjami i resetuje się
 * tylko przy wyczyszczeniu pamięci przeglądarki (Capacitor: clear app data).
 */
export type Lang = 'en' | 'pl';

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

function detectInitialLang(): Lang {
  if (typeof navigator === 'undefined') return 'en';
  const sys = navigator.language?.toLowerCase() ?? '';
  if (sys.startsWith('pl')) return 'pl';
  return 'en';
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: detectInitialLang(),
      setLang: (lang) => set({ lang }),
    }),
    { name: 'ratburg-lang', version: 1 },
  ),
);
