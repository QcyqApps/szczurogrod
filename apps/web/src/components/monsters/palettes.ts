export interface MonsterPalette {
  skin: string;
  dark: string;
  light: string;
  accent: string;
  eye: string;
}

export const MONSTER_PALETTES = {
  swamp: { skin: '#7a9a3a', dark: '#3a5a1a', light: '#b4d070', accent: '#c4a04a', eye: '#ffcc00' },
  forest: { skin: '#8a6a3a', dark: '#4a3a1a', light: '#c4a474', accent: '#6a9a3a', eye: '#f4e090' },
  frost: { skin: '#a0c8e0', dark: '#4a6a90', light: '#e0f0ff', accent: '#c4e0f8', eye: '#80c8ff' },
  demon: { skin: '#b43030', dark: '#6a1818', light: '#e06a6a', accent: '#ffc830', eye: '#ffe060' },
  shadow: { skin: '#3a2a4a', dark: '#1a0a2a', light: '#6a5a7a', accent: '#8a3a8a', eye: '#c880ff' },
  undead: { skin: '#d4d0b8', dark: '#6a6450', light: '#f0ecd8', accent: '#8a3a8a', eye: '#a0f0a0' },
  bone: { skin: '#eae4c8', dark: '#8a7a5a', light: '#fff8e0', accent: '#8a3030', eye: '#e04040' },
  ooze: { skin: '#6ac8a0', dark: '#2a6a50', light: '#a0e8c4', accent: '#ffee80', eye: '#ffffff' },
  rat: { skin: '#8a6a4a', dark: '#4a2a1a', light: '#c4a484', accent: '#f0d0a0', eye: '#c82020' },
  stone: { skin: '#9a9a8a', dark: '#5a5a4a', light: '#c4c4b0', accent: '#d4a24c', eye: '#ffc830' },
  royal: { skin: '#c08040', dark: '#6a3a10', light: '#e8b070', accent: '#ffc830', eye: '#3a3a3a' },
  void: { skin: '#2a1a3a', dark: '#0a0210', light: '#5a3a7a', accent: '#c840ff', eye: '#ff40ff' },
} as const satisfies Record<string, MonsterPalette>;

export type PaletteKey = keyof typeof MONSTER_PALETTES;

export const MONSTER_INK = '#2a1810';
