import { useEffect, useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { GameIcon } from '@/components/game-icons';
import { IcoClock } from '@/components/icons';
import { useT, tStatic , translateServerError} from '@/i18n';
import type { GuildRank, GuildWarSummary } from '@grodno/shared';
import { DeclareWarModal } from './components/DeclareWarModal';
import { WarLineupEditor } from './components/WarLineupEditor';
import { WarResultModal } from './components/WarResultModal';

export interface GuildTabWarsProps {
  myRank: GuildRank;
}

export function GuildTabWars({ myRank }: GuildTabWarsProps) {
  const t = useT();
  const listQuery = trpc.guildWars.list.useQuery(undefined, { refetchInterval: 15_000 });

  const [declareOpen, setDeclareOpen] = useState(false);
  const [lineupOpen, setLineupOpen] = useState(false);
  const [resultWarId, setResultWarId] = useState<string | null>(null);

  const active = listQuery.data?.active ?? null;
  const recent = listQuery.data?.recent ?? [];
  const canDeclare = (myRank === 'leader' || myRank === 'officer') && !active;

  return (
    <div style={{ padding: 12 }}>
      {active ? (
        <ActiveWarPanel
          war={active}
          myRank={myRank}
          onReorder={() => setLineupOpen(true)}
        />
      ) : (
        <div className="panel" style={{ padding: 12, marginBottom: 10, textAlign: 'center' }}>
          <div className="h-title" style={{ fontSize: 14, marginBottom: 6 }}>
            {t('guildWars.noActive')}
          </div>
          <div
            className="flavor"
            style={{ fontSize: 14, color: '#5a3a2a', marginBottom: 10 }}
          >
            {t('guildWars.noActive.flavor')}
          </div>
          {canDeclare && (
            <button
              type="button"
              className="cbtn red"
              style={{ width: '100%' }}
              onClick={() => setDeclareOpen(true)}
            >
              {t('guildWars.declare')}
            </button>
          )}
          {!canDeclare && myRank !== 'leader' && myRank !== 'officer' && (
            <div style={{ fontSize: 13, color: '#5a3a2a', fontStyle: 'italic' }}>
              {t('guildWars.officerOnly')}
            </div>
          )}
        </div>
      )}

      {recent.length > 0 && (
        <>
          <div className="h-title" style={{ fontSize: 14, marginBottom: 6, marginTop: 12 }}>
            {t('guildWars.recent')}
          </div>
          <div className="panel" style={{ padding: 4 }}>
            {recent.map((w, i, arr) => (
              <RecentWarRow
                key={w.id}
                war={w}
                lastInList={i === arr.length - 1}
                onClick={() => setResultWarId(w.id)}
              />
            ))}
          </div>
        </>
      )}

      {declareOpen && <DeclareWarModal onClose={() => setDeclareOpen(false)} />}
      {lineupOpen && active && (
        <LineupEditorWrapper warId={active.id} onClose={() => setLineupOpen(false)} />
      )}
      {resultWarId && (
        <ResultModalWrapper warId={resultWarId} onClose={() => setResultWarId(null)} />
      )}
    </div>
  );
}

function ActiveWarPanel({
  war,
  myRank,
  onReorder,
}: {
  war: GuildWarSummary;
  myRank: GuildRank;
  onReorder: () => void;
}) {
  const t = useT();
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);

  const detailsQuery = trpc.guildWars.get.useQuery({ warId: war.id }, {
    refetchInterval: 10_000,
  });

  const commitMut = trpc.guildWars.commit.useMutation({
    onSuccess: () => {
      pushToast({ text: tStatic('guildWars.toast.committed'), accent: '#2a4a3a' });
      void utils.guildWars.get.invalidate({ warId: war.id });
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? translateServerError(err.message) : tStatic('guildWars.toast.commitFail'),
        accent: '#c83232',
      });
    },
  });

  const cancelMut = trpc.guildWars.cancelCommit.useMutation({
    onSuccess: () => {
      pushToast({ text: tStatic('guildWars.toast.cancelled'), accent: '#d4a24c' });
      void utils.guildWars.get.invalidate({ warId: war.id });
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? translateServerError(err.message) : tStatic('guildWars.toast.cancelFail'),
        accent: '#c83232',
      });
    },
  });

  const details = detailsQuery.data;
  const amCommitted = details?.myOrderIndex !== null && details?.myOrderIndex !== undefined;
  const canReorder = myRank === 'leader' || myRank === 'officer';
  const started = war.scheduledAt <= Date.now();

  const myParts = details?.participants.filter((p) => p.side === details.mySide) ?? [];
  const theirParts =
    details?.participants.filter((p) => p.side !== details.mySide) ?? [];

  return (
    <div className="panel" style={{ padding: 12, marginBottom: 10 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <div className="h-title" style={{ fontSize: 14 }}>
          {t('guildWars.title.vs')
            .replace('{a}', war.attackerGuildName)
            .replace('{b}', war.defenderGuildName)}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: '#5a3a2a',
          marginBottom: 8,
        }}
      >
        <IcoClock s={14} />
        <Countdown target={war.scheduledAt} />
        {war.status === 'resolving' && <b style={{ color: '#c83232' }}>· {t('guildWars.resolving')}</b>}
      </div>

      {details && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <SideSummary
              title={
                details.mySide === 'attacker'
                  ? t('guildWars.side.ours.attack')
                  : t('guildWars.side.ours.defense')
              }
              count={myParts.length}
              accent="#2a4a3a"
            />
            <SideSummary
              title={
                details.mySide === 'attacker'
                  ? t('guildWars.side.enemy.defense')
                  : t('guildWars.side.enemy.attack')
              }
              count={theirParts.length}
              accent="#8a3030"
            />
          </div>

          {!started && (
            <div style={{ display: 'flex', gap: 6 }}>
              {!amCommitted ? (
                <button
                  type="button"
                  className="cbtn green sm"
                  style={{ flex: 1 }}
                  disabled={commitMut.isPending}
                  onClick={() => commitMut.mutate({ warId: war.id })}
                >
                  {t('guildWars.commit')}
                </button>
              ) : (
                <button
                  type="button"
                  className="cbtn ghost sm"
                  style={{ flex: 1 }}
                  disabled={cancelMut.isPending}
                  onClick={() => cancelMut.mutate({ warId: war.id })}
                >
                  {t('guildWars.cancelCommit')}
                </button>
              )}
              {canReorder && myParts.length > 0 && (
                <button type="button" className="cbtn sm" style={{ flex: 1 }} onClick={onReorder}>
                  {t('guildWars.lineup').replace('{n}', String(myParts.length))}
                </button>
              )}
            </div>
          )}

          {amCommitted && details.myOrderIndex !== null && (
            <div
              style={{ fontSize: 13, color: '#5a3a2a', textAlign: 'center', marginTop: 6 }}
            >
              {t('guildWars.myPosition')}<b className="mono">#{details.myOrderIndex + 1}</b>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SideSummary({
  title,
  count,
  accent,
}: {
  title: string;
  count: number;
  accent: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: 6,
        border: `2.5px solid ${accent}`,
        borderRadius: 6,
        background: '#fff7e0',
        textAlign: 'center',
      }}
    >
      <div className="h-title" style={{ fontSize: 13, color: accent }}>
        {title}
      </div>
      <div className="mono" style={{ fontSize: 18, fontWeight: 700 }}>
        {count} / 15
      </div>
    </div>
  );
}

function RecentWarRow({
  war,
  lastInList,
  onClick,
}: {
  war: GuildWarSummary;
  lastInList: boolean;
  onClick: () => void;
}) {
  const t = useT();
  const isResolved = war.status === 'resolved';
  const winnerText = isResolved && war.winnerGuildId
    ? war.winnerGuildId === war.attackerGuildId
      ? war.attackerGuildName
      : war.defenderGuildName
    : '—';

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        gap: 8,
        padding: '8px 8px',
        borderBottom: lastInList ? 'none' : '1.5px dashed #c8b890',
        border: 'none',
        background: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <GameIcon name="crossed" size={24} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="h-title" style={{ fontSize: 12, lineHeight: 1 }}>
          {t('guildWars.row.vs')
            .replace('{a}', war.attackerGuildName)
            .replace('{b}', war.defenderGuildName)}
        </div>
        <div className="mono" style={{ fontSize: 10, color: '#5a3a2a' }}>
          {war.status === 'resolved'
            ? t('guildWars.scoreWinner')
                .replace('{score}', `${war.attackerScore}:${war.defenderScore}`)
                .replace('{winner}', winnerText)
            : war.status === 'cancelled'
              ? t('guildWars.cancelled')
              : war.status}
        </div>
      </div>
      <GameIcon name="arrow-right" size={14} />
    </button>
  );
}

function Countdown({ target }: { target: number }) {
  const t = useT();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const handle = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(handle);
  }, []);
  const diff = target - now;
  if (diff <= 0) return <span className="mono">{t('guildWars.startsNow')}</span>;
  const h = Math.floor(diff / 3600_000);
  const m = Math.floor((diff % 3600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return (
    <span className="mono">
      {h}h {m.toString().padStart(2, '0')}m {s.toString().padStart(2, '0')}s
    </span>
  );
}

function LineupEditorWrapper({
  warId,
  onClose,
}: {
  warId: string;
  onClose: () => void;
}) {
  const detailsQuery = trpc.guildWars.get.useQuery({ warId });
  const details = detailsQuery.data;
  if (!details || !details.mySide) return null;
  const myParts = details.participants.filter((p) => p.side === details.mySide);
  return <WarLineupEditor warId={warId} mySideParticipants={myParts} onClose={onClose} />;
}

function ResultModalWrapper({ warId, onClose }: { warId: string; onClose: () => void }) {
  const detailsQuery = trpc.guildWars.get.useQuery({ warId });
  if (!detailsQuery.data) return null;
  return <WarResultModal war={detailsQuery.data} onClose={onClose} />;
}
