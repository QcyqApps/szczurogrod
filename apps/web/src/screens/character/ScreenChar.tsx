import { useState } from 'react';
import { AvatarPortrait } from '@/components/avatar';
import { GameIcon } from '@/components/game-icons';
import type { IconName } from '@/components/game-icons';
import { HelpIcon, StatBar } from '@/components/ui-common';
import { useT, useContentT } from '@/i18n';
import type { DictKey } from '@/i18n';
import type { SubScreen, Tab } from '@/types/nav';
import {
  applyEnhancementToStats,
  isDaggerWeapon,
  type Character,
  type CharacterClass,
  type EquippedSlot,
  type InventoryItem,
  type Rarity,
} from '@grodno/shared';

/**
 * Client mirror of DODGE_CAP_BY_CLASS w `apps/server/src/game/combat.ts`.
 * Ujawnia ile realnie wynosi unik ze SPD — formuła `min(cap, spd × 0.01)`.
 * Trzymaj w synchronizacji z serwerem przy zmianach balansu.
 */
const DODGE_CAP_BY_CLASS: Record<CharacterClass, number> = {
  warrior: 0.25,
  mage: 0.4,
  rogue: 0.4,
};

function computeDodgePct(spd: number, cls: CharacterClass): {
  pct: number;
  capped: boolean;
  capPct: number;
} {
  const cap = DODGE_CAP_BY_CLASS[cls];
  const raw = Math.max(0, spd) * 0.01;
  const actual = Math.min(cap, raw);
  return {
    pct: Math.round(actual * 100),
    capped: raw >= cap,
    capPct: Math.round(cap * 100),
  };
}

interface SlotDef {
  key: EquippedSlot;
  labelKey: DictKey;
  icon: IconName;
}

const SLOT_DEFS: readonly SlotDef[] = [
  { key: 'head', labelKey: 'char.slot.head', icon: 'helm-hunter' },
  { key: 'neck', labelKey: 'char.slot.neck', icon: 'necklace' },
  { key: 'chest', labelKey: 'char.slot.chest', icon: 'chestplate' },
  { key: 'weapon', labelKey: 'char.slot.weapon', icon: 'sword-dawn' },
  { key: 'off', labelKey: 'char.slot.off', icon: 'shield-item' },
  { key: 'hands', labelKey: 'char.slot.hands', icon: 'gloves' },
  { key: 'ring', labelKey: 'char.slot.ring', icon: 'ring' },
  { key: 'feet', labelKey: 'char.slot.feet', icon: 'boots' },
];

const CLASS_COLOR: Record<string, string> = {
  warrior: '#c83232',
  mage: '#6a3a8a',
  rogue: '#2a4a3a',
};

const CLASS_TITLE_KEY: Record<string, DictKey> = {
  warrior: 'char.class.title.warrior',
  mage: 'char.class.title.mage',
  rogue: 'char.class.title.rogue',
};

const RARITY_LABEL_KEY: Record<Rarity, DictKey> = {
  common: 'rarity.common',
  rare: 'rarity.rare',
  epic: 'rarity.epic',
  legendary: 'rarity.legendary',
};

const rarityClass = (r: Rarity) =>
  r === 'epic' ? 'epic' : r === 'legendary' ? 'legendary' : r === 'rare' ? 'rare' : '';
const rarityColor = (r: Rarity) =>
  r === 'epic' ? '#a04ef0' : r === 'legendary' ? '#ffc830' : r === 'rare' ? '#3a8ac8' : '#8a8a8a';

interface Modal {
  item: InventoryItem;
  source: 'bag' | EquippedSlot;
}

export interface ScreenCharProps {
  char: Character;
  items: readonly InventoryItem[];
  onEditAppearance: () => void;
  onEquip: (item: InventoryItem, targetSlot?: 'off') => void | Promise<void>;
  onUnequip: (item: InventoryItem) => void | Promise<void>;
  onDrop: (item: InventoryItem) => void | Promise<void>;
  onSell: (item: InventoryItem) => void | Promise<void>;
  onUsePotion: (item: InventoryItem) => void | Promise<void>;
  /**
   * Nawigacja do sub-ekranów powiązanych z postacią: osiągnięcia, kolekcja,
   * trener (gold → staty), nagroda dzienna. Te rzeczy zostały zdjęte z grid'a
   * miasta (klikane rzadko i marnowały prime real estate); logicznie pasują
   * do karty postaci bo to metadane gracza, nie lokacje.
   */
  onNavigate: (target: Tab | SubScreen) => void;
  /** True = nagroda dzienna jeszcze nie odebrana, pokazuje badge na przycisku. */
  dailyAvailable: boolean;
  /** Liczba tierów Season Pass gotowych do odebrania — badge na SEZON. */
  seasonPassClaimableCount: number;
}

export function ScreenChar({
  char,
  items,
  onEditAppearance,
  onEquip,
  onUnequip,
  onDrop,
  onSell,
  onUsePotion,
  onNavigate,
  dailyAvailable,
  seasonPassClaimableCount,
}: ScreenCharProps) {
  const t = useT();
  const tc = useContentT();
  const [modal, setModal] = useState<Modal | null>(null);
  const rarityLabel = (r: Rarity) => t(RARITY_LABEL_KEY[r]);

  const equippedMap: Record<EquippedSlot, InventoryItem | null> = {
    head: null,
    neck: null,
    chest: null,
    weapon: null,
    off: null,
    hands: null,
    ring: null,
    feet: null,
  };
  const bag: InventoryItem[] = [];
  for (const it of items) {
    if (it.equippedSlot) {
      equippedMap[it.equippedSlot] = it;
    } else {
      bag.push(it);
    }
  }

  const classColor = CLASS_COLOR[char.cls] ?? '#2a1810';
  const base = char.stats;
  // Mirror serwerowego `loadEquipBonuses` (apps/server/src/game/arena.ts):
  // off-hand sztylet (rogue dual-wield) kontrybuuje 50% atk. Bez tego preview
  // statów kłamałby vs faktyczne wartości w walce.
  const OFF_HAND_DAGGER_ATK_MULT = 0.5;
  const bonus = (Object.values(equippedMap) as (InventoryItem | null)[]).reduce(
    (acc, it) => {
      if (!it) return acc;
      const atk = it.atk ?? 0;
      const isOffHandDagger = it.equippedSlot === 'off' && isDaggerWeapon(it);
      acc.atk += isOffHandDagger ? Math.floor(atk * OFF_HAND_DAGGER_ATK_MULT) : atk;
      acc.def += it.def ?? 0;
      acc.mag += it.mag ?? 0;
      return acc;
    },
    { atk: 0, def: 0, mag: 0 },
  );

  const statRows = [
    { k: 'atk', lbl: 'ATK', v: base.atk + bonus.atk, bonus: bonus.atk, c: '#c83232' },
    { k: 'def', lbl: 'DEF', v: base.def + bonus.def, bonus: bonus.def, c: '#3a5a8a' },
    { k: 'mag', lbl: 'MAG', v: base.mag + bonus.mag, bonus: bonus.mag, c: '#6a3a8a' },
    { k: 'spd', lbl: 'SPD', v: base.spd, bonus: 0, c: '#4a7c3a' },
  ];

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div
        className="panel"
        style={{
          padding: 12,
          marginBottom: 12,
          background: `linear-gradient(180deg, ${classColor}22 0%, #f3ead9 60%)`,
        }}
      >
        <div style={{ display: 'flex', gap: 12 }}>
          <div>
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: 14,
                background: '#fff7e0',
                border: '3px solid #2a1810',
                boxShadow: '3px 3px 0 #2a1810',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'radial-gradient(#2a1810 1px, transparent 1.5px)',
                  backgroundSize: '6px 6px',
                  opacity: 0.1,
                }}
              />
              <AvatarPortrait appearance={char.appearance} cls={char.cls} size={110} />
            </div>
            <div style={{ textAlign: 'center', marginTop: 6 }}>
              <span className="pip gold">LVL {char.lvl}</span>
            </div>
            <button
              type="button"
              className="cbtn sm"
              style={{
                marginTop: 6,
                width: 110,
                fontSize: 10,
                padding: '5px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
              onClick={onEditAppearance}
            >
              <GameIcon name="spark" size={12} /> {t('char.editAppearance')}
            </button>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="h-title" style={{ fontSize: 20, lineHeight: 1, marginBottom: 2 }}>
              {char.name}
            </div>
            <div style={{ fontSize: 14, color: '#5a3a2a', marginBottom: 8 }}>
              {t(CLASS_TITLE_KEY[char.cls] ?? 'char.class.title.warrior')}
            </div>
            {(() => {
              // Per-tick cadence — mirror of apps/server/src/game/regen.ts.
              // HP_FULL_REGEN_MS = 60 min, MP_FULL_REGEN_MS = 45 min. Tick per
              // stat point = full_s / max. Skaluje się sam z poziomem.
              const hpTickS = Math.max(1, Math.floor((60 * 60) / char.hpMax));
              const mpTickS = Math.max(1, Math.floor((45 * 60) / char.mpMax));
              const fmt = (s: number) =>
                s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
              const regenPip = {
                fontSize: 10,
                color: '#5a3a2a',
                whiteSpace: 'nowrap' as const,
                fontFamily: 'JetBrains Mono, monospace',
                marginLeft: 6,
                flexShrink: 0,
              };
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <StatBar cur={char.hp} max={char.hpMax} kind="hp" label="HP" />
                    </div>
                    <span
                      style={regenPip}
                      title={t('char.regen.hp.title')}
                    >
                      {t('char.regen.tick').replace('{time}', fmt(hpTickS))}
                    </span>
                  </div>
                  <div style={{ height: 4 }} />
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <StatBar cur={char.mp} max={char.mpMax} kind="mp" label="MP" />
                    </div>
                    <span
                      style={regenPip}
                      title={t('char.regen.mp.title')}
                    >
                      {t('char.regen.tick').replace('{time}', fmt(mpTickS))}
                    </span>
                  </div>
                </>
              );
            })()}
            <div style={{ height: 4 }} />
            <StatBar cur={char.xp} max={char.xpMax} kind="xp" label="XP" />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 12,
            marginBottom: 6,
          }}
        >
          <div className="h-title" style={{ fontSize: 12, color: '#5a3a2a' }}>
            {t('char.stats.heading')}
          </div>
          <HelpIcon title={t('char.stats.help.title')} label={t('char.stats.help.label')} size={18}>
            <p style={{ margin: '0 0 6px' }}>
              <b>{t('char.stats.help.atk.l')}</b>{t('char.stats.help.atk.body')}
            </p>
            <p style={{ margin: '0 0 6px' }}>
              <b>{t('char.stats.help.def.l')}</b>{t('char.stats.help.def.body')}
            </p>
            <p style={{ margin: '0 0 6px' }}>
              <b>{t('char.stats.help.mag.l')}</b>{t('char.stats.help.mag.body')}
            </p>
            <p style={{ margin: 0 }}>
              <b>{t('char.stats.help.spd.l')}</b>{t('char.stats.help.spd.body')}
              <b>{t('char.stats.help.spd.warrior')}</b>, <b>{t('char.stats.help.spd.mage')}</b>, <b>{t('char.stats.help.spd.rogue')}</b>
              {t('char.stats.help.spd.tail')}
            </p>
          </HelpIcon>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
          }}
        >
          {statRows.map((s) => {
            const dodge = s.k === 'spd' ? computeDodgePct(s.v, char.cls) : null;
            return (
              <div
                key={s.k}
                style={{
                  background: '#fff7e0',
                  border: '2.5px solid #2a1810',
                  borderRadius: 10,
                  padding: '6px 4px',
                  textAlign: 'center',
                  boxShadow: '2px 2px 0 #2a1810',
                }}
              >
                <div className="h-title" style={{ fontSize: 13, color: s.c }}>
                  {s.lbl}
                </div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700 }}>
                  {s.v}
                  {s.bonus > 0 && (
                    <span style={{ fontSize: 10, color: '#4a7c3a' }}> +{s.bonus}</span>
                  )}
                </div>
                {dodge && (
                  <div
                    style={{
                      fontSize: 13,
                      color: dodge.capped ? '#8a3030' : '#4a7c3a',
                      fontWeight: 700,
                      lineHeight: 1.1,
                    }}
                    title={
                      dodge.capped
                        ? t('char.stats.dodge.title.capped').replace('{pct}', String(dodge.capPct))
                        : t('char.stats.dodge.title.normal').replace('{pct}', String(dodge.capPct))
                    }
                  >
                    {dodge.pct}% {t('char.stats.dodge.label')}{dodge.capped ? t('char.stats.dodge.max') : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Szybki dostęp do „meta" ekranów postaci — rzeczy klikane rzadko,
          zdjęte z grid'a miasta (daily, osiągnięcia, kolekcja, trener).
          Trener jest metadaną stat'ów postaci, achievementy i kolekcja to
          osobisty postęp — logicznie pasują do karty postaci. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 6,
          marginBottom: 12,
        }}
      >
        <CharNavButton
          label={t('char.nav.trainer')}
          icon="bolt"
          bg="#c0a0a0"
          onClick={() => onNavigate('trainer')}
        />
        <CharNavButton
          label={t('char.nav.achievements')}
          icon="crown"
          bg="#c8b880"
          onClick={() => onNavigate('achievements')}
        />
        <CharNavButton
          label={t('char.nav.scrapbook')}
          icon="scroll"
          bg="#b8a4e0"
          onClick={() => onNavigate('scrapbook')}
        />
        <CharNavButton
          label={t('char.nav.daily')}
          icon="gift"
          bg={dailyAvailable ? '#f0d080' : '#d4c491'}
          onClick={() => onNavigate('daily')}
          badge={dailyAvailable ? '!' : undefined}
        />
        <CharNavButton
          label={t('char.nav.season')}
          icon="crown"
          bg="#ffc830"
          onClick={() => onNavigate('seasonPass')}
          badge={
            seasonPassClaimableCount > 0 ? String(seasonPassClaimableCount) : undefined
          }
        />
      </div>

      <div className="panel" style={{ padding: 10, marginBottom: 12 }}>
        <div
          className="h-title"
          style={{
            fontSize: 14,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <GameIcon name="helmet" size={16} /> {t('char.equipped.heading')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4 }}>
          {SLOT_DEFS.map((def) => {
            const item = equippedMap[def.key];
            return (
              <div
                key={def.key}
                className={`slot eq ${item ? rarityClass(item.rarity) : ''}`}
                onClick={() => item && setModal({ item, source: def.key })}
                style={{
                  cursor: item ? 'pointer' : 'default',
                  width: '100%',
                  height: 42,
                  padding: 2,
                  position: 'relative',
                }}
              >
                {item ? (
                  <GameIcon name={item.icon as IconName} size={30} />
                ) : (
                  <div style={{ opacity: 0.22, lineHeight: 0 }}>
                    <GameIcon name={def.icon} size={24} />
                  </div>
                )}
                {item && item.enhancementLevel > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      fontSize: 9,
                      fontFamily: 'Luckiest Guy, sans-serif',
                      color: '#2a1810',
                      background: '#ffc830',
                      border: '1.5px solid #2a1810',
                      borderRadius: 5,
                      padding: '0 3px',
                      lineHeight: '12px',
                    }}
                  >
                    +{item.enhancementLevel}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: 4,
            marginTop: 8,
          }}
        >
          {SLOT_DEFS.map((def) => (
            <div
              key={def.key}
              className="h-title"
              style={{
                fontSize: 9,
                textAlign: 'center',
                color: '#5a3a2a',
                letterSpacing: 0.3,
                opacity: 0.8,
              }}
            >
              {t(def.labelKey)}
            </div>
          ))}
        </div>
      </div>

      <div className="panel" style={{ padding: 12 }}>
        <div
          className="h-title"
          style={{
            fontSize: 14,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <GameIcon name="gift" size={16} /> {t('char.bag.heading').replace('{n}', String(bag.length))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
          {bag.map((it) => (
            <div
              key={it.id}
              onClick={() => setModal({ item: it, source: 'bag' })}
              className={`slot ${rarityClass(it.rarity)}`}
              title={tc.itemName(it.name, it.name)}
              style={{
                width: '100%',
                height: 44,
                cursor: 'pointer',
                padding: 4,
                position: 'relative',
              }}
            >
              <GameIcon name={it.icon as IconName} size={32} />
              {it.qty > 1 && (
                <span
                  className="mono"
                  style={{
                    position: 'absolute',
                    right: 2,
                    bottom: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#fff3e0',
                    background: '#2a1810',
                    border: '1.5px solid #f3ead9',
                    borderRadius: 6,
                    padding: '0 4px',
                    lineHeight: '14px',
                  }}
                >
                  ×{it.qty}
                </span>
              )}
              {it.enhancementLevel > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    fontSize: 10,
                    fontFamily: 'Luckiest Guy, sans-serif',
                    color: '#2a1810',
                    background: '#ffc830',
                    border: '1.5px solid #2a1810',
                    borderRadius: 5,
                    padding: '0 3px',
                    lineHeight: '13px',
                  }}
                >
                  +{it.enhancementLevel}
                </span>
              )}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 12 - bag.length) }).map((_, i) => (
            <div
              key={`e${i}`}
              className="slot"
              style={{ width: '100%', height: 44, opacity: 0.5 }}
            />
          ))}
        </div>
      </div>

      {modal &&
        (() => {
          const it = modal.item;
          const inBag = modal.source === 'bag';
          const canEquip = inBag && it.slot !== 'potion' && it.slot !== 'any';
          const isPotion = it.slot === 'potion';
          const compareSlot =
            canEquip && it.slot !== 'potion' && it.slot !== 'any' ? it.slot : null;
          const currentEquipped = compareSlot ? equippedMap[compareSlot] : null;
          // Używamy enhanced statów (base × multiplier z level'a Kowala) żeby
          // gracz zobaczył faktyczne cyfry bonusu po ulepszeniu — bez tego
          // modal pokazywał tylko bazę, co mylnie sugerowało „upgrade nic nie dał".
          const itEnhanced = applyEnhancementToStats(it, it.enhancementLevel);
          const currentEnhanced = currentEquipped
            ? applyEnhancementToStats(currentEquipped, currentEquipped.enhancementLevel)
            : null;
          const statDiff = compareSlot
            ? {
                atk: itEnhanced.atk - (currentEnhanced?.atk ?? 0),
                def: itEnhanced.def - (currentEnhanced?.def ?? 0),
                mag: itEnhanced.mag - (currentEnhanced?.mag ?? 0),
              }
            : null;
          return (
            <div
              onClick={() => setModal(null)}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 100,
                background: 'rgba(42,24,16,0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className={`panel ${rarityClass(it.rarity)}`}
                style={{
                  width: '100%',
                  maxWidth: 320,
                  background: '#f3ead9',
                  padding: 16,
                  position: 'relative',
                }}
              >
                <div
                  style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}
                >
                  <div
                    className={`slot ${rarityClass(it.rarity)}`}
                    style={{ width: 64, height: 64 }}
                  >
                    <GameIcon name={it.icon as IconName} size={48} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="h-title"
                      style={{
                        fontSize: 18,
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>{tc.itemName(it.name, it.name)}</span>
                      {it.enhancementLevel > 0 && (
                        <span
                          style={{
                            fontFamily: 'Luckiest Guy, sans-serif',
                            fontSize: 13,
                            color: '#2a1810',
                            background: '#ffc830',
                            border: '2px solid #2a1810',
                            borderRadius: 6,
                            padding: '0 6px',
                            lineHeight: '18px',
                          }}
                        >
                          +{it.enhancementLevel}
                        </span>
                      )}
                      {it.qty > 1 && (
                        <span className="mono" style={{ fontSize: 14 }}>
                          ×{it.qty}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'inline-block',
                        marginTop: 4,
                        fontFamily: 'Luckiest Guy, sans-serif',
                        fontSize: 10,
                        letterSpacing: 0.5,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: rarityColor(it.rarity),
                        color: '#fff3e0',
                        border: '2px solid #2a1810',
                      }}
                    >
                      {rarityLabel(it.rarity)}
                    </div>
                  </div>
                </div>
                <div
                  className="flavor"
                  style={{
                    fontSize: 14,
                    marginBottom: 10,
                    fontFamily: '"Patrick Hand", cursive',
                    lineHeight: 1.1,
                  }}
                >
                  {tc.itemDesc(it.name, it.desc ?? '')}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {(() => {
                    // Pokazuj enhanced value + bazę w nawiasie dla ulepszonych
                    // itemów — spójnie z Kowalem, gdzie gracz widzi „17 (12)".
                    // Dla level=0 zostaje sama cyfra, bez nawiasu.
                    const renderStatPip = (
                      label: string,
                      base: number,
                      enhanced: number,
                      bg: string,
                      color: string,
                    ) => {
                      if (!base && !enhanced) return null;
                      const lvl = it.enhancementLevel;
                      return (
                        <span className="pip" style={{ background: bg, color }}>
                          {label} +{enhanced}
                          {lvl > 0 && enhanced !== base && (
                            <span style={{ opacity: 0.7, fontWeight: 400, marginLeft: 3 }}>
                              ({base})
                            </span>
                          )}
                        </span>
                      );
                    };
                    return (
                      <>
                        {renderStatPip('ATK', it.atk ?? 0, itEnhanced.atk, '#ffd0d0', '#c83232')}
                        {renderStatPip('DEF', it.def ?? 0, itEnhanced.def, '#d0dcff', '#3a5a8a')}
                        {renderStatPip('MAG', it.mag ?? 0, itEnhanced.mag, '#e8d0ff', '#6a3a8a')}
                      </>
                    );
                  })()}
                  <span className="pip gold" style={{ textTransform: 'uppercase' }}>
                    {it.slot === 'potion'
                      ? t('char.item.slot.potion')
                      : it.slot === 'any'
                        ? t('char.item.slot.any')
                        : t('char.item.slot.label').replace('{slot}', it.slot)}
                  </span>
                </div>
                {statDiff && compareSlot ? (
                  (() => {
                    // Show a row per stat where either side has a non-zero value.
                    // Skipping rows that are 0→0 keeps the table tight for weapon
                    // swaps (mostly ATK) without noise from irrelevant stats.
                    // Enhanced staty — żeby porównanie uwzględniało upgrade Kowala
                    // po obu stronach (new item + currently equipped).
                    const rows = (['atk', 'def', 'mag'] as const)
                      .map((k) => ({
                        k,
                        old: currentEnhanced?.[k] ?? 0,
                        nu: itEnhanced[k],
                        delta: statDiff[k],
                      }))
                      .filter((r) => r.old !== 0 || r.nu !== 0);
                    const total = rows.reduce((acc, r) => acc + r.delta, 0);
                    const STAT_LABEL: Record<'atk' | 'def' | 'mag', string> = {
                      atk: 'ATK',
                      def: 'DEF',
                      mag: 'MAG',
                    };
                    return (
                      <div
                        style={{
                          marginBottom: 12,
                          padding: 10,
                          background: '#fff7e0',
                          border: '2px solid #2a1810',
                          borderRadius: 8,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 6,
                          }}
                        >
                          <span
                            className="h-title"
                            style={{ fontSize: 10, color: '#5a3a2a' }}
                          >
                            {t('char.compare.vs')}
                          </span>
                          {currentEquipped ? (
                            <>
                              <div
                                className={`slot ${rarityClass(currentEquipped.rarity)}`}
                                style={{ width: 22, height: 22, borderWidth: 2 }}
                              >
                                <GameIcon
                                  name={currentEquipped.icon as IconName}
                                  size={16}
                                />
                              </div>
                              <span
                                className="h-title"
                                style={{ fontSize: 13, color: '#2a1810' }}
                              >
                                {tc.itemName(currentEquipped.name, currentEquipped.name)}
                                {currentEquipped.enhancementLevel > 0 && (
                                  <span
                                    style={{
                                      fontFamily: 'Luckiest Guy, sans-serif',
                                      fontSize: 10,
                                      color: '#2a1810',
                                      background: '#ffc830',
                                      border: '1.5px solid #2a1810',
                                      borderRadius: 4,
                                      padding: '0 4px',
                                      marginLeft: 4,
                                      lineHeight: '14px',
                                    }}
                                  >
                                    +{currentEquipped.enhancementLevel}
                                  </span>
                                )}
                              </span>
                            </>
                          ) : (
                            <span
                              className="h-title"
                              style={{ fontSize: 13, color: '#5a3a2a' }}
                            >
                              {t('char.slot.empty')}
                            </span>
                          )}
                        </div>
                        {rows.length === 0 ? (
                          <div style={{ fontSize: 13, color: '#5a3a2a' }}>
                            {t('char.compare.noDiff')}
                          </div>
                        ) : (
                          <>
                            {rows.map((r) => {
                              const deltaColor =
                                r.delta > 0
                                  ? '#2e5020'
                                  : r.delta < 0
                                    ? '#8a2a2a'
                                    : '#5a3a2a';
                              const deltaBg =
                                r.delta > 0
                                  ? '#d8f0c0'
                                  : r.delta < 0
                                    ? '#ffd0d0'
                                    : '#e8dcb9';
                              return (
                                <div
                                  key={r.k}
                                  className="mono"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    fontSize: 12,
                                    padding: '2px 0',
                                  }}
                                >
                                  <span
                                    style={{
                                      minWidth: 36,
                                      fontFamily: 'Luckiest Guy, sans-serif',
                                      fontSize: 13,
                                      color: '#2a1810',
                                    }}
                                  >
                                    {STAT_LABEL[r.k]}
                                  </span>
                                  <span style={{ flex: 1, color: '#5a3a2a' }}>
                                    {r.old} → <b style={{ color: '#2a1810' }}>{r.nu}</b>
                                  </span>
                                  <span
                                    className="pip"
                                    style={{
                                      background: deltaBg,
                                      color: deltaColor,
                                      fontWeight: 700,
                                      minWidth: 36,
                                      textAlign: 'center',
                                    }}
                                  >
                                    {r.delta > 0 ? '+' : ''}
                                    {r.delta}
                                  </span>
                                </div>
                              );
                            })}
                            <div
                              style={{
                                borderTop: '1.5px dashed #c8b890',
                                marginTop: 6,
                                paddingTop: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span
                                className="h-title"
                                style={{ fontSize: 13, color: '#2a1810' }}
                              >
                                {t('char.compare.total')}
                              </span>
                              <span
                                className="pip"
                                style={{
                                  background:
                                    total > 0
                                      ? '#b8e4a0'
                                      : total < 0
                                        ? '#f0b8b8'
                                        : '#e8dcb9',
                                  color:
                                    total > 0
                                      ? '#1e4015'
                                      : total < 0
                                        ? '#5a1818'
                                        : '#5a3a2a',
                                  fontWeight: 700,
                                  fontSize: 12,
                                }}
                              >
                                {total > 0 ? '+' : ''}
                                {total}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()
                ) : null}
                <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                  {canEquip && (
                    <button
                      type="button"
                      className="cbtn green"
                      onClick={async () => {
                        await onEquip(it);
                        setModal(null);
                      }}
                    >
                      {t('char.item.btn.equip')}
                    </button>
                  )}
                  {/* Łotrzyk + sztylet w torbie → druga opcja: założyć w slot
                      off-hand (zamiast tarczy). Server ma tę samą regułę
                      w inventory.equip — klient pre-empt'uje UI. */}
                  {canEquip && char.cls === 'rogue' && isDaggerWeapon(it) && (
                    <button
                      type="button"
                      className="cbtn green"
                      onClick={async () => {
                        await onEquip(it, 'off');
                        setModal(null);
                      }}
                    >
                      {t('char.item.btn.equipOffhand')}
                    </button>
                  )}
                  {!inBag && (
                    <button
                      type="button"
                      className="cbtn"
                      onClick={async () => {
                        await onUnequip(it);
                        setModal(null);
                      }}
                    >
                      {t('char.item.btn.unequip')}
                    </button>
                  )}
                  {isPotion && inBag && (
                    <button
                      type="button"
                      className="cbtn green"
                      onClick={async () => {
                        await onUsePotion(it);
                        setModal(null);
                      }}
                    >
                      {t('char.item.btn.use')}
                    </button>
                  )}
                  {inBag && (
                    <button
                      type="button"
                      className="cbtn"
                      onClick={async () => {
                        await onSell(it);
                        setModal(null);
                      }}
                    >
                      {t('char.item.btn.sell').replace('{g}', String(it.sellPrice))}
                    </button>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="cbtn red sm"
                      style={{ flex: 1 }}
                      onClick={async () => {
                        await onDrop(it);
                        setModal(null);
                      }}
                    >
                      {t('char.item.btn.drop')}
                    </button>
                    <button
                      type="button"
                      className="cbtn ghost sm"
                      style={{ flex: 1 }}
                      onClick={() => setModal(null)}
                    >
                      {t('char.item.btn.close')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

/** Kompaktowy przycisk nawigacyjny w sekcji „meta" karty postaci. Wygląda
 *  jak mały LocTile — kolor tła, ikona, etykieta, opcjonalny badge w rogu.
 *  Tile'y pełne w town grid są zbyt wysokie dla 4 w rzędzie, więc tu
 *  własny wariant z niższym profilem. */
function CharNavButton({
  label,
  icon,
  bg,
  onClick,
  badge,
}: {
  label: string;
  icon: IconName;
  bg: string;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: '10px 4px',
        border: '2.5px solid #2a1810',
        borderRadius: 10,
        background: bg,
        boxShadow: '2px 2px 0 #2a1810',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <GameIcon name={icon} size={28} />
      <div
        className="h-title"
        style={{ fontSize: 10, letterSpacing: 0.3, color: '#2a1810' }}
      >
        {label}
      </div>
      {badge != null && (
        <span
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            minWidth: 18,
            height: 18,
            padding: '0 4px',
            borderRadius: 999,
            background: '#c83232',
            color: '#fff',
            fontFamily: 'Luckiest Guy, sans-serif',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #2a1810',
            boxShadow: '1px 1px 0 #2a1810',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
