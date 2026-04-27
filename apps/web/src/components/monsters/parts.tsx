// Paper-doll parts for the monster generator.
// Canvas is 140x140; all slot coordinates are in that space.

import type { ReactElement } from 'react';
import type { MonsterPalette } from './palettes';
import { MONSTER_INK as INK } from './palettes';

export interface BodyArgs {
  p: MonsterPalette;
}
export interface AnchorArgs extends BodyArgs {
  cx: number;
  cy: number;
}

type BodyPart = (args: BodyArgs) => ReactElement | null;
type AnchorPart = (args: AnchorArgs) => ReactElement | null;

// ========== BODIES ==========
export const M_Bodies: Record<string, BodyPart> = {
  'humanoid-lean': ({ p }) => (
    <g>
      <path
        d="M50 55 Q45 75 48 95 Q54 108 70 110 Q86 108 92 95 Q95 75 90 55 Q70 50 50 55 Z"
        fill={p.skin}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M58 68 Q70 72 82 68"
        stroke={p.dark}
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      <path d="M62 82 L78 82" stroke={p.dark} strokeWidth="2" opacity="0.4" />
    </g>
  ),
  'humanoid-bulk': ({ p }) => (
    <g>
      <path
        d="M38 58 Q32 80 38 100 Q50 115 70 116 Q90 115 102 100 Q108 80 102 58 Q70 48 38 58 Z"
        fill={p.skin}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="55" cy="78" r="3" fill={p.dark} opacity="0.3" />
      <circle cx="85" cy="82" r="4" fill={p.dark} opacity="0.3" />
      <circle cx="68" cy="95" r="3" fill={p.dark} opacity="0.3" />
      <path
        d="M50 70 Q70 75 90 70"
        stroke={p.dark}
        strokeWidth="2"
        fill="none"
        opacity="0.4"
      />
    </g>
  ),
  'skeleton-ribs': ({ p }) => (
    <g>
      <path
        d="M50 55 Q45 78 50 98 Q60 110 70 110 Q80 110 90 98 Q95 78 90 55 Q70 50 50 55 Z"
        fill={p.skin}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M54 65 Q70 70 86 65 M54 75 Q70 80 86 75 M56 85 Q70 90 84 85 M58 95 Q70 100 82 95"
        stroke={INK}
        strokeWidth="2.2"
        fill="none"
      />
      <path d="M70 60 L70 108" stroke={INK} strokeWidth="2.5" />
    </g>
  ),
  blob: ({ p }) => (
    <g>
      <path
        d="M30 90 Q20 120 45 126 Q70 130 95 126 Q120 120 110 90 Q105 65 70 60 Q35 65 30 90 Z"
        fill={p.skin}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M55 80 Q55 72 60 70 Q60 78 55 80 Z" fill={p.light} opacity="0.7" />
      <path
        d="M40 100 L50 105 M90 100 L100 105"
        stroke={p.dark}
        strokeWidth="2"
        opacity="0.4"
      />
    </g>
  ),
  'beast-low': ({ p }) => (
    <g>
      <ellipse cx="70" cy="90" rx="38" ry="22" fill={p.skin} stroke={INK} strokeWidth="3" />
      <path
        d="M40 90 Q35 80 42 76"
        stroke={p.dark}
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M100 90 Q105 80 98 76"
        stroke={p.dark}
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
    </g>
  ),
  flying: ({ p }) => (
    <g>
      <ellipse cx="70" cy="78" rx="18" ry="22" fill={p.skin} stroke={INK} strokeWidth="3" />
      <path d="M62 75 L78 75" stroke={p.dark} strokeWidth="1.5" opacity="0.5" />
    </g>
  ),
};

// ========== HEADS ==========
export const M_Heads: Record<string, AnchorPart> = {
  goblin: ({ p, cx, cy }) => (
    <g>
      <path
        d={`M${cx - 16} ${cy - 2} Q${cx - 20} ${cy + 14} ${cx - 8} ${cy + 20} Q${cx} ${cy + 24} ${cx + 8} ${cy + 20} Q${cx + 20} ${cy + 14} ${cx + 16} ${cy - 2} Q${cx + 14} ${cy - 18} ${cx} ${cy - 20} Q${cx - 14} ${cy - 18} ${cx - 16} ${cy - 2} Z`}
        fill={p.skin}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </g>
  ),
  'round-big': ({ p, cx, cy }) => (
    <circle cx={cx} cy={cy} r="20" fill={p.skin} stroke={INK} strokeWidth="3" />
  ),
  skull: ({ p, cx, cy }) => (
    <g>
      <path
        d={`M${cx - 14} ${cy - 4} Q${cx - 16} ${cy + 10} ${cx - 8} ${cy + 14} L${cx - 8} ${cy + 18} L${cx - 4} ${cy + 20} L${cx + 4} ${cy + 20} L${cx + 8} ${cy + 18} L${cx + 8} ${cy + 14} Q${cx + 16} ${cy + 10} ${cx + 14} ${cy - 4} Q${cx + 12} ${cy - 16} ${cx} ${cy - 18} Q${cx - 12} ${cy - 16} ${cx - 14} ${cy - 4} Z`}
        fill={p.skin}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d={`M${cx - 9} ${cy + 12} L${cx + 9} ${cy + 12}`} stroke={INK} strokeWidth="2" />
      <path
        d={`M${cx - 3} ${cy + 14} L${cx - 3} ${cy + 20} M${cx + 3} ${cy + 14} L${cx + 3} ${cy + 20} M${cx} ${cy + 14} L${cx} ${cy + 20}`}
        stroke={INK}
        strokeWidth="1.4"
      />
    </g>
  ),
  'rat-snout': ({ p, cx, cy }) => (
    <g>
      <path
        d={`M${cx - 18} ${cy} Q${cx - 20} ${cy + 10} ${cx - 6} ${cy + 12} L${cx + 18} ${cy + 6} Q${cx + 24} ${cy} ${cx + 20} ${cy - 8} L${cx - 6} ${cy - 10} Q${cx - 20} ${cy - 8} ${cx - 18} ${cy} Z`}
        fill={p.skin}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx={cx + 20} cy={cy - 1} r="2.5" fill={INK} />
    </g>
  ),
  dragon: ({ p, cx, cy }) => (
    <g>
      <path
        d={`M${cx - 20} ${cy - 2} Q${cx - 22} ${cy + 12} ${cx - 10} ${cy + 16} L${cx + 16} ${cy + 12} Q${cx + 24} ${cy + 4} ${cx + 22} ${cy - 6} Q${cx + 12} ${cy - 18} ${cx - 4} ${cy - 18} Q${cx - 18} ${cy - 14} ${cx - 20} ${cy - 2} Z`}
        fill={p.skin}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx={cx + 18} cy={cy - 2} r="1.5" fill={INK} />
      <circle cx={cx + 18} cy={cy + 4} r="1.5" fill={INK} />
    </g>
  ),
  insect: ({ p, cx, cy }) => (
    <g>
      <path
        d={`M${cx} ${cy - 20} L${cx - 18} ${cy + 12} L${cx + 18} ${cy + 12} Z`}
        fill={p.skin}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d={`M${cx - 8} ${cy - 14} L${cx - 14} ${cy - 22} M${cx + 8} ${cy - 14} L${cx + 14} ${cy - 22}`}
        stroke={INK}
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  ),
  none: () => null,
};

// ========== EARS ==========
export const M_Ears: Record<string, AnchorPart> = {
  'pointy-long': ({ p, cx, cy }) => (
    <g>
      <path
        d={`M${cx - 18} ${cy - 8} L${cx - 32} ${cy - 16} L${cx - 20} ${cy + 2} Z`}
        fill={p.skin}
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d={`M${cx + 18} ${cy - 8} L${cx + 32} ${cy - 16} L${cx + 20} ${cy + 2} Z`}
        fill={p.skin}
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </g>
  ),
  'pointy-short': ({ p, cx, cy }) => (
    <g>
      <path
        d={`M${cx - 16} ${cy - 6} L${cx - 24} ${cy - 12} L${cx - 18} ${cy} Z`}
        fill={p.skin}
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d={`M${cx + 16} ${cy - 6} L${cx + 24} ${cy - 12} L${cx + 18} ${cy} Z`}
        fill={p.skin}
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </g>
  ),
  'round-small': ({ p, cx, cy }) => (
    <g>
      <circle cx={cx - 18} cy={cy - 10} r="6" fill={p.skin} stroke={INK} strokeWidth="2.5" />
      <circle cx={cx + 18} cy={cy - 10} r="6" fill={p.skin} stroke={INK} strokeWidth="2.5" />
      <circle cx={cx - 18} cy={cy - 10} r="2.5" fill={p.dark} />
      <circle cx={cx + 18} cy={cy - 10} r="2.5" fill={p.dark} />
    </g>
  ),
  'bat-wing': ({ p, cx, cy }) => (
    <g>
      <path
        d={`M${cx - 16} ${cy - 8} L${cx - 30} ${cy - 20} L${cx - 26} ${cy - 4} L${cx - 20} ${cy} Z`}
        fill={p.skin}
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d={`M${cx + 16} ${cy - 8} L${cx + 30} ${cy - 20} L${cx + 26} ${cy - 4} L${cx + 20} ${cy} Z`}
        fill={p.skin}
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </g>
  ),
  none: () => null,
};

// ========== HORNS ==========
export const M_Horns: Record<string, AnchorPart> = {
  ram: ({ p, cx, cy }) => (
    <g>
      <path
        d={`M${cx - 10} ${cy - 18} Q${cx - 24} ${cy - 12} ${cx - 22} ${cy} Q${cx - 16} ${cy - 6} ${cx - 12} ${cy - 12}`}
        fill={p.accent}
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d={`M${cx + 10} ${cy - 18} Q${cx + 24} ${cy - 12} ${cx + 22} ${cy} Q${cx + 16} ${cy - 6} ${cx + 12} ${cy - 12}`}
        fill={p.accent}
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </g>
  ),
  devil: ({ p, cx, cy }) => (
    <g>
      <path
        d={`M${cx - 8} ${cy - 16} L${cx - 14} ${cy - 30} L${cx - 4} ${cy - 18} Z`}
        fill={p.accent}
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d={`M${cx + 8} ${cy - 16} L${cx + 14} ${cy - 30} L${cx + 4} ${cy - 18} Z`}
        fill={p.accent}
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </g>
  ),
  'single-spike': ({ p, cx, cy }) => (
    <path
      d={`M${cx - 3} ${cy - 18} L${cx} ${cy - 32} L${cx + 3} ${cy - 18} Z`}
      fill={p.accent}
      stroke={INK}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  ),
  antlers: ({ p, cx, cy }) => (
    <g>
      <path
        d={`M${cx - 8} ${cy - 16} L${cx - 12} ${cy - 28} L${cx - 18} ${cy - 26} M${cx - 12} ${cy - 28} L${cx - 10} ${cy - 34}`}
        stroke={p.accent}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M${cx + 8} ${cy - 16} L${cx + 12} ${cy - 28} L${cx + 18} ${cy - 26} M${cx + 12} ${cy - 28} L${cx + 10} ${cy - 34}`}
        stroke={p.accent}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  ),
  none: () => null,
};

// ========== EYES ==========
export const M_Eyes: Record<string, AnchorPart> = {
  'angry-slit': ({ p, cx, cy }) => (
    <g>
      <path
        d={`M${cx - 9} ${cy - 2} L${cx - 2} ${cy + 1}`}
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d={`M${cx + 9} ${cy - 2} L${cx + 2} ${cy + 1}`}
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx={cx - 6} cy={cy + 1} r="2.2" fill={p.eye} />
      <circle cx={cx + 6} cy={cy + 1} r="2.2" fill={p.eye} />
    </g>
  ),
  'big-round': ({ cx, cy }) => (
    <g>
      <circle cx={cx - 6} cy={cy} r="4" fill="#fff" stroke={INK} strokeWidth="1.8" />
      <circle cx={cx + 6} cy={cy} r="4" fill="#fff" stroke={INK} strokeWidth="1.8" />
      <circle cx={cx - 5} cy={cy + 1} r="2" fill={INK} />
      <circle cx={cx + 7} cy={cy + 1} r="2" fill={INK} />
    </g>
  ),
  glowing: ({ p, cx, cy }) => (
    <g>
      <circle cx={cx - 6} cy={cy} r="4" fill={p.eye} />
      <circle cx={cx + 6} cy={cy} r="4" fill={p.eye} />
      <circle cx={cx - 6} cy={cy} r="4" fill="none" stroke={INK} strokeWidth="1.5" />
      <circle cx={cx + 6} cy={cy} r="4" fill="none" stroke={INK} strokeWidth="1.5" />
    </g>
  ),
  hollow: ({ cx, cy }) => (
    <g>
      <ellipse cx={cx - 6} cy={cy} rx="3" ry="4" fill={INK} />
      <ellipse cx={cx + 6} cy={cy} rx="3" ry="4" fill={INK} />
    </g>
  ),
  cyclops: ({ cx, cy }) => (
    <g>
      <circle cx={cx} cy={cy} r="7" fill="#fff" stroke={INK} strokeWidth="2" />
      <circle cx={cx + 1} cy={cy + 1} r="3.5" fill={INK} />
    </g>
  ),
  three: ({ p, cx, cy }) => (
    <g>
      <circle cx={cx - 8} cy={cy} r="3" fill={p.eye} stroke={INK} strokeWidth="1.5" />
      <circle cx={cx + 8} cy={cy} r="3" fill={p.eye} stroke={INK} strokeWidth="1.5" />
      <circle cx={cx} cy={cy - 6} r="3" fill={p.eye} stroke={INK} strokeWidth="1.5" />
    </g>
  ),
  dots: ({ cx, cy }) => (
    <g>
      <circle cx={cx - 5} cy={cy} r="2" fill={INK} />
      <circle cx={cx + 5} cy={cy} r="2" fill={INK} />
    </g>
  ),
  compound: ({ p, cx, cy }) => (
    <g>
      <ellipse cx={cx - 7} cy={cy} rx="4" ry="5" fill={p.dark} stroke={INK} strokeWidth="1.5" />
      <ellipse cx={cx + 7} cy={cy} rx="4" ry="5" fill={p.dark} stroke={INK} strokeWidth="1.5" />
      <circle cx={cx - 8} cy={cy - 1} r="1" fill={p.light} />
      <circle cx={cx + 6} cy={cy - 1} r="1" fill={p.light} />
    </g>
  ),
};

// ========== MOUTHS ==========
export const M_Mouths: Record<string, AnchorPart> = {
  fangs: ({ p, cx, cy }) => (
    <g>
      <path
        d={`M${cx - 8} ${cy} Q${cx} ${cy + 6} ${cx + 8} ${cy}`}
        stroke={INK}
        strokeWidth="2.5"
        fill={p.dark}
        strokeLinejoin="round"
      />
      <path
        d={`M${cx - 5} ${cy + 1} L${cx - 3} ${cy + 5} L${cx - 1} ${cy + 1} Z`}
        fill="#fff"
        stroke={INK}
        strokeWidth="1.2"
      />
      <path
        d={`M${cx + 5} ${cy + 1} L${cx + 3} ${cy + 5} L${cx + 1} ${cy + 1} Z`}
        fill="#fff"
        stroke={INK}
        strokeWidth="1.2"
      />
    </g>
  ),
  grin: ({ cx, cy }) => (
    <g>
      <path
        d={`M${cx - 9} ${cy} Q${cx} ${cy + 8} ${cx + 9} ${cy}`}
        stroke={INK}
        strokeWidth="2.5"
        fill="#fff"
        strokeLinejoin="round"
      />
      <path
        d={`M${cx - 6} ${cy + 2} L${cx - 6} ${cy + 6} M${cx - 2} ${cy + 3} L${cx - 2} ${cy + 7} M${cx + 2} ${cy + 3} L${cx + 2} ${cy + 7} M${cx + 6} ${cy + 2} L${cx + 6} ${cy + 6}`}
        stroke={INK}
        strokeWidth="1.2"
      />
    </g>
  ),
  snarl: ({ cx, cy }) => (
    <g>
      <path
        d={`M${cx - 10} ${cy + 1} Q${cx} ${cy - 2} ${cx + 10} ${cy + 1}`}
        stroke={INK}
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d={`M${cx - 6} ${cy + 1} L${cx - 4} ${cy + 5} L${cx - 2} ${cy + 1} M${cx + 2} ${cy + 1} L${cx + 4} ${cy + 5} L${cx + 6} ${cy + 1}`}
        fill="#fff"
        stroke={INK}
        strokeWidth="1.2"
      />
    </g>
  ),
  slimy: ({ p, cx, cy }) => (
    <ellipse cx={cx} cy={cy + 2} rx="8" ry="3" fill={p.dark} stroke={INK} strokeWidth="2" />
  ),
  beak: ({ p, cx, cy }) => (
    <path
      d={`M${cx - 5} ${cy - 2} L${cx} ${cy + 6} L${cx + 5} ${cy - 2} Z`}
      fill={p.accent}
      stroke={INK}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  ),
  tentacles: ({ p, cx, cy }) => (
    <g>
      <path
        d={`M${cx - 6} ${cy + 2} Q${cx - 8} ${cy + 8} ${cx - 4} ${cy + 10}`}
        stroke={p.dark}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M${cx} ${cy + 2} Q${cx - 1} ${cy + 8} ${cx + 2} ${cy + 12}`}
        stroke={p.dark}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M${cx + 6} ${cy + 2} Q${cx + 8} ${cy + 8} ${cx + 4} ${cy + 10}`}
        stroke={p.dark}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  ),
  smirk: ({ cx, cy }) => (
    <path
      d={`M${cx - 6} ${cy} Q${cx} ${cy + 4} ${cx + 8} ${cy - 2}`}
      stroke={INK}
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
  ),
  none: () => null,
};

// ========== WEAPONS ==========
export const M_Weapons: Record<string, AnchorPart> = {
  club: ({ p, cx, cy }) => (
    <g transform={`rotate(-18 ${cx} ${cy})`}>
      <rect x={cx - 3} y={cy - 2} width="7" height="22" fill={p.accent} stroke={INK} strokeWidth="2" />
      <ellipse cx={cx + 0.5} cy={cy - 8} rx="9" ry="11" fill={p.accent} stroke={INK} strokeWidth="2.5" />
      <circle cx={cx - 3} cy={cy - 10} r="1.6" fill={INK} />
      <circle cx={cx + 4} cy={cy - 6} r="1.6" fill={INK} />
    </g>
  ),
  sword: ({ p, cx, cy }) => (
    <g transform={`rotate(-25 ${cx} ${cy})`}>
      <path
        d={`M${cx} ${cy - 22} L${cx + 4} ${cy + 4} L${cx - 4} ${cy + 4} Z`}
        fill="#e0e0e0"
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x={cx - 7} y={cy + 4} width="14" height="3" fill={p.accent} stroke={INK} strokeWidth="1.5" />
      <rect x={cx - 2} y={cy + 7} width="4" height="10" fill={p.dark} stroke={INK} strokeWidth="1.5" />
    </g>
  ),
  axe: ({ p, cx, cy }) => (
    <g transform={`rotate(-15 ${cx} ${cy})`}>
      <rect x={cx - 2} y={cy - 12} width="4" height="26" fill={p.dark} stroke={INK} strokeWidth="2" />
      <path
        d={`M${cx + 2} ${cy - 14} Q${cx + 16} ${cy - 10} ${cx + 14} ${cy - 2} Q${cx + 16} ${cy + 6} ${cx + 2} ${cy + 10} Z`}
        fill="#c0c0c0"
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </g>
  ),
  staff: ({ p, cx, cy }) => (
    <g transform={`rotate(8 ${cx} ${cy})`}>
      <rect x={cx - 2} y={cy - 18} width="4" height="36" fill={p.dark} stroke={INK} strokeWidth="2" />
      <circle cx={cx} cy={cy - 22} r="6" fill={p.accent} stroke={INK} strokeWidth="2" />
      <circle cx={cx - 1} cy={cy - 23} r="2" fill="#fff" opacity="0.7" />
    </g>
  ),
  claws: ({ p, cx, cy }) => (
    <g>
      <path
        d={`M${cx - 4} ${cy - 6} L${cx - 10} ${cy + 8} M${cx} ${cy - 8} L${cx - 2} ${cy + 10} M${cx + 4} ${cy - 6} L${cx + 8} ${cy + 8}`}
        stroke={p.light}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M${cx - 4} ${cy - 6} L${cx - 10} ${cy + 8} M${cx} ${cy - 8} L${cx - 2} ${cy + 10} M${cx + 4} ${cy - 6} L${cx + 8} ${cy + 8}`}
        stroke={INK}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  ),
  'bone-club': ({ cx, cy }) => (
    <g transform={`rotate(-20 ${cx} ${cy})`}>
      <rect x={cx - 2} y={cy - 8} width="5" height="22" fill="#eae4c8" stroke={INK} strokeWidth="2" />
      <circle cx={cx - 3} cy={cy - 12} r="5" fill="#eae4c8" stroke={INK} strokeWidth="2" />
      <circle cx={cx + 5} cy={cy - 12} r="5" fill="#eae4c8" stroke={INK} strokeWidth="2" />
    </g>
  ),
  pincers: ({ p, cx, cy }) => (
    <g>
      <path
        d={`M${cx - 4} ${cy - 4} Q${cx - 14} ${cy - 10} ${cx - 12} ${cy - 2} Q${cx - 8} ${cy} ${cx - 4} ${cy - 2}`}
        fill={p.dark}
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d={`M${cx + 4} ${cy - 4} Q${cx + 14} ${cy - 10} ${cx + 12} ${cy - 2} Q${cx + 8} ${cy} ${cx + 4} ${cy - 2}`}
        fill={p.dark}
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </g>
  ),
  none: () => null,
};

// ========== OFFHANDS ==========
export const M_Offhands: Record<string, AnchorPart> = {
  shield: ({ p, cx, cy }) => (
    <g>
      <path
        d={`M${cx} ${cy - 14} L${cx - 12} ${cy - 10} L${cx - 12} ${cy + 4} Q${cx - 12} ${cy + 12} ${cx} ${cy + 16} Q${cx + 12} ${cy + 12} ${cx + 12} ${cy + 4} L${cx + 12} ${cy - 10} Z`}
        fill={p.accent}
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d={`M${cx} ${cy - 8} L${cx} ${cy + 10} M${cx - 8} ${cy + 1} L${cx + 8} ${cy + 1}`}
        stroke={INK}
        strokeWidth="1.8"
      />
    </g>
  ),
  torch: ({ p, cx, cy }) => (
    <g>
      <rect x={cx - 1.5} y={cy - 2} width="3" height="18" fill={p.dark} stroke={INK} strokeWidth="1.5" />
      <path
        d={`M${cx - 6} ${cy - 4} Q${cx - 2} ${cy - 14} ${cx} ${cy - 16} Q${cx + 2} ${cy - 14} ${cx + 6} ${cy - 4} Q${cx + 2} ${cy - 8} ${cx} ${cy - 6} Q${cx - 2} ${cy - 8} ${cx - 6} ${cy - 4} Z`}
        fill="#ff8020"
        stroke={INK}
        strokeWidth="1.8"
      />
    </g>
  ),
  none: () => null,
};

// ========== WINGS ==========
export const M_Wings: Record<string, AnchorPart> = {
  bat: ({ p, cx, cy }) => (
    <g>
      <path
        d={`M${cx - 12} ${cy - 4} Q${cx - 34} ${cy - 16} ${cx - 32} ${cy + 10} Q${cx - 22} ${cy + 2} ${cx - 12} ${cy + 8} Z`}
        fill={p.dark}
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d={`M${cx + 12} ${cy - 4} Q${cx + 34} ${cy - 16} ${cx + 32} ${cy + 10} Q${cx + 22} ${cy + 2} ${cx + 12} ${cy + 8} Z`}
        fill={p.dark}
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </g>
  ),
  dragon: ({ p, cx, cy }) => (
    <g>
      <path
        d={`M${cx - 14} ${cy} Q${cx - 38} ${cy - 10} ${cx - 44} ${cy + 14} Q${cx - 30} ${cy + 4} ${cx - 14} ${cy + 14} Z`}
        fill={p.dark}
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d={`M${cx + 14} ${cy} Q${cx + 38} ${cy - 10} ${cx + 44} ${cy + 14} Q${cx + 30} ${cy + 4} ${cx + 14} ${cy + 14} Z`}
        fill={p.dark}
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d={`M${cx - 38} ${cy - 4} L${cx - 30} ${cy + 6} M${cx + 38} ${cy - 4} L${cx + 30} ${cy + 6}`}
        stroke={INK}
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
    </g>
  ),
  insect: ({ cx, cy }) => (
    <g opacity="0.85">
      <ellipse
        cx={cx - 16}
        cy={cy - 2}
        rx="14"
        ry="10"
        fill="#e8f0ff"
        stroke={INK}
        strokeWidth="2"
        opacity="0.8"
      />
      <ellipse
        cx={cx + 16}
        cy={cy - 2}
        rx="14"
        ry="10"
        fill="#e8f0ff"
        stroke={INK}
        strokeWidth="2"
        opacity="0.8"
      />
    </g>
  ),
  none: () => null,
};

// ========== LEGS ==========
export const M_Legs: Record<string, BodyPart> = {
  'humanoid-short': ({ p }) => (
    <g>
      <path
        d="M55 108 L52 122 L62 122 L62 108 Z"
        fill={p.skin}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M85 108 L78 122 L88 122 L85 108 Z"
        fill={p.skin}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse cx="56" cy="124" rx="8" ry="3" fill={p.dark} stroke={INK} strokeWidth="2" />
      <ellipse cx="84" cy="124" rx="8" ry="3" fill={p.dark} stroke={INK} strokeWidth="2" />
    </g>
  ),
  'humanoid-tall': ({ p }) => (
    <g>
      <rect x="52" y="110" width="10" height="16" fill={p.skin} stroke={INK} strokeWidth="3" />
      <rect x="78" y="110" width="10" height="16" fill={p.skin} stroke={INK} strokeWidth="3" />
      <ellipse cx="57" cy="128" rx="9" ry="3" fill={p.dark} stroke={INK} strokeWidth="2" />
      <ellipse cx="83" cy="128" rx="9" ry="3" fill={p.dark} stroke={INK} strokeWidth="2" />
    </g>
  ),
  'beast-four': ({ p }) => (
    <g>
      <rect x="38" y="104" width="6" height="18" fill={p.skin} stroke={INK} strokeWidth="2.5" />
      <rect x="58" y="108" width="6" height="14" fill={p.skin} stroke={INK} strokeWidth="2.5" />
      <rect x="78" y="108" width="6" height="14" fill={p.skin} stroke={INK} strokeWidth="2.5" />
      <rect x="98" y="104" width="6" height="18" fill={p.skin} stroke={INK} strokeWidth="2.5" />
    </g>
  ),
  bone: ({ p }) => (
    <g>
      <rect x="55" y="108" width="6" height="18" fill={p.skin} stroke={INK} strokeWidth="2.5" />
      <rect x="79" y="108" width="6" height="18" fill={p.skin} stroke={INK} strokeWidth="2.5" />
      <circle cx="58" cy="127" r="4" fill={p.skin} stroke={INK} strokeWidth="2" />
      <circle cx="82" cy="127" r="4" fill={p.skin} stroke={INK} strokeWidth="2" />
    </g>
  ),
  none: () => null,
};

// ========== ARMS ==========
export const M_Arms: Record<string, BodyPart> = {
  humanoid: ({ p }) => (
    <g>
      <path
        d="M50 62 Q38 78 40 96"
        stroke={p.skin}
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M50 62 Q38 78 40 96"
        stroke={INK}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M90 62 Q102 78 100 96"
        stroke={p.skin}
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M90 62 Q102 78 100 96"
        stroke={INK}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  ),
  bulky: ({ p }) => (
    <g>
      <path
        d="M44 62 Q30 80 34 100"
        stroke={p.skin}
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M44 62 Q30 80 34 100"
        stroke={INK}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M96 62 Q110 80 106 100"
        stroke={p.skin}
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M96 62 Q110 80 106 100"
        stroke={INK}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  ),
  bone: ({ p }) => (
    <g>
      <path
        d="M50 60 Q36 78 38 98"
        stroke={p.skin}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M50 60 Q36 78 38 98"
        stroke={INK}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M90 60 Q104 78 102 98"
        stroke={p.skin}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M90 60 Q104 78 102 98"
        stroke={INK}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  ),
  none: () => null,
};

// ========== TAILS ==========
export const M_Tails: Record<string, BodyPart> = {
  rat: ({ p }) => (
    <path
      d="M104 92 Q122 86 126 96 Q128 106 118 110"
      stroke={p.skin}
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
  ),
  devil: ({ p }) => (
    <g>
      <path
        d="M100 108 Q120 112 124 126"
        stroke={p.skin}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M122 122 L128 130 L120 128 Z"
        fill={p.accent}
        stroke={INK}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </g>
  ),
  dragon: ({ p }) => (
    <path
      d="M102 96 Q130 88 132 108 Q132 122 118 126"
      stroke={p.skin}
      strokeWidth="8"
      fill="none"
      strokeLinecap="round"
    />
  ),
  none: () => null,
};
