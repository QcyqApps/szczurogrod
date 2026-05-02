// TapBattleModal — 4-sec "FURIA" mini-gra na world bossa.
//
// Otwierana po `worldBoss.startHit` z parametrami sesji. Gracz tapuje
// sprite bossa, każdy tap: shake (klasa toggluje .shake ↔ .shake-alt),
// floating "+1" (reuse .dmg-num + dmgFloat keyframes), licznik tapów,
// crack overlay'e progresują przy 8/16/24 tapach. Co 5 tapów COMBO
// burst, FINISHER overlay przy 25+. Po końcu czasu modal woła
// `onCommit(taps)` — parent wywołuje commitHit i pokazuje result.
//
// Anti-cheat dzieje się po stronie servera: clamp do MAX_TAPS, walidacja
// duration. Klient zaufaniu nie podlega — wszystko w response z servera.

import { useEffect, useRef, useState } from 'react';
import { GameIcon } from '@/components/game-icons';
import type { IconName } from '@/components/game-icons';
import { useT } from '@/i18n';

interface Props {
  bossName: string;
  bossIcon: IconName;
  bossFlavor: string;
  durationMs: number;
  minTaps: number;
  maxTaps: number;
  onCommit: (taps: number) => void;
}

interface FloatNum {
  id: number;
  x: number;
  y: number;
}

const FRAME_PX = 220;
const SPRITE_PX = 200;
const FLOAT_LIMIT = 12;

export function TapBattleModal({
  bossName,
  bossIcon,
  bossFlavor,
  durationMs,
  minTaps,
  maxTaps,
  onCommit,
}: Props) {
  const t = useT();
  const startedAtRef = useRef<number>(Date.now());
  const [now, setNow] = useState<number>(() => Date.now());
  const [tapCount, setTapCount] = useState(0);
  const [floats, setFloats] = useState<FloatNum[]>([]);
  const [shakeNonce, setShakeNonce] = useState(0);
  const [done, setDone] = useState(false);
  const [comboMilestone, setComboMilestone] = useState(0);
  const [burst, setBurst] = useState<string | null>(null);
  const [finisherShown, setFinisherShown] = useState(false);
  const tapCountRef = useRef(0);
  const committedRef = useRef(false);

  // Tick — re-render co 100ms dla countdown bar (mirror CombatView decision timer).
  useEffect(() => {
    const interval = setInterval(() => {
      const t0 = startedAtRef.current;
      const elapsed = Date.now() - t0;
      setNow(Date.now());
      if (elapsed >= durationMs && !committedRef.current) {
        committedRef.current = true;
        setDone(true);
        clearInterval(interval);
        // 300ms beat dla "FINISHER!" / final shake przed commit'em.
        setTimeout(() => onCommit(tapCountRef.current), 300);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [durationMs, onCommit]);

  function handleTap(e: React.PointerEvent<HTMLDivElement>) {
    if (done) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newCount = tapCountRef.current + 1;
    tapCountRef.current = newCount;
    setTapCount(newCount);
    setShakeNonce((n) => n + 1);

    // Float — cap to FLOAT_LIMIT, drop oldest.
    const floatId = Date.now() + Math.random();
    setFloats((fs) => {
      const next = fs.length >= FLOAT_LIMIT ? fs.slice(1) : fs;
      return [...next, { id: floatId, x, y }];
    });
    setTimeout(() => {
      setFloats((fs) => fs.filter((f) => f.id !== floatId));
    }, 900);

    // Combo milestone co 5 tapów.
    const newMilestone = Math.floor(newCount / 5);
    if (newMilestone > comboMilestone && newCount >= 5) {
      setComboMilestone(newMilestone);
      setBurst(`x${newCount} COMBO!`);
      setTimeout(() => setBurst((b) => (b?.startsWith(`x${newCount}`) ? null : b)), 500);
    }

    // Finisher one-shot.
    if (newCount >= 25 && !finisherShown) {
      setFinisherShown(true);
      setBurst(t('worldBoss.tap.finisher'));
      setTimeout(() => setBurst((b) => (b === t('worldBoss.tap.finisher') ? null : b)), 800);
    }
  }

  const elapsed = now - startedAtRef.current;
  const pct = Math.max(0, Math.min(100, 100 - (elapsed / durationMs) * 100));
  const barColor = pct > 40 ? '#6ad060' : pct > 15 ? '#d4a24c' : '#c83232';
  const secondsLeft = Math.max(0, (durationMs - elapsed) / 1000);

  // Live multiplier preview — server clampuje, ale UI pokazuje co gracz właśnie ma.
  const previewClamp = Math.max(minTaps, Math.min(maxTaps, tapCount));
  const previewMul = 0.6 + ((previewClamp - minTaps) / (maxTaps - minTaps)) * 0.8;

  // Crack opacities — progresują z tap count.
  const crack1 = tapCount >= 8 ? 1 : 0;
  const crack2 = tapCount >= 16 ? 1 : 0;
  const crack3 = tapCount >= 24 ? 1 : 0;

  const shakeClass = shakeNonce % 2 === 0 ? 'shake' : 'shake-alt';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,5,30,0.88)',
        zIndex: 110,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        animation: 'modal-fade-in 0.18s ease-out',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation',
      }}
    >
      {/* Title FURIA */}
      <div
        className="h-display"
        style={{
          fontSize: 36,
          color: '#ffd76a',
          marginBottom: 4,
          animation: 'boss-intro-pulse 1.2s ease-in-out infinite',
          textShadow: '4px 4px 0 #1a0510',
        }}
      >
        {t('worldBoss.tap.title')}
      </div>
      <div
        className="flavor light"
        style={{ fontSize: 14, color: '#ffd0a0', marginBottom: 14, opacity: 0.9 }}
      >
        {t('worldBoss.tap.subtitle')}
      </div>

      {/* Countdown bar */}
      <div
        style={{
          width: '100%',
          maxWidth: 320,
          height: 16,
          background: '#1a0510',
          border: '2.5px solid #2a1810',
          borderRadius: 6,
          overflow: 'hidden',
          marginBottom: 6,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${pct}%`,
            background: barColor,
            transition: 'width 100ms linear, background-color 200ms',
          }}
        />
        <div
          className="mono"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
            textShadow: '1px 1px 0 #2a1810',
          }}
        >
          {t('worldBoss.tap.timeLeft').replace('{s}', secondsLeft.toFixed(1))}
        </div>
      </div>

      {/* Boss frame — clickable target */}
      <div
        onPointerDown={handleTap}
        style={{
          position: 'relative',
          width: FRAME_PX,
          height: FRAME_PX,
          marginTop: 12,
          marginBottom: 12,
          border: '4px solid #c83232',
          borderRadius: 16,
          background: '#3a1a2a',
          boxShadow: '0 0 32px rgba(200, 50, 50, 0.6), inset 0 0 24px rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: done ? 'default' : 'pointer',
          animation: 'boss-intro-scale 0.4s ease-out',
          touchAction: 'manipulation',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          key={shakeNonce}
          className={shakeClass}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <GameIcon name={bossIcon} size={SPRITE_PX} />
        </div>

        {/* Crack overlays — proste SVG kresy, opacity progresuje z tap count. */}
        <CrackOverlay opacity={crack1} variant={1} />
        <CrackOverlay opacity={crack2} variant={2} />
        <CrackOverlay opacity={crack3} variant={3} />

        {/* Floating "+1" numbers przy każdym tapie. */}
        {floats.map((f) => (
          <div
            key={f.id}
            className="dmg-num"
            style={{
              left: f.x,
              top: f.y,
              fontSize: 28,
              color: '#ffd76a',
              transform: 'translate(-50%, 0)',
            }}
          >
            +1
          </div>
        ))}

        {/* Combo / FINISHER burst overlay */}
        {burst && <div className="burst">{burst}</div>}
      </div>

      {/* Tap counter + multiplier preview */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
        }}
      >
        <div
          className="h-display clean"
          style={{ fontSize: 28, color: '#ffd76a' }}
        >
          {t('worldBoss.tap.tapsCounter')
            .replace('{n}', String(tapCount))
            .replace('{max}', String(maxTaps))}
        </div>
      </div>
      <div
        className="flavor light"
        style={{ fontSize: 14, color: '#ffd0a0', opacity: 0.9 }}
      >
        {t('worldBoss.tap.dmgPreview').replace('{mult}', previewMul.toFixed(2))}
      </div>

      {/* Boss name (small, na dole — kontekst) */}
      <div
        className="mono"
        style={{
          marginTop: 12,
          fontSize: 11,
          color: '#c8a890',
          textAlign: 'center',
          opacity: 0.75,
        }}
      >
        {bossName} · {bossFlavor}
      </div>
    </div>
  );
}

/** Trzy warianty kresów — każdy pojawia się przy innym progu (8/16/24). */
function CrackOverlay({ opacity, variant }: { opacity: number; variant: 1 | 2 | 3 }) {
  const paths: Record<1 | 2 | 3, string[]> = {
    1: ['M 30 40 L 60 80 L 50 120', 'M 80 30 L 110 70'],
    2: ['M 150 50 L 120 100 L 140 140', 'M 40 150 L 80 170 L 110 160'],
    3: [
      'M 100 30 L 90 80 L 110 130 L 100 180',
      'M 30 100 L 90 110 L 150 100',
      'M 60 60 L 80 100 L 60 140',
    ],
  };
  const lines = paths[variant];
  return (
    <svg
      viewBox="0 0 220 220"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity,
        transition: 'opacity 200ms ease-out',
        pointerEvents: 'none',
      }}
    >
      {lines.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke="#1a0510"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      ))}
    </svg>
  );
}
