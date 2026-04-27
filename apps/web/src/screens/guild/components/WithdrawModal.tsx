import { useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { IcoCoin, IcoGem } from '@/components/icons';
import type { GuildRank } from '@grodno/shared';

export interface WithdrawModalProps {
  onClose: () => void;
  myRank: GuildRank;
  treasuryGold: number;
  treasuryGems: number;
  dailyUsed: number;
  dailyCap: number;
}

export function WithdrawModal({
  onClose,
  myRank,
  treasuryGold,
  treasuryGems,
  dailyUsed,
  dailyCap,
}: WithdrawModalProps) {
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);

  const [gold, setGold] = useState(0);
  const [gems, setGems] = useState(0);

  const canWithdrawGold = myRank === 'leader' || myRank === 'officer';
  const canWithdrawGems = myRank === 'leader';

  const withdrawMut = trpc.guildTreasury.withdraw.useMutation({
    onSuccess: () => {
      pushToast({ text: 'Wypłata zaksięgowana.', accent: '#2a4a3a' });
      void utils.guild.get.invalidate();
      void utils.guildTreasury.log.invalidate();
      void utils.me.get.invalidate();
      onClose();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : 'Nie udało się wypłacić.',
        accent: '#c83232',
        ttlMs: 4200,
      });
    },
  });

  const goldRemaining = Math.max(0, dailyCap - dailyUsed);
  const maxGold = canWithdrawGold ? Math.min(treasuryGold, goldRemaining) : 0;
  const maxGems = canWithdrawGems ? treasuryGems : 0;

  const canSubmit =
    (gold > 0 || gems > 0) && gold <= maxGold && gems <= maxGems && !withdrawMut.isPending;

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
        style={{ width: '100%', maxWidth: 340, background: '#f3ead9', padding: 16 }}
      >
        <div className="h-display" style={{ fontSize: 18, textAlign: 'center', marginBottom: 10 }}>
          WYPŁAĆ ZE SKARBCA
        </div>

        {canWithdrawGold && (
          <AmountField
            label="ZŁOTO"
            icon={<IcoCoin s={16} />}
            value={gold}
            onChange={setGold}
            max={maxGold}
            helper={`Dziś jeszcze: ${goldRemaining.toLocaleString('pl-PL')}g`}
          />
        )}
        {canWithdrawGems && (
          <AmountField
            label="GEMY (tylko Mistrz)"
            icon={<IcoGem s={16} />}
            value={gems}
            onChange={setGems}
            max={maxGems}
            helper={`W skarbcu: ${treasuryGems.toLocaleString('pl-PL')}`}
          />
        )}

        {!canWithdrawGold && !canWithdrawGems && (
          <div
            className="flavor"
            style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', padding: 8 }}
          >
            Twoja ranga nie sięga skarbca.
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button type="button" className="cbtn ghost sm" style={{ flex: 1 }} onClick={onClose}>
            ANULUJ
          </button>
          <button
            type="button"
            className="cbtn sm"
            style={{ flex: 1 }}
            disabled={!canSubmit}
            onClick={() => withdrawMut.mutate({ gold, gems })}
          >
            {withdrawMut.isPending ? '...' : 'WYPŁAĆ'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface AmountFieldProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  max: number;
  helper: string;
}

function AmountField({ label, icon, value, onChange, max, helper }: AmountFieldProps) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <label
          className="h-title"
          style={{ fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}
        >
          {icon} {label}
        </label>
        <span className="mono" style={{ fontSize: 13, opacity: 0.7 }}>
          {helper}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={(e) => {
            const v = Math.max(0, Math.min(max, Number.parseInt(e.target.value, 10) || 0));
            onChange(v);
          }}
          style={{
            flex: 1,
            padding: '6px 8px',
            border: '2.5px solid #2a1810',
            borderRadius: 8,
            background: '#fff7e0',
            fontFamily: 'inherit',
            fontSize: 14,
          }}
        />
        <button
          type="button"
          className="cbtn ghost sm"
          onClick={() => onChange(max)}
          disabled={max === 0}
          style={{ minWidth: 60 }}
        >
          MAX
        </button>
      </div>
    </div>
  );
}
