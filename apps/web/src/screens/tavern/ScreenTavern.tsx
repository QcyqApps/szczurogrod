import { useEffect, useState } from 'react';
import { PortraitByClass } from '@/components/portraits';
import { GameIcon } from '@/components/game-icons';
import { GemSinkButton } from '@/components/ui-common';
import { IcoClock, IcoCoin } from '@/components/icons';
import { GEM_SINK_COSTS, type ActiveCompanion, type CompanionOffer } from '@grodno/shared';
import { useT, tStatic, useContentT } from '@/i18n';
import type { DictKey } from '@/i18n';

const CLASS_LABEL_KEY: Record<'warrior' | 'mage' | 'rogue', DictKey> = {
  warrior: 'class.warrior.title',
  mage: 'class.mage.title',
  rogue: 'class.rogue.title',
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return tStatic('tavern.countdown.ready');
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export interface ScreenTavernProps {
  rumors: readonly string[];
  companions: readonly CompanionOffer[];
  activeCompanion: ActiveCompanion | null;
  playerGold: number;
  playerGems: number;
  playerHp: number;
  playerHpMax: number;
  playerMp: number;
  playerMpMax: number;
  healerCost: number;
  healerReadyAt: number | null;
  onHire: (slug: string) => void | Promise<void>;
  onDismiss: () => void | Promise<void>;
  onHealFull: () => void | Promise<void>;
  onHealInstant: () => void | Promise<void>;
  healInstantPending: boolean;
  onRerollCompanions: () => void | Promise<void>;
  rerollCompanionsPending: boolean;
  onBack: () => void;
  /** Otwiera ekran Karciarza Franka (Kości). */
  onOpenDice: () => void;
  /** True = darmowy rzut kośćmi dostępny dziś → badge „!" na przycisku. */
  diceFreeAvailable: boolean;
  /** Otwiera ekran Wróżki Hanusi (Oracle). */
  onOpenOracle: () => void;
  /** True = darmowy pull Hanusi dostępny dziś. */
  oracleFreeAvailable: boolean;
  /** Otwiera ekran Mnicha Panteleona (blessings). */
  onOpenBlessing: () => void;
  /** Unix ms kiedy Panteleon skończy medytować; null = ready. */
  blessingCooldownReadyAt: number | null;
  /** Otwiera ekran Baby Jagi (remove curses). */
  onOpenWitch: () => void;
  /** Ile aktywnych klątw ma gracz (dla badge'a). */
  witchCurseCount: number;
}

export function ScreenTavern({
  rumors,
  companions,
  activeCompanion,
  playerGold,
  playerGems,
  playerHp,
  playerHpMax,
  playerMp,
  playerMpMax,
  healerCost,
  healerReadyAt,
  onHire,
  onDismiss,
  onHealFull,
  onHealInstant,
  healInstantPending,
  onRerollCompanions,
  rerollCompanionsPending,
  onBack,
  onOpenDice,
  diceFreeAvailable,
  onOpenOracle,
  oracleFreeAvailable,
  onOpenBlessing,
  blessingCooldownReadyAt,
  onOpenWitch,
  witchCurseCount,
}: ScreenTavernProps) {
  const t = useT();
  const tc = useContentT();
  const hasCompanion = activeCompanion !== null;

  // Re-render every second so the healer countdown ticks down in real time.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (healerReadyAt === null) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [healerReadyAt]);

  const msUntilReady =
    healerReadyAt !== null ? Math.max(0, healerReadyAt - Date.now()) : 0;
  const healerOnCooldown = msUntilReady > 0;
  const alreadyFull = playerHp >= playerHpMax && playerMp >= playerMpMax;
  const canAffordHeal = playerGold >= healerCost;
  const healerDisabled = healerOnCooldown || alreadyFull || !canAffordHeal;

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div
        style={{
          background: 'linear-gradient(180deg, #6a3a1a 0%, #3a1a0a 100%)',
          border: '3px solid #2a1810',
          borderRadius: 14,
          boxShadow: '3px 3px 0 #2a1810',
          padding: 14,
          color: '#fff3e0',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 12,
        }}
      >
        <div className="halftone-gold" style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <GameIcon name="tavern" size={56} />
        </div>
        <div className="h-display" style={{ fontSize: 22, position: 'relative' }}>
          {t('tavern.heading')}
        </div>
        <div className="flavor" style={{ fontSize: 17, marginTop: 4, position: 'relative' }}>
          {t('tavern.flavor')}
        </div>
        {rumors.length > 0 && (
          <div
            className="flavor"
            style={{
              fontSize: 15,
              marginTop: 8,
              padding: '6px 10px',
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: 8,
              color: '#f3ead9',
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GameIcon name="ear" size={14} /> {t('tavern.barman').replace('{r}', rumors[0]!)}
          </div>
        )}
      </div>

      {activeCompanion && (
        <div
          className="panel"
          style={{
            padding: 10,
            marginBottom: 12,
            background: 'linear-gradient(135deg, #e8c870 0%, #d4a24c 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 10,
              overflow: 'hidden',
              border: '2.5px solid #2a1810',
              background: '#e8b870',
            }}
          >
            <PortraitByClass cls={activeCompanion.cls} size={56} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="h-title"
              style={{ fontSize: 10, color: '#5a3a2a', letterSpacing: 0.6, marginBottom: 2 }}
            >
              {t('tavern.companion.active')}
            </div>
            <div className="h-title" style={{ fontSize: 15, lineHeight: 1 }}>
              {tc.companionName(activeCompanion.slug, activeCompanion.name)}
            </div>
            <div style={{ fontSize: 13, color: '#5a3a2a' }}>
              LVL {activeCompanion.lvl} · {t(CLASS_LABEL_KEY[activeCompanion.cls])}
            </div>
            <div
              style={{
                fontSize: 13,
                color: '#2e5020',
                marginTop: 2,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontWeight: 600,
              }}
            >
              <GameIcon name="spark" size={11} /> {tc.companionTrait(activeCompanion.slug, activeCompanion.trait)}
            </div>
          </div>
          <button type="button" className="cbtn red sm" onClick={() => onDismiss()}>
            {t('tavern.companion.dismiss')}
          </button>
        </div>
      )}

      <div
        className="panel"
        style={{
          padding: 10,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: alreadyFull ? '#e8dcb9' : '#fff7e0',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #f0c8c8 0%, #c86464 100%)',
            border: '2.5px solid #2a1810',
            boxShadow: '2px 2px 0 #2a1810',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <GameIcon name="potion" size={26} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="h-title" style={{ fontSize: 14, lineHeight: 1 }}>
            {t('tavern.healer.title')}
          </div>
          <div style={{ fontSize: 13, color: '#5a3a2a', marginTop: 2 }}>
            {t('tavern.healer.body')}
          </div>
          <div className="mono" style={{ fontSize: 13, color: '#2a1810', marginTop: 4 }}>
            HP {playerHp}/{playerHpMax} · MP {playerMp}/{playerMpMax}
            {healerOnCooldown && (
              <>
                {' '}·{' '}
                <span
                  style={{
                    color: '#8a3e1e',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <IcoClock s={11} /> {formatCountdown(msUntilReady)}
                </span>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            type="button"
            className="cbtn green sm"
            disabled={healerDisabled}
            onClick={() => onHealFull()}
            style={{
              opacity: healerDisabled ? 0.55 : 1,
              cursor: healerDisabled ? 'not-allowed' : 'pointer',
              minWidth: 76,
            }}
            title={
              alreadyFull
                ? t('tavern.healer.full')
                : healerOnCooldown
                ? t('tavern.healer.cooldown').replace('{n}', formatCountdown(msUntilReady))
                : !canAffordHeal
                ? t('tavern.healer.tooPoor')
                : t('tavern.healer.help')
            }
          >
            <IcoCoin s={12} /> {healerCost}
          </button>
          {healerOnCooldown && !alreadyFull && (
            <GemSinkButton
              label={t('tavern.healer.now')}
              cost={GEM_SINK_COSTS.healInstant}
              playerGems={playerGems}
              pending={healInstantPending}
              onClick={() => void onHealInstant()}
              disabledReason={t('tavern.healer.now.help')}
            />
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenDice}
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          gap: 10,
          padding: 10,
          marginBottom: 12,
          border: '3px solid #2a1810',
          borderRadius: 14,
          background: 'linear-gradient(180deg, #e8c878 0%, #c89858 100%)',
          boxShadow: '3px 3px 0 #2a1810',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
          color: '#2a1810',
          position: 'relative',
        }}
      >
        <GameIcon name="dice" size={36} />
        <div style={{ flex: 1 }}>
          <div className="h-title" style={{ fontSize: 14, color: '#7a3818' }}>
            {t('tavern.dice.title')}
          </div>
          <div className="flavor" style={{ fontSize: 14, color: '#3a1810' }}>
            {diceFreeAvailable ? t('tavern.dice.free') : t('tavern.dice.taken')}
          </div>
        </div>
        {diceFreeAvailable && (
          <span
            style={{
              minWidth: 22,
              height: 22,
              padding: '0 6px',
              borderRadius: 999,
              background: '#c83232',
              color: '#fff',
              fontFamily: 'Luckiest Guy, sans-serif',
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #2a1810',
              boxShadow: '1px 1px 0 #2a1810',
            }}
          >
            !
          </span>
        )}
        <GameIcon name="arrow-right" size={18} />
      </button>

      <button
        type="button"
        onClick={onOpenOracle}
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          gap: 10,
          padding: 10,
          marginBottom: 12,
          border: '3px solid #2a1810',
          borderRadius: 14,
          background: 'linear-gradient(180deg, #c8b0e0 0%, #a088c8 100%)',
          boxShadow: '3px 3px 0 #2a1810',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
          color: '#2a1810',
          position: 'relative',
        }}
      >
        <GameIcon name="crown" size={36} />
        <div style={{ flex: 1 }}>
          <div className="h-title" style={{ fontSize: 14, color: '#4a2a7a' }}>
            {t('tavern.oracle.title')}
          </div>
          <div className="flavor" style={{ fontSize: 14, color: '#2a1830' }}>
            {oracleFreeAvailable ? t('tavern.oracle.free') : t('tavern.oracle.taken')}
          </div>
        </div>
        {oracleFreeAvailable && (
          <span
            style={{
              minWidth: 22,
              height: 22,
              padding: '0 6px',
              borderRadius: 999,
              background: '#c83232',
              color: '#fff',
              fontFamily: 'Luckiest Guy, sans-serif',
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #2a1810',
              boxShadow: '1px 1px 0 #2a1810',
            }}
          >
            !
          </span>
        )}
        <GameIcon name="arrow-right" size={18} />
      </button>

      <button
        type="button"
        onClick={onOpenBlessing}
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          gap: 10,
          padding: 10,
          marginBottom: 12,
          border: '3px solid #2a1810',
          borderRadius: 14,
          background: 'linear-gradient(180deg, #ecd890 0%, #c0a058 100%)',
          boxShadow: '3px 3px 0 #2a1810',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
          color: '#2a1810',
          position: 'relative',
        }}
      >
        <GameIcon name="spark" size={36} />
        <div style={{ flex: 1 }}>
          <div className="h-title" style={{ fontSize: 14, color: '#5a3a18' }}>
            {t('tavern.blessing.title')}
          </div>
          <div className="flavor" style={{ fontSize: 14, color: '#3a2810' }}>
            {blessingCooldownReadyAt && blessingCooldownReadyAt > Date.now()
              ? t('tavern.blessing.busy')
              : t('tavern.blessing.ready')}
          </div>
        </div>
        <GameIcon name="arrow-right" size={18} />
      </button>

      <button
        type="button"
        onClick={onOpenWitch}
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          gap: 10,
          padding: 10,
          marginBottom: 12,
          border: '3px solid #2a1810',
          borderRadius: 14,
          background: 'linear-gradient(180deg, #d8a890 0%, #a87060 100%)',
          boxShadow: '3px 3px 0 #2a1810',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
          color: '#2a1810',
          position: 'relative',
        }}
      >
        <GameIcon name="skull-lich" size={36} />
        <div style={{ flex: 1 }}>
          <div className="h-title" style={{ fontSize: 14, color: '#5a2818' }}>
            {t('tavern.witch.title')}
          </div>
          <div className="flavor" style={{ fontSize: 14, color: '#3a1810' }}>
            {witchCurseCount > 0
              ? t('tavern.witch.cursed')
                  .replace('{n}', String(witchCurseCount))
                  .replace(
                    '{curseWord}',
                    witchCurseCount === 1
                      ? t('tavern.witch.curseWord.one')
                      : t('tavern.witch.curseWord.many'),
                  )
              : t('tavern.witch.clean')}
          </div>
        </div>
        {witchCurseCount > 0 && (
          <span
            style={{
              minWidth: 22,
              height: 22,
              padding: '0 6px',
              borderRadius: 999,
              background: '#c83232',
              color: '#fff',
              fontFamily: 'Luckiest Guy, sans-serif',
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #2a1810',
              boxShadow: '1px 1px 0 #2a1810',
            }}
          >
            {witchCurseCount}
          </span>
        )}
        <GameIcon name="arrow-right" size={18} />
      </button>

      <div
        className="h-title"
        style={{
          fontSize: 14,
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <GameIcon name="handshake" size={14} />
        <span style={{ flex: 1 }}>{t('tavern.companions.heading')}</span>
        <GemSinkButton
          label={t('tavern.companions.refresh')}
          cost={GEM_SINK_COSTS.rerollCompanions}
          playerGems={playerGems}
          pending={rerollCompanionsPending}
          onClick={() => void onRerollCompanions()}
          disabledReason={t('tavern.companions.refresh.help')}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {companions.map((c) => {
          const canAfford = playerGold >= c.price;
          const disabled = hasCompanion || !canAfford;
          return (
            <div
              key={c.slug}
              className="panel-tight"
              style={{
                padding: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                opacity: hasCompanion ? 0.5 : 1,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '2.5px solid #2a1810',
                  background: '#e8b870',
                }}
              >
                <PortraitByClass cls={c.cls} size={56} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="h-title" style={{ fontSize: 14, lineHeight: 1 }}>
                  {tc.companionName(c.slug, c.name)}
                </div>
                <div style={{ fontSize: 13, color: '#5a3a2a' }}>
                  LVL {c.lvl} · {t(CLASS_LABEL_KEY[c.cls])}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: '#4a7c3a',
                    marginTop: 2,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <GameIcon name="spark" size={11} /> {tc.companionTrait(c.slug, c.trait)}
                </div>
              </div>
              <button
                type="button"
                className="cbtn sm"
                disabled={disabled}
                onClick={() => onHire(c.slug)}
                style={{
                  opacity: disabled ? 0.55 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                <IcoCoin s={12} /> {c.price}
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="cbtn ghost"
        style={{ marginTop: 14, width: '100%' }}
        onClick={onBack}
      >
        {t('tavern.back')}
      </button>
    </div>
  );
}
