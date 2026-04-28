import { useEffect, useState } from 'react';
import { GameIcon } from '@/components/game-icons';
import { IcoCoin, IcoGem } from '@/components/icons';
import { GemSinkButton, HelpIcon, StatBar } from '@/components/ui-common';
import { useT, useContentT } from '@/i18n';
import type { DictKey } from '@/i18n';
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

const DIFF_LABEL_KEY: Record<QuestDifficulty, DictKey> = {
  Łatwe: 'quests.diff.easy',
  Średnie: 'quests.diff.medium',
  Trudne: 'quests.diff.hard',
  'Ekstr.': 'quests.diff.extreme',
  Boss: 'quests.diff.boss',
};

const DIFF_HINT_KEY: Record<QuestDifficulty, DictKey> = {
  Łatwe: 'quests.diff.hint.easy',
  Średnie: 'quests.diff.hint.medium',
  Trudne: 'quests.diff.hint.hard',
  'Ekstr.': 'quests.diff.hint.extreme',
  Boss: 'quests.diff.hint.boss',
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
  const t = useT();
  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div className="panel" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GameIcon name="bolt" size={32} />
          <div style={{ flex: 1 }}>
            <StatBar cur={stamina.cur} max={stamina.max} kind="stam" label={t('quests.stamina.label')} />
          </div>
          <div
            className="pip gold"
            style={{ fontSize: 13 }}
            title={t('quests.stamina.regen.title')}
          >
            {stamina.cur >= stamina.max ? t('quests.stamina.full') : t('quests.stamina.regen')}
          </div>
        </div>
        {stamina.cur < stamina.max && (
          <div style={{ marginTop: 8, textAlign: 'center' }}>
            <GemSinkButton
              label={t('quests.stamina.refill')}
              cost={GEM_SINK_COSTS.staminaRefill}
              playerGems={gems}
              pending={refillStaminaPending}
              onClick={onRefillStamina}
              disabledReason={t('quests.stamina.refill.reason')}
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
        const maxVisibleLvl = quests.reduce((m, q) => Math.max(m, q.requiredLvl), 0);
        if (maxVisibleLvl > charLvl) return null;
        const nextLvl = charLvl + 1;
        return (
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: '#5a3a2a' }}>
            {t('quests.moreAt').replace('{lvl}', String(nextLvl))}
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
        <HelpIcon title={t('quests.help.title')} label={t('quests.help.label')}>
          <p style={{ margin: '0 0 8px' }}>
            {t('quests.help.p1.a')}<b>{t('quests.help.p1.b')}</b>{t('quests.help.p1.c')}<b>{t('quests.help.p1.d')}</b>{t('quests.help.p1.e')}
          </p>
          <p style={{ margin: '0 0 8px' }}>
            {t('quests.help.p2.a')}<b>{t('quests.help.p2.b')}</b>{t('quests.help.p2.c')}<b>{t('quests.help.p2.d')}</b>{t('quests.help.p2.c')}<b>{t('quests.help.p2.e')}</b>{t('quests.help.p2.c')}<b>{t('quests.help.p2.f')}</b>{t('quests.help.p2.c')}<b>{t('quests.help.p2.g')}</b>{t('quests.help.p2.h')}
          </p>
          <p style={{ margin: 0 }}>
            <b>{t('quests.help.p2.g')}</b>{t('quests.help.p3.a')}
          </p>
        </HelpIcon>
      </div>

      <button
        type="button"
        className="cbtn ghost"
        style={{ width: '100%', marginTop: 12 }}
        onClick={onBack}
      >
        {t('quests.back')}
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
  const t = useT();
  const tc = useContentT();
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
              {tc.questTitle(q.id, q.title)}
            </div>
            <span
              className="pip"
              style={{ fontSize: 10, background: diffColor, color: '#fff', cursor: 'help' }}
              title={t(DIFF_HINT_KEY[q.diff])}
            >
              {t(DIFF_LABEL_KEY[q.diff])}
            </span>
          </div>
          <div style={{ fontSize: 14, color: '#5a3a2a', lineHeight: 1.2, marginBottom: 4 }}>
            {tc.questDesc(q.id, q.desc)}
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
            🔒 {t('quests.locked').replace('{lvl}', String(q.requiredLvl))}
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
            {t('quests.start.btn').replace('{min}', String(startMin))}
            {mountActive && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  fontSize: 13,
                  opacity: 0.9,
                }}
                title={t('quests.mount.title').replace('{pct}', String(cappedPct))}
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
              <span style={{ fontSize: 12, color: '#5a3a2a' }}>{t('quests.active.travel')}</span>
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
                    {t('quests.skip.full')}<IcoGem s={13} /> {skipCost}
                  </button>
                  {halfEligible && (
                    <div style={{ marginTop: 6, textAlign: 'center' }}>
                      <GemSinkButton
                        label={t('quests.skip.half')}
                        cost={halfCost}
                        playerGems={gems}
                        pending={false}
                        onClick={() => onSkipHalf(q.id)}
                        disabledReason={t('quests.skip.half.reason')}
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
            <GameIcon name="gift" size={16} /> {t('quests.collect.btn')}
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
              <GameIcon name="check" size={14} /> {t('quests.done.today')}
            </div>
            <div className="mono" style={{ fontSize: 12 }}>
              {t('quests.done.refreshIn')}<b>{refreshIn}</b>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
