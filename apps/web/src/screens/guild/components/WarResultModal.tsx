import type { GuildWarDetails } from '@grodno/shared';
import { IcoCoin } from '@/components/icons';

export interface WarResultModalProps {
  war: GuildWarDetails;
  onClose: () => void;
}

export function WarResultModal({ war, onClose }: WarResultModalProps) {
  const isAttackerWinner = war.winnerGuildId === war.attackerGuildId;
  const winnerName = isAttackerWinner ? war.attackerGuildName : war.defenderGuildName;
  const loserName = isAttackerWinner ? war.defenderGuildName : war.attackerGuildName;
  const myWon = war.mySide && war.winnerGuildId
    ? (war.mySide === 'attacker' ? isAttackerWinner : !isAttackerWinner)
    : null;

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
          {myWon === true ? 'ZWYCIĘSTWO' : myWon === false ? 'PORAŻKA' : 'WOJNA'}
        </div>
        <div
          className="flavor"
          style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', marginBottom: 10 }}
        >
          „{winnerName}" {isAttackerWinner ? 'wygrała' : 'obroniła'}{' '}
          <b className="mono">
            {war.attackerScore}:{war.defenderScore}
          </b>{' '}
          z „{loserName}".
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
              +{war.goldPrize.toLocaleString('pl-PL')} do skarbca zwycięzcy
            </span>
          </div>
        )}

        <div className="h-title" style={{ fontSize: 13, marginBottom: 4 }}>
          PRZEBIEG
        </div>
        {(!war.rounds || war.rounds.length === 0) && (
          <div
            className="flavor"
            style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', padding: 8 }}
          >
            Forfeit — jedna strona nie stawiła się.
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
                runda {r.round + 1}
              </span>
              <span
                className="h-title"
                style={{
                  fontSize: 13,
                  color: r.winner === 'attacker' ? '#c83232' : '#3a5a8a',
                }}
              >
                {r.winner === 'attacker' ? 'ATAK' : 'OBRONA'}
              </span>
            </div>
            <div style={{ marginTop: 2 }}>
              <b>{r.attackerName}</b> ({r.attackerHpBefore} HP) vs{' '}
              <b>{r.defenderName}</b> ({r.defenderHpBefore} HP)
            </div>
            <div className="mono" style={{ fontSize: 13, opacity: 0.7 }}>
              zwycięzca zostaje z {r.winnerHpAfter} HP · tur: {r.duelLog.length}
            </div>
          </div>
        ))}

        <button
          type="button"
          className="cbtn green sm"
          style={{ width: '100%', marginTop: 10 }}
          onClick={onClose}
        >
          ZAMKNIJ
        </button>
      </div>
    </div>
  );
}
