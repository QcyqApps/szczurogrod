// Skeletons: proportions + anchor slot positions + part composition order.

import type { ReactNode } from 'react';
import { MONSTER_INK as INK } from './palettes';
import type { MonsterPalette } from './palettes';
import {
  M_Arms,
  M_Bodies,
  M_Ears,
  M_Eyes,
  M_Heads,
  M_Horns,
  M_Legs,
  M_Mouths,
  M_Offhands,
  M_Tails,
  M_Weapons,
  M_Wings,
} from './parts';

export type SkeletonKey =
  | 'humanoid'
  | 'humanoid-big'
  | 'skeleton'
  | 'blob'
  | 'beast'
  | 'flying'
  | 'bone-dragon';

export interface RecipeParts {
  head?: string;
  body?: string;
  ears?: string;
  horns?: string;
  eyes?: string;
  mouth?: string;
  arms?: string;
  legs?: string;
  weapon?: string;
  offhand?: string;
  wings?: string;
  tail?: string;
}

interface Skeleton {
  headAnchor: { cx: number; cy: number };
  render: (parts: RecipeParts, p: MonsterPalette) => ReactNode;
}

// Dynamic part lookup — parts share a palette arg plus optional anchor coords.
// Types are erased at the boundary because the system is data-driven by recipe.
type PartLib<Args> = Record<string, (args: Args) => ReactNode>;

function part<Args>(
  lib: PartLib<Args>,
  key: string | undefined,
  fallback: string,
  args: Args,
): ReactNode {
  const renderer = lib[key ?? fallback] ?? lib[fallback];
  return renderer ? renderer(args) : null;
}

export const SKELETONS: Record<SkeletonKey, Skeleton> = {
  humanoid: {
    headAnchor: { cx: 70, cy: 35 },
    render: (parts, p) => (
      <>
        {part(M_Tails, parts.tail, 'none', { p })}
        {part(M_Legs, parts.legs, 'humanoid-short', { p })}
        {part(M_Bodies, parts.body, 'humanoid-lean', { p })}
        {part(M_Arms, parts.arms, 'humanoid', { p })}
        {part(M_Weapons, parts.weapon, 'none', { p, cx: 35, cy: 96 })}
        {part(M_Offhands, parts.offhand, 'none', { p, cx: 105, cy: 96 })}
        {part(M_Ears, parts.ears, 'none', { p, cx: 70, cy: 36 })}
        {part(M_Heads, parts.head, 'goblin', { p, cx: 70, cy: 35 })}
        {part(M_Horns, parts.horns, 'none', { p, cx: 70, cy: 35 })}
        {part(M_Eyes, parts.eyes, 'angry-slit', { p, cx: 70, cy: 37 })}
        {part(M_Mouths, parts.mouth, 'fangs', { p, cx: 70, cy: 46 })}
      </>
    ),
  },
  'humanoid-big': {
    headAnchor: { cx: 70, cy: 38 },
    render: (parts, p) => (
      <>
        {part(M_Tails, parts.tail, 'none', { p })}
        {part(M_Legs, parts.legs, 'humanoid-tall', { p })}
        {part(M_Bodies, parts.body, 'humanoid-bulk', { p })}
        {part(M_Arms, parts.arms, 'bulky', { p })}
        {part(M_Weapons, parts.weapon, 'none', { p, cx: 30, cy: 100 })}
        {part(M_Offhands, parts.offhand, 'none', { p, cx: 110, cy: 100 })}
        {part(M_Ears, parts.ears, 'none', { p, cx: 70, cy: 38 })}
        {part(M_Heads, parts.head, 'round-big', { p, cx: 70, cy: 38 })}
        {part(M_Horns, parts.horns, 'none', { p, cx: 70, cy: 38 })}
        {part(M_Eyes, parts.eyes, 'angry-slit', { p, cx: 70, cy: 40 })}
        {part(M_Mouths, parts.mouth, 'snarl', { p, cx: 70, cy: 50 })}
      </>
    ),
  },
  skeleton: {
    headAnchor: { cx: 70, cy: 35 },
    // Tails + wings default to 'none', so szkielet-humanoid (żołnierz, kapitan,
    // widmo) nie zmienia się. Tylko kompozycje które jawnie ustawią `wings` /
    // `tail` (np. Kościany Smok) je dostaną — rysowane za ciałem, więc
    // silhouette od razu czyta się 'dragon' zamiast 'humanoid skeleton'.
    render: (parts, p) => (
      <>
        {part(M_Tails, parts.tail, 'none', { p })}
        {part(M_Wings, parts.wings, 'none', { p, cx: 70, cy: 76 })}
        {part(M_Legs, parts.legs, 'bone', { p })}
        {part(M_Bodies, parts.body, 'skeleton-ribs', { p })}
        {part(M_Arms, parts.arms, 'bone', { p })}
        {part(M_Weapons, parts.weapon, 'none', { p, cx: 35, cy: 96 })}
        {part(M_Offhands, parts.offhand, 'none', { p, cx: 105, cy: 96 })}
        {part(M_Heads, parts.head, 'skull', { p, cx: 70, cy: 35 })}
        {part(M_Horns, parts.horns, 'none', { p, cx: 70, cy: 35 })}
        {part(M_Eyes, parts.eyes, 'hollow', { p, cx: 70, cy: 37 })}
      </>
    ),
  },
  blob: {
    headAnchor: { cx: 70, cy: 90 },
    render: (parts, p) => (
      <>
        {part(M_Bodies, parts.body, 'blob', { p })}
        {part(M_Eyes, parts.eyes, 'big-round', { p, cx: 70, cy: 88 })}
        {part(M_Mouths, parts.mouth, 'slimy', { p, cx: 70, cy: 100 })}
      </>
    ),
  },
  beast: {
    headAnchor: { cx: 35, cy: 80 },
    render: (parts, p) => (
      <>
        {part(M_Tails, parts.tail, 'none', { p })}
        {part(M_Legs, parts.legs, 'beast-four', { p })}
        {part(M_Bodies, parts.body, 'beast-low', { p })}
        {part(M_Ears, parts.ears, 'none', { p, cx: 35, cy: 78 })}
        {part(M_Heads, parts.head, 'rat-snout', { p, cx: 35, cy: 82 })}
        {part(M_Horns, parts.horns, 'none', { p, cx: 35, cy: 78 })}
        {part(M_Eyes, parts.eyes, 'dots', { p, cx: 32, cy: 78 })}
      </>
    ),
  },
  flying: {
    headAnchor: { cx: 70, cy: 60 },
    render: (parts, p) => (
      <>
        {part(M_Wings, parts.wings, 'bat', { p, cx: 70, cy: 76 })}
        {part(M_Bodies, parts.body, 'flying', { p })}
        {part(M_Ears, parts.ears, 'none', { p, cx: 70, cy: 62 })}
        {part(M_Heads, parts.head, 'goblin', { p, cx: 70, cy: 62 })}
        {part(M_Horns, parts.horns, 'none', { p, cx: 70, cy: 62 })}
        {part(M_Eyes, parts.eyes, 'glowing', { p, cx: 70, cy: 64 })}
        {part(M_Mouths, parts.mouth, 'fangs', { p, cx: 70, cy: 72 })}
      </>
    ),
  },
  // Dedicated boss composition: nie reużywa modułowych części (silhouette
  // humanoid nie łapie smoczej sylwetki). Cała postać narysowana "z ręki"
  // w tym samym style co reszta potworów: gruba czarna kreska INK,
  // dwupaletowe wypełnienia (skin / dark / light / eye / accent).
  'bone-dragon': {
    headAnchor: { cx: 70, cy: 32 },
    render: (_parts, p) => (
      <>
        {/* ===== LEFT WING (behind everything) ===== */}
        <g>
          <path
            d="M56 52 Q30 18 8 28 Q4 52 20 70 Q36 66 54 68 Z"
            fill={p.dark}
            stroke={INK}
            strokeWidth="2.5"
            strokeLinejoin="round"
            opacity="0.95"
          />
          {/* Finger bones radiating from shoulder */}
          <path
            d="M56 52 L10 28 M56 52 L6 44 M56 52 L8 60 M56 52 L20 70"
            stroke={p.light}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M56 52 L10 28 M56 52 L6 44 M56 52 L8 60 M56 52 L20 70"
            stroke={INK}
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* ===== RIGHT WING (behind everything) ===== */}
        <g>
          <path
            d="M84 52 Q110 18 132 28 Q136 52 120 70 Q104 66 86 68 Z"
            fill={p.dark}
            stroke={INK}
            strokeWidth="2.5"
            strokeLinejoin="round"
            opacity="0.95"
          />
          <path
            d="M84 52 L130 28 M84 52 L134 44 M84 52 L132 60 M84 52 L120 70"
            stroke={p.light}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M84 52 L130 28 M84 52 L134 44 M84 52 L132 60 M84 52 L120 70"
            stroke={INK}
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* ===== TAIL (coils to the right, behind body) ===== */}
        <path
          d="M82 106 Q114 108 124 124 Q118 136 100 132"
          fill="none"
          stroke={p.skin}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M82 106 Q114 108 124 124 Q118 136 100 132"
          fill="none"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Tail vertebrae */}
        <path
          d="M92 110 L94 104 M102 112 L105 106 M112 116 L116 111 M119 124 L123 120"
          stroke={INK}
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* ===== HIND LEGS (bent, behind body so hips tuck under) ===== */}
        {/* Left leg */}
        <path
          d="M60 98 Q48 114 52 128"
          fill="none"
          stroke={p.skin}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M60 98 Q48 114 52 128"
          fill="none"
          stroke={INK}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Left foot + claws */}
        <path
          d="M52 128 L44 136 M52 128 L50 138 M52 128 L58 136"
          stroke={INK}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Right leg */}
        <path
          d="M80 98 Q92 114 88 128"
          fill="none"
          stroke={p.skin}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M80 98 Q92 114 88 128"
          fill="none"
          stroke={INK}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Right foot + claws */}
        <path
          d="M88 128 L96 136 M88 128 L90 138 M88 128 L82 136"
          stroke={INK}
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* ===== BODY (skeletal torso, ribcage visible) ===== */}
        <path
          d="M54 56 Q48 78 52 100 Q60 114 70 114 Q80 114 88 100 Q92 78 86 56 Q70 50 54 56 Z"
          fill={p.skin}
          stroke={INK}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Ribs wrapping across body */}
        <path
          d="M54 66 Q70 70 86 66 M53 76 Q70 80 87 76 M53 88 Q70 92 87 88 M55 100 Q70 104 85 100"
          fill="none"
          stroke={INK}
          strokeWidth="2"
          opacity="0.75"
        />
        {/* Sternum (vertical spine line) */}
        <path d="M70 58 L70 112" stroke={INK} strokeWidth="1.8" opacity="0.55" />

        {/* ===== NECK (connects body to skull) ===== */}
        <path
          d="M58 56 Q56 44 62 36 Q70 30 78 36 Q84 44 82 56 Z"
          fill={p.skin}
          stroke={INK}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Neck vertebrae */}
        <path
          d="M62 48 L78 48 M64 42 L76 42"
          stroke={INK}
          strokeWidth="1.6"
          opacity="0.6"
        />

        {/* ===== SKULL (symmetric dragon cranium with snout) ===== */}
        {/* Main cranium dome */}
        <path
          d="M50 24 Q44 36 50 46 L58 48 L62 52 L64 56 Q70 60 76 56 L78 52 L82 48 L90 46 Q96 36 90 24 Q80 16 70 16 Q60 16 50 24 Z"
          fill={p.skin}
          stroke={INK}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Snout division line (upper jaw) */}
        <path
          d="M58 48 Q70 52 82 48"
          fill="none"
          stroke={INK}
          strokeWidth="2"
        />
        {/* Teeth (zigzag in the jaw gap) */}
        <path
          d="M60 48 L62 54 L64 48 L66 54 L68 48 L70 54 L72 48 L74 54 L76 48 L78 54 L80 48"
          fill="none"
          stroke={INK}
          strokeWidth="1.6"
        />
        {/* Skull cracks for age/undead vibe */}
        <path
          d="M58 28 L62 34 M84 26 L80 32 M72 20 L74 26"
          stroke={INK}
          strokeWidth="1"
          opacity="0.5"
          strokeLinecap="round"
        />
        {/* Eye sockets (hollow) */}
        <ellipse cx="60" cy="32" rx="4.5" ry="5" fill={INK} />
        <ellipse cx="80" cy="32" rx="4.5" ry="5" fill={INK} />
        {/* Glowing pupils */}
        <circle cx="60" cy="32" r="2.4" fill={p.eye} />
        <circle cx="80" cy="32" r="2.4" fill={p.eye} />
        {/* Glow halo */}
        <circle cx="60" cy="32" r="3.6" fill={p.eye} opacity="0.28" />
        <circle cx="80" cy="32" r="3.6" fill={p.eye} opacity="0.28" />
        {/* Nostril slits */}
        <path
          d="M66 44 L68 46 M72 46 L74 44"
          stroke={INK}
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* ===== HORNS (curl back over skull) ===== */}
        <path
          d="M52 22 Q38 14 34 2 M88 22 Q102 14 106 2"
          fill="none"
          stroke={p.light}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M52 22 Q38 14 34 2 M88 22 Q102 14 106 2"
          fill="none"
          stroke={INK}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Horn ridges (segment marks) */}
        <path
          d="M46 16 L43 20 M40 10 L36 13 M94 16 L97 20 M100 10 L104 13"
          stroke={INK}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.7"
        />
      </>
    ),
  },
};
