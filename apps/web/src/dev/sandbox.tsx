// Dev gallery — renders every presentational component in one frame for visual parity
// check against the prototype. Gated by import.meta.env.DEV in App.tsx.

import { useState } from 'react';
import { IOSDevice } from '@/components/ios-frame';
import { GameIcon, ICON_NAMES } from '@/components/game-icons';
import type { IconName } from '@/components/game-icons';
import { AvatarPortrait, APPEARANCE_DEFAULTS } from '@/components/avatar';
import { Monster, MONSTERS } from '@/components/monsters';
import type { MonsterSlug } from '@/components/monsters';
import { PortraitByClass } from '@/components/portraits';
import { EnemyGoblin, EnemySkeleton, EnemyDragon } from '@/components/enemies';
import {
  IcoCoin,
  IcoGem,
  IcoHeart,
  IcoSword,
  IcoShield,
  IcoMagic,
  IcoChest,
} from '@/components/icons';
import { LocTile, QuestRewardModal, StatBar, TabBar, TopBar } from '@/components/ui-common';
import type { Tab } from '@/components/ui-common';
import type { CharacterHeader } from '@grodno/shared';

const MOCK_CHAR: CharacterHeader = {
  name: 'Sir Mruczek',
  cls: 'warrior',
  lvl: 5,
  xp: 340,
  xpMax: 1000,
  hp: 120,
  hpMax: 180,
  mp: 28,
  mpMax: 40,
  gold: 1247,
  gems: 42,
  appearance: APPEARANCE_DEFAULTS,
};

const MOCK_REWARD = {
  gold: 140,
  xp: 85,
  item: {
    name: 'Żelazny Miecz',
    icon: 'sword' as IconName,
    rarity: 'rare' as const,
  },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18, padding: '0 12px' }}>
      <div className="h-title" style={{ fontSize: 13, marginBottom: 8, color: '#5a3a2a' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export function Sandbox() {
  const [tab, setTab] = useState<Tab>('town');
  const [rewardOpen, setRewardOpen] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        gap: 20,
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      <IOSDevice width={402} height={874}>
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#f3ead9',
            position: 'relative',
          }}
        >
          <div style={{ paddingTop: 54 }}>
            <TopBar char={MOCK_CHAR} onProfile={() => {}} onGemShop={() => {}} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 96, paddingTop: 8 }}>
            <Section title="PORTRAITS (klasy)">
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <PortraitByClass cls="warrior" size={80} />
                <PortraitByClass cls="mage" size={80} />
                <PortraitByClass cls="rogue" size={80} />
              </div>
            </Section>

            <Section title="AVATAR">
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <AvatarPortrait cls="warrior" size={80} />
                <AvatarPortrait cls="mage" size={80} />
                <AvatarPortrait cls="rogue" size={80} />
              </div>
            </Section>

            <Section title="ENEMY PORTRAITS (canned)">
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                <EnemyGoblin size={90} />
                <EnemySkeleton size={90} />
                <EnemyDragon size={90} />
              </div>
            </Section>

            <Section title="MONSTER GENERATOR (7 z 19)">
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                {(
                  [
                    'goblin-warrior',
                    'troll-cave',
                    'demon-imp',
                    'skeleton-captain',
                    'slime-shadow',
                    'rat-giant',
                    'hobgoblin-king',
                  ] as MonsterSlug[]
                ).map((slug) => (
                  <div key={slug} style={{ textAlign: 'center' }}>
                    <Monster recipe={MONSTERS[slug]} size={80} />
                  </div>
                ))}
              </div>
            </Section>

            <Section title="ICONS — GLYPHS">
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  justifyContent: 'center',
                  padding: 8,
                  background: '#fff',
                  borderRadius: 10,
                  border: '2px solid #2a1810',
                }}
              >
                <IcoCoin s={24} />
                <IcoGem s={24} />
                <IcoHeart s={24} />
                <IcoSword s={24} />
                <IcoShield s={24} />
                <IcoMagic s={24} />
                <IcoChest s={36} />
                <IcoChest s={36} open />
              </div>
            </Section>

            <Section title={`GAME ICONS (${ICON_NAMES.length})`}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 4,
                  background: '#fff',
                  padding: 6,
                  borderRadius: 10,
                  border: '2px solid #2a1810',
                }}
              >
                {ICON_NAMES.map((n) => (
                  <div key={n} style={{ textAlign: 'center' }}>
                    <GameIcon name={n} size={32} />
                    <div style={{ fontSize: 8, color: '#5a3a2a' }}>{n}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="STAT BARS">
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: 10,
                  background: '#fff',
                  borderRadius: 10,
                  border: '2px solid #2a1810',
                }}
              >
                <StatBar cur={120} max={180} kind="hp" label="HP" />
                <StatBar cur={28} max={40} kind="mp" label="MP" />
                <StatBar cur={340} max={1000} kind="xp" label="XP" />
                <StatBar cur={8} max={10} kind="stam" label="Stamina" />
              </div>
            </Section>

            <Section title="LOC TILES">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <LocTile
                  icon={<GameIcon name="shop" size={52} />}
                  label="Sklep"
                  sub="u Kupca"
                  bg="#f9e6a8"
                />
                <LocTile
                  icon={<GameIcon name="tavern" size={52} />}
                  label="Tawerna"
                  sub="Gildia"
                  bg="#ecc090"
                  badge="3"
                />
                <LocTile
                  icon={<GameIcon name="crossed" size={52} />}
                  label="Arena"
                  bg="#f0b8b8"
                  lock
                />
                <LocTile
                  icon={<GameIcon name="gift" size={52} />}
                  label="Daily"
                  bg="#c4e8c4"
                />
              </div>
            </Section>

            <Section title="QUEST REWARD MODAL">
              <button
                type="button"
                className="cbtn green"
                onClick={() => setRewardOpen(true)}
                style={{ width: '100%' }}
              >
                OTWÓRZ MODAL
              </button>
            </Section>
          </div>

          <TabBar tab={tab} setTab={setTab} />

          {rewardOpen && (
            <QuestRewardModal
              reward={MOCK_REWARD}
              questTitle="Przegonić kuny z młyna"
              onClose={() => setRewardOpen(false)}
            />
          )}
        </div>
      </IOSDevice>
    </div>
  );
}
