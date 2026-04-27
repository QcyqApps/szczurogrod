import { useState } from 'react';
import { GameIcon } from '@/components/game-icons';
import type { IconName } from '@/components/game-icons';
import { IcoCoin, IcoGem } from '@/components/icons';
import type { Character } from '@grodno/shared';
import type { Rarity } from '@grodno/shared';
import { GiantGemCluster } from './GiantGemCluster';

export type BundleReward =
  | { kind: 'gems'; value: number }
  | { kind: 'gold'; value: number }
  | { kind: 'item'; value: string; icon: IconName; rarity: Rarity };

export interface BundleDef {
  id: string;
  name: string;
  tag?: string;
  price: string;
  oldPrice: string;
  rewards: readonly BundleReward[];
  bg: string;
}

export interface GemPack {
  id: string;
  name: string;
  gems: number;
  bonus: number;
  price: string;
  tag: string | null;
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
  { id: 'p1', name: 'Garstka', gems: 80, bonus: 0, price: '4,99', tag: null, color: '#b8d4e8' },
  { id: 'p2', name: 'Sakiewka', gems: 450, bonus: 12, price: '19,99', tag: 'POPULARNY', color: '#8ac4e0' },
  { id: 'p3', name: 'Skrzynka', gems: 1200, bonus: 25, price: '49,99', tag: 'NAJLEPSZE', color: '#5aa8d0' },
  { id: 'p4', name: 'Kufer', gems: 2800, bonus: 40, price: '99,99', tag: null, color: '#3a8ac8' },
  { id: 'p5', name: 'Smoczy Skarb', gems: 6500, bonus: 55, price: '199,99', tag: 'MEGA WARTOŚĆ', color: '#2e6aa8' },
];

const BUNDLES: readonly BundleDef[] = [
  {
    id: 'b1',
    name: 'Pakiet Startowy',
    tag: 'TYLKO RAZ',
    price: '9,99',
    oldPrice: '29,99',
    rewards: [
      { kind: 'gems', value: 300 },
      { kind: 'gold', value: 5000 },
      { kind: 'item', value: 'Miecz Żarliwy', icon: 'sword-dawn', rarity: 'rare' },
    ],
    bg: 'linear-gradient(135deg, #4a7c3a 0%, #2e5020 100%)',
  },
  {
    id: 'b2',
    name: 'Zestaw Maga',
    tag: '-60%',
    price: '24,99',
    oldPrice: '59,99',
    rewards: [
      { kind: 'gems', value: 800 },
      { kind: 'item', value: 'Kostur Chaosu', icon: 'orb', rarity: 'epic' },
      { kind: 'item', value: 'Eliksir Many ×5', icon: 'potion', rarity: 'rare' },
    ],
    bg: 'linear-gradient(135deg, #5a3a8a 0%, #3a1a5a 100%)',
  },
];

const SPECIAL = {
  id: 'sp1',
  name: 'KRÓLEWSKA OFERTA',
  sub: 'Kończy się za 2h 47min',
  price: '14,99',
  oldPrice: '49,99',
  gems: 1500,
  discount: 70,
};

const VIP = {
  name: 'SZCZUROGRÓD+ SUBSKRYPCJA',
  sub: '30 dni premium',
  price: '19,99/mies.',
  perks: [
    '100 gemów dziennie',
    '+50% złota z questów',
    'Brak reklam',
    'Ekskluzywna korona',
  ],
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
  const [pulse, setPulse] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ pack: Purchase } | null>(null);

  function buy(pack: Purchase) {
    setConfirm({ pack });
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
              MAGICZNY BAZAR
            </div>
            <div className="flavor light" style={{ fontSize: 14, marginTop: 4 }}>
              Błyszczące kamyki. Niezbędne.
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
              Twoje
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
              ⏰ {SPECIAL.sub}
            </div>
            <div
              className="h-display clean"
              style={{ fontSize: 16, lineHeight: 1, color: '#2a1810' }}
            >
              {SPECIAL.name}
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
                {SPECIAL.oldPrice}zł
              </span>
              <span className="h-title" style={{ fontSize: 16, color: '#c83232' }}>
                {SPECIAL.price}zł
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
            buy({
              id: SPECIAL.id,
              name: SPECIAL.name,
              gems: SPECIAL.gems,
              price: SPECIAL.price,
              real: true,
            })
          }
        >
          CHWYTAJ OKAZJĘ!
        </button>
      </div>

      <div className="h-title" style={{ fontSize: 14, marginBottom: 8, color: '#5a3a2a' }}>
        PAKIETY GEMÓW
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
                      p.tag === 'MEGA WARTOŚĆ'
                        ? '#c83232'
                        : p.tag === 'NAJLEPSZE'
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
                  {p.tag}
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
                {p.name}
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
                  buy({
                    id: p.id,
                    name: p.name,
                    gems: p.gems,
                    price: p.price,
                    real: true,
                  })
                }
              >
                {p.price} zł
              </button>
            </div>
          );
        })}
      </div>

      <div className="h-title" style={{ fontSize: 14, marginBottom: 8, color: '#5a3a2a' }}>
        ZESTAWY SPECJALNE
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
                {b.tag}
              </div>
            )}
            <div style={{ padding: 12 }}>
              <div
                className="h-display"
                style={{ fontSize: 18, color: '#ffc830', lineHeight: 1, marginBottom: 8 }}
              >
                {b.name}
              </div>
              <div
                style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}
              >
                {b.rewards.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'rgba(255,243,224,0.15)',
                      border: '1.5px solid rgba(255,243,224,0.35)',
                      borderRadius: 6,
                      padding: '4px 7px',
                      fontSize: 12,
                    }}
                  >
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
                        <span style={{ fontSize: 13 }}>{r.value}</span>
                      </>
                    )}
                  </div>
                ))}
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
                    {b.oldPrice}zł
                  </span>
                  <span className="h-title" style={{ fontSize: 20, color: '#ffc830' }}>
                    {b.price}zł
                  </span>
                </div>
                <button
                  type="button"
                  className="cbtn sm"
                  style={{ background: '#ffc830', minWidth: 100 }}
                  onClick={() =>
                    buy({
                      id: b.id,
                      name: b.name,
                      bundle: b,
                      price: b.price,
                      real: true,
                    })
                  }
                >
                  KUP ZESTAW
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
              {VIP.name}
            </div>
            <div className="flavor light" style={{ fontSize: 14 }}>
              {VIP.sub}
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
          {VIP.perks.map((perk, i) => (
            <div
              key={i}
              style={{
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GameIcon name="check" size={13} /> {perk}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="cbtn"
          style={{ width: '100%', background: '#ffc830' }}
          onClick={() =>
            buy({
              id: 'vip',
              name: VIP.name,
              gems: 100,
              price: VIP.price,
              real: true,
              vip: true,
            })
          }
        >
          {VIP.price}
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
        Ceny zawierają VAT. Zakupy wspierają rozwój gry. Miłej zabawy!
      </div>

      <button
        type="button"
        className="cbtn ghost"
        style={{ width: '100%' }}
        onClick={onBack}
      >
        ← Wróć
      </button>

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
              POTWIERDŹ ZAKUP
            </div>
            <div className="flavor" style={{ fontSize: 14, marginBottom: 12 }}>
              {confirm.pack.name}
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
                {confirm.pack.price.includes('/') ? '' : ' zł'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="cbtn ghost sm"
                style={{ flex: 1 }}
                onClick={() => setConfirm(null)}
              >
                ANULUJ
              </button>
              <button
                type="button"
                className="cbtn green sm"
                style={{ flex: 1 }}
                onClick={confirmBuy}
              >
                KUP
              </button>
            </div>
            <div style={{ marginTop: 10, fontSize: 10, color: '#7a5a4a' }}>
              Demo: brak rzeczywistej opłaty
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
