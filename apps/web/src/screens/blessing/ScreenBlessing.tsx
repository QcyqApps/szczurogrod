// Mnich Panteleon — UI błogosławieństw.
//
// Grid 2×3 z 6 blessing'ami. Każde klikalne jeśli gracz stać na gold'a i
// cooldown minął. Po kupnie baner pokazuje countdown do następnego.
// Buff'y współdzielą sloty z elixirami (`ActiveBuffsBar` w TopBar pokazuje
// je spójnie).

import { useEffect, useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { GameIcon } from '@/components/game-icons';
import type { IconName } from '@/components/game-icons';
import { IcoClock, IcoCoin } from '@/components/icons';
import { HelpIcon } from '@/components/ui-common';
import { useT, tStatic, useContentT } from '@/i18n';
import type { BlessingOffer } from '@grodno/shared';

export interface ScreenBlessingProps {
  onBack: () => void;
}

export function ScreenBlessing({ onBack }: ScreenBlessingProps) {
  const t = useT();
  const tc = useContentT();
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  const statusQuery = trpc.blessing.status.useQuery();
  const meQuery = trpc.me.get.useQuery();

  const gold = meQuery.data?.gold ?? 0;
  const status = statusQuery.data;

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (status?.cooldownReadyAt === null || status?.cooldownReadyAt === undefined) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status?.cooldownReadyAt]);

  const cooldownActive =
    status?.cooldownReadyAt !== null &&
    status?.cooldownReadyAt !== undefined &&
    status.cooldownReadyAt > now;

  const buyMut = trpc.blessing.buy.useMutation({
    onSuccess: (data, vars) => {
      const offer = status?.offers.find((o) => o.id === vars.id);
      pushToast({
        text: offer
          ? tStatic('blessing.toast.success')
              .replace('{n}', String(offer.magnitude))
              .replace('{u}', offer.kind.endsWith('_pct') ? '%' : '')
          : tStatic('blessing.toast.successFallback'),
        accent: '#4a7c3a',
      });
      void data; // unused but keep param
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : tStatic('blessing.toast.refused'),
        accent: '#c83232',
      });
    },
    onSettled: () => {
      void utils.blessing.status.invalidate();
      void utils.me.get.invalidate();
    },
  });

  async function handleBuy(offer: BlessingOffer) {
    if (buyMut.isPending || cooldownActive) return;
    if (gold < offer.costGold) {
      pushToast({
        text: tStatic('blessing.toast.noGold').replace('{n}', String(offer.costGold)),
        accent: '#c83232',
      });
      return;
    }
    await buyMut.mutateAsync({ id: offer.id });
  }

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div
        className="panel"
        style={{
          padding: 14,
          marginBottom: 10,
          background: 'linear-gradient(180deg, #3a3a2a 0%, #1a1a0e 100%)',
          color: '#f3ead9',
          textAlign: 'center',
        }}
      >
        <div className="h-display" style={{ fontSize: 22, color: '#e8c870' }}>
          {t('blessing.title')}
        </div>
        <div className="flavor light" style={{ fontSize: 14, marginTop: 4 }}>
          {t('blessing.flavor')}
        </div>
      </div>

      {/* Cooldown banner */}
      {cooldownActive && status?.cooldownReadyAt && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            marginBottom: 10,
            background: '#3a2a4a',
            border: '2.5px solid #2a1810',
            borderRadius: 10,
            color: '#f3ead9',
            boxShadow: '2px 2px 0 #2a1810',
          }}
        >
          <IcoClock s={16} />
          <div style={{ flex: 1, fontSize: 13 }}>
            {t('blessing.cooldown.text')}{' '}
            <b className="mono">{formatCountdown(status.cooldownReadyAt - now)}</b>
          </div>
        </div>
      )}

      {/* Grid 2×3 blessing'ów */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginBottom: 12,
        }}
      >
        {!status ? (
          <div style={{ fontSize: 13, color: '#5a3a2a', padding: 20, gridColumn: '1 / -1', textAlign: 'center' }}>
            {t('blessing.loading')}
          </div>
        ) : (
          status.offers.map((offer) => {
            const canAfford = gold >= offer.costGold;
            const disabled = cooldownActive || !canAfford || buyMut.isPending;
            return (
              <button
                key={offer.id}
                type="button"
                onClick={() => void handleBuy(offer)}
                disabled={disabled}
                style={{
                  padding: 10,
                  border: '2.5px solid #2a1810',
                  borderRadius: 10,
                  background: disabled ? '#d4c891' : '#f0e4b8',
                  boxShadow: disabled ? 'none' : '2px 2px 0 #2a1810',
                  opacity: disabled ? 0.7 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      background: '#fff7e0',
                      border: '2px solid #2a1810',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <GameIcon name={offer.icon as IconName} size={22} />
                  </div>
                  <div
                    className="h-title"
                    style={{
                      fontSize: 13,
                      lineHeight: 1.1,
                      color: '#2a1810',
                    }}
                  >
                    {tc.blessingName(offer.id, offer.name)}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#5a3a2a', lineHeight: 1.2 }}>
                  {tc.blessingDesc(offer.id, offer.desc)}
                </div>
                <div
                  style={{
                    marginTop: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    background: canAfford ? '#f0d080' : '#e8c0b0',
                    border: '2px solid #2a1810',
                    borderRadius: 999,
                    alignSelf: 'flex-start',
                    fontFamily: 'Luckiest Guy, sans-serif',
                    fontSize: 13,
                  }}
                >
                  <IcoCoin s={12} /> {offer.costGold}
                </div>
              </button>
            );
          })
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
        <HelpIcon title={t('blessing.help.title')} label={t('blessing.help.label')}>
          <p style={{ margin: 0 }}>{t('blessing.help.body')}</p>
        </HelpIcon>
      </div>

      <button type="button" className="cbtn ghost" style={{ width: '100%' }} onClick={onBack}>
        {t('blessing.back')}
      </button>
    </div>
  );
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
