import { GameIcon } from '@/components/game-icons';
import { IcoCoin, IcoKey } from '@/components/icons';
import { useT, useContentT } from '@/i18n';
import type { DictKey } from '@/i18n';
import type { QuestReward, Rarity } from '@grodno/shared';

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#a8a890',
  rare: '#3a8ac8',
  epic: '#a04ef0',
  legendary: '#ffc830',
};

const RARITY_LABEL_KEY: Record<Rarity, DictKey> = {
  common: 'rarity.common',
  rare: 'rarity.rare',
  epic: 'rarity.epic',
  legendary: 'rarity.legendary.short',
};

export interface QuestRewardModalProps {
  reward: QuestReward | null | undefined;
  questTitle: string;
  onClose: () => void;
}

export function QuestRewardModal({ reward, questTitle, onClose }: QuestRewardModalProps) {
  const t = useT();
  const tc = useContentT();
  if (!reward) return null;
  const item = reward.item ?? null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 200,
        background: 'rgba(42,24,16,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'qrm-fade 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel"
        style={{
          width: '100%',
          maxWidth: 320,
          background: '#f3ead9',
          padding: 18,
          textAlign: 'center',
          animation: 'qrm-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            height: 120,
            pointerEvents: 'none',
          }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            style={{ animation: 'qrm-spin 8s linear infinite' }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <polygon
                key={i}
                points="60,10 65,60 55,60"
                fill="#ffc830"
                opacity="0.5"
                transform={`rotate(${i * 30} 60 60)`}
              />
            ))}
          </svg>
        </div>

        <div
          className="h-display"
          style={{ fontSize: 24, color: '#2e5020', marginBottom: 2, position: 'relative' }}
        >
          {t('modal.questReward.heading')}
        </div>
        <div
          style={{ fontSize: 12, color: '#5a3a2a', marginBottom: 14, fontStyle: 'italic' }}
        >
          „{questTitle}"
        </div>

        <div className="h-title" style={{ fontSize: 14, marginBottom: 8, color: '#5a3a2a' }}>
          {t('modal.questReward.label')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#f9e6a8',
              border: '2.5px solid #2a1810',
              borderRadius: 10,
              padding: '10px 12px',
              animation: 'qrm-slide 0.4s ease-out 0.1s both',
            }}
          >
            <IcoCoin s={28} />
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: 13, color: '#5a3a2a', lineHeight: 1 }}>{t('modal.questReward.gold')}</div>
              <div
                className="h-title"
                style={{ fontSize: 20, lineHeight: 1, color: '#8a5a1a' }}
              >
                +{reward.gold}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#e8c870',
              border: '2.5px solid #2a1810',
              borderRadius: 10,
              padding: '10px 12px',
              animation: 'qrm-slide 0.4s ease-out 0.18s both',
            }}
          >
            <GameIcon name="spark" size={28} />
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: 13, color: '#5a3a2a', lineHeight: 1 }}>{t('modal.questReward.xp')}</div>
              <div
                className="h-title"
                style={{ fontSize: 20, lineHeight: 1, color: '#7a5a1a' }}
              >
                +{reward.xp} XP
              </div>
            </div>
          </div>

          {reward.keys !== undefined && reward.keys > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#f3d886',
                border: '2.5px solid #2a1810',
                borderRadius: 10,
                padding: '10px 12px',
                animation: 'qrm-slide 0.4s ease-out 0.22s both',
              }}
            >
              <IcoKey s={28} />
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontSize: 13, color: '#5a3a2a', lineHeight: 1 }}>
                  {t('modal.questReward.keys')}
                </div>
                <div
                  className="h-title"
                  style={{ fontSize: 20, lineHeight: 1, color: '#7a5a1a' }}
                >
                  +{reward.keys}
                </div>
              </div>
            </div>
          )}

          {item && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#fff3e0',
                border: `2.5px solid ${RARITY_COLOR[item.rarity]}`,
                borderRadius: 10,
                padding: '10px 12px',
                boxShadow: `0 0 0 3px ${RARITY_COLOR[item.rarity]}33`,
                animation:
                  'qrm-slide 0.4s ease-out 0.26s both, qrm-glow 1.6s ease-in-out infinite 0.6s',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#e8dcb9',
                  border: '2px solid #2a1810',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <GameIcon name={item.icon} size={26} />
              </div>
              <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'inline-block',
                    fontFamily: 'Luckiest Guy, sans-serif',
                    fontSize: 9,
                    letterSpacing: 0.5,
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: RARITY_COLOR[item.rarity],
                    color: '#fff3e0',
                    marginBottom: 2,
                  }}
                >
                  {t(RARITY_LABEL_KEY[item.rarity])}
                </div>
                <div className="h-title" style={{ fontSize: 14, lineHeight: 1.1 }}>
                  {tc.itemName(item.name, item.name)}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="cbtn green lg"
          style={{
            width: '100%',
            animation: 'qrm-slide 0.4s ease-out 0.34s both',
          }}
          onClick={onClose}
        >
          {t('modal.questReward.collect')}
        </button>
      </div>

      <style>{`
        @keyframes qrm-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes qrm-pop {
          0% { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes qrm-slide {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes qrm-spin { to { transform: rotate(360deg); } }
        @keyframes qrm-glow {
          0%, 100% { box-shadow: 0 0 0 3px rgba(160,78,240,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(160,78,240,0.4); }
        }
      `}</style>
    </div>
  );
}
