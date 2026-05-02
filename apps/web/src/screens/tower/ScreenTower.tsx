import { useEffect, useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { IcoClock, IcoCoin, IcoGem } from '@/components/icons';
import { Monster, monsterBySlug } from '@/components/monsters';
import type { MonsterSlug } from '@/components/monsters';
import { GemSinkButton } from '@/components/ui-common';
import { useT, tStatic , translateServerError} from '@/i18n';
import type { DictKey } from '@/i18n';
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
  const t = useT();
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
        text: err instanceof TRPCClientError ? translateServerError(err.message) : tStatic('tower.toast.failed'),
        accent: '#c83232',
      });
    },
  });
  const resurrectMut = trpc.tower.resurrect.useMutation({
    onSuccess: () => {
      pushToast({ text: tStatic('tower.toast.resurrected'), accent: '#2a4a3a' });
      void utils.tower.current.invalidate();
      void utils.me.get.invalidate();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? translateServerError(err.message) : tStatic('tower.toast.failed'),
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
    const enemy = bossToCombatEnemyInfo(activeCombat.boss, t);
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
          {t('tower.title')}
        </div>
        <div className="flavor light" style={{ fontSize: 14, marginTop: 4 }}>
          {t('tower.flavor')}
        </div>
        {currentQuery.data && (
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
            {t('tower.bestThisWeek')}{' '}
            <b className="mono">
              {t('tower.floorLabel').replace(
                '{n}',
                String(currentQuery.data.bestFloorThisWeek || '—'),
              )}
            </b>
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
        {(['climb', 'leaderboard'] as Tab[]).map((tabId) => {
          const active = tabId === tab;
          return (
            <button
              key={tabId}
              type="button"
              onClick={() => setTab(tabId)}
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
              {tabId === 'climb' ? t('tower.tab.climb') : t('tower.tab.leaderboard')}
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
        {t('tower.back')}
      </button>
    </div>
  );
}

/**
 * Adapter TowerBoss → CombatEnemyInfo. Portret renderujemy jako GameIcon
 * w kwadratowej ramce (matching dungeon visuals: border + warm fill).
 * `flavor` trzymamy krótkie — Wieża to dry encounter, bez lore per floor.
 */
function bossToCombatEnemyInfo(
  boss: TowerCurrentResponse['boss'],
  t: (key: DictKey) => string,
): CombatEnemyInfo {
  const recipe = monsterBySlug(boss.monsterSlug as MonsterSlug);
  return {
    name: boss.name,
    lvl: boss.floor,
    flavor: t('tower.bossFlavor').replace('{n}', String(boss.floor)),
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
  const t = useT();
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
        {t('tower.floor')}
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
            label={t('tower.resurrect.btn')}
            cost={gemResurrectCost}
            playerGems={playerGems}
            pending={resurrectPending}
            onClick={onResurrect}
            disabledReason={t('tower.resurrect.disabled')}
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
          {engagePending ? t('tower.btn.entering') : t('tower.btn.climb')}
        </button>
      )}

      {/* Next milestone hint */}
      <div style={{ marginTop: 8, fontSize: 14, opacity: 0.7 }}>
        {(() => {
          const nextMilestone = Math.ceil(currentFloor / 10) * 10;
          if (currentFloor % 10 === 0 && currentFloor > 0) {
            return t('tower.milestone.hit').replace('{n}', String(currentFloor));
          }
          return t('tower.milestone.next')
            .replace('{n}', String(nextMilestone - currentFloor + 1))
            .replace('{g}', String(500 * (nextMilestone / 10) ** 2))
            .replace('{x}', String(3 + nextMilestone / 10));
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
  const t = useT();
  if (loading) {
    return (
      <div style={{ textAlign: 'center', fontSize: 13, color: '#5a3a2a', padding: 20 }}>
        {t('tower.loading')}
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
        {t('tower.empty')}
      </div>
    );
  }
  const CLS_LABEL_KEY: Record<string, DictKey> = {
    warrior: 'tower.cls.warrior',
    mage: 'tower.cls.mage',
    rogue: 'tower.cls.rogue',
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
              {t(CLS_LABEL_KEY[e.cls] ?? 'tower.cls.warrior')} · LVL {e.lvl}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: '#c83232' }}>
              {e.bestFloor}
            </div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>{t('tower.entry.floor')}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResetCountdown({ target }: { target: number }) {
  const t = useT();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const handle = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(handle);
  }, []);
  const diff = target - now;
  if (diff <= 0) return <span>{t('tower.reset.soon')}</span>;
  const d = Math.floor(diff / (24 * 3600_000));
  const h = Math.floor((diff % (24 * 3600_000)) / 3600_000);
  return (
    <span>
      {t('tower.reset.in')} <b className="mono">{d}d {h}h</b>
    </span>
  );
}

function CooldownText({ target }: { target: number }) {
  const t = useT();
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
      {t('tower.cooldown.label')} <b className="mono">{min}:{String(sec).padStart(2, '0')}</b>
    </>
  );
}

// Helper imports for IcoCoin/IcoGem used in comments only — suppress warning
void IcoCoin;
void IcoGem;
