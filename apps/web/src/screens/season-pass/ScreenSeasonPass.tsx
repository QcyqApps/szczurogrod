// Season Pass UI — tier grid z dwoma trackami (free + premium).
//
// Layout: u góry pass z XP bar + currentTier/30 + CTA „Kup Premium" gdy nie
// masz. Potem scrollable lista 30 tierów; każdy wiersz ma free i premium
// reward side-by-side. Klik na tier → claim (jeśli dostępny) albo modal
// z info „potrzebujesz premium" / „za mało XP".

import { useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { useUnlockQueue } from '@/api/unlock-queue-store';
import { GameIcon } from '@/components/game-icons';
import type { IconName } from '@/components/game-icons';
import { IcoCoin, IcoGem, IcoKey } from '@/components/icons';
import { GemSinkButton, LevelUpModal } from '@/components/ui-common';
import { useT , translateServerError} from '@/i18n';
import type {
  SeasonPassClaimResponse,
  SeasonPassTierReward,
} from '@grodno/shared';

export interface ScreenSeasonPassProps {
  onBack: () => void;
}

const RARITY_COLOR: Record<string, string> = {
  common: '#a8a890',
  rare: '#4a7cff',
  epic: '#a04ef0',
  legendary: '#e07820',
};

const MILESTONE_TIERS = new Set([5, 10, 15, 20, 25, 30]);

export function ScreenSeasonPass({ onBack }: ScreenSeasonPassProps) {
  const t = useT();
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  const pushUnlocks = useUnlockQueue((s) => s.push);
  void pushUnlocks; // reserved (no achievement unlocks in claim for now)
  const statusQuery = trpc.seasonPass.status.useQuery();
  const [levelUpShown, setLevelUpShown] =
    useState<SeasonPassClaimResponse['levelUp']>(null);

  const claimMut = trpc.seasonPass.claim.useMutation({
    onSuccess: (data) => {
      if (data.levelUp) setLevelUpShown(data.levelUp);
      pushToast({
        text: t('seasonPass.toast.claimed'),
        accent: '#4a7c3a',
      });
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? translateServerError(err.message) : t('seasonPass.toast.claimFailed'),
        accent: '#c83232',
      });
    },
    onSettled: () => {
      void utils.seasonPass.status.invalidate();
      void utils.me.get.invalidate();
      void utils.inventory.list.invalidate();
    },
  });

  const buyPremiumMut = trpc.seasonPass.buyPremium.useMutation({
    onSuccess: () => {
      pushToast({ text: t('seasonPass.toast.premiumActive'), accent: '#4a7c3a' });
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? translateServerError(err.message) : t('seasonPass.toast.premiumFailed'),
        accent: '#c83232',
      });
    },
    onSettled: () => {
      void utils.seasonPass.status.invalidate();
      void utils.me.get.invalidate();
    },
  });

  const status = statusQuery.data;
  const meQuery = trpc.me.get.useQuery();
  const playerGems = meQuery.data?.gems ?? 0;

  function isClaimed(bitmap: number, tier: number): boolean {
    return (bitmap & (1 << (tier - 1))) !== 0;
  }

  function handleClaim(tier: number, track: 'free' | 'premium') {
    if (claimMut.isPending) return;
    claimMut.mutate({ tier, track });
  }

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div
        className="panel"
        style={{
          padding: 14,
          marginBottom: 10,
          background: 'linear-gradient(180deg, #3a2a1a 0%, #1a0a14 100%)',
          color: '#f3ead9',
          textAlign: 'center',
        }}
      >
        <div className="h-display" style={{ fontSize: 22, color: '#ffc830' }}>
          {t('seasonPass.title')}
        </div>
        {status && (
          <>
            <div className="flavor light" style={{ fontSize: 14, marginTop: 4 }}>
              {t('seasonPass.season.line').replace('{n}', String(status.seasonStart))}
            </div>
            {/* XP bar do następnego tiera */}
            <XpBar xp={status.xp} currentTier={status.currentTier} />
          </>
        )}
      </div>

      {/* Premium CTA gdy nie wykupiony */}
      {status && !status.isPremium && (
        <div
          className="panel"
          style={{
            padding: 12,
            marginBottom: 10,
            background: '#2a1a3a',
            color: '#f3ead9',
            textAlign: 'center',
            border: '3px solid #ffc830',
          }}
        >
          <div className="h-title" style={{ fontSize: 14, color: '#ffc830', marginBottom: 4 }}>
            {t('seasonPass.premium.heading')}
          </div>
          <div style={{ fontSize: 13, marginBottom: 10, opacity: 0.9, lineHeight: 1.3 }}>
            {t('seasonPass.premium.desc')}
          </div>
          <GemSinkButton
            label={t('seasonPass.premium.cta')}
            cost={status.premiumCostGems}
            playerGems={playerGems}
            pending={buyPremiumMut.isPending}
            onClick={() => buyPremiumMut.mutate()}
            disabledReason={t('seasonPass.premium.disabledReason')}
            variant="primary"
            size="md"
          />
        </div>
      )}

      {/* Lista tierów */}
      {!status ? (
        <div className="panel" style={{ padding: 14, textAlign: 'center', fontSize: 13 }}>
          {t('seasonPass.loading')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {status.freeTrack.map((free, idx) => {
            const tier = idx + 1;
            const prem = status.premiumTrack[idx]!;
            const milestone = MILESTONE_TIERS.has(tier);
            const unlocked = status.currentTier >= tier;
            const freeClaimed = isClaimed(status.claimedFreeBitmap, tier);
            const premClaimed = isClaimed(status.claimedPremiumBitmap, tier);
            return (
              <div
                key={tier}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 1fr',
                  gap: 8,
                  padding: 8,
                  border: `2px solid ${milestone ? '#c83232' : '#2a1810'}`,
                  borderRadius: 8,
                  background: milestone ? '#f0e0b0' : '#f3ead9',
                  opacity: unlocked ? 1 : 0.55,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Luckiest Guy, sans-serif',
                    fontSize: 18,
                    color: milestone ? '#c83232' : '#2a1810',
                    background: unlocked ? '#ffc830' : '#c8c0a0',
                    borderRadius: 4,
                  }}
                >
                  {tier}
                </div>
                <TierCell
                  reward={free}
                  unlocked={unlocked}
                  claimed={freeClaimed}
                  disabled={!unlocked}
                  onClaim={() => handleClaim(tier, 'free')}
                  pending={
                    claimMut.isPending &&
                    claimMut.variables?.tier === tier &&
                    claimMut.variables?.track === 'free'
                  }
                  label={t('seasonPass.tier.free')}
                />
                <TierCell
                  reward={prem}
                  unlocked={unlocked}
                  claimed={premClaimed}
                  disabled={!unlocked || !status.isPremium}
                  disabledHint={
                    !status.isPremium
                      ? t('seasonPass.tier.requirePremium')
                      : !unlocked
                        ? t('seasonPass.tier.notEnoughXp')
                        : undefined
                  }
                  onClaim={() => handleClaim(tier, 'premium')}
                  pending={
                    claimMut.isPending &&
                    claimMut.variables?.tier === tier &&
                    claimMut.variables?.track === 'premium'
                  }
                  label={t('seasonPass.tier.premium')}
                  isPremium
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Progress hint */}
      <div className="panel" style={{ padding: 10, marginBottom: 10, fontSize: 13 }}>
        <div className="h-title" style={{ fontSize: 13, marginBottom: 4 }}>
          {t('seasonPass.howTo.heading')}
        </div>
        <div style={{ color: '#5a3a2a', lineHeight: 1.35 }}>
          {t('seasonPass.howTo.body')}
        </div>
      </div>

      <button type="button" className="cbtn ghost" style={{ width: '100%' }} onClick={onBack}>
        {t('seasonPass.back')}
      </button>

      {levelUpShown && (
        <LevelUpModal info={levelUpShown} onClose={() => setLevelUpShown(null)} />
      )}
    </div>
  );
}

function XpBar({ xp, currentTier }: { xp: number; currentTier: number }) {
  const t = useT();
  const nextTier = Math.min(30, currentTier + 1);
  const currentBase = currentTier * 10;
  const nextBase = nextTier * 10;
  const progress =
    nextBase === currentBase ? 1 : Math.min(1, (xp - currentBase) / (nextBase - currentBase));
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, marginBottom: 4 }}>
        {t('seasonPass.bar.tierLine')} <b className="mono">{currentTier}</b> / 30 · XP{' '}
        <b className="mono">{xp}</b>
      </div>
      <div
        style={{
          width: '100%',
          height: 10,
          background: '#1a0a14',
          border: '2px solid #2a1810',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #ffc830, #d48020)',
            transition: 'width 0.4s ease-out',
          }}
        />
      </div>
    </div>
  );
}

function TierCell({
  reward,
  unlocked,
  claimed,
  disabled,
  disabledHint,
  onClaim,
  pending,
  label,
  isPremium = false,
}: {
  reward: SeasonPassTierReward;
  unlocked: boolean;
  claimed: boolean;
  disabled: boolean;
  disabledHint?: string;
  onClaim: () => void;
  pending: boolean;
  label: string;
  isPremium?: boolean;
}) {
  const t = useT();
  const bg = claimed ? '#d8e0c8' : isPremium ? '#ffe4b0' : '#f3ead9';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 6,
        border: `2px solid ${isPremium ? '#c89040' : '#8a6a4a'}`,
        borderRadius: 6,
        background: bg,
        position: 'relative',
      }}
    >
      <div
        style={{
          fontFamily: 'Luckiest Guy, sans-serif',
          fontSize: 12,
          letterSpacing: 0.4,
          color: isPremium ? '#8a4a1a' : '#5a3a2a',
        }}
      >
        {label}
      </div>
      <RewardSummary reward={reward} />
      {claimed ? (
        <span
          style={{
            fontFamily: 'Luckiest Guy, sans-serif',
            fontSize: 13,
            color: '#4a7c3a',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <GameIcon name="check" size={14} /> {t('seasonPass.tier.claimed')}
        </span>
      ) : unlocked && !disabled ? (
        <button
          type="button"
          onClick={onClaim}
          disabled={pending}
          style={{
            padding: '5px 10px',
            border: '2px solid #2a1810',
            borderRadius: 6,
            background: '#ffc830',
            cursor: pending ? 'wait' : 'pointer',
            fontFamily: 'Luckiest Guy, sans-serif',
            fontSize: 13,
            boxShadow: pending ? 'none' : '1.5px 1.5px 0 #2a1810',
          }}
        >
          {t('seasonPass.tier.claim')}
        </button>
      ) : (
        <span
          style={{
            fontSize: 13,
            color: '#8a6a4a',
            fontStyle: 'italic',
          }}
        >
          {disabledHint ?? t('seasonPass.tier.notYet')}
        </span>
      )}
    </div>
  );
}

function RewardSummary({ reward }: { reward: SeasonPassTierReward }) {
  const pills: React.ReactNode[] = [];
  if (reward.gold && reward.gold > 0) {
    pills.push(
      <span key="g" style={pillStyle('#f0d080')}>
        <IcoCoin s={13} /> {reward.gold}
      </span>,
    );
  }
  if (reward.gems && reward.gems > 0) {
    pills.push(
      <span key="gm" style={pillStyle('#c8e0f0')}>
        <IcoGem s={13} /> {reward.gems}
      </span>,
    );
  }
  if (reward.keys && reward.keys > 0) {
    pills.push(
      <span key="k" style={pillStyle('#e8c870')}>
        <IcoKey s={13} /> {reward.keys}
      </span>,
    );
  }
  if (reward.xp && reward.xp > 0) {
    pills.push(
      <span key="x" style={pillStyle('#e8c870')}>
        <GameIcon name="spark" size={13} /> {reward.xp}
      </span>,
    );
  }
  if (reward.itemName && reward.itemIcon && reward.itemRarity) {
    pills.push(
      <span
        key="i"
        title={reward.itemName}
        style={{
          ...pillStyle(RARITY_COLOR[reward.itemRarity] + '44'),
          border: `1.5px solid ${RARITY_COLOR[reward.itemRarity]}`,
        }}
      >
        <GameIcon name={reward.itemIcon as IconName} size={13} />{' '}
        {reward.itemName.length > 14 ? reward.itemName.slice(0, 13) + '…' : reward.itemName}
      </span>,
    );
  }
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{pills}</div>;
}

function pillStyle(bg: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    padding: '2px 7px',
    borderRadius: 999,
    background: bg,
    fontSize: 12,
    fontFamily: 'Luckiest Guy, sans-serif',
    letterSpacing: 0.3,
    whiteSpace: 'nowrap',
  };
}
