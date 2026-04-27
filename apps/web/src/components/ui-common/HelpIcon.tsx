import { useEffect, useState, type ReactNode } from 'react';

export interface HelpIconProps {
  /** Short heading shown at the top of the popup. */
  title?: string;
  /** Main body — accepts JSX for light formatting (paragraphs, bold, etc.). */
  children: ReactNode;
  /** Optional label text displayed next to the "?" circle. */
  label?: string;
  /** Diameter of the "?" circle. Defaults to 22px. */
  size?: number;
  /** Accessible label for the button. */
  ariaLabel?: string;
}

/**
 * Chunky "?" help button. Tap to open a centered modal with the passed body.
 * Matches the game's other ChunkyButton-styled UI elements (thick black border,
 * drop shadow, Luckiest Guy for the glyph). Click outside or Escape closes.
 */
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
        className="no-select"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: '#5a3a2a',
          fontSize: 13,
          fontFamily: 'inherit',
        }}
      >
        <span
          style={{
            width: size,
            height: size,
            borderRadius: 999,
            background: '#e8dcb9',
            border: '2.5px solid #2a1810',
            boxShadow: '1.5px 1.5px 0 #2a1810',
            fontFamily: 'Luckiest Guy, sans-serif',
            fontSize: Math.round(size * 0.65),
            color: '#2a1810',
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
            className="panel pop-in"
            style={{
              width: '100%',
              maxWidth: 360,
              background: '#fff7e0',
              padding: 16,
              position: 'relative',
            }}
          >
            {title && (
              <div
                className="h-title"
                style={{ fontSize: 16, marginBottom: 8, color: '#2a1810', paddingRight: 28 }}
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
                color: '#5a3a2a',
                padding: '2px 8px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
            <div style={{ fontSize: 14, color: '#2a1810', lineHeight: 1.5 }}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
