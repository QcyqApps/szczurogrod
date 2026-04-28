import { useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { IcoCoin, IcoGem } from '@/components/icons';
import { useT, tStatic } from '@/i18n';

export interface DepositModalProps {
  onClose: () => void;
}

export function DepositModal({ onClose }: DepositModalProps) {
  const t = useT();
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  const meQuery = trpc.me.get.useQuery();
  const char = meQuery.data;

  const [gold, setGold] = useState(0);
  const [gems, setGems] = useState(0);

  const depositMut = trpc.guildTreasury.deposit.useMutation({
    onSuccess: () => {
      pushToast({ text: tStatic('guildDeposit.toast.success'), accent: '#2a4a3a' });
      void utils.guild.get.invalidate();
      void utils.guildTreasury.log.invalidate();
      void utils.me.get.invalidate();
      onClose();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : tStatic('guildDeposit.toast.fail'),
        accent: '#c83232',
      });
    },
  });

  const maxGold = char?.gold ?? 0;
  const maxGems = char?.gems ?? 0;
  const canSubmit =
    (gold > 0 || gems > 0) && gold <= maxGold && gems <= maxGems && !depositMut.isPending;

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
          {t('guildDeposit.title')}
        </div>

        <AmountField
          label={t('guildDeposit.gold')}
          icon={<IcoCoin s={16} />}
          value={gold}
          onChange={setGold}
          max={maxGold}
          myBalance={maxGold}
        />
        <AmountField
          label={t('guildDeposit.gems')}
          icon={<IcoGem s={16} />}
          value={gems}
          onChange={setGems}
          max={maxGems}
          myBalance={maxGems}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button type="button" className="cbtn ghost sm" style={{ flex: 1 }} onClick={onClose}>
            {t('guildDeposit.cancel')}
          </button>
          <button
            type="button"
            className="cbtn green sm"
            style={{ flex: 1 }}
            disabled={!canSubmit}
            onClick={() => depositMut.mutate({ gold, gems })}
          >
            {depositMut.isPending ? '...' : t('guildDeposit.submit')}
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
  myBalance: number;
}

function AmountField({ label, icon, value, onChange, max, myBalance }: AmountFieldProps) {
  const t = useT();
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
        <label className="h-title" style={{ fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
          {icon} {label}
        </label>
        <span className="mono" style={{ fontSize: 13, opacity: 0.7 }}>
          {t('guildDeposit.have').replace('{n}', myBalance.toLocaleString('pl-PL'))}
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
          {t('guildDeposit.max')}
        </button>
      </div>
    </div>
  );
}
