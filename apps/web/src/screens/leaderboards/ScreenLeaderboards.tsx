import { useState } from 'react';
import { trpc } from '@/api/trpc';
import { GameIcon } from '@/components/game-icons';
import { useT, type DictKey } from '@/i18n';
import type {
  LeaderboardCharEntry,
  LeaderboardGuildEntry,
  LeaderboardsResponse,
} from '@grodno/shared';

type Tab = 'level' | 'achievements' | 'arena' | 'guilds';

const TAB_LABEL_KEY: Record<Tab, DictKey> = {
  level: 'leaderboards.tab.level',
  achievements: 'leaderboards.tab.achievements',
  arena: 'leaderboards.tab.arena',
  guilds: 'leaderboards.tab.guilds',
};

const TAB_VALUE_LABEL_KEY: Record<Tab, DictKey> = {
  level: 'leaderboards.value.level',
  achievements: 'leaderboards.value.achievements',
  arena: 'leaderboards.value.arena',
  guilds: 'leaderboards.value.guilds',
};

const CLS_LABEL_KEY: Record<string, DictKey> = {
  warrior: 'leaderboards.cls.warrior',
  mage: 'leaderboards.cls.mage',
  rogue: 'leaderboards.cls.rogue',
};

export interface ScreenLeaderboardsProps {
  onBack: () => void;
}

export function ScreenLeaderboards({ onBack }: ScreenLeaderboardsProps) {
  const t = useT();
  const [tab, setTab] = useState<Tab>('level');
  const query = trpc.leaderboards.all.useQuery();

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      {/* Header */}
      <div
        className="panel"
        style={{
          padding: 12,
          marginBottom: 10,
          background: 'linear-gradient(180deg, #5a3a2a 0%, #2a1810 100%)',
          color: '#fff3e0',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="halftone-gold" style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <GameIcon name="crown" size={48} />
        </div>
        <div
          className="h-display"
          style={{ fontSize: 22, color: '#ffc830', position: 'relative' }}
        >
          {t('leaderboards.title')}
        </div>
        <div className="flavor light" style={{ fontSize: 14, marginTop: 4, position: 'relative' }}>
          {t('leaderboards.flavor')}
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 4,
          marginBottom: 10,
        }}
      >
        {(['level', 'achievements', 'arena', 'guilds'] as Tab[]).map((tabKey) => {
          const active = tabKey === tab;
          return (
            <button
              key={tabKey}
              type="button"
              onClick={() => setTab(tabKey)}
              className="h-title"
              style={{
                padding: '6px 2px',
                borderRadius: 8,
                border: '2.5px solid #2a1810',
                background: active ? '#ffc830' : '#e8dcb9',
                color: '#2a1810',
                fontFamily: 'inherit',
                fontSize: 12,
                boxShadow: active ? '2px 2px 0 #2a1810' : 'none',
                cursor: 'pointer',
              }}
            >
              {t(TAB_LABEL_KEY[tabKey])}
            </button>
          );
        })}
      </div>

      {query.isLoading && <Loading />}
      {query.error && <ErrorMsg />}
      {query.data && (
        <ListView tab={tab} data={query.data} valueLabel={t(TAB_VALUE_LABEL_KEY[tab])} />
      )}

      <button
        type="button"
        className="cbtn ghost"
        style={{ width: '100%', marginTop: 12 }}
        onClick={onBack}
      >
        {t('leaderboards.back')}
      </button>
    </div>
  );
}

function Loading() {
  const t = useT();
  return (
    <div style={{ textAlign: 'center', fontSize: 13, color: '#5a3a2a', padding: 20 }}>
      {t('leaderboards.loading')}
    </div>
  );
}

function ErrorMsg() {
  const t = useT();
  return (
    <div
      className="flavor"
      style={{ fontSize: 14, color: '#c83232', textAlign: 'center', padding: 20 }}
    >
      {t('leaderboards.error')}
    </div>
  );
}

function ListView({
  tab,
  data,
  valueLabel,
}: {
  tab: Tab;
  data: LeaderboardsResponse;
  valueLabel: string;
}) {
  if (tab === 'guilds') {
    return <GuildList entries={data.byGuilds} />;
  }
  const entries =
    tab === 'level'
      ? data.byLevel
      : tab === 'achievements'
      ? data.byAchievements
      : data.byArena;
  return <CharList entries={entries} valueLabel={valueLabel} />;
}

function CharList({
  entries,
  valueLabel,
}: {
  entries: LeaderboardCharEntry[];
  valueLabel: string;
}) {
  const t = useT();
  if (entries.length === 0) {
    return (
      <div
        className="flavor"
        style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', padding: 20 }}
      >
        {t('leaderboards.empty.chars')}
      </div>
    );
  }
  return (
    <div className="panel" style={{ padding: 4 }}>
      {entries.map((e, i, arr) => (
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
            #{e.pos}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="h-title" style={{ fontSize: 14 }}>{e.name}</div>
            <div style={{ fontSize: 13, color: '#5a3a2a' }}>
              {CLS_LABEL_KEY[e.cls] ? t(CLS_LABEL_KEY[e.cls]!) : e.cls} · LVL {e.lvl}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              className="mono"
              style={{ fontSize: 18, fontWeight: 700, color: '#c83232' }}
            >
              {e.value.toLocaleString('pl')}
            </div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>{valueLabel}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GuildList({ entries }: { entries: LeaderboardGuildEntry[] }) {
  const t = useT();
  if (entries.length === 0) {
    return (
      <div
        className="flavor"
        style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', padding: 20 }}
      >
        {t('leaderboards.empty.guilds')}
      </div>
    );
  }
  return (
    <div className="panel" style={{ padding: 4 }}>
      {entries.map((e, i, arr) => (
        <div
          key={e.guildId}
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
            #{e.pos}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="h-title" style={{ fontSize: 14 }}>
              [{e.tag}] {e.name}
            </div>
            <div style={{ fontSize: 13, color: '#5a3a2a' }}>
              {e.memberCount}{' '}
              {e.memberCount === 1
                ? t('leaderboards.member.one')
                : t('leaderboards.member.many')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              className="mono"
              style={{ fontSize: 18, fontWeight: 700, color: '#c83232' }}
            >
              {e.glory.toLocaleString('pl')}
            </div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>{t('leaderboards.glory')}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
