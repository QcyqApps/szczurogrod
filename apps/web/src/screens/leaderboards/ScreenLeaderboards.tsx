import { useState } from 'react';
import { trpc } from '@/api/trpc';
import { GameIcon } from '@/components/game-icons';
import type {
  LeaderboardCharEntry,
  LeaderboardGuildEntry,
  LeaderboardsResponse,
} from '@grodno/shared';

type Tab = 'level' | 'achievements' | 'arena' | 'guilds';

const TAB_LABELS: Record<Tab, string> = {
  level: 'POZIOM',
  achievements: 'ODZNAKI',
  arena: 'ARENA',
  guilds: 'GILDIE',
};

const TAB_VALUE_LABELS: Record<Tab, string> = {
  level: 'lvl',
  achievements: 'razem',
  arena: 'pkt',
  guilds: 'glory',
};

const CLS_LABEL: Record<string, string> = {
  warrior: 'Wojownik',
  mage: 'Mag',
  rogue: 'Łotrzyk',
};

export interface ScreenLeaderboardsProps {
  onBack: () => void;
}

export function ScreenLeaderboards({ onBack }: ScreenLeaderboardsProps) {
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
          KRONIKI CHWAŁY
        </div>
        <div className="flavor light" style={{ fontSize: 14, marginTop: 4, position: 'relative' }}>
          Top dziesięciu. Bez nagród. Tylko dla ego.
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
        {(['level', 'achievements', 'arena', 'guilds'] as Tab[]).map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
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
              {TAB_LABELS[t]}
            </button>
          );
        })}
      </div>

      {query.isLoading && <Loading />}
      {query.error && <ErrorMsg />}
      {query.data && (
        <ListView tab={tab} data={query.data} valueLabel={TAB_VALUE_LABELS[tab]} />
      )}

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

function Loading() {
  return (
    <div style={{ textAlign: 'center', fontSize: 13, color: '#5a3a2a', padding: 20 }}>
      Ładuję ranking...
    </div>
  );
}

function ErrorMsg() {
  return (
    <div
      className="flavor"
      style={{ fontSize: 14, color: '#c83232', textAlign: 'center', padding: 20 }}
    >
      Nie udało się pobrać. Spróbuj wrócić za chwilę.
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
  if (entries.length === 0) {
    return (
      <div
        className="flavor"
        style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', padding: 20 }}
      >
        Pusto. Ktoś musi być pierwszy.
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
              {CLS_LABEL[e.cls]} · LVL {e.lvl}
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
  if (entries.length === 0) {
    return (
      <div
        className="flavor"
        style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', padding: 20 }}
      >
        Żadna gildia jeszcze nie zgromadziła chwały.
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
              {e.memberCount} {e.memberCount === 1 ? 'członek' : 'członków'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              className="mono"
              style={{ fontSize: 18, fontWeight: 700, color: '#c83232' }}
            >
              {e.glory.toLocaleString('pl')}
            </div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>glory</div>
          </div>
        </div>
      ))}
    </div>
  );
}
