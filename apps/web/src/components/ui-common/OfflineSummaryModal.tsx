import { useEffect } from 'react';
import { GameIcon } from '@/components/game-icons';
import {
  IcoClock,
  IcoHeart,
  IcoKey,
  IcoMagic,
  IcoPaw,
} from '@/components/icons';
import { useT } from '@/i18n';
import type { OfflineSummary } from '@grodno/shared';

export interface OfflineSummaryModalProps {
  summary: OfflineSummary;
  onClose: () => void;
}

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 24) return m > 0 ? `${h}h ${m}min` : `${h}h`;
  const d = Math.floor(h / 24);
  const remH = h % 24;
  return remH > 0 ? `${d}d ${remH}h` : `${d}d`;
}

const ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '6px 8px',
  background: '#fff7e0',
  border: '2px solid #2a1810',
  borderRadius: 8,
  fontSize: 14,
};

export function OfflineSummaryModal({ summary, onClose }: OfflineSummaryModalProps) {
  const t = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rows: Array<{ icon: React.ReactNode; label: string; value: string }> = [];
  if (summary.keysGained > 0) {
    rows.push({
      icon: <IcoKey s={18} />,
      label: t('modal.offline.dungeonKeys'),
      value: `+${summary.keysGained}`,
    });
  }
  if (summary.staminaGained > 0) {
    rows.push({
      icon: <GameIcon name="bolt" size={18} />,
      label: t('modal.offline.staminaShort'),
      value: `+${summary.staminaGained}`,
    });
  }
  if (summary.hpGained > 0) {
    rows.push({
      icon: <IcoHeart s={18} />,
      label: t('modal.offline.hpRecovered'),
      value: `+${summary.hpGained}`,
    });
  }
  if (summary.mpGained > 0) {
    rows.push({
      icon: <IcoMagic s={18} />,
      label: t('modal.offline.mpRecovered'),
      value: `+${summary.mpGained}`,
    });
  }
  if (summary.tracksRolled > 0) {
    rows.push({
      icon: <IcoPaw s={18} />,
      label: t('modal.offline.tracksNew'),
      value: `+${summary.tracksRolled}`,
    });
  }
  if (summary.healerReady) {
    rows.push({
      icon: <GameIcon name="potion" size={18} />,
      label: t('modal.offline.healer'),
      value: t('modal.offline.healerBack'),
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 5, 5, 0.7)',
        zIndex: 380,
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
          background: '#f3ead9',
          padding: 16,
          border: '4px solid #2a1810',
          borderRadius: 14,
          boxShadow: '4px 4px 0 #2a1810',
          textAlign: 'center',
          animation: 'boss-intro-scale 0.4s ease-out',
        }}
      >
        <div
          className="h-display"
          style={{ fontSize: 20, color: '#2a1810', marginBottom: 2 }}
        >
          {t('modal.offline.heading')}
        </div>
        <div
          className="flavor"
          style={{ fontSize: 15, color: '#5a3a2a', marginBottom: 10 }}
        >
          {t('modal.offline.flavor')}
        </div>
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: '#5a3a2a',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            marginBottom: 10,
          }}
        >
          <IcoClock s={12} /> {t('modal.offline.absence')}: {formatDuration(summary.awayMs)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
          {rows.length === 0 ? (
            <div
              style={{
                fontSize: 13,
                color: '#5a3a2a',
                fontStyle: 'italic',
                padding: 8,
              }}
            >
              {t('modal.offline.empty')}
            </div>
          ) : (
            rows.map((r, i) => (
              <div key={i} style={ROW_STYLE}>
                <div style={{ lineHeight: 0 }}>{r.icon}</div>
                <div style={{ flex: 1 }}>{r.label}</div>
                <div
                  className="mono"
                  style={{ fontWeight: 700, color: '#2a4a3a' }}
                >
                  {r.value}
                </div>
              </div>
            ))
          )}
        </div>
        <button
          type="button"
          className="cbtn green"
          style={{ marginTop: 14, width: '100%' }}
          onClick={onClose}
        >
          {t('modal.offline.cta')}
        </button>
      </div>
    </div>
  );
}
