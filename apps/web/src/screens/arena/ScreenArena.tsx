import { useEffect, useRef, useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { AvatarPortrait } from '@/components/avatar';
import { PortraitByClass } from '@/components/portraits';
import { GameIcon } from '@/components/game-icons';
import { IcoCoin } from '@/components/icons';
import { GemSinkButton } from '@/components/ui-common';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { useUnlockQueue } from '@/api/unlock-queue-store';
import { useT } from '@/i18n';
import {
  GEM_SINK_COSTS,
  type ArenaFightResult,
  type ArenaMatchRow,
  type ArenaRival,
  type Character,
} from '@grodno/shared';

export interface ScreenArenaProps {
  char: Character;
  onBack: () => void;
}

export function ScreenArena({ char, onBack }: ScreenArenaProps) {
  const t = useT();
  const utils = trpc.useUtils();
  const listQuery = trpc.arena.list.useQuery();
  const historyQuery = trpc.arena.history.useQuery();
  const meQuery = trpc.me.get.useQuery();
  const pushToast = useToastQueue((s) => s.push);
  const pushUnlocks = useUnlockQueue((s) => s.push);
  const [fighting, setFighting] = useState<ArenaRival | null>(null);
  const [result, setResult] = useState<ArenaFightResult | null>(null);

  const fightMut = trpc.arena.fight.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setFighting(null);
      void utils.arena.list.invalidate();
      void utils.arena.history.invalidate();
      void utils.me.get.invalidate();
      if (data.unlockedAchievements?.length) pushUnlocks(data.unlockedAchievements);
    },
    onError: (err) => {
      setFighting(null);
      pushToast({
        text: err instanceof TRPCClientError ? err.message : t('arena.toast.buyFailed'),
        accent: '#c83232',
      });
    },
  });

  const buyFightMut = trpc.arena.buyExtraFight.useMutation({
    onSuccess: () => {
      pushToast({ text: t('arena.toast.bought'), accent: '#2a4a3a' });
      void utils.arena.list.invalidate();
      void utils.me.get.invalidate();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : t('arena.toast.buyFailed'),
        accent: '#c83232',
      });
    },
  });

  const stats = listQuery.data?.stats;
  const rivals = listQuery.data?.rivals ?? [];
  const leaderboard = listQuery.data?.leaderboard ?? [];
  const history = historyQuery.data?.matches ?? [];
  const canFight = stats ? stats.fightsToday < stats.fightsMax : false;

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div
        className="panel"
        style={{
          padding: 12,
          marginBottom: 12,
          background: 'linear-gradient(180deg, #8a1e1e 0%, #4a0e0e 100%)',
          color: '#fff3e0',
        }}
      >
        <div
          className="h-display"
          style={{ fontSize: 22, textAlign: 'center', color: '#ffc830' }}
        >
          {t('arena.title')}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            marginTop: 8,
            textAlign: 'center',
          }}
        >
          <div>
            <div className="h-title" style={{ fontSize: 13, opacity: 0.8 }}>
              {t('arena.stats.rank')}
            </div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700 }}>
              {stats?.rank ? `#${stats.rank}` : '—'}
            </div>
          </div>
          <div>
            <div className="h-title" style={{ fontSize: 13, opacity: 0.8 }}>
              {t('arena.stats.points')}
            </div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700 }}>
              {stats?.arenaPoints ?? '—'}
            </div>
          </div>
          <div>
            <div className="h-title" style={{ fontSize: 13, opacity: 0.8 }}>
              {t('arena.stats.fights')}
            </div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700 }}>
              {stats ? `${stats.fightsToday}/${stats.fightsMax}` : '—'}
            </div>
          </div>
        </div>
        {stats && (
          <div
            style={{
              textAlign: 'center',
              marginTop: 6,
              fontSize: 13,
              opacity: 0.8,
            }}
          >
            {t('arena.stats.record')
              .replace('{wins}', String(stats.arenaWins))
              .replace('{losses}', String(stats.arenaLosses))}
          </div>
        )}
        {stats && stats.fightsToday >= stats.fightsMax && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <GemSinkButton
              label={t('arena.buyExtraFight')}
              cost={GEM_SINK_COSTS.extraArenaFight}
              playerGems={meQuery.data?.gems ?? 0}
              pending={buyFightMut.isPending}
              onClick={() => buyFightMut.mutate()}
            />
          </div>
        )}
      </div>

      <div className="panel-tight" style={{ padding: 10, marginBottom: 12 }}>
        <div
          className="h-title"
          style={{
            fontSize: 12,
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <GameIcon name="crown" size={14} /> {t('arena.top')} {leaderboard.length || 10}
        </div>
        {leaderboard.length === 0 && (
          <div style={{ fontSize: 12, color: '#5a3a2a', padding: '4px 0' }}>
            {t('arena.ladder.empty')}
          </div>
        )}
        {leaderboard.map((p) => (
          <div
            key={p.pos}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 0',
              borderBottom:
                p.pos < leaderboard.length ? '1px dashed #c8b890' : 'none',
            }}
          >
            <div
              className="h-display"
              style={{
                fontSize: 18,
                width: 26,
                textAlign: 'center',
                color:
                  p.pos === 1
                    ? '#d4a24c'
                    : p.pos === 2
                      ? '#b0b0b0'
                      : p.pos === 3
                        ? '#a8702a'
                        : '#5a3a2a',
              }}
            >
              {p.pos}
            </div>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                overflow: 'hidden',
                border: '2px solid #2a1810',
              }}
            >
              <PortraitByClass cls={p.cls} size={32} />
            </div>
            <div style={{ flex: 1, fontSize: 14 }}>
              {p.name}{' '}
              <span style={{ fontSize: 13, color: '#5a3a2a' }}>L{p.lvl}</span>
            </div>
            <span
              className="pip gold"
              style={{
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <GameIcon name="bolt" size={11} /> {p.arenaPoints}
            </span>
          </div>
        ))}
      </div>

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
        <GameIcon name="crossed" size={14} /> {t('arena.rivals.heading')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {listQuery.isLoading && (
          <div className="panel-tight" style={{ padding: 10, fontSize: 12 }}>
            {t('arena.rivals.loading')}
          </div>
        )}
        {rivals.map((p) => (
          <div
            key={p.id}
            className="panel-tight"
            style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                overflow: 'hidden',
                border: '2.5px solid #2a1810',
                background: '#e8b870',
              }}
            >
              <PortraitByClass cls={p.cls} size={48} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="h-title" style={{ fontSize: 14, lineHeight: 1 }}>
                {p.name}
                {p.kind === 'npc' && (
                  <span
                    style={{
                      fontSize: 9,
                      color: '#8a6a4a',
                      marginLeft: 4,
                      fontWeight: 400,
                    }}
                  >
                    {t('arena.rivals.npc')}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#5a3a2a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                LVL {p.lvl} · <GameIcon name="bolt" size={11} /> {p.power} ·{' '}
                {p.arenaPoints} {t('arena.rivals.points')}
              </div>
            </div>
            <button
              type="button"
              className="cbtn red sm"
              disabled={!canFight || fightMut.isPending}
              onClick={() => setFighting(p)}
            >
              {t('arena.rivals.fight')}
            </button>
          </div>
        ))}
      </div>

      {!canFight && stats && (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            fontSize: 12,
            color: '#5a3a2a',
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          {t('arena.noFights')}
        </div>
      )}

      <HistoryPanel matches={history} isLoading={historyQuery.isLoading} />

      <button
        type="button"
        className="cbtn ghost"
        style={{ width: '100%', marginTop: 12 }}
        onClick={onBack}
      >
        {t('arena.back')}
      </button>

      {fighting && (
        <FightConfirmModal
          char={char}
          rival={fighting}
          pending={fightMut.isPending}
          onCancel={() => setFighting(null)}
          onConfirm={() => fightMut.mutate({ rivalId: fighting.id })}
        />
      )}

      {result && (
        <FightResultModal
          char={char}
          result={result}
          onClose={() => setResult(null)}
        />
      )}
    </div>
  );
}

function HistoryPanel({
  matches,
  isLoading,
}: {
  matches: readonly ArenaMatchRow[];
  isLoading: boolean;
}) {
  const t = useT();
  if (isLoading) {
    return (
      <div className="panel-tight" style={{ padding: 10, marginTop: 12, fontSize: 12 }}>
        {t('arena.history.loading')}
      </div>
    );
  }
  if (matches.length === 0) return null;
  return (
    <div className="panel-tight" style={{ padding: 10, marginTop: 12 }}>
      <div
        className="h-title"
        style={{
          fontSize: 12,
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <GameIcon name="scroll" size={14} /> {t('arena.history.heading')}
      </div>
      {matches.slice(0, 5).map((m) => (
        <div
          key={m.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 0',
            fontSize: 12,
            opacity: m.won ? 1 : 0.75,
          }}
        >
          <div
            style={{
              width: 6,
              height: 28,
              background: m.won ? '#3a8a3a' : '#8a3a3a',
              borderRadius: 2,
            }}
          />
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              overflow: 'hidden',
              border: '1.5px solid #2a1810',
            }}
          >
            <PortraitByClass cls={m.opponentCls} size={28} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, lineHeight: 1.2 }}>
              <b>{m.role === 'attacker' ? t('arena.history.vs') : t('arena.history.from')}</b>{' '}
              {m.opponentName}
              {m.opponentKind === 'npc' && (
                <span style={{ fontSize: 9, color: '#8a6a4a', marginLeft: 4 }}>{t('arena.rivals.npc')}</span>
              )}
            </div>
            <div style={{ fontSize: 10, color: '#5a3a2a' }}>
              L{m.opponentLvl} · {m.won ? t('arena.history.won') : t('arena.history.lost')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              className="mono"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: m.pointsDelta >= 0 ? '#3a6a3a' : '#8a3a3a',
              }}
            >
              {m.pointsDelta >= 0 ? '+' : ''}
              {m.pointsDelta}
            </div>
            {m.goldReward > 0 && (
              <div
                style={{
                  fontSize: 10,
                  color: '#5a3a2a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <IcoCoin s={9} /> {m.goldReward}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatBar({
  label,
  you,
  rival,
  accent,
}: {
  label: string;
  you: number;
  rival: number;
  accent: string;
}) {
  const max = Math.max(you, rival, 1);
  const yourPct = (you / max) * 100;
  const rivalPct = (rival / max) * 100;
  const diff = you - rival;
  return (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          marginBottom: 2,
        }}
      >
        <span style={{ color: '#3a2a1a' }}>{label}</span>
        <span
          className="mono"
          style={{
            fontWeight: 700,
            color: diff > 0 ? '#3a6a3a' : diff < 0 ? '#8a3a3a' : '#3a2a1a',
          }}
        >
          {you} vs {rival} {diff !== 0 && `(${diff > 0 ? '+' : ''}${diff})`}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 2,
          height: 6,
          background: '#d8c8a8',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div style={{ width: `${yourPct}%`, background: accent }} />
      </div>
      <div
        style={{
          display: 'flex',
          gap: 2,
          height: 6,
          background: '#d8c8a8',
          borderRadius: 3,
          overflow: 'hidden',
          marginTop: 2,
          opacity: 0.6,
        }}
      >
        <div style={{ width: `${rivalPct}%`, background: '#8a3a3a' }} />
      </div>
    </div>
  );
}

function FightConfirmModal({
  char,
  rival,
  pending,
  onCancel,
  onConfirm,
}: {
  char: Character;
  rival: ArenaRival;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useT();
  const detailsQuery = trpc.arena.rivalDetails.useQuery({ rivalId: rival.id });
  const rd = detailsQuery.data;
  // Preview używa base stats (char.stats). Nie pokazujemy wpływu ekwipunku
  // na preview — serwer i tak liczy effective przy fight'cie. Różnica w UI
  // jest kosmetyczna (gracz zna swój eq, rywala trzeba zobaczyć z eq
  // inclusive).
  const youStats = char.stats;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={pending ? undefined : onCancel}
    >
      <div
        className="panel pop-in"
        style={{
          background: '#f3ead9',
          padding: 16,
          textAlign: 'center',
          maxWidth: 340,
          width: '100%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-display" style={{ fontSize: 22 }}>
          {t('arena.modal.duel.title')}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            margin: '14px 0 10px',
          }}
        >
          <div
            style={{
              width: 66,
              height: 66,
              borderRadius: 999,
              overflow: 'hidden',
              border: '2.5px solid #2a1810',
            }}
          >
            <AvatarPortrait appearance={char.appearance} cls={char.cls} size={66} />
          </div>
          <div className="h-display" style={{ fontSize: 28, color: '#c83232' }}>
            VS
          </div>
          <div
            style={{
              width: 66,
              height: 66,
              borderRadius: 999,
              overflow: 'hidden',
              border: '2.5px solid #2a1810',
            }}
          >
            <PortraitByClass cls={rival.cls} size={66} />
          </div>
        </div>
        <div style={{ fontSize: 14, color: '#3a2a1a', marginBottom: 8 }}>
          <b>{rival.name}</b> · LVL {rival.lvl} · {rival.arenaPoints} {t('arena.rivals.points')}
        </div>

        <div
          style={{
            textAlign: 'left',
            padding: 10,
            background: '#e8d8b8',
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          {detailsQuery.isLoading && (
            <div style={{ fontSize: 13, color: '#5a3a2a' }}>{t('arena.modal.assessing')}</div>
          )}
          {rd && (
            <>
              <StatBar label="ATK" you={youStats.atk} rival={rd.atk} accent="#8a6a2a" />
              <StatBar label="DEF" you={youStats.def} rival={rd.def} accent="#2a6a8a" />
              <StatBar label="MAG" you={youStats.mag} rival={rd.mag} accent="#6a2a8a" />
              <StatBar label="SPD" you={youStats.spd} rival={rd.spd} accent="#6a8a2a" />
              <div
                style={{
                  marginTop: 6,
                  fontSize: 10,
                  color: '#5a3a2a',
                  textAlign: 'right',
                }}
              >
                HP: {char.hpMax} vs {rd.hpMax}
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="cbtn ghost"
            style={{ flex: 1 }}
            onClick={onCancel}
            disabled={pending}
          >
            {t('arena.modal.cancel')}
          </button>
          <button
            type="button"
            className="cbtn red"
            style={{ flex: 1 }}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? t('arena.modal.fighting') : t('arena.modal.toBattle')}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Reveal turn-by-turn; interval 350ms, klik „POMIŃ" ujawnia od razu. */
function FightResultModal({
  char,
  result,
  onClose,
}: {
  char: Character;
  result: ArenaFightResult;
  onClose: () => void;
}) {
  const t = useT();
  const [revealed, setRevealed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = result.log.length;

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRevealed((n) => {
        if (n >= total) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return n;
        }
        return n + 1;
      });
    }, 350);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [total]);

  const skip = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRevealed(total);
  };

  const accent = result.won ? '#3a8a3a' : '#8a3a3a';
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [revealed]);

  const isFinished = revealed >= total;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={isFinished ? onClose : undefined}
    >
      <div
        className="panel pop-in"
        style={{
          background: '#f3ead9',
          padding: 14,
          textAlign: 'center',
          maxWidth: 340,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="h-display"
          style={{
            fontSize: 24,
            color: isFinished ? accent : '#3a2a1a',
            marginBottom: 6,
          }}
        >
          {isFinished
            ? result.won
              ? t('arena.modal.victory')
              : t('arena.modal.defeat')
            : t('arena.modal.duel')}
        </div>
        <div style={{ fontSize: 13, color: '#3a2a1a', marginBottom: 10 }}>
          vs <b>{result.rival.name}</b> · LVL {result.rival.lvl}
        </div>

        {isFinished && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              marginBottom: 10,
              padding: '8px',
              background: '#e8d8b8',
              borderRadius: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: '#5a3a2a' }}>{t('arena.modal.pts')}</div>
              <div
                className="mono"
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: result.pointsDelta >= 0 ? '#3a6a3a' : '#8a3a3a',
                }}
              >
                {result.pointsDelta >= 0 ? '+' : ''}
                {result.pointsDelta}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#5a3a2a' }}>{t('arena.modal.gold')}</div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <IcoCoin s={14} /> {result.goldReward}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#5a3a2a' }}>{t('arena.modal.streak')}</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 700 }}>
                {result.currentStreak > 0 ? `×${result.currentStreak}` : '—'}
              </div>
            </div>
          </div>
        )}

        <div
          ref={logRef}
          style={{
            textAlign: 'left',
            fontSize: 13,
            height: 200,
            overflowY: 'auto',
            background: '#2a1810',
            color: '#f3ead9',
            padding: 8,
            borderRadius: 6,
            marginBottom: 10,
            fontFamily: 'monospace',
          }}
        >
          {result.log.slice(0, revealed).map((entry, i) => (
            <div key={i} style={{ opacity: entry.dmg === 0 ? 0.6 : 1 }}>
              T{entry.turn} ·{' '}
              <span style={{ color: entry.side === 'you' ? '#ffc830' : '#ff8060' }}>
                {entry.side === 'you' ? char.name : result.rival.name}
              </span>{' '}
              {entry.dmg === 0
                ? t('arena.modal.miss')
                : `→ ${entry.dmg}${entry.crit ? ` ${t('arena.modal.crit')}` : ''} dmg`}{' '}
              <span style={{ color: '#a0a0a0' }}>(HP {entry.remainingHp})</span>
            </div>
          ))}
          {!isFinished && (
            <div style={{ color: '#a0a0a0', marginTop: 4 }}>
              <span className="mono">▌</span>
            </div>
          )}
        </div>

        {!isFinished ? (
          <button
            type="button"
            className="cbtn ghost"
            style={{ width: '100%' }}
            onClick={skip}
          >
            {t('arena.modal.skip')}
          </button>
        ) : (
          <button
            type="button"
            className="cbtn primary"
            style={{ width: '100%' }}
            onClick={onClose}
          >
            {t('arena.modal.close')}
          </button>
        )}
      </div>
    </div>
  );
}
