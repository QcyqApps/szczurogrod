// Avatar appearance — shared by client (renderer) and server (validation/storage).

export type CharacterClass = 'warrior' | 'mage' | 'rogue';

export type SkinKey = 'pale' | 'medium' | 'tan' | 'dark' | 'green';
export type HairStyle = 'bald' | 'short' | 'messy' | 'long' | 'mohawk' | 'ponytail';
export type HairColorKey = 'black' | 'brown' | 'blond' | 'red' | 'white' | 'purple';
export type BeardStyle = 'none' | 'stubble' | 'full' | 'goatee';
export type EyeStyle = 'normal' | 'angry' | 'sleepy' | 'glow';
export type EyeColorKey = 'brown' | 'blue' | 'green' | 'yellow' | 'red';
export type MouthStyle = 'neutral' | 'smirk' | 'grin' | 'grim';
export type AccessoryStyle = 'none' | 'scar' | 'eyepatch' | 'monocle' | 'mask';
export type HeadwearStyle =
  | 'auto'
  | 'none'
  | 'helmet'
  | 'wizardHat'
  | 'hood'
  | 'crown'
  | 'bandana'
  // Premium — odblokowywane za gemy.
  | 'dragonHelm'
  | 'lichCrown'
  | 'valkyrieHelm'
  | 'archmageHat'
  | 'shadowVeil'
  | 'goldenLaurel'
  | 'hornedHelm';

/**
 * Styl zbroi — renderowany na barkach/torsie awatara w `accentColor`.
 * `plain` = domyślny, free; pozostałe = premium (odblokowanie za gemy).
 */
export type ArmorStyle = 'plain' | 'plate' | 'scale' | 'arcane' | 'bone' | 'dragon';

export interface Appearance {
  skin: SkinKey;
  hairStyle: HairStyle;
  hairColor: HairColorKey;
  beardStyle: BeardStyle;
  eyes: EyeStyle;
  eyeColor: EyeColorKey;
  mouth: MouthStyle;
  accessory: AccessoryStyle;
  headwear: HeadwearStyle;
  /** Domyślnie 'plain' — backwards-compat dla starych zapisanych jsonb. */
  armor: ArmorStyle;
  accentColor: string;
  /**
   * Slugi premium kosmetyków odblokowanych przez tę postać. Gracz płaci raz,
   * potem może swobodnie zmieniać między equipped i unequipped. Stare postacie
   * sprzed feature'a mają undefined — `mergeAppearance` daje [].
   */
  unlockedCosmetics: string[];
}

export type ResolvedAppearance = Omit<Appearance, 'headwear'> & {
  headwear: Exclude<HeadwearStyle, 'auto'>;
};

export const APPEARANCE_DEFAULTS: Appearance = {
  skin: 'medium',
  hairStyle: 'messy',
  hairColor: 'brown',
  beardStyle: 'none',
  eyes: 'normal',
  eyeColor: 'brown',
  mouth: 'neutral',
  accessory: 'none',
  headwear: 'auto',
  armor: 'plain',
  accentColor: '#c83232',
  unlockedCosmetics: [],
};

/**
 * Premium katalog — slugi headwear/armor które wymagają odblokowania za gemy.
 * `none`/`auto`/podstawowe pozostają free. Cena jednolita (`COSMETIC_UNLOCK_COST`).
 */
export const PREMIUM_HEADWEARS: ReadonlySet<HeadwearStyle> = new Set([
  'dragonHelm',
  'lichCrown',
  'valkyrieHelm',
  'archmageHat',
  'shadowVeil',
  'goldenLaurel',
  'hornedHelm',
]);

export const PREMIUM_ARMORS: ReadonlySet<ArmorStyle> = new Set([
  'plate',
  'scale',
  'arcane',
  'bone',
  'dragon',
]);

export const COSMETIC_UNLOCK_COST = 30;

/**
 * Tworzy unique slug dla cosmetic'a — `headwear:dragonHelm`, `armor:plate`.
 * Składnia ułatwia walidację serverową bez collision między pulami.
 */
export function cosmeticSlug(
  kind: 'headwear' | 'armor',
  value: HeadwearStyle | ArmorStyle,
): string {
  return `${kind}:${value}`;
}

/** Czy dany headwear wymaga unlocka? */
export function isHeadwearPremium(h: HeadwearStyle): boolean {
  return PREMIUM_HEADWEARS.has(h);
}

/** Czy dany armor wymaga unlocka? */
export function isArmorPremium(a: ArmorStyle): boolean {
  return PREMIUM_ARMORS.has(a);
}

export const SKIN_TONES: Record<SkinKey, { base: string; shadow: string }> = {
  pale: { base: '#f4d5b0', shadow: '#d8b090' },
  medium: { base: '#e8b888', shadow: '#c89060' },
  tan: { base: '#c89060', shadow: '#a06838' },
  dark: { base: '#8a5a38', shadow: '#603820' },
  green: { base: '#88b850', shadow: '#5a8a2a' },
};

export const HAIR_COLORS: Record<HairColorKey, string> = {
  black: '#1a1210',
  brown: '#5a3a1a',
  blond: '#e8c870',
  red: '#c04020',
  white: '#f0e8d8',
  purple: '#6a3a8a',
};

export const EYE_COLORS: Record<EyeColorKey, string> = {
  brown: '#3a1a10',
  blue: '#2a5a8a',
  green: '#3a7a3a',
  yellow: '#e0a820',
  red: '#c02020',
};

export function mergeAppearance(
  partial: Partial<Appearance> | null | undefined,
  cls: CharacterClass,
): ResolvedAppearance {
  const base: Appearance = {
    ...APPEARANCE_DEFAULTS,
    ...(partial ?? {}),
    // Pola dodane później — partial może ich nie mieć w starszych zapisach.
    armor: partial?.armor ?? APPEARANCE_DEFAULTS.armor,
    unlockedCosmetics: partial?.unlockedCosmetics ?? [...APPEARANCE_DEFAULTS.unlockedCosmetics],
  };
  const resolvedHeadwear: ResolvedAppearance['headwear'] =
    base.headwear === 'auto'
      ? cls === 'mage'
        ? 'wizardHat'
        : cls === 'rogue'
          ? 'hood'
          : 'helmet'
      : base.headwear;
  return { ...base, headwear: resolvedHeadwear };
}
