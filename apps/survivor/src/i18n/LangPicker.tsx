// Two-button PL/EN toggle. Compact — fits in any corner. Mirrors the
// apps/web pattern (also two buttons, same visual weight).

import { useLangStore, type Lang } from './store';

export function LangPicker() {
  const current = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  return (
    <div style={{ display: 'inline-flex', gap: 4 }}>
      <Btn lang="pl" current={current} onClick={() => setLang('pl')}>PL</Btn>
      <Btn lang="en" current={current} onClick={() => setLang('en')}>EN</Btn>
    </div>
  );
}

function Btn({
  lang,
  current,
  onClick,
  children,
}: {
  lang: Lang;
  current: Lang;
  onClick: () => void;
  children: string;
}) {
  const active = lang === current;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 10px',
        background: active ? 'var(--ink-dark)' : 'transparent',
        color: active ? 'var(--parchment-bg)' : 'var(--ink-dark)',
        border: '2px solid var(--ink-dark)',
        borderRadius: 6,
        fontFamily: 'Luckiest Guy, sans-serif',
        fontSize: 13,
        letterSpacing: 1,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
