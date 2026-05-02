// Read-only podgląd przedmiotu z bundle'a w gem shop. Gracz klika item w
// liście nagród → modal pokazuje stats. Bez akcji equip/sprzedaj — to jest
// tylko podgląd PRZED zakupem.
//
// Dane pochodzą z `gemShop.bundlePreview` (server zwraca templates z REGISTRY).
// Klient cache'uje wynik query i pasuje przez templateId.

import { GameIcon } from '@/components/game-icons';
import type { IconName } from '@/components/game-icons';
import { useT } from '@/i18n';
import type { Rarity } from '@grodno/shared';

const rarityClass = (r: string) =>
  r === 'epic' ? 'epic' : r === 'legendary' ? 'legendary' : r === 'rare' ? 'rare' : '';

const rarityColor = (r: string) =>
  r === 'epic' ? '#a04ef0' : r === 'legendary' ? '#ffc830' : r === 'rare' ? '#3a8ac8' : '#8a8a8a';

const rarityLabelKey = (r: string) =>
  r === 'epic'
    ? 'item.rarity.epic'
    : r === 'legendary'
      ? 'item.rarity.legendary'
      : r === 'rare'
        ? 'item.rarity.rare'
        : 'item.rarity.common';

const slotLabelKey = (slot: string) =>
  slot === 'weapon'
    ? 'item.slot.weapon'
    : slot === 'armor'
      ? 'item.slot.armor'
      : slot === 'shield'
        ? 'item.slot.shield'
        : slot === 'helmet'
          ? 'item.slot.helmet'
          : slot === 'trinket'
            ? 'item.slot.trinket'
            : slot === 'potion'
              ? 'item.slot.potion'
              : 'item.slot.any';

export interface BundleItemPreview {
  templateId: string;
  qty: number;
  name: string;
  icon: string;
  slot: string;
  rarity: string;
  atk: number;
  def: number;
  mag: number;
  hpHeal: number;
  mpHeal: number;
  desc: string;
  allowedClasses: readonly string[] | null;
}

export function BundleItemPreviewModal({
  item,
  onClose,
}: {
  item: BundleItemPreview;
  onClose: () => void;
}) {
  const t = useT();
  const isPotion = item.slot === 'potion';
  const hasStats = item.atk !== 0 || item.def !== 0 || item.mag !== 0;
  const hasHeal = item.hpHeal > 0 || item.mpHeal > 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 220,
        background: 'rgba(42,24,16,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'modal-fade-in 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`panel ${rarityClass(item.rarity)}`}
        style={{
          width: '100%',
          maxWidth: 320,
          background: '#f3ead9',
          padding: 16,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
          <div
            className={`slot ${rarityClass(item.rarity)}`}
            style={{ width: 64, height: 64 }}
          >
            <GameIcon name={item.icon as IconName} size={48} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="h-title"
              style={{
                fontSize: 17,
                lineHeight: 1.1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
              }}
            >
              <span>{item.name}</span>
              {item.qty > 1 && (
                <span className="mono" style={{ fontSize: 14 }}>
                  ×{item.qty}
                </span>
              )}
            </div>
            <div
              style={{
                display: 'inline-block',
                marginTop: 4,
                fontFamily: 'Luckiest Guy, sans-serif',
                fontSize: 10,
                letterSpacing: 0.4,
                background: rarityColor(item.rarity),
                color: '#2a1810',
                border: '2px solid #2a1810',
                borderRadius: 4,
                padding: '1px 6px',
              }}
            >
              {t(rarityLabelKey(item.rarity) as never)}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 13, color: '#5a3a2a', marginBottom: 8 }}>
          {t(slotLabelKey(item.slot) as never)}
          {item.allowedClasses && item.allowedClasses.length > 0 && (
            <>
              {' · '}
              <span className="mono" style={{ fontSize: 12 }}>
                {item.allowedClasses
                  .map((c) =>
                    c === 'warrior'
                      ? t('item.cls.warrior')
                      : c === 'mage'
                        ? t('item.cls.mage')
                        : c === 'rogue'
                          ? t('item.cls.rogue')
                          : c,
                  )
                  .join(' / ')}
              </span>
            </>
          )}
        </div>

        {hasStats && !isPotion && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              marginBottom: 10,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
            }}
          >
            {item.atk !== 0 && (
              <span style={{ color: '#c83232' }}>
                ATK {item.atk > 0 ? `+${item.atk}` : item.atk}
              </span>
            )}
            {item.def !== 0 && (
              <span style={{ color: '#3a5a8a' }}>
                DEF {item.def > 0 ? `+${item.def}` : item.def}
              </span>
            )}
            {item.mag !== 0 && (
              <span style={{ color: '#6a3a8a' }}>
                MAG {item.mag > 0 ? `+${item.mag}` : item.mag}
              </span>
            )}
          </div>
        )}

        {hasHeal && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              marginBottom: 10,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
            }}
          >
            {item.hpHeal > 0 && <span style={{ color: '#3a7a3a' }}>+{item.hpHeal} HP</span>}
            {item.mpHeal > 0 && <span style={{ color: '#3a5a8a' }}>+{item.mpHeal} MP</span>}
          </div>
        )}

        {item.desc && (
          <div
            className="flavor"
            style={{ fontSize: 14, color: '#5a3a2a', marginBottom: 12 }}
          >
            {item.desc}
          </div>
        )}

        <button
          type="button"
          className="cbtn ghost sm"
          style={{ width: '100%' }}
          onClick={onClose}
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );
}

// Forward type re-export — Rarity used by callers.
export type { Rarity };
