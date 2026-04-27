// Spójne komiksowe ikony — grube kontury #2a1810, płaskie kolory.
// ZASADA: ŻADNYCH EMOJI — wszystko rysowane jako SVG.

import type { IconName } from '@grodno/shared';

export interface GameIconProps {
  name: IconName;
  size?: number;
}

const INK = '#2a1810';

export function GameIcon({ name, size = 48 }: GameIconProps) {
  const ink = INK;
  const s = size;
  const common = {
    width: s,
    height: s,
    viewBox: '0 0 64 64',
    style: { display: 'block' },
  } as const;
  switch (name) {
    case 'scroll':
      return (
        <svg {...common}>
          <path
            d="M10 14 Q10 8 16 8 L44 8 Q50 8 50 14 L50 50 Q50 56 44 56 L16 56 Q10 56 10 50 Z"
            fill="#f0e0b0"
            stroke={ink}
            strokeWidth="3"
          />
          <path
            d="M10 14 Q10 8 16 8 L22 8 Q16 8 16 14 L16 50 Q16 56 22 56 L16 56 Q10 56 10 50 Z"
            fill="#d4a24c"
            stroke={ink}
            strokeWidth="3"
          />
          <path
            d="M22 20 L44 20 M22 28 L40 28 M22 36 L44 36 M22 44 L38 44"
            stroke={ink}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="50" cy="14" r="4" fill="#c83232" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'sword':
      return (
        <svg {...common}>
          <path
            d="M42 6 L58 6 L58 22 L26 54 L20 58 L12 50 L16 44 Z"
            fill="#d0d0d0"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M42 6 L52 16 L26 42 L20 36 Z" fill="#f0f0f0" opacity="0.55" />
          <rect
            x="14"
            y="40"
            width="12"
            height="4"
            fill="#8a5a2a"
            stroke={ink}
            strokeWidth="2.5"
            transform="rotate(-45 20 42)"
          />
          <rect
            x="10"
            y="48"
            width="10"
            height="10"
            rx="2"
            fill="#8a5a2a"
            stroke={ink}
            strokeWidth="3"
            transform="rotate(-45 15 53)"
          />
          <circle cx="50" cy="14" r="2.5" fill="#d4a24c" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'dagger':
      return (
        <svg {...common}>
          <path
            d="M34 8 L38 8 L40 40 L36 44 L32 40 Z"
            fill="#d0d0d0"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M34 8 L36 8 L37 38 L35 40 Z" fill="#f0f0f0" opacity="0.55" />
          <rect
            x="22"
            y="42"
            width="24"
            height="5"
            rx="1"
            fill="#8a5a2a"
            stroke={ink}
            strokeWidth="2.5"
          />
          <rect x="32" y="47" width="8" height="12" fill="#5a3a1a" stroke={ink} strokeWidth="2.5" />
          <line x1="32" y1="50" x2="40" y2="50" stroke={ink} strokeWidth="1.5" />
          <line x1="32" y1="54" x2="40" y2="54" stroke={ink} strokeWidth="1.5" />
          <circle cx="36" cy="60" r="3.5" fill="#c83232" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'crossed':
      return (
        <svg {...common}>
          <g transform="rotate(45 32 32)">
            <rect x="30" y="6" width="4" height="40" fill="#d0d0d0" stroke={ink} strokeWidth="2.5" />
            <rect x="24" y="44" width="16" height="4" fill="#8a5a2a" stroke={ink} strokeWidth="2.5" />
            <rect x="30" y="48" width="4" height="10" fill="#8a5a2a" stroke={ink} strokeWidth="2.5" />
            <circle cx="32" cy="60" r="3" fill="#d4a24c" stroke={ink} strokeWidth="2" />
          </g>
          <g transform="rotate(-45 32 32)">
            <rect x="30" y="6" width="4" height="40" fill="#d0d0d0" stroke={ink} strokeWidth="2.5" />
            <rect x="24" y="44" width="16" height="4" fill="#c83232" stroke={ink} strokeWidth="2.5" />
            <rect x="30" y="48" width="4" height="10" fill="#c83232" stroke={ink} strokeWidth="2.5" />
            <circle cx="32" cy="60" r="3" fill="#d4a24c" stroke={ink} strokeWidth="2" />
          </g>
          <circle cx="32" cy="32" r="3" fill="#d4a24c" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'shop':
      return (
        <svg {...common}>
          <path d="M6 18 L58 18 L54 30 L10 30 Z" fill="#c83232" stroke={ink} strokeWidth="3" />
          <path
            d="M14 18 L12 30 M22 18 L20 30 M32 18 L32 30 M42 18 L44 30 M50 18 L52 30"
            stroke={ink}
            strokeWidth="2"
          />
          <rect x="10" y="30" width="44" height="28" fill="#e8dcb9" stroke={ink} strokeWidth="3" />
          <path
            d="M24 58 L24 40 Q24 36 32 36 Q40 36 40 40 L40 58"
            fill="#8a5a2a"
            stroke={ink}
            strokeWidth="3"
          />
          <circle cx="36" cy="48" r="1.5" fill={ink} />
          <rect x="28" y="22" width="8" height="6" fill="#d4a24c" stroke={ink} strokeWidth="2" />
          <text
            x="32"
            y="27"
            textAnchor="middle"
            fontFamily="Luckiest Guy, sans-serif"
            fontSize="5"
            fill={ink}
          >
            $
          </text>
        </svg>
      );
    case 'tavern':
      return (
        <svg {...common}>
          <path
            d="M12 20 L44 20 L42 56 Q42 58 40 58 L16 58 Q14 58 14 56 Z"
            fill="#c8a06a"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M12 20 Q16 14 22 18 Q28 12 34 18 Q40 14 44 20 Q42 24 38 22 Q32 26 28 22 Q22 26 18 22 Q14 24 12 20 Z"
            fill="#f5eed8"
            stroke={ink}
            strokeWidth="2.5"
          />
          <circle cx="20" cy="16" r="2.5" fill="#f5eed8" stroke={ink} strokeWidth="2" />
          <circle cx="36" cy="14" r="2" fill="#f5eed8" stroke={ink} strokeWidth="2" />
          <path
            d="M44 26 Q56 28 54 40 Q54 48 44 48"
            fill="none"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M44 30 Q52 32 50 40 Q50 44 44 44" fill="none" stroke={ink} strokeWidth="2" />
          <path
            d="M16 30 L40 30 M17 40 L39 40 M18 50 L38 50"
            stroke="#8a5a2a"
            strokeWidth="2"
            opacity="0.4"
          />
        </svg>
      );
    case 'gift':
      return (
        <svg {...common}>
          <rect x="8" y="22" width="48" height="36" fill="#c83232" stroke={ink} strokeWidth="3" rx="2" />
          <rect x="6" y="18" width="52" height="10" fill="#e04848" stroke={ink} strokeWidth="3" rx="2" />
          <rect x="28" y="18" width="8" height="40" fill="#d4a24c" stroke={ink} strokeWidth="2.5" />
          <path d="M32 18 Q20 6 18 14 Q22 18 32 18 Z" fill="#d4a24c" stroke={ink} strokeWidth="3" />
          <path d="M32 18 Q44 6 46 14 Q42 18 32 18 Z" fill="#d4a24c" stroke={ink} strokeWidth="3" />
          <circle cx="32" cy="18" r="3" fill="#a87d2e" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'castle':
      return (
        <svg {...common}>
          <rect x="8" y="20" width="12" height="40" fill="#a8a8a0" stroke={ink} strokeWidth="3" />
          <rect x="44" y="20" width="12" height="40" fill="#a8a8a0" stroke={ink} strokeWidth="3" />
          <path
            d="M8 20 L10 14 L13 20 L16 14 L19 20 L20 20"
            fill="#a8a8a0"
            stroke={ink}
            strokeWidth="2.5"
          />
          <path
            d="M44 20 L46 14 L49 20 L52 14 L55 20 L56 20"
            fill="#a8a8a0"
            stroke={ink}
            strokeWidth="2.5"
          />
          <rect x="20" y="28" width="24" height="32" fill="#c0c0b8" stroke={ink} strokeWidth="3" />
          <path
            d="M14 14 L14 6 L22 9 L14 12"
            fill="#c83232"
            stroke={ink}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M26 60 L26 46 Q26 40 32 40 Q38 40 38 46 L38 60" fill={ink} />
          <rect x="11" y="30" width="6" height="8" fill="#ffc830" stroke={ink} strokeWidth="2" />
          <rect x="47" y="30" width="6" height="8" fill="#ffc830" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'helmet':
      return (
        <svg {...common}>
          <path
            d="M14 34 Q14 14 32 12 Q50 14 50 34 L50 44 L42 44 L42 34 Q42 22 32 22 Q22 22 22 34 L22 44 L14 44 Z"
            fill="#a8a8a0"
            stroke={ink}
            strokeWidth="3"
          />
          <rect x="28" y="28" width="8" height="16" fill={ink} />
          <path d="M28 8 L32 2 L36 8 L36 14 L28 14 Z" fill="#c83232" stroke={ink} strokeWidth="2.5" />
          <circle cx="18" cy="40" r="1.5" fill={ink} />
          <circle cx="46" cy="40" r="1.5" fill={ink} />
          <path d="M14 44 L22 50 M50 44 L42 50" stroke={ink} strokeWidth="2.5" />
        </svg>
      );
    case 'banner':
      return (
        <svg {...common}>
          <rect x="10" y="6" width="4" height="54" fill="#8a5a2a" stroke={ink} strokeWidth="2.5" />
          <path
            d="M14 10 L54 10 L48 22 L54 34 L14 34 Z"
            fill="#3a5a8a"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M30 14 L30 30 M22 22 L38 22"
            stroke="#d4a24c"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx="30" cy="22" r="6" fill="none" stroke="#d4a24c" strokeWidth="2" />
          <circle cx="12" cy="6" r="3" fill="#d4a24c" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'mushroom':
      return (
        <svg {...common}>
          <path
            d="M8 30 Q8 10 32 10 Q56 10 56 30 L48 32 L44 28 L38 32 L32 28 L26 32 L20 28 L16 32 Z"
            fill="#c83232"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="20" r="3" fill="#fff3e0" />
          <circle cx="32" cy="16" r="4" fill="#fff3e0" />
          <circle cx="44" cy="22" r="3" fill="#fff3e0" />
          <path
            d="M24 32 Q26 52 22 56 Q22 58 26 58 L38 58 Q42 58 42 56 Q38 52 40 32 Z"
            fill="#f5eed8"
            stroke={ink}
            strokeWidth="3"
          />
          <path d="M28 40 Q32 44 36 40" stroke={ink} strokeWidth="2" fill="none" />
        </svg>
      );
    case 'mouse':
      return (
        <svg {...common}>
          <ellipse cx="32" cy="40" rx="22" ry="16" fill="#8a8a8a" stroke={ink} strokeWidth="3" />
          <circle cx="18" cy="22" r="8" fill="#8a8a8a" stroke={ink} strokeWidth="3" />
          <circle cx="46" cy="22" r="8" fill="#8a8a8a" stroke={ink} strokeWidth="3" />
          <circle cx="18" cy="22" r="4" fill="#f0b8c8" stroke={ink} strokeWidth="2" />
          <circle cx="46" cy="22" r="4" fill="#f0b8c8" stroke={ink} strokeWidth="2" />
          <circle cx="26" cy="36" r="2.5" fill={ink} />
          <circle cx="38" cy="36" r="2.5" fill={ink} />
          <ellipse cx="32" cy="44" rx="3" ry="2.5" fill={ink} />
          <path
            d="M30 46 Q28 50 24 50 M34 46 Q36 50 40 50"
            stroke={ink}
            strokeWidth="2"
            fill="none"
          />
          <path d="M32 47 L32 52" stroke={ink} strokeWidth="2" />
          <path d="M54 40 Q62 42 62 52 Q58 58 52 54" stroke={ink} strokeWidth="3" fill="none" />
        </svg>
      );
    case 'rat':
      return (
        <svg {...common}>
          <ellipse cx="28" cy="42" rx="22" ry="14" fill="#6a5a4a" stroke={ink} strokeWidth="3" />
          <ellipse cx="14" cy="34" rx="10" ry="9" fill="#6a5a4a" stroke={ink} strokeWidth="3" />
          <path
            d="M8 28 L4 22 L10 26 Z M22 26 L22 20 L26 26 Z"
            fill="#6a5a4a"
            stroke={ink}
            strokeWidth="2.5"
          />
          <circle cx="14" cy="34" r="2" fill="#ffc830" />
          <circle cx="6" cy="34" r="1.8" fill={ink} />
          <path d="M2 36 L5 38 L3 40" stroke={ink} strokeWidth="2" fill="none" />
          <path d="M46 46 Q60 50 58 58 Q54 62 50 58" stroke={ink} strokeWidth="3" fill="none" />
          <path d="M34 54 L34 60 M40 54 L40 60" stroke={ink} strokeWidth="3" />
        </svg>
      );
    case 'cake':
      return (
        <svg {...common}>
          <rect x="8" y="36" width="48" height="20" fill="#f0b8c8" stroke={ink} strokeWidth="3" rx="2" />
          <path
            d="M8 40 Q12 44 16 40 Q20 44 24 40 Q28 44 32 40 Q36 44 40 40 Q44 44 48 40 Q52 44 56 40"
            stroke="#c83232"
            strokeWidth="2.5"
            fill="none"
          />
          <rect x="12" y="22" width="40" height="14" fill="#e89880" stroke={ink} strokeWidth="3" rx="2" />
          <circle cx="20" cy="22" r="2" fill="#c83232" />
          <circle cx="32" cy="20" r="2" fill="#c83232" />
          <circle cx="44" cy="22" r="2" fill="#c83232" />
          <rect x="30" y="8" width="4" height="14" fill="#f5eed8" stroke={ink} strokeWidth="2" />
          <path d="M32 4 Q28 8 32 10 Q36 8 32 4 Z" fill="#ffc830" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'sword-dawn':
      return (
        <svg {...common}>
          <path
            d="M32 4 L40 10 L40 46 L32 54 L24 46 L24 10 Z"
            fill="#ffe090"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M32 4 L32 54" stroke="#d4a24c" strokeWidth="2" />
          <path d="M28 10 L28 44 M36 10 L36 44" stroke={ink} strokeWidth="1" opacity="0.4" />
          <rect x="14" y="46" width="36" height="6" fill="#c83232" stroke={ink} strokeWidth="3" />
          <rect x="28" y="52" width="8" height="10" fill="#8a5a2a" stroke={ink} strokeWidth="3" />
          <path
            d="M8 20 L14 22 M50 22 L56 20 M10 10 L16 16 M48 16 L54 10"
            stroke="#ffc830"
            strokeWidth="2"
          />
        </svg>
      );
    case 'helm-hunter':
      return (
        <svg {...common}>
          <path
            d="M10 40 Q10 18 32 14 Q54 18 54 40 L54 50 L44 50 L44 40 Q44 26 32 26 Q20 26 20 40 L20 50 L10 50 Z"
            fill="#4a7c3a"
            stroke={ink}
            strokeWidth="3"
          />
          <path d="M26 30 Q32 36 38 30 Q36 36 32 36 Q28 36 26 30 Z" fill={ink} />
          <path d="M32 8 L22 14 L32 12 L42 14 Z" fill="#8a5a2a" stroke={ink} strokeWidth="2.5" />
          <circle cx="32" cy="20" r="2" fill="#d4a24c" stroke={ink} strokeWidth="1.5" />
          <path d="M14 50 L18 56 M50 50 L46 56" stroke={ink} strokeWidth="2.5" />
        </svg>
      );
    case 'potion':
      return (
        <svg {...common}>
          <rect x="26" y="6" width="12" height="10" fill="#8a5a2a" stroke={ink} strokeWidth="2.5" />
          <rect x="24" y="14" width="16" height="6" fill="#c8b890" stroke={ink} strokeWidth="2.5" />
          <path
            d="M22 20 L42 20 L48 40 Q48 56 32 56 Q16 56 16 40 Z"
            fill="#6ac8f0"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M22 20 L42 20 L44 32 Q40 28 32 30 Q24 28 20 32 Z"
            fill="#3a8ac8"
            stroke={ink}
            strokeWidth="2"
          />
          <circle cx="26" cy="42" r="2" fill="#a0e0ff" />
          <circle cx="36" cy="48" r="1.5" fill="#a0e0ff" />
          <circle cx="30" cy="50" r="1" fill="#a0e0ff" />
        </svg>
      );
    case 'orb':
      return (
        <svg {...common}>
          <rect x="28" y="30" width="8" height="30" fill="#3a2a6a" stroke={ink} strokeWidth="2.5" />
          <rect x="22" y="56" width="20" height="6" fill="#8a5a2a" stroke={ink} strokeWidth="2.5" />
          <path
            d="M20 28 Q20 18 32 18 Q44 18 44 28 L40 28 Q40 22 32 22 Q24 22 24 28 Z"
            fill="#8a5a2a"
            stroke={ink}
            strokeWidth="2.5"
          />
          <circle cx="32" cy="16" r="12" fill="#a04ef0" stroke={ink} strokeWidth="3" />
          <circle cx="27" cy="12" r="4" fill="#d890ff" />
          <path
            d="M20 4 Q18 2 22 2 M42 6 Q46 4 44 8 M14 12 Q10 14 12 16"
            stroke="#d4a24c"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      );
    // ========== Melee weapons — unique variants ==========
    case 'sword-ghost':
      return (
        <svg {...common}>
          <path
            d="M42 6 L58 6 L58 22 L26 54 L20 58 L12 50 L16 44 Z"
            fill="#d0e8f0"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
            opacity="0.85"
          />
          <path d="M42 6 L52 16 L26 42 L20 36 Z" fill="#fff" opacity="0.5" />
          <rect x="14" y="40" width="12" height="4" fill="#8a5a2a" stroke={ink} strokeWidth="2.5" transform="rotate(-45 20 42)" />
          <rect x="10" y="48" width="10" height="10" rx="2" fill="#6ac8f0" stroke={ink} strokeWidth="3" transform="rotate(-45 15 53)" />
          {/* ghostly aura */}
          <circle cx="35" cy="30" r="20" fill="none" stroke="#6ac8f0" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        </svg>
      );
    case 'sword-iron':
      return (
        <svg {...common}>
          <path d="M42 6 L58 6 L58 22 L26 54 L20 58 L12 50 L16 44 Z" fill="#a8a8a8" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M42 6 L52 16 L26 42 L20 36 Z" fill="#d8d8d8" />
          <rect x="14" y="40" width="12" height="4" fill="#3a2a1a" stroke={ink} strokeWidth="2.5" transform="rotate(-45 20 42)" />
          <rect x="10" y="48" width="10" height="10" rx="2" fill="#3a2a1a" stroke={ink} strokeWidth="3" transform="rotate(-45 15 53)" />
          {/* bolt rivets along blade */}
          <circle cx="48" cy="12" r="1.5" fill={ink} />
          <circle cx="38" cy="22" r="1.5" fill={ink} />
          <circle cx="28" cy="32" r="1.5" fill={ink} />
        </svg>
      );
    case 'sword-cheese':
      return (
        <svg {...common}>
          <path d="M42 6 L58 6 L58 22 L26 54 L20 58 L12 50 L16 44 Z" fill="#ffc830" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* holes */}
          <circle cx="46" cy="14" r="2.5" fill="#8a5a2a" stroke={ink} strokeWidth="1.5" />
          <circle cx="36" cy="24" r="2" fill="#8a5a2a" stroke={ink} strokeWidth="1.5" />
          <circle cx="28" cy="34" r="1.8" fill="#8a5a2a" stroke={ink} strokeWidth="1.5" />
          <circle cx="50" cy="18" r="1.5" fill="#8a5a2a" stroke={ink} strokeWidth="1.5" />
          <rect x="14" y="40" width="12" height="4" fill="#6a3a1a" stroke={ink} strokeWidth="2.5" transform="rotate(-45 20 42)" />
          <rect x="10" y="48" width="10" height="10" rx="2" fill="#8a5a2a" stroke={ink} strokeWidth="3" transform="rotate(-45 15 53)" />
        </svg>
      );
    case 'sword-throne':
      return (
        <svg {...common}>
          <path d="M42 6 L58 6 L58 22 L26 54 L20 58 L12 50 L16 44 Z" fill="#ffdc70" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M42 6 L52 16 L26 42 L20 36 Z" fill="#fff3e0" opacity="0.6" />
          <rect x="14" y="40" width="14" height="5" fill="#c83232" stroke={ink} strokeWidth="2.5" transform="rotate(-45 20 42)" />
          <rect x="8" y="48" width="12" height="12" rx="2" fill="#c83232" stroke={ink} strokeWidth="3" transform="rotate(-45 14 54)" />
          <circle cx="14" cy="54" r="2.5" fill="#6ac8f0" stroke={ink} strokeWidth="1.5" transform="rotate(-45 14 54)" />
          <circle cx="50" cy="14" r="2" fill="#c83232" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'sword-chief':
      return (
        <svg {...common}>
          <path d="M42 6 L58 6 L58 22 L26 54 L20 58 L12 50 L16 44 Z" fill="#d0a060" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M42 6 L52 16 L26 42 L20 36 Z" fill="#f0d0a0" opacity="0.6" />
          {/* plemienne znaki na ostrzu */}
          <path d="M40 14 L44 18 M34 20 L38 24 M28 26 L32 30" stroke={ink} strokeWidth="2" />
          <rect x="14" y="40" width="12" height="4" fill="#c83232" stroke={ink} strokeWidth="2.5" transform="rotate(-45 20 42)" />
          <rect x="10" y="48" width="10" height="10" rx="2" fill="#8a5a2a" stroke={ink} strokeWidth="3" transform="rotate(-45 15 53)" />
          {/* kogucik na rękojeści */}
          <path d="M12 52 L10 48 L14 50 L16 46 L18 52 Z" fill="#c83232" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'axe-minotaur':
      return (
        <svg {...common}>
          <rect x="30" y="10" width="4" height="50" fill="#6a3a1a" stroke={ink} strokeWidth="2.5" />
          {/* dwuostrzowy topór */}
          <path d="M32 12 L10 18 L14 30 L32 26 Z" fill="#8a8a8a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M32 12 L54 18 L50 30 L32 26 Z" fill="#8a8a8a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M14 18 L32 22 M50 18 L32 22" stroke={ink} strokeWidth="1.5" opacity="0.5" />
          {/* rogi minotaura u góry */}
          <path d="M28 12 Q24 4 26 10 M36 12 Q40 4 38 10" stroke={ink} strokeWidth="2.5" fill="#f5eed8" strokeLinejoin="round" />
          <rect x="28" y="54" width="8" height="8" fill="#3a2a1a" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'axe-headless':
      return (
        <svg {...common}>
          <rect x="30" y="6" width="4" height="52" fill="#8a5a2a" stroke={ink} strokeWidth="2.5" />
          {/* złamane ostrze u góry */}
          <path d="M32 8 L20 20 L26 24 L22 30 L32 26 Z" fill="#8a8a8a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M32 8 L44 20 L38 24 L42 30 L32 26 Z" fill="#8a8a8a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M30 6 L28 2 L32 4 L34 2 L32 6" stroke={ink} strokeWidth="2" fill={ink} strokeLinejoin="round" />
          <rect x="28" y="54" width="8" height="8" fill="#3a2a1a" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'axe-throne':
      return (
        <svg {...common}>
          <rect x="30" y="10" width="4" height="50" fill="#d4a24c" stroke={ink} strokeWidth="2.5" />
          <path d="M32 12 L8 16 L16 32 L32 28 Z" fill="#ffc830" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M32 12 L56 16 L48 32 L32 28 Z" fill="#ffc830" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="16" cy="22" r="2" fill="#c83232" stroke={ink} strokeWidth="1.5" />
          <circle cx="48" cy="22" r="2" fill="#6ac8f0" stroke={ink} strokeWidth="1.5" />
          <rect x="28" y="54" width="8" height="8" fill="#c83232" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'axe-ratslayer':
      return (
        <svg {...common}>
          <rect x="30" y="10" width="4" height="50" fill="#6a3a1a" stroke={ink} strokeWidth="2.5" />
          <path d="M32 12 L10 20 L18 34 L32 28 Z" fill="#8a8a8a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* ząb szczura zawieszony */}
          <path d="M32 32 L34 40 L30 40 Z" fill="#f5eed8" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          {/* ogon szczura owiniety */}
          <path d="M34 16 Q44 18 46 26 Q44 30 42 28" stroke={ink} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="28" y="54" width="8" height="8" fill="#3a2a1a" stroke={ink} strokeWidth="2" />
          <circle cx="20" cy="22" r="1.5" fill="#c83232" />
        </svg>
      );
    case 'mace-troll':
      return (
        <svg {...common}>
          <rect x="30" y="22" width="4" height="36" fill="#6a3a1a" stroke={ink} strokeWidth="2.5" />
          <circle cx="32" cy="16" r="14" fill="#8a8a8a" stroke={ink} strokeWidth="3" />
          {/* kolce wokół głowicy */}
          <path d="M32 2 L34 8 L30 8 Z" fill="#8a8a8a" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M32 30 L34 24 L30 24 Z" fill="#8a8a8a" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M18 16 L24 18 L24 14 Z" fill="#8a8a8a" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M46 16 L40 18 L40 14 Z" fill="#8a8a8a" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M22 6 L26 10 L24 12 Z" fill="#8a8a8a" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M42 6 L38 10 L40 12 Z" fill="#8a8a8a" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <rect x="28" y="54" width="8" height="8" fill="#3a2a1a" stroke={ink} strokeWidth="2" />
        </svg>
      );
    // ========== Daggers ==========
    case 'dagger-old':
      return (
        <svg {...common}>
          <path d="M34 8 L38 8 L40 40 L36 44 L32 40 Z" fill="#a88060" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M34 8 L36 8 L37 38 L35 40 Z" fill="#c8a078" opacity="0.6" />
          {/* rdzawe plamy */}
          <circle cx="36" cy="18" r="1.5" fill="#8a4a1a" />
          <circle cx="36" cy="28" r="1.2" fill="#8a4a1a" />
          <rect x="22" y="42" width="24" height="5" rx="1" fill="#6a3a1a" stroke={ink} strokeWidth="2.5" />
          <rect x="32" y="47" width="8" height="12" fill="#3a2a1a" stroke={ink} strokeWidth="2.5" />
          <circle cx="36" cy="60" r="3" fill="#8a5a2a" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'dagger-imp':
      return (
        <svg {...common}>
          <path d="M34 8 L38 8 L40 40 L36 44 L32 40 Z" fill="#e04848" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M34 8 L36 8 L37 38 L35 40 Z" fill="#ffc830" opacity="0.6" />
          {/* ogień wokół ostrza */}
          <path d="M32 10 Q28 14 30 20 Q26 22 28 28 Q24 30 26 36" stroke="#ffc830" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M40 10 Q44 14 42 20 Q46 22 44 28 Q48 30 46 36" stroke="#ffc830" strokeWidth="2" fill="none" strokeLinecap="round" />
          <rect x="22" y="42" width="24" height="5" rx="1" fill="#8a2a1a" stroke={ink} strokeWidth="2.5" />
          <rect x="32" y="47" width="8" height="12" fill="#3a1a0a" stroke={ink} strokeWidth="2.5" />
          <path d="M36 60 L34 64 L38 64 Z" fill="#e04848" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'dagger-slime':
      return (
        <svg {...common}>
          <path d="M34 8 L38 8 L40 40 L36 44 L32 40 Z" fill="#4a7c3a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M34 8 L36 8 L37 38 L35 40 Z" fill="#6aa04a" opacity="0.6" />
          {/* krople slime */}
          <circle cx="32" cy="36" r="1.5" fill="#4a7c3a" stroke={ink} strokeWidth="1" />
          <path d="M40 32 Q42 36 40 40 Q38 36 40 32 Z" fill="#4a7c3a" stroke={ink} strokeWidth="1.5" />
          <path d="M36 44 Q38 50 34 52" stroke="#4a7c3a" strokeWidth="2" fill="none" strokeLinecap="round" />
          <rect x="22" y="42" width="24" height="5" rx="1" fill="#3a5a2a" stroke={ink} strokeWidth="2.5" />
          <rect x="32" y="47" width="8" height="12" fill="#1a3a0a" stroke={ink} strokeWidth="2.5" />
          <circle cx="36" cy="60" r="3" fill="#4a7c3a" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'dagger-mist':
      return (
        <svg {...common}>
          <path d="M34 8 L38 8 L40 40 L36 44 L32 40 Z" fill="#d0dcff" stroke={ink} strokeWidth="3" strokeLinejoin="round" opacity="0.6" />
          <path d="M34 8 L36 8 L37 38 L35 40 Z" fill="#fff" opacity="0.5" />
          {/* mgła */}
          <path d="M28 18 Q34 20 40 18" stroke="#d0dcff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M26 28 Q36 30 42 28" stroke="#d0dcff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
          <rect x="22" y="42" width="24" height="5" rx="1" fill="#8a8aa0" stroke={ink} strokeWidth="2.5" />
          <rect x="32" y="47" width="8" height="12" fill="#5a5a7a" stroke={ink} strokeWidth="2.5" />
          <circle cx="36" cy="60" r="3" fill="#d0dcff" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'dagger-dragon':
      return (
        <svg {...common}>
          <path d="M34 8 L38 8 L40 40 L36 44 L32 40 Z" fill="#8a3a3a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* łuski smoka */}
          <path d="M34 12 Q36 14 38 12 M34 18 Q36 20 38 18 M34 24 Q36 26 38 24 M34 30 Q36 32 38 30" stroke={ink} strokeWidth="1.5" fill="none" />
          <path d="M34 8 L36 8 L37 38 L35 40 Z" fill="#c05050" opacity="0.5" />
          <rect x="22" y="42" width="24" height="5" rx="1" fill="#ffc830" stroke={ink} strokeWidth="2.5" />
          {/* kieł u podstawy */}
          <path d="M22 47 L18 52 L26 49 Z" fill="#f5eed8" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M46 47 L50 52 L42 49 Z" fill="#f5eed8" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <rect x="32" y="47" width="8" height="12" fill="#3a1a1a" stroke={ink} strokeWidth="2.5" />
          <circle cx="36" cy="60" r="3" fill="#ffc830" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'dagger-chief':
      return (
        <svg {...common}>
          <path d="M34 8 L38 8 L40 40 L36 44 L32 40 Z" fill="#d0a060" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M34 8 L36 8 L37 38 L35 40 Z" fill="#f0d0a0" opacity="0.6" />
          {/* plemienne żłobienia */}
          <path d="M35 14 L37 16 M35 22 L37 24 M35 30 L37 32" stroke={ink} strokeWidth="1.5" />
          <rect x="22" y="42" width="24" height="5" rx="1" fill="#c83232" stroke={ink} strokeWidth="2.5" />
          <rect x="32" y="47" width="8" height="12" fill="#6a3a1a" stroke={ink} strokeWidth="2.5" />
          {/* pióro na rękojeści */}
          <path d="M40 50 L48 46 L46 52 L50 50 L44 56 Z" fill="#c83232" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="36" cy="60" r="3" fill="#ffc830" stroke={ink} strokeWidth="2" />
        </svg>
      );
    // ========== Helmets / crowns / hats ==========
    case 'helm-old':
      return (
        <svg {...common}>
          <path d="M14 34 Q14 14 32 12 Q50 14 50 34 L50 44 L42 44 L42 34 Q42 22 32 22 Q22 22 22 34 L22 44 L14 44 Z" fill="#8a8a8a" stroke={ink} strokeWidth="3" />
          <rect x="28" y="28" width="8" height="16" fill={ink} />
          {/* wgięcie */}
          <path d="M20 26 Q22 22 26 24" stroke={ink} strokeWidth="2" fill="none" />
          <circle cx="18" cy="40" r="1.5" fill={ink} />
          <circle cx="46" cy="40" r="1.5" fill={ink} />
          <path d="M14 44 L22 50 M50 44 L42 50" stroke={ink} strokeWidth="2.5" />
        </svg>
      );
    case 'hat-rag':
      return (
        <svg {...common}>
          {/* miękki szmaciany kapelusz z wiszącymi brzegami */}
          <path d="M8 36 Q14 32 20 36 Q26 30 32 34 Q38 30 44 36 Q50 32 56 36 Q56 42 32 44 Q8 42 8 36 Z" fill="#a87858" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M18 34 Q20 18 32 16 Q44 18 46 34" fill="#c89878" stroke={ink} strokeWidth="3" />
          {/* łata */}
          <rect x="38" y="24" width="6" height="6" fill="#6a3a1a" stroke={ink} strokeWidth="1.5" />
          <path d="M38 24 L44 30 M44 24 L38 30" stroke={ink} strokeWidth="1" />
        </svg>
      );
    case 'helm-guard':
      return (
        <svg {...common}>
          <path d="M14 34 Q14 14 32 12 Q50 14 50 34 L50 44 L42 44 L42 34 Q42 22 32 22 Q22 22 22 34 L22 44 L14 44 Z" fill="#c8c8c8" stroke={ink} strokeWidth="3" />
          <rect x="28" y="28" width="8" height="16" fill={ink} />
          {/* pióropusz */}
          <path d="M30 12 Q24 2 28 8 Q22 4 26 10 Q20 8 24 14" stroke={ink} strokeWidth="2.5" fill="#c83232" strokeLinejoin="round" />
          <path d="M30 12 Q36 2 34 8 Q40 4 36 10 Q42 8 38 14" stroke={ink} strokeWidth="2.5" fill="#c83232" strokeLinejoin="round" />
          <circle cx="32" cy="16" r="2" fill="#d4a24c" stroke={ink} strokeWidth="1.5" />
          <path d="M14 44 L22 50 M50 44 L42 50" stroke={ink} strokeWidth="2.5" />
        </svg>
      );
    case 'crown-throne':
      // Diadem Tronowy — cienka królewska opaska
      return (
        <svg {...common}>
          <path d="M10 36 L14 24 L22 32 L32 20 L42 32 L50 24 L54 36 L50 46 L14 46 Z" fill="#ffc830" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <rect x="12" y="42" width="40" height="6" fill="#d4a24c" stroke={ink} strokeWidth="2.5" />
          <circle cx="32" cy="22" r="3" fill="#a04ef0" stroke={ink} strokeWidth="2" />
          <circle cx="14" cy="30" r="2" fill="#c83232" stroke={ink} strokeWidth="1.5" />
          <circle cx="50" cy="30" r="2" fill="#4a7c3a" stroke={ink} strokeWidth="1.5" />
          <circle cx="22" cy="44" r="1.5" fill="#6ac8f0" />
          <circle cx="42" cy="44" r="1.5" fill="#6ac8f0" />
        </svg>
      );
    case 'crown-cake':
      // Korona Ciastkowa — korona z ciasta / ciastek
      return (
        <svg {...common}>
          <path d="M8 42 L12 26 Q16 22 20 26 L24 18 Q28 14 32 18 L36 14 Q40 18 38 22 L44 18 Q50 22 48 28 L56 32 Q54 42 52 46 L12 46 Z" fill="#e89880" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* posypka */}
          <circle cx="18" cy="32" r="1.5" fill="#c83232" />
          <circle cx="26" cy="26" r="1.5" fill="#ffc830" />
          <circle cx="34" cy="22" r="1.5" fill="#a04ef0" />
          <circle cx="42" cy="28" r="1.5" fill="#6ac8f0" />
          <circle cx="48" cy="36" r="1.5" fill="#c83232" />
          <rect x="12" y="42" width="40" height="6" fill="#d4a24c" stroke={ink} strokeWidth="2.5" />
          {/* świeczka */}
          <rect x="30" y="6" width="4" height="10" fill="#f5eed8" stroke={ink} strokeWidth="2" />
          <path d="M32 2 Q28 6 32 8 Q36 6 32 2 Z" fill="#ffc830" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'crown-goblin':
      return (
        <svg {...common}>
          {/* ząbkowana krzywa korona */}
          <path d="M8 44 L10 28 L18 36 L22 22 L30 32 L32 18 L36 30 L42 20 L46 34 L54 28 L56 44 Z" fill="#8a8050" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <rect x="10" y="40" width="44" height="6" fill="#6a6030" stroke={ink} strokeWidth="2.5" />
          {/* kogucik na szczycie — znak plemienny */}
          <path d="M32 18 L28 10 L32 14 L34 8 L38 14 L36 18 Z" fill="#c83232" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="22" cy="42" r="1.5" fill="#c83232" />
          <circle cx="42" cy="42" r="1.5" fill="#4a7c3a" />
        </svg>
      );
    case 'crown-undead':
      return (
        <svg {...common}>
          <path d="M10 42 L14 28 L22 34 L26 20 L32 30 L38 20 L42 34 L50 28 L54 42 Z" fill="#b8b8a0" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <rect x="12" y="40" width="40" height="6" fill="#8a8a78" stroke={ink} strokeWidth="2.5" />
          {/* mała czaszka z przodu */}
          <circle cx="32" cy="34" r="5" fill="#f5eed8" stroke={ink} strokeWidth="2.5" />
          <circle cx="30" cy="34" r="1" fill={ink} />
          <circle cx="34" cy="34" r="1" fill={ink} />
          <path d="M30 36 L32 38 L34 36" stroke={ink} strokeWidth="1.5" fill="none" />
          {/* zielony ogień */}
          <path d="M16 22 Q14 16 18 18 Q16 12 20 14" stroke="#4a7c3a" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M48 22 Q50 16 46 18 Q48 12 44 14" stroke="#4a7c3a" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'crown-obsidian':
      return (
        <svg {...common}>
          <path d="M8 42 L14 18 L22 32 L32 6 L42 32 L50 18 L56 42 Z" fill="#2a1a3a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <rect x="12" y="40" width="40" height="6" fill={ink} strokeWidth="2.5" />
          {/* błysk obsydianu */}
          <path d="M22 22 L20 30 L24 28 M42 22 L44 30 L40 28" stroke="#6ac8f0" strokeWidth="1.5" fill="none" opacity="0.6" />
          <path d="M32 10 L34 18 L30 18 Z" fill="#a04ef0" stroke={ink} strokeWidth="1.5" />
          <circle cx="20" cy="42" r="1.5" fill="#a04ef0" />
          <circle cx="44" cy="42" r="1.5" fill="#a04ef0" />
        </svg>
      );
    // ========== Chestplates / cloaks ==========
    case 'cuirass-leather':
      return (
        <svg {...common}>
          <path d="M6 18 Q14 10 22 14 L22 28 L10 28 Z" fill="#8a5a2a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M58 18 Q50 10 42 14 L42 28 L54 28 Z" fill="#8a5a2a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M16 16 L48 16 L52 30 L48 54 Q40 58 32 58 Q24 58 16 54 L12 30 Z" fill="#a87858" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M26 16 Q32 22 38 16" stroke={ink} strokeWidth="3" fill="none" />
          {/* rzemienie */}
          <path d="M20 30 L44 30 M20 40 L44 40 M20 50 L44 50" stroke={ink} strokeWidth="2" opacity="0.6" />
          <circle cx="24" cy="35" r="1.5" fill={ink} />
          <circle cx="40" cy="35" r="1.5" fill={ink} />
        </svg>
      );
    case 'cuirass-mist':
      return (
        <svg {...common}>
          <path d="M6 18 Q14 10 22 14 L22 28 L10 28 Z" fill="#8a8aa0" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M58 18 Q50 10 42 14 L42 28 L54 28 Z" fill="#8a8aa0" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M16 16 L48 16 L52 30 L48 54 Q40 58 32 58 Q24 58 16 54 L12 30 Z" fill="#a8b0c8" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* mgła */}
          <path d="M16 36 Q24 34 32 36 Q40 38 48 36" stroke="#d0dcff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
          <path d="M18 46 Q26 44 34 46 Q42 48 46 46" stroke="#d0dcff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
          <circle cx="32" cy="30" r="3" fill="#6ac8f0" stroke={ink} strokeWidth="2" opacity="0.8" />
        </svg>
      );
    case 'cloak-shadow':
      // Peleryna Cienia — ciemna z kapturem
      return (
        <svg {...common}>
          {/* kaptur */}
          <path d="M18 4 Q32 2 46 4 Q50 12 44 18 L20 18 Q14 12 18 4 Z" fill="#2a1a3a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M26 18 Q32 14 38 18" stroke={ink} strokeWidth="2" fill="none" />
          {/* rozłożona peleryna */}
          <path d="M14 18 L8 58 L20 58 L32 20 L44 58 L56 58 L50 18 Z" fill="#3a2a4a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M14 18 L20 58 M50 18 L44 58" stroke={ink} strokeWidth="1.5" opacity="0.5" />
          {/* świecące oczy */}
          <circle cx="28" cy="12" r="1.5" fill="#6ac8f0" />
          <circle cx="36" cy="12" r="1.5" fill="#6ac8f0" />
        </svg>
      );
    case 'cloak-executioner':
      // Peleryna Kata — czarna, bez twarzy
      return (
        <svg {...common}>
          <path d="M18 4 Q32 2 46 4 Q50 12 44 18 L20 18 Q14 12 18 4 Z" fill={ink} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <ellipse cx="32" cy="14" rx="10" ry="6" fill="#3a1a1a" />
          <path d="M14 18 L6 60 L24 56 L32 24 L40 56 L58 60 L50 18 Z" fill="#1a0a0a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* czerwona pętla */}
          <path d="M28 22 Q32 26 36 22" stroke="#c83232" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'cloak-shadow-deep':
      // Płaszcz Cienia — ciemniejszy niż Peleryna Cienia, z tajemniczym poświata
      return (
        <svg {...common}>
          <path d="M14 6 Q32 4 50 6 L48 20 L16 20 Z" fill="#1a0a2a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M14 20 L6 58 L22 56 L32 24 L42 56 L58 58 L50 20 Z" fill="#2a1a4a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* halo / aura */}
          <circle cx="32" cy="12" r="16" fill="none" stroke="#a04ef0" strokeWidth="1.5" opacity="0.5" strokeDasharray="3 3" />
          <circle cx="28" cy="10" r="1.5" fill="#a04ef0" />
          <circle cx="36" cy="10" r="1.5" fill="#a04ef0" />
          {/* cichy szept fala */}
          <path d="M26 32 Q32 34 38 32 M24 44 Q32 46 40 44" stroke="#a04ef0" strokeWidth="1.5" fill="none" opacity="0.6" />
        </svg>
      );
    // ========== Potions ==========
    case 'potion-beet':
      // Mikstura Buraka — ciemna fioletowo-czerwona
      return (
        <svg {...common}>
          <rect x="26" y="6" width="12" height="10" fill="#8a5a2a" stroke={ink} strokeWidth="2.5" />
          <rect x="24" y="14" width="16" height="6" fill="#c8b890" stroke={ink} strokeWidth="2.5" />
          <path d="M22 20 L42 20 L48 40 Q48 56 32 56 Q16 56 16 40 Z" fill="#8a2a6a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M22 20 L42 20 L44 32 Q40 28 32 30 Q24 28 20 32 Z" fill="#a04a8a" stroke={ink} strokeWidth="2" />
          {/* liść buraka */}
          <path d="M32 12 Q28 4 34 6 Q38 2 38 10" fill="#4a7c3a" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="26" cy="42" r="1.5" fill="#c890a0" />
        </svg>
      );
    case 'potion-first':
      // Mikstura Pierwsza Lepsza — mętna, nieokreślona
      return (
        <svg {...common}>
          <rect x="26" y="6" width="12" height="10" fill="#6a3a1a" stroke={ink} strokeWidth="2.5" />
          <rect x="24" y="14" width="16" height="6" fill="#a8a8a0" stroke={ink} strokeWidth="2.5" />
          <path d="M22 20 L42 20 L48 40 Q48 56 32 56 Q16 56 16 40 Z" fill="#8a8a70" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* mętna zawartość — różne warstwy */}
          <path d="M22 28 L42 28" stroke="#6a6a50" strokeWidth="1.5" />
          <path d="M20 38 L44 38" stroke="#4a4a30" strokeWidth="1.5" />
          {/* pytajnik */}
          <path d="M28 36 Q32 30 36 34 Q36 38 32 40 L32 44" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="32" cy="48" r="1.5" fill={ink} />
        </svg>
      );
    case 'potion-big':
      // Mikstura Dużego HP — czerwona, większa
      return (
        <svg {...common}>
          <rect x="24" y="4" width="16" height="10" fill="#8a5a2a" stroke={ink} strokeWidth="2.5" />
          <rect x="22" y="12" width="20" height="6" fill="#c8b890" stroke={ink} strokeWidth="2.5" />
          <path d="M18 18 L46 18 L52 40 Q52 58 32 58 Q12 58 12 40 Z" fill="#c83232" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M18 18 L46 18 L48 32 Q40 28 32 30 Q24 28 16 32 Z" fill="#e04848" stroke={ink} strokeWidth="2" />
          <path d="M32 34 L32 44 M27 39 L37 39" stroke="#fff3e0" strokeWidth="3" strokeLinecap="round" />
          <circle cx="24" cy="46" r="1.5" fill="#fff3e0" opacity="0.8" />
          <circle cx="40" cy="50" r="1.2" fill="#fff3e0" opacity="0.8" />
        </svg>
      );
    case 'potion-warrior':
      // Mikstura Wojownika — stalowa butelka, rune
      return (
        <svg {...common}>
          <rect x="26" y="6" width="12" height="10" fill="#6a6a6a" stroke={ink} strokeWidth="2.5" />
          <rect x="24" y="14" width="16" height="6" fill="#a8a8a8" stroke={ink} strokeWidth="2.5" />
          <path d="M22 20 L42 20 L48 40 Q48 56 32 56 Q16 56 16 40 Z" fill="#c83232" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M22 20 L42 20 L44 32 Q40 28 32 30 Q24 28 20 32 Z" fill="#e04848" stroke={ink} strokeWidth="2" />
          {/* runa / miecz */}
          <path d="M32 38 L32 50 M28 42 L36 42 M30 48 L34 48" stroke="#fff3e0" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'potion-medium':
      // Mikstura Średniego HP — różowa
      return (
        <svg {...common}>
          <rect x="26" y="6" width="12" height="10" fill="#8a5a2a" stroke={ink} strokeWidth="2.5" />
          <rect x="24" y="14" width="16" height="6" fill="#c8b890" stroke={ink} strokeWidth="2.5" />
          <path d="M22 20 L42 20 L48 40 Q48 56 32 56 Q16 56 16 40 Z" fill="#f0b8c8" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M22 20 L42 20 L44 32 Q40 28 32 30 Q24 28 20 32 Z" fill="#f8d0d8" stroke={ink} strokeWidth="2" />
          <path d="M32 38 L32 48 M27 43 L37 43" stroke="#c83232" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="28" cy="48" r="1" fill="#fff" opacity="0.8" />
        </svg>
      );
    // ========== Rings ==========
    case 'ring-whisper':
      // Pierścień Szeptu — srebrny z uchem
      return (
        <svg {...common}>
          <circle cx="32" cy="40" r="18" fill="none" stroke="#c8c8c8" strokeWidth="6" />
          <circle cx="32" cy="40" r="18" fill="none" stroke={ink} strokeWidth="3" />
          <circle cx="32" cy="40" r="14" fill="none" stroke={ink} strokeWidth="2" />
          {/* ucho */}
          <path d="M28 8 Q22 12 24 22 Q26 28 32 26 L32 20 Q36 18 34 12 Q30 6 28 8 Z" fill="#f0c090" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M28 14 Q30 16 28 18" stroke={ink} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'ring-flight':
      // Pierścień Lotu — pierścień ze skrzydłem
      return (
        <svg {...common}>
          <circle cx="32" cy="40" r="18" fill="none" stroke="#d4a24c" strokeWidth="6" />
          <circle cx="32" cy="40" r="18" fill="none" stroke={ink} strokeWidth="3" />
          <circle cx="32" cy="40" r="14" fill="none" stroke={ink} strokeWidth="2" />
          {/* skrzydło */}
          <path d="M32 6 Q16 8 14 22 Q20 20 24 18 Q22 22 22 28 Q28 24 32 22 Q36 24 42 28 Q42 22 40 18 Q44 20 50 22 Q48 8 32 6 Z" fill="#f5eed8" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M22 18 L32 16 L42 18" stroke={ink} strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'ring-wraith':
      // Pierścień Widma — przezroczysty z czaszką
      return (
        <svg {...common}>
          <circle cx="32" cy="40" r="18" fill="none" stroke="#8a8aa0" strokeWidth="6" opacity="0.7" />
          <circle cx="32" cy="40" r="18" fill="none" stroke={ink} strokeWidth="3" />
          <circle cx="32" cy="40" r="14" fill="none" stroke={ink} strokeWidth="2" />
          {/* mini czaszka w środku */}
          <circle cx="32" cy="40" r="6" fill="#f5eed8" stroke={ink} strokeWidth="2" opacity="0.8" />
          <circle cx="30" cy="40" r="1.2" fill={ink} />
          <circle cx="34" cy="40" r="1.2" fill={ink} />
          <path d="M30 43 L34 43" stroke={ink} strokeWidth="1" />
          {/* klejnot u góry */}
          <path d="M24 20 L32 10 L40 20 L32 28 Z" fill="#a04ef0" stroke={ink} strokeWidth="2.5" opacity="0.7" strokeLinejoin="round" />
        </svg>
      );
    case 'ring-wisdom':
      // Pierścień Wymowy — pierścień z ustami / zwojem
      return (
        <svg {...common}>
          <circle cx="32" cy="40" r="18" fill="none" stroke="#ffc830" strokeWidth="6" />
          <circle cx="32" cy="40" r="18" fill="none" stroke={ink} strokeWidth="3" />
          <circle cx="32" cy="40" r="14" fill="none" stroke={ink} strokeWidth="2" />
          {/* zwój na górze */}
          <rect x="22" y="8" width="20" height="14" fill="#f0e0b0" stroke={ink} strokeWidth="2.5" rx="2" />
          <path d="M26 14 L38 14 M26 18 L36 18" stroke={ink} strokeWidth="1.5" />
          <circle cx="42" cy="10" r="2.5" fill="#c83232" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'ring-hobgoblin':
      // Pierścień Hobgoblin Kinga — złoto z zieloną czaszką
      return (
        <svg {...common}>
          <circle cx="32" cy="40" r="18" fill="none" stroke="#ffc830" strokeWidth="7" />
          <circle cx="32" cy="40" r="18" fill="none" stroke={ink} strokeWidth="3" />
          <circle cx="32" cy="40" r="14" fill="none" stroke={ink} strokeWidth="2" />
          {/* klejnot szmaragd */}
          <path d="M22 12 L32 4 L42 12 L32 26 Z" fill="#4a7c3a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M26 14 L38 14" stroke={ink} strokeWidth="2" />
          <path d="M28 18 L36 18" stroke={ink} strokeWidth="1.5" />
          {/* błysk */}
          <path d="M28 10 L30 12" stroke="#fff" strokeWidth="2" opacity="0.7" />
        </svg>
      );
    case 'ring-father':
      // Pierścień Ojca Tadeusza — święty, ze znakiem krzyża
      return (
        <svg {...common}>
          <circle cx="32" cy="40" r="18" fill="none" stroke="#d4a24c" strokeWidth="6" />
          <circle cx="32" cy="40" r="18" fill="none" stroke={ink} strokeWidth="3" />
          <circle cx="32" cy="40" r="14" fill="none" stroke={ink} strokeWidth="2" />
          {/* krzyż na szczycie */}
          <rect x="30" y="6" width="4" height="20" fill="#ffc830" stroke={ink} strokeWidth="2" />
          <rect x="24" y="12" width="16" height="4" fill="#ffc830" stroke={ink} strokeWidth="2" />
          {/* aureola */}
          <circle cx="32" cy="16" r="10" fill="none" stroke="#ffc830" strokeWidth="1.5" opacity="0.7" />
        </svg>
      );
    // ========== Necklaces / amulets / chains ==========
    case 'amulet-rodent':
      // Amulet Gryzonia — kolor brązowy z łapką/ząbkiem
      return (
        <svg {...common}>
          <path d="M16 12 Q32 30 48 12" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="20" cy="20" r="2.5" fill="#8a5a2a" stroke={ink} strokeWidth="1.5" />
          <circle cx="26" cy="26" r="2.5" fill="#8a5a2a" stroke={ink} strokeWidth="1.5" />
          <circle cx="38" cy="26" r="2.5" fill="#8a5a2a" stroke={ink} strokeWidth="1.5" />
          <circle cx="44" cy="20" r="2.5" fill="#8a5a2a" stroke={ink} strokeWidth="1.5" />
          {/* zawieszka — łapka/ząb */}
          <path d="M32 28 Q24 36 28 46 Q32 52 36 46 Q40 36 32 28 Z" fill="#f5eed8" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="28" cy="40" r="1.5" fill={ink} />
          <circle cx="36" cy="40" r="1.5" fill={ink} />
          <path d="M30 48 L34 48" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'amulet-catacombs':
      // Amulet Katakumb — czarny z fioletowym klejnotem
      return (
        <svg {...common}>
          <path d="M16 12 Q32 30 48 12" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="20" cy="20" r="2.5" fill="#3a3a3a" stroke={ink} strokeWidth="1.5" />
          <circle cx="26" cy="26" r="2.5" fill="#3a3a3a" stroke={ink} strokeWidth="1.5" />
          <circle cx="38" cy="26" r="2.5" fill="#3a3a3a" stroke={ink} strokeWidth="1.5" />
          <circle cx="44" cy="20" r="2.5" fill="#3a3a3a" stroke={ink} strokeWidth="1.5" />
          {/* zawieszka — sarkofag */}
          <rect x="24" y="30" width="16" height="24" fill="#4a3a5a" stroke={ink} strokeWidth="3" />
          <path d="M24 30 L32 24 L40 30" fill="#6a4a7a" stroke={ink} strokeWidth="2.5" />
          <circle cx="32" cy="42" r="3" fill="#a04ef0" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'amulet-shaman':
      // Amulet Szamana — wiązane pióra i zęby
      return (
        <svg {...common}>
          <path d="M16 12 Q32 30 48 12" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* wiązanie pośrodku */}
          <rect x="26" y="24" width="12" height="10" fill="#6a3a1a" stroke={ink} strokeWidth="2.5" />
          {/* ząb */}
          <path d="M32 34 L28 52 L32 56 L36 52 Z" fill="#f5eed8" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          {/* pióra po bokach */}
          <path d="M22 28 L14 36 L22 34 Z" fill="#c83232" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M42 28 L50 36 L42 34 Z" fill="#4a7c3a" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M32 26 L32 32" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'chain-crown':
      // Łańcuch Koronny — ciężki złoty łańcuch z medalionem w kształcie korony
      return (
        <svg {...common}>
          {/* łańcuch — grube ogniwa */}
          <ellipse cx="16" cy="14" rx="4" ry="3" fill="none" stroke="#ffc830" strokeWidth="3" />
          <ellipse cx="16" cy="14" rx="4" ry="3" fill="none" stroke={ink} strokeWidth="1.5" />
          <ellipse cx="24" cy="20" rx="4" ry="3" fill="none" stroke="#ffc830" strokeWidth="3" />
          <ellipse cx="24" cy="20" rx="4" ry="3" fill="none" stroke={ink} strokeWidth="1.5" />
          <ellipse cx="40" cy="20" rx="4" ry="3" fill="none" stroke="#ffc830" strokeWidth="3" />
          <ellipse cx="40" cy="20" rx="4" ry="3" fill="none" stroke={ink} strokeWidth="1.5" />
          <ellipse cx="48" cy="14" rx="4" ry="3" fill="none" stroke="#ffc830" strokeWidth="3" />
          <ellipse cx="48" cy="14" rx="4" ry="3" fill="none" stroke={ink} strokeWidth="1.5" />
          {/* medalion — miniatura korony */}
          <path d="M20 30 L22 42 L32 36 L42 42 L44 30 Z" fill="#ffc830" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <rect x="22" y="40" width="20" height="14" fill="#d4a24c" stroke={ink} strokeWidth="2.5" />
          <circle cx="32" cy="47" r="3" fill="#c83232" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    // ========== Boots ==========
    case 'boots-spider':
      // Buty Pająka — z odnóżami
      return (
        <svg {...common}>
          <path d="M14 10 L24 10 L26 36 L40 36 Q48 36 50 44 L52 54 Q52 58 48 58 L16 58 Q12 58 12 54 L12 36 Z" fill="#3a2a3a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M26 36 L50 44" stroke={ink} strokeWidth="2.5" />
          {/* pajęcze odnóża po bokach */}
          <path d="M14 28 Q6 24 4 32 M14 38 Q4 38 2 46 M14 48 Q4 50 2 58" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M50 50 Q60 46 62 54" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="20" cy="44" r="2" fill="#c83232" stroke={ink} strokeWidth="1.5" />
          <circle cx="32" cy="48" r="2" fill="#c83232" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'boots-smith':
      // Buty Kowalowej — ciężkie, kute, z okuciami
      return (
        <svg {...common}>
          <path d="M14 10 L24 10 L26 36 L40 36 Q48 36 50 44 L52 54 Q52 58 48 58 L16 58 Q12 58 12 54 L12 36 Z" fill="#5a4a3a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M26 36 L50 44" stroke={ink} strokeWidth="2.5" />
          {/* stalowe okucia */}
          <rect x="14" y="14" width="10" height="4" fill="#a8a8a8" stroke={ink} strokeWidth="2" />
          <rect x="12" y="52" width="40" height="6" fill="#a8a8a8" stroke={ink} strokeWidth="2.5" />
          <circle cx="18" cy="55" r="1" fill={ink} />
          <circle cx="28" cy="55" r="1" fill={ink} />
          <circle cx="38" cy="55" r="1" fill={ink} />
          <circle cx="46" cy="55" r="1" fill={ink} />
          {/* młotek mały */}
          <rect x="40" y="24" width="8" height="5" fill="#8a5a2a" stroke={ink} strokeWidth="1.5" />
          <rect x="42" y="29" width="2" height="6" fill="#8a5a2a" stroke={ink} strokeWidth="1" />
        </svg>
      );
    // ========== Gloves ==========
    case 'gloves-rough':
      // Zgrzebne Rękawice — szare z łatami
      return (
        <svg {...common}>
          <path d="M18 20 L18 14 Q18 8 22 8 Q26 8 26 14 L26 18 L28 14 Q28 8 32 8 Q36 8 36 14 L36 18 L38 14 Q38 8 42 8 Q46 8 46 14 L46 18 L48 20 L48 40 Q48 56 32 56 Q16 56 16 40 Z" fill="#8a7a6a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <rect x="14" y="40" width="36" height="8" fill="#5a4a3a" stroke={ink} strokeWidth="2.5" />
          {/* łata */}
          <rect x="24" y="28" width="8" height="8" fill="#3a2a1a" stroke={ink} strokeWidth="1.5" />
          <path d="M24 28 L32 36 M32 28 L24 36" stroke={ink} strokeWidth="1" />
          <path d="M22 28 L28 28 M24 36 L30 36 M38 30 L40 34" stroke={ink} strokeWidth="1.5" opacity="0.4" />
        </svg>
      );
    case 'wand-donut':
      // Różdżka Pączka — "Pachnie ciastem. Działa."
      return (
        <svg {...common}>
          <rect x="30" y="30" width="4" height="30" fill="#8a5a2a" stroke={ink} strokeWidth="2.5" />
          <rect x="28" y="54" width="8" height="6" fill="#6a3a1a" stroke={ink} strokeWidth="2" />
          {/* pączek */}
          <circle cx="32" cy="20" r="14" fill="#d4a24c" stroke={ink} strokeWidth="3" />
          <circle cx="32" cy="20" r="5" fill="#f5eed8" stroke={ink} strokeWidth="2.5" />
          {/* różowy lukier */}
          <path
            d="M18 18 Q22 10 28 14 Q32 8 36 14 Q42 10 46 18 Q44 22 40 20 Q36 14 32 20 Q28 14 24 20 Q20 22 18 18 Z"
            fill="#f0b8c8"
            stroke={ink}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* posypka */}
          <circle cx="24" cy="14" r="1.2" fill="#c83232" />
          <circle cx="30" cy="11" r="1.2" fill="#ffc830" />
          <circle cx="38" cy="12" r="1.2" fill="#6ac8f0" />
          <circle cx="42" cy="16" r="1.2" fill="#a04ef0" />
        </svg>
      );
    case 'wand-student':
      // Różdżka Ucznia — "Drewniana, ale próbuje."
      return (
        <svg {...common}>
          <rect x="30" y="10" width="4" height="44" fill="#8a5a2a" stroke={ink} strokeWidth="2.5" />
          {/* rzemień / grip */}
          <rect x="28" y="46" width="8" height="12" fill="#6a3a1a" stroke={ink} strokeWidth="2" />
          <path d="M28 50 L36 50 M28 54 L36 54" stroke={ink} strokeWidth="1.5" />
          {/* końcówka z iskrą */}
          <path
            d="M32 4 L35 10 L32 16 L29 10 Z"
            fill="#ffdc70"
            stroke={ink}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* listek (uczeń próbuje) */}
          <path
            d="M34 14 Q44 14 42 22 Q36 22 34 18 Z"
            fill="#4a7c3a"
            stroke={ink}
            strokeWidth="2"
          />
          <path d="M34 16 Q38 18 40 20" stroke={ink} strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'wand-shaman':
      // Różdżka Szamana — "Wieczorem świeci."
      return (
        <svg {...common}>
          <rect x="30" y="20" width="4" height="40" fill="#5a3a1a" stroke={ink} strokeWidth="2.5" />
          <rect x="28" y="54" width="8" height="6" fill="#2a1810" stroke={ink} strokeWidth="2" />
          {/* wiązanie skórzane */}
          <rect x="26" y="22" width="12" height="6" fill="#8a5a2a" stroke={ink} strokeWidth="2" />
          {/* pióra po bokach */}
          <path
            d="M22 24 L14 32 L22 30 Z"
            fill="#c83232"
            stroke={ink}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M42 24 L50 32 L42 30 Z"
            fill="#4a7c3a"
            stroke={ink}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* kryształ świecący */}
          <path
            d="M32 4 L40 14 L32 22 L24 14 Z"
            fill="#a04ef0"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M24 14 L40 14" stroke={ink} strokeWidth="2" />
          {/* aureola */}
          <circle cx="32" cy="14" r="15" fill="none" stroke="#d890ff" strokeWidth="1.5" opacity="0.5" />
        </svg>
      );
    case 'wand-dawn':
      // Różdżka Świtu — "Iskrzy przy poranku."
      return (
        <svg {...common}>
          <rect x="30" y="22" width="4" height="36" fill="#d4a24c" stroke={ink} strokeWidth="2.5" />
          <rect x="28" y="54" width="8" height="6" fill="#8a5a2a" stroke={ink} strokeWidth="2" />
          {/* promienie słońca */}
          <path
            d="M32 4 L34 14 L42 8 L38 18 L48 14 L40 22 L52 24 L40 26 L48 34 L38 30 L42 40 L34 34 L32 44 L30 34 L22 40 L26 30 L16 34 L24 26 L12 24 L24 22 L16 14 L26 18 L22 8 L30 14 Z"
            fill="#ffc830"
            stroke={ink}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="24" r="6" fill="#fff3e0" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'staff-spy':
      // Kostur Szpiega — "Szepcze to, co inni myślą."
      return (
        <svg {...common}>
          <rect x="28" y="30" width="8" height="30" fill="#8a5a2a" stroke={ink} strokeWidth="2.5" />
          <rect x="22" y="56" width="20" height="6" fill="#6a3a1a" stroke={ink} strokeWidth="2.5" />
          <rect x="26" y="40" width="12" height="4" fill="#d4a24c" stroke={ink} strokeWidth="2" />
          {/* duże ucho */}
          <path
            d="M20 10 Q10 14 12 26 Q14 34 22 34 L22 42 Q22 46 28 44 L28 32 Q36 30 36 20 Q36 8 26 8 Q22 8 20 10 Z"
            fill="#f0c090"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M22 18 Q28 18 30 22 Q30 28 24 28"
            stroke={ink}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'staff-headless':
      // Kostur Bezgłowy — "Czasami sam sobie coś mruczy."
      return (
        <svg {...common}>
          <rect x="28" y="10" width="8" height="48" fill="#8a5a2a" stroke={ink} strokeWidth="2.5" />
          <rect x="22" y="56" width="20" height="6" fill="#6a3a1a" stroke={ink} strokeWidth="2.5" />
          {/* uciete zakończenie z drzazgami */}
          <path
            d="M28 10 L30 6 L32 10 L34 4 L36 10 Z"
            fill="#6a3a1a"
            stroke={ink}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* złoty okuż */}
          <rect x="26" y="14" width="12" height="4" fill="#d4a24c" stroke={ink} strokeWidth="2" />
          <rect x="26" y="42" width="12" height="4" fill="#d4a24c" stroke={ink} strokeWidth="2" />
          {/* usta szepczące (z boku kostura) */}
          <ellipse cx="32" cy="30" rx="4" ry="2" fill="#c83232" stroke={ink} strokeWidth="2" />
          <path d="M29 30 L35 30" stroke={ink} strokeWidth="1" />
          {/* ślad mruczenia */}
          <path
            d="M40 28 Q44 26 42 32"
            stroke={ink}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M42 22 Q46 20 44 26"
            stroke={ink}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.4"
          />
        </svg>
      );
    case 'staff-echo':
      // Kostur Echa — "Nigdy nie odpowiada od razu."
      return (
        <svg {...common}>
          <rect x="28" y="32" width="8" height="28" fill="#8a5a2a" stroke={ink} strokeWidth="2.5" />
          <rect x="22" y="56" width="20" height="6" fill="#6a3a1a" stroke={ink} strokeWidth="2.5" />
          <rect x="26" y="42" width="12" height="4" fill="#d4a24c" stroke={ink} strokeWidth="2" />
          {/* pierścienie echa — coraz większe, przezroczyste */}
          <circle cx="32" cy="20" r="6" fill="#6ac8f0" stroke={ink} strokeWidth="2.5" />
          <circle cx="32" cy="20" r="11" fill="none" stroke={ink} strokeWidth="2" opacity="0.6" />
          <circle cx="32" cy="20" r="16" fill="none" stroke={ink} strokeWidth="1.5" opacity="0.35" />
          <circle cx="32" cy="20" r="22" fill="none" stroke={ink} strokeWidth="1" opacity="0.18" />
          <circle cx="30" cy="18" r="1.5" fill="#fff" opacity="0.8" />
        </svg>
      );
    case 'staff-sabbath':
      // Kostur Mrocznego Sabatu — "Przy pełni mruczy."
      return (
        <svg {...common}>
          <rect x="28" y="32" width="8" height="28" fill="#2a1810" stroke={ink} strokeWidth="2.5" />
          <rect x="22" y="56" width="20" height="6" fill="#1a0810" stroke={ink} strokeWidth="2.5" />
          <rect x="26" y="42" width="12" height="4" fill="#6a3a8a" stroke={ink} strokeWidth="2" />
          {/* księżyc w nowiu */}
          <circle cx="32" cy="20" r="14" fill="#f5eed8" stroke={ink} strokeWidth="3" />
          <circle cx="38" cy="18" r="11" fill="#2a1a4a" stroke={ink} strokeWidth="3" />
          {/* kratery */}
          <circle cx="26" cy="16" r="1.5" fill="#c0b8a0" />
          <circle cx="30" cy="24" r="1" fill="#c0b8a0" />
          <circle cx="24" cy="22" r="0.8" fill="#c0b8a0" />
          {/* nietoperz mały */}
          <path
            d="M14 36 Q18 32 20 36 Q22 32 26 36 L22 40 L18 40 Z"
            fill={ink}
            stroke={ink}
            strokeWidth="1.5"
          />
        </svg>
      );
    case 'staff-throne':
      // Kostur Tronowy — "Głosi wyroki za ciebie."
      return (
        <svg {...common}>
          <rect x="28" y="28" width="8" height="32" fill="#8a5a2a" stroke={ink} strokeWidth="2.5" />
          <rect x="22" y="56" width="20" height="6" fill="#6a3a1a" stroke={ink} strokeWidth="2.5" />
          <rect x="26" y="40" width="12" height="4" fill="#d4a24c" stroke={ink} strokeWidth="2" />
          {/* mini tron na szczycie */}
          <rect x="18" y="14" width="28" height="16" fill="#a04ef0" stroke={ink} strokeWidth="3" />
          <rect x="14" y="10" width="4" height="20" fill="#a04ef0" stroke={ink} strokeWidth="2.5" />
          <rect x="46" y="10" width="4" height="20" fill="#a04ef0" stroke={ink} strokeWidth="2.5" />
          <path
            d="M14 10 L16 4 L18 10 M46 10 L48 4 L50 10"
            stroke={ink}
            strokeWidth="2.5"
            fill="#ffc830"
            strokeLinejoin="round"
          />
          {/* oparcie */}
          <path
            d="M18 14 L24 6 L40 6 L46 14"
            fill="#6a3a8a"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="22" r="3" fill="#ffc830" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'staff-chaos':
      // Kostur Chaosu — "Emituje złe wibracje."
      return (
        <svg {...common}>
          <rect x="28" y="32" width="8" height="28" fill="#2a1a4a" stroke={ink} strokeWidth="2.5" />
          <rect x="22" y="56" width="20" height="6" fill="#1a0830" stroke={ink} strokeWidth="2.5" />
          <rect x="26" y="42" width="12" height="4" fill="#c83232" stroke={ink} strokeWidth="2" />
          {/* chaotyczna masa spiralna */}
          <circle cx="32" cy="20" r="14" fill="#a04ef0" stroke={ink} strokeWidth="3" />
          <path
            d="M32 8 Q42 12 42 20 Q42 28 32 32 Q22 28 22 20 Q22 12 32 8 Z"
            fill="none"
            stroke="#c83232"
            strokeWidth="3"
          />
          <path
            d="M26 14 Q36 10 40 18 Q38 26 28 28 Q22 22 26 14 Z"
            fill="none"
            stroke="#ffc830"
            strokeWidth="2.5"
          />
          {/* pęknięcia */}
          <path d="M26 12 L24 8 M40 16 L46 12 M38 26 L44 30 M26 28 L22 34" stroke={ink} strokeWidth="2" />
          <circle cx="32" cy="20" r="2.5" fill="#fff" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'staff-void':
      // Kostur z Pustki — "Trzyma się sam. Szepcze twoje imię."
      return (
        <svg {...common}>
          {/* dziwna ciemna mgła u dołu — brak realnej podstawy, kostur się unosi */}
          <path
            d="M18 58 Q22 52 26 58 Q30 50 34 58 Q38 50 42 58 Q46 52 50 58"
            stroke={ink}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M20 62 Q26 56 32 62 Q38 56 44 62"
            stroke={ink}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.45"
          />
          {/* shaft zawieszony */}
          <rect x="28" y="22" width="8" height="30" fill="#3a2a6a" stroke={ink} strokeWidth="2.5" />
          <rect x="26" y="34" width="12" height="4" fill="#a04ef0" stroke={ink} strokeWidth="2" />
          {/* czarna kula z oczkiem */}
          <circle cx="32" cy="18" r="12" fill={ink} stroke={ink} strokeWidth="3" />
          <circle cx="32" cy="18" r="12" fill="none" stroke="#a04ef0" strokeWidth="1.5" opacity="0.6" />
          <circle cx="29" cy="16" r="3.5" fill="#fff" />
          <circle cx="29.5" cy="16.5" r="1.8" fill={ink} />
          {/* szept jako fale */}
          <path
            d="M44 20 Q48 22 46 26 M44 14 Q50 12 48 18"
            stroke="#a04ef0"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'orb-dice':
      // Orb Impowej Igraszki — "Gra w kości sam ze sobą."
      return (
        <svg {...common}>
          <rect x="28" y="30" width="8" height="30" fill="#3a2a6a" stroke={ink} strokeWidth="2.5" />
          <rect x="22" y="56" width="20" height="6" fill="#8a5a2a" stroke={ink} strokeWidth="2.5" />
          <path
            d="M20 28 Q20 18 32 18 Q44 18 44 28 L40 28 Q40 22 32 22 Q24 22 24 28 Z"
            fill="#8a5a2a"
            stroke={ink}
            strokeWidth="2.5"
          />
          {/* orb jako kostka */}
          <rect x="18" y="6" width="28" height="24" fill="#c83232" stroke={ink} strokeWidth="3" rx="4" />
          {/* face 5 */}
          <circle cx="24" cy="12" r="1.8" fill="#fff3e0" />
          <circle cx="40" cy="12" r="1.8" fill="#fff3e0" />
          <circle cx="32" cy="18" r="1.8" fill="#ffc830" />
          <circle cx="24" cy="24" r="1.8" fill="#fff3e0" />
          <circle cx="40" cy="24" r="1.8" fill="#fff3e0" />
          {/* impowe iskry */}
          <path d="M12 6 L14 8 L12 10 L10 8 Z" fill="#a04ef0" stroke={ink} strokeWidth="1.5" />
          <path d="M50 10 L52 12 L50 14 L48 12 Z" fill="#ffc830" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'orb-dawn':
      // Orb Świtu — "Ciepły o poranku."
      return (
        <svg {...common}>
          <rect x="28" y="30" width="8" height="30" fill="#6a3a1a" stroke={ink} strokeWidth="2.5" />
          <rect x="22" y="56" width="20" height="6" fill="#3a2a1a" stroke={ink} strokeWidth="2.5" />
          <path
            d="M20 28 Q20 18 32 18 Q44 18 44 28 L40 28 Q40 22 32 22 Q24 22 24 28 Z"
            fill="#d4a24c"
            stroke={ink}
            strokeWidth="2.5"
          />
          {/* orb — gradient świtu (jasny dół → ciemny góra) */}
          <circle cx="32" cy="16" r="13" fill="#ffc830" stroke={ink} strokeWidth="3" />
          <path
            d="M19 16 Q32 28 45 16 L45 20 Q32 30 19 20 Z"
            fill="#e04848"
            stroke={ink}
            strokeWidth="2"
          />
          <path
            d="M22 10 Q32 14 42 10"
            stroke="#fff3e0"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.8"
          />
          {/* promyki */}
          <path
            d="M10 12 L14 14 M50 12 L46 14 M8 20 L12 20 M52 20 L48 20"
            stroke="#ffc830"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'scepter-void':
      // Berło Pustki — "Pije światło wokół siebie."
      return (
        <svg {...common}>
          <rect x="28" y="28" width="8" height="32" fill="#1a0830" stroke={ink} strokeWidth="2.5" />
          <rect x="22" y="56" width="20" height="6" fill={ink} strokeWidth="2.5" />
          <rect x="26" y="40" width="12" height="4" fill="#a04ef0" stroke={ink} strokeWidth="2" />
          {/* czarna sfera centralna */}
          <circle cx="32" cy="18" r="12" fill={ink} stroke={ink} strokeWidth="3" />
          {/* światło wciągane w sferę */}
          <path
            d="M8 4 Q16 14 22 18"
            stroke="#ffc830"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M56 4 Q48 14 42 18"
            stroke="#ffc830"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M4 30 Q14 24 22 20"
            stroke="#ffc830"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M60 30 Q50 24 42 20"
            stroke="#ffc830"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.8"
          />
          <circle cx="32" cy="16" r="2" fill="#a04ef0" />
        </svg>
      );
    case 'scepter-throne':
      // Berło Tronu — "Wydaje wyroki zanim pomyślisz o nich."
      return (
        <svg {...common}>
          <rect x="28" y="26" width="8" height="34" fill="#d4a24c" stroke={ink} strokeWidth="2.5" />
          <rect x="22" y="56" width="20" height="6" fill="#8a5a2a" stroke={ink} strokeWidth="2.5" />
          <rect x="26" y="38" width="12" height="4" fill="#c83232" stroke={ink} strokeWidth="2" />
          {/* ornament królewski — korona z klejnotami */}
          <path
            d="M16 20 L16 10 L24 16 L32 4 L40 16 L48 10 L48 20 Z"
            fill="#ffc830"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <rect x="16" y="20" width="32" height="6" fill="#d4a24c" stroke={ink} strokeWidth="2.5" />
          {/* klejnoty */}
          <circle cx="24" cy="23" r="2" fill="#c83232" stroke={ink} strokeWidth="1.5" />
          <circle cx="32" cy="23" r="2.5" fill="#6ac8f0" stroke={ink} strokeWidth="1.5" />
          <circle cx="40" cy="23" r="2" fill="#4a7c3a" stroke={ink} strokeWidth="1.5" />
          <circle cx="32" cy="10" r="2" fill="#a04ef0" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'scythe-troll':
      // Kosa Trolla — "Zbiera mgłę ze stawu."
      return (
        <svg {...common}>
          {/* shaft kosy */}
          <rect
            x="30"
            y="14"
            width="5"
            height="46"
            fill="#6a3a1a"
            stroke={ink}
            strokeWidth="2.5"
          />
          <rect x="24" y="56" width="17" height="6" fill="#3a2a1a" stroke={ink} strokeWidth="2.5" />
          {/* ostrze mgliste, zakrzywione */}
          <path
            d="M32 14 Q4 8 10 22 Q16 28 30 24 Z"
            fill="#d0dcff"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
            opacity="0.9"
          />
          <path
            d="M32 16 Q10 14 14 22"
            stroke="#fff"
            strokeWidth="2"
            fill="none"
            opacity="0.8"
          />
          {/* mgła */}
          <path
            d="M6 32 Q12 28 18 32 Q24 28 30 32"
            stroke="#d0dcff"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M8 38 Q14 34 20 38"
            stroke="#d0dcff"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
          {/* wiązanie */}
          <rect x="28" y="24" width="9" height="5" fill="#3a5a8a" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'staff-chief':
      // Kostur Wodza — kostur zakończony głową koguta (flavor: "Szepcze kukuryku").
      return (
        <svg {...common}>
          {/* cień magiczny za głową */}
          <circle cx="30" cy="22" r="16" fill="#a04ef0" opacity="0.18" />
          {/* shaft */}
          <rect
            x="28"
            y="32"
            width="8"
            height="28"
            fill="#8a5a2a"
            stroke={ink}
            strokeWidth="2.5"
          />
          {/* base cap */}
          <rect
            x="22"
            y="56"
            width="20"
            height="6"
            fill="#6a3a1a"
            stroke={ink}
            strokeWidth="2.5"
          />
          {/* grip binding */}
          <rect
            x="26"
            y="42"
            width="12"
            height="4"
            fill="#d4a24c"
            stroke={ink}
            strokeWidth="2"
          />
          {/* rooster head body */}
          <ellipse
            cx="32"
            cy="24"
            rx="12"
            ry="10"
            fill="#f5eed8"
            stroke={ink}
            strokeWidth="3"
          />
          {/* comb */}
          <path
            d="M24 14 L26 6 L30 12 L33 4 L37 12 L40 6 L42 14 Z"
            fill="#c83232"
            stroke={ink}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* eye */}
          <circle cx="28" cy="23" r="2" fill={ink} />
          <circle cx="27.4" cy="22.4" r="0.6" fill="#fff" />
          {/* beak — wystaje w prawo */}
          <path
            d="M44 22 L52 24 L44 26 Z"
            fill="#ffc830"
            stroke={ink}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* wattle */}
          <path
            d="M42 28 Q46 32 42 36 Q40 33 40 29 Z"
            fill="#c83232"
            stroke={ink}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* magic sparkles (legendary tier) */}
          <path
            d="M10 12 L12 14 L10 16 L8 14 Z"
            fill="#a04ef0"
            stroke={ink}
            strokeWidth="1.5"
          />
          <path
            d="M54 40 L56 42 L54 44 L52 42 Z"
            fill="#a04ef0"
            stroke={ink}
            strokeWidth="1.5"
          />
          <circle cx="50" cy="10" r="1.8" fill="#ffc830" stroke={ink} strokeWidth="1" />
          <circle cx="14" cy="38" r="1.5" fill="#ffc830" />
          <path
            d="M6 24 Q8 26 6 28"
            stroke="#a04ef0"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'pill':
      return (
        <svg {...common}>
          <path
            d="M10 32 Q10 16 26 16 L38 16 Q54 16 54 32 Q54 48 38 48 L26 48 Q10 48 10 32 Z"
            fill="#f0b8c8"
            stroke={ink}
            strokeWidth="3"
          />
          <path d="M32 16 L32 48" stroke={ink} strokeWidth="3" />
          <path
            d="M10 32 Q10 16 26 16 L32 16 L32 48 L26 48 Q10 48 10 32 Z"
            fill="#f5eed8"
            stroke={ink}
            strokeWidth="3"
          />
          <path d="M14 24 L18 26 M16 34 L20 32" stroke="#fff" strokeWidth="2" opacity="0.6" />
          <path
            d="M40 28 Q42 30 44 28 M38 36 Q40 38 42 36"
            stroke="#c83232"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      );
    case 'boots':
      return (
        <svg {...common}>
          <path
            d="M14 10 L24 10 L26 36 L40 36 Q48 36 50 44 L52 54 Q52 58 48 58 L16 58 Q12 58 12 54 L12 36 Z"
            fill="#6a3a1a"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M26 36 L50 44" stroke={ink} strokeWidth="2.5" />
          <rect x="14" y="14" width="10" height="4" fill="#d4a24c" stroke={ink} strokeWidth="2" />
          <circle cx="30" cy="44" r="2" fill="#d4a24c" stroke={ink} strokeWidth="1.5" />
          <circle cx="40" cy="48" r="2" fill="#d4a24c" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'shield-item':
      return (
        <svg {...common}>
          <path
            d="M32 4 L10 12 L10 34 Q10 50 32 60 Q54 50 54 34 L54 12 Z"
            fill="#3a5a8a"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M32 14 L32 52 M14 32 L50 32" stroke="#d4a24c" strokeWidth="3.5" />
          <circle cx="32" cy="32" r="5" fill="#d4a24c" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'chestplate':
      return (
        <svg {...common}>
          <path
            d="M6 18 Q14 10 22 14 L22 28 L10 28 Z"
            fill="#8a8a8a"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M58 18 Q50 10 42 14 L42 28 L54 28 Z"
            fill="#8a8a8a"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M16 16 L48 16 L52 30 L48 54 Q40 58 32 58 Q24 58 16 54 L12 30 Z"
            fill="#a8a8a0"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M26 16 Q32 22 38 16" stroke={ink} strokeWidth="3" fill="none" />
          <path d="M32 22 L32 54" stroke={ink} strokeWidth="2" opacity="0.5" />
          <path d="M20 30 Q32 36 44 30" stroke={ink} strokeWidth="2" fill="none" opacity="0.5" />
          <circle cx="32" cy="38" r="5" fill="#c83232" stroke={ink} strokeWidth="2.5" />
          <circle cx="18" cy="26" r="1.5" fill={ink} />
          <circle cx="46" cy="26" r="1.5" fill={ink} />
          <circle cx="20" cy="50" r="1.5" fill={ink} />
          <circle cx="44" cy="50" r="1.5" fill={ink} />
        </svg>
      );
    case 'gloves':
      return (
        <svg {...common}>
          <path
            d="M18 20 L18 14 Q18 8 22 8 Q26 8 26 14 L26 18 L28 14 Q28 8 32 8 Q36 8 36 14 L36 18 L38 14 Q38 8 42 8 Q46 8 46 14 L46 18 L48 20 L48 40 Q48 56 32 56 Q16 56 16 40 Z"
            fill="#8a5a2a"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <rect x="14" y="40" width="36" height="8" fill="#d4a24c" stroke={ink} strokeWidth="2.5" />
          <path d="M22 28 L28 28 M36 28 L42 28" stroke={ink} strokeWidth="1.5" opacity="0.5" />
        </svg>
      );
    case 'ring':
      return (
        <svg {...common}>
          <circle cx="32" cy="40" r="18" fill="none" stroke="#ffc830" strokeWidth="6" />
          <circle cx="32" cy="40" r="18" fill="none" stroke={ink} strokeWidth="3" />
          <circle cx="32" cy="40" r="14" fill="none" stroke={ink} strokeWidth="2" />
          <path
            d="M24 20 L32 12 L40 20 L32 28 Z"
            fill="#6ac8f0"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M28 18 L32 14 L36 18 L32 22 Z" fill="#a0e0ff" />
        </svg>
      );
    case 'necklace':
      return (
        <svg {...common}>
          <path
            d="M16 12 Q32 30 48 12"
            stroke={ink}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="20" cy="20" r="2.5" fill="#d4a24c" stroke={ink} strokeWidth="1.5" />
          <circle cx="26" cy="26" r="2.5" fill="#d4a24c" stroke={ink} strokeWidth="1.5" />
          <circle cx="38" cy="26" r="2.5" fill="#d4a24c" stroke={ink} strokeWidth="1.5" />
          <circle cx="44" cy="20" r="2.5" fill="#d4a24c" stroke={ink} strokeWidth="1.5" />
          <path
            d="M32 28 L20 44 L32 58 L44 44 Z"
            fill="#c83232"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M32 32 L26 44 L32 52 L38 44 Z" fill="#ff6868" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'cheese':
      return (
        <svg {...common}>
          <path
            d="M6 42 L58 22 L58 38 L6 58 Z"
            fill="#ffc830"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M6 42 L58 22 L58 30 L6 50 Z" fill="#ffdc70" stroke={ink} strokeWidth="2" />
          <circle cx="22" cy="44" r="3" fill="#8a5a2a" stroke={ink} strokeWidth="1.5" />
          <circle cx="38" cy="36" r="2.5" fill="#8a5a2a" stroke={ink} strokeWidth="1.5" />
          <circle cx="48" cy="30" r="2" fill="#8a5a2a" stroke={ink} strokeWidth="1.5" />
          <circle cx="16" cy="52" r="2" fill="#8a5a2a" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'rock':
      return (
        <svg {...common}>
          <path
            d="M8 44 L12 28 L22 18 L40 14 L54 24 L56 42 L48 54 L18 52 Z"
            fill="#8a8a8a"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M22 18 L28 30 L18 38 Z" fill="#aaaaaa" />
          <path d="M40 14 L48 24 L38 28 Z" fill="#aaaaaa" />
          <path d="M16 46 L22 50 M40 46 L46 48" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'fire':
      return (
        <svg {...common}>
          <path
            d="M32 4 Q18 18 22 32 Q14 28 14 40 Q14 56 32 60 Q50 56 50 40 Q50 28 42 32 Q46 18 32 4 Z"
            fill="#e04848"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M32 20 Q24 30 28 40 Q22 38 22 46 Q22 54 32 56 Q42 54 42 46 Q42 38 36 40 Q40 30 32 20 Z"
            fill="#ffc830"
            stroke={ink}
            strokeWidth="2"
          />
          <path d="M32 36 Q28 42 30 48 Q34 48 34 44 Q36 44 34 36 Z" fill="#fff3e0" />
        </svg>
      );
    case 'crown':
      return (
        <svg {...common}>
          <path
            d="M8 20 L8 44 L56 44 L56 20 L44 28 L32 12 L20 28 Z"
            fill="#ffc830"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <rect x="8" y="44" width="48" height="8" fill="#d4a24c" stroke={ink} strokeWidth="3" />
          <circle cx="32" cy="12" r="3" fill="#c83232" stroke={ink} strokeWidth="2" />
          <circle cx="8" cy="20" r="3" fill="#6ac8f0" stroke={ink} strokeWidth="2" />
          <circle cx="56" cy="20" r="3" fill="#6ac8f0" stroke={ink} strokeWidth="2" />
          <circle cx="20" cy="48" r="2" fill="#c83232" />
          <circle cx="32" cy="48" r="2" fill="#4a7c3a" />
          <circle cx="44" cy="48" r="2" fill="#6ac8f0" />
        </svg>
      );
    case 'bolt':
      return (
        <svg {...common}>
          <path
            d="M36 4 L14 36 L28 36 L22 60 L50 24 L34 24 L42 4 Z"
            fill="#ffc830"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'spark':
      return (
        <svg {...common}>
          <path
            d="M32 4 L36 28 L60 32 L36 36 L32 60 L28 36 L4 32 L28 28 Z"
            fill="#ffc830"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="32" r="4" fill="#fff3e0" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg {...common}>
          <path
            d="M12 26 L40 26 L40 14 L58 32 L40 50 L40 38 L12 38 Z"
            fill="#d4a24c"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'lock':
      return (
        <svg {...common}>
          <path
            d="M18 28 L18 20 Q18 8 32 8 Q46 8 46 20 L46 28 L40 28 L40 20 Q40 14 32 14 Q24 14 24 20 L24 28 Z"
            fill="#8a8a8a"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <rect x="12" y="28" width="40" height="30" fill="#d4a24c" stroke={ink} strokeWidth="3" rx="3" />
          <circle cx="32" cy="40" r="4" fill={ink} />
          <rect x="30" y="42" width="4" height="8" fill={ink} />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="26" fill="#4a7c3a" stroke={ink} strokeWidth="3" />
          <path
            d="M18 32 L28 42 L46 22"
            stroke="#fff3e0"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'ear':
      return (
        <svg {...common}>
          <path
            d="M20 12 Q8 14 10 30 Q12 42 22 44 L22 54 Q22 58 28 58 Q34 58 34 52 L34 42 Q46 38 46 26 Q46 12 32 10 Q24 10 20 12 Z"
            fill="#f0c090"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M24 22 Q30 20 34 24 Q36 30 30 32 Q28 34 32 38"
            stroke={ink}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'handshake':
      return (
        <svg {...common}>
          <path
            d="M4 26 L20 18 L28 28 L36 20 L44 28 L60 20 L60 40 L44 46 L36 40 L28 46 L4 40 Z"
            fill="#f0c090"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M24 30 L32 36 M32 30 L40 36" stroke={ink} strokeWidth="2.5" fill="none" />
          <rect x="4" y="26" width="8" height="14" fill="#c83232" stroke={ink} strokeWidth="2.5" />
          <rect x="52" y="20" width="8" height="20" fill="#3a5a8a" stroke={ink} strokeWidth="2.5" />
        </svg>
      );
    case 'dice':
      return (
        <svg {...common}>
          <rect x="8" y="8" width="48" height="48" fill="#f5eed8" stroke={ink} strokeWidth="3" rx="6" />
          <circle cx="20" cy="20" r="3.5" fill={ink} />
          <circle cx="44" cy="20" r="3.5" fill={ink} />
          <circle cx="32" cy="32" r="3.5" fill="#c83232" />
          <circle cx="20" cy="44" r="3.5" fill={ink} />
          <circle cx="44" cy="44" r="3.5" fill={ink} />
        </svg>
      );
    case 'megaphone':
      return (
        <svg {...common}>
          <path
            d="M10 24 L10 40 L22 40 L46 52 L46 12 L22 24 Z"
            fill="#c83232"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <rect x="46" y="20" width="10" height="24" fill="#d4a24c" stroke={ink} strokeWidth="3" rx="2" />
          <path d="M22 24 L22 40" stroke={ink} strokeWidth="2.5" />
          <path d="M14 44 L14 54 L22 54 L22 44" fill="#c83232" stroke={ink} strokeWidth="2.5" />
        </svg>
      );
    case 'gold':
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="24" fill="#ffc830" stroke={ink} strokeWidth="3" />
          <circle cx="32" cy="32" r="18" fill="#d4a24c" stroke={ink} strokeWidth="2" />
          <text
            x="32"
            y="40"
            textAnchor="middle"
            fontFamily="Luckiest Guy, sans-serif"
            fontSize="22"
            fill={ink}
          >
            $
          </text>
        </svg>
      );
    case 'gem':
      return (
        <svg {...common}>
          <path
            d="M12 24 L32 6 L52 24 L32 58 Z"
            fill="#6ac8f0"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M12 24 L52 24" stroke={ink} strokeWidth="2.5" />
          <path d="M32 6 L32 24 M22 24 L32 6 M42 24 L32 6" stroke={ink} strokeWidth="1.5" />
          <path d="M32 24 L22 24 L28 40 Z" fill="#a0e0ff" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...common}>
          <path
            d="M32 56 Q8 40 8 22 Q8 10 18 10 Q26 10 32 18 Q38 10 46 10 Q56 10 56 22 Q56 40 32 56 Z"
            fill="#c83232"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M18 16 Q14 20 16 26"
            stroke="#fff"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      );
    case 'magic':
      return (
        <svg {...common}>
          <path
            d="M32 2 L36 20 L54 22 L42 32 L46 52 L32 42 L18 52 L22 32 L10 22 L28 20 Z"
            fill="#a04ef0"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="26" r="4" fill="#fff3e0" />
        </svg>
      );
    case 'horse':
      return (
        <svg {...common}>
          {/* Tułów + zad */}
          <path
            d="M8 38 Q8 30 16 30 L38 30 Q46 30 48 36 L54 36 Q58 36 58 40 L58 44 Q58 48 54 48 L48 48 L46 54 L40 54 L42 48 L22 48 L20 54 L14 54 L16 48 Q8 46 8 40 Z"
            fill="#b36a3e"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Szyja + głowa */}
          <path
            d="M8 38 L6 22 Q6 14 14 12 L22 10 Q26 10 26 14 L26 22 Q26 28 22 30"
            fill="#b36a3e"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Grzywa */}
          <path
            d="M10 22 Q8 26 10 30 M14 16 Q11 18 12 22 M18 12 Q16 14 17 18"
            stroke="#2a1810"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {/* Ucho */}
          <path d="M16 10 L18 6 L20 12 Z" fill={ink} />
          {/* Oko */}
          <circle cx="18" cy="18" r="1.6" fill={ink} />
          {/* Pysk */}
          <path d="M6 22 L4 24 L6 26" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Kopyta */}
          <rect x="14" y="52" width="6" height="4" fill={ink} />
          <rect x="40" y="52" width="6" height="4" fill={ink} />
          {/* Ogon */}
          <path
            d="M56 40 Q62 44 58 52"
            stroke={ink}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'pony':
      // Kucyk — niższy, zwalisty, szary, senny. Kciuk zwisa, ogon krótki.
      return (
        <svg {...common}>
          {/* Tułów — niższy, krótsze nogi */}
          <path
            d="M14 42 Q14 34 22 34 L40 34 Q46 34 48 40 L54 40 Q58 40 58 44 L58 46 Q58 50 54 50 L48 50 L46 56 L40 56 L42 50 L24 50 L22 56 L16 56 L18 50 Q14 48 14 44 Z"
            fill="#9a8870"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Szyja + głowa — krótsze, bardziej przysadziste */}
          <path
            d="M14 42 L12 28 Q12 20 20 20 L28 18 Q32 18 32 22 L32 30 Q32 34 28 34"
            fill="#9a8870"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Grzywka opadająca na oczy — kudłata, stary kucyk */}
          <path
            d="M16 24 Q12 22 14 30 M20 20 Q16 20 17 28 M24 18 Q22 19 23 24"
            stroke={ink}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Ucho — malutkie */}
          <path d="M22 18 L24 14 L26 20 Z" fill={ink} />
          {/* Oko — przymknięte, senne */}
          <path d="M23 26 Q25 26 27 26" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Pysk */}
          <path d="M12 28 L10 30 L12 32" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Kopyta */}
          <rect x="16" y="54" width="6" height="4" fill={ink} />
          <rect x="40" y="54" width="6" height="4" fill={ink} />
          {/* Ogon — krótki, wisi */}
          <path
            d="M56 44 Q60 48 56 52"
            stroke={ink}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {/* Plamki starcze */}
          <circle cx="34" cy="42" r="1.5" fill="#6a5a48" opacity="0.55" />
          <circle cx="44" cy="44" r="1" fill="#6a5a48" opacity="0.55" />
        </svg>
      );
    case 'warhorse':
      // Ogier Bojowy — czarny, czerwony kropierz, chanfron z kolcem, wściekły.
      return (
        <svg {...common}>
          {/* Czerwony kropierz na zadzie — rysowany PRZED tułowiem żeby wystawał spod spodu */}
          <path
            d="M22 38 L52 38 L54 52 L50 54 L48 44 L28 44 L26 54 L22 52 Z"
            fill="#a03030"
            stroke={ink}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Tułów + zad — większy, mocarniejszy */}
          <path
            d="M6 36 Q6 28 14 28 L38 28 Q48 28 50 34 L56 34 Q60 34 60 38 L60 44 Q60 48 56 48 L50 48 L48 54 L42 54 L44 48 L22 48 L20 54 L14 54 L16 48 Q6 46 6 38 Z"
            fill="#3a2820"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Szyja + głowa — wygięta agresywnie */}
          <path
            d="M6 36 L4 18 Q4 8 14 8 L22 6 Q28 6 28 12 L28 22 Q28 28 24 30"
            fill="#3a2820"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Chanfron — metalowa płyta na pysku */}
          <path
            d="M4 18 L2 22 L4 30 L14 30 L16 22 L14 16 Z"
            fill="#8088a0"
            stroke={ink}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Kolec na chanfronie */}
          <path d="M8 16 L10 4 L12 16 Z" fill="#c83232" stroke={ink} strokeWidth="2" />
          {/* Grzywa — dzika, ostra */}
          <path
            d="M14 10 Q8 14 12 24 M18 6 Q12 10 15 20 M22 6 Q18 8 19 14"
            stroke={ink}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {/* Ucho — sterczące, ostre */}
          <path d="M18 6 L20 2 L22 8 Z" fill={ink} />
          {/* Oko — wściekłe, skośne */}
          <path d="M18 20 L22 18" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
          {/* Nozdrze widoczne przy pysku */}
          <circle cx="7" cy="24" r="1.3" fill={ink} />
          {/* Okute kopyta */}
          <rect x="14" y="52" width="7" height="4" fill={ink} />
          <rect x="42" y="52" width="7" height="4" fill={ink} />
          <rect x="15" y="50" width="5" height="2.5" fill="#8088a0" stroke={ink} strokeWidth="1" />
          <rect x="43" y="50" width="5" height="2.5" fill="#8088a0" stroke={ink} strokeWidth="1" />
          {/* Ogon — długi, bojowy */}
          <path
            d="M58 40 Q64 46 60 56 Q58 58 54 52"
            fill="#2a1810"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      );
    // ============================================================
    // Chapter 3 — Bagna Czarnej Strzygi (T6 pool + feet boss drops)
    // ============================================================
    case 'sword-hufnal':
      return (
        <svg {...common}>
          {/* Gigantyczny rdzawy gwóźdź-ostrze — długi kolec + główka */}
          <rect x="28" y="44" width="8" height="14" fill="#3a2418" stroke={ink} strokeWidth="2.5" />
          <path d="M20 44 L44 44 L42 46 L22 46 Z" fill="#5a3a28" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M32 8 L38 44 L26 44 Z" fill="#a85a30" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M30 16 L32 12 L34 22" stroke={ink} strokeWidth="1.5" fill="none" opacity="0.6" />
          <path d="M26 32 L22 36 M38 32 L42 36" stroke={ink} strokeWidth="1.5" opacity="0.5" />
        </svg>
      );
    case 'pipe-reed':
      return (
        <svg {...common}>
          {/* Trzcinowa fujarka — długa, z otworami */}
          <path d="M10 48 Q8 44 12 42 L50 16 Q54 14 56 18 Q57 22 53 23 L14 50 Q10 52 10 48 Z" fill="#c89850" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="20" cy="43" r="2" fill={ink} />
          <circle cx="28" cy="38" r="2" fill={ink} />
          <circle cx="36" cy="32" r="2" fill={ink} />
          <circle cx="44" cy="26" r="2" fill={ink} />
          <path d="M52 18 L48 20" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'chestplate-net':
      return (
        <svg {...common}>
          {/* Kamizelka z sieci bagiennej — krata */}
          <path d="M12 18 L32 8 L52 18 L52 54 L12 54 Z" fill="#3a4a48" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M20 22 L20 50 M28 22 L28 50 M36 22 L36 50 M44 22 L44 50" stroke={ink} strokeWidth="1.5" />
          <path d="M12 28 L52 28 M12 36 L52 36 M12 44 L52 44" stroke={ink} strokeWidth="1.5" />
          {/* Krople wody */}
          <circle cx="22" cy="52" r="1.5" fill="#6aa0d8" />
          <circle cx="42" cy="53" r="1.5" fill="#6aa0d8" />
        </svg>
      );
    case 'gloves-drowned':
      return (
        <svg {...common}>
          {/* Mokra rękawica — blada + krople wody */}
          <path d="M14 22 Q14 14 22 14 L38 14 Q46 14 46 22 L46 40 Q46 54 30 54 Q14 54 14 40 Z" fill="#6a8a80" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M20 16 L22 10 L26 16 M28 14 L30 6 L34 14 M36 14 L38 8 L42 16" stroke={ink} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Spływająca woda */}
          <circle cx="18" cy="58" r="2" fill="#6aa0d8" stroke={ink} strokeWidth="1" />
          <circle cx="42" cy="60" r="2" fill="#6aa0d8" stroke={ink} strokeWidth="1" />
          <path d="M22 52 Q20 56 18 58 M38 54 Q40 58 42 60" stroke="#6aa0d8" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'ring-mist-oath':
      return (
        <svg {...common}>
          {/* Pierścień owinięty mgłą */}
          <circle cx="32" cy="34" r="18" fill="none" stroke="#8a8090" strokeWidth="6" />
          <circle cx="32" cy="34" r="18" fill="none" stroke={ink} strokeWidth="2" />
          <circle cx="32" cy="34" r="12" fill="none" stroke={ink} strokeWidth="1.5" />
          {/* Mgła unosząca się */}
          <path d="M12 20 Q20 16 30 20 Q38 24 50 20" stroke="#c8c0d0" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M14 14 Q24 12 34 14 Q44 16 52 12" stroke="#c8c0d0" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
        </svg>
      );
    case 'potion-black':
      return (
        <svg {...common}>
          {/* Flaszka z czarną cieczą */}
          <rect x="26" y="10" width="12" height="8" fill="#5a4838" stroke={ink} strokeWidth="2.5" />
          <path d="M20 22 L20 50 Q20 56 26 56 L38 56 Q44 56 44 50 L44 22 Z" fill="#2a1a2a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M26 18 L38 18" stroke={ink} strokeWidth="3" />
          {/* Blask czerwony w środku */}
          <circle cx="32" cy="40" r="5" fill="#a42a2a" opacity="0.7" />
          <circle cx="30" cy="38" r="2" fill="#f05060" />
        </svg>
      );
    case 'blade-wraith':
      return (
        <svg {...common}>
          {/* Głownia upiora — ostrze prześwitujące jak cień */}
          <path d="M16 50 L14 54 L22 52 L50 18 L46 14 Z" fill="#3a2818" stroke={ink} strokeWidth="2" />
          <path d="M22 48 L48 22 L46 20 L20 46 Z" fill="#6a6a80" stroke={ink} strokeWidth="2" opacity="0.7" />
          <path d="M26 44 L44 26" stroke="#b8b8c8" strokeWidth="1.5" opacity="0.5" />
          {/* Wisps */}
          <path d="M40 14 Q44 10 48 12 Q52 14 54 10" stroke="#8a8aa0" strokeWidth="2" fill="none" opacity="0.6" />
          <circle cx="54" cy="12" r="1.5" fill="#8a8aa0" opacity="0.6" />
        </svg>
      );
    case 'staff-runestone':
      return (
        <svg {...common}>
          {/* Kostur z kamieniem pokrytym runami */}
          <rect x="30" y="20" width="4" height="40" fill="#6a4828" stroke={ink} strokeWidth="2.5" />
          <path d="M20 18 L44 18 L40 4 L24 4 Z" fill="#5a5868" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* Runy na kamieniu */}
          <path d="M28 8 L28 14 M30 11 L34 11" stroke={ink} strokeWidth="1.8" />
          <path d="M36 8 L40 14 M36 14 L40 8" stroke={ink} strokeWidth="1.8" />
          {/* Motek u dołu kostura */}
          <circle cx="32" cy="60" r="3" fill="#3a2418" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'amulet-strzyga':
      return (
        <svg {...common}>
          {/* Medalion z dwoma czerwonymi oczami — strzygoński */}
          <path d="M24 6 L40 6 M26 6 Q20 6 20 12 Q14 20 24 34 Q32 44 32 44 Q32 44 40 34 Q50 20 44 12 Q44 6 38 6" stroke={ink} strokeWidth="2.5" fill="none" />
          <circle cx="32" cy="36" r="16" fill="#3a2a3a" stroke={ink} strokeWidth="3" />
          <ellipse cx="26" cy="34" rx="3" ry="4" fill="#c83232" stroke={ink} strokeWidth="1.5" />
          <ellipse cx="38" cy="34" rx="3" ry="4" fill="#c83232" stroke={ink} strokeWidth="1.5" />
          <path d="M28 44 L32 40 L36 44" stroke={ink} strokeWidth="2" fill="none" />
        </svg>
      );
    case 'boots-topielec':
      return (
        <svg {...common}>
          {/* Wysokie buty z chlupiącą wodą */}
          <path d="M16 10 L36 10 L36 50 L48 50 L48 58 L16 58 Z" fill="#4a5a5a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M18 18 L34 18" stroke={ink} strokeWidth="1.5" opacity="0.6" />
          {/* Woda w otworze */}
          <ellipse cx="26" cy="14" rx="7" ry="2" fill="#4a7a9a" stroke={ink} strokeWidth="1.5" />
          <path d="M20 54 Q24 52 28 54" stroke="#6aa0d8" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'boots-galoshes':
      return (
        <svg {...common}>
          {/* Gumowe kalosze — krótkie, z wywinięciem */}
          <path d="M18 24 Q18 18 22 18 L34 18 Q38 18 38 24 L38 48 L52 48 L52 56 L18 56 Z" fill="#c83232" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M20 24 L38 24" stroke={ink} strokeWidth="2" />
          {/* Połysk */}
          <path d="M24 32 L24 44" stroke="#f08080" strokeWidth="2" opacity="0.6" />
        </svg>
      );
    case 'boots-waders':
      return (
        <svg {...common}>
          {/* Wysokie brodzaki — do pachy, szare */}
          <path d="M22 6 L36 6 L36 50 L46 50 L46 58 L22 58 Z" fill="#a8a8b8" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M22 16 L36 16" stroke={ink} strokeWidth="1.5" />
          <path d="M22 26 L36 26" stroke={ink} strokeWidth="1" opacity="0.5" />
          {/* Sznurki */}
          <path d="M28 6 L28 14 M32 6 L32 14" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'boots-onuce':
      return (
        <svg {...common}>
          {/* Onuce — owinięte płótno */}
          <path d="M18 28 L42 28 L42 48 L54 48 L54 58 L18 58 Z" fill="#d0b070" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* Warstwy owinięcia */}
          <path d="M20 34 L40 34 M22 40 L40 40 M24 46 L40 46" stroke={ink} strokeWidth="1.8" />
          <path d="M18 30 L14 26 L22 30 M42 30 L46 26 L40 32" stroke={ink} strokeWidth="2" fill="none" />
        </svg>
      );
    case 'boots-mossy':
      return (
        <svg {...common}>
          {/* Buty porośnięte mchem */}
          <path d="M20 20 L40 20 L40 46 L52 46 L52 56 L20 56 Z" fill="#6a4a2a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* Mech — zielone plamy */}
          <circle cx="24" cy="26" r="3" fill="#3a6a3a" />
          <circle cx="34" cy="30" r="2.5" fill="#3a6a3a" />
          <circle cx="28" cy="38" r="3" fill="#3a6a3a" />
          <circle cx="46" cy="50" r="2.5" fill="#3a6a3a" />
          <path d="M24 26 L24 22 M34 30 L34 26 M28 38 L28 34" stroke="#5a8a3a" strokeWidth="1.5" />
        </svg>
      );
    case 'boots-clogs':
      return (
        <svg {...common}>
          {/* Drewniane chodaki */}
          <path d="M14 40 L20 30 L44 30 L50 40 L50 50 L14 50 Z" fill="#a88050" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M20 30 L20 50 M44 30 L44 50" stroke={ink} strokeWidth="1.5" opacity="0.6" />
          {/* Słoje */}
          <path d="M24 36 Q32 34 40 36 M24 42 Q32 40 40 42" stroke={ink} strokeWidth="1" opacity="0.4" fill="none" />
        </svg>
      );
    case 'boots-iron-shod':
      return (
        <svg {...common}>
          {/* Okute buty z nitami */}
          <path d="M18 22 L40 22 L40 44 L54 44 L54 56 L18 56 Z" fill="#5a5868" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* Nity */}
          <circle cx="22" cy="28" r="1.5" fill={ink} />
          <circle cx="30" cy="28" r="1.5" fill={ink} />
          <circle cx="38" cy="28" r="1.5" fill={ink} />
          <circle cx="22" cy="40" r="1.5" fill={ink} />
          <circle cx="30" cy="40" r="1.5" fill={ink} />
          <circle cx="38" cy="40" r="1.5" fill={ink} />
          <circle cx="46" cy="50" r="1.5" fill={ink} />
          {/* Okucie dolne */}
          <path d="M18 52 L54 52" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'boots-sandals':
      return (
        <svg {...common}>
          {/* Rzymskie sandały — paski na nodze */}
          <path d="M16 46 L52 46 L52 54 L16 54 Z" fill="#8a5a2a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* Paski */}
          <path d="M20 46 L26 22 M30 46 L34 14 M38 46 L42 20 M46 46 L50 28" stroke="#6a3a18" strokeWidth="3" strokeLinecap="round" />
          <path d="M20 46 L26 22 M30 46 L34 14 M38 46 L42 20 M46 46 L50 28" stroke={ink} strokeWidth="1.5" fill="none" />
          <path d="M22 34 L48 34" stroke="#6a3a18" strokeWidth="3" strokeLinecap="round" />
          <path d="M22 34 L48 34" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'boots-night-marsh':
      return (
        <svg {...common}>
          {/* Ciemne mokradłowe buty z ognikami */}
          <path d="M18 20 L40 20 L40 46 L52 46 L52 56 L18 56 Z" fill="#2a1a2a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M18 28 L40 28" stroke={ink} strokeWidth="1.5" opacity="0.5" />
          {/* Błędne ogniki */}
          <circle cx="24" cy="34" r="2.5" fill="#f05060" opacity="0.8" />
          <circle cx="34" cy="40" r="2" fill="#f08040" opacity="0.7" />
          <circle cx="46" cy="50" r="2" fill="#f05060" opacity="0.8" />
        </svg>
      );

    // ============================================================
    // R2 (Puszcza Cień) — rozbite duplikaty
    // ============================================================
    case 'sword-bor':
      return (
        <svg {...common}>
          {/* Borowy miecz — drewniany jelec + runa na klindze */}
          <rect x="30" y="8" width="4" height="36" fill="#c8b890" stroke={ink} strokeWidth="2.5" />
          <rect x="18" y="40" width="28" height="6" fill="#6a4828" stroke={ink} strokeWidth="2.5" />
          <rect x="29" y="44" width="6" height="14" fill="#3a2418" stroke={ink} strokeWidth="2" />
          {/* Runa */}
          <path d="M30 22 L34 22 L32 28 L34 28" stroke="#3a6a3a" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'staff-rune':
      return (
        <svg {...common}>
          {/* Kostur runiczny — standing-stone główka */}
          <rect x="30" y="22" width="4" height="38" fill="#5a4028" stroke={ink} strokeWidth="2.5" />
          <path d="M18 20 L46 20 L44 4 L20 4 Z" fill="#8a8890" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M28 8 L28 16 M28 10 L32 14 M36 8 L36 16 M40 8 L40 16 M36 12 L40 12" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'staff-elder':
      return (
        <svg {...common}>
          {/* Kostur Starszej — sękaty, z grzybami */}
          <path d="M28 60 Q30 40 34 20 Q36 10 30 4" fill="none" stroke="#4a2a18" strokeWidth="5" strokeLinecap="round" />
          <path d="M30 18 L24 12 M34 30 L42 26 M30 44 L22 48" stroke={ink} strokeWidth="2" fill="none" />
          {/* Grzyby */}
          <ellipse cx="42" cy="26" rx="6" ry="3" fill="#c83232" stroke={ink} strokeWidth="2" />
          <circle cx="42" cy="26" r="1.5" fill="#f0e8d0" />
          <ellipse cx="22" cy="48" rx="5" ry="2.5" fill="#c83232" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'staff-pack':
      return (
        <svg {...common}>
          {/* Kostur watahy — czaszka wilka */}
          <rect x="30" y="24" width="4" height="36" fill="#6a4828" stroke={ink} strokeWidth="2.5" />
          <path d="M18 24 Q18 6 32 6 Q46 6 46 24 Z" fill="#f0e8d0" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <ellipse cx="24" cy="16" rx="2.5" ry="3" fill={ink} />
          <ellipse cx="40" cy="16" rx="2.5" ry="3" fill={ink} />
          <path d="M22 22 L24 26 L28 24 L32 26 L36 24 L40 26 L42 22" stroke={ink} strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'chestplate-pack':
      return (
        <svg {...common}>
          {/* Kolczuga watahy — z poroża */}
          <path d="M12 18 L32 8 L52 18 L52 54 L12 54 Z" fill="#6a5a3a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* Kolczuga — drobna krata */}
          <path d="M16 22 L52 22 M16 30 L52 30 M16 38 L52 38 M16 46 L52 46" stroke={ink} strokeWidth="0.8" opacity="0.5" />
          {/* Poroże-symbol */}
          <path d="M28 22 L24 14 L22 18 L20 10 M36 22 L40 14 L42 18 L44 10" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'boots-kurhan':
      return (
        <svg {...common}>
          {/* Buty kurhanne — stare, z runami */}
          <path d="M20 22 L40 22 L40 46 L52 46 L52 56 L20 56 Z" fill="#7a5a3a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* Runy */}
          <path d="M26 32 L26 40 M24 34 L28 38 M34 32 L34 40 M32 36 L36 36" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'boots-bor':
      return (
        <svg {...common}>
          {/* Borowe buty — liście na cholewie */}
          <path d="M20 24 L40 24 L40 46 L52 46 L52 56 L20 56 Z" fill="#4a6a2a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* Liście */}
          <path d="M26 30 Q30 26 34 30 Q30 34 26 30 Z" fill="#3a6a3a" stroke={ink} strokeWidth="1.5" />
          <path d="M28 38 Q32 36 36 38 Q32 42 28 38 Z" fill="#5a8a3a" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'ring-forest':
      return (
        <svg {...common}>
          {/* Pierścień z liściem */}
          <circle cx="32" cy="36" r="16" fill="none" stroke="#6a4828" strokeWidth="5" />
          <circle cx="32" cy="36" r="16" fill="none" stroke={ink} strokeWidth="2" />
          <path d="M26 18 Q32 10 38 18 Q32 28 26 18 Z" fill="#3a6a3a" stroke={ink} strokeWidth="2" />
          <path d="M32 12 L32 24" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'dagger-kurhan':
      return (
        <svg {...common}>
          {/* Sztylet kurhanny — krzywy, ornament */}
          <path d="M32 8 L38 12 L34 44 L30 44 L26 12 Z" fill="#a89070" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="22" y="44" width="20" height="5" fill="#4a2a18" stroke={ink} strokeWidth="2" />
          <rect x="29" y="49" width="6" height="10" fill="#3a2418" stroke={ink} strokeWidth="2" />
          {/* Runa */}
          <path d="M30 20 L34 20 L32 26" stroke={ink} strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'claws-leaves':
      return (
        <svg {...common}>
          {/* Szpony z liści */}
          <path d="M14 54 Q12 36 20 18 Q22 14 22 22 Q20 36 18 54" fill="#3a6a3a" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M26 54 Q24 34 32 14 Q34 10 34 20 Q32 34 30 54" fill="#5a8a3a" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M38 54 Q36 36 44 18 Q46 14 46 22 Q44 36 42 54" fill="#3a6a3a" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M18 22 L20 30 M30 20 L32 28 M42 22 L44 30" stroke={ink} strokeWidth="1" opacity="0.5" />
        </svg>
      );
    case 'potion-forest':
      return (
        <svg {...common}>
          {/* Mikstura puszczańska — zielona + gałązka */}
          <rect x="26" y="10" width="12" height="6" fill="#6a4828" stroke={ink} strokeWidth="2.5" />
          <path d="M20 18 L20 52 Q20 58 26 58 L38 58 Q44 58 44 52 L44 18 Z" fill="#3a6a3a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M20 34 Q32 38 44 34" stroke="#1a4a1a" strokeWidth="2" fill="none" opacity="0.7" />
          {/* Gałązka w środku */}
          <path d="M28 24 L32 40 M30 30 L34 30 M30 36 L32 38" stroke="#5a3a18" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'sword-fang':
      return (
        <svg {...common}>
          {/* Miecz wykuty z kłu wilka */}
          <path d="M32 4 L38 40 L26 40 Z" fill="#f0e8d0" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <rect x="22" y="40" width="20" height="5" fill="#5a3a18" stroke={ink} strokeWidth="2.5" />
          <rect x="29" y="45" width="6" height="14" fill="#3a2418" stroke={ink} strokeWidth="2" />
          {/* Kły na klindze */}
          <path d="M30 18 L32 16 L34 18 M30 28 L32 26 L34 28" stroke={ink} strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'sword-bone':
      return (
        <svg {...common}>
          {/* Kościany miecz — gnat jako klinga */}
          <path d="M28 8 Q26 10 28 14 L28 38 Q26 40 28 44 L34 44 Q36 40 36 38 L36 14 Q38 10 36 8 Z" fill="#f0e8d0" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="30" cy="10" r="2" fill="#f0e8d0" stroke={ink} strokeWidth="1.5" />
          <circle cx="34" cy="10" r="2" fill="#f0e8d0" stroke={ink} strokeWidth="1.5" />
          <rect x="22" y="44" width="20" height="5" fill="#5a3a18" stroke={ink} strokeWidth="2" />
          <rect x="29" y="49" width="6" height="10" fill="#3a2418" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'axe-hazel':
      return (
        <svg {...common}>
          {/* Topór leszczynowy — z listkiem */}
          <rect x="30" y="10" width="4" height="44" fill="#8a6040" stroke={ink} strokeWidth="2.5" />
          <path d="M34 14 Q52 12 54 28 Q42 30 34 34 Z" fill="#7a8a50" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M34 20 L50 20" stroke={ink} strokeWidth="1" opacity="0.4" />
          {/* Listek na toporzysku */}
          <path d="M28 40 Q22 38 22 44 Q28 44 28 44 Z" fill="#3a6a3a" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'ring-grave':
      return (
        <svg {...common}>
          {/* Pierścień grobowy — z czaszką */}
          <circle cx="32" cy="38" r="15" fill="none" stroke="#5a4a38" strokeWidth="5" />
          <circle cx="32" cy="38" r="15" fill="none" stroke={ink} strokeWidth="2" />
          <circle cx="32" cy="18" r="10" fill="#f0e8d0" stroke={ink} strokeWidth="2.5" />
          <ellipse cx="28" cy="17" rx="1.8" ry="2.5" fill={ink} />
          <ellipse cx="36" cy="17" rx="1.8" ry="2.5" fill={ink} />
          <path d="M30 22 L30 25 L32 23 L34 25 L34 22" stroke={ink} strokeWidth="1" fill="none" />
        </svg>
      );
    case 'ring-old-gods':
      return (
        <svg {...common}>
          {/* Pierścień starych bogów — z trójkątną runą */}
          <circle cx="32" cy="36" r="16" fill="none" stroke="#c89b2c" strokeWidth="5" />
          <circle cx="32" cy="36" r="16" fill="none" stroke={ink} strokeWidth="2" />
          <path d="M32 14 L24 26 L40 26 Z" fill="#c89b2c" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="32" cy="22" r="2" fill={ink} />
        </svg>
      );
    case 'claws-moon':
      return (
        <svg {...common}>
          {/* Księżycowe szpony — dwa ostre pazury + księżyc */}
          <path d="M16 8 Q14 30 22 54 Q24 58 26 50 Q20 28 20 8 Z" fill="#e8e8f0" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M40 8 Q38 30 46 54 Q48 58 50 50 Q44 28 44 8 Z" fill="#e8e8f0" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          {/* Księżyc w tle */}
          <path d="M26 16 Q36 10 42 20 Q36 18 30 20 Q28 18 26 16 Z" fill="#f0e8d0" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'paw-moon':
      return (
        <svg {...common}>
          {/* Łapa z księżycowym znakiem */}
          <circle cx="32" cy="40" r="14" fill="#6a5848" stroke={ink} strokeWidth="3" />
          <circle cx="20" cy="22" r="4" fill="#6a5848" stroke={ink} strokeWidth="2" />
          <circle cx="32" cy="16" r="4" fill="#6a5848" stroke={ink} strokeWidth="2" />
          <circle cx="44" cy="22" r="4" fill="#6a5848" stroke={ink} strokeWidth="2" />
          <circle cx="50" cy="34" r="3" fill="#6a5848" stroke={ink} strokeWidth="2" />
          {/* Księżyc */}
          <path d="M28 36 Q34 32 38 38 Q32 40 28 36 Z" fill="#f0e8d0" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'helm-forest':
      return (
        <svg {...common}>
          {/* Hełm Puszczy — rogi z drewna */}
          <path d="M14 38 Q14 22 32 22 Q50 22 50 38 L50 46 L14 46 Z" fill="#5a6a3a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* Rogi */}
          <path d="M18 22 L12 8 L20 16 M46 22 L52 8 L44 16" stroke="#6a4828" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M18 22 L12 8 L20 16 M46 22 L52 8 L44 16" stroke={ink} strokeWidth="1.5" fill="none" />
          {/* Oczy */}
          <rect x="24" y="34" width="6" height="3" fill={ink} />
          <rect x="34" y="34" width="6" height="3" fill={ink} />
        </svg>
      );
    case 'wreath-elder':
      return (
        <svg {...common}>
          {/* Wianek starszej — liście i jagody */}
          <circle cx="32" cy="32" r="20" fill="none" stroke="#3a6a3a" strokeWidth="6" />
          <circle cx="32" cy="32" r="20" fill="none" stroke={ink} strokeWidth="2" />
          {/* Liście */}
          <path d="M20 18 Q16 14 18 10 Q22 12 22 16" fill="#3a6a3a" stroke={ink} strokeWidth="1.5" />
          <path d="M44 18 Q48 14 46 10 Q42 12 42 16" fill="#3a6a3a" stroke={ink} strokeWidth="1.5" />
          <path d="M18 44 Q14 46 12 42 Q16 40 20 42" fill="#3a6a3a" stroke={ink} strokeWidth="1.5" />
          {/* Jagody */}
          <circle cx="32" cy="10" r="3" fill="#a42a2a" stroke={ink} strokeWidth="1.5" />
          <circle cx="52" cy="32" r="3" fill="#a42a2a" stroke={ink} strokeWidth="1.5" />
          <circle cx="32" cy="54" r="3" fill="#a42a2a" stroke={ink} strokeWidth="1.5" />
          <circle cx="12" cy="32" r="3" fill="#a42a2a" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'mask-leaves':
      return (
        <svg {...common}>
          {/* Maska z liści — twarz pokryta zielenią */}
          <path d="M14 20 Q14 8 32 8 Q50 8 50 20 L50 40 Q50 54 32 54 Q14 54 14 40 Z" fill="#3a6a3a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* Liście */}
          <path d="M18 14 Q14 10 18 6 Q22 10 22 14" fill="#5a8a3a" stroke={ink} strokeWidth="1.5" />
          <path d="M46 14 Q50 10 46 6 Q42 10 42 14" fill="#5a8a3a" stroke={ink} strokeWidth="1.5" />
          <path d="M32 6 Q28 2 32 0 Q36 2 32 6" fill="#5a8a3a" stroke={ink} strokeWidth="1.5" />
          {/* Oczy */}
          <ellipse cx="24" cy="28" rx="3" ry="4" fill={ink} />
          <ellipse cx="40" cy="28" rx="3" ry="4" fill={ink} />
          <path d="M24 42 Q32 38 40 42" stroke={ink} strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'scepter-forest':
      return (
        <svg {...common}>
          {/* Berło leśne — z gałązką u góry */}
          <rect x="30" y="26" width="4" height="34" fill="#6a4828" stroke={ink} strokeWidth="2.5" />
          <circle cx="32" cy="18" r="10" fill="#3a6a3a" stroke={ink} strokeWidth="3" />
          {/* Gałązki */}
          <path d="M22 14 Q18 10 20 8 M42 14 Q46 10 44 8 M32 8 Q30 4 32 2 Q34 4 32 8" stroke={ink} strokeWidth="1.5" fill="none" />
          <circle cx="32" cy="18" r="3" fill="#c89b2c" stroke={ink} strokeWidth="1.5" />
        </svg>
      );

    // ============================================================
    // R1 / old — rozbite duplikaty
    // ============================================================
    case 'ring-woodsman':
      return (
        <svg {...common}>
          {/* Pierścień leśnika — zielony kamień + ornament */}
          <circle cx="32" cy="36" r="16" fill="none" stroke="#8a6040" strokeWidth="5" />
          <circle cx="32" cy="36" r="16" fill="none" stroke={ink} strokeWidth="2" />
          <rect x="28" y="14" width="8" height="10" fill="#3a6a3a" stroke={ink} strokeWidth="2" transform="rotate(45 32 19)" />
          <path d="M20 38 Q32 42 44 38" stroke={ink} strokeWidth="1" opacity="0.4" fill="none" />
        </svg>
      );
    case 'ring-shadow':
      return (
        <svg {...common}>
          {/* Pierścień cieni — czarny z fioletowym kamieniem */}
          <circle cx="32" cy="36" r="16" fill="none" stroke="#1a1a24" strokeWidth="6" />
          <circle cx="32" cy="36" r="16" fill="none" stroke={ink} strokeWidth="2" />
          <circle cx="32" cy="20" r="6" fill="#6a2a8a" stroke={ink} strokeWidth="2" />
          {/* Smuga cienia */}
          <path d="M26 26 Q22 30 20 26" stroke="#1a1a24" strokeWidth="2" fill="none" opacity="0.8" />
          <path d="M38 26 Q42 30 44 26" stroke="#1a1a24" strokeWidth="2" fill="none" opacity="0.8" />
        </svg>
      );
    case 'ring-signet':
      return (
        <svg {...common}>
          {/* Sygnet upiora — kwadratowa pieczęć */}
          <circle cx="32" cy="36" r="16" fill="none" stroke="#a88850" strokeWidth="5" />
          <circle cx="32" cy="36" r="16" fill="none" stroke={ink} strokeWidth="2" />
          <rect x="24" y="10" width="16" height="18" fill="#c89b2c" stroke={ink} strokeWidth="2.5" />
          {/* Pieczęć — U + daszek */}
          <path d="M28 16 L28 22 L32 24 L36 22 L36 16" stroke={ink} strokeWidth="2" fill="none" />
        </svg>
      );
    case 'shield-peaks':
      return (
        <svg {...common}>
          {/* Tarcza z grani — górski pik */}
          <path d="M12 12 L32 6 L52 12 L52 38 Q52 54 32 60 Q12 54 12 38 Z" fill="#8088a0" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M16 32 L24 20 L32 30 L40 18 L48 32" fill="#5a5868" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          {/* Śniegowe czapy */}
          <path d="M22 22 L24 20 L26 22 Z" fill="#f0f0f0" stroke={ink} strokeWidth="1" />
          <path d="M38 20 L40 18 L42 20 Z" fill="#f0f0f0" stroke={ink} strokeWidth="1" />
        </svg>
      );
    case 'chain-kosciej':
      return (
        <svg {...common}>
          {/* Łańcuch z zębami */}
          <ellipse cx="16" cy="20" rx="6" ry="4" fill="none" stroke="#a0a0a8" strokeWidth="3" />
          <ellipse cx="32" cy="28" rx="6" ry="4" fill="none" stroke="#a0a0a8" strokeWidth="3" />
          <ellipse cx="48" cy="20" rx="6" ry="4" fill="none" stroke="#a0a0a8" strokeWidth="3" />
          {/* Zęby wiszące */}
          <path d="M16 26 L14 40 L18 40 Z" fill="#f0e8d0" stroke={ink} strokeWidth="2" />
          <path d="M32 34 L30 50 L34 50 Z" fill="#f0e8d0" stroke={ink} strokeWidth="2" />
          <path d="M48 26 L46 40 L50 40 Z" fill="#f0e8d0" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'bone-finger':
      return (
        <svg {...common}>
          {/* Kość palca — długa z gałką */}
          <circle cx="32" cy="14" r="8" fill="#f0e8d0" stroke={ink} strokeWidth="3" />
          <rect x="28" y="18" width="8" height="28" fill="#f0e8d0" stroke={ink} strokeWidth="2.5" />
          <circle cx="32" cy="50" r="8" fill="#f0e8d0" stroke={ink} strokeWidth="3" />
          <path d="M28 10 L30 12 M34 10 L36 12" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'skull-mage':
      return (
        <svg {...common}>
          {/* Czaszka maga — z kapturem */}
          <path d="M10 30 Q10 6 32 6 Q54 6 54 30 L54 44 L10 44 Z" fill="#4a3a5a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="32" cy="32" r="14" fill="#f0e8d0" stroke={ink} strokeWidth="2.5" />
          <ellipse cx="26" cy="30" rx="2.5" ry="3.5" fill={ink} />
          <ellipse cx="38" cy="30" rx="2.5" ry="3.5" fill={ink} />
          {/* Fioletowa poświata w oczach */}
          <circle cx="26" cy="30" r="1" fill="#a04ef0" />
          <circle cx="38" cy="30" r="1" fill="#a04ef0" />
          <path d="M28 40 L30 38 L32 40 L34 38 L36 40" stroke={ink} strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'skull-lich':
      return (
        <svg {...common}>
          {/* Czaszka lisza — z koroną */}
          <circle cx="32" cy="36" r="16" fill="#f0e8d0" stroke={ink} strokeWidth="3" />
          <ellipse cx="26" cy="34" rx="3" ry="4" fill={ink} />
          <ellipse cx="38" cy="34" rx="3" ry="4" fill={ink} />
          {/* Czerwone ogniki oczu */}
          <circle cx="26" cy="34" r="1.2" fill="#c83232" />
          <circle cx="38" cy="34" r="1.2" fill="#c83232" />
          <path d="M28 46 L30 44 L32 46 L34 44 L36 46" stroke={ink} strokeWidth="1.5" fill="none" />
          {/* Korona */}
          <path d="M16 22 L20 14 L24 22 L28 12 L32 22 L36 12 L40 22 L44 14 L48 22 Z" fill="#c89b2c" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="32" cy="18" r="2" fill="#c83232" stroke={ink} strokeWidth="1" />
        </svg>
      );
    case 'scepter-hobgoblin':
      return (
        <svg {...common}>
          {/* Berło hobgoblina — kolec + zakrzywione róg */}
          <rect x="30" y="22" width="4" height="38" fill="#4a2a18" stroke={ink} strokeWidth="2.5" />
          <path d="M22 14 Q22 4 32 4 Q42 4 42 14 Q42 22 32 22 Q22 22 22 14 Z" fill="#8a3030" stroke={ink} strokeWidth="3" />
          <path d="M32 4 L32 14" stroke={ink} strokeWidth="1.5" />
          {/* Rogi */}
          <path d="M22 14 L14 8 L18 14 M42 14 L50 8 L46 14" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'cuirass-rat':
      return (
        <svg {...common}>
          {/* Kirys szczurołapa — ze szczurzym łbem */}
          <path d="M12 18 L32 8 L52 18 L52 54 L12 54 Z" fill="#8a6040" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* Szczurza sylwetka */}
          <ellipse cx="32" cy="34" rx="10" ry="7" fill="#5a3a28" stroke={ink} strokeWidth="2" />
          <circle cx="28" cy="28" r="3" fill="#5a3a28" stroke={ink} strokeWidth="1.5" />
          <path d="M26 26 L22 22 M28 24 L26 18" stroke={ink} strokeWidth="1.5" fill="none" />
          <circle cx="28" cy="29" r="1" fill="#c83232" />
          <path d="M42 34 Q50 32 52 38" stroke={ink} strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'cloak-sewer':
      return (
        <svg {...common}>
          {/* Szata kanalarza — z łatami */}
          <path d="M16 12 Q24 10 32 14 Q40 10 48 12 L52 56 L12 56 Z" fill="#4a3a4a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* Łaty */}
          <rect x="20" y="24" width="10" height="10" fill="#6a5a58" stroke={ink} strokeWidth="1.5" />
          <rect x="36" y="38" width="12" height="8" fill="#5a4a48" stroke={ink} strokeWidth="1.5" />
          <path d="M22 26 L28 32 M24 24 L26 32" stroke={ink} strokeWidth="1" opacity="0.5" />
        </svg>
      );
    case 'cloak-fur':
      return (
        <svg {...common}>
          {/* Płaszcz z futer — puchaty na krawędziach */}
          <path d="M14 14 L32 10 L50 14 L54 54 L10 54 Z" fill="#6a4828" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* Futrzany kołnierz */}
          <path d="M12 14 Q16 8 22 12 Q32 6 42 12 Q48 8 52 14" stroke="#f0e8d0" strokeWidth="5" fill="none" />
          <path d="M12 14 Q16 8 22 12 Q32 6 42 12 Q48 8 52 14" stroke={ink} strokeWidth="1.5" fill="none" />
          {/* Futrzany rąbek */}
          <path d="M10 54 Q14 50 18 54 Q22 50 26 54 Q30 50 34 54 Q38 50 42 54 Q46 50 50 54 Q54 50 56 54" stroke="#f0e8d0" strokeWidth="4" fill="none" />
        </svg>
      );
    case 'orb-waste':
      return (
        <svg {...common}>
          {/* Orb pustkowia — szary z pęknięciami */}
          <circle cx="32" cy="32" r="18" fill="#7a7078" stroke={ink} strokeWidth="3" />
          {/* Pęknięcia */}
          <path d="M20 26 L30 32 L26 42 M44 22 L36 34 L44 44" stroke={ink} strokeWidth="2" fill="none" />
          <path d="M32 14 L34 20 L28 24" stroke={ink} strokeWidth="1.5" fill="none" />
          {/* Mały blask w środku */}
          <circle cx="34" cy="30" r="3" fill="#b0a8b0" />
        </svg>
      );
    case 'dagger-second':
      return (
        <svg {...common}>
          {/* Drugi sztylet — lustrzane odbicie/para */}
          <path d="M22 8 L28 12 L24 40 L20 40 Z" fill="#a0a0b0" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M36 8 L42 12 L38 40 L34 40 Z" fill="#a0a0b0" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <rect x="16" y="40" width="12" height="4" fill="#3a2418" stroke={ink} strokeWidth="1.5" />
          <rect x="36" y="40" width="12" height="4" fill="#3a2418" stroke={ink} strokeWidth="1.5" />
          <rect x="19" y="44" width="6" height="12" fill="#2a1810" stroke={ink} strokeWidth="1.5" />
          <rect x="39" y="44" width="6" height="12" fill="#2a1810" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'gloves-cloth':
      return (
        <svg {...common}>
          {/* Płócienne rękawice — jasne, proste */}
          <path d="M16 22 Q16 14 24 14 L40 14 Q48 14 48 22 L48 42 Q48 52 32 52 Q16 52 16 42 Z" fill="#d0c0a0" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M22 18 L22 12 M28 16 L28 10 M34 16 L34 10 M40 16 L40 12" stroke={ink} strokeWidth="2" fill="none" />
          {/* Szwy */}
          <path d="M32 24 L32 48" stroke={ink} strokeWidth="1" strokeDasharray="2 2" />
        </svg>
      );
    case 'gloves-guard':
      return (
        <svg {...common}>
          {/* Rękawice strażnika — stalowe z nitami */}
          <path d="M14 22 Q14 14 22 14 L42 14 Q50 14 50 22 L50 42 Q50 54 32 54 Q14 54 14 42 Z" fill="#7878a0" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M22 20 L22 10 M30 18 L30 8 M38 18 L38 8 M46 20 L46 10" stroke={ink} strokeWidth="2.5" fill="none" />
          {/* Nity */}
          <circle cx="22" cy="32" r="1.5" fill={ink} />
          <circle cx="32" cy="32" r="1.5" fill={ink} />
          <circle cx="42" cy="32" r="1.5" fill={ink} />
          <circle cx="32" cy="44" r="1.5" fill={ink} />
        </svg>
      );
    case 'gloves-matecznik':
      return (
        <svg {...common}>
          {/* Łapy matecznika — wilkołacze, szpony sterczące */}
          <path d="M16 28 Q16 20 24 20 L40 20 Q48 20 48 28 L48 44 Q48 56 32 56 Q16 56 16 44 Z" fill="#4a3a28" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* Szpony */}
          <path d="M22 24 L18 8 M28 22 L24 6 M34 22 L30 6 M40 24 L42 8" stroke="#f0e8d0" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M22 24 L18 8 M28 22 L24 6 M34 22 L30 6 M40 24 L42 8" stroke={ink} strokeWidth="1.5" fill="none" />
          {/* Sierść */}
          <path d="M20 40 Q24 42 20 44 M44 40 Q40 42 44 44" stroke={ink} strokeWidth="1" opacity="0.6" />
        </svg>
      );
    case 'claws-pack':
      return (
        <svg {...common}>
          {/* Pazury watahy — trzy zakrzywione ostrza */}
          <path d="M12 54 Q8 32 16 14 Q20 10 20 20 Q18 38 16 54" fill="#4a3a28" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M26 54 Q22 30 32 12 Q36 8 36 18 Q34 36 30 54" fill="#4a3a28" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M40 54 Q36 32 44 14 Q48 10 48 20 Q46 38 44 54" fill="#4a3a28" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          {/* Krwawy końcówki */}
          <circle cx="18" cy="12" r="2" fill="#8a2a2a" />
          <circle cx="34" cy="10" r="2" fill="#8a2a2a" />
          <circle cx="46" cy="12" r="2" fill="#8a2a2a" />
        </svg>
      );
    case 'seven-league-boots':
      return (
        <svg {...common}>
          {/* Buty 7-milowe — wysokie z siedmioma pasami */}
          <path d="M16 8 L38 8 L38 44 L52 44 L52 56 L16 56 Z" fill="#6a4828" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* Cyfra 7 */}
          <path d="M22 16 L32 16 L24 34" stroke="#c89b2c" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Paski wzmocnienia */}
          <path d="M16 38 L38 38 M40 48 L52 48" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'chestplate-smith':
      return (
        <svg {...common}>
          {/* Kolczuga kowalowej — z młotkiem w reliefie */}
          <path d="M12 18 L32 8 L52 18 L52 54 L12 54 Z" fill="#8a7060" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* Drobna krata */}
          <path d="M16 22 L52 22 M16 30 L52 30 M16 38 L52 38 M16 46 L52 46" stroke={ink} strokeWidth="0.7" opacity="0.5" />
          {/* Młotek */}
          <rect x="24" y="28" width="16" height="8" fill="#4a3a28" stroke={ink} strokeWidth="2" />
          <rect x="30" y="22" width="4" height="24" fill="#6a4828" stroke={ink} strokeWidth="2" />
        </svg>
      );

    case 'dagger-splinter':
      return (
        <svg {...common}>
          {/* Drewniana drzazga ostrzona na ostro */}
          <path d="M32 4 L38 50 L28 50 L26 12 Z" fill="#c89860" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M30 14 L30 46 M34 18 L34 42" stroke={ink} strokeWidth="1" opacity="0.5" />
          <rect x="24" y="50" width="16" height="4" fill="#5a3a18" stroke={ink} strokeWidth="2" />
          <rect x="29" y="54" width="6" height="8" fill="#3a2418" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'sword-rusted':
      return (
        <svg {...common}>
          {/* Rdzawy, poplamiony miecz */}
          <path d="M30 8 L34 8 L34 44 L30 44 Z" fill="#8a5a3a" stroke={ink} strokeWidth="2.5" />
          {/* Plamy rdzy */}
          <circle cx="31" cy="16" r="1.8" fill="#5a3018" />
          <circle cx="33" cy="26" r="2" fill="#5a3018" />
          <circle cx="31" cy="36" r="1.5" fill="#5a3018" />
          <rect x="22" y="44" width="20" height="5" fill="#3a2418" stroke={ink} strokeWidth="2" />
          <rect x="29" y="49" width="6" height="12" fill="#2a1810" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'potion-hp-small':
      return (
        <svg {...common}>
          {/* Mała fiolka z czerwonym płynem */}
          <rect x="28" y="12" width="8" height="6" fill="#6a4828" stroke={ink} strokeWidth="2" />
          <path d="M24 20 L24 48 Q24 54 30 54 L34 54 Q40 54 40 48 L40 20 Z" fill="#c83232" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M24 32 Q32 36 40 32" stroke="#8a1010" strokeWidth="2" fill="none" />
          {/* Maleńkie HP "+" */}
          <path d="M30 42 L34 42 M32 40 L32 44" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'potion-hp-big':
      return (
        <svg {...common}>
          {/* Duża karafka z czerwonym płynem + HP */}
          <rect x="24" y="8" width="16" height="6" fill="#5a3818" stroke={ink} strokeWidth="2.5" />
          <path d="M16 16 L16 52 Q16 58 22 58 L42 58 Q48 58 48 52 L48 16 Z" fill="#c83232" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M16 28 Q32 32 48 28" stroke="#8a1010" strokeWidth="2.5" fill="none" />
          {/* Duże "+" */}
          <path d="M24 40 L40 40 M32 32 L32 48" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'dagger-mist-fang':
      return (
        <svg {...common}>
          {/* Sztylet z kłem — krzywy, fantomowy */}
          <path d="M28 8 Q36 4 40 12 L34 46 L30 46 Z" fill="#c8c0d0" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" opacity="0.85" />
          <path d="M30 16 L34 22 M30 28 L34 34" stroke={ink} strokeWidth="1.5" opacity="0.5" />
          <rect x="22" y="46" width="20" height="5" fill="#3a2a3a" stroke={ink} strokeWidth="2" />
          <rect x="29" y="51" width="6" height="10" fill="#2a1a2a" stroke={ink} strokeWidth="2" />
          {/* Mgła otaczająca ostrze */}
          <path d="M24 20 Q20 18 24 14 M40 30 Q44 28 40 24" stroke="#8a8090" strokeWidth="2" fill="none" opacity="0.6" />
        </svg>
      );
    case 'amulet-rat-tooth':
      return (
        <svg {...common}>
          {/* Szczurzy ząb na sznurku — zakręcony kieł */}
          <path d="M20 8 L44 8" stroke={ink} strokeWidth="2.5" />
          <path d="M22 10 Q18 18 20 28 Q32 24 44 28 Q46 18 42 10" fill="none" stroke={ink} strokeWidth="2.5" />
          {/* Ząb — zakrzywiony w dół */}
          <path d="M28 30 Q26 42 30 54 Q32 56 34 52 Q36 40 36 30 Z" fill="#f0e8d0" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M30 36 L32 46" stroke={ink} strokeWidth="1" opacity="0.5" />
          {/* Krwawy ślad u podstawy */}
          <ellipse cx="32" cy="32" rx="4" ry="2" fill="#8a2a2a" opacity="0.7" />
        </svg>
      );

    // ============================================================
    // Akt-5 boss quest weapons (q35/q40/q45 unique drops)
    // ============================================================
    case 'flail-drowned':
      return (
        <svg {...common}>
          {/* Kiścień topielca — drzewce + łańcuch + głowa topielca z włosami */}
          <rect x="30" y="20" width="4" height="40" fill="#3a2a1a" stroke={ink} strokeWidth="2.5" />
          {/* Łańcuch — 3 ogniwa idące w górę i na bok */}
          <circle cx="26" cy="14" r="3" fill="none" stroke="#7878a0" strokeWidth="2" />
          <circle cx="20" cy="10" r="3" fill="none" stroke="#7878a0" strokeWidth="2" />
          <circle cx="14" cy="8" r="3" fill="none" stroke="#7878a0" strokeWidth="2" />
          {/* Głowa topielca z przyklejonymi włosami */}
          <circle cx="10" cy="16" r="8" fill="#6a8a80" stroke={ink} strokeWidth="2.5" />
          <path d="M4 14 L2 20 M16 14 L18 20 M8 10 L7 6 M12 10 L13 6" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="7" cy="16" r="1.2" fill={ink} />
          <circle cx="13" cy="16" r="1.2" fill={ink} />
          {/* Woda spływająca */}
          <circle cx="8" cy="28" r="1.2" fill="#6aa0d8" />
          <circle cx="14" cy="30" r="1.2" fill="#6aa0d8" />
        </svg>
      );
    case 'knife-fisherman':
      return (
        <svg {...common}>
          {/* Nóż rybaka — zakrzywione ostrze, rękojeść owinięta linką */}
          <path d="M14 44 Q18 8 36 6 Q40 10 40 14 Q36 34 18 46 Z" fill="#c8c8d0" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M20 38 Q26 24 34 14" stroke={ink} strokeWidth="1.5" opacity="0.5" fill="none" />
          <rect x="14" y="42" width="20" height="6" fill="#5a3a18" stroke={ink} strokeWidth="2" />
          {/* Owinięcia linki */}
          <path d="M16 43 L18 47 M20 43 L22 47 M24 43 L26 47 M28 43 L30 47 M32 43 L34 47" stroke={ink} strokeWidth="1" />
          <rect x="19" y="48" width="10" height="12" fill="#3a2418" stroke={ink} strokeWidth="2" />
          {/* Łuska rybia w rękojeści */}
          <path d="M24 52 L26 54 L24 56" stroke="#6aa0d8" strokeWidth="1.2" fill="none" />
        </svg>
      );
    case 'staff-drifting':
      return (
        <svg {...common}>
          {/* Laska z gałązkami wierzby spadającymi */}
          <path d="M30 56 Q32 30 34 8" fill="none" stroke="#4a2a18" strokeWidth="4.5" strokeLinecap="round" />
          {/* Gałązki wiszące — wierzbowe */}
          <path d="M34 10 Q28 16 22 22 Q18 28 20 34" stroke="#3a5a2a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M36 12 Q42 18 46 26 Q48 34 44 38" stroke="#3a5a2a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M33 14 Q32 22 30 30" stroke="#3a5a2a" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Listki na końcach */}
          <ellipse cx="20" cy="34" rx="3" ry="5" fill="#5a8a3a" stroke={ink} strokeWidth="1.5" />
          <ellipse cx="44" cy="38" rx="3" ry="5" fill="#5a8a3a" stroke={ink} strokeWidth="1.5" />
          <ellipse cx="30" cy="30" rx="2.5" ry="4" fill="#5a8a3a" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'axe-haunted':
      return (
        <svg {...common}>
          {/* Topór z nawiedzoną głownią — niebiesko-fioletowa aura */}
          <rect x="30" y="10" width="4" height="46" fill="#3a2418" stroke={ink} strokeWidth="2.5" />
          <path d="M34 16 Q52 12 56 30 Q44 32 34 38 Z" fill="#6a6a90" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M34 20 L52 24" stroke={ink} strokeWidth="1" opacity="0.4" />
          {/* Nawiedzenie — wisps */}
          <path d="M50 20 Q46 8 54 6 M52 36 Q56 42 48 40" stroke="#8a4ac8" strokeWidth="2" fill="none" opacity="0.7" strokeLinecap="round" />
          <circle cx="54" cy="6" r="1.5" fill="#c880ff" />
          <circle cx="48" cy="40" r="1.5" fill="#c880ff" />
        </svg>
      );
    case 'hatchet-carpenter':
      return (
        <svg {...common}>
          {/* Siekierka — krótki trzonek, solidny kląb */}
          <rect x="30" y="28" width="4" height="30" fill="#8a6040" stroke={ink} strokeWidth="2.5" />
          <path d="M18 16 L50 16 L46 34 L22 34 Z" fill="#a89080" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M18 16 L22 34" stroke={ink} strokeWidth="2" />
          <path d="M50 16 L46 34" stroke={ink} strokeWidth="2" />
          {/* Słoje drewna */}
          <path d="M31 36 Q31 44 31 54" stroke={ink} strokeWidth="0.8" opacity="0.5" />
          <path d="M33 36 Q33 44 33 54" stroke={ink} strokeWidth="0.8" opacity="0.5" />
          {/* Ostrze błysk */}
          <path d="M26 20 L42 20" stroke="#e0e0e0" strokeWidth="1.5" opacity="0.8" />
        </svg>
      );
    case 'staff-forked':
      return (
        <svg {...common}>
          {/* Laska sękata rozwidlona — 2 korony */}
          <path d="M32 60 L32 30" stroke="#4a2818" strokeWidth="5" strokeLinecap="round" />
          {/* Rozwidlenie */}
          <path d="M32 30 Q24 18 18 6" stroke="#4a2818" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M32 30 Q40 18 46 6" stroke="#4a2818" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Sęki */}
          <circle cx="24" cy="18" r="2.5" fill="#2a1810" />
          <circle cx="40" cy="18" r="2.5" fill="#2a1810" />
          <circle cx="32" cy="45" r="2.5" fill="#2a1810" />
          {/* Klejnoty na końcach */}
          <circle cx="18" cy="6" r="3.5" fill="#c83232" stroke={ink} strokeWidth="1.5" />
          <circle cx="46" cy="6" r="3.5" fill="#c83232" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'saber-strzyga':
      return (
        <svg {...common}>
          {/* Szabla strzygi — zakrzywiona klinga, krwawa, z czarnym jelcem */}
          <path d="M34 6 Q52 20 44 44 L38 44 Q46 22 30 8 Z" fill="#d0d0d8" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M36 12 Q48 22 42 40" stroke="#8a2a2a" strokeWidth="2.5" fill="none" opacity="0.85" />
          {/* Jelec — czarny z kolcem */}
          <path d="M24 44 L46 44 L46 50 L24 50 Z" fill="#1a0a1a" stroke={ink} strokeWidth="2.5" />
          <path d="M24 44 L20 40 M46 44 L50 40" stroke={ink} strokeWidth="2" />
          <rect x="29" y="50" width="6" height="12" fill="#3a1a3a" stroke={ink} strokeWidth="2" />
          {/* Rubin w głowicy */}
          <circle cx="32" cy="58" r="2.5" fill="#c83232" stroke={ink} strokeWidth="1" />
        </svg>
      );
    case 'claws-strzyga':
      return (
        <svg {...common}>
          {/* Szpony strzygi — 4 zakrzywione ostrza na rękojeści */}
          <path d="M10 54 Q6 30 14 10 Q18 6 18 16 Q16 32 14 54" fill="#3a1a3a" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M22 54 Q18 28 26 8 Q30 4 30 14 Q28 30 26 54" fill="#3a1a3a" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M34 54 Q30 28 38 8 Q42 4 42 14 Q40 30 38 54" fill="#3a1a3a" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M46 54 Q42 30 50 10 Q54 6 54 16 Q52 32 50 54" fill="#3a1a3a" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          {/* Czerwone końcówki */}
          <circle cx="16" cy="10" r="2" fill="#c83232" />
          <circle cx="28" cy="8" r="2" fill="#c83232" />
          <circle cx="40" cy="8" r="2" fill="#c83232" />
          <circle cx="52" cy="10" r="2" fill="#c83232" />
        </svg>
      );
    case 'staff-ossuary':
      return (
        <svg {...common}>
          {/* Laska z czaszką — kość jako trzonek, czaszka u góry z koroną */}
          <rect x="29" y="24" width="6" height="36" fill="#eae4c8" stroke={ink} strokeWidth="2.5" />
          {/* Stawy kości */}
          <circle cx="32" cy="32" r="4" fill="#eae4c8" stroke={ink} strokeWidth="2" />
          <circle cx="32" cy="48" r="4" fill="#eae4c8" stroke={ink} strokeWidth="2" />
          {/* Czaszka u góry */}
          <circle cx="32" cy="18" r="10" fill="#eae4c8" stroke={ink} strokeWidth="2.5" />
          <ellipse cx="28" cy="17" rx="2" ry="2.5" fill={ink} />
          <ellipse cx="36" cy="17" rx="2" ry="2.5" fill={ink} />
          <circle cx="28" cy="17" r="1" fill="#c83232" />
          <circle cx="36" cy="17" r="1" fill="#c83232" />
          <path d="M29 22 L30 25 L32 22 L34 25 L35 22" stroke={ink} strokeWidth="1" fill="none" />
          {/* Korona (mini) — 3 ząbki */}
          <path d="M24 10 L26 4 L28 10 L32 2 L36 10 L38 4 L40 10" stroke={ink} strokeWidth="1.5" fill="#c89b2c" strokeLinejoin="round" />
        </svg>
      );

    // ============================================================
    // Akt-5 shop — 8 ikon
    // ============================================================
    case 'potion-marsh':
      return (
        <svg {...common}>
          {/* Bagienna mikstura — zielono-brązowa ciecz + pęcherzyki */}
          <rect x="26" y="10" width="12" height="6" fill="#5a4a28" stroke={ink} strokeWidth="2.5" />
          <path d="M20 18 L20 50 Q20 56 26 56 L38 56 Q44 56 44 50 L44 18 Z" fill="#4a6a3a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M20 34 Q32 38 44 34" stroke="#2a4a1a" strokeWidth="2" fill="none" />
          {/* Pęcherzyki */}
          <circle cx="26" cy="44" r="2" fill="#a0c880" stroke={ink} strokeWidth="1" />
          <circle cx="34" cy="48" r="1.5" fill="#a0c880" stroke={ink} strokeWidth="1" />
          <circle cx="30" cy="52" r="1" fill="#a0c880" />
        </svg>
      );
    case 'flail-hunter':
      return (
        <svg {...common}>
          {/* Kiścień łowcy — krótki trzonek + kolczasta kula */}
          <rect x="30" y="30" width="4" height="28" fill="#5a3818" stroke={ink} strokeWidth="2.5" />
          <path d="M30 28 L20 20" stroke={ink} strokeWidth="2" />
          <circle cx="18" cy="18" r="8" fill="#6a5848" stroke={ink} strokeWidth="2.5" />
          {/* Kolce */}
          <path d="M18 6 L18 10 M10 10 L12 13 M6 18 L10 18 M10 26 L13 23 M26 10 L23 13 M26 26 L23 23" stroke={ink} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'pipe-shepherd':
      return (
        <svg {...common}>
          {/* Fujarka pasterza — 5 rurek różnej długości związanych sznurkiem */}
          <rect x="14" y="10" width="5" height="40" fill="#c89850" stroke={ink} strokeWidth="2" />
          <rect x="21" y="14" width="5" height="36" fill="#c89850" stroke={ink} strokeWidth="2" />
          <rect x="28" y="18" width="5" height="32" fill="#c89850" stroke={ink} strokeWidth="2" />
          <rect x="35" y="22" width="5" height="28" fill="#c89850" stroke={ink} strokeWidth="2" />
          <rect x="42" y="26" width="5" height="24" fill="#c89850" stroke={ink} strokeWidth="2" />
          {/* Sznurek spinający */}
          <rect x="12" y="42" width="37" height="4" fill="#8a5a28" stroke={ink} strokeWidth="1.5" />
          <path d="M12 44 L49 44" stroke={ink} strokeWidth="1" opacity="0.5" />
        </svg>
      );
    case 'chestplate-reed':
      return (
        <svg {...common}>
          {/* Pancerz z trzciny — pionowe słupki związane */}
          <path d="M12 18 L32 8 L52 18 L52 54 L12 54 Z" fill="#8a7040" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* Trzcinowe pionowe paski */}
          <path d="M18 22 L18 52 M24 21 L24 52 M30 20 L30 52 M36 20 L36 52 M42 21 L42 52 M48 22 L48 52" stroke={ink} strokeWidth="1.5" />
          {/* Związania poziome */}
          <path d="M14 30 L50 30 M14 42 L50 42" stroke="#3a2418" strokeWidth="3" />
        </svg>
      );
    case 'gloves-mud':
      return (
        <svg {...common}>
          {/* Błotne rękawice — oblepione błotem */}
          <path d="M14 22 Q14 14 22 14 L42 14 Q50 14 50 22 L50 42 Q50 54 32 54 Q14 54 14 42 Z" fill="#5a3a20" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M22 18 L22 10 M30 16 L30 8 M38 16 L38 8 M46 18 L46 10" stroke={ink} strokeWidth="2.5" fill="none" />
          {/* Plamy błota spadające */}
          <ellipse cx="20" cy="56" rx="3" ry="2" fill="#5a3a20" stroke={ink} strokeWidth="1.5" />
          <ellipse cx="44" cy="58" rx="3" ry="2" fill="#5a3a20" stroke={ink} strokeWidth="1.5" />
          {/* Jaśniejsze nacięcia */}
          <path d="M24 32 L30 28 M38 36 L44 32" stroke="#8a6a48" strokeWidth="1" opacity="0.6" />
        </svg>
      );
    case 'amulet-mushroom':
      return (
        <svg {...common}>
          {/* Amulet grzybiarki — grzyb muchomor na łańcuszku */}
          <path d="M22 8 L42 8" stroke={ink} strokeWidth="2.5" />
          <path d="M22 10 Q16 20 18 32 Q32 26 46 32 Q48 20 42 10" fill="none" stroke={ink} strokeWidth="2.5" />
          {/* Kapelusz grzyba */}
          <path d="M20 40 Q20 28 32 28 Q44 28 44 40 Z" fill="#c83232" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          {/* Kropki */}
          <circle cx="25" cy="35" r="1.5" fill="#f0e8d0" />
          <circle cx="32" cy="32" r="1.5" fill="#f0e8d0" />
          <circle cx="39" cy="35" r="1.5" fill="#f0e8d0" />
          {/* Nóżka */}
          <rect x="28" y="40" width="8" height="12" fill="#f0e8d0" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'boots-tar':
      return (
        <svg {...common}>
          {/* Smolne buty — czarne, lśniące, kapie smoła */}
          <path d="M18 22 L40 22 L40 46 L52 46 L52 56 L18 56 Z" fill="#1a1015" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* Połysk smoły */}
          <path d="M22 26 L22 44 M28 30 L28 40" stroke="#4a3a3a" strokeWidth="2" opacity="0.7" />
          {/* Kapiąca smoła */}
          <ellipse cx="22" cy="60" rx="2.5" ry="3.5" fill="#1a1015" stroke={ink} strokeWidth="1.5" />
          <ellipse cx="44" cy="62" rx="2.5" ry="3.5" fill="#1a1015" stroke={ink} strokeWidth="1.5" />
          <path d="M22 58 Q22 60 22 56 M44 60 Q44 62 44 58" stroke="#1a1015" strokeWidth="1" opacity="0.7" />
        </svg>
      );
    case 'potion-black-big':
      return (
        <svg {...common}>
          {/* Wielka mikstura czarna — dwukrotna, z czerwoną aurą */}
          <rect x="24" y="6" width="16" height="8" fill="#3a2a2a" stroke={ink} strokeWidth="2.5" />
          <path d="M16 16 L16 52 Q16 58 22 58 L42 58 Q48 58 48 52 L48 16 Z" fill="#1a0a1a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          {/* Czerwony wir w środku */}
          <circle cx="32" cy="34" r="10" fill="#8a1010" opacity="0.6" />
          <circle cx="32" cy="34" r="6" fill="#c83232" opacity="0.7" />
          <circle cx="30" cy="32" r="2" fill="#f05060" />
          {/* Górny wir */}
          <path d="M16 26 Q32 22 48 26" stroke="#c83232" strokeWidth="2" fill="none" opacity="0.5" />
        </svg>
      );
    case 'emblem-shield':
      return (
        <svg {...common}>
          <path
            d="M32 6 L52 12 L52 34 Q52 48 32 58 Q12 48 12 34 L12 12 Z"
            fill="#f0e0b0"
            stroke={ink}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M12 26 L52 26" stroke={ink} strokeWidth="3" />
          <circle cx="32" cy="20" r="3.5" fill={ink} />
        </svg>
      );
    case 'emblem-tower':
      return (
        <svg {...common}>
          <path
            d="M18 56 L18 18 L14 18 L14 10 L22 10 L22 14 L30 14 L30 10 L38 14 L38 10 L46 14 L46 18 L50 18 L50 56 Z"
            fill="#f0e0b0"
            stroke={ink}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <rect x="28" y="28" width="8" height="14" fill={ink} />
          <path d="M18 56 L50 56" stroke={ink} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'emblem-book':
      return (
        <svg {...common}>
          <path
            d="M10 12 L30 10 L32 14 L34 10 L54 12 L54 54 L34 52 L32 56 L30 52 L10 54 Z"
            fill="#f0e0b0"
            stroke={ink}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path d="M32 14 L32 54" stroke={ink} strokeWidth="2.5" />
          <path
            d="M14 22 L28 21 M14 30 L28 29 M14 38 L28 37 M36 21 L50 22 M36 29 L50 30 M36 37 L50 38"
            stroke={ink}
            strokeWidth="1.5"
            opacity="0.6"
          />
          <rect x="28" y="42" width="8" height="8" fill="#d4a24c" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'emblem-skull':
      return (
        <svg {...common}>
          <path
            d="M32 6 Q14 6 14 26 Q14 36 20 42 L20 50 Q20 54 24 54 L28 54 L28 48 L36 48 L36 54 L40 54 Q44 54 44 50 L44 42 Q50 36 50 26 Q50 6 32 6 Z"
            fill="#f0e0b0"
            stroke={ink}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <ellipse cx="24" cy="28" rx="4" ry="5" fill={ink} />
          <ellipse cx="40" cy="28" rx="4" ry="5" fill={ink} />
          <path d="M30 40 L32 38 L34 40" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
          <rect x="30" y="42" width="2" height="6" fill={ink} />
          <rect x="34" y="42" width="2" height="6" fill={ink} />
        </svg>
      );
    // ========== CHAPTER 4 — Granie Strzelistych Iglic (tier 7) ==========
    case 'axe-frost':
      return (
        <svg {...common}>
          <rect x="30" y="14" width="4" height="40" fill="#6a4a2a" stroke={ink} strokeWidth="2" />
          <path d="M14 18 Q14 10 22 12 L34 14 L34 28 L22 30 Q14 28 14 22 Z" fill="#a0d8f0" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M50 18 Q50 10 42 12 L34 14 L34 28 L42 30 Q50 28 50 22 Z" fill="#c0e8ff" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M22 16 L28 22 M40 16 L36 22" stroke="#fff" strokeWidth="1.5" />
          <circle cx="32" cy="50" r="3" fill="#c4a04a" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'staff-spire':
      return (
        <svg {...common}>
          <rect x="30" y="22" width="4" height="36" fill="#7a6a5a" stroke={ink} strokeWidth="2" />
          <path d="M32 6 L24 28 L32 22 L40 28 Z" fill="#a0c8e0" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M32 8 L29 24 L32 21 L35 24 Z" fill="#e0f0ff" />
          <circle cx="32" cy="22" r="2" fill="#fff" />
          <rect x="28" y="56" width="8" height="3" fill="#5a4a3a" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'cloak-mountain':
      return (
        <svg {...common}>
          <path d="M14 16 Q32 8 50 16 L50 52 Q32 60 14 52 Z" fill="#8a7a5a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M14 16 L20 12 L26 14 L32 10 L38 14 L44 12 L50 16" fill="none" stroke={ink} strokeWidth="2" />
          <path d="M22 22 Q32 26 42 22 L42 50 Q32 54 22 50 Z" fill="#a08a6a" stroke={ink} strokeWidth="2" />
          <circle cx="32" cy="20" r="3" fill="#c4a04a" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'helm-skarbnik':
      return (
        <svg {...common}>
          <path d="M14 32 Q14 14 32 12 Q50 14 50 32 L50 42 L14 42 Z" fill="#5a5a4a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <rect x="20" y="32" width="24" height="6" fill="#3a3a2a" stroke={ink} strokeWidth="2" />
          <circle cx="32" cy="20" r="6" fill="#ffc830" stroke={ink} strokeWidth="2.5" />
          <circle cx="32" cy="20" r="2.5" fill="#fff8e0" />
          <path d="M20 42 L20 50 L26 50 L26 44" fill={ink} />
          <path d="M44 42 L44 50 L38 50 L38 44" fill={ink} />
        </svg>
      );
    case 'ring-frost-spire':
      return (
        <svg {...common}>
          <circle cx="32" cy="38" r="14" fill="none" stroke="#9a9aa0" strokeWidth="5" />
          <circle cx="32" cy="38" r="14" fill="none" stroke={ink} strokeWidth="2.5" />
          <path d="M32 14 L26 28 L32 24 L38 28 Z" fill="#a0d8f0" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M32 16 L29 26 L32 23 L35 26 Z" fill="#fff" />
        </svg>
      );
    case 'potion-wind':
      return (
        <svg {...common}>
          <path d="M26 14 L38 14 L38 22 L42 30 Q42 50 32 54 Q22 50 22 30 L26 22 Z" fill="#e0f0ff" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M26 14 L38 14" stroke={ink} strokeWidth="2.5" />
          <path d="M28 36 Q34 32 38 38 Q34 44 28 40" fill="none" stroke="#a0c8e0" strokeWidth="2" />
          <path d="M26 44 Q32 40 36 46" fill="none" stroke="#a0c8e0" strokeWidth="2" />
          <circle cx="30" cy="30" r="1.5" fill="#fff" />
          <circle cx="36" cy="42" r="1.5" fill="#fff" />
        </svg>
      );
    case 'staff-flame':
      return (
        <svg {...common}>
          <rect x="30" y="22" width="4" height="36" fill="#6a3a1a" stroke={ink} strokeWidth="2" />
          <path d="M32 6 Q22 14 26 24 Q28 18 32 16 Q36 18 38 24 Q42 14 32 6 Z" fill="#ff8030" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M32 10 Q28 16 30 22 Q32 18 34 22 Q36 16 32 10 Z" fill="#ffe060" />
          <rect x="28" y="56" width="8" height="3" fill="#5a2a10" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'dagger-spire':
      return (
        <svg {...common}>
          <path d="M32 6 L36 8 L38 40 L34 44 L30 40 L26 8 Z" fill="#c0d8e8" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M32 6 L34 8 L35 38 L33 40 Z" fill="#fff" opacity="0.6" />
          <path d="M28 14 L36 22 M36 14 L28 22" stroke="#fff" strokeWidth="1.5" />
          <rect x="22" y="42" width="20" height="4" rx="1" fill="#7a6a5a" stroke={ink} strokeWidth="2" />
          <rect x="20" y="44" width="24" height="6" rx="2" fill="#3a3a3a" stroke={ink} strokeWidth="2.5" />
          <rect x="29" y="50" width="6" height="6" fill="#5a4a3a" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'amulet-skarbnik':
      return (
        <svg {...common}>
          <path d="M14 8 Q32 12 50 8" fill="none" stroke={ink} strokeWidth="2.5" />
          <path d="M14 8 Q32 14 50 8" fill="none" stroke="#7a6a5a" strokeWidth="2" />
          <circle cx="32" cy="36" r="14" fill="#5a5a4a" stroke={ink} strokeWidth="3" />
          <circle cx="32" cy="36" r="9" fill="#ffc830" stroke={ink} strokeWidth="2" />
          <circle cx="32" cy="36" r="4" fill="#fff8e0" />
          <path d="M22 26 L26 22 M42 26 L38 22" stroke={ink} strokeWidth="2" />
        </svg>
      );
    // ========== Boss unique drops Q48 (Ognista Pani) ==========
    case 'axe-flame-lady':
      return (
        <svg {...common}>
          <rect x="30" y="16" width="4" height="44" fill="#6a3a1a" stroke={ink} strokeWidth="2" />
          <path d="M12 22 Q14 12 26 14 Q30 18 30 24 Q26 28 18 28 Q12 26 12 22 Z" fill="#c83232" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M52 22 Q50 12 38 14 Q34 18 34 24 Q38 28 46 28 Q52 26 52 22 Z" fill="#ff8030" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M16 18 Q22 22 26 18 M48 18 Q42 22 38 18" stroke="#ffe060" strokeWidth="2" fill="none" />
          <circle cx="32" cy="56" r="3" fill="#ffc830" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'daggers-flame':
      return (
        <svg {...common}>
          <path d="M22 8 L26 10 L26 32 L22 36 L18 32 Z" fill="#c83232" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M22 8 L24 10 L24 30 L22 32 Z" fill="#ff8030" />
          <rect x="14" y="34" width="14" height="4" fill="#3a2a1a" stroke={ink} strokeWidth="2" />
          <path d="M42 8 L46 10 L46 32 L42 36 L38 32 Z" fill="#ff8030" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M42 8 L44 10 L44 30 L42 32 Z" fill="#ffe060" />
          <rect x="34" y="34" width="14" height="4" fill="#3a2a1a" stroke={ink} strokeWidth="2" />
          <path d="M22 12 Q26 16 22 20 M42 12 Q38 16 42 20" stroke="#fff" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'sceptre-flame-lady':
      return (
        <svg {...common}>
          <rect x="30" y="26" width="4" height="32" fill="#6a3a1a" stroke={ink} strokeWidth="2" />
          <circle cx="32" cy="20" r="10" fill="#ff8030" stroke={ink} strokeWidth="3" />
          <circle cx="32" cy="20" r="6" fill="#ffe060" />
          <path d="M32 8 L28 16 L32 14 L36 16 Z" fill="#c83232" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <path d="M22 24 L18 20 M42 24 L46 20" stroke="#c83232" strokeWidth="3" strokeLinecap="round" />
          <rect x="28" y="56" width="8" height="3" fill="#5a2a10" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    // ========== Boss unique drops Q50 (Skarbnik Otchłani) ==========
    case 'axe-warlord':
      return (
        <svg {...common}>
          <rect x="30" y="6" width="4" height="54" fill="#3a2a1a" stroke={ink} strokeWidth="2.5" />
          <path d="M10 16 Q12 6 26 8 L34 14 L34 32 L26 38 Q12 36 10 24 Z" fill="#9a9aa0" stroke={ink} strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M54 16 Q52 6 38 8 L30 14 L30 32 L38 38 Q52 36 54 24 Z" fill="#7a7a85" stroke={ink} strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M14 14 Q20 18 26 14 M50 14 Q44 18 38 14" stroke="#fff" strokeWidth="1.5" fill="none" />
          <circle cx="32" cy="22" r="3" fill="#c83232" stroke={ink} strokeWidth="2" />
          <rect x="26" y="56" width="12" height="4" fill="#5a2a10" stroke={ink} strokeWidth="2" />
        </svg>
      );
    case 'bow-frost-spire':
      return (
        <svg {...common}>
          <path d="M16 8 Q56 32 16 56" fill="none" stroke="#a0c8e0" strokeWidth="5" strokeLinecap="round" />
          <path d="M16 8 Q56 32 16 56" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="8" x2="16" y2="56" stroke="#fff" strokeWidth="2" strokeDasharray="3,2" />
          <path d="M14 28 L46 32 L14 36 Z" fill="#7a6a5a" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M44 30 L52 32 L44 34 Z" fill="#c0d8e8" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="16" cy="20" r="2" fill="#fff" />
          <circle cx="16" cy="44" r="2" fill="#fff" />
        </svg>
      );
    case 'sceptre-skarbnik':
      return (
        <svg {...common}>
          <rect x="30" y="28" width="4" height="32" fill="#3a2a1a" stroke={ink} strokeWidth="2.5" />
          <path d="M22 22 Q22 8 32 8 Q42 8 42 22 L42 26 L22 26 Z" fill="#eae4c8" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <ellipse cx="28" cy="18" rx="2.5" ry="3.5" fill={ink} />
          <ellipse cx="36" cy="18" rx="2.5" ry="3.5" fill={ink} />
          <path d="M28 22 L30 24 L34 24 L36 22" stroke={ink} strokeWidth="1.5" fill="none" />
          <circle cx="32" cy="32" r="4" fill="#ffc830" stroke={ink} strokeWidth="2" />
          <circle cx="32" cy="32" r="1.5" fill="#fff" />
          <rect x="26" y="56" width="12" height="4" fill="#5a4a3a" stroke={ink} strokeWidth="2" />
        </svg>
      );
    // ========== Shop akt-6 ==========
    case 'potion-altitude':
      return (
        <svg {...common}>
          <path d="M26 12 L38 12 L38 20 L42 30 Q42 50 32 54 Q22 50 22 30 L26 20 Z" fill="#a0c8e0" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M26 12 L38 12" stroke={ink} strokeWidth="2.5" />
          <path d="M22 38 Q26 36 32 38 Q38 40 42 38 L42 50 Q32 54 22 50 Z" fill="#fff" />
          <path d="M28 26 L32 22 L36 26" stroke={ink} strokeWidth="2" fill="none" />
          <circle cx="32" cy="44" r="2" fill="#a0c8e0" />
        </svg>
      );
    case 'boots-mountain':
      return (
        <svg {...common}>
          <path d="M14 30 Q14 22 22 22 L34 22 L34 36 L46 36 Q50 36 50 42 L50 50 L14 50 Z" fill="#7a5a3a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M22 22 L22 36 L34 36 L34 22" fill="none" stroke={ink} strokeWidth="2" />
          <rect x="16" y="46" width="32" height="4" fill="#3a2a1a" stroke={ink} strokeWidth="2" />
          <circle cx="22" cy="50" r="2.5" fill="#3a2a1a" stroke={ink} strokeWidth="1.5" />
          <circle cx="42" cy="50" r="2.5" fill="#3a2a1a" stroke={ink} strokeWidth="1.5" />
          <path d="M26 28 L30 32 M30 28 L26 32" stroke={ink} strokeWidth="1.5" />
        </svg>
      );
    case 'gloves-shepherd':
      return (
        <svg {...common}>
          <path d="M18 22 L18 50 Q18 56 24 56 L40 56 Q46 56 46 50 L46 24 L42 20 L40 24 L36 20 L34 24 L30 20 L28 24 L24 20 L22 22 Z" fill="#8a6a3a" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M22 30 Q32 32 42 30" stroke={ink} strokeWidth="2" fill="none" />
          <path d="M22 38 Q32 40 42 38" stroke={ink} strokeWidth="2" fill="none" />
          <rect x="22" y="48" width="20" height="6" rx="2" fill="#5a3a1a" stroke={ink} strokeWidth="2" />
        </svg>
      );
    default:
      return null;
  }
}
