import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { useUnlockQueue } from '@/api/unlock-queue-store';
import { useT, tStatic } from '@/i18n';
import { GuildEmblem } from './GuildEmblem';

export interface DeclareWarModalProps {
  onClose: () => void;
}

export function DeclareWarModal({ onClose }: DeclareWarModalProps) {
  const t = useT();
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  const pushUnlocks = useUnlockQueue((s) => s.push);

  const browseQuery = trpc.guildWars.browse.useQuery();

  const declareMut = trpc.guildWars.declare.useMutation({
    onSuccess: (data) => {
      if (data.unlockedAchievements?.length) pushUnlocks(data.unlockedAchievements);
      pushToast({ text: tStatic('guildWars.declare.toast.success'), accent: '#2a4a3a' });
      void utils.guildWars.list.invalidate();
      void utils.guild.get.invalidate();
      onClose();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : tStatic('guildWars.declare.toast.fail'),
        accent: '#c83232',
        ttlMs: 4500,
      });
    },
  });

  const targets = browseQuery.data?.targets ?? [];

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
          maxWidth: 380,
          background: '#f3ead9',
          padding: 16,
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div className="h-display" style={{ fontSize: 18, textAlign: 'center', marginBottom: 8 }}>
          {t('guildWars.declareTitle')}
        </div>
        {browseQuery.data && (
          <div
            style={{
              fontSize: 13,
              color: '#5a3a2a',
              textAlign: 'center',
              marginBottom: 10,
            }}
          >
            {t('guildWars.declare.myAvg')}<b className="mono">{browseQuery.data.myAvgLvl.toFixed(1)}</b>{t('guildWars.declare.band')}
          </div>
        )}
        {browseQuery.isLoading && (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#5a3a2a' }}>{t('guildWars.declare.searching')}</div>
        )}
        {!browseQuery.isLoading && targets.length === 0 && (
          <div
            className="flavor"
            style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', padding: 12 }}
          >
            {t('guildWars.declare.empty')}
          </div>
        )}
        {targets.map((target) => (
          <div
            key={target.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 8,
              marginBottom: 6,
              border: '2px solid #2a1810',
              borderRadius: 8,
              background: '#fff7e0',
            }}
          >
            <GuildEmblem kind={target.emblemKind} color={target.emblemColor} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="h-title" style={{ fontSize: 13, lineHeight: 1 }}>
                {target.name}{' '}
                <span className="mono" style={{ fontSize: 13, opacity: 0.7 }}>
                  [{target.tag}]
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#5a3a2a' }}>
                {t('guildWars.declare.target.line')
                  .replace('{avg}', target.avgLvl.toFixed(1))
                  .replace('{n}', String(target.memberCount))
                  .replace('{glory}', String(target.glory))}
              </div>
            </div>
            <button
              type="button"
              className="cbtn red sm"
              disabled={declareMut.isPending}
              onClick={() => declareMut.mutate({ defenderGuildId: target.id })}
            >
              {t('guildWars.declare.btn')}
            </button>
          </div>
        ))}
        <button
          type="button"
          className="cbtn ghost sm"
          style={{ width: '100%', marginTop: 8 }}
          onClick={onClose}
        >
          {t('guildWars.declare.cancel')}
        </button>
      </div>
    </div>
  );
}
