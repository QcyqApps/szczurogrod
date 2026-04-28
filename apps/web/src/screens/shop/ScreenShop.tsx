import { GameIcon } from '@/components/game-icons';
import type { IconName } from '@/components/game-icons';
import { IcoCoin, IcoGem } from '@/components/icons';
import { GemSinkButton } from '@/components/ui-common';
import type { Character, EquippedSlot, InventoryItem, ItemSlot } from '@grodno/shared';
import type { Rarity } from '@grodno/shared';
import { useT, useContentT } from '@/i18n';
import type { DictKey } from '@/i18n';

export interface ShopItem {
  id: string;
  name: string;
  icon: IconName;
  rarity: Rarity;
  slot: ItemSlot;
  atk: number;
  def: number;
  mag: number;
  hpHeal: number;
  mpHeal: number;
  price: number;
  desc: string;
  gems?: boolean;
  requiredLvl: number;
  /** True when this listing was already purchased today by this character. */
  soldOut: boolean;
}

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#a8a890',
  rare: '#4a7cff',
  epic: '#a04ef0',
  legendary: '#e07820',
};

const RARITY_LABEL_KEY: Record<Rarity, DictKey> = {
  common: 'shop.rarity.common',
  rare: 'shop.rarity.rare',
  epic: 'shop.rarity.epic',
  legendary: 'shop.rarity.legendary',
};

const rarityClass = (r: Rarity) =>
  r === 'epic' ? 'epic' : r === 'legendary' ? 'legendary' : r === 'rare' ? 'rare' : '';

export interface ScreenShopProps {
  char: Character;
  items: readonly ShopItem[];
  /** Currently-equipped items keyed by slot, used to show per-card deltas. */
  equipped: Partial<Record<EquippedSlot, InventoryItem>>;
  /** Aktualny koszt ręcznego odświeżenia w gemach (scaling per refreshCountToday). */
  refreshCost: number;
  /** Ile razy odświeżano sklep dzisiaj UTC. Driver displayu „N odświeżeń dziś". */
  refreshCountToday: number;
  refreshPending: boolean;
  onRefresh: () => void;
  onBuy: (item: ShopItem) => void | Promise<void>;
  onBack: () => void;
}

/** Slots that are both equipped and appear in the shop (weapons + armor + jewelry). */
const EQUIP_SLOTS = new Set<ItemSlot>([
  'head',
  'neck',
  'chest',
  'weapon',
  'off',
  'hands',
  'ring',
  'feet',
]);

export function ScreenShop({
  char,
  items,
  equipped,
  refreshCost,
  refreshCountToday,
  refreshPending,
  onRefresh,
  onBuy,
  onBack,
}: ScreenShopProps) {
  const t = useT();
  const tc = useContentT();
  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div
        className="panel"
        style={{
          padding: 12,
          marginBottom: 12,
          background: 'linear-gradient(180deg, #4a7c3a 0%, #2e5020 100%)',
          color: '#fff3e0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ lineHeight: 0 }}>
            <GameIcon name="shop" size={44} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="h-display" style={{ fontSize: 20, color: '#ffc830' }}>
              {t('shop.heading')}
            </div>
            <div className="flavor light" style={{ fontSize: 15 }}>
              {t('shop.flavor')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="pip gold" style={{ fontSize: 13 }}>
              <IcoCoin s={12} /> {char.gold}
            </div>
            <div style={{ height: 4 }} />
            <div className="pip" style={{ fontSize: 13, background: '#a0d8f0' }}>
              <IcoGem s={12} /> {char.gems}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 13,
          color: '#5a3a2a',
          marginBottom: 6,
          textAlign: 'center',
          fontStyle: 'italic',
        }}
      >
        {t('shop.refreshHint')}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <GemSinkButton
          label={t('shop.refresh.now')}
          cost={refreshCost}
          playerGems={char.gems}
          pending={refreshPending}
          onClick={onRefresh}
          disabledReason={t('shop.refresh.help')}
          size="sm"
          variant="primary"
        />
        {refreshCountToday > 0 && (
          <span
            className="mono"
            style={{ fontSize: 13, color: '#5a3a2a' }}
            title={t('shop.refresh.todayTitle')}
          >
            {t('shop.refresh.todayCount').replace('{n}', String(refreshCountToday))}
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {items.map((it) => {
          const locked = it.requiredLvl > char.lvl;
          const soldOut = it.soldOut;
          // Only gear slots have a 1:1 equipped-comparison; potions are compared
          // to nothing (consumables), 'any' items can land in any slot.
          const canCompare = EQUIP_SLOTS.has(it.slot);
          const cur = canCompare ? equipped[it.slot as EquippedSlot] : undefined;
          const totalDelta = canCompare
            ? (it.atk - (cur?.atk ?? 0)) +
              (it.def - (cur?.def ?? 0)) +
              (it.mag - (cur?.mag ?? 0))
            : 0;
          return (
          <div
            key={it.id}
            className="panel-tight"
            style={{
              padding: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              opacity: locked || soldOut ? 0.55 : 1,
              position: 'relative',
              filter: soldOut ? 'grayscale(60%)' : undefined,
            }}
          >
            <div
              className={`slot ${rarityClass(it.rarity)}`}
              style={{ width: '100%', height: 58, padding: 6 }}
            >
              <GameIcon name={it.icon} size={44} />
            </div>
            <div className="h-title" style={{ fontSize: 14, lineHeight: 1 }}>
              {tc.itemName(it.name, it.name)}
            </div>
            <div
              className="pip"
              style={{
                fontSize: 9,
                background: RARITY_COLOR[it.rarity],
                color: '#fff',
                alignSelf: 'flex-start',
              }}
            >
              {t(RARITY_LABEL_KEY[it.rarity])}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {it.atk > 0 && (
                <span
                  className="pip"
                  style={{ background: '#ffd0d0', color: '#c83232', fontSize: 12 }}
                >
                  ATK +{it.atk}
                </span>
              )}
              {it.def > 0 && (
                <span
                  className="pip"
                  style={{ background: '#d0dcff', color: '#3a5a8a', fontSize: 12 }}
                >
                  DEF +{it.def}
                </span>
              )}
              {it.mag > 0 && (
                <span
                  className="pip"
                  style={{ background: '#e8d0ff', color: '#6a3a8a', fontSize: 12 }}
                >
                  MAG +{it.mag}
                </span>
              )}
              {it.hpHeal > 0 && (
                <span
                  className="pip"
                  style={{ background: '#d8f0c0', color: '#2e5020', fontSize: 12 }}
                >
                  +{it.hpHeal} HP
                </span>
              )}
              {it.mpHeal > 0 && (
                <span
                  className="pip"
                  style={{ background: '#c8d8f0', color: '#2a3a5a', fontSize: 12 }}
                >
                  +{it.mpHeal} MP
                </span>
              )}
            </div>
            {canCompare && !locked && (
              <div
                style={{
                  fontSize: 12,
                  padding: '3px 6px',
                  borderRadius: 6,
                  background: totalDelta > 0 ? '#d8f0c0' : totalDelta < 0 ? '#ffd0d0' : '#e8dcb9',
                  color: totalDelta > 0 ? '#1e4015' : totalDelta < 0 ? '#5a1818' : '#5a3a2a',
                  border: '1.5px solid #2a1810',
                  lineHeight: 1.2,
                }}
                title={
                  cur
                    ? t('shop.cmp.has')
                        .replace('{name}', tc.itemName(cur.name, cur.name))
                        .replace('{atk}', String(cur.atk ?? 0))
                        .replace('{def}', String(cur.def ?? 0))
                        .replace('{mag}', String(cur.mag ?? 0))
                    : t('shop.cmp.empty')
                }
              >
                {cur ? (
                  <>
                    vs <b>{tc.itemName(cur.name, cur.name)}</b>: {totalDelta > 0 ? '+' : ''}
                    {totalDelta}
                  </>
                ) : (
                  <>{t('shop.cmp.emptyShort').replace('{n}', String((it.atk + it.def + it.mag) || 0))}</>
                )}
              </div>
            )}
            <div className="flavor" style={{ fontSize: 14, lineHeight: 1.15, flex: 1 }}>
              {tc.itemDesc(it.name, it.desc)}
            </div>
            {locked && (
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  background: '#2a1810',
                  color: '#ffc830',
                  fontFamily: 'Luckiest Guy',
                  fontSize: 12,
                  letterSpacing: 0.5,
                  padding: '2px 6px',
                  borderRadius: 999,
                  border: '2px solid #ffc830',
                }}
              >
                LVL {it.requiredLvl}
              </div>
            )}
            {soldOut && !locked && (
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  background: '#2a1810',
                  color: '#f3ead9',
                  fontFamily: 'Luckiest Guy',
                  fontSize: 12,
                  letterSpacing: 0.5,
                  padding: '2px 6px',
                  borderRadius: 999,
                  border: '2px solid #f3ead9',
                }}
              >
                {t('shop.soldOut')}
              </div>
            )}
            <button
              type="button"
              className="cbtn sm"
              disabled={locked || soldOut}
              style={{
                background: soldOut ? '#a8a890' : it.gems ? '#a0d8f0' : '#d4a24c',
                opacity: locked || soldOut ? 0.6 : 1,
                cursor: locked || soldOut ? 'not-allowed' : 'pointer',
              }}
              onClick={() => !locked && !soldOut && onBuy(it)}
              title={soldOut ? t('shop.soldOutTitle') : undefined}
            >
              {soldOut ? (
                <span style={{ fontSize: 13 }}>{t('shop.soldOutBtn')}</span>
              ) : it.gems ? (
                <>
                  <IcoGem s={13} /> {it.price}
                </>
              ) : (
                <>
                  <IcoCoin s={13} /> {it.price}
                </>
              )}
            </button>
          </div>
        );
        })}
      </div>

      <button
        type="button"
        className="cbtn ghost"
        style={{ marginTop: 14, width: '100%' }}
        onClick={onBack}
      >
        {t('shop.back')}
      </button>
    </div>
  );
}
