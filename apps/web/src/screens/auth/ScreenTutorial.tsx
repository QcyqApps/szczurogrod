import { useState } from 'react';
import { AvatarPortrait } from '@/components/avatar';
import type { Appearance, CharacterClass } from '@/components/avatar';
import { GameIcon } from '@/components/game-icons';
import type { IconName } from '@/components/game-icons';
import { useT, type DictKey } from '@/i18n';

interface TutorialChar {
  name: string;
  cls: CharacterClass;
  appearance?: Partial<Appearance> | null;
}

interface StepPortrait {
  titleKey: DictKey;
  bodyKey: DictKey;
  portrait: true;
  cls: CharacterClass;
}
interface StepIcon {
  titleKey: DictKey;
  bodyKey: DictKey;
  icon: IconName;
}
type TutorialStep = StepPortrait | StepIcon;

function isPortraitStep(s: TutorialStep): s is StepPortrait {
  return 'portrait' in s && s.portrait;
}

export interface ScreenTutorialProps {
  char: TutorialChar;
  onDone: () => void;
}

export function ScreenTutorial({ char, onDone }: ScreenTutorialProps) {
  const t = useT();
  const [step, setStep] = useState(0);

  const steps: readonly TutorialStep[] = [
    {
      titleKey: 'tutorial.step1.title',
      bodyKey: 'tutorial.step1.body',
      cls: char.cls,
      portrait: true,
    },
    {
      titleKey: 'tutorial.step2.title',
      bodyKey: 'tutorial.step2.body',
      icon: 'scroll',
    },
    {
      titleKey: 'tutorial.step3.title',
      bodyKey: 'tutorial.step3.body',
      icon: 'sword',
    },
    {
      titleKey: 'tutorial.step4.title',
      bodyKey: 'tutorial.step4.body',
      icon: 'shop',
    },
  ];

  const s = steps[step];
  const last = step === steps.length - 1;
  const title = t(s.titleKey).replace('{name}', char.name.toUpperCase());
  const body = t(s.bodyKey);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, #3a2a6a 0%, #5a3a7a 60%, #8a5a6a 100%)',
        display: 'flex',
        flexDirection: 'column',
        padding: '60px 22px 22px',
      }}
    >
      <div style={{ textAlign: 'right', marginBottom: 10 }}>
        <button
          type="button"
          onClick={onDone}
          style={{
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            color: '#fff3e0',
            fontFamily: 'Luckiest Guy',
            fontSize: 12,
            letterSpacing: 0.8,
            opacity: 0.8,
          }}
        >
          {t('tutorial.skip')} →
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
        {steps.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 28 : 10,
              height: 10,
              background: i <= step ? '#ffc830' : 'rgba(255,243,224,0.3)',
              border: '2px solid #2a1810',
              borderRadius: 6,
              transition: 'width 0.3s',
            }}
          />
        ))}
      </div>

      <div
        className="panel"
        style={{
          background: '#f3ead9',
          padding: 22,
          textAlign: 'center',
          animation: 't-fade 0.35s ease-out',
        }}
        key={step}
      >
        <div
          style={{
            width: 130,
            height: 130,
            margin: '0 auto 12px',
            borderRadius: 20,
            background: isPortraitStep(s)
              ? 'linear-gradient(135deg, #d4a24c, #e8c870)'
              : '#e8dcb9',
            border: '3px solid #2a1810',
            boxShadow: '3px 3px 0 #2a1810',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {isPortraitStep(s) ? (
            <AvatarPortrait appearance={char.appearance} cls={s.cls} size={130} />
          ) : (
            <GameIcon name={s.icon} size={90} />
          )}
        </div>
        <div
          className="h-display clean"
          style={{ fontSize: 22, color: '#2a1810', marginBottom: 8, lineHeight: 1.1 }}
        >
          {title}
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.35, color: '#3a1a1a' }}>{body}</div>
      </div>

      <div style={{ flex: 1 }} />

      <button
        type="button"
        className="cbtn green lg"
        style={{ width: '100%' }}
        onClick={() => (last ? onDone() : setStep(step + 1))}
      >
        {last ? t('tutorial.startBig') : `${t('tutorial.next')} →`}
      </button>

      <style>{`
        @keyframes t-fade {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
