export { AvatarPortrait } from './AvatarPortrait';
export type { AvatarPortraitProps } from './AvatarPortrait';

// Types + constants now live in the shared package. Re-exported for convenience
// so existing imports like `from '@/components/avatar'` keep working.
export {
  APPEARANCE_DEFAULTS,
  SKIN_TONES,
  HAIR_COLORS,
  EYE_COLORS,
  mergeAppearance,
} from '@grodno/shared';
export type {
  Appearance,
  ResolvedAppearance,
  CharacterClass,
  SkinKey,
  HairStyle,
  HairColorKey,
  BeardStyle,
  EyeStyle,
  EyeColorKey,
  MouthStyle,
  AccessoryStyle,
  HeadwearStyle,
  ArmorStyle,
} from '@grodno/shared';
