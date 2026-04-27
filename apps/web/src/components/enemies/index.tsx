// Canned enemy portraits — hand-drawn, independent of the parametric monster system.

export interface EnemyPortraitProps {
  size?: number;
}

export function EnemyGoblin({ size = 140 }: EnemyPortraitProps) {
  return (
    <svg viewBox="0 0 140 140" width={size} height={size} style={{ display: 'block' }}>
      <ellipse cx="70" cy="95" rx="38" ry="32" fill="#6a9a3a" stroke="#2a1810" strokeWidth="3" />
      <ellipse cx="70" cy="100" rx="22" ry="18" fill="#8ab05a" stroke="#2a1810" strokeWidth="2" />
      <ellipse cx="70" cy="56" rx="32" ry="30" fill="#7aaa3a" stroke="#2a1810" strokeWidth="3" />
      <path d="M40 48 L22 36 L38 56 Z" fill="#6a9a3a" stroke="#2a1810" strokeWidth="3" />
      <path d="M100 48 L118 36 L102 56 Z" fill="#6a9a3a" stroke="#2a1810" strokeWidth="3" />
      <ellipse cx="58" cy="54" rx="7" ry="8" fill="#fff" stroke="#2a1810" strokeWidth="2.5" />
      <ellipse cx="82" cy="54" rx="7" ry="8" fill="#fff" stroke="#2a1810" strokeWidth="2.5" />
      <circle cx="58" cy="56" r="3" fill="#2a1810" />
      <circle cx="82" cy="56" r="3" fill="#2a1810" />
      <path d="M48 44 L66 50" stroke="#2a1810" strokeWidth="3" strokeLinecap="round" />
      <path d="M92 44 L74 50" stroke="#2a1810" strokeWidth="3" strokeLinecap="round" />
      <path d="M68 62 Q70 68 72 62" fill="#5a7a2a" stroke="#2a1810" strokeWidth="2" />
      <path
        d="M52 72 Q70 86 88 72 L84 78 L80 72 L76 78 L72 72 L68 78 L64 72 L60 78 Z"
        fill="#2a1810"
        stroke="#2a1810"
        strokeWidth="2"
      />
      <path d="M56 74 L60 68 L62 74" fill="#fff" stroke="#2a1810" strokeWidth="1.5" />
      <path d="M78 74 L80 68 L84 74" fill="#fff" stroke="#2a1810" strokeWidth="1.5" />
      <rect
        x="100"
        y="70"
        width="8"
        height="40"
        fill="#8a5a2a"
        stroke="#2a1810"
        strokeWidth="2.5"
        rx="2"
      />
      <ellipse cx="104" cy="68" rx="12" ry="10" fill="#8a5a2a" stroke="#2a1810" strokeWidth="2.5" />
      <circle cx="100" cy="66" r="2" fill="#2a1810" />
      <circle cx="108" cy="70" r="2" fill="#2a1810" />
    </svg>
  );
}

export function EnemySkeleton({ size = 140 }: EnemyPortraitProps) {
  return (
    <svg viewBox="0 0 140 140" width={size} height={size} style={{ display: 'block' }}>
      <path
        d="M46 80 Q46 120 70 124 Q94 120 94 80 Z"
        fill="#ede4c8"
        stroke="#2a1810"
        strokeWidth="3"
      />
      <path d="M54 90 Q70 95 86 90" stroke="#2a1810" strokeWidth="2" fill="none" />
      <path d="M54 100 Q70 105 86 100" stroke="#2a1810" strokeWidth="2" fill="none" />
      <path d="M54 110 Q70 115 86 110" stroke="#2a1810" strokeWidth="2" fill="none" />
      <rect x="68" y="80" width="4" height="44" fill="#c8b890" stroke="#2a1810" strokeWidth="2" />
      <ellipse cx="70" cy="50" rx="28" ry="30" fill="#ede4c8" stroke="#2a1810" strokeWidth="3" />
      <path
        d="M48 62 Q70 84 92 62 L88 72 Q70 78 52 72 Z"
        fill="#d8cfa8"
        stroke="#2a1810"
        strokeWidth="3"
      />
      <ellipse cx="58" cy="50" rx="7" ry="9" fill="#1a0a0a" stroke="#2a1810" strokeWidth="2" />
      <ellipse cx="82" cy="50" rx="7" ry="9" fill="#1a0a0a" stroke="#2a1810" strokeWidth="2" />
      <circle cx="58" cy="52" r="2.5" fill="#ff4a4a" />
      <circle cx="82" cy="52" r="2.5" fill="#ff4a4a" />
      <path d="M68 58 L70 66 L72 58 Z" fill="#2a1810" />
      <path
        d="M54 68 L56 74 L58 68 L60 74 L62 68 L64 74 L66 68 L68 74 L70 68 L72 74 L74 68 L76 74 L78 68 L80 74 L82 68 L84 74 L86 68"
        stroke="#2a1810"
        strokeWidth="1.5"
        fill="#fff"
      />
      <rect x="100" y="50" width="4" height="60" fill="#aaa" stroke="#2a1810" strokeWidth="2" />
      <rect x="92" y="46" width="20" height="5" fill="#8a5a2a" stroke="#2a1810" strokeWidth="2" />
    </svg>
  );
}

export function EnemyDragon({ size = 140 }: EnemyPortraitProps) {
  return (
    <svg viewBox="0 0 140 140" width={size} height={size} style={{ display: 'block' }}>
      <path
        d="M16 80 Q4 40 30 36 L40 70 Z"
        fill="#6a1a1a"
        stroke="#2a1810"
        strokeWidth="3"
      />
      <path
        d="M124 80 Q136 40 110 36 L100 70 Z"
        fill="#6a1a1a"
        stroke="#2a1810"
        strokeWidth="3"
      />
      <ellipse cx="70" cy="90" rx="34" ry="30" fill="#c83232" stroke="#2a1810" strokeWidth="3" />
      <path
        d="M56 90 Q70 102 84 90 M54 80 Q70 92 86 80"
        stroke="#f0a830"
        strokeWidth="2"
        fill="none"
      />
      <ellipse cx="70" cy="48" rx="30" ry="26" fill="#c83232" stroke="#2a1810" strokeWidth="3" />
      <path
        d="M50 52 Q40 60 52 68 Q60 66 64 58 Z"
        fill="#a02020"
        stroke="#2a1810"
        strokeWidth="3"
      />
      <path d="M50 24 L42 6 L58 22 Z" fill="#3a2a2a" stroke="#2a1810" strokeWidth="2.5" />
      <path d="M90 24 L98 6 L82 22 Z" fill="#3a2a2a" stroke="#2a1810" strokeWidth="2.5" />
      <path d="M70 20 L65 30 L75 30 Z" fill="#3a2a2a" stroke="#2a1810" strokeWidth="2" />
      <ellipse cx="60" cy="44" rx="6" ry="7" fill="#fff3c0" stroke="#2a1810" strokeWidth="2" />
      <ellipse cx="80" cy="44" rx="6" ry="7" fill="#fff3c0" stroke="#2a1810" strokeWidth="2" />
      <ellipse cx="60" cy="45" rx="2" ry="4" fill="#2a1810" />
      <ellipse cx="80" cy="45" rx="2" ry="4" fill="#2a1810" />
      <circle cx="46" cy="58" r="1.5" fill="#2a1810" />
      <circle cx="48" cy="62" r="1.5" fill="#2a1810" />
      <path
        d="M36 58 Q20 54 24 48 Q28 50 30 46 Q34 50 36 58 Z"
        fill="#ffaa20"
        stroke="#2a1810"
        strokeWidth="2"
      />
      <path
        d="M30 56 Q18 58 18 62 Q22 60 26 62"
        stroke="#e06020"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

export type EnemySlug = 'gob' | 'skel' | 'drag';

export interface EnemyBySlugProps {
  slug: EnemySlug | string;
  size?: number;
}

export function EnemyBySlug({ slug, size }: EnemyBySlugProps) {
  if (slug === 'skel') return <EnemySkeleton size={size} />;
  if (slug === 'drag') return <EnemyDragon size={size} />;
  return <EnemyGoblin size={size} />;
}
