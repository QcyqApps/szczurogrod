import { useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { useUnlockQueue } from '@/api/unlock-queue-store';
import { GameIcon } from '@/components/game-icons';
import { PortraitByClass } from '@/components/portraits';
import { useT, tStatic, type DictKey , translateServerError} from '@/i18n';
import type { GuildGetResponse, GuildMember, GuildRank } from '@grodno/shared';
import { GuildInviteModal } from './components/GuildInviteModal';

export interface GuildTabMembersProps {
  data: GuildGetResponse;
  myCharId: string;
}

const RANK_LABEL_KEY: Record<GuildRank, DictKey> = {
  leader: 'guildMembers.rank.leader',
  officer: 'guildMembers.rank.officer',
  member: 'guildMembers.rank.member',
  recruit: 'guildMembers.rank.recruit',
};

export function GuildTabMembers({ data, myCharId }: GuildTabMembersProps) {
  const t = useT();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [confirmLeader, setConfirmLeader] = useState<GuildMember | null>(null);

  const myRank = data.myRank;
  const canInvite = myRank === 'leader' || myRank === 'officer';

  return (
    <div style={{ padding: 12 }}>
      {/* Header actions */}
      {canInvite && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button
            type="button"
            className="cbtn sm"
            style={{ flex: 1 }}
            onClick={() => setInviteOpen(true)}
          >
            {t('guildMembers.invite')}
          </button>
          <button
            type="button"
            className="cbtn ghost sm"
            style={{ flex: 1 }}
            onClick={() => setAppsOpen(true)}
          >
            {t('guildMembers.applications')}
          </button>
        </div>
      )}

      <div
        className="h-title"
        style={{ fontSize: 14, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <GameIcon name="helmet" size={14} />{' '}
        {t('guildMembers.title')
          .replace('{count}', String(data.members.length))
          .replace('{cap}', String(data.guild.memberCap))}
      </div>

      {data.members.length === 1 && (
        <div
          className="flavor"
          style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', padding: 8 }}
        >
          {t('guildMembers.empty')}
        </div>
      )}

      <div className="panel" style={{ padding: 4 }}>
        {data.members.map((m, i, arr) => (
          <MemberRow
            key={m.characterId}
            member={m}
            isMe={m.characterId === myCharId}
            myRank={myRank}
            lastInList={i === arr.length - 1}
            onTransferLeader={() => setConfirmLeader(m)}
          />
        ))}
      </div>

      {inviteOpen && <GuildInviteModal onClose={() => setInviteOpen(false)} />}
      {appsOpen && <ApplicationsModal onClose={() => setAppsOpen(false)} />}
      {confirmLeader && (
        <ConfirmTransferModal
          target={confirmLeader}
          onClose={() => setConfirmLeader(null)}
        />
      )}
    </div>
  );
}

// ---------- MemberRow ----------

interface MemberRowProps {
  member: GuildMember;
  isMe: boolean;
  myRank: GuildRank;
  lastInList: boolean;
  onTransferLeader: () => void;
}

function MemberRow({ member, isMe, myRank, lastInList, onTransferLeader }: MemberRowProps) {
  const t = useT();
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  const pushUnlocks = useUnlockQueue((s) => s.push);
  const [menuOpen, setMenuOpen] = useState(false);

  const invalidate = () => {
    void utils.guild.get.invalidate();
    void utils.me.get.invalidate();
  };

  const handleError = (err: unknown) => {
    pushToast({
      text: err instanceof TRPCClientError ? translateServerError(err.message) : tStatic('guildMembers.toast.failed'),
      accent: '#c83232',
    });
  };

  const withUnlocks = (data: { unlockedAchievements?: readonly unknown[] }) => {
    if (Array.isArray(data.unlockedAchievements) && data.unlockedAchievements.length > 0) {
      pushUnlocks(data.unlockedAchievements as never);
    }
  };

  const promoteMut = trpc.guild.promote.useMutation({
    onSuccess: (data) => {
      withUnlocks(data);
      invalidate();
    },
    onError: handleError,
  });

  const demoteMut = trpc.guild.demote.useMutation({
    onSuccess: invalidate,
    onError: handleError,
  });

  const kickMut = trpc.guild.kick.useMutation({
    onSuccess: invalidate,
    onError: handleError,
  });

  const canPromote = canPromoteClient(myRank, member.rank);
  const canDemote = canDemoteClient(myRank, member.rank);
  const canKick = canKickClient(myRank, member.rank);
  const canTransfer = myRank === 'leader' && !isMe && member.rank !== 'leader';

  const hasAnyAction = !isMe && (canPromote || canDemote || canKick || canTransfer);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 8px',
        borderBottom: lastInList ? 'none' : '1.5px dashed #c8b890',
        background: isMe ? '#fff7e0' : 'transparent',
        borderRadius: isMe ? 8 : 0,
        position: 'relative',
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 999,
          overflow: 'hidden',
          border: '2.5px solid #2a1810',
          flexShrink: 0,
        }}
      >
        <PortraitByClass cls={member.cls} size={42} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="h-title" style={{ fontSize: 14, lineHeight: 1 }}>
          {member.name}
          {isMe && t('guildMembers.you')}
        </div>
        <div style={{ fontSize: 13, color: '#5a3a2a' }}>
          {t(RANK_LABEL_KEY[member.rank])} · LVL {member.lvl} · {timeAgo(member.lastActiveAt)}
        </div>
        {member.contributedGold > 0 && (
          <div className="mono" style={{ fontSize: 10, color: '#7a6040' }}>
            {t('guildMembers.contributedGold').replace('{n}', String(member.contributedGold))}
          </div>
        )}
      </div>

      {member.rank === 'leader' && (
        <span
          className="pip gold"
          style={{ fontSize: 10, lineHeight: 0, padding: 4 }}
          title={t('guildMembers.leaderTitle')}
        >
          <GameIcon name="crown" size={14} />
        </span>
      )}

      {hasAnyAction && (
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: '2px solid #2a1810',
            background: '#fff7e0',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 700,
            padding: 0,
          }}
          aria-label={t('guildMembers.actionsAria')}
        >
          ···
        </button>
      )}

      {menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 8,
              zIndex: 101,
              background: '#fff7e0',
              border: '2.5px solid #2a1810',
              borderRadius: 8,
              boxShadow: '2px 2px 0 #2a1810',
              padding: 4,
              minWidth: 160,
            }}
          >
            {canPromote && (
              <MenuItem
                label={t('guildMembers.action.promote')}
                disabled={promoteMut.isPending}
                onClick={() => {
                  setMenuOpen(false);
                  promoteMut.mutate({ characterId: member.characterId });
                }}
              />
            )}
            {canDemote && (
              <MenuItem
                label={t('guildMembers.action.demote')}
                disabled={demoteMut.isPending}
                onClick={() => {
                  setMenuOpen(false);
                  demoteMut.mutate({ characterId: member.characterId });
                }}
              />
            )}
            {canTransfer && (
              <MenuItem
                label={t('guildMembers.action.transfer')}
                onClick={() => {
                  setMenuOpen(false);
                  onTransferLeader();
                }}
              />
            )}
            {canKick && (
              <MenuItem
                label={t('guildMembers.action.kick')}
                danger
                disabled={kickMut.isPending}
                onClick={() => {
                  setMenuOpen(false);
                  kickMut.mutate({ characterId: member.characterId });
                }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------- MenuItem ----------

interface MenuItemProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

function MenuItem({ label, onClick, disabled, danger }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'block',
        width: '100%',
        padding: '6px 10px',
        textAlign: 'left',
        border: 'none',
        background: 'transparent',
        fontFamily: 'inherit',
        fontSize: 13,
        color: danger ? '#8a3030' : '#2a1810',
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: 4,
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#e8dcb9')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
    >
      {label}
    </button>
  );
}

// ---------- Applications modal ----------

interface ApplicationsModalProps {
  onClose: () => void;
}

function ApplicationsModal({ onClose }: ApplicationsModalProps) {
  const t = useT();
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  const listQuery = trpc.guild.pendingApplications.useQuery();

  const approveMut = trpc.guild.approveApplication.useMutation({
    onSuccess: () => {
      pushToast({ text: tStatic('guildMembers.toast.accepted'), accent: '#2a4a3a' });
      void utils.guild.get.invalidate();
      void utils.guild.pendingApplications.invalidate();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? translateServerError(err.message) : tStatic('guildMembers.toast.failed'),
        accent: '#c83232',
      });
    },
  });

  const rejectMut = trpc.guild.rejectApplication.useMutation({
    onSuccess: () => {
      void utils.guild.pendingApplications.invalidate();
    },
  });

  const applications = listQuery.data?.applications ?? [];
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 220,
        background: 'rgba(42,24,16,0.65)',
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
          background: '#f3ead9',
          padding: 16,
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <div className="h-display" style={{ fontSize: 18, textAlign: 'center', marginBottom: 10 }}>
          {t('guildMembers.apps.title').replace('{count}', String(applications.length))}
        </div>
        {listQuery.isLoading && (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#5a3a2a' }}>
            {t('guildMembers.apps.loading')}
          </div>
        )}
        {!listQuery.isLoading && applications.length === 0 && (
          <div
            className="flavor"
            style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', padding: 12 }}
          >
            {t('guildMembers.apps.empty')}
          </div>
        )}
        {applications.map((a) => (
          <div
            key={a.characterId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: 6,
              marginBottom: 6,
              border: '2px solid #2a1810',
              borderRadius: 8,
              background: '#fff7e0',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                overflow: 'hidden',
                border: '2px solid #2a1810',
                flexShrink: 0,
              }}
            >
              <PortraitByClass cls={a.cls} size={34} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="h-title" style={{ fontSize: 13 }}>
                {a.name}
              </div>
              <div style={{ fontSize: 13, color: '#5a3a2a' }}>
                {t(RANK_LABEL_KEY.recruit)} · LVL {a.lvl} · {timeAgo(a.createdAt)}
              </div>
            </div>
            <button
              type="button"
              className="cbtn green sm"
              disabled={approveMut.isPending}
              onClick={() => approveMut.mutate({ characterId: a.characterId })}
            >
              {t('guildMembers.apps.accept')}
            </button>
            <button
              type="button"
              className="cbtn ghost sm"
              disabled={rejectMut.isPending}
              onClick={() => rejectMut.mutate({ characterId: a.characterId })}
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="cbtn ghost sm" style={{ width: '100%' }} onClick={onClose}>
          {t('guildMembers.apps.close')}
        </button>
      </div>
    </div>
  );
}

// ---------- Confirm transfer leader ----------

interface ConfirmTransferModalProps {
  target: GuildMember;
  onClose: () => void;
}

function ConfirmTransferModal({ target, onClose }: ConfirmTransferModalProps) {
  const t = useT();
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  const pushUnlocks = useUnlockQueue((s) => s.push);
  const transferMut = trpc.guild.transferLeader.useMutation({
    onSuccess: (data) => {
      if (data.unlockedAchievements?.length) pushUnlocks(data.unlockedAchievements);
      void utils.guild.get.invalidate();
      void utils.me.get.invalidate();
      onClose();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? translateServerError(err.message) : tStatic('guildMembers.toast.failed'),
        accent: '#c83232',
      });
    },
  });

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
        animation: 'modal-fade-in 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel"
        style={{ width: '100%', maxWidth: 320, background: '#f3ead9', padding: 16 }}
      >
        <div className="h-display" style={{ fontSize: 18, textAlign: 'center', marginBottom: 10 }}>
          {t('guildMembers.transfer.title')}
        </div>
        <div
          className="flavor"
          style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', marginBottom: 12 }}
        >
          {t('guildMembers.transfer.body').replace('{name}', target.name)}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="cbtn ghost sm" style={{ flex: 1 }} onClick={onClose}>
            {t('guildMembers.transfer.cancel')}
          </button>
          <button
            type="button"
            className="cbtn red sm"
            style={{ flex: 1 }}
            disabled={transferMut.isPending}
            onClick={() => transferMut.mutate({ characterId: target.characterId })}
          >
            {t('guildMembers.transfer.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Helpers ----------

function canPromoteClient(myRank: GuildRank, targetRank: GuildRank): boolean {
  if (myRank === 'leader') {
    return targetRank === 'recruit' || targetRank === 'member';
  }
  if (myRank === 'officer') {
    return targetRank === 'recruit';
  }
  return false;
}

function canDemoteClient(myRank: GuildRank, targetRank: GuildRank): boolean {
  if (myRank !== 'leader') return false;
  return targetRank === 'officer' || targetRank === 'member';
}

function canKickClient(myRank: GuildRank, targetRank: GuildRank): boolean {
  if (targetRank === 'leader') return false;
  if (myRank === 'leader') {
    return targetRank === 'officer' || targetRank === 'member' || targetRank === 'recruit';
  }
  if (myRank === 'officer') {
    return targetRank === 'member' || targetRank === 'recruit';
  }
  return false;
}

function timeAgo(ms: number): string {
  const delta = Date.now() - ms;
  if (delta < 60_000) return tStatic('guildMembers.time.justNow');
  if (delta < 3600_000)
    return tStatic('guildMembers.time.minAgo').replace('{n}', String(Math.floor(delta / 60_000)));
  if (delta < 86400_000)
    return tStatic('guildMembers.time.hAgo').replace('{n}', String(Math.floor(delta / 3600_000)));
  return tStatic('guildMembers.time.dAgo').replace('{n}', String(Math.floor(delta / 86400_000)));
}
