// Run-end summary. Pokazuje co serwer zaliczył (final source of truth) i
// ofiaruje powrót do huba. Mutation result żyje w cache tRPC; re-fetch przez
// getHub i fallback na report shape jeśli odpowiedź jeszcze leci.
//
// Layout: kompaktowy landscape (mieści się w 920×460 PhoneFrame bez scrolla).
// Title + flavor → stats grid (4 pillsy w row 1, 2 w row 2) → back button.
// Wcześniej był pionowy column z gap 22 + panel, co przy małej wysokości
// wymuszało scroll. Teraz wszystko widać od razu.

import { trpc } from '@/api/trpc';
import { useT } from '@/i18n';
import type { RunReport } from './Run';

export interface EndProps {
  report: RunReport;
  onBackToHub: () => void;
}

export function End({ report, onBackToHub }: EndProps) {
  const t = useT();
  const hubQuery = trpc.survivor.getHub.useQuery(undefined, {
    refetchOnMount: 'always',
  });

  const minutes = Math.floor(report.durationMs / 60000);
  const seconds = Math.floor((report.durationMs % 60000) / 1000);
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const won = report.bossKilled;

  return (
    <div
      className="end-screen-enter"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: '16px 24px',
        textAlign: 'center',
        boxSizing: 'border-box',
      }}
    >
      <div>
        <h1
          className="h-display"
          style={{
            fontSize: 28,
            margin: 0,
            color: won ? 'var(--ink-dark)' : 'var(--danger)',
            letterSpacing: 1,
          }}
        >
          {won ? t('end.title.won') : t('end.title.lost')}
        </h1>
        <div
          className="flavor"
          style={{ fontSize: 16, color: 'var(--ink-mid)', marginTop: 2 }}
        >
          {won ? t('end.flavor.won') : t('end.flavor.lost')}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(90px, 1fr))',
          gap: 8,
          width: '100%',
          maxWidth: 560,
        }}
      >
        <StatPill label={t('end.row.stage')} value={report.stageId} />
        <StatPill label={t('end.row.kills')} value={report.kills} />
        <StatPill label={t('end.row.time')} value={timeStr} />
        <StatPill
          label={t('end.row.boss')}
          value={won ? t('end.row.boss.yes') : t('end.row.boss.no')}
          accent={won ? 'var(--gold)' : undefined}
        />
        {hubQuery.data && (
          <>
            <StatPill
              label={t('end.row.okruchy')}
              value={hubQuery.data.meta.okruchy}
              accent="var(--okruchy)"
              span={2}
            />
            <StatPill
              label={t('end.row.maxStage')}
              value={hubQuery.data.meta.maxStageUnlocked}
              span={2}
            />
          </>
        )}
      </div>

      <button type="button" className="cbtn" onClick={onBackToHub}>
        {t('end.back')}
      </button>
    </div>
  );
}

function StatPill({
  label,
  value,
  accent,
  span,
}: {
  label: string;
  value: number | string;
  accent?: string;
  span?: number;
}) {
  return (
    <div
      className="panel"
      style={{
        padding: '6px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        gridColumn: span ? `span ${span}` : undefined,
        background: 'var(--parchment-mid)',
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: 'var(--ink-mid)',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span
        className="h-display"
        style={{
          fontSize: 20,
          color: accent ?? 'var(--ink-dark)',
          letterSpacing: 0.5,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}
