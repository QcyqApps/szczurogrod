// Inline picker języka — dwa malutkie buttony obok siebie. Używany na
// splash + login + settings. Wygląd dopasowany do palety gry.

import { useLangStore, type Lang } from './store';

interface LangPickerProps {
  size?: 'sm' | 'md';
  light?: boolean; // ciemne tło → używaj jasnych kolorów
}

const LANGS: ReadonlyArray<{ code: Lang; flag: string; label: string }> = [
  { code: 'en', flag: 'EN', label: 'English' },
  { code: 'pl', flag: 'PL', label: 'Polski' },
];

export function LangPicker({ size = 'sm', light = false }: LangPickerProps) {
  const current = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const padding = size === 'sm' ? '4px 10px' : '6px 14px';
  const fontSize = size === 'sm' ? 12 : 14;
  return (
    <div style={{ display: 'inline-flex', gap: 4 }}>
      {LANGS.map((l) => {
        const active = current === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            style={{
              padding,
              fontSize,
              fontFamily: 'inherit',
              fontWeight: 700,
              letterSpacing: 0.6,
              border: `2px solid ${light ? '#ffc830' : '#2a1810'}`,
              borderRadius: 6,
              background: active
                ? light
                  ? '#ffc830'
                  : '#2a1810'
                : 'transparent',
              color: active
                ? light
                  ? '#2a1810'
                  : '#ffc830'
                : light
                  ? '#ffc830'
                  : '#2a1810',
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
            aria-label={l.label}
            aria-pressed={active}
          >
            {l.flag}
          </button>
        );
      })}
    </div>
  );
}
