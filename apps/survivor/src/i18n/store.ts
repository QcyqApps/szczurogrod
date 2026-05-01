// Lang store for the survivor app — mirrors apps/web's `useLangStore` shape
// but persisted under a separate localStorage key so each app remembers its
// own preference. Default detection from `navigator.language`.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    { name: 'survivor-lang', version: 1 },
  ),
);
