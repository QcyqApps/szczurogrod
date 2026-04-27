export type StatBarKind = 'hp' | 'mp' | 'xp' | 'stam';

export interface StatBarProps {
  cur: number;
  max: number;
  kind?: StatBarKind;
  label?: string;
}

export function StatBar({ cur, max, kind = 'hp', label }: StatBarProps) {
  const pct = Math.max(0, Math.min(100, (cur / max) * 100));
  const cls = kind === 'hp' ? '' : kind;
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            marginBottom: 2,
          }}
        >
          <span className="h-title" style={{ fontSize: 12 }}>
            {label}
          </span>
          <span className="mono" style={{ fontSize: 13 }}>
            {cur}/{max}
          </span>
        </div>
      )}
      <div className={`bar ${cls}`.trim()}>
        <div className="fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
