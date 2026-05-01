// Landscape phone-mockup frame for the survivor app on desktop. Mirrors the
// idea of `IOSDevice` from apps/web, but rotated to landscape — fits the
// horizontal world (800x450 game area) plus HUD chrome above + below.
//
// On mobile (≤900px) the frame collapses to full viewport — no point boxing
// a phone inside a phone.
//
// Visual: rounded black bezel, grey "screen" inset, a small pill on the left
// edge representing the side notch (iPhone in landscape). Status bar +
// home indicator removed to avoid stealing pixels from the game.

import type { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

const FRAME_WIDTH = 920;
const FRAME_HEIGHT = 460;
const BEZEL = 14;

export function PhoneFrame({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <div
        className="parchment-surface"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '100dvh',
          overflow: 'auto',
        }}
      >
        {children}
      </div>
    );
  }
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: 24,
        // Tawerniany ciemny radial: ciepłe firelight glow w centrum,
        // przygaszone brzegi. Daje "siedzę przy stole z latarnią" vibe
        // zamiast pustego białego tła. Tytuł + flavor czyta się złotym
        // kolorem przeciw ciemnemu — wysoki kontrast.
        background:
          'radial-gradient(ellipse at center, #5a3a2a 0%, #3a2418 45%, #1a0e08 100%)',
      }}
    >
      <h1
        style={{
          fontFamily: 'Luckiest Guy, sans-serif',
          fontSize: 36,
          letterSpacing: 2,
          color: '#ffd76a',
          textShadow: '3px 3px 0 #1a0e08, 0 0 24px rgba(255, 215, 106, 0.2)',
          margin: 0,
        }}
      >
        SZCZUROGRÓD: OKRUCHY
      </h1>
      <div
        style={{
          fontFamily: 'Caveat, cursive',
          fontSize: 18,
          color: '#e8d8b0',
          marginBottom: 4,
          textShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }}
      >
        Idle RPG ma swoje strzelanie. Stań na bramie.
      </div>

      <div
        style={{
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          borderRadius: 56,
          background: '#1a0e08',
          padding: BEZEL,
          boxShadow:
            '0 30px 80px rgba(0, 0, 0, 0.55), 0 0 0 1.5px rgba(0, 0, 0, 0.4), 0 0 60px rgba(255, 215, 106, 0.06), inset 0 0 0 2px rgba(255, 255, 255, 0.08)',
          position: 'relative',
        }}
      >
        {/* Side pill / camera (faux iPhone landscape) */}
        <div
          style={{
            position: 'absolute',
            left: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 6,
            height: 80,
            borderRadius: 4,
            background: '#0a0604',
          }}
        />
        <div
          className="parchment-surface"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 44,
            overflow: 'hidden auto',
            position: 'relative',
          }}
        >
          {children}
        </div>
      </div>

      <div
        style={{
          fontFamily: 'Caveat, cursive',
          fontSize: 14,
          color: '#a08868',
          opacity: 0.85,
          textShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }}
      >
        Wersja webowa — po cichu w przeglądarce. Pełna apka czeka na Google Play.
      </div>
    </div>
  );
}
