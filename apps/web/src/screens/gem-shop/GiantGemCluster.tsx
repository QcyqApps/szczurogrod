interface GemPos {
  x: number;
  y: number;
  s: number;
  c: string;
}

const POSITIONS: readonly GemPos[] = [
  { x: 0, y: 0, s: 1.0, c: '#3a8ac8' },
  { x: -0.28, y: 0.18, s: 0.62, c: '#5aa8d0' },
  { x: 0.3, y: 0.22, s: 0.58, c: '#6ac0e8' },
  { x: -0.22, y: -0.26, s: 0.46, c: '#a0d8f0' },
  { x: 0.28, y: -0.22, s: 0.5, c: '#8ac4e0' },
  { x: 0.02, y: -0.35, s: 0.38, c: '#c0e0f5' },
];

export interface GiantGemClusterProps {
  size?: number;
  count?: number;
}

export function GiantGemCluster({ size = 60, count = 3 }: GiantGemClusterProps) {
  const picked = POSITIONS.slice(0, count);
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ overflow: 'visible' }}>
      {picked.map((p, i) => {
        const s = size * p.s * 0.4;
        const cx = p.x * size;
        const cy = p.y * size;
        const w = s;
        const h = s * 1.2;
        return (
          <g key={i} transform={`translate(${cx} ${cy})`}>
            <polygon
              points={`0,${-h * 0.55} ${w * 0.5},${-h * 0.15} ${w * 0.35},${h * 0.55} ${-w * 0.35},${h * 0.55} ${-w * 0.5},${-h * 0.15}`}
              fill={p.c}
              stroke="#2a1810"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <polygon
              points={`0,${-h * 0.55} ${w * 0.2},${-h * 0.2} ${-w * 0.2},${-h * 0.2}`}
              fill="#fff"
              opacity="0.6"
            />
            <polygon
              points={`${w * 0.2},${-h * 0.2} ${w * 0.5},${-h * 0.15} ${w * 0.35},${h * 0.55}`}
              fill="#fff"
              opacity="0.18"
            />
          </g>
        );
      })}
    </svg>
  );
}
