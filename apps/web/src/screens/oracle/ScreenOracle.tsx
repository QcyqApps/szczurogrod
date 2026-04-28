// Wróżka Hanusia — Oracle UI.
//
// Flow: gracz widzi 3 odwrócone karty. Klika jedną → mutation leci, ta karta
// flipuje z animacją 3D, pokazuje wygraną. Pozostałe 2 wygaszają się. „Dalej"
// reset'uje karty do ponownego pulla (jeśli dostępny).
//
// Wybór karty jest cosmetic — server decyduje o nagrodzie. Illusion of
// choice typowy dla gambling mini-games (scratch-card psychology).

import { useEffect, useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { IcoClock, IcoCoin, IcoGem } from '@/components/icons';
import { GameIcon } from '@/components/game-icons';
import { LevelUpModal } from '@/components/ui-common';
import { useT, tStatic, useContentT } from '@/i18n';
import type { IconName, OraclePullResponse } from '@grodno/shared';

export interface ScreenOracleProps {
  onBack: () => void;
}

const RARITY_COLOR: Record<string, string> = {
  common: '#a8a890',
  rare: '#4a7cff',
  epic: '#a04ef0',
  legendary: '#e07820',
};

type CardSlot = 0 | 1 | 2;

export function ScreenOracle({ onBack }: ScreenOracleProps) {
  const t = useT();
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  const statusQuery = trpc.oracle.status.useQuery();
  const meQuery = trpc.me.get.useQuery();

  /** Karta która została kliknięta — ma się obrócić. Null = żadna jeszcze. */
  const [pickedCard, setPickedCard] = useState<CardSlot | null>(null);
  const [result, setResult] = useState<OraclePullResponse | null>(null);
  const [levelUpShown, setLevelUpShown] = useState<OraclePullResponse['levelUp']>(null);
  /**
   * Dwuetapowe potwierdzenie dla trybu płatnego — pierwsze kliknięcie karty
   * gdy darmowy wyczerpany: nie rolluje, tylko arm'uje potwierdzenie
   * (pokazuje banner „Kosztuje 3💎 — kliknij ponownie dowolną kartę").
   * Drugi klik faktycznie odpala mutation. Chroni przed cichym leakiem
   * gemów — user nie może przypadkowo zapłacić gdy myślał że gra darmowa.
   */
  const [gemArmed, setGemArmed] = useState(false);

  const pullMut = trpc.oracle.pull.useMutation({
    onSuccess: (data) => {
      setResult(data);
      if (data.levelUp) setLevelUpShown(data.levelUp);
    },
    onError: (err) => {
      setPickedCard(null);
      pushToast({
        text: err instanceof TRPCClientError ? err.message : t('oracle.declined'),
        accent: '#c83232',
      });
    },
  });

  const status = statusQuery.data;
  const gems = meQuery.data?.gems ?? 0;

  async function handleCardClick(slot: CardSlot) {
    if (pickedCard !== null || pullMut.isPending) return;
    if (!status) return;

    const useFree = status.freeAvailable;

    // Tryb płatny — wymaga dwukliku potwierdzenia, żeby nie leakować gemów
    // przez pomyłkę (user widzi „Darmowy wyczerpany", klika kartę by zobaczyć
    // co się stanie, gemy znikają bez ostrzeżenia).
    if (!useFree) {
      if (gems < status.extraCostGems) {
        pushToast({
          text: t('oracle.cost.noGems').replace('{n}', String(status.extraCostGems)),
          accent: '#c83232',
        });
        return;
      }
      if (!gemArmed) {
        setGemArmed(true);
        pushToast({
          text: t('oracle.cost.confirm').replace('{n}', String(status.extraCostGems)),
          accent: '#5a3a8a',
        });
        return;
      }
    }

    setPickedCard(slot);
    try {
      await pullMut.mutateAsync({ useFree });
    } finally {
      setGemArmed(false);
      void utils.oracle.status.invalidate();
      void utils.me.get.invalidate();
      void utils.inventory.list.invalidate();
    }
  }

  function reset() {
    setPickedCard(null);
    setResult(null);
    setGemArmed(false);
  }

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div
        className="panel"
        style={{
          padding: 14,
          marginBottom: 10,
          background: 'linear-gradient(180deg, #2a1a4a 0%, #0a0014 100%)',
          color: '#f3ead9',
          textAlign: 'center',
        }}
      >
        <div className="h-display" style={{ fontSize: 22, color: '#c8a0ff' }}>
          {t('oracle.title')}
        </div>
        <div className="flavor light" style={{ fontSize: 14, marginTop: 4 }}>
          {t('oracle.flavor')}
        </div>
      </div>

      {/* Karty */}
      <div
        className="panel"
        style={{
          padding: 16,
          marginBottom: 10,
          textAlign: 'center',
          background: 'linear-gradient(180deg, #1a0a2a 0%, #0a0014 100%)',
          color: '#f3ead9',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginBottom: 12,
            perspective: '800px',
          }}
        >
          {([0, 1, 2] as const).map((slot) => {
            const isPicked = pickedCard === slot;
            const showReward = isPicked && result !== null;
            const faded = pickedCard !== null && !isPicked;
            // Karta klikalna TYLKO gdy jest jakaś opcja (free albo stać na gemy).
            // Inaczej pozornie klikalny button tworzyłby wrażenie że coś się
            // stanie — lepiej wyłączyć i pokazać bannerem czemu.
            const canAfford =
              status !== undefined &&
              (status.freeAvailable || gems >= status.extraCostGems);
            const interactive = canAfford && pickedCard === null;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => void handleCardClick(slot)}
                disabled={!interactive || pullMut.isPending}
                style={{
                  position: 'relative',
                  aspectRatio: '2 / 3',
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  cursor: interactive ? 'pointer' : 'not-allowed',
                  opacity: faded ? 0.35 : canAfford ? 1 : 0.55,
                  transition: 'opacity 0.6s ease-out 0.5s',
                  transformStyle: 'preserve-3d',
                  transform: showReward ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transitionProperty: 'transform, opacity',
                  transitionDuration: '0.6s',
                  transitionTimingFunction: 'ease-in-out',
                }}
              >
                {/* Face-down */}
                <div style={cardFaceStyle(false)}>
                  <CardBackArt />
                </div>
                {/* Face-up (reward) */}
                <div style={cardFaceStyle(true)}>
                  {showReward && result ? <CardRewardArt reward={result} /> : null}
                </div>
              </button>
            );
          })}
        </div>

        {!status ? (
          <div style={{ fontSize: 13 }}>{t('oracle.shuffling')}</div>
        ) : result ? (
          <div>
            <div className="h-title" style={{ fontSize: 15, color: '#ffc830', marginBottom: 6 }}>
              {rewardHeadline(result)}
            </div>
            <div
              className="flavor light"
              style={{ fontSize: 15, lineHeight: 1.25, marginBottom: 10 }}
            >
              {result.flavor}
            </div>
            <button type="button" className="cbtn lg" style={{ minWidth: 140 }} onClick={reset}>
              {t('oracle.next')}
            </button>
          </div>
        ) : (
          <CostBanner
            status={status}
            gems={gems}
            gemArmed={gemArmed}
          />
        )}
      </div>

      {/* Loot table */}
      <div className="panel" style={{ padding: 12, marginBottom: 10 }}>
        <div className="h-title" style={{ fontSize: 14, marginBottom: 8 }}>
          {t('oracle.lootTable')}
        </div>
        <LootRow pct="60%" label={t('oracle.loot.gold')} />
        <LootRow pct="20%" label={t('oracle.loot.xp')} />
        <LootRow pct="10%" label={t('oracle.loot.potion')} />
        <LootRow pct="7%" label={t('oracle.loot.common')} />
        <LootRow pct="3%" label={t('oracle.loot.rare')} />
        <div style={{ fontSize: 13, color: '#5a3a2a', marginTop: 6, fontStyle: 'italic' }}>
          {t('oracle.loot.always')}
        </div>
      </div>

      <button type="button" className="cbtn ghost" style={{ width: '100%' }} onClick={onBack}>
        {t('oracle.back')}
      </button>

      {levelUpShown && (
        <LevelUpModal
          info={levelUpShown}
          onClose={() => setLevelUpShown(null)}
        />
      )}
    </div>
  );
}

// ===========================================================================
// Karta — face + back.
// ===========================================================================

function cardFaceStyle(isBack: boolean): React.CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    borderRadius: 10,
    border: '3px solid #2a1810',
    boxShadow: '3px 3px 0 #2a1810',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    transform: isBack ? 'rotateY(180deg)' : 'rotateY(0deg)',
    background: isBack ? '#f3ead9' : 'linear-gradient(135deg, #3a1a5a 0%, #1a0a2a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };
}

function CostBanner({
  status,
  gems,
  gemArmed,
}: {
  status: { freeAvailable: boolean; extraCostGems: number; nextFreeAt: number };
  gems: number;
  gemArmed: boolean;
}) {
  const t = useT();
  if (status.freeAvailable) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          background: '#2a4a3a',
          border: '2.5px solid #ffc830',
          borderRadius: 999,
          fontSize: 13,
          color: '#ffc830',
          fontFamily: 'Luckiest Guy, sans-serif',
          letterSpacing: 0.4,
        }}
      >
        {t('oracle.banner.free')}
      </div>
    );
  }
  const canAfford = gems >= status.extraCostGems;
  if (!canAfford) {
    return (
      <div style={{ color: '#f3a0a0', fontSize: 13 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: '#3a1a1a',
            border: '2px solid #c83232',
            borderRadius: 8,
            marginBottom: 6,
          }}
        >
          {t('oracle.banner.noGems').replace('{n}', String(status.extraCostGems)).replace('{have}', String(gems))}
        </div>
        <div style={{ fontSize: 13, opacity: 0.75, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <IcoClock s={10} /> <Countdown target={status.nextFreeAt} />
        </div>
      </div>
    );
  }
  // Gemy dostępne — baner z kosztem + stan arm'ingu.
  return (
    <div>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          background: gemArmed ? '#5a2a5a' : '#2a1a3a',
          border: `2.5px solid ${gemArmed ? '#ffc830' : '#8a6a8a'}`,
          borderRadius: 999,
          fontSize: 13,
          color: gemArmed ? '#ffc830' : '#e8dcb9',
          fontFamily: 'Luckiest Guy, sans-serif',
          letterSpacing: 0.4,
        }}
      >
        {gemArmed ? t('oracle.banner.confirm') : t('oracle.banner.cost')}
        <IcoGem s={14} />
        {status.extraCostGems}
      </div>
      <div
        style={{
          fontSize: 13,
          opacity: 0.75,
          marginTop: 6,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <IcoClock s={10} /> <Countdown target={status.nextFreeAt} />
      </div>
    </div>
  );
}

function CardBackArt() {
  // Hand-drawn "mistic eye" — złote koło z pionową źrenicą, mini gwiazdki.
  return (
    <svg viewBox="0 0 80 120" width="100%" height="100%" style={{ display: 'block' }}>
      {[
        [14, 18, 1.2],
        [64, 22, 1],
        [20, 96, 1],
        [60, 102, 0.9],
        [38, 10, 0.8],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#ffc830" opacity="0.85" />
      ))}
      {/* Oko */}
      <ellipse
        cx="40"
        cy="60"
        rx="22"
        ry="14"
        fill="#1a0a2a"
        stroke="#ffc830"
        strokeWidth="2.5"
      />
      <circle cx="40" cy="60" r="9" fill="#ffc830" />
      <ellipse cx="40" cy="60" rx="2.5" ry="7" fill="#1a0a2a" />
      {/* Rzęsy */}
      <line x1="18" y1="58" x2="12" y2="55" stroke="#ffc830" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="62" y1="58" x2="68" y2="55" stroke="#ffc830" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="40" y1="42" x2="40" y2="34" stroke="#ffc830" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="40" y1="78" x2="40" y2="86" stroke="#ffc830" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CardRewardArt({ reward }: { reward: OraclePullResponse }) {
  const tc = useContentT();
  if (reward.kind === 'gold') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: '#2a1810',
        }}
      >
        <IcoCoin s={42} />
        <div
          className="h-title"
          style={{ fontSize: 18, fontFamily: 'Luckiest Guy, sans-serif' }}
        >
          +{reward.gold}
        </div>
        <div style={{ fontSize: 10 }}>{tStatic('oracle.gold.label')}</div>
      </div>
    );
  }
  if (reward.kind === 'xp') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: '#2a1810',
        }}
      >
        <GameIcon name="scroll" size={42} />
        <div
          className="h-title"
          style={{ fontSize: 18, fontFamily: 'Luckiest Guy, sans-serif' }}
        >
          +{reward.xp}
        </div>
        <div style={{ fontSize: 10 }}>{tStatic('oracle.xp.label')}</div>
      </div>
    );
  }
  if (reward.item) {
    const color = RARITY_COLOR[reward.item.rarity] ?? '#2a1810';
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: '#2a1810',
          padding: 6,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            background: color + '22',
            border: `2.5px solid ${color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <GameIcon name={reward.item.icon as IconName} size={36} />
        </div>
        <div
          className="h-title"
          style={{
            fontSize: 10,
            lineHeight: 1.1,
            maxWidth: 70,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={tc.itemName(reward.item.name, reward.item.name)}
        >
          {tc.itemName(reward.item.name, reward.item.name)}
        </div>
        <div
          style={{
            fontSize: 8,
            color,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          {reward.item.rarity}
        </div>
      </div>
    );
  }
  return null;
}

function rewardHeadline(r: OraclePullResponse): string {
  if (r.kind === 'gold') return tStatic('oracle.headline.gold').replace('{n}', String(r.gold));
  if (r.kind === 'xp') return tStatic('oracle.headline.xp').replace('{n}', String(r.xp));
  if (r.kind === 'potion') return tStatic('oracle.headline.potion');
  if (r.kind === 'common_item') return tStatic('oracle.headline.item');
  return tStatic('oracle.headline.rare');
}

function LootRow({ pct, label }: { pct: string; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 0',
        borderBottom: '1px dashed #c8b890',
        fontSize: 13,
      }}
    >
      <span
        className="mono"
        style={{
          minWidth: 42,
          textAlign: 'center',
          background: '#e8dcb9',
          borderRadius: 6,
          padding: '2px 4px',
          border: '1.5px solid #2a1810',
          fontSize: 12,
        }}
      >
        {pct}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
    </div>
  );
}

function Countdown({ target }: { target: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return (
    <span>
      {tStatic('oracle.next.free')}<b className="mono">{h}h:{String(m).padStart(2, '0')}m</b>
    </span>
  );
}
