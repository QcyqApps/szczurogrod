// Read-only spectator widoku wojny. Trafia tu non-member klikając server-wide
// banner na ScreenTown. Pokazujemy: tagi i nazwy obu gildii, status / countdown,
// lineup'y (gdy committed), wynik (gdy resolved). Brak akcji — to jest pełny
// czytnik, w odróżnieniu od GuildTabWars (z deklarowaniem / reorderem).

import { useEffect, useState } from 'react';
import { trpc } from '@/api/trpc';
import { GameIcon } from '@/components/game-icons';
import { useT } from '@/i18n';
import { consumePendingWarId } from './pending-war';

export interface ScreenWarSpectatorProps {
  onBack: () => void;
}

function fmtCountdown(msLeft: number): string {
  if (msLeft <= 0) return '0s';
  const totalSec = Math.floor(msLeft / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function ScreenWarSpectator({ onBack }: ScreenWarSpectatorProps) {
  const t = useT();
  const [warId] = useState<string | null>(() => consumePendingWarId());
  const [, setTick] = useState(0);

  const detailsQuery = trpc.guildWars.get.useQuery(
    { warId: warId ?? '' },
    { enabled: !!warId, refetchInterval: 15_000 },
  );

  // 1Hz tick dla countdown'u — tylko gdy scheduled.
  useEffect(() => {
    if (detailsQuery.data?.status !== 'scheduled') return;
    const handle = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(handle);
  }, [detailsQuery.data?.status]);

  if (!warId) {
    return (
      <div className="screen-in" style={{ padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <button type="button" className="cbtn sm" onClick={onBack}>
            ←
          </button>
          <div className="h-display clean" style={{ fontSize: 18, flex: 1 }}>
            {t('warSpectator.title')}
          </div>
        </div>
        <div className="flavor" style={{ textAlign: 'center', padding: 20, color: '#5a3a2a' }}>
          {t('warSpectator.notFound')}
        </div>
      </div>
    );
  }

  if (detailsQuery.isLoading || !detailsQuery.data) {
    return (
      <div className="screen-in" style={{ padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <button type="button" className="cbtn sm" onClick={onBack}>
            ←
          </button>
          <div className="h-display clean" style={{ fontSize: 18, flex: 1 }}>
            {t('warSpectator.title')}
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: 20, color: '#5a3a2a' }}>
          {t('warSpectator.loading')}
        </div>
      </div>
    );
  }

  const w = detailsQuery.data;
  const attackerLineup = w.participants.filter((p) => p.side === 'attacker');
  const defenderLineup = w.participants.filter((p) => p.side === 'defender');
  const isResolved = w.status === 'resolved';
  const winnerSide =
    isResolved && w.winnerGuildId
      ? w.winnerGuildId === w.attackerGuildId
        ? 'attacker'
        : 'defender'
      : null;

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <button type="button" className="cbtn sm" onClick={onBack}>
          ←
        </button>
        <div className="h-display clean" style={{ fontSize: 18, flex: 1 }}>
          {t('warSpectator.title')}
        </div>
      </div>

      {/* Header — vs panel z dwoma gildiami i statusem. */}
      <div
        className="panel"
        style={{
          padding: 14,
          background: 'linear-gradient(180deg, #6a3a30 0%, #3a1a10 100%)',
          color: '#fff5e0',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
          <SideBlock
            name={w.attackerGuildName}
            tag={w.attackerGuildTag}
            score={w.attackerScore}
            isWinner={winnerSide === 'attacker'}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minWidth: 60,
            }}
          >
            <GameIcon name="sword" size={32} />
            <div className="h-display" style={{ fontSize: 14, color: '#ffc830' }}>
              {t('warSpectator.vs')}
            </div>
          </div>
          <SideBlock
            name={w.defenderGuildName}
            tag={w.defenderGuildTag}
            score={w.defenderScore}
            isWinner={winnerSide === 'defender'}
          />
        </div>

        {/* Status row */}
        <div
          style={{
            marginTop: 10,
            padding: '6px 10px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 6,
            textAlign: 'center',
            fontSize: 13,
          }}
        >
          {w.status === 'scheduled' && (
            <span>
              {t('warSpectator.startsIn').replace(
                '{time}',
                fmtCountdown(w.scheduledAt - Date.now()),
              )}
            </span>
          )}
          {w.status === 'resolving' && (
            <span style={{ color: '#ffc830' }}>{t('warSpectator.resolving')}</span>
          )}
          {w.status === 'resolved' && (
            <span style={{ color: '#a8e0a0' }}>
              {t('warSpectator.resolved')
                .replace(
                  '{winner}',
                  winnerSide === 'attacker' ? w.attackerGuildName : w.defenderGuildName,
                )
                .replace('{a}', String(w.attackerScore))
                .replace('{d}', String(w.defenderScore))}
            </span>
          )}
          {w.status === 'cancelled' && (
            <span style={{ color: '#d4a878' }}>{t('warSpectator.cancelled')}</span>
          )}
        </div>
      </div>

      {/* Lineup'y */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <LineupColumn
          title={t('warSpectator.attacker')}
          tag={w.attackerGuildTag}
          participants={attackerLineup}
          isWinner={winnerSide === 'attacker'}
        />
        <LineupColumn
          title={t('warSpectator.defender')}
          tag={w.defenderGuildTag}
          participants={defenderLineup}
          isWinner={winnerSide === 'defender'}
        />
      </div>

      <div
        className="flavor"
        style={{
          textAlign: 'center',
          padding: 12,
          marginTop: 12,
          color: '#5a3a2a',
          fontSize: 14,
        }}
      >
        {t('warSpectator.notInvolved')}
      </div>
    </div>
  );
}

function SideBlock({
  name,
  tag,
  score,
  isWinner,
}: {
  name: string;
  tag: string;
  score: number;
  isWinner: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        textAlign: 'center',
        padding: 8,
        background: isWinner ? 'rgba(255,200,48,0.2)' : 'rgba(0,0,0,0.2)',
        borderRadius: 6,
        border: isWinner ? '2px solid #ffc830' : '2px solid transparent',
      }}
    >
      <div className="h-title" style={{ fontSize: 14, color: '#fff5e0' }}>
        {name}
      </div>
      <div className="mono" style={{ fontSize: 12, opacity: 0.8 }}>
        [{tag}]
      </div>
      <div className="h-display" style={{ fontSize: 22, marginTop: 4, color: '#ffc830' }}>
        {score}
      </div>
    </div>
  );
}

function LineupColumn({
  title,
  tag,
  participants,
  isWinner,
}: {
  title: string;
  tag: string;
  participants: Array<{
    characterId: string;
    name: string;
    cls: 'warrior' | 'mage' | 'rogue';
    lvl: number;
    orderIndex: number;
    wonDuel: boolean | null;
  }>;
  isWinner: boolean;
}) {
  const t = useT();
  const sorted = [...participants].sort((a, b) => a.orderIndex - b.orderIndex);
  return (
    <div className="panel" style={{ padding: 8 }}>
      <div className="h-title" style={{ fontSize: 12, marginBottom: 4 }}>
        {title} <span className="mono" style={{ opacity: 0.7 }}>[{tag}]</span>
        {isWinner && <span style={{ color: '#3a7a3a', marginLeft: 4 }}>★</span>}
      </div>
      {sorted.length === 0 && (
        <div
          className="flavor"
          style={{ fontSize: 13, color: '#5a3a2a', textAlign: 'center', padding: 8 }}
        >
          {t('warSpectator.empty')}
        </div>
      )}
      {sorted.map((p) => (
        <div
          key={p.characterId}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 0',
            borderBottom: '1px dashed #c8b890',
            fontSize: 12,
          }}
        >
          <span className="mono" style={{ opacity: 0.6, minWidth: 14 }}>
            {p.orderIndex + 1}.
          </span>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.name}
          </span>
          <span className="mono" style={{ opacity: 0.7 }}>
            L{p.lvl}
          </span>
          {p.wonDuel === true && <span style={{ color: '#3a7a3a' }}>✓</span>}
          {p.wonDuel === false && <span style={{ color: '#c83232' }}>✕</span>}
        </div>
      ))}
    </div>
  );
}
