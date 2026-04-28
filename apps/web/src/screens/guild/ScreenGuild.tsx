import { useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { useT, type DictKey } from '@/i18n';
import { GuildNoneView } from './GuildNoneView';
import { GuildTabMembers } from './GuildTabMembers';
import { GuildTabChat } from './GuildTabChat';
import { GuildTabTreasury } from './GuildTabTreasury';
import { GuildTabBuildings } from './GuildTabBuildings';
import { GuildTabWars } from './GuildTabWars';
import { GuildTabRaids } from './GuildTabRaids';
import { GuildEmblem } from './components/GuildEmblem';

type Tab = 'members' | 'chat' | 'treasury' | 'buildings' | 'wars' | 'raids';

const TAB_LABEL_KEY: Record<Tab, DictKey> = {
  members: 'guild.tab.members',
  chat: 'guild.tab.chat',
  treasury: 'guild.tab.treasury',
  buildings: 'guild.tab.buildings',
  wars: 'guild.tab.wars',
  raids: 'guild.tab.raids',
};

export function ScreenGuild() {
  const meQuery = trpc.me.get.useQuery();
  const char = meQuery.data;

  if (!char) return null;

  if (!char.guild) return <GuildNoneView />;
  return <GuildMemberView myCharId={char.id} />;
}

function GuildMemberView({ myCharId }: { myCharId: string }) {
  const t = useT();
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  const guildQuery = trpc.guild.get.useQuery();
  const [tab, setTab] = useState<Tab>('members');
  const [confirmLeave, setConfirmLeave] = useState(false);

  const leaveMut = trpc.guild.leave.useMutation({
    onSuccess: () => {
      void utils.me.get.invalidate();
      setConfirmLeave(false);
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : t('guild.toast.leaveFailed'),
        accent: '#c83232',
      });
    },
  });

  const disbandMut = trpc.guild.disband.useMutation({
    onSuccess: () => {
      void utils.me.get.invalidate();
      setConfirmLeave(false);
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : t('guild.toast.disbandFailed'),
        accent: '#c83232',
      });
    },
  });

  if (guildQuery.isLoading || !guildQuery.data) {
    return (
      <div className="screen-in" style={{ padding: 12 }}>
        <div style={{ textAlign: 'center', fontSize: 13, color: '#5a3a2a', padding: 20 }}>
          {t('guild.loading')}
        </div>
      </div>
    );
  }

  const data = guildQuery.data;
  const isLeader = data.myRank === 'leader';

  return (
    <div className="screen-in">
      {/* Header */}
      <div
        className="panel"
        style={{
          margin: 12,
          padding: 14,
          background: 'linear-gradient(180deg, #3a5a8a 0%, #1e3a6a 100%)',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <GuildEmblem kind={data.guild.emblemKind} color={data.guild.emblemColor} size={68} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="h-display"
              style={{ fontSize: 20, color: '#ffc830', lineHeight: 1.1 }}
            >
              {data.guild.name}{' '}
              <span
                className="mono"
                style={{ fontSize: 14, opacity: 0.8, color: '#fff' }}
              >
                [{data.guild.tag}]
              </span>
            </div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              {t('guild.level').replace('{n}', String(data.guild.level))}
            </div>
            {data.guild.motto && (
              <div className="flavor light" style={{ fontSize: 14, marginTop: 2 }}>
                {data.guild.motto}
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            marginTop: 10,
            textAlign: 'center',
          }}
        >
          <div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>
              {data.members.length}/{data.guild.memberCap}
            </div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>{t('guild.stats.members')}</div>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>
              {data.guild.glory.toLocaleString('pl-PL')}
            </div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>{t('guild.stats.glory')}</div>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>
              {data.guild.treasuryGold.toLocaleString('pl-PL')}g
            </div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>{t('guild.stats.treasury')}</div>
          </div>
        </div>
      </div>

      {/* Tab pills */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 4,
          padding: '0 12px',
          marginBottom: 4,
        }}
      >
        {(Object.keys(TAB_LABEL_KEY) as Tab[]).map((key) => {
          const active = key === tab;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                padding: '6px 2px',
                borderRadius: 8,
                border: '2.5px solid #2a1810',
                background: active ? '#ffc830' : '#e8dcb9',
                color: '#2a1810',
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: 0.3,
                boxShadow: active ? '2px 2px 0 #2a1810' : 'none',
                cursor: 'pointer',
              }}
              className="h-title"
            >
              {t(TAB_LABEL_KEY[key])}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'members' && <GuildTabMembers data={data} myCharId={myCharId} />}
      {tab === 'chat' && <GuildTabChat />}
      {tab === 'treasury' && <GuildTabTreasury data={data} />}
      {tab === 'buildings' && <GuildTabBuildings myRank={data.myRank} />}
      {tab === 'wars' && <GuildTabWars myRank={data.myRank} />}
      {tab === 'raids' && <GuildTabRaids />}

      {/* Leave / disband */}
      <div style={{ padding: 12, borderTop: '1.5px dashed #c8b890', marginTop: 8 }}>
        <button
          type="button"
          className="cbtn ghost sm"
          style={{ width: '100%' }}
          onClick={() => setConfirmLeave(true)}
        >
          {isLeader ? t('guild.btn.disband') : t('guild.btn.leave')}
        </button>
      </div>

      {confirmLeave && (
        <div
          onClick={() => setConfirmLeave(false)}
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
            <div
              className="h-display"
              style={{ fontSize: 18, textAlign: 'center', marginBottom: 10 }}
            >
              {isLeader ? t('guild.confirm.disband.title') : t('guild.confirm.leave.title')}
            </div>
            <div
              className="flavor"
              style={{
                fontSize: 14,
                color: '#5a3a2a',
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              {isLeader
                ? t('guild.confirm.disband.body')
                : t('guild.confirm.leave.body')}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="cbtn ghost sm"
                style={{ flex: 1 }}
                onClick={() => setConfirmLeave(false)}
              >
                {t('guild.confirm.cancel')}
              </button>
              <button
                type="button"
                className="cbtn red sm"
                style={{ flex: 1 }}
                disabled={leaveMut.isPending || disbandMut.isPending}
                onClick={() => {
                  if (isLeader) disbandMut.mutate();
                  else leaveMut.mutate();
                }}
              >
                {isLeader ? t('guild.confirm.disband.btn') : t('guild.confirm.leave.btn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
