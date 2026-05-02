// Lista patchy / changelog. Każdy entry: version + title + body (paragrafy)
// + data (relative pl-PL). Polling z App.tsx invalid'uje `patches.list` co
// 5 min, więc otwarcie ekranu po nowym deployu zawsze pokazuje świeże dane.

import { useEffect } from 'react';
import { trpc } from '@/api/trpc';
import { usePatchTrackerStore } from '@/api/patch-tracker-store';
import { hardReload } from '@/api/hard-reload';
import { useIsNative } from '@/api/use-is-native';
import { GameIcon } from '@/components/game-icons';
import { useT } from '@/i18n';

export interface ScreenPatchesProps {
  onBack: () => void;
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function ScreenPatches({ onBack }: ScreenPatchesProps) {
  const t = useT();
  const isNative = useIsNative();
  const markSeen = usePatchTrackerStore((s) => s.markSeen);
  const q = trpc.patches.list.useQuery(undefined, {
    staleTime: 60_000,
  });
  const entries = q.data?.entries ?? [];
  const top = entries[0];

  // Otwarcie ekranu = potwierdzenie. Banner się chowa do następnego patcha.
  useEffect(() => {
    if (top) markSeen(top.id);
  }, [top, markSeen]);

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <button type="button" className="cbtn sm" onClick={onBack}>
          ←
        </button>
        <div className="h-display clean" style={{ fontSize: 18, flex: 1 }}>
          {t('patches.title')}
        </div>
      </div>

      <div
        style={{
          background: 'linear-gradient(180deg, #2a4a3a 0%, #1a2a2a 100%)',
          border: '3px solid #2a1810',
          borderRadius: 14,
          boxShadow: '3px 3px 0 #2a1810',
          padding: 14,
          color: '#fff3e0',
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <GameIcon name="scroll" size={44} />
        </div>
        <div className="h-display" style={{ fontSize: 22 }}>{t('patches.heading')}</div>
        <div className="flavor light" style={{ fontSize: 17, marginTop: 4 }}>
          {t('patches.flavor')}
        </div>
      </div>

      {!isNative && (
        <button
          type="button"
          className="cbtn"
          style={{ width: '100%', marginBottom: 10, background: '#3a7a3a', color: '#fff7e0' }}
          onClick={() => {
            void hardReload();
          }}
        >
          {t('patches.btn.refresh')}
        </button>
      )}

      {q.isLoading && (
        <div className="flavor" style={{ textAlign: 'center', padding: 12, color: '#5a3a2a' }}>
          {t('patches.loading')}
        </div>
      )}

      {!q.isLoading && entries.length === 0 && (
        <div className="flavor" style={{ textAlign: 'center', padding: 12, color: '#5a3a2a' }}>
          {t('patches.empty')}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {entries.map((p) => (
          <div
            key={p.id}
            className="panel"
            style={{
              padding: 12,
              background: '#fff7e0',
              borderLeft: '4px solid #5a8ad8',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                marginBottom: 4,
                flexWrap: 'wrap',
              }}
            >
              <div className="h-title" style={{ fontSize: 14, color: '#2a1810' }}>
                {p.title}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: '#5a8ad8',
                  fontWeight: 700,
                }}
              >
                v{p.version}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  color: '#7a6040',
                  marginLeft: 'auto',
                }}
              >
                {formatDate(p.releasedAt)}
              </div>
            </div>
            <div
              style={{
                fontSize: 13,
                color: '#3a2a1a',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}
            >
              {p.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
