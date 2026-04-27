import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  AvatarPortrait,
  EYE_COLORS,
  HAIR_COLORS,
  SKIN_TONES,
  mergeAppearance,
} from '@/components/avatar';
import type {
  Appearance,
  ArmorStyle,
  BeardStyle,
  CharacterClass,
  EyeColorKey,
  EyeStyle,
  HairColorKey,
  HairStyle,
  HeadwearStyle,
  MouthStyle,
  AccessoryStyle,
  ResolvedAppearance,
  SkinKey,
} from '@/components/avatar';
import {
  COSMETIC_UNLOCK_COST,
  cosmeticSlug,
  isArmorPremium,
  isHeadwearPremium,
} from '@grodno/shared';
import { GameIcon } from '@/components/game-icons';
import { IcoGem } from '@/components/icons';

const ACCENT_CHOICES = [
  '#c83232',
  '#d4a24c',
  '#6a3a8a',
  '#3a5a8a',
  '#4a7c3a',
  '#e07820',
  '#2a1810',
  '#b0b0b0',
];

const SKIN_LABELS: Record<SkinKey, string> = {
  pale: 'Jasna',
  medium: 'Śr.',
  tan: 'Opal.',
  dark: 'Ciemna',
  green: 'Ork!',
};
const HAIR_STYLE_LABELS: Record<HairStyle, string> = {
  bald: 'Łysy',
  short: 'Krótka',
  messy: 'Nieład',
  long: 'Długa',
  mohawk: 'Mohawk',
  ponytail: 'Kucyk',
};
const HAIR_COLOR_LABELS: Record<HairColorKey, string> = {
  black: 'Czar.',
  brown: 'Brąz',
  blond: 'Blond',
  red: 'Rudy',
  white: 'Siwy',
  purple: 'Fiol.',
};
const BEARD_LABELS: Record<BeardStyle, string> = {
  none: 'Brak',
  stubble: 'Zarost',
  goatee: 'Kozia',
  full: 'Pełna',
};
const EYE_LABELS: Record<EyeStyle, string> = {
  normal: 'Norm.',
  angry: 'Wkurz.',
  sleepy: 'Senne',
  glow: 'Świec.',
};
const EYE_COLOR_LABELS: Record<EyeColorKey, string> = {
  brown: 'Brąz',
  blue: 'Nieb.',
  green: 'Ziel.',
  yellow: 'Żółty',
  red: 'Czer.',
};
const MOUTH_LABELS: Record<MouthStyle, string> = {
  neutral: 'Neutr.',
  smirk: 'Uśmieszek',
  grin: 'Zęby',
  grim: 'Ponury',
};
const ACCESSORY_LABELS: Record<AccessoryStyle, string> = {
  none: 'Brak',
  scar: 'Blizna',
  eyepatch: 'Opaska',
  monocle: 'Monokl',
  mask: 'Maska',
};
const HEADWEAR_LABELS: Record<HeadwearStyle, string> = {
  auto: 'Auto',
  none: 'Brak',
  helmet: 'Hełm',
  wizardHat: 'Kapelusz',
  hood: 'Kaptur',
  crown: 'Korona',
  bandana: 'Bandana',
  dragonHelm: 'Smoczy hełm',
  lichCrown: 'Korona licha',
  valkyrieHelm: 'Hełm walkirii',
  archmageHat: 'Kapelusz arcymaga',
  shadowVeil: 'Welon cienia',
  goldenLaurel: 'Laur',
  hornedHelm: 'Rogi',
};
const ARMOR_LABELS: Record<ArmorStyle, string> = {
  plain: 'Tunika',
  plate: 'Pełna płyta',
  scale: 'Łuski',
  arcane: 'Szata maga',
  bone: 'Kości',
  dragon: 'Smocza',
};

const HEADWEAR_ORDER_FREE: Exclude<HeadwearStyle, 'auto'>[] = [
  'none',
  'helmet',
  'wizardHat',
  'hood',
  'crown',
  'bandana',
];
const HEADWEAR_ORDER_PREMIUM: Exclude<HeadwearStyle, 'auto'>[] = [
  'dragonHelm',
  'lichCrown',
  'valkyrieHelm',
  'archmageHat',
  'shadowVeil',
  'goldenLaurel',
  'hornedHelm',
];
const ARMOR_ORDER_FREE: ArmorStyle[] = ['plain'];
const ARMOR_ORDER_PREMIUM: ArmorStyle[] = ['plate', 'scale', 'arcane', 'bone', 'dragon'];

type CreatorAppearance = ResolvedAppearance;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="h-title" style={{ fontSize: 12, marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  swatch,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  swatch?: string;
}) {
  return (
    <div
      className="clickable no-select"
      onClick={onClick}
      style={{
        background: active ? '#d4a24c' : '#e8dcb9',
        border: '2.5px solid #2a1810',
        borderRadius: 9,
        padding: '5px 9px',
        fontFamily: 'Luckiest Guy, sans-serif',
        fontSize: 13,
        letterSpacing: 0.4,
        boxShadow: active ? '2px 2px 0 #2a1810' : 'none',
        transform: active ? 'translate(-1px,-1px)' : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {swatch && (
        <span
          style={{
            width: 12,
            height: 12,
            background: swatch,
            border: '1.5px solid #2a1810',
            borderRadius: 3,
          }}
        />
      )}
      {children}
    </div>
  );
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface ScreenCreatorProps {
  cls: CharacterClass;
  appearance?: Partial<Appearance> | null;
  onSave: (appearance: CreatorAppearance) => void;
  onCancel: () => void;
  /**
   * Tryb edycji vs kreatora. `'edit'` = post-creation, premium kosmetyki widoczne
   * z lock badge i odblokowywalne za gemy. `'create'` (default) = nowa postać,
   * premium ukryte (server i tak je odrzuca w `me.createCharacter`).
   */
  mode?: 'create' | 'edit';
  /** Liczba gemów postaci — używane do walidacji unlocku. Wymagane gdy mode='edit'. */
  gems?: number;
  /**
   * Callback odblokowania premium kosmetyku. Po sukcesie ScreenCreator
   * spodziewa się że `appearance.unlockedCosmetics` zostanie zaktualizowane
   * w prop'ie (parent re-fetchuje me.get).
   */
  onUnlock?: (slug: string) => Promise<void>;
}

export function ScreenCreator({
  cls,
  appearance,
  onSave,
  onCancel,
  mode = 'create',
  gems = 0,
  onUnlock,
}: ScreenCreatorProps) {
  const [app, setApp] = useState<CreatorAppearance>(() => mergeAppearance(appearance, cls));
  const [unlockTarget, setUnlockTarget] = useState<{
    kind: 'headwear' | 'armor';
    value: Exclude<HeadwearStyle, 'auto'> | ArmorStyle;
    label: string;
  } | null>(null);
  const [unlockPending, setUnlockPending] = useState(false);

  const unlockedSet = new Set(app.unlockedCosmetics);

  function set<K extends keyof CreatorAppearance>(key: K, value: CreatorAppearance[K]) {
    setApp((prev) => ({ ...prev, [key]: value }));
  }

  /**
   * Klik na lockowany premium chip. W trybie 'create' (kreator nowej postaci)
   * premium nie są w ogóle renderowane, więc ten kod pamięta tylko o 'edit'.
   * Otwiera modal z preview applied — gracz widzi jak będzie wyglądał.
   */
  function tryPickPremium(
    kind: 'headwear' | 'armor',
    value: Exclude<HeadwearStyle, 'auto'> | ArmorStyle,
    label: string,
  ) {
    const slug = cosmeticSlug(kind, value);
    if (unlockedSet.has(slug)) {
      // Już odblokowane — equip natychmiast.
      if (kind === 'headwear') set('headwear', value as Exclude<HeadwearStyle, 'auto'>);
      else set('armor', value as ArmorStyle);
      return;
    }
    // Niezalockowane — preview live + modal kupna.
    if (kind === 'headwear') set('headwear', value as Exclude<HeadwearStyle, 'auto'>);
    else set('armor', value as ArmorStyle);
    setUnlockTarget({ kind, value, label });
  }

  async function handleUnlock() {
    if (!unlockTarget || !onUnlock) return;
    setUnlockPending(true);
    try {
      await onUnlock(cosmeticSlug(unlockTarget.kind, unlockTarget.value));
      // Optimistic: dorzucamy do lokalnej setki — parent powinien też re-fetchować.
      setApp((prev) => ({
        ...prev,
        unlockedCosmetics: [
          ...prev.unlockedCosmetics,
          cosmeticSlug(unlockTarget.kind, unlockTarget.value),
        ],
      }));
      setUnlockTarget(null);
    } finally {
      setUnlockPending(false);
    }
  }

  function cancelUnlock() {
    if (!unlockTarget) return;
    // Revert preview — wracamy do pierwszego free wariantu.
    if (unlockTarget.kind === 'headwear') set('headwear', 'none');
    else set('armor', 'plain');
    setUnlockTarget(null);
  }

  /**
   * Walidacja przed save. Jeśli appearance ma niezalockowane premium, blokuje
   * save i wymusza unlock (zostawia w preview-mode).
   */
  function handleSave() {
    if (isHeadwearPremium(app.headwear) && !unlockedSet.has(cosmeticSlug('headwear', app.headwear))) {
      setUnlockTarget({
        kind: 'headwear',
        value: app.headwear,
        label: HEADWEAR_LABELS[app.headwear],
      });
      return;
    }
    if (isArmorPremium(app.armor) && !unlockedSet.has(cosmeticSlug('armor', app.armor))) {
      setUnlockTarget({
        kind: 'armor',
        value: app.armor,
        label: ARMOR_LABELS[app.armor],
      });
      return;
    }
    onSave(app);
  }

  function randomize() {
    setApp((prev) => ({
      ...prev,
      skin: pick(Object.keys(SKIN_TONES) as SkinKey[]),
      hairStyle: pick(['bald', 'short', 'messy', 'long', 'mohawk', 'ponytail'] as HairStyle[]),
      hairColor: pick(Object.keys(HAIR_COLORS) as HairColorKey[]),
      beardStyle: pick(['none', 'stubble', 'full', 'goatee'] as BeardStyle[]),
      eyes: pick(['normal', 'angry', 'sleepy', 'glow'] as EyeStyle[]),
      eyeColor: pick(Object.keys(EYE_COLORS) as EyeColorKey[]),
      mouth: pick(['neutral', 'smirk', 'grin', 'grim'] as MouthStyle[]),
      accessory: pick(['none', 'scar', 'eyepatch', 'monocle', 'mask'] as AccessoryStyle[]),
      headwear: pick([
        'none',
        'helmet',
        'wizardHat',
        'hood',
        'crown',
        'bandana',
      ] as Exclude<HeadwearStyle, 'auto'>[]),
      accentColor: pick(ACCENT_CHOICES),
    }));
  }

  return (
    <div className="screen-in" style={{ padding: 12, paddingBottom: 8 }}>
      <div
        className="panel"
        style={{
          padding: 12,
          marginBottom: 12,
          background: 'linear-gradient(180deg, #f3ead9 0%, #e8c870 100%)',
        }}
      >
        <div className="h-display" style={{ fontSize: 20, textAlign: 'center', marginBottom: 8 }}>
          KREATOR POSTACI
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: 16,
              background: '#fff7e0',
              border: '3px solid #2a1810',
              boxShadow: '3px 3px 0 #2a1810',
              overflow: 'hidden',
            }}
          >
            <AvatarPortrait appearance={app} cls={cls} size={160} />
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button
            type="button"
            className="cbtn sm ghost"
            onClick={randomize}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <GameIcon name="dice" size={22} /> LOSUJ WYGLĄD
          </button>
        </div>
      </div>

      <div className="panel" style={{ padding: 12, marginBottom: 10 }}>
        <Row label="SKÓRA">
          {(Object.entries(SKIN_TONES) as [SkinKey, (typeof SKIN_TONES)[SkinKey]][]).map(([k, v]) => (
            <Chip key={k} active={app.skin === k} onClick={() => set('skin', k)} swatch={v.base}>
              {SKIN_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label="FRYZURA">
          {(['bald', 'short', 'messy', 'long', 'mohawk', 'ponytail'] as HairStyle[]).map((k) => (
            <Chip key={k} active={app.hairStyle === k} onClick={() => set('hairStyle', k)}>
              {HAIR_STYLE_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label="KOLOR WŁOSÓW">
          {(Object.entries(HAIR_COLORS) as [HairColorKey, string][]).map(([k, v]) => (
            <Chip
              key={k}
              active={app.hairColor === k}
              onClick={() => set('hairColor', k)}
              swatch={v}
            >
              {HAIR_COLOR_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label="BRODA">
          {(['none', 'stubble', 'goatee', 'full'] as BeardStyle[]).map((k) => (
            <Chip key={k} active={app.beardStyle === k} onClick={() => set('beardStyle', k)}>
              {BEARD_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label="OCZY">
          {(['normal', 'angry', 'sleepy', 'glow'] as EyeStyle[]).map((k) => (
            <Chip key={k} active={app.eyes === k} onClick={() => set('eyes', k)}>
              {EYE_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label="KOLOR OCZU">
          {(Object.entries(EYE_COLORS) as [EyeColorKey, string][]).map(([k, v]) => (
            <Chip
              key={k}
              active={app.eyeColor === k}
              onClick={() => set('eyeColor', k)}
              swatch={v}
            >
              {EYE_COLOR_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label="USTA">
          {(['neutral', 'smirk', 'grin', 'grim'] as MouthStyle[]).map((k) => (
            <Chip key={k} active={app.mouth === k} onClick={() => set('mouth', k)}>
              {MOUTH_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label="DETAL">
          {(['none', 'scar', 'eyepatch', 'monocle', 'mask'] as AccessoryStyle[]).map((k) => (
            <Chip key={k} active={app.accessory === k} onClick={() => set('accessory', k)}>
              {ACCESSORY_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label="NAKRYCIE GŁOWY">
          {HEADWEAR_ORDER_FREE.map((k) => (
            <Chip key={k} active={app.headwear === k} onClick={() => set('headwear', k)}>
              {HEADWEAR_LABELS[k]}
            </Chip>
          ))}
          {mode === 'edit' &&
            HEADWEAR_ORDER_PREMIUM.map((k) => {
              const slug = cosmeticSlug('headwear', k);
              const owned = unlockedSet.has(slug);
              return (
                <PremiumChip
                  key={k}
                  active={app.headwear === k}
                  owned={owned}
                  onClick={() => tryPickPremium('headwear', k, HEADWEAR_LABELS[k])}
                >
                  {HEADWEAR_LABELS[k]}
                </PremiumChip>
              );
            })}
        </Row>
        <Row label="ZBROJA">
          {ARMOR_ORDER_FREE.map((k) => (
            <Chip key={k} active={app.armor === k} onClick={() => set('armor', k)}>
              {ARMOR_LABELS[k]}
            </Chip>
          ))}
          {mode === 'edit' &&
            ARMOR_ORDER_PREMIUM.map((k) => {
              const slug = cosmeticSlug('armor', k);
              const owned = unlockedSet.has(slug);
              return (
                <PremiumChip
                  key={k}
                  active={app.armor === k}
                  owned={owned}
                  onClick={() => tryPickPremium('armor', k, ARMOR_LABELS[k])}
                >
                  {ARMOR_LABELS[k]}
                </PremiumChip>
              );
            })}
        </Row>
        <Row label="KOLOR AKCENTU">
          {ACCENT_CHOICES.map((hex) => (
            <Chip
              key={hex}
              active={app.accentColor === hex}
              onClick={() => set('accentColor', hex)}
              swatch={hex}
            >
              &nbsp;
            </Chip>
          ))}
        </Row>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="cbtn ghost" style={{ flex: 1 }} onClick={onCancel}>
          ANULUJ
        </button>
        <button
          type="button"
          className="cbtn green"
          style={{
            flex: 2,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          onClick={handleSave}
        >
          <GameIcon name="check" size={22} /> ZAPISZ WYGLĄD
        </button>
      </div>

      {unlockTarget && (
        <UnlockModal
          appearance={app}
          cls={cls}
          label={unlockTarget.label}
          gems={gems}
          pending={unlockPending}
          onConfirm={handleUnlock}
          onCancel={cancelUnlock}
        />
      )}
    </div>
  );
}

/**
 * Chip z badge gem-cost dla premium cosmetic'ów. Owned = wygląda jak normalny
 * Chip; not-owned = ma ikonę gemu + cenę.
 */
function PremiumChip({
  active,
  owned,
  onClick,
  children,
}: {
  active: boolean;
  owned: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const bg = active ? '#d4a24c' : owned ? '#e8dcb9' : '#f0e0a0';
  return (
    <div
      className="clickable no-select"
      onClick={onClick}
      style={{
        background: bg,
        border: `2.5px solid ${owned ? '#2a1810' : '#8a5a18'}`,
        borderRadius: 9,
        padding: '5px 9px',
        fontFamily: 'Luckiest Guy, sans-serif',
        fontSize: 13,
        letterSpacing: 0.4,
        boxShadow: active ? '2px 2px 0 #2a1810' : 'none',
        transform: active ? 'translate(-1px,-1px)' : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        position: 'relative',
      }}
    >
      {children}
      {!owned && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            marginLeft: 4,
            padding: '1px 5px',
            background: '#fff',
            border: '1.5px solid #2a1810',
            borderRadius: 999,
            fontSize: 11,
            color: '#2a1810',
          }}
        >
          <IcoGem s={11} />
          {COSMETIC_UNLOCK_COST}
        </span>
      )}
    </div>
  );
}

/**
 * Modal odblokowania premium cosmeticu. Pokazuje preview avatara z aplikowanym
 * cosmeticiem (live update z parent state) + button kupna. Anuluj revertuje
 * pick na ostatni free wariant (parent zarządza state).
 */
function UnlockModal({
  appearance,
  cls,
  label,
  gems,
  pending,
  onConfirm,
  onCancel,
}: {
  appearance: ResolvedAppearance;
  cls: CharacterClass;
  label: string;
  gems: number;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const canAfford = gems >= COSMETIC_UNLOCK_COST;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff7e0',
          border: '4px solid #2a1810',
          borderRadius: 14,
          padding: 16,
          maxWidth: 360,
          width: '100%',
          boxShadow: '4px 4px 0 #2a1810',
          textAlign: 'center',
        }}
      >
        <div className="h-display" style={{ fontSize: 18, marginBottom: 4 }}>
          ODBLOKUJ KOSMETYK
        </div>
        <div className="flavor" style={{ fontSize: 15, color: '#5a3a2a', marginBottom: 12 }}>
          {label}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 14,
              background: '#fff',
              border: '3px solid #2a1810',
              boxShadow: '2px 2px 0 #2a1810',
              overflow: 'hidden',
            }}
          >
            <AvatarPortrait appearance={appearance} cls={cls} size={140} />
          </div>
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#5a3a2a',
            marginBottom: 12,
          }}
        >
          Tak będziesz wyglądać. Odblokowanie jest jednorazowe — później zmieniasz dowolnie.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="cbtn ghost"
            style={{ flex: 1 }}
            onClick={onCancel}
            disabled={pending}
          >
            ANULUJ
          </button>
          <button
            type="button"
            className="cbtn"
            style={{
              flex: 2,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: canAfford ? '#d4a24c' : '#8a8070',
              opacity: canAfford && !pending ? 1 : 0.6,
              cursor: canAfford && !pending ? 'pointer' : 'not-allowed',
            }}
            onClick={canAfford && !pending ? onConfirm : undefined}
            disabled={!canAfford || pending}
            title={canAfford ? 'Odblokuj' : `Brak gemów (${COSMETIC_UNLOCK_COST}).`}
          >
            <IcoGem s={14} />
            {COSMETIC_UNLOCK_COST} ODBLOKUJ
          </button>
        </div>
      </div>
    </div>
  );
}
