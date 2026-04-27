import type { GuildRaidHitResponse, IconName } from '@grodno/shared';
import { GameIcon } from '@/components/game-icons';
import { IcoCoin, IcoGem } from '@/components/icons';

export interface RaidHitResultModalProps {
  result: GuildRaidHitResponse;
  previousBossName: string;
  onClose: () => void;
}

export function RaidHitResultModal({
  result,
  previousBossName,
  onClose,
}: RaidHitResultModalProps) {
  const { killed, dmg, hpRemaining, nextBoss, rewardGold, rewardGems } = result;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 230,
        background: 'rgba(42,24,16,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'modal-fade-in 0.25s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel"
        style={{
          width: '100%',
          maxWidth: 340,
          background: killed ? 'linear-gradient(180deg,#f3ead9 0%,#e8c870 100%)' : '#f3ead9',
          padding: 14,
          textAlign: 'center',
        }}
      >
        {killed ? (
          <>
            <div
              className="h-display"
              style={{
                fontSize: 22,
                color: '#c83232',
                textShadow: '2px 2px 0 #2a1810',
                marginBottom: 4,
              }}
            >
              BOSS PADŁ!
            </div>
            <div
              className="flavor"
              style={{ fontSize: 14, color: '#2a1810', marginBottom: 12 }}
            >
              „{previousBossName}" — skończony. Zadałeś <b className="mono">{dmg}</b> dmg
              ostatnim ciosem.
            </div>
            {(rewardGold > 0 || rewardGems > 0) && (
              <div
                style={{
                  padding: 8,
                  border: '2.5px solid #2a1810',
                  borderRadius: 8,
                  background: '#fff7e0',
                  marginBottom: 10,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <div className="h-title" style={{ fontSize: 13 }}>
                  DO SKARBCA:
                </div>
                {rewardGold > 0 && (
                  <span
                    style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}
                    className="mono"
                  >
                    <IcoCoin s={14} /> +{rewardGold.toLocaleString('pl-PL')}
                  </span>
                )}
                {rewardGems > 0 && (
                  <span
                    style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}
                    className="mono"
                  >
                    <IcoGem s={14} /> +{rewardGems}
                  </span>
                )}
              </div>
            )}
            {nextBoss && (
              <div
                style={{
                  padding: 8,
                  border: '2px solid #2a1810',
                  borderRadius: 8,
                  background: '#e8dcb9',
                  marginBottom: 10,
                }}
              >
                <div
                  className="mono"
                  style={{ fontSize: 10, opacity: 0.7, marginBottom: 4 }}
                >
                  NASTĘPNY (TIER {nextBoss.tier}):
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GameIcon name={nextBoss.icon as IconName} size={36} />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div className="h-title" style={{ fontSize: 13 }}>
                      {nextBoss.name}
                    </div>
                    <div className="mono" style={{ fontSize: 13, opacity: 0.7 }}>
                      {nextBoss.hpMax.toLocaleString('pl-PL')} HP
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div
              className="h-display"
              style={{ fontSize: 20, color: '#c83232', marginBottom: 4 }}
            >
              UDERZENIE
            </div>
            <div
              className="flavor"
              style={{ fontSize: 14, color: '#2a1810', marginBottom: 10 }}
            >
              Zadałeś <b className="mono">{dmg.toLocaleString('pl-PL')}</b> dmg.
            </div>
            <div className="mono" style={{ fontSize: 13, color: '#5a3a2a', marginBottom: 10 }}>
              Zostało: {hpRemaining.toLocaleString('pl-PL')} HP
            </div>
          </>
        )}
        <button
          type="button"
          className="cbtn green"
          style={{ width: '100%' }}
          onClick={onClose}
        >
          {killed ? 'BIJEMY DALEJ' : 'OK'}
        </button>
      </div>
    </div>
  );
}
