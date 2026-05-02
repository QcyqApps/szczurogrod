// Lista patchy / changelog. Każdy entry: version + title + body (paragrafy)
// + data. Polling z App.tsx invalid'uje `patches.list` co 5 min.
//
// Wiersze są collapsed po default — click expanduje body. Pagination 10/page,
// pokazujemy total + przyciski Prev/Next. Markowanie najnowszego id jako
// „seen" (chowa banner) odpala się przy pierwszym renderze top-pageu.

import { useEffect, useState } from 'react';
import { trpc } from '@/api/trpc';
import { usePatchTrackerStore } from '@/api/patch-tracker-store';
import { hardReload } from '@/api/hard-reload';
import { useIsNative } from '@/api/use-is-native';
import { GameIcon } from '@/components/game-icons';
import { useT } from '@/i18n';
import { useLangStore } from '@/i18n/store';
import type { Patch } from '@grodno/shared';

const PAGE_SIZE = 10;

export interface ScreenPatchesProps {
  onBack: () => void;
}

function formatDate(ms: number, lang: 'pl' | 'en'): string {
  const d = new Date(ms);
  return d.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function pickTitle(p: Patch, lang: 'pl' | 'en'): string {
  return lang === 'en' ? p.titleEn : p.titlePl;
}
function pickBody(p: Patch, lang: 'pl' | 'en'): string {
  return lang === 'en' ? p.bodyEn : p.bodyPl;
}

export function ScreenPatches({ onBack }: ScreenPatchesProps) {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const isNative = useIsNative();
  const markSeen = usePatchTrackerStore((s) => s.markSeen);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const q = trpc.patches.list.useQuery(
    { page, pageSize: PAGE_SIZE },
    { staleTime: 60_000, placeholderData: (prev) => prev },
  );
  const entries = q.data?.entries ?? [];
  const total = q.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const top = entries[0];

  // Otwarcie ekranu na page 0 = potwierdzenie najnowszego patcha. Banner
  // chowa się do następnego id. Na późniejszych page'ach nie markujemy
  // (gracz przegląda historię, nie potwierdza świeżości).
  useEffect(() => {
    if (page === 0 && top) markSeen(top.id);
  }, [page, top, markSeen]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
        <div className="h-display" style={{ fontSize: 22 }}>
          {t('patches.heading')}
        </div>
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

      {q.isLoading && entries.length === 0 && (
        <div className="flavor" style={{ textAlign: 'center', padding: 12, color: '#5a3a2a' }}>
          {t('patches.loading')}
        </div>
      )}

      {!q.isLoading && entries.length === 0 && (
        <div className="flavor" style={{ textAlign: 'center', padding: 12, color: '#5a3a2a' }}>
          {t('patches.empty')}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((p) => {
          const isOpen = expanded.has(p.id);
          return (
            <div
              key={p.id}
              className="panel"
              style={{
                padding: 0,
                background: '#fff7e0',
                borderLeft: '4px solid #5a8ad8',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => toggle(p.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: 10,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
                aria-expanded={isOpen}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: '#5a8ad8',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {isOpen ? '▼' : '▶'} v{p.version}
                </span>
                <span className="h-title" style={{ fontSize: 14, color: '#2a1810', flex: 1, minWidth: 0 }}>
                  {pickTitle(p, lang)}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: '#7a6040',
                    flexShrink: 0,
                  }}
                >
                  {formatDate(p.releasedAt, lang)}
                </span>
              </button>
              {isOpen && (
                <div
                  style={{
                    padding: '0 10px 10px',
                    fontSize: 13,
                    color: '#3a2a1a',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    borderTop: '1px dashed #c8b890',
                    paddingTop: 8,
                  }}
                >
                  {pickBody(p, lang)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 12,
            justifyContent: 'space-between',
          }}
        >
          <button
            type="button"
            className="cbtn ghost sm"
            disabled={page === 0 || q.isFetching}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            {t('patches.btn.prev')}
          </button>
          <div className="mono" style={{ fontSize: 12, color: '#5a3a2a' }}>
            {t('patches.pageOf')
              .replace('{page}', String(page + 1))
              .replace('{total}', String(totalPages))}
          </div>
          <button
            type="button"
            className="cbtn ghost sm"
            disabled={page + 1 >= totalPages || q.isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('patches.btn.next')}
          </button>
        </div>
      )}
    </div>
  );
}
