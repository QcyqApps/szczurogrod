// Banner „Pojawiła się aktualizacja" — sticky pod TopBar'em na webie.
// Pokazuje się gdy `patches.list` zwraca nowszy entry niż `lastSeenPatchId`.
// Dwa działania: „Co nowego" (otwiera ScreenPatches), „Odśwież" (hardReload).
// W Capacitorze nie renderowany — App.tsx gateuje przez useIsNative().

import { hardReload } from '@/api/hard-reload';
import { useT } from '@/i18n';

export interface UpdateBannerProps {
  /** Wersja najnowszego patcha — pokazujemy obok tekstu („v0.10.0"). */
  latestVersion: string;
  onShowPatches: () => void;
}

export function UpdateBanner({ latestVersion, onShowPatches }: UpdateBannerProps) {
  const t = useT();
  return (
    <div
      style={{
        background: '#3a7a3a',
        color: '#fff7e0',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: '2px solid #2a1810',
        fontSize: 12,
        fontFamily: 'Luckiest Guy, sans-serif',
        letterSpacing: 0.5,
      }}
    >
      <div style={{ flex: 1, lineHeight: 1.2 }}>
        {t('updateBanner.line').replace('{version}', latestVersion)}
      </div>
      <button
        type="button"
        className="cbtn sm"
        style={{ background: '#2a4a2a', color: '#fff7e0', flexShrink: 0 }}
        onClick={onShowPatches}
      >
        {t('updateBanner.btn.show')}
      </button>
      <button
        type="button"
        className="cbtn sm"
        style={{ background: '#fff7e0', color: '#2a1810', flexShrink: 0 }}
        onClick={() => {
          void hardReload();
        }}
      >
        {t('updateBanner.btn.refresh')}
      </button>
    </div>
  );
}
