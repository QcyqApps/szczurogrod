import { useState } from 'react';
import { trpc } from '@/api/trpc';
import { IcoCoin, IcoGem } from '@/components/icons';
import type { GuildGetResponse } from '@grodno/shared';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';

export interface GuildTabTreasuryProps {
  data: GuildGetResponse;
}

export function GuildTabTreasury({ data }: GuildTabTreasuryProps) {
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const logQuery = trpc.guildTreasury.log.useQuery();

  const myRank = data.myRank;
  const canWithdrawGold = myRank === 'leader' || myRank === 'officer';
  const canWithdrawGems = myRank === 'leader';
  const canWithdraw = canWithdrawGold || canWithdrawGems;

  return (
    <div style={{ padding: 12 }}>
      <div className="panel" style={{ padding: 14, marginBottom: 12, textAlign: 'center' }}>
        <div className="h-title" style={{ fontSize: 14, marginBottom: 10 }}>
          SKARBIEC
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 10 }}>
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <IcoCoin s={24} />
              <span className="mono" style={{ fontSize: 22, fontWeight: 700 }}>
                {data.guild.treasuryGold.toLocaleString('pl-PL')}
              </span>
            </div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>ZŁOTO</div>
          </div>
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <IcoGem s={24} />
              <span className="mono" style={{ fontSize: 22, fontWeight: 700 }}>
                {data.guild.treasuryGems.toLocaleString('pl-PL')}
              </span>
            </div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>GEMY</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="cbtn green sm"
            style={{ flex: 1 }}
            onClick={() => setDepositOpen(true)}
          >
            WPŁAĆ
          </button>
          {canWithdraw && (
            <button
              type="button"
              className="cbtn sm"
              style={{ flex: 1 }}
              onClick={() => setWithdrawOpen(true)}
            >
              WYPŁAĆ
            </button>
          )}
        </div>
      </div>

      <WithdrawCapInfo
        dailyUsed={logQuery.data?.dailyWithdrawalSum}
        dailyCap={logQuery.data?.dailyWithdrawalCap}
        canWithdraw={canWithdraw}
      />

      <div className="h-title" style={{ fontSize: 14, marginBottom: 6, marginTop: 12 }}>
        HISTORIA
      </div>
      <div className="panel" style={{ padding: 4 }}>
        {logQuery.isLoading && (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#5a3a2a', padding: 8 }}>
            Ładuję log...
          </div>
        )}
        {logQuery.data?.entries.length === 0 && (
          <div
            className="flavor"
            style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', padding: 8 }}
          >
            Pusto. Nikt niczego nie ruszył.
          </div>
        )}
        {logQuery.data?.entries.map((e, i, arr) => (
          <LogRow key={e.id} entry={e} lastInList={i === arr.length - 1} />
        ))}
      </div>

      <TopContributors members={data.members} />

      {depositOpen && <DepositModal onClose={() => setDepositOpen(false)} />}
      {withdrawOpen && (
        <WithdrawModal
          onClose={() => setWithdrawOpen(false)}
          myRank={myRank}
          treasuryGold={data.guild.treasuryGold}
          treasuryGems={data.guild.treasuryGems}
          dailyUsed={logQuery.data?.dailyWithdrawalSum ?? 0}
          dailyCap={logQuery.data?.dailyWithdrawalCap ?? 0}
        />
      )}
    </div>
  );
}

function WithdrawCapInfo({
  dailyUsed,
  dailyCap,
  canWithdraw,
}: {
  dailyUsed: number | undefined;
  dailyCap: number | undefined;
  canWithdraw: boolean;
}) {
  if (!canWithdraw) return null;
  if (dailyUsed === undefined || dailyCap === undefined) return null;
  const remaining = Math.max(0, dailyCap - dailyUsed);
  return (
    <div
      style={{
        fontSize: 13,
        color: '#5a3a2a',
        textAlign: 'center',
        marginBottom: 4,
      }}
    >
      Dzienny limit wypłaty:{' '}
      <b className="mono">
        {remaining.toLocaleString('pl-PL')}g / {dailyCap.toLocaleString('pl-PL')}g
      </b>
    </div>
  );
}

function LogRow({
  entry,
  lastInList,
}: {
  entry: {
    id: string;
    actorName: string;
    kind: 'deposit' | 'withdraw' | 'building_upgrade' | 'war_reward' | 'raid_reward';
    goldDelta: number;
    gemsDelta: number;
    memo: string;
    createdAt: number;
  };
  lastInList: boolean;
}) {
  const KIND_LABEL: Record<typeof entry.kind, string> = {
    deposit: 'wpłata',
    withdraw: 'wypłata',
    building_upgrade: 'upgrade',
    war_reward: 'wojna',
    raid_reward: 'rajd',
  };
  const gold = entry.goldDelta;
  const gems = entry.gemsDelta;
  const color = gold > 0 || gems > 0 ? '#2a4a3a' : '#8a3030';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        borderBottom: lastInList ? 'none' : '1.5px dashed #c8b890',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12 }}>
          <b>{entry.actorName}</b>{' '}
          <span style={{ opacity: 0.7 }}>· {KIND_LABEL[entry.kind]}</span>
          {entry.memo && <span style={{ opacity: 0.7 }}> · {entry.memo}</span>}
        </div>
        <div className="mono" style={{ fontSize: 10, opacity: 0.6 }}>
          {timeAgo(entry.createdAt)}
        </div>
      </div>
      <div className="mono" style={{ fontSize: 12, color, textAlign: 'right' }}>
        {gold !== 0 && (
          <div>
            {gold > 0 ? '+' : ''}
            {gold.toLocaleString('pl-PL')}g
          </div>
        )}
        {gems !== 0 && (
          <div>
            {gems > 0 ? '+' : ''}
            {gems.toLocaleString('pl-PL')}
            <IcoGem s={10} />
          </div>
        )}
      </div>
    </div>
  );
}

function TopContributors({ members }: { members: GuildGetResponse['members'] }) {
  const top = [...members]
    .filter((m) => m.contributedGold > 0 || m.contributedGems > 0)
    .sort((a, b) => b.contributedGold - a.contributedGold)
    .slice(0, 5);
  if (top.length === 0) return null;
  return (
    <>
      <div className="h-title" style={{ fontSize: 14, marginBottom: 6, marginTop: 12 }}>
        NAJHOJNIEJSI
      </div>
      <div className="panel" style={{ padding: 4 }}>
        {top.map((m, i, arr) => (
          <div
            key={m.characterId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              borderBottom: i < arr.length - 1 ? '1.5px dashed #c8b890' : 'none',
            }}
          >
            <span className="mono" style={{ fontSize: 12, opacity: 0.6, minWidth: 18 }}>
              #{i + 1}
            </span>
            <span className="h-title" style={{ fontSize: 13, flex: 1 }}>
              {m.name}
            </span>
            <span className="mono" style={{ fontSize: 13, color: '#7a6040' }}>
              {m.contributedGold.toLocaleString('pl-PL')}g
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function timeAgo(ms: number): string {
  const delta = Date.now() - ms;
  if (delta < 60_000) return 'przed chwilą';
  if (delta < 3600_000) return `${Math.floor(delta / 60_000)} min temu`;
  if (delta < 86400_000) return `${Math.floor(delta / 3600_000)}h temu`;
  return `${Math.floor(delta / 86400_000)}d temu`;
}

