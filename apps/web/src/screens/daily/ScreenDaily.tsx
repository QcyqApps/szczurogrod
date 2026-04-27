import { useState } from 'react';
import { GameIcon } from '@/components/game-icons';
import type { IconName } from '@/components/game-icons';
import { IcoChest, IcoCoin, IcoKey } from '@/components/icons';
import type { DailyClaimResult, Rarity } from '@grodno/shared';

const REWARD_RARITY_COLOR: Record<Rarity, string> = {
  common: '#a8a890',
  rare: '#3a8ac8',
  epic: '#a04ef0',
  legendary: '#ffc830',
};
const REWARD_RARITY_LABEL: Record<Rarity, string> = {
  common: 'ZWYKŁY',
  rare: 'RZADKI',
  epic: 'EPICKI',
  legendary: 'LEGEND.',
};

type RewardKind = 'gold' | 'xp' | 'potion' | 'gem' | 'gift' | 'crown';

interface DayCell {
  day: number;
  reward: { kind: RewardKind; v: string | number };
  claimed: boolean;
  current: boolean;
}

/** Mirror of `DAILY_LADDER` visual preview — serwer jest źródłem prawdy nagród
 *  (daily.ts). Tu trzymamy tylko kind + short display value dla grid'a. */
const DAY_REWARDS: readonly { kind: RewardKind; v: string | number }[] = [
  // Tydzień 1
  { kind: 'gold', v: 150 },
  { kind: 'xp', v: 80 },
  { kind: 'potion', v: 'x1' },
  { kind: 'gold', v: 300 },
  { kind: 'gem', v: 3 },
  { kind: 'gift', v: '' },
  { kind: 'gem', v: 7 }, // milestone
  // Tydzień 2
  { kind: 'gold', v: 250 },
  { kind: 'potion', v: 'x1' },
  { kind: 'gold', v: 500 },
  { kind: 'gem', v: 5 },
  { kind: 'gold', v: 380 },
  { kind: 'potion', v: 'x1' },
  { kind: 'crown', v: 'RARE' }, // milestone — rare
  // Tydzień 3
  { kind: 'gold', v: 400 },
  { kind: 'gem', v: 8 },
  { kind: 'gold', v: 600 },
  { kind: 'potion', v: 'x1' },
  { kind: 'gold', v: 450 },
  { kind: 'gem', v: 10 },
  { kind: 'gift', v: 'KLUCZE' }, // milestone — keys + gems
  // Tydzień 4
  { kind: 'gold', v: 800 },
  { kind: 'gem', v: 10 },
  { kind: 'gold', v: 1000 },
  { kind: 'potion', v: 'x1' },
  { kind: 'gem', v: 12 },
  { kind: 'gold', v: 1100 },
  { kind: 'crown', v: 'LEGEND' }, // milestone — legendary finale
];

/** Dni wyróżnione w grid'zie — pokazujemy delikatne tło + grubszą ramkę. */
const MILESTONE_DAYS = new Set([7, 14, 21, 28]);

const REWARD_ICON: Record<RewardKind, IconName> = {
  gold: 'gold',
  xp: 'spark',
  potion: 'potion',
  gem: 'gem',
  gift: 'gift',
  crown: 'crown',
};

export interface ScreenDailyProps {
  onBack: () => void;
  day: number;
  /**
   * Returns the server's real claim result (or null if it errored). The screen
   * uses this for the reward card — previously we rendered hardcoded values
   * which silently diverged from the actual grant.
   */
  onClaim: () => Promise<DailyClaimResult | null>;
  claimed: boolean;
}

export function ScreenDaily({ onBack, day, onClaim, claimed }: ScreenDailyProps) {
  const [opening, setOpening] = useState(false);
  const [reward, setReward] = useState<DailyClaimResult | null>(null);

  async function handleOpen() {
    if (claimed || opening) return;
    setOpening(true);
    // Short open animation first, then show whatever the server actually gave us.
    await new Promise((r) => setTimeout(r, 800));
    const result = await onClaim();
    if (result) setReward(result);
    else setOpening(false); // claim failed — let the player retry
  }

  const days: DayCell[] = Array.from({ length: 28 }).map((_, i) => ({
    day: i + 1,
    reward: DAY_REWARDS[i],
    claimed: i + 1 < day,
    current: i + 1 === day,
  }));

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div
        className="panel"
        style={{
          padding: 14,
          marginBottom: 12,
          background: 'linear-gradient(180deg, #f3ead9 0%, #e8c870 100%)',
          textAlign: 'center',
        }}
      >
        <div className="h-display" style={{ fontSize: 24 }}>
          CODZIENNA NAGRODA
        </div>
        <div style={{ fontSize: 14, color: '#5a3a2a', marginTop: 2 }}>Dzień {day} z 28</div>

        <div
          style={{
            margin: '16px auto',
            position: 'relative',
            width: 160,
            height: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(#d4a24c 2px, transparent 3px)',
              backgroundSize: '14px 14px',
              opacity: 0.6,
            }}
          />
          {!claimed && (
            <svg
              width="160"
              height="160"
              viewBox="0 0 100 100"
              style={{ position: 'absolute', inset: 0 }}
              className="shimmer-y"
            >
              {Array.from({ length: 12 }).map((_, i) => {
                const a = ((i * 30) * Math.PI) / 180;
                const x1 = 50 + Math.cos(a) * 15;
                const y1 = 50 + Math.sin(a) * 15;
                const x2 = 50 + Math.cos(a) * 48;
                const y2 = 50 + Math.sin(a) * 48;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#d4a24c"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
          )}
          <div
            className={opening || reward ? '' : 'chest-tease'}
            onClick={handleOpen}
            style={{
              position: 'relative',
              cursor: claimed ? 'default' : 'pointer',
              transform: 'scale(2.5)',
            }}
          >
            <IcoChest s={40} open={!!reward} />
          </div>
          {reward && <div className="burst">OH MY!</div>}
        </div>

        {reward ? (
          <div className="pop-in">
            <div className="h-title" style={{ fontSize: 16, marginBottom: 6 }}>
              WYGRAŁEŚ:
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: reward.item ? 10 : 0,
              }}
            >
              {reward.gold > 0 && (
                <span className="pip gold">
                  <IcoCoin s={13} /> +{reward.gold}
                </span>
              )}
              {reward.xp > 0 && (
                <span
                  className="pip"
                  style={{
                    background: '#e8c870',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <GameIcon name="spark" size={13} /> +{reward.xp} XP
                </span>
              )}
              {reward.keys > 0 && (
                <span
                  className="pip"
                  style={{
                    background: '#f3d886',
                    color: '#2a1810',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontWeight: 700,
                  }}
                  title="Klucze do lochu. Każda walka kosztuje jeden."
                >
                  <IcoKey s={13} /> +{reward.keys}
                </span>
              )}
            </div>
            {reward.item && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 10,
                  background: '#fff7e0',
                  border: `2.5px solid ${REWARD_RARITY_COLOR[reward.item.rarity]}`,
                  borderRadius: 10,
                  textAlign: 'left',
                  animation:
                    'qrm-slide 0.4s ease-out 0.1s both, qrm-glow 1.6s ease-in-out infinite 0.6s',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: '#e8dcb9',
                    border: '2px solid #2a1810',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <GameIcon name={reward.item.icon as IconName} size={28} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'inline-block',
                      fontFamily: 'Luckiest Guy, sans-serif',
                      fontSize: 9,
                      letterSpacing: 0.5,
                      padding: '1px 6px',
                      borderRadius: 999,
                      background: REWARD_RARITY_COLOR[reward.item.rarity],
                      color: '#fff3e0',
                      marginBottom: 2,
                    }}
                  >
                    {REWARD_RARITY_LABEL[reward.item.rarity]}
                  </div>
                  <div className="h-title" style={{ fontSize: 14, lineHeight: 1.1 }}>
                    {reward.item.name}
                  </div>
                </div>
              </div>
            )}
            <button type="button" className="cbtn green" style={{ marginTop: 14 }} onClick={onBack}>
              WRACAM!
            </button>
          </div>
        ) : claimed ? (
          <>
            <div style={{ color: '#5a3a2a' }}>Już odebrałeś. Wróć jutro!</div>
            <button type="button" className="cbtn ghost" style={{ marginTop: 10 }} onClick={onBack}>
              OK
            </button>
          </>
        ) : (
          <button type="button" className="cbtn lg red" onClick={handleOpen} disabled={opening}>
            {opening ? 'OTWIERANIE...' : 'KLIKNIJ SKRZYNIĘ!'}
          </button>
        )}
      </div>

      <div className="panel" style={{ padding: 12 }}>
        <div
          className="h-title"
          style={{
            fontSize: 14,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <GameIcon name="fire" size={16} /> SERIA LOGOWAŃ
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {days.map((d) => {
            const milestone = MILESTONE_DAYS.has(d.day);
            // Paletę wybieramy po stanie: current > claimed > milestone > reszta.
            // Milestone pozostaje wyraźnie widoczny nawet gdy niezajęty, żeby
            // gracz wiedział „tu będzie coś ważnego".
            const bg = d.current
              ? '#d4a24c'
              : d.claimed
                ? '#8aa890'
                : milestone
                  ? '#f0c070'
                  : '#e8dcb9';
            const border = milestone && !d.claimed ? '3px solid #c83232' : '2px solid #2a1810';
            return (
              <div
                key={d.day}
                style={{
                  background: bg,
                  border,
                  borderRadius: 6,
                  padding: '4px 1px',
                  textAlign: 'center',
                  boxShadow: d.current
                    ? '2px 2px 0 #2a1810'
                    : 'inset 1.5px 1.5px 0 rgba(0,0,0,0.15)',
                  opacity: d.claimed ? 0.75 : 1,
                  minHeight: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  position: 'relative',
                }}
              >
                <div className="h-title" style={{ fontSize: 9, lineHeight: 1 }}>
                  {d.day}
                </div>
                {d.claimed ? (
                  <GameIcon name="check" size={16} />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      justifyContent: 'center',
                    }}
                  >
                    <GameIcon name={REWARD_ICON[d.reward.kind]} size={14} />
                    {d.reward.v !== '' && (
                      <span
                        className="mono"
                        style={{ fontSize: 8, fontWeight: 700, lineHeight: 1 }}
                      >
                        {d.reward.v}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 13, color: '#5a3a2a', marginTop: 6, fontStyle: 'italic', textAlign: 'center' }}>
          Ramka czerwona = milestone. Dzień 28 — legendarny finisz.
        </div>
      </div>

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
