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
import { useIsWide } from '@/api/use-is-wide';
import { useT } from '@/i18n';
import { IOSDevice } from './ios-frame';
import {
  DesktopSidePanelLeft,
  DesktopSidePanelRight,
} from './desktop/DesktopSidePanels';

export interface AppFrameProps {
  children: ReactNode;
}

export function AppFrame({ children }: AppFrameProps) {
  const isMobile = useIsMobile();
  const isWide = useIsWide();
  const t = useT();
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
        <h1 className="dt-title">{t('app.title.full')}</h1>
        <p className="dt-tagline">{t('app.tagline')}</p>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 24,
          width: '100%',
          maxWidth: 1280,
          padding: '0 16px',
        }}
      >
        {isWide && <DesktopSidePanelLeft />}
        <IOSDevice width={402} height={874}>
          {children}
        </IOSDevice>
        {isWide && <DesktopSidePanelRight />}
      </div>
      <p className="dt-footer">{t('app.frame.footer')}</p>
      <DesktopLegalFooter />
    </Fragment>
  );
}

// Desktop-only legal links — required for Google Play / consumer-protection
// disclosure when the SPA is reachable from the open web (ratburg.com /
// szczurogrod.pl). Capacitor build (mobile native) skips the entire desktop
// branch above, so this never renders inside the Android app.
function DesktopLegalFooter() {
  const t = useT();
  return (
    <nav
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 14,
        marginTop: -4,
        paddingBottom: 12,
        fontFamily: "'Patrick Hand', 'Comic Sans MS', system-ui, sans-serif",
        fontSize: 13,
      }}
    >
      <FooterLink href="/terms.html" label={t('legal.terms')} />
      <FooterLink href="/privacy.html" label={t('legal.privacy')} />
      <FooterLink href="/refunds.html" label={t('legal.refunds')} />
      <FooterLink href="/pricing.html" label={t('legal.pricing')} />
    </nav>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      style={{
        color: '#e8c870',
        textDecoration: 'none',
        opacity: 0.85,
        textShadow: '1px 1px 0 #1a0e08',
        borderBottom: '1px dashed rgba(232, 200, 112, 0.4)',
        paddingBottom: 1,
      }}
    >
      {label}
    </a>
  );
}
