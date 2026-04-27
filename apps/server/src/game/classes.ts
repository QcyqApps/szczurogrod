import type { CharacterClass, CharacterStats } from '@grodno/shared';

interface ClassPreset {
  defaultName: string;
  stats: CharacterStats;
  hp: number;
  mp: number;
  stamina: number;
}

export const CLASS_PRESETS: Record<CharacterClass, ClassPreset> = {
  warrior: {
    defaultName: 'Sir Mruczek',
    stats: { atk: 18, def: 14, mag: 4, spd: 7 },
    hp: 180,
    mp: 40,
    stamina: 10,
  },
  mage: {
    defaultName: 'Arcymag Psikus',
    stats: { atk: 6, def: 8, mag: 22, spd: 9 },
    hp: 110,
    mp: 120,
    stamina: 10,
  },
  rogue: {
    defaultName: 'Cichy Stefan',
    stats: { atk: 14, def: 10, mag: 6, spd: 16 },
    hp: 130,
    mp: 60,
    stamina: 10,
  },
};
