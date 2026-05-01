// Chunky "?" help button. Ported 1:1 z apps/web/src/components/ui-common/HelpIcon.tsx
// — survivor i idle dzielą estetykę (parchment + Luckiest Guy + thick black border),
// więc help ikona ma czytać się tak samo w obu apps. Klik otwiera centered modal,
// click outside / Escape zamyka.

import { useEffect, useState, type ReactNode } from 'react';

export interface HelpIconProps {
  /** Heading na górze popup'a. */
  title?: string;
  /** Body — JSX dla light formatting (paragrafy, bold). */
  children: ReactNode;
  /** Opcjonalny label obok kółka "?". */
  label?: string;
  /** Diameter kółka. Default 22px. */
  size?: number;
  /** Aria-label buttona. */
  ariaLabel?: string;
}

export function HelpIcon({
  title,
  children,
  label,
  size = 22,
  ariaLabel = 'Pomoc',
}: HelpIconProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: 'var(--ink-mid)',
          fontSize: 13,
          fontFamily: 'inherit',
        }}
      >
        <span
          style={{
            width: size,
            height: size,
            borderRadius: 999,
            background: 'var(--parchment-mid)',
            border: '2.5px solid var(--ink-dark)',
            boxShadow: '1.5px 1.5px 0 var(--ink-dark)',
            fontFamily: 'Luckiest Guy, sans-serif',
            fontSize: Math.round(size * 0.65),
            color: 'var(--ink-dark)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            paddingTop: 2,
          }}
        >
          ?
        </span>
        {label && <span>{label}</span>}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(20, 10, 10, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 300,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="panel"
            style={{
              width: '100%',
              maxWidth: 420,
              maxHeight: '80vh',
              overflowY: 'auto',
              background: '#fff7e0',
              padding: 16,
              position: 'relative',
            }}
          >
            {title && (
              <div
                className="h-display"
                style={{ fontSize: 16, marginBottom: 10, color: 'var(--ink-dark)', paddingRight: 28, letterSpacing: 0.5 }}
              >
                {title}
              </div>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Zamknij"
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'transparent',
                border: 'none',
                fontSize: 20,
                cursor: 'pointer',
                color: 'var(--ink-mid)',
                padding: '2px 8px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
            <div style={{ fontSize: 14, color: 'var(--ink-dark)', lineHeight: 1.5 }}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
