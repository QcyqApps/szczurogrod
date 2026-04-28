import { useEffect } from 'react';
import { useT } from '@/i18n';
import { LangPicker } from '@/i18n/LangPicker';
import { GrodnoNightBackdrop } from './NightBackdrop';

export interface ScreenSplashProps {
  onContinue: () => void;
}

export function ScreenSplash({ onContinue }: ScreenSplashProps) {
  const t = useT();
  useEffect(() => {
    const timer = setTimeout(onContinue, 2400);
    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <div
      onClick={onContinue}
      style={{
        position: 'absolute',
        inset: 0,
        cursor: 'pointer',
        background: '#1a0a2a',
        overflow: 'hidden',
      }}
    >
      <GrodnoNightBackdrop />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          textAlign: 'center',
        }}
      >
        <div style={{ animation: 'splash-pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <div
            style={{
              width: 160,
              height: 160,
              background: '#ffc830',
              border: '5px solid #2a1810',
              borderRadius: 24,
              boxShadow: '6px 6px 0 #2a1810, 0 0 80px rgba(255,200,48,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transform: 'rotate(-4deg)',
            }}
          >
            <svg width="120" height="120" viewBox="0 0 100 100">
              {/* blade */}
              <rect x="44" y="18" width="12" height="52" fill="#c8c8d0" stroke="#2a1810" strokeWidth="3" />
              {/* tip */}
              <polygon points="44,18 56,18 50,8" fill="#c8c8d0" stroke="#2a1810" strokeWidth="3" strokeLinejoin="round" />
              {/* blade highlight */}
              <line x1="50" y1="20" x2="50" y2="66" stroke="#fff" strokeWidth="1.5" opacity="0.6" />
              {/* crossguard */}
              <rect x="32" y="66" width="36" height="8" fill="#d4a24c" stroke="#2a1810" strokeWidth="3" rx="1" />
              {/* grip (wrapped leather) */}
              <rect x="45" y="74" width="10" height="16" fill="#5a3a1a" stroke="#2a1810" strokeWidth="3" />
              <line x1="45" y1="78" x2="55" y2="78" stroke="#2a1810" strokeWidth="1.5" opacity="0.7" />
              <line x1="45" y1="82" x2="55" y2="82" stroke="#2a1810" strokeWidth="1.5" opacity="0.7" />
              <line x1="45" y1="86" x2="55" y2="86" stroke="#2a1810" strokeWidth="1.5" opacity="0.7" />
              {/* pommel gem */}
              <circle cx="50" cy="92" r="5" fill="#c83232" stroke="#2a1810" strokeWidth="2.5" />
              <circle cx="48.5" cy="90.5" r="1.2" fill="#ff8888" opacity="0.8" />
            </svg>
          </div>
        </div>
        <div
          className="h-display"
          style={{
            fontSize: 44,
            color: '#ffc830',
            marginTop: 24,
            textShadow:
              '3px 3px 0 #2a1810, -3px 3px 0 #2a1810, 3px -3px 0 #2a1810, -3px -3px 0 #2a1810, 6px 6px 0 rgba(0,0,0,0.4)',
            animation: 'splash-slide 0.6s ease-out 0.3s both',
            letterSpacing: 1,
          }}
        >
          {t('app.title.full')}
        </div>
        <div
          className="h-title"
          style={{
            fontSize: 16,
            color: '#fff3e0',
            marginTop: 4,
            letterSpacing: 3,
            animation: 'splash-slide 0.6s ease-out 0.5s both',
          }}
        >
          IDLE RPG
        </div>

        {/* Language picker — kotwiczony do prawego górnego rogu, dyskretny.
            Klik nie propaguje do parent onClick (advance) żeby user mógł
            spokojnie wybrać język bez przypadkowego przejścia. */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
          }}
        >
          <LangPicker size="sm" light />
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 0,
            right: 0,
            textAlign: 'center',
            color: '#fff3e0',
            fontSize: 14,
            opacity: 0.7,
            animation: 'splash-pulse 1.4s ease-in-out infinite 1.5s',
          }}
        >
          {t('splash.tap')}
        </div>
      </div>

      <style>{`
        @keyframes splash-pop {
          0% { transform: scale(0.3) rotate(-20deg); opacity: 0; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes splash-slide {
          from { transform: translateY(14px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes splash-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
