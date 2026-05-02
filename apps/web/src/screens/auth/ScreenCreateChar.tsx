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
import { useT } from '@/i18n';
import type { DictKey } from '@/i18n';

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
  nameKey: DictKey;
  descKey: DictKey;
  perkKey: DictKey;
  color: string;
  icon: IconName;
  stats: string;
}

const CLASSES: readonly ClassDef[] = [
  {
    id: 'warrior',
    nameKey: 'cc.class.warrior.name',
    descKey: 'cc.class.warrior.desc',
    perkKey: 'cc.class.warrior.perk',
    color: '#c83232',
    icon: 'sword',
    stats: 'ATK 8 · DEF 7 · MAG 2',
  },
  {
    id: 'mage',
    nameKey: 'cc.class.mage.name',
    descKey: 'cc.class.mage.desc',
    perkKey: 'cc.class.mage.perk',
    color: '#5a3a8a',
    icon: 'orb',
    stats: 'ATK 3 · DEF 4 · MAG 9',
  },
  {
    id: 'rogue',
    nameKey: 'cc.class.rogue.name',
    descKey: 'cc.class.rogue.desc',
    perkKey: 'cc.class.rogue.perk',
    color: '#4a7c3a',
    icon: 'dagger',
    stats: 'ATK 6 · DEF 5 · MAG 4',
  },
];

type BonusIcon = 'coin' | 'gem' | IconName;

interface BonusDef {
  id: StarterBonus;
  nameKey: DictKey;
  descKey: DictKey;
  icon: BonusIcon;
  color: string;
}

const BONUSES: readonly BonusDef[] = [
  { id: 'gold', nameKey: 'cc.bonus.gold.name', descKey: 'cc.bonus.gold.desc', icon: 'coin', color: '#e8c870' },
  { id: 'gems', nameKey: 'cc.bonus.gems.name', descKey: 'cc.bonus.gems.desc', icon: 'gem', color: '#a0d8f0' },
  { id: 'potion', nameKey: 'cc.bonus.potion.name', descKey: 'cc.bonus.potion.desc', icon: 'potion', color: '#c8a0a0' },
  { id: 'scroll', nameKey: 'cc.bonus.scroll.name', descKey: 'cc.bonus.scroll.desc', icon: 'scroll', color: '#d4a24c' },
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
  const t = useT();
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
    pale: t('cc.skin.pale'),
    medium: t('cc.skin.medium'),
    tan: t('cc.skin.tan'),
    dark: t('cc.skin.dark'),
    green: t('cc.skin.green'),
  };
  const HAIR_LABELS: Record<HairStyle, string> = {
    bald: t('cc.hair.bald'),
    short: t('cc.hair.short'),
    messy: t('cc.hair.messy'),
    long: t('cc.hair.long'),
    mohawk: t('cc.hair.mohawk'),
    ponytail: t('cc.hair.ponytail'),
  };
  const HAIR_COLOR_LABELS: Record<HairColorKey, string> = {
    black: t('cc.hairColor.black'),
    brown: t('cc.hairColor.brown'),
    blond: t('cc.hairColor.blond'),
    red: t('cc.hairColor.red'),
    white: t('cc.hairColor.white'),
    purple: t('cc.hairColor.purple'),
  };
  const BEARD_LABELS: Record<BeardStyle, string> = {
    none: t('cc.beard.none'),
    stubble: t('cc.beard.stubble'),
    full: t('cc.beard.full'),
    goatee: t('cc.beard.goatee'),
  };
  const EYE_LABELS: Record<EyeStyle, string> = {
    normal: t('cc.eyes.normal'),
    angry: t('cc.eyes.angry'),
    sleepy: t('cc.eyes.sleepy'),
    glow: t('cc.eyes.glow'),
  };
  const EYE_COLOR_LABELS: Record<EyeColorKey, string> = {
    brown: t('cc.eyeColor.brown'),
    blue: t('cc.eyeColor.blue'),
    green: t('cc.eyeColor.green'),
    yellow: t('cc.eyeColor.yellow'),
    red: t('cc.eyeColor.red'),
  };
  const MOUTH_LABELS: Record<MouthStyle, string> = {
    neutral: t('cc.mouth.neutral'),
    smirk: t('cc.mouth.smirk'),
    grin: t('cc.mouth.grin'),
    grim: t('cc.mouth.grim'),
  };
  const ACCESSORY_LABELS: Record<AccessoryStyle, string> = {
    none: t('cc.acc.none'),
    scar: t('cc.acc.scar'),
    eyepatch: t('cc.acc.eyepatch'),
    monocle: t('cc.acc.monocle'),
    mask: t('cc.acc.mask'),
  };
  const HEADWEAR_LABELS: Record<HeadwearStyle, string> = {
    auto: t('cc.hw.auto'),
    none: t('cc.hw.none'),
    helmet: t('cc.hw.helmet'),
    wizardHat: t('cc.hw.wizardHat'),
    hood: t('cc.hw.hood'),
    crown: t('cc.hw.crown'),
    bandana: t('cc.hw.bandana'),
    dragonHelm: t('cc.hw.dragonHelm'),
    lichCrown: t('cc.hw.lichCrown'),
    valkyrieHelm: t('cc.hw.valkyrieHelm'),
    archmageHat: t('cc.hw.archmageHat'),
    shadowVeil: t('cc.hw.shadowVeil'),
    goldenLaurel: t('cc.hw.goldenLaurel'),
    hornedHelm: t('cc.hw.hornedHelm'),
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
          {t('cc.appearance.randomize')}
        </button>
      </div>

      <div className="panel" style={{ padding: 10, marginBottom: 8 }}>
        <Row label={t('cc.row.skin')}>
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
        <Row label={t('cc.row.hair')}>
          {(['bald', 'short', 'messy', 'long', 'mohawk', 'ponytail'] as HairStyle[]).map((k) => (
            <Chip key={k} active={appearance.hairStyle === k} onClick={() => set('hairStyle', k)}>
              {HAIR_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label={t('cc.row.hairColor')}>
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
        <Row label={t('cc.row.beard')}>
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
        <Row label={t('cc.row.eyes')}>
          {(['normal', 'angry', 'sleepy', 'glow'] as EyeStyle[]).map((k) => (
            <Chip key={k} active={appearance.eyes === k} onClick={() => set('eyes', k)}>
              {EYE_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label={t('cc.row.eyeColor')}>
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
        <Row label={t('cc.row.mouth')}>
          {(['neutral', 'smirk', 'grin', 'grim'] as MouthStyle[]).map((k) => (
            <Chip key={k} active={appearance.mouth === k} onClick={() => set('mouth', k)}>
              {MOUTH_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label={t('cc.row.detail')}>
          {(['none', 'scar', 'eyepatch', 'monocle', 'mask'] as AccessoryStyle[]).map((k) => (
            <Chip key={k} active={appearance.accessory === k} onClick={() => set('accessory', k)}>
              {ACCESSORY_LABELS[k]}
            </Chip>
          ))}
        </Row>
        <Row label={t('cc.row.headwear')}>
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
            {t('cc.row.accent')}
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
  const t = useT();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cls, setCls] = useState<CharacterClass>('warrior');
  const [name, setName] = useState('');
  const [appearance, setAppearance] = useState<Appearance>({ ...APPEARANCE_DEFAULTS });
  const [bonus, setBonus] = useState<StarterBonus | null>(null);

  function finish() {
    if (!bonus) return;
    onDone({ cls, name: name.trim() || t('cc.unnamed'), appearance, bonus });
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
            {t('cc.backLogin')}
          </button>
        )}
        <div
          className="h-display clean"
          style={{ fontSize: 20, color: '#ffc830', textAlign: 'center', lineHeight: 1 }}
        >
          {t('cc.heading')}
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, opacity: 0.85, marginTop: 3 }}>
          {t('cc.step').replace('{n}', String(step))}
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
              {t('cc.s1.heading')}
            </div>
            <div style={{ fontSize: 14, color: '#5a3a2a', marginBottom: 14 }}>
              {t('cc.s1.flavor')}
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
                        {t(c.nameKey)}
                      </div>
                      <div style={{ fontSize: 14, marginTop: 4, lineHeight: 1.25 }}>{t(c.descKey)}</div>
                      <div
                        style={{
                          fontSize: 14,
                          marginTop: 5,
                          lineHeight: 1.3,
                          color: sel ? '#ffc830' : '#5a3a2a',
                          fontStyle: 'italic',
                        }}
                      >
                        {t(c.perkKey)}
                      </div>
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
              {t('cc.s2.heading')}
            </div>
            <div style={{ fontSize: 14, color: '#5a3a2a', marginBottom: 12 }}>
              {t('cc.s2.flavor')}
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
                {t('cc.s2.nameLabel')}
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 20))}
                placeholder={t('cc.s2.namePlaceholder')}
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
              {t('cc.s3.heading')}
            </div>
            <div style={{ fontSize: 14, color: '#5a3a2a', marginBottom: 14 }}>
              {t('cc.s3.flavor')}
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
                      {t(b.nameKey)}
                    </div>
                    <div style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.2 }}>
                      {t(b.descKey)}
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
            {t('cc.back')}
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
            {t('cc.next')}
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
            {t('cc.finish')}
          </button>
        )}
      </div>
    </div>
  );
}
