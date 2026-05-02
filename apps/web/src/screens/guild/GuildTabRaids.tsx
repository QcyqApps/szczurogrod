import { useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { useUnlockQueue } from '@/api/unlock-queue-store';
import { GameIcon } from '@/components/game-icons';
import { GemSinkButton } from '@/components/ui-common';
import { IcoCoin, IcoGem } from '@/components/icons';
import { useT, tStatic, useContentT , translateServerError} from '@/i18n';
import { GEM_SINK_COSTS, type GuildRaidHitResponse, type IconName } from '@grodno/shared';
import { RaidHitResultModal } from './components/RaidHitResultModal';

export function GuildTabRaids() {
  const t = useT();
  const tc = useContentT();
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  const pushUnlocks = useUnlockQueue((s) => s.push);
  const meQuery = trpc.me.get.useQuery();
  const currentQuery = trpc.guildRaids.current.useQuery(undefined, {
    refetchInterval: 20_000,
  });
  const historyQuery = trpc.guildRaids.history.useQuery();
  const buyHitMut = trpc.guildRaids.buyExtraHit.useMutation({
    onSuccess: () => {
      pushToast({ text: tStatic('guildRaids.toast.bought'), accent: '#2a4a3a' });
      void utils.guildRaids.current.invalidate();
      void utils.me.get.invalidate();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? translateServerError(err.message) : tStatic('guildRaids.toast.fail'),
        accent: '#c83232',
      });
    },
  });

  const [result, setResult] = useState<GuildRaidHitResponse | null>(null);
  const [prevBossName, setPrevBossName] = useState<string>('');

  const hitMut = trpc.guildRaids.hit.useMutation({
    onSuccess: (data) => {
      if (data.unlockedAchievements?.length) pushUnlocks(data.unlockedAchievements);
      setResult(data);
      void utils.guildRaids.current.invalidate();
      void utils.guildRaids.history.invalidate();
      void utils.guild.get.invalidate();
      void utils.guildTreasury.log.invalidate();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? translateServerError(err.message) : tStatic('guildRaids.toast.hitFail'),
        accent: '#c83232',
      });
    },
  });

  if (currentQuery.isLoading) {
    return (
      <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: '#5a3a2a' }}>
        {t('guildRaids.loading')}
      </div>
    );
  }
  if (!currentQuery.data) return null;

  const { boss, myHitsToday, myHitsMax, leaderboard } = currentQuery.data;
  const hpPct = Math.max(0, Math.min(100, Math.round((boss.hpCurrent / boss.hpMax) * 100)));
  const canHit = myHitsToday < myHitsMax && !hitMut.isPending;
  const hitsLeft = Math.max(0, myHitsMax - myHitsToday);

  return (
    <div style={{ padding: 12 }}>
      {/* Boss panel */}
      <div
        className="panel"
        style={{
          padding: 14,
          marginBottom: 12,
          background: 'linear-gradient(180deg, #4a2a2a 0%, #2a1a1a 100%)',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <div className="mono" style={{ fontSize: 10, opacity: 0.7, marginBottom: 4 }}>
          {t('guildRaids.tier').replace('{n}', String(boss.tier))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 10,
              border: '3px solid #2a1810',
              background: '#e8c870',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '3px 3px 0 #2a1810',
            }}
          >
            <GameIcon name={boss.icon as IconName} size={54} />
          </div>
        </div>
        <div className="h-display" style={{ fontSize: 22, color: '#ffc830', marginBottom: 2 }}>
          {tc.raidBossName(boss.slug, boss.name)}
        </div>
        <div className="flavor light" style={{ fontSize: 14, marginBottom: 10 }}>
          {tc.raidBossFlavor(boss.slug, boss.flavor)}
        </div>

        {/* HP bar */}
        <div
          style={{
            position: 'relative',
            height: 22,
            background: '#1a1010',
            border: '2.5px solid #2a1810',
            borderRadius: 6,
            overflow: 'hidden',
            marginBottom: 6,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: `${hpPct}%`,
              background: hpPct > 40 ? '#c83232' : hpPct > 15 ? '#d48030' : '#8a3030',
              transition: 'width 0.4s ease-out',
            }}
          />
          <div
            className="mono"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
              textShadow: '1px 1px 0 #2a1810',
            }}
          >
            {boss.hpCurrent.toLocaleString('pl-PL')} / {boss.hpMax.toLocaleString('pl-PL')}
          </div>
        </div>

        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
          {t('guildRaids.hits.line')}<b className="mono">{myHitsToday}/{myHitsMax}</b>{t('guildRaids.hits.reset')}
        </div>

        <button
          type="button"
          className="cbtn red"
          style={{ width: '100%' }}
          disabled={!canHit}
          onClick={() => {
            setPrevBossName(tc.raidBossName(boss.slug, boss.name));
            hitMut.mutate();
          }}
        >
          {hitMut.isPending
            ? t('guildRaids.btn.pending')
            : hitsLeft === 0
              ? t('guildRaids.btn.none')
              : t('guildRaids.btn.hit').replace('{n}', String(hitsLeft))}
        </button>
        {hitsLeft === 0 && (
          <div style={{ marginTop: 6, textAlign: 'center' }}>
            <GemSinkButton
              label={t('guildRaids.btn.buy')}
              cost={GEM_SINK_COSTS.extraRaidHit}
              playerGems={meQuery.data?.gems ?? 0}
              pending={buyHitMut.isPending}
              onClick={() => buyHitMut.mutate()}
            />
          </div>
        )}
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <>
          <div className="h-title" style={{ fontSize: 14, marginBottom: 6 }}>
            {t('guildRaids.top')}
          </div>
          <div className="panel" style={{ padding: 4, marginBottom: 12 }}>
            {leaderboard.map((l, i, arr) => (
              <div
                key={l.characterId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  borderBottom: i < arr.length - 1 ? '1.5px dashed #c8b890' : 'none',
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 12, opacity: 0.6, minWidth: 22, textAlign: 'center' }}
                >
                  #{i + 1}
                </span>
                <span className="h-title" style={{ fontSize: 13, flex: 1 }}>
                  {l.name}
                </span>
                <span className="mono" style={{ fontSize: 12, color: '#7a6040' }}>
                  {t('guildRaids.top.line')
                    .replace('{dmg}', l.totalDmg.toLocaleString('pl-PL'))
                    .replace('{n}', String(l.hitCount))}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* History */}
      {historyQuery.data && historyQuery.data.entries.length > 0 && (
        <>
          <div className="h-title" style={{ fontSize: 14, marginBottom: 6 }}>
            {t('guildRaids.trophies')}
          </div>
          <div className="panel" style={{ padding: 4 }}>
            {historyQuery.data.entries.map((e, i, arr) => (
              <div
                key={e.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  borderBottom: i < arr.length - 1 ? '1.5px dashed #c8b890' : 'none',
                }}
              >
                <GameIcon name={e.bossIcon as IconName} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="h-title" style={{ fontSize: 12 }}>
                    {e.bossName}{' '}
                    <span className="mono" style={{ fontSize: 13, opacity: 0.7 }}>
                      T{e.tier}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: '#5a3a2a' }}>
                    {e.killingBlowCharName
                      ? t('guildRaids.trophy.kb').replace('{name}', e.killingBlowCharName)
                      : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center', fontSize: 13 }}>
                  <IcoCoin s={12} />
                  <span className="mono">{500 * e.tier + 200}</span>
                  {Math.floor(e.tier / 2) > 0 && (
                    <>
                      <IcoGem s={10} />
                      <span className="mono">{Math.floor(e.tier / 2)}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {result && (
        <RaidHitResultModal
          result={result}
          previousBossName={prevBossName}
          onClose={() => setResult(null)}
        />
      )}
    </div>
  );
}
