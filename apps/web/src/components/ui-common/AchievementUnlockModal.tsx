import { useEffect } from 'react';
import { GameIcon } from '@/components/game-icons';
import type { IconName } from '@grodno/shared';
import { IcoCoin, IcoGem } from '@/components/icons';
import { useT, useContentT } from '@/i18n';
import type { DictKey } from '@/i18n';
import type { AchievementUnlockPayload } from '@grodno/shared';

const TIER_COLOR: Record<AchievementUnlockPayload['tier'], string> = {
  bronze: '#a86a3a',
  silver: '#a0a0a8',
  gold: '#ffc830',
  legendary: '#a04ef0',
};

const TIER_LABEL_KEY: Record<AchievementUnlockPayload['tier'], DictKey> = {
  bronze: 'modal.achievement.tier.bronze',
  silver: 'modal.achievement.tier.silver',
  gold: 'modal.achievement.tier.gold',
  legendary: 'modal.achievement.tier.legendary',
};

const TIER_FLAVOR_KEY: Record<AchievementUnlockPayload['tier'], DictKey> = {
  bronze: 'modal.achievement.flavor.bronze',
  silver: 'modal.achievement.flavor.silver',
  gold: 'modal.achievement.flavor.gold',
  legendary: 'modal.achievement.flavor.legendary',
};

export interface AchievementUnlockModalProps {
  unlock: AchievementUnlockPayload;
  onClose: () => void;
}

export function AchievementUnlockModal({ unlock, onClose }: AchievementUnlockModalProps) {
  const t = useT();
  const tc = useContentT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const tierColor = TIER_COLOR[unlock.tier];

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 5, 5, 0.75)',
        zIndex: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'modal-fade-in 0.25s ease-out',
      }}
    >
      <div
        className="panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 340,
          background: '#fff7e0',
          padding: 18,
          border: `4px solid ${tierColor}`,
          borderRadius: 14,
          boxShadow: `0 0 36px ${tierColor}60, 4px 4px 0 #2a1810`,
          textAlign: 'center',
          position: 'relative',
          animation: 'boss-intro-scale 0.5s ease-out',
        }}
      >
        <div
          className="h-title"
          style={{
            fontSize: 13,
            color: tierColor,
            letterSpacing: 3,
            marginBottom: 4,
          }}
        >
          {t('modal.achievement.heading')}
        </div>
        <div
          style={{
            width: 90,
            height: 90,
            margin: '8px auto',
            borderRadius: 16,
            border: `4px solid ${tierColor}`,
            background: tierColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `inset 0 0 20px rgba(0,0,0,0.3), 0 0 24px ${tierColor}80`,
          }}
        >
          <GameIcon name={unlock.icon as IconName} size={64} />
        </div>
        <span
          className="pip"
          style={{
            fontSize: 10,
            background: tierColor,
            color: unlock.tier === 'silver' ? '#2a1810' : '#fff',
            fontWeight: 700,
          }}
        >
          {t(TIER_LABEL_KEY[unlock.tier])}
        </span>
        <div
          className="h-display"
          style={{
            fontSize: 22,
            marginTop: 8,
            color: '#2a1810',
            textShadow: `0 0 10px ${tierColor}40`,
          }}
        >
          {tc.achievementName(unlock.id, unlock.name)}
        </div>
        <div
          className="flavor"
          style={{ fontSize: 16, marginTop: 6, color: '#5a3a2a' }}
        >
          {t(TIER_FLAVOR_KEY[unlock.tier])}
        </div>
        {(unlock.rewardGold > 0 || unlock.rewardGems > 0) && (
          <div
            style={{
              marginTop: 10,
              display: 'inline-flex',
              gap: 10,
              padding: '6px 12px',
              borderRadius: 10,
              background: '#e8dcb9',
              border: '2.5px solid #2a1810',
            }}
          >
            <span
              className="h-title"
              style={{ fontSize: 13, color: '#5a3a2a', alignSelf: 'center' }}
            >
              {t('modal.achievement.reward')}
            </span>
            {unlock.rewardGold > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontWeight: 700,
                  color: '#2a1810',
                }}
              >
                <IcoCoin s={14} /> {unlock.rewardGold}
              </span>
            )}
            {unlock.rewardGems > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontWeight: 700,
                  color: '#2a1810',
                }}
              >
                <IcoGem s={14} /> {unlock.rewardGems}
              </span>
            )}
          </div>
        )}
        <button
          type="button"
          className="cbtn green"
          style={{ marginTop: 14, width: '100%' }}
          onClick={onClose}
        >
          {t('modal.achievement.next')}
        </button>
      </div>
    </div>
  );
}
