import { MONSTER_INK as INK, MONSTER_PALETTES } from './palettes';
import { SKELETONS } from './skeletons';
import type { MonsterRecipe } from './recipes';

export interface MonsterProps {
  recipe: MonsterRecipe | null | undefined;
  size?: number;
}

export function Monster({ recipe, size = 140 }: MonsterProps) {
  if (!recipe) return null;
  const sk = SKELETONS[recipe.skeleton] ?? SKELETONS.humanoid;
  const p = MONSTER_PALETTES[recipe.palette] ?? MONSTER_PALETTES.swamp;
  const scale = recipe.size ?? 1;
  return (
    <svg
      viewBox="0 0 140 140"
      width={size}
      height={size}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <g transform={`translate(70 70) scale(${scale}) translate(-70 -70)`}>
        {sk.render(recipe.parts ?? {}, p)}
      </g>
      {recipe.tier === 'elite' && (
        <circle
          cx="70"
          cy="70"
          r="66"
          fill="none"
          stroke={p.accent}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.7"
        />
      )}
      {recipe.tier === 'boss' && (
        <g>
          <g transform="translate(58 4)">
            <path
              d="M0 10 L3 2 L6 8 L12 0 L18 8 L21 2 L24 10 L22 14 L2 14 Z"
              fill="#ffc830"
              stroke={INK}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="5" r="1.8" fill="#c83232" stroke={INK} strokeWidth="1" />
          </g>
        </g>
      )}
    </svg>
  );
}
