import { useState } from 'react';
import { GameIcon } from '@/components/game-icons';
import type { IconName } from '@grodno/shared';
import { IcoCoin, IcoGem } from '@/components/icons';
import { trpc } from '@/api/trpc';
import { useT, useContentT, type DictKey } from '@/i18n';

type AchCategory = 'combat' | 'loot' | 'progression' | 'economy';
type AchTier = 'bronze' | 'silver' | 'gold' | 'legendary';

interface AchItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  tier: AchTier;
  category: AchCategory;
  threshold: number;
  rewardGold: number;
  rewardGems: number;
  progress: number;
  unlockedAt: number | null;
}

const CATEGORY_LABEL_KEY: Record<AchCategory, DictKey> = {
  combat: 'achievements.cat.combat',
  loot: 'achievements.cat.loot',
  progression: 'achievements.cat.progression',
  economy: 'achievements.cat.economy',
};

const TIER_COLOR: Record<AchTier, string> = {
  bronze: '#a86a3a',
  silver: '#a0a0a8',
  gold: '#ffc830',
  legendary: '#a04ef0',
};

const TIER_LABEL_KEY: Record<AchTier, DictKey> = {
  bronze: 'achievements.tier.bronze',
  silver: 'achievements.tier.silver',
  gold: 'achievements.tier.gold',
  legendary: 'achievements.tier.legendary',
};

export interface ScreenAchievementsProps {
  onBack: () => void;
}

export function ScreenAchievements({ onBack }: ScreenAchievementsProps) {
  const t = useT();
  const q = trpc.achievements.list.useQuery();
  const items: readonly AchItem[] = (q.data?.items ?? []) as readonly AchItem[];
  const [activeCat, setActiveCat] = useState<AchCategory>('combat');
  const filtered = items.filter((it) => it.category === activeCat);
  const unlockedCount = items.filter((it) => it.unlockedAt !== null).length;
  const total = items.length;

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div
        style={{
          background: 'linear-gradient(180deg, #3a2a4a 0%, #1a1a2a 100%)',
          border: '3px solid #2a1810',
          borderRadius: 14,
          boxShadow: '3px 3px 0 #2a1810',
          padding: 14,
          color: '#fff3e0',
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        <div className="h-display" style={{ fontSize: 22 }}>{t('achievements.title')}</div>
        <div className="flavor light" style={{ fontSize: 17, marginTop: 4 }}>
          {t('achievements.flavor')}
        </div>
        <div className="mono" style={{ fontSize: 13, marginTop: 6 }}>
          {t('achievements.progress')
            .replace('{a}', String(unlockedCount))
            .replace('{b}', String(total))}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
          marginBottom: 10,
        }}
      >
        {(Object.keys(CATEGORY_LABEL_KEY) as AchCategory[]).map((cat) => {
          const total = items.filter((it) => it.category === cat).length;
          const unlocked = items.filter(
            (it) => it.category === cat && it.unlockedAt !== null,
          ).length;
          const active = activeCat === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCat(cat)}
              style={{
                padding: '6px 2px',
                borderRadius: 8,
                border: '2.5px solid #2a1810',
                background: active ? '#ffc830' : '#e8dcb9',
                color: '#2a1810',
                boxShadow: active ? '2px 2px 0 #2a1810' : 'none',
                fontFamily: 'inherit',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                lineHeight: 1.1,
              }}
            >
              <span className="h-title" style={{ fontSize: 10, letterSpacing: 0.3 }}>
                {t(CATEGORY_LABEL_KEY[cat])}
              </span>
              <span className="mono" style={{ fontSize: 10, opacity: 0.75 }}>
                {unlocked}/{total}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <div
            className="flavor"
            style={{ padding: 12, textAlign: 'center', color: '#5a3a2a', fontSize: 14 }}
          >
            {q.isLoading ? t('achievements.loading') : t('achievements.empty')}
          </div>
        )}
        {filtered.map((it) => (
          <AchievementCard key={it.id} item={it} />
        ))}
      </div>

      <button
        type="button"
        className="cbtn ghost"
        style={{ marginTop: 14, width: '100%' }}
        onClick={onBack}
      >
        {t('btn.back')}
      </button>
    </div>
  );
}

function AchievementCard({ item }: { item: AchItem }) {
  const t = useT();
  const tc = useContentT();
  const unlocked = item.unlockedAt !== null;
  const pct = Math.min(100, (item.progress / item.threshold) * 100);
  const tierColor = TIER_COLOR[item.tier];

  return (
    <div
      className="panel-tight"
      style={{
        padding: 10,
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        background: unlocked ? '#fff7e0' : '#e8dcb9',
        border: `2.5px solid ${unlocked ? tierColor : '#2a1810'}`,
        borderRadius: 8,
        opacity: unlocked ? 1 : 0.9,
        boxShadow: unlocked ? `0 0 12px ${tierColor}40` : 'none',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 10,
          border: '2.5px solid #2a1810',
          background: unlocked ? tierColor : '#d8cc9e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          filter: unlocked ? 'none' : 'grayscale(0.7)',
        }}
      >
        <GameIcon name={item.icon as IconName} size={36} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            className="h-title"
            style={{
              fontSize: 14,
              lineHeight: 1,
              color: unlocked ? '#2a1810' : '#5a4a3a',
            }}
          >
            {tc.achievementName(item.id, item.name)}
          </div>
          <span
            className="pip"
            style={{
              fontSize: 9,
              background: tierColor,
              color: item.tier === 'silver' ? '#2a1810' : '#fff',
              fontWeight: 700,
            }}
          >
            {t(TIER_LABEL_KEY[item.tier])}
          </span>
        </div>
        <div style={{ fontSize: 13, color: '#5a3a2a', marginTop: 2 }}>{tc.achievementDesc(item.id, item.desc)}</div>
        {/* Progress bar (tylko gdy threshold > 1 lub niedodblokowane) */}
        {(!unlocked || item.threshold > 1) && (
          <div style={{ marginTop: 5 }}>
            <div
              style={{
                height: 6,
                background: '#2a1810',
                border: '1.5px solid #2a1810',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: unlocked ? tierColor : '#8a9a4a',
                  transition: 'width 200ms ease',
                }}
              />
            </div>
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: '#5a3a2a',
                marginTop: 2,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>
                {item.progress} / {item.threshold}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: 0.85,
                }}
              >
                {item.rewardGold > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    <IcoCoin s={10} /> {item.rewardGold}
                  </span>
                )}
                {item.rewardGems > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    <IcoGem s={10} /> {item.rewardGems}
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
