import { GameIcon } from '@/components/game-icons';
import { IcoCoin } from '@/components/icons';
import type { StatKey, TrainerQuote } from '@grodno/shared';

const STAT_META: Record<
  StatKey,
  { label: string; desc: string; color: string; icon: React.ComponentProps<typeof GameIcon>['name'] }
> = {
  atk: { label: 'ATAK', desc: 'Bijesz mocniej.', color: '#c83232', icon: 'sword' },
  def: { label: 'OBRONA', desc: 'Dostajesz mniej.', color: '#3a5a8a', icon: 'shield-item' },
  mag: { label: 'MAGIA', desc: 'Ogniem, lodem, czymkolwiek.', color: '#6a3a8a', icon: 'orb' },
  spd: { label: 'SZYBKOŚĆ', desc: 'Unikasz ciosów. MOCNY celuje.', color: '#4a7c3a', icon: 'bolt' },
};

export interface ScreenTrainerProps {
  quote: TrainerQuote | null;
  pending: StatKey | null;
  onBuy: (stat: StatKey) => void | Promise<void>;
  onBack: () => void;
}

export function ScreenTrainer({ quote, pending, onBuy, onBack }: ScreenTrainerProps) {
  const stats: StatKey[] = ['atk', 'def', 'mag', 'spd'];

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div
        className="panel"
        style={{
          padding: 14,
          marginBottom: 12,
          background: 'linear-gradient(180deg, #5a3a2a 0%, #2a1810 100%)',
          color: '#fff3e0',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="halftone-gold" style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <GameIcon name="crossed" size={56} />
        </div>
        <div
          className="h-display"
          style={{ fontSize: 22, color: '#ffc830', position: 'relative' }}
        >
          PLAC TRENINGOWY
        </div>
        <div className="flavor light" style={{ fontSize: 17, marginTop: 4, position: 'relative' }}>
          Złoto w pot, pot w staty.
        </div>
      </div>

      <div className="panel" style={{ padding: 12, marginBottom: 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <span
            className="h-title"
            style={{ fontSize: 14, color: '#5a3a2a', letterSpacing: 0.4 }}
          >
            TWÓJ PORTFEL
          </span>
          <span className="pip gold" style={{ fontSize: 14 }}>
            <IcoCoin s={14} /> {quote?.gold.toLocaleString('pl') ?? '—'}
          </span>
        </div>

        <div
          className="flavor light"
          style={{ fontSize: 14, color: '#7a5a3a', marginBottom: 10, textAlign: 'center' }}
        >
          Trening drożeje kwadratowo. Po L35 sprzęt zwykle taniej.
        </div>

        {stats.map((s) => {
          const meta = STAT_META[s];
          const current = quote?.stats[s];
          const cost = quote?.nextCost[s];
          const canAfford = quote && cost !== undefined && quote.gold >= cost;
          const isPending = pending === s;
          const disabled = !quote || !canAfford || isPending;
          return (
            <div
              key={s}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                borderBottom: '1px dashed #c8b890',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: '#fff7e0',
                  border: '2.5px solid #2a1810',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <GameIcon name={meta.icon} size={30} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="h-title" style={{ fontSize: 14, color: meta.color, lineHeight: 1 }}>
                  {meta.label}{' '}
                  <span className="mono" style={{ fontSize: 16, color: '#2a1810' }}>
                    {current ?? '—'}
                  </span>
                  <span className="mono" style={{ fontSize: 14, color: '#5a3a2a' }}>
                    {' '}
                    → {current !== undefined ? current + 1 : '—'}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#5a3a2a', marginTop: 2 }}>{meta.desc}</div>
              </div>
              <button
                type="button"
                className="cbtn sm"
                disabled={disabled}
                onClick={() => onBuy(s)}
                style={{
                  minWidth: 76,
                  background: canAfford ? '#d4a24c' : '#c8c0a8',
                  opacity: disabled ? 0.55 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <IcoCoin s={11} /> {cost?.toLocaleString('pl') ?? '—'}
              </button>
            </div>
          );
        })}

        <div
          className="flavor"
          style={{ fontSize: 14, marginTop: 10, color: '#5a3a2a', textAlign: 'center' }}
        >
          Każdy kolejny punkt drożej. Trener też musi z czegoś żyć.
        </div>
      </div>

      <button type="button" className="cbtn ghost" style={{ width: '100%' }} onClick={onBack}>
        ← Wróć
      </button>
    </div>
  );
}
