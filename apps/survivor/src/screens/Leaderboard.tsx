// Per-stage leaderboard panel — fastest boss-kill runs. Tabs by stageId.
// Updates on hub focus + after every successful run via tRPC cache
// invalidation in App.tsx.
//
// `LeaderboardPanel` to wariant bez własnego outer-panela / maxWidth — używany
// w `Hub.tsx` jako tab w już otoczonym kontenerze. Stary `Leaderboard` export
// zachowany dla backward compat (zewnętrzne callsite-y poza hub'em).

import { useState } from 'react';
import { STAGE_DEFS } from '@grodno/shared/survivor';
import { trpc } from '@/api/trpc';
import { useT, type DictKey } from '@/i18n';

export function LeaderboardPanel() {
  const t = useT();
  const [stageId, setStageId] = useState(1);
  const q = trpc.survivor.leaderboard.useQuery({ stageId, limit: 10 });

  return (
    <div
      className="panel"
      style={{
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {STAGE_DEFS.map((stage) => (
          <button
            key={stage.id}
            type="button"
            onClick={() => setStageId(stage.id)}
            style={{
              padding: '3px 8px',
              background: stage.id === stageId ? 'var(--ink-dark)' : 'transparent',
              color: stage.id === stageId ? 'var(--parchment-bg)' : 'var(--ink-dark)',
              border: '2px solid var(--ink-dark)',
              borderRadius: 6,
              fontFamily: 'Luckiest Guy, sans-serif',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {t(`stage.${stage.id}.name` as DictKey)}
          </button>
        ))}
      </div>

      {q.isLoading && <div className="flavor" style={{ fontSize: 13 }}>{t('leaderboard.loading')}</div>}
      {q.data && q.data.entries.length === 0 && (
        <div className="flavor" style={{ fontSize: 13, color: 'var(--ink-mid)' }}>
          {t('leaderboard.empty')}
        </div>
      )}
      {q.data && q.data.entries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Header />
          {q.data.entries.map((entry) => (
            <Row key={entry.runId} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Backward-compat: standalone leaderboard z własnym tytułem + szerokością.
 *  Hub używa LeaderboardPanel; ten wariant zachowany na wypadek innych
 *  callsite-ów. */
export function Leaderboard() {
  const t = useT();
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 460,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div className="h-display" style={{ fontSize: 18 }}>
        {t('leaderboard.title')}
      </div>
      <LeaderboardPanel />
    </div>
  );
}

function Header() {
  const t = useT();
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 80px 60px',
        gap: 8,
        padding: '4px 0',
        borderBottom: '1px dashed #c8b890',
        fontSize: 12,
        color: 'var(--ink-warm)',
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}
    >
      <span>{t('leaderboard.col.rank')}</span>
      <span>{t('leaderboard.col.name')}</span>
      <span style={{ textAlign: 'right' }}>{t('leaderboard.col.time')}</span>
      <span style={{ textAlign: 'right' }}>{t('leaderboard.col.kills')}</span>
    </div>
  );
}

function Row({
  entry,
}: {
  entry: {
    rank: number;
    durationMs: number;
    kills: number;
    displayName: string;
  };
}) {
  const sec = (entry.durationMs / 1000).toFixed(1);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr 80px 60px',
        gap: 8,
        padding: '6px 0',
        borderBottom: '1px dashed #c8b890',
        fontSize: 14,
      }}
    >
      <span className="h-display" style={{ color: rankColor(entry.rank) }}>
        {entry.rank}
      </span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {entry.displayName}
      </span>
      <span style={{ textAlign: 'right' }} className="h-display">
        {sec}s
      </span>
      <span style={{ textAlign: 'right', color: 'var(--ink-mid)' }}>{entry.kills}</span>
    </div>
  );
}

function rankColor(rank: number): string {
  if (rank === 1) return '#d4a24c';
  if (rank === 2) return '#a08060';
  if (rank === 3) return '#8a5030';
  return 'var(--ink-dark)';
}
