import { useState } from 'react';
import { GameIcon } from '@/components/game-icons';
import type { IconName } from '@/components/game-icons';
import { IcoCoin, IcoGem } from '@/components/icons';
import { useT } from '@/i18n';
import type { DictKey } from '@/i18n';
import { trpc } from '@/api/trpc';
import type { Character } from '@grodno/shared';
import type { Rarity } from '@grodno/shared';
import { useIsNative } from '@/api/use-is-native';
import { NativeOnlyPurchaseModal } from '@/components/ui-common/NativeOnlyPurchaseModal';
import { PayPalCheckoutModal } from '@/components/ui-common';
import { GiantGemCluster } from './GiantGemCluster';
import { BundleItemPreviewModal, type BundleItemPreview } from './BundleItemPreviewModal';

export type BundleReward =
  | { kind: 'gems'; value: number }
  | { kind: 'gold'; value: number }
  | {
      kind: 'item';
      value: string;
      valueKey?: DictKey;
      icon: IconName;
      rarity: Rarity;
      /** templateId — match z server'owym `gemShop.bundlePreview`. Klik → modal. */
      templateId?: string;
    };

export interface BundleDef {
  id: string;
  name: string;
  nameKey?: DictKey;
  tag?: string;
  tagKey?: DictKey;
  price: string;
  oldPrice: string;
  rewards: readonly BundleReward[];
  bg: string;
}

export interface GemPack {
  id: string;
  name: string;
  nameKey?: DictKey;
  gems: number;
  bonus: number;
  price: string;
  tag: string | null;
  tagKey?: DictKey;
  color: string;
}

export interface Purchase {
  id: string;
  name: string;
  gems?: number;
  price: string;
  bundle?: BundleDef;
  vip?: boolean;
  real: boolean;
}

const PACKS: readonly GemPack[] = [
  { id: 'p1', name: 'Garstka', nameKey: 'gemShop.pack.p1', gems: 80, bonus: 0, price: '4,99', tag: null, color: '#b8d4e8' },
  { id: 'p2', name: 'Sakiewka', nameKey: 'gemShop.pack.p2', gems: 450, bonus: 12, price: '19,99', tag: 'POPULARNY', tagKey: 'gemShop.pack.tag.popular', color: '#8ac4e0' },
  { id: 'p3', name: 'Skrzynka', nameKey: 'gemShop.pack.p3', gems: 1200, bonus: 25, price: '49,99', tag: 'NAJLEPSZE', tagKey: 'gemShop.pack.tag.best', color: '#5aa8d0' },
  { id: 'p4', name: 'Kufer', nameKey: 'gemShop.pack.p4', gems: 2800, bonus: 40, price: '99,99', tag: null, color: '#3a8ac8' },
  { id: 'p5', name: 'Smoczy Skarb', nameKey: 'gemShop.pack.p5', gems: 6500, bonus: 55, price: '199,99', tag: 'MEGA WARTOŚĆ', tagKey: 'gemShop.pack.tag.mega', color: '#2e6aa8' },
];

const BUNDLES: readonly BundleDef[] = [
  {
    id: 'b1',
    name: 'Pakiet Startowy',
    nameKey: 'gemShop.bundle.b1.name',
    tag: 'TYLKO RAZ',
    tagKey: 'gemShop.bundle.b1.tag',
    price: '9,99',
    oldPrice: '29,99',
    rewards: [
      { kind: 'gems', value: 300 },
      { kind: 'gold', value: 5000 },
      // templateId tu = item NAME (server lookup w `REGISTRY.itemsByName`),
      // nie shop catalog id. Patrz `BUNDLE_PACKAGES` w server gemPackages.ts.
      { kind: 'item', value: 'Miecz Świtu', valueKey: 'gemShop.item.swordZarliwy', icon: 'sword-dawn', rarity: 'rare', templateId: 'Miecz Świtu' },
    ],
    bg: 'linear-gradient(135deg, #4a7c3a 0%, #2e5020 100%)',
  },
  {
    id: 'b2',
    name: 'Zestaw Maga',
    nameKey: 'gemShop.bundle.b2.name',
    tag: '-60%',
    tagKey: 'gemShop.bundle.b2.tag',
    price: '24,99',
    oldPrice: '59,99',
    rewards: [
      { kind: 'gems', value: 800 },
      { kind: 'item', value: 'Kostur Chaosu', valueKey: 'gemShop.item.kosturChaosu', icon: 'orb', rarity: 'epic', templateId: 'Kostur Chaosu' },
      { kind: 'item', value: 'Mikstura Głębokiej Many ×5', valueKey: 'gemShop.item.eliksirManyX5', icon: 'potion', rarity: 'rare', templateId: 'Mikstura Głębokiej Many' },
    ],
    bg: 'linear-gradient(135deg, #5a3a8a 0%, #3a1a5a 100%)',
  },
];

const SPECIAL = {
  id: 'sp1',
  name: 'KRÓLEWSKA OFERTA',
  nameKey: 'gemShop.special.name' as DictKey,
  subKey: 'gemShop.special.subTime' as DictKey,
  price: '14,99',
  oldPrice: '49,99',
  gems: 1500,
  discount: 70,
};

const VIP = {
  nameKey: 'gemShop.vip.name' as DictKey,
  subKey: 'gemShop.vip.sub' as DictKey,
  priceKey: 'gemShop.vip.price' as DictKey,
  // perk3 (Brak reklam) usunięte — gra nie wyświetla reklam, więc benefit
  // wprowadzałby graczy w błąd. Pozostają trzy faktyczne korzyści.
  perkKeys: [
    'gemShop.vip.perk1',
    'gemShop.vip.perk2',
    'gemShop.vip.perk4',
  ] as readonly DictKey[],
};

const PACK_SIZE: Record<string, { size: number; count: number }> = {
  p1: { size: 36, count: 1 },
  p2: { size: 46, count: 2 },
  p3: { size: 56, count: 3 },
  p4: { size: 64, count: 4 },
  p5: { size: 72, count: 6 },
};

const SPARKLES: readonly (readonly [number, number])[] = [
  [30, 20],
  [80, 70],
  [150, 15],
  [210, 60],
  [270, 25],
  [260, 80],
  [110, 35],
  [40, 75],
];

export interface ScreenGemShopProps {
  char: Character;
  onBack: () => void;
  onPurchase: (purchase: Purchase) => void;
}

export function ScreenGemShop({ char, onBack, onPurchase }: ScreenGemShopProps) {
  const t = useT();
  const native = useIsNative();
  const [pulse, setPulse] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ pack: Purchase; displayName: string } | null>(null);
  const [nativeOnlyBlock, setNativeOnlyBlock] = useState<string | null>(null);
  const [paypal, setPaypal] = useState<{ packId: string; label: string; price: string } | null>(null);
  const [itemPreview, setItemPreview] = useState<BundleItemPreview | null>(null);
  const catalogQuery = trpc.gemShop.list.useQuery();
  const paypalReady = catalogQuery.data?.paypalReady ?? false;
  // Bundle item previews — server zwraca templates z REGISTRY per bundleId.
  // Cache infinity — content drift mało prawdopodobny w obrębie sesji.
  const bundlePreviewQuery = trpc.gemShop.bundlePreview.useQuery(undefined, {
    staleTime: Infinity,
  });
  const bundleItemMap = new Map<string, BundleItemPreview>();
  for (const bundle of bundlePreviewQuery.data?.bundles ?? []) {
    for (const item of bundle.items) {
      bundleItemMap.set(item.templateId, item);
    }
  }

  function buy(pack: Purchase, displayName: string) {
    // Web użytkownik klika BUY na produkcie real-money. Dwie ścieżki:
    //   - native (Capacitor) → confirm modal → Google Play Billing
    //   - web + paypalReady → PayPal (gem packs, VIP, bundles — wszystko
    //     ma server-side mapping w `findPaypalTarget`)
    //   - web bez PayPala → fallback NativeOnly modal
    if (!native && pack.real) {
      if (paypalReady) {
        setPaypal({ packId: pack.id, label: displayName, price: pack.price });
        return;
      }
      setNativeOnlyBlock(displayName);
      return;
    }
    setConfirm({ pack, displayName });
  }
  function confirmBuy() {
    if (!confirm) return;
    const p = confirm.pack;
    setPulse(p.id);
    onPurchase(p);
    setConfirm(null);
    setTimeout(() => setPulse(null), 800);
  }

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div
        className="panel"
        style={{
          padding: 14,
          marginBottom: 12,
          background: 'linear-gradient(135deg, #2e4a7c 0%, #1a2e5a 60%, #5a2e8a 100%)',
          color: '#fff3e0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            opacity: 0.35,
          }}
          viewBox="0 0 300 100"
          preserveAspectRatio="none"
        >
          {SPARKLES.map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <path
                d="M0,-6 L1.5,-1.5 L6,0 L1.5,1.5 L0,6 L-1.5,1.5 L-6,0 L-1.5,-1.5 Z"
                fill="#fff3e0"
              />
            </g>
          ))}
        </svg>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <div style={{ lineHeight: 0, filter: 'drop-shadow(2px 2px 0 #000)' }}>
            <IcoGem s={52} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="h-display" style={{ fontSize: 22, color: '#a0d8f0', lineHeight: 1 }}>
              {t('gemShop.title')}
            </div>
            <div className="flavor light" style={{ fontSize: 14, marginTop: 4 }}>
              {t('gemShop.flavor')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 10,
                color: '#a0d8f0',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {t('gemShop.yours')}
            </div>
            <div
              className="pip"
              style={{ fontSize: 14, background: '#a0d8f0', marginTop: 2 }}
            >
              <IcoGem s={16} /> {char.gems}
            </div>
          </div>
        </div>
      </div>

      <div
        className="panel"
        style={{
          padding: 0,
          marginBottom: 14,
          overflow: 'hidden',
          border: '3px solid #c83232',
          background: 'linear-gradient(135deg, #fff3e0 0%, #f9e6a8 100%)',
          position: 'relative',
          boxShadow: '0 0 0 3px rgba(200,50,50,0.25), var(--shadow-hard)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: -24,
            background: '#c83232',
            color: '#fff',
            padding: '3px 28px',
            transform: 'rotate(35deg)',
            fontFamily: 'Luckiest Guy',
            fontSize: 12,
            letterSpacing: 0.5,
            border: '2px solid #2a1810',
            boxShadow: '1px 1px 0 #2a1810',
            zIndex: 2,
          }}
        >
          -{SPECIAL.discount}%
        </div>

        <div style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <div
            style={{
              width: 78,
              height: 78,
              flexShrink: 0,
              background: 'radial-gradient(circle, #ffec9a 0%, #d4a24c 100%)',
              border: '2.5px solid #2a1810',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.5)',
              position: 'relative',
            }}
          >
            <GiantGemCluster size={62} count={5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'inline-block',
                background: '#c83232',
                color: '#fff',
                fontFamily: 'Luckiest Guy',
                fontSize: 10,
                letterSpacing: 0.5,
                padding: '2px 8px',
                borderRadius: 4,
                border: '1.5px solid #2a1810',
                marginBottom: 4,
              }}
            >
              ⏰ {t(SPECIAL.subKey)}
            </div>
            <div
              className="h-display clean"
              style={{ fontSize: 16, lineHeight: 1, color: '#2a1810' }}
            >
              {t(SPECIAL.nameKey)}
            </div>
            <div
              className="h-title"
              style={{
                fontSize: 18,
                color: '#8a5a1a',
                lineHeight: 1,
                marginTop: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <IcoGem s={20} /> {SPECIAL.gems}
            </div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                style={{
                  fontSize: 13,
                  color: '#8a5a3a',
                  textDecoration: 'line-through',
                }}
              >
                {SPECIAL.oldPrice}{t('gemShop.currency')}
              </span>
              <span className="h-title" style={{ fontSize: 16, color: '#c83232' }}>
                {SPECIAL.price}{t('gemShop.currency')}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="cbtn red"
          style={{
            width: '100%',
            borderRadius: 0,
            margin: 0,
            borderLeft: 0,
            borderRight: 0,
            borderBottom: 0,
            borderTop: '2.5px solid #2a1810',
          }}
          onClick={() =>
            buy(
              {
                id: SPECIAL.id,
                name: SPECIAL.name,
                gems: SPECIAL.gems,
                price: SPECIAL.price,
                real: true,
              },
              t(SPECIAL.nameKey),
            )
          }
        >
          {t('gemShop.special.cta')}
        </button>
      </div>

      <div className="h-title" style={{ fontSize: 14, marginBottom: 8, color: '#5a3a2a' }}>
        {t('gemShop.packs.heading')}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 14,
        }}
      >
        {PACKS.map((p) => {
          const isPulsing = pulse === p.id;
          const sz = PACK_SIZE[p.id];
          return (
            <div
              key={p.id}
              className="panel-tight"
              style={{
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                position: 'relative',
                background: '#fff3e0',
                transform: isPulsing ? 'scale(1.04)' : 'scale(1)',
                transition: 'transform 0.2s',
              }}
            >
              {p.tag && (
                <div
                  style={{
                    position: 'absolute',
                    top: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background:
                      p.tagKey === 'gemShop.pack.tag.mega'
                        ? '#c83232'
                        : p.tagKey === 'gemShop.pack.tag.best'
                          ? '#4a7c3a'
                          : '#d4a24c',
                    color: '#fff',
                    fontFamily: 'Luckiest Guy',
                    fontSize: 9,
                    letterSpacing: 0.6,
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: '2px solid #2a1810',
                    boxShadow: '1px 1px 0 #2a1810',
                    whiteSpace: 'nowrap',
                    zIndex: 2,
                  }}
                >
                  {p.tagKey ? t(p.tagKey) : p.tag}
                </div>
              )}

              {p.bonus > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: '#ffc830',
                    color: '#2a1810',
                    fontFamily: 'Luckiest Guy',
                    fontSize: 10,
                    padding: '1px 5px',
                    borderRadius: 999,
                    border: '1.5px solid #2a1810',
                    lineHeight: 1.3,
                  }}
                >
                  +{p.bonus}%
                </div>
              )}

              <div
                style={{
                  width: 80,
                  height: 72,
                  marginTop: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `radial-gradient(circle at 50% 55%, ${p.color} 0%, transparent 70%)`,
                }}
              >
                <GiantGemCluster size={sz.size} count={sz.count} />
              </div>

              <div className="h-title" style={{ fontSize: 12, lineHeight: 1, color: '#5a3a2a' }}>
                {p.nameKey ? t(p.nameKey) : p.name}
              </div>
              <div
                className="h-title"
                style={{
                  fontSize: 18,
                  lineHeight: 1,
                  color: '#3a6aa8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <IcoGem s={16} /> {p.gems.toLocaleString('pl')}
              </div>

              <button
                type="button"
                className="cbtn sm"
                style={{ width: '100%', background: '#4a7c3a', color: '#fff3e0' }}
                onClick={() =>
                  buy(
                    {
                      id: p.id,
                      name: p.name,
                      gems: p.gems,
                      price: p.price,
                      real: true,
                    },
                    p.nameKey ? t(p.nameKey) : p.name,
                  )
                }
              >
                {p.price} {t('gemShop.currency')}
              </button>
            </div>
          );
        })}
      </div>

      <div className="h-title" style={{ fontSize: 14, marginBottom: 8, color: '#5a3a2a' }}>
        {t('gemShop.bundles.heading')}
      </div>
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}
      >
        {BUNDLES.map((b) => (
          <div
            key={b.id}
            className="panel"
            style={{
              padding: 0,
              overflow: 'hidden',
              color: '#fff3e0',
              background: b.bg,
              position: 'relative',
            }}
          >
            {b.tag && (
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: '#ffc830',
                  color: '#2a1810',
                  fontFamily: 'Luckiest Guy',
                  fontSize: 10,
                  letterSpacing: 0.5,
                  padding: '2px 7px',
                  borderRadius: 4,
                  border: '2px solid #2a1810',
                  zIndex: 2,
                }}
              >
                {b.tagKey ? t(b.tagKey) : b.tag}
              </div>
            )}
            <div style={{ padding: 12 }}>
              <div
                className="h-display"
                style={{ fontSize: 18, color: '#ffc830', lineHeight: 1, marginBottom: 8 }}
              >
                {b.nameKey ? t(b.nameKey) : b.name}
              </div>
              <div
                style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}
              >
                {b.rewards.map((r, i) => {
                  const isClickableItem =
                    r.kind === 'item' && r.templateId && bundleItemMap.has(r.templateId);
                  const baseStyle: React.CSSProperties = {
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'rgba(255,243,224,0.15)',
                    border: '1.5px solid rgba(255,243,224,0.35)',
                    borderRadius: 6,
                    padding: '4px 7px',
                    fontSize: 12,
                    fontFamily: 'inherit',
                    color: 'inherit',
                  };
                  const content = (
                    <>
                      {r.kind === 'gems' && (
                        <>
                          <IcoGem s={13} />{' '}
                          <span
                            className="h-title"
                            style={{ fontSize: 12, color: '#a0d8f0' }}
                          >
                            {r.value}
                          </span>
                        </>
                      )}
                      {r.kind === 'gold' && (
                        <>
                          <IcoCoin s={13} />{' '}
                          <span
                            className="h-title"
                            style={{ fontSize: 12, color: '#ffc830' }}
                          >
                            {r.value.toLocaleString('pl')}
                          </span>
                        </>
                      )}
                      {r.kind === 'item' && (
                        <>
                          <GameIcon name={r.icon} size={16} />
                          <span style={{ fontSize: 13 }}>
                            {r.valueKey ? t(r.valueKey) : r.value}
                          </span>
                          {isClickableItem && (
                            <span
                              style={{
                                fontSize: 10,
                                opacity: 0.6,
                                marginLeft: 2,
                              }}
                            >
                              ⓘ
                            </span>
                          )}
                        </>
                      )}
                    </>
                  );
                  if (isClickableItem && r.kind === 'item' && r.templateId) {
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const preview = bundleItemMap.get(r.templateId!);
                          if (preview) setItemPreview(preview);
                        }}
                        style={{ ...baseStyle, cursor: 'pointer' }}
                      >
                        {content}
                      </button>
                    );
                  }
                  return (
                    <div key={i} style={baseStyle}>
                      {content}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: '#c8b898',
                      textDecoration: 'line-through',
                    }}
                  >
                    {b.oldPrice}{t('gemShop.currency')}
                  </span>
                  <span className="h-title" style={{ fontSize: 20, color: '#ffc830' }}>
                    {b.price}{t('gemShop.currency')}
                  </span>
                </div>
                <button
                  type="button"
                  className="cbtn sm"
                  style={{ background: '#ffc830', minWidth: 100 }}
                  onClick={() =>
                    buy(
                      {
                        id: b.id,
                        name: b.name,
                        bundle: b,
                        price: b.price,
                        real: true,
                      },
                      b.nameKey ? t(b.nameKey) : b.name,
                    )
                  }
                >
                  {t('gemShop.bundles.cta')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="panel"
        style={{
          padding: 12,
          marginBottom: 12,
          background: 'linear-gradient(135deg, #2a1810 0%, #4a2e1a 100%)',
          color: '#fff3e0',
          border: '3px solid #ffc830',
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40">
            <path
              d="M6 14 L12 24 L20 10 L28 24 L34 14 L32 32 L8 32 Z"
              fill="#ffc830"
              stroke="#2a1810"
              strokeWidth="2.5"
            />
            <circle cx="6" cy="14" r="3" fill="#c83232" stroke="#2a1810" strokeWidth="1.5" />
            <circle cx="20" cy="10" r="3" fill="#3a8ac8" stroke="#2a1810" strokeWidth="1.5" />
            <circle cx="34" cy="14" r="3" fill="#4a7c3a" stroke="#2a1810" strokeWidth="1.5" />
          </svg>
          <div style={{ flex: 1 }}>
            <div
              className="h-display"
              style={{ fontSize: 17, color: '#ffc830', lineHeight: 1 }}
            >
              {t(VIP.nameKey)}
            </div>
            <div className="flavor light" style={{ fontSize: 14 }}>
              {t(VIP.subKey)}
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            marginBottom: 10,
          }}
        >
          {VIP.perkKeys.map((perkKey, i) => (
            <div
              key={i}
              style={{
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GameIcon name="check" size={13} /> {t(perkKey)}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="cbtn"
          style={{ width: '100%', background: '#ffc830' }}
          onClick={() =>
            buy(
              {
                // 'vip30' = id w client billing-catalog.ts → SKU 'ratburgplus30'
                // w Play Console. Phase 1 implementacja: one-shot consumable
                // z premium gem-grant (3000 gemów). Faktyczna subskrypcja
                // (auto-renew + perks) — Phase 2.
                id: 'vip30',
                name: t(VIP.nameKey),
                gems: 3000,
                price: t(VIP.priceKey),
                real: true,
                vip: true,
              },
              t(VIP.nameKey),
            )
          }
        >
          {t(VIP.priceKey)}
        </button>
      </div>

      <div
        style={{
          textAlign: 'center',
          fontSize: 13,
          color: '#7a5a4a',
          marginBottom: 8,
          padding: '0 8px',
          lineHeight: 1.3,
        }}
      >
        {t('gemShop.disclaimer')}
      </div>

      <button
        type="button"
        className="cbtn ghost"
        style={{ width: '100%' }}
        onClick={onBack}
      >
        {t('gemShop.back')}
      </button>

      {nativeOnlyBlock && (
        <NativeOnlyPurchaseModal
          productLabel={nativeOnlyBlock}
          onClose={() => setNativeOnlyBlock(null)}
        />
      )}

      {itemPreview && (
        <BundleItemPreviewModal item={itemPreview} onClose={() => setItemPreview(null)} />
      )}

      {paypal && (
        <PayPalCheckoutModal
          packId={paypal.packId}
          productLabel={paypal.label}
          priceLabel={`${paypal.price} ${t('gemShop.currency')}`}
          onClose={() => setPaypal(null)}
          onSuccess={() => setPaypal(null)}
        />
      )}

      {confirm && (
        <div
          onClick={() => setConfirm(null)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 200,
            background: 'rgba(42,24,16,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="panel"
            style={{
              width: '100%',
              maxWidth: 300,
              background: '#f3ead9',
              padding: 18,
              textAlign: 'center',
              animation: 'qrm-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div className="h-display clean" style={{ fontSize: 18, marginBottom: 4 }}>
              {t('gemShop.confirm.title')}
            </div>
            <div className="flavor" style={{ fontSize: 14, marginBottom: 12 }}>
              {confirm.displayName}
            </div>
            <div
              style={{
                background: '#f9e6a8',
                border: '2.5px solid #2a1810',
                borderRadius: 10,
                padding: 10,
                marginBottom: 14,
              }}
            >
              {confirm.pack.gems !== undefined && (
                <div
                  className="h-title"
                  style={{
                    fontSize: 20,
                    color: '#3a6aa8',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <IcoGem s={22} /> {confirm.pack.gems.toLocaleString('pl')}
                </div>
              )}
              <div className="h-title" style={{ fontSize: 22, color: '#c83232', marginTop: 4 }}>
                {confirm.pack.price}
                {confirm.pack.price.includes('/') ? '' : ` ${t('gemShop.currency')}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="cbtn ghost sm"
                style={{ flex: 1 }}
                onClick={() => setConfirm(null)}
              >
                {t('gemShop.confirm.cancel')}
              </button>
              <button
                type="button"
                className="cbtn green sm"
                style={{ flex: 1 }}
                onClick={confirmBuy}
              >
                {t('gemShop.confirm.buy')}
              </button>
            </div>
            <div style={{ marginTop: 10, fontSize: 10, color: '#7a5a4a' }}>
              {t('gemShop.confirm.demo')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
