// App-level wrapper: na mobile natywny fullscreen, na desktopie IOSDevice mockup
// + dekoracja (tytuł gry nad + footer pod).
//
// Mobile (<=900px): full viewport (100vw × 100dvh — dvh dla safe area iOS),
// background parchment, position relative żeby modale/toasty z position:absolute
// pozycjonowały się względem okna aplikacji.
//
// Desktop (>900px): IOSDevice 402×874 wyśrodkowany + tytuł "SZCZUROGRÓD"
// jako dekoracyjny frame. Tło parchment+gradient z global.css (@media>901px).

import type { ReactNode } from 'react';
import { Fragment } from 'react';
import { useIsMobile } from '@/api/use-is-mobile';
import { IOSDevice } from './ios-frame';

export interface AppFrameProps {
  children: ReactNode;
}

export function AppFrame({ children }: AppFrameProps) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: '#f3ead9',
          fontFamily: "'Patrick Hand', 'Comic Sans MS', system-ui, sans-serif",
          WebkitFontSmoothing: 'antialiased',
          touchAction: 'manipulation',
        }}
      >
        {children}
      </div>
    );
  }
  return (
    <Fragment>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1 className="dt-title">SZCZUROGRÓD</h1>
        <p className="dt-tagline">Walka, pierogi, szczury. W tej kolejności.</p>
      </div>
      <IOSDevice width={402} height={874}>
        {children}
      </IOSDevice>
      <p className="dt-footer">
        Ramka dla klimatu. Gra — prawdziwa.
      </p>
    </Fragment>
  );
}
