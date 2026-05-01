// Run screen — mounts on `Hub.startRun`, sends `survivor.startRun`, boots
// the Pixi loop, watches state for end conditions, then sends `finishRun`
// and forwards the report to the End screen.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { applySkills, getStage, type SkillNodeId } from '@grodno/shared/survivor';
import type { CharacterClass } from '@grodno/shared';
import { trpc } from '@/api/trpc';
import { useT, type DictKey } from '@/i18n';
import { initRun } from '@/game/init';
import type { RunState } from '@/game/types';
import { PixiStage } from '@/render/PixiStage';

export interface RunScreenProps {
  stageId: number;
  characterClass: CharacterClass | null;
  skillProgression: ReadonlyArray<{ nodeId: string; level: number }>;
  onEnd: (report: RunReport) => void;
}

export interface RunReport {
  runId: string;
  stageId: number;
  kills: number;
  bossKilled: boolean;
  durationMs: number;
}

type Phase = 'starting' | 'running' | 'sending';

/** Show "BOSS INCOMING" warning during the last 5 seconds before bossEntryMs. */
const BOSS_WARNING_LEAD_MS = 5_000;

/** Po tym czasie pojawia się hint "dotknij aby kontynuować". Banner zostaje
 * widoczny do ręcznego tapu — bez auto-advance, gracz sam kontroluje moment
 * przejścia do End screen'a. */
const RUN_END_TAP_HINT_AFTER_MS = 1100;

export function Run({ stageId, characterClass, skillProgression, onEnd }: RunScreenProps) {
  const t = useT();
  const stage = getStage(stageId);
  const [phase, setPhase] = useState<Phase>('starting');
  const [error, setError] = useState<string | null>(null);
  const [hpFrac, setHpFrac] = useState(1);
  // Numeric HP/maxHp dla pillsa — odświeżamy razem z hpFrac (oba pochodzą
  // z tego samego state'u, więc jeden próg dyskretyzuje renders).
  const [playerHp, setPlayerHp] = useState(0);
  const [playerMaxHp, setPlayerMaxHp] = useState(0);
  const [killCount, setKillCount] = useState(0);
  const [tSec, setTSec] = useState(0);
  const [showBossWarning, setShowBossWarning] = useState(false);
  const runIdRef = useRef<string | null>(null);
  const stateRef = useRef<RunState | null>(null);
  const skillsRef = useRef<ReturnType<typeof initRun>['skills'] | null>(null);

  const skills = useMemo(() => {
    const map = new Map<SkillNodeId, number>();
    for (const row of skillProgression) {
      map.set(row.nodeId as SkillNodeId, row.level);
    }
    return applySkills(map);
  }, [skillProgression]);

  const startMutation = trpc.survivor.startRun.useMutation({
    onSuccess: (data) => {
      runIdRef.current = data.runId;
      const init = initRun({ stageId, seed: data.seed, skills });
      stateRef.current = init.state;
      skillsRef.current = init.skills;
      setPhase('running');
    },
    onError: (e) => {
      setError(e.message);
    },
  });

  const finishMutation = trpc.survivor.finishRun.useMutation();

  useEffect(() => {
    startMutation.mutate({ stageId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Run-end transition: gdy status flipnie (won/lost), zapisujemy raport.
  // Mutation leci w tle (server commituje run niezależnie, getHub na End screen
  // pokaże fresh state). Banner pokazuje się od razu, hint "dotknij aby
  // kontynuować" fade'uje się od dołu po RUN_END_TAP_HINT_AFTER_MS, a
  // przejście do End screen'a wymaga ręcznego tapu — bez auto-advance, żeby
  // gracz miał kontrolę nad pacingiem.
  const [endReport, setEndReport] = useState<RunReport | null>(null);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (!endReport) return;
    const hintTimer = setTimeout(() => setCanSkip(true), RUN_END_TAP_HINT_AFTER_MS);
    return () => clearTimeout(hintTimer);
  }, [endReport]);

  useEffect(() => {
    return () => {
      if (damageFlashTimerRef.current) clearTimeout(damageFlashTimerRef.current);
    };
  }, []);

  const handleSkip = useCallback(() => {
    if (!canSkip || !endReport) return;
    onEnd(endReport);
  }, [canSkip, endReport, onEnd]);

  // Watch state for end + report HUD-relevant values.
  const lastReportedRef = useRef({ killCount: 0, hp: 1, tSec: 0, warning: false, bossSpawned: false, contactHits: 0 });
  const [shakeKey, setShakeKey] = useState(0);
  // Damage feedback: dwa stany żeby pozwolić CSS animacji rerun bez remount'u.
  // `damageShakeKey` toggle'uje className wrapper'a (parzysty/nieparzysty
  // → damage-shake-a/b, identyczne keyframes, restart animacji); `damageFlashKey`
  // służy jako React key dla overlay'a — incrementuje się przy każdym hit'cie,
  // overlay się remontuje i animacja leci od zera.
  const [damageShakeKey, setDamageShakeKey] = useState(0);
  const [damageFlashKey, setDamageFlashKey] = useState(0);
  const [showDamageFlash, setShowDamageFlash] = useState(false);
  const damageFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTick = () => {
    const s = stateRef.current;
    if (!s || !stage) return;
    const last = lastReportedRef.current;
    const hpFracNow = s.player.maxHp > 0 ? s.player.hp / s.player.maxHp : 0;
    // Pierwszy tick: inicjalizujemy numeric HP nawet jeśli frac == 1, żeby
    // pillsy miały realne liczby zamiast "0/0" przed pierwszym hit'em.
    if (Math.abs(hpFracNow - last.hp) > 0.005 || playerMaxHp === 0) {
      last.hp = hpFracNow;
      setHpFrac(hpFracNow);
      setPlayerHp(s.player.hp);
      setPlayerMaxHp(s.player.maxHp);
    }
    if (s.killCount !== last.killCount) {
      last.killCount = s.killCount;
      setKillCount(s.killCount);
    }
    const tSecNow = Math.floor(s.t / 1000);
    if (tSecNow !== last.tSec) {
      last.tSec = tSecNow;
      setTSec(tSecNow);
    }
    const warningNow =
      !s.bossSpawned &&
      s.t >= stage.bossEntryMs - BOSS_WARNING_LEAD_MS &&
      s.t < stage.bossEntryMs;
    if (warningNow !== last.warning) {
      last.warning = warningNow;
      setShowBossWarning(warningNow);
    }
    if (s.bossSpawned !== last.bossSpawned) {
      last.bossSpawned = s.bossSpawned;
      if (s.bossSpawned) {
        setShakeKey((k) => k + 1);
      }
    }
    // Contact-hit feedback: trigger shake + red flash.
    if (s.contactHitCount !== last.contactHits) {
      last.contactHits = s.contactHitCount;
      setDamageShakeKey((k) => k + 1);
      setDamageFlashKey((k) => k + 1);
      setShowDamageFlash(true);
      // Reset flash visibility tak żeby kolejny hit (gdy poprzedni jeszcze
      // animuje) miał świeży mount. Czas dopasowany do animation duration
      // w global.css (.damage-flash → 0.32s).
      if (damageFlashTimerRef.current) clearTimeout(damageFlashTimerRef.current);
      damageFlashTimerRef.current = setTimeout(() => setShowDamageFlash(false), 320);
    }
    if (s.status !== 'running' && phase === 'running') {
      setPhase('sending');
      const runId = runIdRef.current;
      if (!runId) return;
      const report: RunReport = {
        runId,
        stageId,
        kills: s.killCount,
        bossKilled: s.bossKilled,
        durationMs: Math.floor(s.t),
      };
      // Mutation fire-and-forget — End screen i tak refetchuje getHub żeby
      // zobaczyć fresh okruchy/maxStage. Transition do End screen sterujemy
      // własnym timerem (RUN_END_AUTO_ADVANCE_MS), nie czasem mutation roundtripu.
      finishMutation.mutate(report);
      setEndReport(report);
    }
  };

  // Abandon — flip status do 'lost' żeby istniejący onTick watcher wysłał
  // finishRun (kills get paid out, no boss bonus) i wrócił do huba normalną
  // ścieżką End screen → onEnd. Nie potrzeba osobnej mutation ani dedicated
  // server endpoint'u — porzucony run = przegrany run, server tak czy owak
  // weryfikuje payout (kills * 2 * stageMult, bez boss bonus'a).
  const abandon = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.status !== 'running') return;
    s.status = 'lost';
  }, []);

  if (!stage) {
    return <div style={{ padding: 24 }}>{t('run.unknownStage')}</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: 'var(--danger)' }}>
        {t('run.error')}: {error}
      </div>
    );
  }

  if (phase === 'starting' || !stateRef.current || !skillsRef.current) {
    return <div style={{ padding: 24 }}>{t('run.loading')}</div>;
  }

  const status = stateRef.current.status;

  // Damage shake klasa toggle'uje między 'damage-shake-a' i 'damage-shake-b'
  // (identyczne keyframes — class-swap restartuje animację bez remountu DOM).
  // Brak shake'a na key=0 (initial) żeby uniknąć animacji przy mount.
  const damageShakeClass =
    damageShakeKey === 0
      ? ''
      : damageShakeKey % 2 === 1
      ? 'damage-shake-a'
      : 'damage-shake-b';

  return (
    <div
      className={damageShakeClass}
      style={{
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        position: 'relative',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Hud
        hpFrac={hpFrac}
        playerHp={playerHp}
        playerMaxHp={playerMaxHp}
        killCount={killCount}
        tSec={tSec}
        bossEntrySec={Math.floor(stage.bossEntryMs / 1000)}
        stageNameKey={stageId}
        onAbandon={status === 'running' ? abandon : null}
      />
      <div
        key={shakeKey}
        className={shakeKey > 0 ? 'screen-shake' : undefined}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PixiStage
          state={stateRef.current}
          skills={skillsRef.current}
          stage={stage}
          characterClass={characterClass ?? 'warrior'}
          onTick={onTick}
        />
      </div>
      {showDamageFlash && status === 'running' && (
        <div key={damageFlashKey} className="damage-flash" aria-hidden="true" />
      )}
      {showBossWarning && status === 'running' && <BossWarning />}
      {status !== 'running' && (
        <RunEndBanner
          status={status}
          canSkip={canSkip}
          onSkip={handleSkip}
        />
      )}
    </div>
  );
}

function Hud({
  hpFrac,
  killCount,
  tSec,
  bossEntrySec,
  stageNameKey,
  playerHp,
  playerMaxHp,
  onAbandon,
}: {
  hpFrac: number;
  killCount: number;
  tSec: number;
  bossEntrySec: number;
  stageNameKey: number;
  playerHp: number;
  playerMaxHp: number;
  onAbandon: (() => void) | null;
}) {
  const t = useT();
  const stageName = t(`stage.${stageNameKey}.name` as DictKey);
  const bossIn = bossEntrySec - tSec;
  const bossImminent = bossIn <= 5 && bossIn > 0;
  const bossHere = bossIn <= 0;
  // Render w pillsach — kompaktowy układ skanowalny pod presją.
  // HP po lewej (krytyczna info → największa), pośrodku stage + timer,
  // po prawej kill counter + boss countdown.
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <HpPill hp={playerHp} maxHp={playerMaxHp} hpFrac={hpFrac} />
      <Pill bg="var(--parchment-mid)">
        <span className="h-display" style={{ fontSize: 14, letterSpacing: 0.5 }}>
          {stageName}
        </span>
        <span
          className="h-display"
          style={{
            fontSize: 14,
            color: 'var(--ink-warm)',
            marginLeft: 6,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatTime(tSec)}
        </span>
      </Pill>
      <div style={{ flex: 1 }} />
      <Pill bg="var(--parchment-mid)">
        <span style={{ fontSize: 13, color: 'var(--ink-mid)' }}>
          {t('run.kills')}
        </span>
        <span
          className="h-display"
          style={{
            fontSize: 16,
            marginLeft: 6,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {killCount}
        </span>
      </Pill>
      {bossHere ? (
        <Pill
          bg="linear-gradient(180deg, #c83232, #8a1818)"
          color="#fff3e0"
          pulse
        >
          <span
            className="h-display"
            style={{ fontSize: 14, letterSpacing: 1 }}
          >
            {t('run.boss.now')}
          </span>
        </Pill>
      ) : (
        <Pill
          bg={
            bossImminent
              ? 'linear-gradient(180deg, #ffd76a, #c83232)'
              : 'var(--parchment-mid)'
          }
          color={bossImminent ? '#2a1810' : undefined}
          pulse={bossImminent}
        >
          <span style={{ fontSize: 13, color: bossImminent ? '#2a1810' : 'var(--ink-mid)' }}>
            {t('run.boss.in')}
          </span>
          <span
            className="h-display"
            style={{
              fontSize: 16,
              marginLeft: 6,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {bossIn}s
          </span>
        </Pill>
      )}
      {onAbandon && <AbandonButton onAbandon={onAbandon} />}
    </div>
  );
}

/** Wyjście z runu w trakcie walki. Two-click confirm: pierwszy klik
 * przełącza na stan "PORZUĆ?" (auto-reset po 3s), drugi klik faktycznie
 * porzuca. Świadoma friction żeby gracz nie cofnął siebie przez przypadek
 * naciśniętym pillem podczas mashowania crosshair'a. */
function AbandonButton({ onAbandon }: { onAbandon: () => void }) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!confirming) return;
    const id = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(id);
  }, [confirming]);
  return (
    <button
      type="button"
      className="h-display"
      onClick={() => {
        if (confirming) onAbandon();
        else setConfirming(true);
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        background: confirming
          ? 'linear-gradient(180deg, #c83232, #8a1818)'
          : 'var(--parchment-mid)',
        color: confirming ? '#fff3e0' : 'var(--ink-warm)',
        border: '2.5px solid var(--ink-dark)',
        borderRadius: 999,
        boxShadow: '2px 2px 0 var(--ink-dark)',
        fontFamily: 'inherit',
        fontSize: 13,
        letterSpacing: 0.5,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {confirming ? t('run.abandon.confirm') : t('run.abandon')}
    </button>
  );
}

/** HP indicator — prominent, bo to najważniejsza informacja w walce.
 *  Number primary, mini-bar pod spodem dla quick visual cue. Kolor + szerokość
 *  bara reagują na hpFrac. Heart-shape SVG zamiast emoji żeby trzymać estetykę. */
function HpPill({ hp, maxHp, hpFrac }: { hp: number; maxHp: number; hpFrac: number }) {
  const safeFrac = Math.max(0, Math.min(1, hpFrac));
  const critical = safeFrac <= 0.25;
  const low = safeFrac <= 0.4;
  const barColor = critical ? '#c83232' : low ? '#d48020' : '#4a7c3a';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 10px 4px 8px',
        background: 'var(--parchment-mid)',
        border: '2.5px solid var(--ink-dark)',
        borderRadius: 999,
        boxShadow: '2px 2px 0 var(--ink-dark)',
        minWidth: 132,
      }}
    >
      <Heart fill={barColor} pulse={critical} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        <div
          className="h-display"
          style={{
            fontSize: 14,
            lineHeight: 1,
            color: 'var(--ink-dark)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {Math.max(0, Math.ceil(hp))}
          <span style={{ fontSize: 11, color: 'var(--ink-warm)' }}>/{maxHp}</span>
        </div>
        <div
          style={{
            height: 5,
            background: 'rgba(42, 24, 16, 0.18)',
            border: '1.5px solid var(--ink-dark)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${safeFrac * 100}%`,
              height: '100%',
              background: barColor,
              transition: 'width 120ms linear, background 200ms ease',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Heart({ fill, pulse }: { fill: string; pulse: boolean }) {
  return (
    <svg
      width="20"
      height="18"
      viewBox="0 0 20 18"
      className={pulse ? 'boss-warning-pulse' : undefined}
      style={{ flexShrink: 0 }}
    >
      <path
        d="M10 16 C 3 11.5, 1 7, 3 4 C 4.5 1.8, 7.5 1.8, 10 4.2 C 12.5 1.8, 15.5 1.8, 17 4 C 19 7, 17 11.5, 10 16 Z"
        fill={fill}
        stroke="#2a1810"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Pill({
  bg,
  color,
  pulse,
  children,
}: {
  bg: string;
  color?: string;
  pulse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={pulse ? 'boss-warning-pulse' : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        padding: '4px 10px',
        background: bg,
        color: color ?? 'var(--ink-dark)',
        border: '2.5px solid var(--ink-dark)',
        borderRadius: 999,
        boxShadow: '2px 2px 0 var(--ink-dark)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function BossWarning() {
  const t = useT();
  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        textAlign: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        className="h-display boss-warning-pulse"
        style={{
          display: 'inline-block',
          padding: '6px 18px',
          fontSize: 22,
          color: '#fff3e0',
          background: 'rgba(200, 50, 50, 0.85)',
          border: '3px solid #2a1810',
          borderRadius: 10,
          boxShadow: '3px 3px 0 #2a1810',
          letterSpacing: 2,
        }}
      >
        {t('run.boss.warning')}
      </div>
    </div>
  );
}

function RunEndBanner({
  status,
  canSkip,
  onSkip,
}: {
  status: 'won' | 'lost';
  canSkip: boolean;
  onSkip: () => void;
}) {
  const t = useT();
  const won = status === 'won';
  // Cały backdrop jest klikalny (po pojawieniu się hint'a). Tap = skip
  // odliczania, natychmiastowy przeskok do End screen. Przed canSkip
  // pointerEvents 'none' żeby gracz nie zniknął banner przed jego pełnym
  // wyświetleniem.
  return (
    <div
      onClick={canSkip ? onSkip : undefined}
      className="run-end-backdrop-enter"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(42, 24, 16, 0.55)',
        borderRadius: 14,
        pointerEvents: canSkip ? 'auto' : 'none',
        cursor: canSkip ? 'pointer' : 'default',
      }}
    >
      <div
        className="panel run-end-banner-enter"
        style={{
          padding: '20px 36px',
          background: won
            ? 'linear-gradient(180deg, #ffd76a 0%, #d4a24c 100%)'
            : 'linear-gradient(180deg, #c83232 0%, #5a1818 100%)',
          color: won ? 'var(--ink-dark)' : '#fff3e0',
          textAlign: 'center',
        }}
      >
        <div className="h-display" style={{ fontSize: 36, letterSpacing: 2 }}>
          {won ? t('run.banner.won') : t('run.banner.lost')}
        </div>
        <div className="flavor" style={{ fontSize: 18, marginTop: 6 }}>
          {won ? t('run.banner.won.flavor') : t('run.banner.lost.flavor')}
        </div>
      </div>
      {/* Hint pozycjonowany absolutnie na dole backdropu — nie pcha layoutu
        * banneru gdy się pojawia. Slide-up + fade-in z `tap-hint-enter`,
        * subtle pulse podtrzymuje uwagę. */}
      {canSkip && (
        <div
          className="flavor tap-hint-enter"
          style={{
            position: 'absolute',
            bottom: 28,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 16,
            color: '#fff3e0',
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            letterSpacing: 0.5,
            pointerEvents: 'none',
          }}
        >
          {t('run.banner.tap')}
        </div>
      )}
    </div>
  );
}
