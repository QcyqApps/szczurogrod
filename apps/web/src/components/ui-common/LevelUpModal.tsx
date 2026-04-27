import { GameIcon } from '@/components/game-icons';
import type { LevelUpInfo } from '@grodno/shared';

export interface LevelUpModalProps {
  info: LevelUpInfo | null | undefined;
  onClose: () => void;
}

export function LevelUpModal({ info, onClose }: LevelUpModalProps) {
  if (!info) return null;
  const crossed = info.toLevel - info.fromLevel;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 210,
        background: 'rgba(42,24,16,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'lvl-fade 0.25s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel"
        style={{
          width: '100%',
          maxWidth: 320,
          background: 'linear-gradient(180deg, #f3ead9 0%, #e8c870 100%)',
          padding: 18,
          textAlign: 'center',
          animation: 'lvl-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 140,
            height: 140,
            pointerEvents: 'none',
          }}
        >
          <svg
            width="140"
            height="140"
            viewBox="0 0 120 120"
            style={{ animation: 'lvl-spin 6s linear infinite' }}
          >
            {Array.from({ length: 16 }).map((_, i) => (
              <polygon
                key={i}
                points="60,4 63,58 57,58"
                fill="#ffc830"
                opacity="0.55"
                transform={`rotate(${i * 22.5} 60 60)`}
              />
            ))}
          </svg>
        </div>

        <div
          className="h-display"
          style={{
            fontSize: 30,
            color: '#c83232',
            textShadow: '2px 2px 0 #2a1810',
            marginBottom: 4,
            position: 'relative',
          }}
        >
          LEVEL UP!
        </div>
        <div
          className="h-title"
          style={{
            fontSize: 20,
            color: '#2e5020',
            marginBottom: 12,
            position: 'relative',
          }}
        >
          LVL {info.fromLevel} → <b style={{ color: '#8a1e1e' }}>LVL {info.toLevel}</b>
          {crossed > 1 && (
            <span style={{ fontSize: 12, color: '#5a3a2a' }}> ({crossed} razy!)</span>
          )}
        </div>

        {info.chapterUnlock && (
          <div
            style={{
              background: 'linear-gradient(180deg, #3a2a6a 0%, #5a3a7a 100%)',
              color: '#fff3e0',
              border: '3px solid #2a1810',
              borderRadius: 10,
              padding: '10px 12px',
              marginBottom: 12,
              boxShadow: '0 0 12px rgba(255,200,48,0.6)',
              position: 'relative',
            }}
          >
            <div
              className="h-title"
              style={{ fontSize: 10, color: '#ffc830', letterSpacing: 1, marginBottom: 2 }}
            >
              ✨ NOWY ROZDZIAŁ ✨
            </div>
            <div
              className="h-display clean"
              style={{ fontSize: 18, color: '#ffc830', lineHeight: 1 }}
            >
              {info.chapterUnlock.name} — {info.chapterUnlock.subtitle}
            </div>
            <div
              className="flavor light"
              style={{ fontSize: 14, marginTop: 4, lineHeight: 1.2 }}
            >
              {info.chapterUnlock.flavor}
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            marginBottom: 12,
          }}
        >
          <RewardLine icon="heart" color="#c83232" value={`+${info.hpGain}`} label="Maks. HP" />
          <RewardLine icon="orb" color="#3a5a8a" value={`+${info.mpGain}`} label="Maks. MP" />
          {info.staminaGain > 0 && (
            <RewardLine
              icon="bolt"
              color="#4a7c3a"
              value={`+${info.staminaGain}`}
              label="Maks. wytrzymałość"
            />
          )}
        </div>

        <div
          className="flavor"
          style={{
            fontSize: 15,
            color: '#5a3a2a',
            marginBottom: 12,
          }}
        >
          Staty rosną tylko u Trenera. HP i MP zostało uzupełnione.
        </div>

        <button
          type="button"
          className="cbtn green lg"
          style={{ width: '100%' }}
          onClick={onClose}
        >
          DALEJ!
        </button>
      </div>

      <style>{`
        @keyframes lvl-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lvl-pop {
          0% { transform: scale(0.6) rotate(-6deg); opacity: 0; }
          70% { transform: scale(1.08) rotate(2deg); }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes lvl-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function RewardLine({
  icon,
  color,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof GameIcon>['name'];
  color: string;
  value: string;
  label: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#fff3e0',
        border: '2.5px solid #2a1810',
        borderRadius: 10,
        padding: '8px 12px',
        position: 'relative',
      }}
    >
      <GameIcon name={icon} size={24} />
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ fontSize: 13, color: '#5a3a2a', lineHeight: 1 }}>{label}</div>
        <div className="h-title" style={{ fontSize: 18, color, lineHeight: 1.1 }}>
          {value}
        </div>
      </div>
    </div>
  );
}
