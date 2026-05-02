// World boss — server-wide raid (Phase 1+2).
//
// Layout: hero panel z bossem (sprite + HP bar + faza + slabość klasy +
// licznik hit'ów), guzik HIT, mój standing (rank + total dmg + echa),
// echo shop modal, top 50 leaderboard, historia ostatnich 20 ubitych.
// Modal result po killu lub hicie pokazuje echoesDrop + reward + unlocks.

import { useCallback, useEffect, useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { useUnlockQueue } from '@/api/unlock-queue-store';
import { GameIcon } from '@/components/game-icons';
import type { IconName } from '@/components/game-icons';
import { IcoCoin, IcoGem } from '@/components/icons';
import { GemSinkButton, HelpIcon } from '@/components/ui-common';
import { useT, tStatic , translateServerError} from '@/i18n';
import type {
  CharacterClass,
  WorldBossHitResponse,
  WorldBossPhase,
  WorldBossShopOfferDTO,
  WorldBossStartHitResponse,
} from '@grodno/shared';
import { GEM_SINK_COSTS } from '@grodno/shared';
import { TapBattleModal } from './TapBattleModal';

interface Props {
  myCharClass: CharacterClass;
  onBack: () => void;
}

const PHASE_COLORS: Record<WorldBossPhase, { bg: string; bar: string; text: string }> = {
  1: { bg: '#3a2a4a', bar: '#9a4a3a', text: '#ffd0a0' },
  2: { bg: '#2a3a5a', bar: '#5a8ad8', text: '#a8d0f0' },
  3: { bg: '#1a1a2a', bar: '#a83a3a', text: '#ff9a8a' },
};

const CLASS_LABEL_KEY: Record<
  CharacterClass,
  'class.warrior.title' | 'class.mage.title' | 'class.rogue.title'
> = {
  warrior: 'class.warrior.title',
  mage: 'class.mage.title',
  rogue: 'class.rogue.title',
};

export function ScreenWorldBoss({ myCharClass, onBack }: Props) {
  const t = useT();
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  const pushUnlocks = useUnlockQueue((s) => s.push);
  const meQuery = trpc.me.get.useQuery();
  const currentQuery = trpc.worldBoss.current.useQuery(undefined, {
    refetchInterval: 15_000,
  });
  const historyQuery = trpc.worldBoss.history.useQuery();
  const shopQuery = trpc.worldBoss.shopList.useQuery();

  const [result, setResult] = useState<WorldBossHitResponse | null>(null);
  const [battle, setBattle] = useState<WorldBossStartHitResponse | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  const startHitMut = trpc.worldBoss.startHit.useMutation({
    onSuccess: (data) => setBattle(data),
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? translateServerError(err.message) : tStatic('worldBoss.toast.hitFail'),
        accent: '#c83232',
      });
    },
  });

  const commitHitMut = trpc.worldBoss.commitHit.useMutation({
    onSuccess: (data) => {
      setResult(data);
      if (data.unlockedAchievements?.length) pushUnlocks(data.unlockedAchievements);
      void utils.worldBoss.current.invalidate();
      void utils.worldBoss.shopList.invalidate();
      void utils.me.get.invalidate();
      if (data.killed) {
        void utils.worldBoss.history.invalidate();
      }
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? translateServerError(err.message) : tStatic('worldBoss.toast.hitFail'),
        accent: '#c83232',
      });
    },
  });

  // Stabilny callback dla TapBattleModal — useCallback żeby useEffect w nim
  // nie re-uruchamiał interval'u przy każdym render parent'a.
  const handleCommit = useCallback(
    (taps: number) => {
      if (battle) {
        commitHitMut.mutate({ sessionId: battle.sessionId, taps });
        setBattle(null);
      }
    },
    [battle, commitHitMut],
  );

  const buyExtraHitMut = trpc.worldBoss.buyExtraHit.useMutation({
    onSuccess: () => {
      pushToast({ text: tStatic('worldBoss.toast.bought'), accent: '#2a4a3a' });
      void utils.worldBoss.current.invalidate();
      void utils.me.get.invalidate();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? translateServerError(err.message) : tStatic('worldBoss.toast.hitFail'),
        accent: '#c83232',
      });
    },
  });

  const shopBuyMut = trpc.worldBoss.shopBuy.useMutation({
    onSuccess: (data) => {
      pushToast({
        text: tStatic('worldBoss.shop.toast.bought').replace(
          '{n}',
          String(data.reward.amount),
        ),
        accent: '#2a4a3a',
      });
      void utils.worldBoss.shopList.invalidate();
      void utils.worldBoss.current.invalidate();
      void utils.me.get.invalidate();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? translateServerError(err.message) : tStatic('worldBoss.toast.hitFail'),
        accent: '#c83232',
      });
    },
  });

  // Po pokazaniu result modala dla niekilla — auto-zamknij po 3s. Kill modal
  // gracz zamyka sam (chce zobaczyć rank + reward).
  useEffect(() => {
    if (!result) return;
    if (result.killed) return;
    const handle = setTimeout(() => setResult(null), 2800);
    return () => clearTimeout(handle);
  }, [result]);

  if (currentQuery.isLoading) {
    return (
      <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: '#5a3a2a' }}>
        {t('worldBoss.loading')}
      </div>
    );
  }
  if (!currentQuery.data) return null;

  const { boss, myHitsToday, myHitsMax, myRank, myTotalDmg, totalHitters, leaderboard } =
    currentQuery.data;
  const palette = PHASE_COLORS[boss.phase];
  const hpPct = Math.max(0, Math.min(100, (boss.hpCurrent / boss.hpMax) * 100));
  const hitInFlight =
    startHitMut.isPending || commitHitMut.isPending || battle !== null;
  const canHit = myHitsToday < myHitsMax && !hitInFlight;
  const hitsLeft = Math.max(0, myHitsMax - myHitsToday);
  const myClassAdvantageous = boss.advantageousClasses.includes(myCharClass);

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      {/* Top bar with back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <button type="button" className="cbtn sm" onClick={onBack}>
          ←
        </button>
        <div className="h-display clean" style={{ fontSize: 18, flex: 1 }}>
          {t('worldBoss.title')}
        </div>
        <HelpIcon
          label={t('worldBoss.help.label')}
          title={t('worldBoss.help.title')}
        >
          <p style={{ margin: '0 0 8px' }}>{t('worldBoss.help.p1')}</p>
          <p style={{ margin: '0 0 8px' }}>{t('worldBoss.help.p2')}</p>
          <p style={{ margin: '0 0 8px' }}>{t('worldBoss.help.p3')}</p>
          <p style={{ margin: '0 0 8px' }}>{t('worldBoss.help.p4')}</p>
          <p style={{ margin: 0 }}>{t('worldBoss.help.p5')}</p>
        </HelpIcon>
      </div>

      {/* Boss panel */}
      <div
        className="panel"
        style={{
          padding: 14,
          marginBottom: 12,
          background: `linear-gradient(180deg, ${palette.bg} 0%, #1a0a2a 100%)`,
          color: '#fff3e0',
          textAlign: 'center',
        }}
      >
        <div className="mono" style={{ fontSize: 10, opacity: 0.7, marginBottom: 4 }}>
          {t('worldBoss.tier').replace('{n}', String(boss.tier))} ·{' '}
          {t('worldBoss.phase').replace('{n}', String(boss.phase))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 12,
              border: '3px solid #2a1810',
              background: '#e8c870',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '3px 3px 0 #2a1810',
            }}
          >
            <GameIcon name={boss.icon as IconName} size={64} />
          </div>
        </div>
        <div className="h-display" style={{ fontSize: 24, color: palette.text, marginBottom: 2 }}>
          {boss.name}
        </div>
        <div className="flavor light" style={{ fontSize: 14, marginBottom: 10, opacity: 0.9 }}>
          {boss.flavor}
        </div>

        {/* HP bar */}
        <div
          style={{
            position: 'relative',
            height: 24,
            background: '#1a0510',
            border: '2.5px solid #2a1810',
            borderRadius: 6,
            overflow: 'hidden',
            marginBottom: 6,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: `${hpPct}%`,
              background: palette.bar,
              transition: 'width 0.4s ease-out',
            }}
          />
          <div
            className="mono"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
              textShadow: '1px 1px 0 #2a1810',
            }}
          >
            {boss.hpCurrent.toLocaleString('pl-PL')} / {boss.hpMax.toLocaleString('pl-PL')}
          </div>
        </div>

        {/* Phase weakness indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: myClassAdvantageous ? '#3a7a3a' : '#5a3a3a',
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontFamily: 'Luckiest Guy, sans-serif',
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          {myClassAdvantageous
            ? t('worldBoss.weakness.match')
            : t('worldBoss.weakness.line').replace(
                '{classes}',
                boss.advantageousClasses.map((c) => t(CLASS_LABEL_KEY[c])).join(' / '),
              )}
        </div>

        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
          {t('worldBoss.hits.line').replace('{n}', String(myHitsToday)).replace('{max}', String(myHitsMax))}
        </div>

        <button
          type="button"
          className="cbtn red"
          style={{ width: '100%' }}
          disabled={!canHit}
          onClick={() => startHitMut.mutate()}
        >
          {hitInFlight
            ? t('worldBoss.btn.pending')
            : hitsLeft === 0
              ? t('worldBoss.btn.none')
              : t('worldBoss.btn.hit').replace('{n}', String(hitsLeft))}
        </button>
        {hitsLeft > 0 && !hitInFlight && (
          <div
            className="flavor light"
            style={{ fontSize: 14, color: '#ffd0a0', opacity: 0.85, marginTop: 4 }}
          >
            {t('worldBoss.btn.hit.sub')}
          </div>
        )}
        {hitsLeft === 0 && (
          <div style={{ marginTop: 8 }}>
            <GemSinkButton
              label={t('worldBoss.btn.buy')}
              cost={GEM_SINK_COSTS.extraWorldBossHit}
              playerGems={meQuery.data?.gems ?? 0}
              pending={buyExtraHitMut.isPending}
              onClick={() => buyExtraHitMut.mutate()}
            />
          </div>
        )}
      </div>

      {/* My standing — rank + dmg + echa */}
      <div
        className="panel"
        style={{ padding: 10, marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center' }}
      >
        <div
          className="h-display clean"
          style={{
            fontSize: 22,
            color: myRank && myRank <= 10 ? '#c8a648' : '#5a3a2a',
            minWidth: 50,
            textAlign: 'center',
          }}
        >
          {myRank ? `#${myRank}` : '—'}
        </div>
        <div style={{ flex: 1 }}>
          <div className="h-title" style={{ fontSize: 13 }}>
            {t('worldBoss.standing.title')}
          </div>
          <div className="mono" style={{ fontSize: 11, color: '#7a6040' }}>
            {t('worldBoss.standing.line')
              .replace('{dmg}', myTotalDmg.toLocaleString('pl-PL'))
              .replace('{total}', totalHitters.toLocaleString('pl-PL'))}
          </div>
        </div>
        <div
          className="pip"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: '#3a2a4a',
            color: '#ffd0a0',
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 12,
            fontFamily: 'Luckiest Guy, sans-serif',
            letterSpacing: 0.5,
          }}
        >
          <GameIcon name="bolt" size={12} />
          {(shopQuery.data?.myEchoes ?? 0).toLocaleString('pl-PL')}
        </div>
      </div>

      {/* Echo shop button */}
      <button
        type="button"
        className="cbtn"
        style={{ width: '100%', marginBottom: 12, background: '#5a3a8a', color: '#ffd0a0' }}
        onClick={() => setShopOpen(true)}
      >
        {t('worldBoss.shop.open')}
      </button>

      {/* Leaderboard collapsible */}
      <button
        type="button"
        className="cbtn sm"
        style={{ width: '100%', marginBottom: 6 }}
        onClick={() => setShowLeaderboard((v) => !v)}
      >
        {showLeaderboard ? t('worldBoss.lb.hide') : t('worldBoss.lb.show')}
      </button>
      {showLeaderboard && leaderboard.length > 0 && (
        <div className="panel" style={{ padding: 4, marginBottom: 12 }}>
          {leaderboard.map((l, i) => (
            <div
              key={l.characterId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                borderBottom: i < leaderboard.length - 1 ? '1.5px dashed #c8b890' : 'none',
                background: i < 3 ? '#fff7e0' : 'transparent',
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 12,
                  opacity: i < 3 ? 1 : 0.6,
                  color: i === 0 ? '#c8a648' : i < 3 ? '#5a3a2a' : '#7a6040',
                  minWidth: 26,
                  textAlign: 'center',
                  fontWeight: i < 3 ? 700 : 400,
                }}
              >
                #{i + 1}
              </span>
              <span className="h-title" style={{ fontSize: 13, flex: 1 }}>
                {l.name}
              </span>
              <span className="mono" style={{ fontSize: 11, color: '#7a6040' }}>
                {l.totalDmg.toLocaleString('pl-PL')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* History collapsible */}
      <button
        type="button"
        className="cbtn sm"
        style={{ width: '100%', marginBottom: 6 }}
        onClick={() => setShowHistory((v) => !v)}
      >
        {showHistory ? t('worldBoss.hist.hide') : t('worldBoss.hist.show')}
      </button>
      {showHistory && historyQuery.data && historyQuery.data.entries.length === 0 && (
        <div
          className="panel"
          style={{
            padding: 14,
            marginBottom: 12,
            textAlign: 'center',
            fontSize: 13,
            color: '#5a3a2a',
            fontStyle: 'italic',
          }}
        >
          {t('worldBoss.hist.empty')}
        </div>
      )}
      {showHistory && historyQuery.data && historyQuery.data.entries.length > 0 && (
        <div className="panel" style={{ padding: 4, marginBottom: 12 }}>
          {historyQuery.data.entries.map((e, i, arr) => (
            <div
              key={e.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                borderBottom: i < arr.length - 1 ? '1.5px dashed #c8b890' : 'none',
              }}
            >
              <GameIcon name={e.bossIcon as IconName} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="h-title" style={{ fontSize: 12 }}>
                  {e.bossName}{' '}
                  <span className="mono" style={{ fontSize: 13, opacity: 0.7 }}>
                    T{e.tier}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: '#5a3a2a' }}>
                  {e.killingBlowCharName
                    ? t('worldBoss.hist.kb').replace('{name}', e.killingBlowCharName)
                    : ''}
                </div>
              </div>
              {e.myRank && (
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: e.myRank <= 10 ? '#c8a648' : '#7a6040',
                    fontWeight: e.myRank <= 10 ? 700 : 400,
                  }}
                >
                  #{e.myRank}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tap-fury mini-game modal — otwierany po startHit. */}
      {battle && (
        <TapBattleModal
          bossName={boss.name}
          bossIcon={boss.icon as IconName}
          bossFlavor={boss.flavor}
          durationMs={battle.durationMs}
          minTaps={battle.minTaps}
          maxTaps={battle.maxTaps}
          onCommit={handleCommit}
        />
      )}

      {/* Hit result modal */}
      {result && <HitResultModal result={result} onClose={() => setResult(null)} />}

      {/* Echo shop modal */}
      {shopOpen && (
        <ShopModal
          offers={shopQuery.data?.offers ?? []}
          myEchoes={shopQuery.data?.myEchoes ?? 0}
          buyPending={shopBuyMut.isPending ? shopBuyMut.variables?.offerSlug ?? null : null}
          onBuy={(slug) => shopBuyMut.mutate({ offerSlug: slug })}
          onClose={() => setShopOpen(false)}
        />
      )}
    </div>
  );
}

function ShopModal({
  offers,
  myEchoes,
  buyPending,
  onBuy,
  onClose,
}: {
  offers: readonly WorldBossShopOfferDTO[];
  myEchoes: number;
  buyPending: string | null;
  onBuy: (slug: string) => void;
  onClose: () => void;
}) {
  const t = useT();
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,5,30,0.75)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'modal-fade-in 0.18s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="panel"
        onClick={(ev) => ev.stopPropagation()}
        style={{
          padding: 14,
          background: '#fff7e0',
          maxWidth: 380,
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div className="h-display clean" style={{ fontSize: 18, flex: 1 }}>
            {t('worldBoss.shop.title')}
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: '#3a2a4a',
              color: '#ffd0a0',
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontFamily: 'Luckiest Guy, sans-serif',
            }}
          >
            <GameIcon name="bolt" size={12} /> {myEchoes.toLocaleString('pl-PL')}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 11, color: '#7a6040', fontStyle: 'italic', flex: 1 }}>
            {t('worldBoss.shop.flavor')}
          </div>
          <HelpIcon
            label={t('worldBoss.shop.help.label')}
            title={t('worldBoss.shop.help.title')}
          >
            <p style={{ margin: '0 0 8px' }}>{t('worldBoss.shop.help.p1')}</p>
            <p style={{ margin: '0 0 8px' }}>{t('worldBoss.shop.help.p2')}</p>
            <p style={{ margin: '0 0 8px' }}>{t('worldBoss.shop.help.p3')}</p>
            <p style={{ margin: 0, fontStyle: 'italic' }}>{t('worldBoss.shop.help.p4')}</p>
          </HelpIcon>
        </div>
        {offers.map((offer) => {
          const titleKey = `${offer.i18nKey}.title`;
          const descKey = `${offer.i18nKey}.desc`;
          const canAfford = myEchoes >= offer.cost;
          const pending = buyPending === offer.slug;
          // i18n keys nie są typowane (catalog i18nKeys = dynamic) — fallback do
          // raw text z reward shape żeby nigdy nie pokazać surowego klucza.
          const title = (t as (k: string) => string)(titleKey);
          const desc = (t as (k: string) => string)(descKey);
          return (
            <div
              key={offer.slug}
              className="panel-tight"
              style={{
                padding: 10,
                marginBottom: 8,
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                background: '#f3ead9',
                opacity: canAfford ? 1 : 0.55,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: '#e8c870',
                  border: '2px solid #2a1810',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <GameIcon name={offer.icon as IconName} size={28} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="h-title" style={{ fontSize: 13 }}>
                  {title.startsWith(titleKey) ? offer.slug : title}
                </div>
                <div style={{ fontSize: 10, color: '#5a3a2a' }}>
                  {desc.startsWith(descKey) ? '' : desc}
                </div>
              </div>
              <button
                type="button"
                className="cbtn sm"
                style={{
                  background: canAfford ? '#5a3a8a' : '#8a8a8a',
                  color: '#ffd0a0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                disabled={!canAfford || pending}
                onClick={() => onBuy(offer.slug)}
              >
                {pending ? '…' : (
                  <>
                    <GameIcon name="bolt" size={12} />
                    <span className="mono">{offer.cost}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
        <button type="button" className="cbtn" style={{ width: '100%', marginTop: 4 }} onClick={onClose}>
          {t('worldBoss.shop.close')}
        </button>
      </div>
    </div>
  );
}

function HitResultModal({
  result,
  onClose,
}: {
  result: WorldBossHitResponse;
  onClose: () => void;
}) {
  const t = useT();
  const phaseLabel = t('worldBoss.modal.phase').replace('{n}', String(result.phaseAtHit));

  // Refund-path — boss padł podczas Furii. Soft-info, jednoprzyciskowy modal.
  if (result.bossAlreadyDead) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(20,5,30,0.7)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          animation: 'modal-fade-in 0.18s ease-out',
        }}
        onClick={onClose}
      >
        <div
          className="panel"
          onClick={(ev) => ev.stopPropagation()}
          style={{
            padding: 20,
            background: '#fff7e0',
            maxWidth: 360,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <div
            className="h-display"
            style={{ fontSize: 22, color: '#5a3a2a', marginBottom: 8 }}
          >
            Spóźniłeś się o włos.
          </div>
          <div style={{ fontSize: 13, color: '#5a3a2a', marginBottom: 14 }}>
            {t('worldBoss.modal.bossAlreadyDead')}
          </div>
          <button type="button" className="cbtn green" onClick={onClose} style={{ width: '100%' }}>
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,5,30,0.7)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'modal-fade-in 0.18s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="panel"
        onClick={(ev) => ev.stopPropagation()}
        style={{
          padding: 20,
          background: '#fff7e0',
          maxWidth: 360,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {result.killed ? (
          <>
            <div className="h-display" style={{ fontSize: 26, color: '#c83232', marginBottom: 6 }}>
              {result.isKiller ? t('worldBoss.modal.killer') : t('worldBoss.modal.killed')}
            </div>
            <div style={{ fontSize: 13, color: '#5a3a2a', marginBottom: 10 }}>
              {t('worldBoss.modal.killBlurb').replace('{rank}', String(result.finalRank ?? '?'))}
            </div>
          </>
        ) : (
          <>
            <div className="h-display" style={{ fontSize: 22, color: '#2e5020', marginBottom: 6 }}>
              {t('worldBoss.modal.hitTitle')}
            </div>
            <div className="mono" style={{ fontSize: 11, color: '#7a6040', marginBottom: 6 }}>
              {phaseLabel}
              {result.phaseMatched && ` · ${t('worldBoss.modal.phaseBonus')}`}
            </div>
          </>
        )}

        <div
          className="h-display"
          style={{ fontSize: 32, color: '#c83232', margin: '6px 0' }}
        >
          −{result.dmg.toLocaleString('pl-PL')}
        </div>

        {result.taps != null && result.tapMultiplier != null && (
          <div
            className="flavor light"
            style={{ fontSize: 14, color: '#7a6040', marginBottom: 6 }}
          >
            {t('worldBoss.modal.tapBreakdown')
              .replace('{taps}', String(result.taps))
              .replace('{mult}', `${result.tapMultiplier.toFixed(2)}×`)}
          </div>
        )}

        {result.echoesDrop > 0 && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: '#3a2a4a',
              color: '#ffd0a0',
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontFamily: 'Luckiest Guy, sans-serif',
              marginBottom: 10,
            }}
          >
            <GameIcon name="bolt" size={12} />
            +{result.echoesDrop} {t('worldBoss.modal.echoes')}
          </div>
        )}

        {result.killed && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              padding: '10px 0',
              borderTop: '1.5px dashed #c8b890',
              borderBottom: '1.5px dashed #c8b890',
              marginBottom: 12,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <IcoCoin s={14} />
              <span className="mono">+{result.rewardGold.toLocaleString('pl-PL')}</span>
            </span>
            {result.rewardGems > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <IcoGem s={14} />
                <span className="mono">+{result.rewardGems}</span>
              </span>
            )}
          </div>
        )}

        {result.killed && result.nextBoss && (
          <div style={{ fontSize: 11, color: '#5a3a2a', marginBottom: 10 }}>
            {t('worldBoss.modal.next')
              .replace('{name}', result.nextBoss.name)
              .replace('{tier}', String(result.nextBoss.tier))}
          </div>
        )}

        <button type="button" className="cbtn green" onClick={onClose} style={{ width: '100%' }}>
          OK
        </button>
      </div>
    </div>
  );
}
