import { useEffect, useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { IcoClock, IcoCoin, IcoGem } from '@/components/icons';
import { Monster, monsterBySlug } from '@/components/monsters';
import type { MonsterSlug } from '@/components/monsters';
import { GemSinkButton } from '@/components/ui-common';
import type {
  Character,
  CombatState,
  TowerCurrentResponse,
  TowerLeaderboardResponse,
} from '@grodno/shared';
import {
  CombatView,
  type CombatEnemyInfo,
} from '@/screens/dungeon/CombatView';

type Tab = 'climb' | 'leaderboard';

export interface ScreenTowerProps {
  onBack: () => void;
}

export function ScreenTower({ onBack }: ScreenTowerProps) {
  const [tab, setTab] = useState<Tab>('climb');
  /** Aktywna sesja walki w Wieży — po engage trzymamy boss meta + initial state. */
  const [activeCombat, setActiveCombat] = useState<{
    state: CombatState;
    boss: TowerCurrentResponse['boss'];
  } | null>(null);
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  const currentQuery = trpc.tower.current.useQuery();
  const leaderboardQuery = trpc.tower.leaderboard.useQuery(undefined, {
    enabled: tab === 'leaderboard',
  });
  const meQuery = trpc.me.get.useQuery();

  const engageMut = trpc.tower.engage.useMutation({
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : 'Nie udało się.',
        accent: '#c83232',
      });
    },
  });
  const resurrectMut = trpc.tower.resurrect.useMutation({
    onSuccess: () => {
      pushToast({ text: 'Wskrzeszony. Do boju.', accent: '#2a4a3a' });
      void utils.tower.current.invalidate();
      void utils.me.get.invalidate();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : 'Nie udało się.',
        accent: '#c83232',
      });
    },
  });

  async function startCombat(boss: TowerCurrentResponse['boss']) {
    try {
      const state = await engageMut.mutateAsync();
      setActiveCombat({ state, boss });
    } catch (e) {
      console.error('tower.engage failed', e);
    }
  }

  function leaveCombat() {
    // `tower.current` został już invalidowany wewnątrz CombatView (mode='tower'),
    // więc nic tu nie inwalidujemy — meQuery też jest świeży.
    setActiveCombat(null);
  }

  if (activeCombat && meQuery.data) {
    const enemy = bossToCombatEnemyInfo(activeCombat.boss);
    return (
      <CombatView
        char={meQuery.data as Character}
        enemy={enemy}
        initialState={activeCombat.state}
        onBack={leaveCombat}
        mode="tower"
      />
    );
  }

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      {/* Header */}
      <div
        className="panel"
        style={{
          padding: 12,
          marginBottom: 10,
          background: 'linear-gradient(180deg, #2a1a3a 0%, #0a0014 100%)',
          color: '#fff',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="h-display" style={{ fontSize: 22, color: '#c8a0ff' }}>
          WIEŻA BEZDENNA
        </div>
        <div className="flavor light" style={{ fontSize: 14, marginTop: 4 }}>
          Nie ma dna. Jest tylko wyżej.
        </div>
        {currentQuery.data && (
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
            Najlepsze w tym tygodniu:{' '}
            <b className="mono">PIĘTRO {currentQuery.data.bestFloorThisWeek || '—'}</b>
            {' · '}
            <ResetCountdown target={currentQuery.data.nextResetAt} />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 6,
          marginBottom: 10,
        }}
      >
        {(['climb', 'leaderboard'] as Tab[]).map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="h-title"
              style={{
                padding: '6px 4px',
                borderRadius: 8,
                border: '2.5px solid #2a1810',
                background: active ? '#ffc830' : '#e8dcb9',
                color: '#2a1810',
                fontFamily: 'inherit',
                fontSize: 14,
                boxShadow: active ? '2px 2px 0 #2a1810' : 'none',
                cursor: 'pointer',
              }}
            >
              {t === 'climb' ? 'WSPINACZKA' : 'RANKING TYGODNIA'}
            </button>
          );
        })}
      </div>

      {tab === 'climb' && currentQuery.data && (
        <ClimbView
          data={currentQuery.data}
          playerGems={meQuery.data?.gems ?? 0}
          engagePending={engageMut.isPending}
          onEngage={(boss) => void startCombat(boss)}
          resurrectPending={resurrectMut.isPending}
          onResurrect={() => resurrectMut.mutate()}
        />
      )}

      {tab === 'leaderboard' && (
        <LeaderboardView
          data={leaderboardQuery.data}
          loading={leaderboardQuery.isLoading}
        />
      )}

      <button
        type="button"
        className="cbtn ghost"
        style={{ width: '100%', marginTop: 12 }}
        onClick={onBack}
      >
        ← Wróć
      </button>
    </div>
  );
}

/**
 * Adapter TowerBoss → CombatEnemyInfo. Portret renderujemy jako GameIcon
 * w kwadratowej ramce (matching dungeon visuals: border + warm fill).
 * `flavor` trzymamy krótkie — Wieża to dry encounter, bez lore per floor.
 */
function bossToCombatEnemyInfo(boss: TowerCurrentResponse['boss']): CombatEnemyInfo {
  const recipe = monsterBySlug(boss.monsterSlug as MonsterSlug);
  return {
    name: boss.name,
    lvl: boss.floor,
    flavor: `Piętro ${boss.floor}. Ktoś tu zawsze czeka.`,
    isBoss: true,
    renderPortrait: (size) => <Monster recipe={recipe} size={size} />,
  };
}

function ClimbView({
  data,
  playerGems,
  engagePending,
  onEngage,
  resurrectPending,
  onResurrect,
}: {
  data: TowerCurrentResponse;
  playerGems: number;
  engagePending: boolean;
  onEngage: (boss: TowerCurrentResponse['boss']) => void;
  resurrectPending: boolean;
  onResurrect: () => void;
}) {
  const { boss, currentFloor, failedUntil, gemResurrectCost } = data;
  const onCooldown = failedUntil !== null && failedUntil > Date.now();

  return (
    <div
      className="panel"
      style={{
        padding: 14,
        textAlign: 'center',
        background: 'linear-gradient(180deg, #3a2a5a 0%, #1a0a2a 100%)',
        color: '#fff',
      }}
    >
      <div className="mono" style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
        PIĘTRO
      </div>
      <div
        className="h-display"
        style={{
          fontSize: 38,
          color: '#ffc830',
          textShadow: '2px 2px 0 #2a1810',
          marginBottom: 8,
        }}
      >
        {currentFloor}
      </div>

      {/* Boss card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(0,0,0,0.35)',
          padding: 10,
          border: '2.5px solid #2a1810',
          borderRadius: 10,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 10,
            border: '3px solid #2a1810',
            background: '#c83232',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <Monster recipe={monsterBySlug(boss.monsterSlug as MonsterSlug)} size={68} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div className="h-title" style={{ fontSize: 14, color: '#ffc830' }}>
            {boss.name}
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
            ATK <b className="mono">{boss.atk}</b> · DEF <b className="mono">{boss.def}</b> ·
            MAG <b className="mono">{boss.mag}</b>
          </div>
          <div className="mono" style={{ fontSize: 13, opacity: 0.85 }}>
            {boss.hpMax.toLocaleString('pl-PL')} HP
          </div>
        </div>
      </div>

      {onCooldown ? (
        <div>
          <div style={{ fontSize: 13, color: '#ff8080', marginBottom: 6 }}>
            <IcoClock s={14} />{' '}
            <CooldownText target={failedUntil!} />
          </div>
          <GemSinkButton
            label="WSKRZEŚ"
            cost={gemResurrectCost}
            playerGems={playerGems}
            pending={resurrectPending}
            onClick={onResurrect}
            disabledReason="Pomiń cooldown."
            variant="primary"
            size="md"
            style={{ width: '100%' }}
          />
        </div>
      ) : (
        <button
          type="button"
          className="cbtn red lg"
          style={{ width: '100%' }}
          disabled={engagePending}
          onClick={() => onEngage(boss)}
        >
          {engagePending ? 'WCHODZĘ...' : 'NA GÓRĘ'}
        </button>
      )}

      {/* Next milestone hint */}
      <div style={{ marginTop: 8, fontSize: 14, opacity: 0.7 }}>
        {(() => {
          const nextMilestone = Math.ceil(currentFloor / 10) * 10;
          if (currentFloor % 10 === 0 && currentFloor > 0) {
            return `Piętro ${currentFloor}: milestone!`;
          }
          return `Za ${nextMilestone - currentFloor + 1} pięter: milestone (${500 * (nextMilestone / 10) ** 2}g + ${3 + nextMilestone / 10} gemów)`;
        })()}
      </div>
    </div>
  );
}

function LeaderboardView({
  data,
  loading,
}: {
  data: TowerLeaderboardResponse | undefined;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', fontSize: 13, color: '#5a3a2a', padding: 20 }}>
        Ładuję...
      </div>
    );
  }
  if (!data) return null;
  if (data.entries.length === 0) {
    return (
      <div
        className="flavor"
        style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', padding: 20 }}
      >
        Nikt jeszcze nie wspiął się w tym tygodniu. Bądź pierwszy.
      </div>
    );
  }
  const CLS_LABEL: Record<string, string> = {
    warrior: 'Wojownik',
    mage: 'Mag',
    rogue: 'Łotrzyk',
  };
  return (
    <div className="panel" style={{ padding: 4 }}>
      {data.entries.map((e, i, arr) => (
        <div
          key={e.characterId}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 8px',
            borderBottom: i < arr.length - 1 ? '1.5px dashed #c8b890' : 'none',
            background: i === 0 ? '#fff3cc' : 'transparent',
          }}
        >
          <div
            className="h-title"
            style={{
              fontSize: 14,
              minWidth: 30,
              textAlign: 'center',
              color: i === 0 ? '#d4a24c' : '#5a3a2a',
            }}
          >
            #{i + 1}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="h-title" style={{ fontSize: 14 }}>
              {e.name}
            </div>
            <div style={{ fontSize: 13, color: '#5a3a2a' }}>
              {CLS_LABEL[e.cls]} · LVL {e.lvl}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: '#c83232' }}>
              {e.bestFloor}
            </div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>piętro</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResetCountdown({ target }: { target: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const handle = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(handle);
  }, []);
  const diff = target - now;
  if (diff <= 0) return <span>reset za chwilę</span>;
  const d = Math.floor(diff / (24 * 3600_000));
  const h = Math.floor((diff % (24 * 3600_000)) / 3600_000);
  return (
    <span>
      reset za <b className="mono">{d}d {h}h</b>
    </span>
  );
}

function CooldownText({ target }: { target: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const handle = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(handle);
  }, []);
  const diff = Math.max(0, target - now);
  const min = Math.floor(diff / 60_000);
  const sec = Math.floor((diff % 60_000) / 1000);
  return (
    <>
      Odpoczynek: <b className="mono">{min}:{String(sec).padStart(2, '0')}</b>
    </>
  );
}

// Helper imports for IcoCoin/IcoGem used in comments only — suppress warning
void IcoCoin;
void IcoGem;
