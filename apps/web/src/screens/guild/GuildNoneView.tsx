import { useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { useUnlockQueue } from '@/api/unlock-queue-store';
import { GameIcon } from '@/components/game-icons';
import { useT , translateServerError} from '@/i18n';
import { GuildEmblem } from './components/GuildEmblem';
import { GuildCreateModal } from './components/GuildCreateModal';

const COST_GOLD = 5000;
const MIN_LVL = 5;

export function GuildNoneView() {
  const t = useT();
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  const pushUnlocks = useUnlockQueue((s) => s.push);
  const meQuery = trpc.me.get.useQuery();
  const char = meQuery.data;

  const [createOpen, setCreateOpen] = useState(false);
  const [page, setPage] = useState(0);

  const browseQuery = trpc.guild.browse.useQuery({ page });
  const invitesQuery = trpc.guild.myInvites.useQuery();

  const applyMut = trpc.guild.applyToGuild.useMutation({
    onSuccess: () => {
      pushToast({ text: t('guild.none.toast.applied'), accent: '#d4a24c' });
      void utils.guild.browse.invalidate();
      void utils.guild.myInvites.invalidate();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? translateServerError(err.message) : t('guild.none.toast.applyFailed'),
        accent: '#c83232',
      });
    },
  });

  const acceptMut = trpc.guild.acceptInvite.useMutation({
    onSuccess: (data) => {
      if (data.unlockedAchievements?.length) pushUnlocks(data.unlockedAchievements);
      void utils.me.get.invalidate();
      void utils.guild.myInvites.invalidate();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? translateServerError(err.message) : t('guild.none.toast.acceptFailed'),
        accent: '#c83232',
      });
    },
  });

  const declineMut = trpc.guild.declineInvite.useMutation({
    onSuccess: () => {
      void utils.guild.myInvites.invalidate();
    },
  });

  const invites = invitesQuery.data?.invites ?? [];
  const pendingInvites = invites.filter((i) => i.direction === 'invite');
  const pendingApps = invites.filter((i) => i.direction === 'apply');

  const lvlOk = (char?.lvl ?? 0) >= MIN_LVL;
  const goldOk = (char?.gold ?? 0) >= COST_GOLD;

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      {/* Intro banner */}
      <div
        className="panel"
        style={{
          padding: 14,
          marginBottom: 12,
          background: 'linear-gradient(180deg, #3a5a8a 0%, #1e3a6a 100%)',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <div className="h-display" style={{ fontSize: 22, color: '#ffc830' }}>
          {t('guild.none.banner.title')}
        </div>
        <div className="flavor light" style={{ fontSize: 14, marginTop: 4 }}>
          {t('guild.none.banner.flavor')}
        </div>
      </div>

      {/* Create CTA */}
      <div className="panel" style={{ padding: 12, marginBottom: 12 }}>
        <div className="h-title" style={{ fontSize: 14, marginBottom: 6 }}>
          {t('guild.none.create.title')}
        </div>
        <div style={{ fontSize: 12, color: '#5a3a2a', marginBottom: 8 }}>
          {(() => {
            const raw = t('guild.none.create.cost').replace('{lvl}', String(MIN_LVL));
            const [before, after] = raw.split('{gold}');
            return (
              <>
                {before}
                <b className="mono">{COST_GOLD}g</b>
                {after}
              </>
            );
          })()}
        </div>
        <button
          type="button"
          className="cbtn green"
          style={{ width: '100%' }}
          disabled={!lvlOk || !goldOk}
          onClick={() => setCreateOpen(true)}
        >
          {!lvlOk
            ? t('guild.none.create.needLvl').replace('{n}', String(MIN_LVL))
            : !goldOk
              ? t('guild.none.create.needGold').replace('{n}', `${COST_GOLD}g`)
              : t('guild.none.create.btn')}
        </button>
      </div>

      {/* Moje zaproszenia — inbox */}
      {pendingInvites.length > 0 && (
        <div className="panel" style={{ padding: 12, marginBottom: 12 }}>
          <div
            className="h-title"
            style={{ fontSize: 14, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <GameIcon name="scroll" size={14} /> {t('guild.none.invites.title')}
          </div>
          {pendingInvites.map((inv) => (
            <div
              key={inv.guildId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: 8,
                borderTop: '1.5px dashed #c8b890',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="h-title" style={{ fontSize: 13 }}>
                  {inv.guildName}{' '}
                  <span className="mono" style={{ fontSize: 13, opacity: 0.7 }}>
                    [{inv.guildTag}]
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="cbtn green sm"
                disabled={acceptMut.isPending}
                onClick={() => acceptMut.mutate({ guildId: inv.guildId })}
              >
                {t('guild.none.invites.accept')}
              </button>
              <button
                type="button"
                className="cbtn ghost sm"
                disabled={declineMut.isPending}
                onClick={() => declineMut.mutate({ guildId: inv.guildId })}
              >
                {t('guild.none.invites.decline')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Moje pending applications */}
      {pendingApps.length > 0 && (
        <div className="panel" style={{ padding: 12, marginBottom: 12 }}>
          <div className="h-title" style={{ fontSize: 14, marginBottom: 6 }}>
            {t('guild.none.apps.title')}
          </div>
          {pendingApps.map((app) => (
            <div
              key={app.guildId}
              style={{
                fontSize: 12,
                color: '#5a3a2a',
                padding: '4px 0',
                borderTop: '1.5px dashed #c8b890',
              }}
            >
              {app.guildName}{' '}
              <span className="mono" style={{ opacity: 0.7 }}>
                [{app.guildTag}]
              </span>{' '}
              {t('guild.none.apps.waiting')}
            </div>
          ))}
        </div>
      )}

      {/* Browse otwartych gildii */}
      <div
        className="h-title"
        style={{ fontSize: 14, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <GameIcon name="banner" size={14} /> {t('guild.none.browse.title')}
      </div>
      <div className="panel" style={{ padding: 4 }}>
        {browseQuery.isLoading && (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#5a3a2a', padding: 12 }}>
            {t('guild.none.browse.loading')}
          </div>
        )}
        {browseQuery.data && browseQuery.data.guilds.length === 0 && (
          <div
            className="flavor"
            style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', padding: 12 }}
          >
            {t('guild.none.browse.empty')}
          </div>
        )}
        {browseQuery.data?.guilds.map((g, i, arr) => {
          const alreadyApplied = pendingApps.some((a) => a.guildId === g.id);
          const charLvl = char?.lvl ?? 0;
          const levelOk = charLvl >= g.requiredLvl;
          const full = g.memberCount >= g.memberCap;
          return (
            <div
              key={g.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: 8,
                borderBottom: i < arr.length - 1 ? '1.5px dashed #c8b890' : 'none',
              }}
            >
              <GuildEmblem kind={g.emblemKind} color={g.emblemColor} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="h-title" style={{ fontSize: 13, lineHeight: 1 }}>
                  {g.name}{' '}
                  <span className="mono" style={{ fontSize: 13, opacity: 0.7 }}>
                    [{g.tag}]
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#5a3a2a' }}>
                  {t('guild.none.browse.row.meta')
                    .replace('{lvl}', String(g.level))
                    .replace('{count}', String(g.memberCount))
                    .replace('{cap}', String(g.memberCap))
                    .replace('{req}', String(g.requiredLvl))}
                </div>
              </div>
              <button
                type="button"
                className="cbtn sm"
                disabled={alreadyApplied || !levelOk || full || applyMut.isPending}
                onClick={() => applyMut.mutate({ guildId: g.id })}
              >
                {alreadyApplied
                  ? t('guild.none.browse.btn.sent')
                  : full
                    ? t('guild.none.browse.btn.full')
                    : !levelOk
                      ? t('guild.none.browse.btn.lowLvl')
                      : t('guild.none.browse.btn.apply')}
              </button>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {browseQuery.data && (browseQuery.data.hasMore || page > 0) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            type="button"
            className="cbtn ghost sm"
            style={{ flex: 1 }}
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            {t('guild.none.page.prev')}
          </button>
          <button
            type="button"
            className="cbtn ghost sm"
            style={{ flex: 1 }}
            disabled={!browseQuery.data.hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('guild.none.page.next')}
          </button>
        </div>
      )}

      {createOpen && <GuildCreateModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}
