import { useEffect, useState } from 'react';
import { GameIcon } from '@/components/game-icons';
import { IcoClock, IcoCoin } from '@/components/icons';
import { HelpIcon } from '@/components/ui-common';
import { useT, tStatic, useContentT } from '@/i18n';
import type { ActiveMount, IconName, MountOffer } from '@grodno/shared';

function formatCountdown(ms: number): string {
  if (ms <= 0) return tStatic('stables.countdown.expired');
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export interface ScreenStablesProps {
  mounts: readonly MountOffer[];
  activeMount: ActiveMount | null;
  playerGold: number;
  playerLvl: number;
  /** LVL najbliższego zablokowanego mountu. `null` gdy wszystko dostępne. */
  nextUnlockLvl: number | null;
  onRent: (slug: string) => void | Promise<void>;
  onBack: () => void;
}

export function ScreenStables({
  mounts,
  activeMount,
  playerGold,
  playerLvl,
  nextUnlockLvl,
  onRent,
  onBack,
}: ScreenStablesProps) {
  const t = useT();
  const tc = useContentT();
  const hasMount = activeMount !== null;

  // Re-render co sekundę, żeby countdown aktywnego mountu tykał w UI.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (activeMount === null) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [activeMount]);

  const msUntilExpiry = activeMount ? Math.max(0, activeMount.expiresAt - Date.now()) : 0;

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div
        style={{
          background: 'linear-gradient(180deg, #6a4a2a 0%, #3a2a1a 100%)',
          border: '3px solid #2a1810',
          borderRadius: 14,
          boxShadow: '3px 3px 0 #2a1810',
          padding: 14,
          color: '#fff3e0',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 12,
        }}
      >
        <div className="halftone-gold" style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <GameIcon name="horse" size={56} />
        </div>
        <div className="h-display" style={{ fontSize: 22, position: 'relative' }}>
          {t('stables.title')}
        </div>
        <div
          className="flavor light"
          style={{ fontSize: 17, marginTop: 4, position: 'relative' }}
        >
          {t('stables.flavor')}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
        <HelpIcon title={t('stables.help.title')} label={t('stables.help.label')}>
          <p style={{ margin: '0 0 8px' }}>{t('stables.help.p1')}</p>
          <p style={{ margin: '0 0 8px' }}>{t('stables.help.p2')}</p>
          <p style={{ margin: 0 }}>{t('stables.help.p3')}</p>
        </HelpIcon>
      </div>

      {activeMount && (
        <div
          className="panel"
          style={{
            padding: 10,
            marginBottom: 12,
            background: 'linear-gradient(135deg, #e8c870 0%, #d4a24c 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 10,
              overflow: 'hidden',
              border: '2.5px solid #2a1810',
              background: '#e8b870',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GameIcon name={activeMount.icon as IconName} size={48} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="h-title"
              style={{ fontSize: 10, color: '#5a3a2a', letterSpacing: 0.6, marginBottom: 2 }}
            >
              {t('stables.active.label')}
            </div>
            <div className="h-title" style={{ fontSize: 15, lineHeight: 1 }}>
              {tc.mountName(activeMount.slug, activeMount.name)}
            </div>
            <div style={{ fontSize: 13, color: '#2e5020', marginTop: 2, fontWeight: 600 }}>
              {t('stables.active.shortens').replace('{n}', String(activeMount.speedPct))}
            </div>
            <div
              className="mono"
              style={{
                fontSize: 13,
                color: '#5a3a2a',
                marginTop: 2,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <IcoClock s={11} />{' '}
              {t('stables.active.expiresIn').replace('{n}', formatCountdown(msUntilExpiry))}
            </div>
          </div>
        </div>
      )}

      <div
        className="h-title"
        style={{
          fontSize: 14,
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <GameIcon name="horse" size={14} /> {t('stables.rent.heading')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {mounts.map((m) => {
          const lvlLocked = playerLvl < m.requiredLvl;
          const canAfford = playerGold >= m.price;
          const disabled = hasMount || lvlLocked || !canAfford;
          const title = hasMount
            ? t('stables.title.hasMount')
            : lvlLocked
              ? t('stables.title.lvlLocked').replace('{n}', String(m.requiredLvl))
              : !canAfford
                ? t('stables.title.poor')
                : t('stables.title.ok')
                    .replace('{p}', String(m.speedPct))
                    .replace('{h}', String(m.rentalHours));
          return (
            <div
              key={m.slug}
              className="panel-tight"
              style={{
                padding: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                opacity: hasMount || lvlLocked ? 0.55 : 1,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '2.5px solid #2a1810',
                  background: '#e8b870',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <GameIcon name={m.icon as IconName} size={48} />
                {lvlLocked && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(42, 24, 16, 0.55)',
                      color: '#fff3e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    LVL {m.requiredLvl}+
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="h-title" style={{ fontSize: 14, lineHeight: 1 }}>
                  {tc.mountName(m.slug, m.name)}
                </div>
                <div
                  className="flavor"
                  style={{ fontSize: 14, color: '#5a3a2a', marginTop: 2 }}
                >
                  {tc.mountDesc(m.slug, m.desc)}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: '#4a7c3a',
                    marginTop: 3,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontWeight: 600,
                  }}
                >
                  <GameIcon name="spark" size={11} />{' '}
                  {t('stables.card.speed')
                    .replace('{p}', String(m.speedPct))
                    .replace('{h}', String(m.rentalHours))}
                </div>
              </div>
              <button
                type="button"
                className="cbtn sm"
                disabled={disabled}
                onClick={() => !disabled && onRent(m.slug)}
                title={title}
                style={{
                  opacity: disabled ? 0.55 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  minWidth: 76,
                }}
              >
                <IcoCoin s={12} /> {m.price}
              </button>
            </div>
          );
        })}
        {mounts.length === 0 && (
          <div
            className="flavor"
            style={{
              padding: 12,
              textAlign: 'center',
              color: '#5a3a2a',
              fontSize: 14,
            }}
          >
            {t('stables.empty')}
          </div>
        )}
      </div>

      {nextUnlockLvl !== null && nextUnlockLvl > playerLvl && (
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: '#5a3a2a' }}>
          {t('stables.nextUnlock').replace('{n}', String(nextUnlockLvl))}
        </div>
      )}

      <button
        type="button"
        className="cbtn ghost"
        style={{ marginTop: 14, width: '100%' }}
        onClick={onBack}
      >
        {t('stables.back')}
      </button>
    </div>
  );
}
