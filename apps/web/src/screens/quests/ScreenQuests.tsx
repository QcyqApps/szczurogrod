import { useEffect, useState } from 'react';
import { GameIcon } from '@/components/game-icons';
import { IcoCoin, IcoGem } from '@/components/icons';
import { GemSinkButton, HelpIcon, StatBar } from '@/components/ui-common';
import {
  GEM_SINK_COSTS,
  computeQuestSkipFullCost,
  computeQuestSkipHalfCost,
  type Quest,
  type QuestDifficulty,
  type Stamina,
} from '@grodno/shared';

const DIFF_COLOR: Record<QuestDifficulty, string> = {
  Łatwe: '#4a7c3a',
  Średnie: '#d4a24c',
  Trudne: '#c83232',
  'Ekstr.': '#6a3a8a',
  Boss: '#2a1810',
};

/**
 * Long-form blurbs shown as tooltips on the diff badge, in the voice of the
 * game. Key thing to communicate: quest = idle timer, badge = reward tier, not
 * combat difficulty. (Players were reading "Boss" as "you'll fight a boss".)
 */
const DIFF_HINT: Record<QuestDifficulty, string> = {
  Łatwe: 'Krótkie zadanie w tle (kilkadziesiąt sekund). Niewielka szansa na łup, zwykła jakość.',
  Średnie:
    'Dłuższe zadanie (ok. 1–2 min). Przeciętna szansa na łup, zwykłe lub rzadkie przedmioty.',
  Trudne:
    'Poważne zlecenie (kilka minut). Spora szansa na łup, w tym epickie przedmioty.',
  'Ekstr.':
    'Ekstremalne zlecenie (5+ min). Wysoka szansa na łup, w tym rzeczy epickie i legendarne.',
  Boss:
    'Zlecenie-finał rozdziału (10 min). Gwarantowany unikalny przedmiot dla twojej klasy.',
};

export interface ScreenQuestsProps {
  quests: readonly Quest[];
  onStart: (id: string) => void;
  onCollect: (id: string) => void;
  onSkip: (id: string, cost: number) => void;
  onSkipHalf: (id: string) => void;
  onRefillStamina: () => void;
  refillStaminaPending: boolean;
  onBack: () => void;
  gems: number;
  stamina: Stamina;
  charLvl: number;
  /**
   * Procent redukcji czasu z aktywnego wierzchowca (0..80). 0 = brak mountu.
   * Mirror of server `applyMountSpeed` — trzymaj w synchronizacji z
   * `game/mounts.ts`. Dotyczy tylko UI preview'u; prawdziwy `endsAt` wyliczany
   * jest na serwerze w `quests.start`.
   */
  mountSpeedPct?: number;
}

export function ScreenQuests({
  quests,
  onStart,
  onCollect,
  onSkip,
  onSkipHalf,
  onRefillStamina,
  refillStaminaPending,
  onBack,
  gems,
  stamina,
  charLvl,
  mountSpeedPct = 0,
}: ScreenQuestsProps) {
  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div className="panel" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GameIcon name="bolt" size={32} />
          <div style={{ flex: 1 }}>
            <StatBar cur={stamina.cur} max={stamina.max} kind="stam" label="WYTRZYMAŁOŚĆ" />
          </div>
          <div
            className="pip gold"
            style={{ fontSize: 13 }}
            title="Regeneracja wytrzymałości. Każdy quest kosztuje 1 punkt."
          >
            {stamina.cur >= stamina.max ? 'pełna' : '+1 za 0:15'}
          </div>
        </div>
        {stamina.cur < stamina.max && (
          <div style={{ marginTop: 8, textAlign: 'center' }}>
            <GemSinkButton
              label="+10 WYTRZ."
              cost={GEM_SINK_COSTS.staminaRefill}
              playerGems={gems}
              pending={refillStaminaPending}
              onClick={onRefillStamina}
              disabledReason="Natychmiastowy refill staminy."
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {quests.map((q) => (
          <QuestCard
            key={q.id}
            q={q}
            onStart={onStart}
            onCollect={onCollect}
            onSkip={onSkip}
            onSkipHalf={onSkipHalf}
            gems={gems}
            charLvl={charLvl}
            mountSpeedPct={mountSpeedPct}
          />
        ))}
      </div>

      {(() => {
        // Teaser pokazujemy tylko gdy server NIE pokazał już questa frontowego
        // (`requiredLvl === charLvl + 1`) — czyli gracz dogonił widoczną pulę
        // i kolejna fala czeka na konkretny LVL. Bez tego napis był stale i
        // mylił graczy past L6.
        const maxVisibleLvl = quests.reduce((m, q) => Math.max(m, q.requiredLvl), 0);
        if (maxVisibleLvl > charLvl) return null;
        const nextLvl = charLvl + 1;
        return (
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: '#5a3a2a' }}>
            Więcej questów po osiągnięciu LVL {nextLvl}
          </div>
        );
      })()}

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: 10,
        }}
      >
        <HelpIcon title="Jak działają questy?" label="Jak to działa?">
          <p style={{ margin: '0 0 8px' }}>
            Zadanie w tle. Klikasz <b>WYRUSZ</b>, idziesz zaparzyć herbatę, wracasz po
            odbiór złota, XP i czasem łupu. <b>Walki tu nie ma</b> — od bicia masz lochy.
          </p>
          <p style={{ margin: '0 0 8px' }}>
            Badge przy nazwie (<b>Łatwe</b>, <b>Średnie</b>, <b>Trudne</b>,{' '}
            <b>Ekstr.</b>, <b>Boss</b>) mówi, jak długo quest trwa i jak obfity łup.
            Im wyżej — tym dłużej stoi herbata i tym rzadsze przedmioty wpadają.
          </p>
          <p style={{ margin: 0 }}>
            <b>Boss</b> to finał rozdziału. Dziesięć minut cierpliwości — i
            gwarantowany unikalny przedmiot dla twojej klasy. Bez większych niespodzianek.
          </p>
        </HelpIcon>
      </div>

      <button
        type="button"
        className="cbtn ghost"
        style={{ width: '100%', marginTop: 12 }}
        onClick={onBack}
      >
        ← Miasto
      </button>
    </div>
  );
}

interface QuestCardProps {
  q: Quest;
  onStart: (id: string) => void;
  onCollect: (id: string) => void;
  onSkip: (id: string, cost: number) => void;
  onSkipHalf: (id: string) => void;
  gems: number;
  charLvl: number;
  mountSpeedPct: number;
}

function formatHms(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function QuestCard({
  q,
  onStart,
  onCollect,
  onSkip,
  onSkipHalf,
  gems,
  charLvl,
  mountSpeedPct,
}: QuestCardProps) {
  const locked = q.requiredLvl > charLvl;
  const [now, setNow] = useState(Date.now());
  const cooldown =
    q.state === 'done' && q.availableAt !== null && q.availableAt > now;
  useEffect(() => {
    if (q.state !== 'active' && !cooldown) return;
    // 250ms during an active quest (countdown to collect), 1s is enough while
    // waiting out the daily cooldown.
    const intervalMs = q.state === 'active' ? 250 : 1000;
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [q.state, cooldown]);
  const remaining = q.state === 'active' ? Math.max(0, q.endsAt - now) : q.duration;
  const pct = q.state === 'active' ? 100 * (1 - remaining / q.duration) : 0;
  const mm = Math.floor(remaining / 60000);
  const ss = Math.floor((remaining % 60000) / 1000);
  const ready = q.state === 'active' && remaining === 0;
  const refreshIn =
    cooldown && q.availableAt !== null ? formatHms(q.availableAt - now) : '';

  const diffColor = DIFF_COLOR[q.diff];
  // Preview skróconego czasu startu, gdy gracz ma wierzchowca. Mirror serwera:
  // `applyMountSpeed` → duration * (1 - pct/100), cap 80% w game/mounts.ts.
  const mountActive = mountSpeedPct > 0;
  const cappedPct = Math.min(80, Math.max(0, mountSpeedPct));
  const previewDurationMs = mountActive
    ? Math.ceil(q.duration * (1 - cappedPct / 100))
    : q.duration;
  const startMin = Math.max(1, Math.floor(previewDurationMs / 60000)) || 1;

  return (
    <div
      className="panel"
      style={{ padding: 10, opacity: locked ? 0.55 : 1, position: 'relative' }}
    >
      <div style={{ display: 'flex', gap: 10 }}>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 10,
            background: '#e8dcb9',
            border: '2.5px solid #2a1810',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.1)',
            flexShrink: 0,
          }}
        >
          <GameIcon name={q.icon} size={40} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}
          >
            <div className="h-title" style={{ fontSize: 15, lineHeight: 1, flex: 1 }}>
              {q.title}
            </div>
            <span
              className="pip"
              style={{ fontSize: 10, background: diffColor, color: '#fff', cursor: 'help' }}
              title={DIFF_HINT[q.diff]}
            >
              {q.diff}
            </span>
          </div>
          <div style={{ fontSize: 14, color: '#5a3a2a', lineHeight: 1.2, marginBottom: 4 }}>
            {q.desc}
          </div>
          <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
            <span className="pip gold" style={{ fontSize: 13 }}>
              <IcoCoin s={11} /> {q.gold}
            </span>
            <span
              className="pip"
              style={{
                fontSize: 13,
                background: '#e8c870',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <GameIcon name="spark" size={11} /> {q.xp} XP
            </span>
            {q.itemChance > 0 && (
              <span
                className="pip"
                style={{
                  fontSize: 13,
                  background: '#a0d8f0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <GameIcon name="gift" size={11} /> {q.itemChance}%
              </span>
            )}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        {q.state === 'idle' && locked && (
          <div
            style={{
              width: '100%',
              textAlign: 'center',
              padding: '8px 0',
              fontFamily: 'Luckiest Guy, sans-serif',
              fontSize: 14,
              letterSpacing: 0.5,
              color: '#8a3030',
              background: '#fce0e0',
              border: '2.5px solid #c83232',
              borderRadius: 8,
            }}
          >
            🔒 ODBLOKOWANE OD LVL {q.requiredLvl}
          </div>
        )}
        {q.state === 'idle' && !locked && (
          <button
            type="button"
            className="cbtn green"
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
            onClick={() => onStart(q.id)}
          >
            WYRUSZ · {startMin} MIN
            {mountActive && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  fontSize: 13,
                  opacity: 0.9,
                }}
                title={`Wierzchowiec skraca quest o ${cappedPct}%`}
              >
                <GameIcon name="horse" size={12} /> −{cappedPct}%
              </span>
            )}
            · <GameIcon name="bolt" size={14} /> −1
          </button>
        )}
        {q.state === 'active' && !ready && (
          <div>
            <div className="bar stam" style={{ height: 12 }}>
              <div className="fill" style={{ width: `${pct}%` }} />
            </div>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}
            >
              <span style={{ fontSize: 12, color: '#5a3a2a' }}>W drodze...</span>
              <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>
                {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
              </span>
            </div>
            {(() => {
              const skipCost = computeQuestSkipFullCost(remaining);
              // Half-skip: koszt proporcjonalny do pełnego (~50%). Wymaga min
              // 30s zostającego czasu — dla krótszych questów ukrywamy przycisk.
              const halfCost = computeQuestSkipHalfCost(remaining);
              const halfEligible = remaining >= 30_000;
              const canAfford = gems >= skipCost;
              return (
                <>
                  <button
                    type="button"
                    className="cbtn sm"
                    style={{
                      width: '100%',
                      marginTop: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      background: canAfford ? '#a0d8f0' : '#c8c0a8',
                      opacity: canAfford ? 1 : 0.6,
                    }}
                    disabled={!canAfford}
                    onClick={() => canAfford && onSkip(q.id, skipCost)}
                  >
                    ZAKOŃCZ TERAZ · <IcoGem s={13} /> {skipCost}
                  </button>
                  {halfEligible && (
                    <div style={{ marginTop: 6, textAlign: 'center' }}>
                      <GemSinkButton
                        label="SKRÓĆ O 50%"
                        cost={halfCost}
                        playerGems={gems}
                        pending={false}
                        onClick={() => onSkipHalf(q.id)}
                        disabledReason="Zmniejsza pozostały czas questa o połowę."
                      />
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
        {ready && (
          <button
            type="button"
            className="cbtn lg"
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
            onClick={() => onCollect(q.id)}
          >
            <GameIcon name="gift" size={16} /> ODBIERZ NAGRODĘ!
          </button>
        )}
        {q.state === 'done' && cooldown && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              width: '100%',
              padding: '6px 0',
              background: '#edf5e4',
              border: '2.5px solid #4a7c3a',
              borderRadius: 8,
              color: '#4a7c3a',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <GameIcon name="check" size={14} /> Ukończono dzisiaj
            </div>
            <div className="mono" style={{ fontSize: 12 }}>
              Dostępne ponownie za <b>{refreshIn}</b>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
