// Praca — długoterminowe idle questy.
//
// Gracz wybiera zlecenie (kind) + długość (1/2/4/8h). Każde zlecenie ma inny
// profil nagrody (gold vs xp). Postać "idzie do pracy", po czasie wraca po
// zapłatę — albo wychodzi wcześniej za część. Server-authoritative.

import { useEffect, useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { GameIcon } from '@/components/game-icons';
import { IcoClock, IcoCoin } from '@/components/icons';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { useT, tStatic } from '@/i18n';
import type { LevelUpInfo, WorkKind, WorkOption } from '@grodno/shared';
import { LevelUpModal } from '@/components/ui-common';

export interface ScreenWorkProps {
  onBack: () => void;
}

export function ScreenWork({ onBack }: ScreenWorkProps) {
  const t = useT();
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  const statusQuery = trpc.work.status.useQuery();
  const [pickedKind, setPickedKind] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<LevelUpInfo | null>(null);
  const [, tickRerender] = useState(0);

  // 1Hz tick gdy aktywna praca trwa — countdown UI bez network traffic.
  // Co minutę robimy też invalidate żeby partial preview odświeżało się
  // serwerowo (klient nie zna formuły pro-rata po kind multiplier).
  const active = statusQuery.data?.active ?? null;
  useEffect(() => {
    if (!active || active.ready) return;
    const handle = setInterval(() => tickRerender((x) => x + 1), 1000);
    return () => clearInterval(handle);
  }, [active]);
  useEffect(() => {
    if (!active || active.ready) return;
    const handle = setInterval(() => {
      void utils.work.status.invalidate();
    }, 60_000);
    return () => clearInterval(handle);
  }, [active, utils]);

  const startMut = trpc.work.start.useMutation({
    onSuccess: () => {
      pushToast({ text: tStatic('work.toast.started'), accent: '#2a4a3a' });
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : tStatic('work.toast.failed'),
        accent: '#c83232',
      });
    },
    onSettled: () => {
      void utils.work.status.invalidate();
    },
  });

  const claimMut = trpc.work.claim.useMutation({
    onSuccess: (data) => {
      pushToast({
        text: tStatic('work.toast.claimed')
          .replace('{gold}', data.gold.toLocaleString('pl-PL'))
          .replace('{xp}', String(data.xp)),
        accent: '#2a4a3a',
      });
      if (data.levelUp) setLevelUp(data.levelUp);
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : tStatic('work.toast.failed'),
        accent: '#c83232',
      });
    },
    onSettled: () => {
      void utils.work.status.invalidate();
      void utils.me.get.invalidate();
    },
  });

  const cancelMut = trpc.work.cancel.useMutation({
    onSuccess: (data) => {
      pushToast({
        text: (data.partial
          ? tStatic('work.toast.cancelled')
          : tStatic('work.toast.claimed'))
          .replace('{gold}', data.gold.toLocaleString('pl-PL'))
          .replace('{xp}', String(data.xp)),
        accent: data.partial ? '#7a5a2a' : '#2a4a3a',
      });
      if (data.levelUp) setLevelUp(data.levelUp);
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : tStatic('work.toast.failed'),
        accent: '#c83232',
      });
    },
    onSettled: () => {
      void utils.work.status.invalidate();
      void utils.me.get.invalidate();
    },
  });

  const data = statusQuery.data;

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div
        className="panel"
        style={{
          padding: 14,
          marginBottom: 12,
          background: 'linear-gradient(180deg, #4a3a2a 0%, #2a1a14 100%)',
          color: '#f3ead9',
          textAlign: 'center',
        }}
      >
        <div className="h-display" style={{ fontSize: 22, color: '#ffc830' }}>
          {t('work.title')}
        </div>
        <div className="flavor light" style={{ fontSize: 14, marginTop: 4 }}>
          {t('work.flavor')}
        </div>
      </div>

      {!data ? (
        <div className="panel" style={{ padding: 14, textAlign: 'center', fontSize: 14 }}>
          {t('work.loading')}
        </div>
      ) : active ? (
        <ActivePanel
          startedAt={active.startedAt}
          endsAt={active.endsAt}
          kindName={active.kind.name}
          kindFlavor={active.kind.flavor}
          durationHours={active.durationHours}
          gold={active.reward.gold}
          xp={active.reward.xp}
          partialGold={active.partial.gold}
          partialXp={active.partial.xp}
          ready={active.ready}
          claimPending={claimMut.isPending}
          cancelPending={cancelMut.isPending}
          onClaim={() => claimMut.mutate()}
          onCancel={() => {
            const msg = tStatic('work.active.confirmCancel')
              .replace('{gold}', active.partial.gold.toLocaleString('pl-PL'))
              .replace('{xp}', String(active.partial.xp));
            if (window.confirm(msg)) cancelMut.mutate();
          }}
        />
      ) : (
        <PickerPanel
          kinds={data.kinds}
          options={data.options}
          pickedKind={pickedKind}
          onPickKind={setPickedKind}
          onStart={(hours) => {
            if (!pickedKind) return;
            startMut.mutate({ kindSlug: pickedKind, durationHours: hours });
          }}
          startPending={startMut.isPending}
        />
      )}

      <button
        type="button"
        className="cbtn ghost"
        style={{ width: '100%', marginTop: 14 }}
        onClick={onBack}
      >
        {t('btn.back')}
      </button>

      {levelUp && <LevelUpModal info={levelUp} onClose={() => setLevelUp(null)} />}
    </div>
  );
}

function ActivePanel({
  startedAt,
  endsAt,
  kindName,
  kindFlavor,
  durationHours,
  gold,
  xp,
  partialGold,
  partialXp,
  ready,
  claimPending,
  cancelPending,
  onClaim,
  onCancel,
}: {
  startedAt: number;
  endsAt: number;
  kindName: string;
  kindFlavor: string;
  durationHours: number;
  gold: number;
  xp: number;
  partialGold: number;
  partialXp: number;
  ready: boolean;
  claimPending: boolean;
  cancelPending: boolean;
  onClaim: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  const now = Date.now();
  const total = endsAt - startedAt;
  const elapsed = Math.max(0, Math.min(total, now - startedAt));
  const pct = total > 0 ? Math.round((elapsed / total) * 100) : 100;
  const remainingMs = Math.max(0, endsAt - now);
  const hh = Math.floor(remainingMs / 3_600_000);
  const mm = Math.floor((remainingMs % 3_600_000) / 60_000);
  const ss = Math.floor((remainingMs % 60_000) / 1000);
  const remaining = ready
    ? t('work.active.ready')
    : hh > 0
      ? `${hh}h ${String(mm).padStart(2, '0')}m`
      : `${mm}m ${String(ss).padStart(2, '0')}s`;

  return (
    <div
      className="panel"
      style={{
        padding: 14,
        background: ready ? '#e8f0d8' : '#fff7e0',
        border: ready ? '3px solid #4a7c3a' : '3px solid #2a1810',
      }}
    >
      <div className="h-title" style={{ fontSize: 16, textAlign: 'center', color: '#2a1810' }}>
        {kindName}
      </div>
      <div
        className="flavor"
        style={{
          fontSize: 14,
          textAlign: 'center',
          color: '#5a3a2a',
          marginTop: 4,
        }}
      >
        {kindFlavor}
      </div>

      <div
        style={{
          marginTop: 12,
          height: 22,
          background: 'rgba(0,0,0,0.08)',
          border: '2.5px solid #2a1810',
          borderRadius: 6,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: ready
              ? 'linear-gradient(90deg, #4a7c3a, #82c060)'
              : 'linear-gradient(90deg, #d4a24c, #ffc830)',
            transition: 'width 0.5s ease-out',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Luckiest Guy, sans-serif',
            fontSize: 13,
            color: '#2a1810',
            textShadow: '1px 1px 0 rgba(255,255,255,0.5)',
          }}
        >
          <IcoClock s={14} /> &nbsp;{remaining}
        </div>
      </div>

      <div
        style={{
          marginTop: 10,
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          fontSize: 14,
        }}
      >
        <span className="pip gold">
          <IcoCoin s={14} /> {gold.toLocaleString('pl-PL')}
        </span>
        <span className="pip" style={{ background: '#e8c870' }}>
          <GameIcon name="spark" size={14} /> {xp}
        </span>
        <span className="pip" style={{ background: '#c8c0a0' }}>
          {durationHours}h
        </span>
      </div>

      <button
        type="button"
        className={ready ? 'cbtn green lg' : 'cbtn ghost'}
        style={{ width: '100%', marginTop: 12 }}
        disabled={!ready || claimPending || cancelPending}
        onClick={onClaim}
      >
        {ready ? t('work.active.claim') : t('work.active.waiting')}
      </button>

      {!ready && (
        <>
          <div
            className="flavor"
            style={{
              fontSize: 14,
              textAlign: 'center',
              color: '#5a3a2a',
              marginTop: 10,
            }}
          >
            {tStatic('work.active.cancelHint')
              .replace('{gold}', partialGold.toLocaleString('pl-PL'))
              .replace('{xp}', String(partialXp))}
          </div>
          <button
            type="button"
            className="cbtn"
            style={{
              width: '100%',
              marginTop: 6,
              background: '#c8a060',
              border: '2.5px solid #2a1810',
              color: '#2a1810',
            }}
            disabled={claimPending || cancelPending}
            onClick={onCancel}
          >
            {t('work.active.cancel')}
          </button>
        </>
      )}

      <div
        className="flavor"
        style={{
          fontSize: 14,
          textAlign: 'center',
          color: '#7a4a2a',
          marginTop: 10,
        }}
      >
        {t('work.active.blocksCombat')}
      </div>
    </div>
  );
}

function PickerPanel({
  kinds,
  options,
  pickedKind,
  onPickKind,
  onStart,
  startPending,
}: {
  kinds: readonly WorkKind[];
  options: readonly WorkOption[];
  pickedKind: string | null;
  onPickKind: (slug: string) => void;
  onStart: (hours: number) => void;
  startPending: boolean;
}) {
  const t = useT();
  // Per-kind preview używa 4h jako reprezentanta (środek skali) — wystarcza
  // żeby gracz odczytał profil (gold-heavy vs xp-heavy) zanim wybierze długość.
  const previewHours = 4;
  const optionsForPicked = options.filter((o) => o.kindSlug === pickedKind);
  return (
    <>
      <div className="h-title" style={{ fontSize: 14, marginBottom: 6, color: '#2a1810' }}>
        {t('work.picker.kindHeading')}
      </div>
      <div
        className="flavor"
        style={{ fontSize: 14, color: '#5a3a2a', marginBottom: 6 }}
      >
        {t('work.picker.profileHint')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {kinds.map((k) => {
          const active = k.slug === pickedKind;
          const previewOpt = options.find(
            (o) => o.kindSlug === k.slug && o.hours === previewHours,
          );
          return (
            <button
              key={k.slug}
              type="button"
              onClick={() => onPickKind(k.slug)}
              className="clickable no-select"
              style={{
                textAlign: 'left',
                padding: 10,
                border: active ? '3px solid #2a1810' : '2.5px solid #8a6a4a',
                borderRadius: 10,
                background: active ? '#fff7e0' : '#e8dcb9',
                boxShadow: active ? '2px 2px 0 #2a1810' : 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <div className="h-title" style={{ fontSize: 14, color: '#2a1810' }}>
                {k.name}
              </div>
              <div
                className="flavor"
                style={{ fontSize: 14, color: '#5a3a2a', marginTop: 2 }}
              >
                {k.flavor}
              </div>
              {previewOpt && (
                <div style={{ fontSize: 13, marginTop: 4, color: '#2a1810' }}>
                  {previewHours}h:{' '}
                  <IcoCoin s={12} /> {previewOpt.goldReward.toLocaleString('pl-PL')}
                  {' · '}
                  <GameIcon name="spark" size={12} /> {previewOpt.xpReward}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="h-title" style={{ fontSize: 14, marginBottom: 6, color: '#2a1810' }}>
        {t('work.picker.durationHeading')}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
        }}
      >
        {optionsForPicked.map((opt) => (
          <button
            key={opt.hours}
            type="button"
            disabled={!pickedKind || startPending}
            onClick={() => onStart(opt.hours)}
            className="clickable no-select"
            style={{
              padding: 10,
              border: '2.5px solid #2a1810',
              borderRadius: 10,
              background: !pickedKind ? '#d4c491' : '#ffc830',
              boxShadow: !pickedKind ? 'none' : '2px 2px 0 #2a1810',
              cursor: !pickedKind ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              textAlign: 'center',
            }}
          >
            <div
              className="h-title"
              style={{ fontSize: 16, color: '#2a1810' }}
            >
              {opt.hours}h
            </div>
            <div style={{ fontSize: 13, marginTop: 2, color: '#2a1810' }}>
              <IcoCoin s={12} /> {opt.goldReward.toLocaleString('pl-PL')}
              {' · '}
              <GameIcon name="spark" size={12} /> {opt.xpReward}
            </div>
          </button>
        ))}
      </div>
      {!pickedKind && (
        <div
          className="flavor"
          style={{
            fontSize: 14,
            color: '#5a3a2a',
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          {t('work.picker.pickFirst')}
        </div>
      )}
    </>
  );
}
