import type { CharacterClass } from '@/components/avatar';

export interface PortraitProps {
  size?: number;
}

export function PortraitWarrior({ size = 96 }: PortraitProps) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>
      <circle cx="50" cy="50" r="48" fill="#e8b870" stroke="#2a1810" strokeWidth="3" />
      <circle cx="50" cy="50" r="48" fill="url(#ht1)" opacity="0.15" />
      <defs>
        <pattern id="ht1" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1" fill="#2a1810" />
        </pattern>
      </defs>
      <path
        d="M15 92 Q20 68 50 66 Q80 68 85 92 Z"
        fill="#8a4a2a"
        stroke="#2a1810"
        strokeWidth="3"
      />
      <ellipse cx="20" cy="74" rx="12" ry="10" fill="#888" stroke="#2a1810" strokeWidth="3" />
      <ellipse cx="80" cy="74" rx="12" ry="10" fill="#888" stroke="#2a1810" strokeWidth="3" />
      <circle cx="20" cy="74" r="3" fill="#d4a24c" stroke="#2a1810" strokeWidth="1.5" />
      <circle cx="80" cy="74" r="3" fill="#d4a24c" stroke="#2a1810" strokeWidth="1.5" />
      <rect x="44" y="56" width="12" height="12" fill="#f0c090" stroke="#2a1810" strokeWidth="3" />
      <ellipse cx="50" cy="42" rx="20" ry="22" fill="#f0c090" stroke="#2a1810" strokeWidth="3" />
      <path
        d="M30 36 Q30 24 50 22 Q70 24 70 36 L67 42 Q66 30 50 28 Q34 30 33 42 Z"
        fill="#6a3a1a"
        stroke="#2a1810"
        strokeWidth="3"
      />
      <path d="M62 36 L67 44" stroke="#2a1810" strokeWidth="2" strokeLinecap="round" />
      <circle cx="42" cy="44" r="2.2" fill="#2a1810" />
      <circle cx="58" cy="44" r="2.2" fill="#2a1810" />
      <path d="M37 40 L47 39" stroke="#2a1810" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M53 39 L63 40" stroke="#2a1810" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M43 54 Q50 52 57 54"
        stroke="#2a1810"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M40 54 Q50 62 60 54 Q58 58 50 60 Q42 58 40 54 Z"
        fill="#6a3a1a"
        opacity="0.6"
      />
    </svg>
  );
}

export function PortraitMage({ size = 96 }: PortraitProps) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>
      <circle cx="50" cy="50" r="48" fill="#b8a8e0" stroke="#2a1810" strokeWidth="3" />
      <path
        d="M10 96 Q12 70 50 66 Q88 70 90 96 Z"
        fill="#3a2a6a"
        stroke="#2a1810"
        strokeWidth="3"
      />
      <path d="M30 72 Q50 68 70 72" stroke="#d4a24c" strokeWidth="3" fill="none" />
      <text x="30" y="88" fontSize="10" fill="#d4a24c">
        ★
      </text>
      <text x="65" y="90" fontSize="8" fill="#d4a24c">
        ★
      </text>
      <rect x="45" y="56" width="10" height="12" fill="#f0c090" stroke="#2a1810" strokeWidth="3" />
      <ellipse cx="50" cy="42" rx="18" ry="20" fill="#f0c090" stroke="#2a1810" strokeWidth="3" />
      <path d="M24 30 L50 -4 L76 30 Z" fill="#3a2a6a" stroke="#2a1810" strokeWidth="3" />
      <path
        d="M24 30 Q50 22 76 30 L78 36 Q50 30 22 36 Z"
        fill="#2a1850"
        stroke="#2a1810"
        strokeWidth="3"
      />
      <circle cx="50" cy="10" r="4" fill="#d4a24c" stroke="#2a1810" strokeWidth="2" />
      <path
        d="M34 52 Q50 72 66 52 Q64 66 50 72 Q36 66 34 52 Z"
        fill="#f0ede0"
        stroke="#2a1810"
        strokeWidth="2.5"
      />
      <circle cx="43" cy="44" r="2" fill="#2a1810" />
      <circle cx="57" cy="44" r="2" fill="#2a1810" />
      <path d="M38 40 L48 41" stroke="#2a1810" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M52 41 L62 40" stroke="#2a1810" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M50 46 L50 52" stroke="#2a1810" strokeWidth="1.5" />
    </svg>
  );
}

export function PortraitRogue({ size = 96 }: PortraitProps) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>
      <circle cx="50" cy="50" r="48" fill="#8ab8a0" stroke="#2a1810" strokeWidth="3" />
      <path
        d="M10 96 Q14 66 50 62 Q86 66 90 96 Z"
        fill="#2a4a3a"
        stroke="#2a1810"
        strokeWidth="3"
      />
      <path
        d="M22 48 Q22 20 50 16 Q78 20 78 48 L72 52 Q72 28 50 24 Q28 28 28 52 Z"
        fill="#1a3a2a"
        stroke="#2a1810"
        strokeWidth="3"
      />
      <ellipse cx="50" cy="46" rx="17" ry="18" fill="#c89670" stroke="#2a1810" strokeWidth="3" />
      <path d="M33 40 Q50 30 67 40 L67 50 Q50 42 33 50 Z" fill="#2a1810" opacity="0.4" />
      <rect x="33" y="42" width="34" height="9" fill="#1a1a1a" stroke="#2a1810" strokeWidth="2" />
      <circle cx="43" cy="46.5" r="1.8" fill="#ffc830" />
      <circle cx="57" cy="46.5" r="1.8" fill="#ffc830" />
      <path
        d="M43 58 Q50 62 57 58"
        stroke="#2a1810"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="57" cy="58" r="1.5" fill="#2a1810" />
    </svg>
  );
}

export interface PortraitByClassProps {
  cls: CharacterClass;
  size?: number;
}

export function PortraitByClass({ cls, size = 96 }: PortraitByClassProps) {
  if (cls === 'mage') return <PortraitMage size={size} />;
  if (cls === 'rogue') return <PortraitRogue size={size} />;
  return <PortraitWarrior size={size} />;
}
