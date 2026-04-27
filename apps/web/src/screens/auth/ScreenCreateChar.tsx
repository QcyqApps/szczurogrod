import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  APPEARANCE_DEFAULTS,
  AvatarPortrait,
  EYE_COLORS,
  HAIR_COLORS,
  SKIN_TONES,
} from '@/components/avatar';
import type {
  Appearance,
  BeardStyle,
  CharacterClass,
  EyeColorKey,
  EyeStyle,
  HairColorKey,
  HairStyle,
  HeadwearStyle,
  MouthStyle,
  AccessoryStyle,
  SkinKey,
} from '@/components/avatar';
import { GameIcon } from '@/components/game-icons';
import type { IconName } from '@/components/game-icons';
import { IcoCoin, IcoGem } from '@/components/icons';

export type StarterBonus = 'gold' | 'gems' | 'potion' | 'scroll';

export interface CreateCharPayload {
  cls: CharacterClass;
  name: string;
  appearance: Appearance;
  bonus: StarterBonus;
}

export interface ScreenCreateCharProps {
  onDone: (payload: CreateCharPayload) => Promise<void> | void;
  onBackToLogin?: () => void;
}

interface ClassDef {
  id: CharacterClass;
  name: string;
  desc: string;
  color: string;
  icon: IconName;
  stats: string;
}

const CLASSES: readonly ClassDef[] = [
  {
    id: 'warrior',
    name: 'WOJOWNIK',
    desc: 'Tank z toporem. Rozwiązuje problemy siłą.',
    color: '#c83232',
    icon: 'sword',
    stats: 'ATK 8 · DEF 7 · MAG 2',
  },
  {
    id: 'mage',
    name: 'MAG',
    desc: 'Rzuca ogniem, czyta księgi, robi herbatę.',
    color: '#5a3a8a',
    icon: 'orb',
    stats: 'ATK 3 · DEF 4 · MAG 9',
  },
  {
    id: 'rogue',
    name: 'ŁOTRZYK',
    desc: 'Szybki, sprytny. Kieszonkowiec z klasą.',
    color: '#4a7c3a',
    icon: 'dagger',
    stats: 'ATK 6 · DEF 5 · MAG 4',
  },
];

type BonusIcon = 'coin' | 'gem' | IconName;

interface BonusDef {
  id: StarterBonus;
  name: string;
  desc: string;
  icon: BonusIcon;
  color: string;
}

const BONUSES: readonly BonusDef[] = [
  { id: 'gold', name: 'Sakwa Kupca', desc: '+500 złota na start', icon: 'coin', color: '#e8c870' },
  { id: 'gems', name: 'Garść Szafirów', desc: '+100 gemów na start', icon: 'gem', color: '#a0d8f0' },
  { id: 'potion', name: 'Zestaw Alchemika', desc: '5× mikstura HP', icon: 'potion', color: '#c8a0a0' },
  { id: 'scroll', name: 'Pergamin Questu', desc: 'Natychmiastowy quest', icon: 'scroll', color: '#d4a24c' },
];

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

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function InlineCreator({
  cls,
  appearance,
  onChange,
}: {
  cls: CharacterClass;
  appearance: Appearance;
  onChange: (next: Appearance) => void;
}) {
  function set<K extends keyof Appearance>(key: K, value: Appearance[K]) {
    onChange({ ...appearance, [key]: value });
  }

  function randomize() {
    onChange({
      ...appearance,
      skin: pick(Object.keys(SKIN_TONES) as SkinKey[]),
      hairStyle: pick(['bald', 'short', 'messy', 'long', 'mohawk', 'ponytail'] as HairStyle[]),
      hairColor: pick(Object.keys(HAIR_COLORS) as HairColorKey[]),
      beardStyle: pick(['none', 'stubble', 'full', 'goatee'] as BeardStyle[]),
      eyes: pick(['normal', 'angry', 'sleepy', 'glow'] as EyeStyle[]),
      eyeColor: pick(Object.keys(EYE_COLORS) as EyeColorKey[]),
      mouth: pick(['neutral', 'smirk', 'grin', 'grim'] as MouthStyle[]),
      accessory: pick(['none', 'scar', 'eyepatch', 'monocle', 'mask'] as AccessoryStyle[]),
      headwear: pick([
        'auto',
        'none',
        'helmet',
        'wizardHat',
        'hood',
        'crown',
        'bandana',
      ] as HeadwearStyle[]),
      accentColor: pick(ACCENT_CHOICES),
    });
  }

  const Chip = ({
    active,
    onClick,
    children,
    swatch,
  }: {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
    swatch?: string;
  }) => (
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
        cursor: 'pointer',
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
  const Row = ({ label, children }: { label: string; children: ReactNode }) => (
    <div style={{ marginBottom: 8 }}>
      <div className="h-title" style={{ fontSize: 13, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );

  const SKIN_LABELS: Record<SkinKey, string> = {
    pale: 'Jasna',
    medium: 'Śr.',
    tan: 'Opal.',
    dark: 'Ciemna',
    green: 'Ork!',
  };
  const HAIR_LABELS: Record<HairStyle, string> = {
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
    full: 'Pełna',
    goatee: 'Bródka',
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
    neutral: 'Norm.',
    smirk: 'Uśm.',
    grin: 'Szczer.',
    grim: 'Gniew.',
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
    bandana: 'Banda.',
    dragonHelm: 'Smok',
    lichCrown: 'Lich',
    valkyrieHelm: 'Walkiria',
    archmageHat: 'Arcymag',
    shadowVeil: 'Welon',
    goldenLaurel: 'Laur',
    hornedHelm: 'Rogi',
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 10,
          padding: 14,
          background: 'linear-gradient(135deg, #d4a24c 0%, #e8c870 100%)',
          border: '3px solid #2a1810',
          borderRadius: 14,
          boxShadow: '3px 3px 0 #2a1810',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 999,
            overflow: 'hidden',
            border: '4px solid #2a1810',
            background: '#fff3e0',
            boxShadow: '3px 3px 0 #2a1810',
          }}
        >
          <AvatarPortrait appearance={appearance} cls={cls} size={140} />
        </div>
        <button
          type="button"
          className="cbtn sm"
          onClick={randomize}
          style={{ background: '#a0d8f0' }}
        >
          LOSUJ!
        </button>
      </div>

      <div className="panel" style={{ padding: 10, marginBottom: 8 }}>
        <Row label="SKÓRA">
          {(Object.entries(SKIN_TONES) as [SkinKey, (typeof SKIN_TONES)[SkinKey]][]).map(([k, v]) => (
            <Chip
              key={k}
              active={appearance.skin === k}
              onClick={() => set('skin', k)}
              swatch={v.base}
            >
              {SKIN_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label="FRYZURA">
          {(['bald', 'short', 'messy', 'long', 'mohawk', 'ponytail'] as HairStyle[]).map((k) => (
            <Chip key={k} active={appearance.hairStyle === k} onClick={() => set('hairStyle', k)}>
              {HAIR_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label="KOLOR WŁOSÓW">
          {(Object.entries(HAIR_COLORS) as [HairColorKey, string][]).map(([k, v]) => (
            <Chip
              key={k}
              active={appearance.hairColor === k}
              onClick={() => set('hairColor', k)}
              swatch={v}
            >
              {HAIR_COLOR_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label="ZAROST">
          {(['none', 'stubble', 'full', 'goatee'] as BeardStyle[]).map((k) => (
            <Chip
              key={k}
              active={appearance.beardStyle === k}
              onClick={() => set('beardStyle', k)}
            >
              {BEARD_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label="OCZY">
          {(['normal', 'angry', 'sleepy', 'glow'] as EyeStyle[]).map((k) => (
            <Chip key={k} active={appearance.eyes === k} onClick={() => set('eyes', k)}>
              {EYE_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label="KOLOR OCZU">
          {(Object.entries(EYE_COLORS) as [EyeColorKey, string][]).map(([k, v]) => (
            <Chip
              key={k}
              active={appearance.eyeColor === k}
              onClick={() => set('eyeColor', k)}
              swatch={v}
            >
              {EYE_COLOR_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label="USTA">
          {(['neutral', 'smirk', 'grin', 'grim'] as MouthStyle[]).map((k) => (
            <Chip key={k} active={appearance.mouth === k} onClick={() => set('mouth', k)}>
              {MOUTH_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label="DETAL">
          {(['none', 'scar', 'eyepatch', 'monocle', 'mask'] as AccessoryStyle[]).map((k) => (
            <Chip key={k} active={appearance.accessory === k} onClick={() => set('accessory', k)}>
              {ACCESSORY_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label="NAKRYCIE GŁOWY">
          {(['auto', 'none', 'helmet', 'wizardHat', 'hood', 'crown', 'bandana'] as HeadwearStyle[]).map(
            (k) => (
              <Chip key={k} active={appearance.headwear === k} onClick={() => set('headwear', k)}>
                {HEADWEAR_LABELS[k]}
              </Chip>
            ),
          )}
        </Row>
        <div style={{ marginBottom: 4 }}>
          <div className="h-title" style={{ fontSize: 13, marginBottom: 4 }}>
            AKCENT
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ACCENT_CHOICES.map((c) => (
              <div
                key={c}
                onClick={() => set('accentColor', c)}
                style={{
                  width: 26,
                  height: 26,
                  background: c,
                  border: `3px solid ${appearance.accentColor === c ? '#ffc830' : '#2a1810'}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  boxShadow: appearance.accentColor === c ? '2px 2px 0 #2a1810' : 'none',
                  transform: appearance.accentColor === c ? 'translate(-1px,-1px)' : 'none',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScreenCreateChar({ onDone, onBackToLogin }: ScreenCreateCharProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cls, setCls] = useState<CharacterClass>('warrior');
  const [name, setName] = useState('');
  const [appearance, setAppearance] = useState<Appearance>({ ...APPEARANCE_DEFAULTS });
  const [bonus, setBonus] = useState<StarterBonus | null>(null);

  function finish() {
    if (!bonus) return;
    onDone({ cls, name: name.trim() || 'Bezimienny', appearance, bonus });
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, #f3ead9 0%, #e8dcb9 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '48px 16px 12px',
          background: 'linear-gradient(180deg, #2a1a4a 0%, #3a2a6a 100%)',
          color: '#fff3e0',
          borderBottom: '3px solid #2a1810',
          position: 'relative',
        }}
      >
        {step === 1 && onBackToLogin && (
          <button
            type="button"
            onClick={onBackToLogin}
            style={{
              position: 'absolute',
              left: 12,
              top: 48,
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              color: '#ffc830',
              fontFamily: 'Luckiest Guy, sans-serif',
              fontSize: 14,
              letterSpacing: 0.6,
              padding: '2px 6px',
              opacity: 0.9,
            }}
          >
            ← LOGOWANIE
          </button>
        )}
        <div
          className="h-display clean"
          style={{ fontSize: 20, color: '#ffc830', textAlign: 'center', lineHeight: 1 }}
        >
          TWÓJ BOHATER
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, opacity: 0.85, marginTop: 3 }}>
          Krok {step} z 3
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 5 }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                flex: 1,
                height: 8,
                background: n <= step ? '#ffc830' : 'rgba(255,243,224,0.2)',
                border: '2px solid #2a1810',
                borderRadius: 4,
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {step === 1 && (
          <div>
            <div className="h-title" style={{ fontSize: 18, marginBottom: 4 }}>
              WYBIERZ KLASĘ
            </div>
            <div style={{ fontSize: 14, color: '#5a3a2a', marginBottom: 14 }}>
              Klasa zostaje na zawsze. Jak tatuaż po piwie.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CLASSES.map((c) => {
                const sel = cls === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setCls(c.id)}
                    style={{
                      cursor: 'pointer',
                      background: sel ? c.color : '#fff3e0',
                      color: sel ? '#fff3e0' : '#2a1810',
                      border: `3px solid #2a1810`,
                      borderRadius: 12,
                      padding: 12,
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      boxShadow: sel ? '4px 4px 0 #2a1810, 0 0 0 3px #ffc830' : '3px 3px 0 #2a1810',
                      transform: sel ? 'translateY(-2px)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 10,
                        background: sel ? 'rgba(255,243,224,0.25)' : '#e8dcb9',
                        border: '2.5px solid #2a1810',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <GameIcon name={c.icon} size={44} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="h-title"
                        style={{
                          fontSize: 17,
                          lineHeight: 1,
                          color: sel ? '#ffc830' : '#2a1810',
                        }}
                      >
                        {c.name}
                      </div>
                      <div style={{ fontSize: 14, marginTop: 4, lineHeight: 1.25 }}>{c.desc}</div>
                      <div className="mono" style={{ fontSize: 13, marginTop: 5, opacity: 0.85 }}>
                        {c.stats}
                      </div>
                    </div>
                    {sel && (
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 999,
                          background: '#ffc830',
                          border: '2.5px solid #2a1810',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '1px 1px 0 #2a1810',
                          flexShrink: 0,
                        }}
                      >
                        <GameIcon name="check" size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="h-title" style={{ fontSize: 18, marginBottom: 4 }}>
              TWARZ I IMIĘ
            </div>
            <div style={{ fontSize: 14, color: '#5a3a2a', marginBottom: 12 }}>
              Tak wyglądasz na plakatach „Poszukiwany".
            </div>

            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontFamily: 'Luckiest Guy, sans-serif',
                  fontSize: 13,
                  letterSpacing: 0.6,
                  color: '#5a3a2a',
                  marginBottom: 4,
                }}
              >
                IMIĘ BOHATERA
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 20))}
                placeholder="np. Gretka z Rzepnicy"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#fff3e0',
                  border: '2.5px solid #2a1810',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontFamily: "'Patrick Hand', 'Comic Sans MS', sans-serif",
                  fontSize: 16,
                  color: '#2a1810',
                  outline: 'none',
                  boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.06)',
                }}
              />
            </div>

            <InlineCreator cls={cls} appearance={appearance} onChange={setAppearance} />
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="h-title" style={{ fontSize: 18, marginBottom: 4 }}>
              BONUS STARTOWY
            </div>
            <div style={{ fontSize: 14, color: '#5a3a2a', marginBottom: 14 }}>
              Wybierz jeden. Tak. Tylko jeden. Nie pytaj.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {BONUSES.map((b) => {
                const sel = bonus === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => setBonus(b.id)}
                    style={{
                      cursor: 'pointer',
                      background: sel ? b.color : '#fff3e0',
                      border: '3px solid #2a1810',
                      borderRadius: 12,
                      padding: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: sel ? '3px 3px 0 #2a1810, 0 0 0 3px #ffc830' : '2px 2px 0 #2a1810',
                      transform: sel ? 'translateY(-2px)' : 'none',
                      transition: 'all 0.15s',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 10,
                        background: '#e8dcb9',
                        border: '2.5px solid #2a1810',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {b.icon === 'coin' ? (
                        <IcoCoin s={36} />
                      ) : b.icon === 'gem' ? (
                        <IcoGem s={36} />
                      ) : (
                        <GameIcon name={b.icon} size={36} />
                      )}
                    </div>
                    <div
                      className="h-title"
                      style={{ fontSize: 14, textAlign: 'center', lineHeight: 1 }}
                    >
                      {b.name}
                    </div>
                    <div style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.2 }}>
                      {b.desc}
                    </div>
                    {sel && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          background: '#ffc830',
                          border: '2px solid #2a1810',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <GameIcon name="check" size={12} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          padding: 12,
          background: '#e8dcb9',
          borderTop: '3px solid #2a1810',
          display: 'flex',
          gap: 8,
        }}
      >
        {step > 1 && (
          <button
            type="button"
            className="cbtn ghost"
            style={{ flex: 1 }}
            onClick={() => setStep((step - 1) as 1 | 2 | 3)}
          >
            ← WSTECZ
          </button>
        )}
        {step < 3 && (
          <button
            type="button"
            className="cbtn green"
            style={{ flex: 2 }}
            onClick={() => setStep((step + 1) as 1 | 2 | 3)}
            disabled={step === 2 && !name.trim()}
          >
            DALEJ →
          </button>
        )}
        {step === 3 && (
          <button
            type="button"
            className="cbtn green lg"
            style={{ flex: 2, opacity: bonus ? 1 : 0.5 }}
            disabled={!bonus}
            onClick={finish}
          >
            ZACZNIJ PRZYGODĘ!
          </button>
        )}
      </div>
    </div>
  );
}
