import type { GuildWarDetails } from '@grodno/shared';
import { IcoCoin } from '@/components/icons';
import { useT } from '@/i18n';

export interface WarResultModalProps {
  war: GuildWarDetails;
  onClose: () => void;
}

export function WarResultModal({ war, onClose }: WarResultModalProps) {
  const t = useT();
  const isAttackerWinner = war.winnerGuildId === war.attackerGuildId;
  const winnerName = isAttackerWinner ? war.attackerGuildName : war.defenderGuildName;
  const loserName = isAttackerWinner ? war.defenderGuildName : war.attackerGuildName;
  const myWon = war.mySide && war.winnerGuildId
    ? (war.mySide === 'attacker' ? isAttackerWinner : !isAttackerWinner)
    : null;

  const summaryKey = isAttackerWinner
    ? 'guildWars.result.summary.attacker'
    : 'guildWars.result.summary.defender';

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
          maxWidth: 380,
          background: '#f3ead9',
          padding: 14,
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div
          className="h-display"
          style={{
            fontSize: 22,
            textAlign: 'center',
            marginBottom: 4,
            color: myWon === true ? '#2a4a3a' : myWon === false ? '#8a3030' : '#2a1810',
          }}
        >
          {myWon === true
            ? t('guildWars.result.victory')
            : myWon === false
              ? t('guildWars.result.defeat')
              : t('guildWars.result.war')}
        </div>
        <div
          className="flavor"
          style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', marginBottom: 10 }}
        >
          {t(summaryKey)
            .replace('{w}', winnerName)
            .replace('{score}', `${war.attackerScore}:${war.defenderScore}`)
            .replace('{l}', loserName)}
        </div>

        {war.goldPrize > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: 6,
              background: '#fff7e0',
              border: '2px solid #2a1810',
              borderRadius: 6,
              marginBottom: 10,
            }}
          >
            <IcoCoin s={16} />
            <span className="mono" style={{ fontSize: 14 }}>
              {t('guildWars.result.toTreasury').replace('{n}', war.goldPrize.toLocaleString('pl-PL'))}
            </span>
          </div>
        )}

        <div className="h-title" style={{ fontSize: 13, marginBottom: 4 }}>
          {t('guildWars.result.rounds')}
        </div>
        {(!war.rounds || war.rounds.length === 0) && (
          <div
            className="flavor"
            style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', padding: 8 }}
          >
            {t('guildWars.result.forfeit')}
          </div>
        )}
        {war.rounds?.map((r) => (
          <div
            key={r.round}
            style={{
              padding: 6,
              marginBottom: 4,
              border: '2px solid #2a1810',
              borderRadius: 6,
              background: r.winner === 'attacker' ? '#fff0e0' : '#e0f0ff',
              fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: 13, opacity: 0.7 }}>
                {t('guildWars.result.round').replace('{n}', String(r.round + 1))}
              </span>
              <span
                className="h-title"
                style={{
                  fontSize: 13,
                  color: r.winner === 'attacker' ? '#c83232' : '#3a5a8a',
                }}
              >
                {r.winner === 'attacker'
                  ? t('guildWars.result.attack')
                  : t('guildWars.result.defense')}
              </span>
            </div>
            <div style={{ marginTop: 2 }}>
              <b>{r.attackerName}</b> ({r.attackerHpBefore} HP) vs{' '}
              <b>{r.defenderName}</b> ({r.defenderHpBefore} HP)
            </div>
            <div className="mono" style={{ fontSize: 13, opacity: 0.7 }}>
              {t('guildWars.result.duelLine')
                .replace('{hp}', String(r.winnerHpAfter))
                .replace('{turns}', String(r.duelLog.length))}
            </div>
          </div>
        ))}

        <button
          type="button"
          className="cbtn green sm"
          style={{ width: '100%', marginTop: 10 }}
          onClick={onClose}
        >
          {t('guildWars.result.close')}
        </button>
      </div>
    </div>
  );
}
