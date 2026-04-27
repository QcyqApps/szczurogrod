// Karciarz Franek — gambling mini-game. 1 darmowy rzut na UTC dzień, extra
// za 5 gemów. 1d10. 1-3 nic, 4-6 500g, 7-9 1500g, 10 = rare item lub 20 gemów.
// Server-authoritative: klient wysyła tylko `useFree: bool`, dostaje {roll,
// reward} i animuje go. `rollAnimating` trzyma na 0.9s samą animację rolki
// potem pokazuje modal z nagrodą.

import { useEffect, useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { IcoClock, IcoCoin, IcoGem } from '@/components/icons';
import { GameIcon } from '@/components/game-icons';
import { GemSinkButton } from '@/components/ui-common';
import type { DiceRollResponse } from '@grodno/shared';

export interface ScreenDiceProps {
  onBack: () => void;
}

const RARITY_COLOR: Record<string, string> = {
  common: '#a8a890',
  rare: '#4a7cff',
  epic: '#a04ef0',
  legendary: '#e07820',
};

export function ScreenDice({ onBack }: ScreenDiceProps) {
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  const statusQuery = trpc.dice.status.useQuery();
  const meQuery = trpc.me.get.useQuery();

  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<DiceRollResponse | null>(null);
  /** Wartość pokazywana na kostce w trakcie animacji — cykluje 1..10. */
  const [rollDisplay, setRollDisplay] = useState(1);

  const rollMut = trpc.dice.roll.useMutation({
    onSuccess: (data) => {
      // Animuj zmienne cyfry na kostce przez ~0.9s, potem zatrzymaj na wyniku.
      setRolling(true);
      const start = Date.now();
      const spin = setInterval(() => {
        setRollDisplay(1 + Math.floor(Math.random() * 10));
        if (Date.now() - start >= 900) {
          clearInterval(spin);
          setRollDisplay(data.roll);
          setRolling(false);
          setResult(data);
        }
      }, 70);
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : 'Franek odmówił.',
        accent: '#c83232',
      });
    },
  });

  const status = statusQuery.data;
  const gems = meQuery.data?.gems ?? 0;

  async function handleRoll(useFree: boolean) {
    if (rolling || rollMut.isPending) return;
    setResult(null);
    try {
      await rollMut.mutateAsync({ useFree });
    } finally {
      void utils.dice.status.invalidate();
      void utils.me.get.invalidate();
      void utils.inventory.list.invalidate();
    }
  }

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div
        className="panel"
        style={{
          padding: 14,
          marginBottom: 10,
          background: 'linear-gradient(180deg, #3a1a2a 0%, #1a0a14 100%)',
          color: '#f3ead9',
          textAlign: 'center',
        }}
      >
        <div className="h-display" style={{ fontSize: 22, color: '#ffc830' }}>
          KARCIARZ FRANEK
        </div>
        <div className="flavor light" style={{ fontSize: 14, marginTop: 4 }}>
          Kości są proste. Matematyka też, tylko Franek udaje że nie.
        </div>
      </div>

      {/* Kostka + akcje */}
      <div
        className="panel"
        style={{
          padding: 16,
          marginBottom: 10,
          textAlign: 'center',
          background: 'linear-gradient(180deg, #2a1a14 0%, #0e0604 100%)',
          color: '#f3ead9',
        }}
      >
        <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
          <DiceFace n={rollDisplay} shaking={rolling} />
        </div>

        {!status ? (
          <div style={{ fontSize: 13 }}>Franek tasuje kości…</div>
        ) : (
          <>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
              {status.freeAvailable
                ? 'Darmowy rzut dostępny.'
                : 'Darmowy zużyty — wróć jutro albo płać gemami.'}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className="cbtn lg"
                disabled={!status.freeAvailable || rolling || rollMut.isPending}
                onClick={() => void handleRoll(true)}
                style={{ minWidth: 150 }}
              >
                {rollMut.isPending && rollMut.variables?.useFree
                  ? 'RZUCAM...'
                  : 'RZUĆ ZA DARMO'}
              </button>
              <GemSinkButton
                label="RZUĆ ZA GEMY"
                cost={status.extraCostGems}
                playerGems={gems}
                pending={
                  rollMut.isPending && rollMut.variables?.useFree === false
                }
                onClick={() => void handleRoll(false)}
                disabledReason="Drugi rzut i kolejne."
                variant="primary"
                size="md"
              />
            </div>
            {!status.freeAvailable && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  opacity: 0.75,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <IcoClock s={12} />{' '}
                <CountdownToNextFree target={status.nextFreeAt} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Tabela wygranych — zawsze widoczna (edukacja gracza) */}
      <div className="panel" style={{ padding: 12, marginBottom: 10 }}>
        <div className="h-title" style={{ fontSize: 14, marginBottom: 8 }}>
          TABELA WYGRANYCH
        </div>
        <PayoutRow roll="1–3" label="Szkło" />
        <PayoutRow
          roll="4–6"
          label="500 gold'a"
          value={
            <>
              <IcoCoin s={12} /> 500
            </>
          }
        />
        <PayoutRow
          roll="7–9"
          label="1500 gold'a"
          value={
            <>
              <IcoCoin s={12} /> 1500
            </>
          }
        />
        <PayoutRow
          roll="10"
          label="Jackpot — rare item lub 20 gemów"
          value={
            <>
              <IcoGem s={12} /> 20 / item
            </>
          }
        />
        <div style={{ fontSize: 13, color: '#5a3a2a', marginTop: 6, fontStyle: 'italic' }}>
          Franek nie pamięta co dał Ci wczoraj. Ale pamięta co mu jesteś winien.
        </div>
      </div>

      <button type="button" className="cbtn ghost" style={{ width: '100%' }} onClick={onBack}>
        ← WRÓĆ
      </button>

      {result && <RewardModal result={result} onClose={() => setResult(null)} />}
    </div>
  );
}

// ===========================================================================
// Kostka — wizualny sprite 1d10. Pokazuje wartość `n`; gdy shaking, dodatkowo
// animacja CSS `dice-shake`. Trzymamy hand-drawn style (kwadrat z dużym
// cyfrem w środku).
// ===========================================================================

function DiceFace({ n, shaking }: { n: number; shaking: boolean }) {
  return (
    <div
      style={{
        width: 110,
        height: 110,
        borderRadius: 18,
        background: '#f3ead9',
        border: '4px solid #2a1810',
        boxShadow: '4px 4px 0 #2a1810',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Luckiest Guy, sans-serif',
        fontSize: 58,
        color: '#2a1810',
        animation: shaking ? 'dice-shake 0.09s linear infinite' : 'none',
        userSelect: 'none',
      }}
    >
      {n}
    </div>
  );
}

function PayoutRow({
  roll,
  label,
  value,
}: {
  roll: string;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 0',
        borderBottom: '1px dashed #c8b890',
        fontSize: 13,
      }}
    >
      <span
        className="mono"
        style={{
          minWidth: 42,
          textAlign: 'center',
          background: '#e8dcb9',
          borderRadius: 6,
          padding: '2px 4px',
          border: '1.5px solid #2a1810',
          fontSize: 12,
        }}
      >
        {roll}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {value && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          {value}
        </span>
      )}
    </div>
  );
}

// ===========================================================================
// Modal pokazujący nagrodę. Pełny overlay, klika się żeby zamknąć.
// ===========================================================================

function RewardModal({
  result,
  onClose,
}: {
  result: DiceRollResponse;
  onClose: () => void;
}) {
  const headline =
    result.kind === 'nothing'
      ? 'PUDŁO.'
      : result.kind === 'gold'
        ? 'ZŁOTO!'
        : result.kind === 'gems'
          ? 'GEMY!'
          : 'JACKPOT!';
  const accent =
    result.kind === 'nothing'
      ? '#8a5a3a'
      : result.kind === 'gold'
        ? '#d4a24c'
        : result.kind === 'gems'
          ? '#a0d8f0'
          : '#c83232';
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 20,
        animation: 'modal-fade-in 0.3s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel"
        style={{
          maxWidth: 320,
          width: '100%',
          padding: 18,
          textAlign: 'center',
          background: '#fff7e0',
          border: `4px solid ${accent}`,
        }}
      >
        <div style={{ fontSize: 15, color: '#5a3a2a', marginBottom: 6 }}>
          RZUT: <b className="mono" style={{ fontSize: 22, color: '#2a1810' }}>{result.roll}</b>
        </div>
        <div
          className="h-display"
          style={{ fontSize: 24, color: accent, marginBottom: 8 }}
        >
          {headline}
        </div>
        <div
          className="flavor"
          style={{ fontSize: 15, color: '#3a2a1a', marginBottom: 14, lineHeight: 1.25 }}
        >
          {result.flavor}
        </div>

        {/* Breakdown nagrody */}
        {result.kind === 'gold' && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: '#f0d080',
              border: '2.5px solid #2a1810',
              borderRadius: 999,
              fontFamily: 'Luckiest Guy, sans-serif',
              fontSize: 18,
              marginBottom: 14,
            }}
          >
            <IcoCoin s={16} /> +{result.gold}
          </div>
        )}
        {result.kind === 'gems' && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: '#c8e0f0',
              border: '2.5px solid #2a1810',
              borderRadius: 999,
              fontFamily: 'Luckiest Guy, sans-serif',
              fontSize: 18,
              marginBottom: 14,
            }}
          >
            <IcoGem s={16} /> +{result.gems}
          </div>
        )}
        {result.kind === 'rare_item' && result.item && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              background: RARITY_COLOR[result.item.rarity] + '22',
              border: `3px solid ${RARITY_COLOR[result.item.rarity]}`,
              borderRadius: 12,
              marginBottom: 14,
            }}
          >
            <GameIcon name={result.item.icon as never} size={40} />
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div className="h-title" style={{ fontSize: 13 }}>
                {result.item.name}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: RARITY_COLOR[result.item.rarity],
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {result.item.rarity}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          className="cbtn"
          style={{ width: '100%' }}
          onClick={onClose}
        >
          DALEJ
        </button>
      </div>
    </div>
  );
}

function CountdownToNextFree({ target }: { target: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target - now);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return (
    <span>
      Darmowy za <b className="mono">{h}h:{String(m).padStart(2, '0')}m</b>
    </span>
  );
}
