import { useState } from 'react';
import { trpc } from '@/api/trpc';
import { useAdminStore } from './admin-store';
import { CompanionTemplatesEditor } from './CompanionTemplatesEditor';
import { DailyLadderEditor } from './DailyLadderEditor';
import { EnemyTemplatesEditor } from './EnemyTemplatesEditor';
import { ItemTemplatesEditor } from './ItemTemplatesEditor';
import { MobTierConfigEditor } from './MobTierConfigEditor';
import { QuestTemplatesEditor } from './QuestTemplatesEditor';
import { ShopListingsEditor } from './ShopListingsEditor';

const SHELL_STYLE: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
  padding: 24,
  maxWidth: 1280,
  margin: '0 auto',
  color: '#1a1a1a',
};

function AdminLogin() {
  const setToken = useAdminStore((s) => s.setToken);
  const [value, setValue] = useState('');
  return (
    <div style={SHELL_STYLE}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Szczurogród · CMS</h1>
      <p style={{ color: '#555', marginBottom: 16 }}>
        Wpisz ADMIN_TOKEN (env po stronie serwera). Token zostaje w localStorage do wylogowania.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) setToken(value.trim());
        }}
        style={{ display: 'flex', gap: 8 }}
      >
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="admin token"
          autoFocus
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 14,
            border: '1px solid #888',
            borderRadius: 4,
          }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            fontSize: 14,
            background: '#2a1810',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Zaloguj
        </button>
      </form>
    </div>
  );
}

type Tab =
  | 'items'
  | 'shop'
  | 'quests'
  | 'enemies'
  | 'companions'
  | 'daily'
  | 'mobTiers';

/** Tab meta — `countKey` mapuje na `admin.counts` response'u klucze. */
const TABS: readonly { id: Tab; label: string; countKey: keyof AdminCounts }[] = [
  { id: 'items', label: 'Itemy', countKey: 'items' },
  { id: 'shop', label: 'Sklep', countKey: 'shop' },
  { id: 'quests', label: 'Questy', countKey: 'quests' },
  { id: 'enemies', label: 'Przeciwnicy', countKey: 'enemies' },
  { id: 'companions', label: 'Towarzysze', countKey: 'companions' },
  { id: 'daily', label: 'Daily', countKey: 'daily' },
  { id: 'mobTiers', label: 'Mob tiery', countKey: 'mobTiers' },
];

type AdminCounts = {
  items: number;
  shop: number;
  quests: number;
  enemies: number;
  companions: number;
  daily: number;
  mobTiers: number;
};

function AdminDashboard() {
  const clear = useAdminStore((s) => s.clear);
  const [tab, setTab] = useState<Tab>('items');
  const token = useAdminStore((s) => s.token);
  const countsQuery = trpc.admin.counts.useQuery(undefined, {
    enabled: Boolean(token),
    // Counts są po każdej mutation invalid'owane przez editor'y (via invalidate'y
    // zagnieżdżonych `list` cache'ów), ale counts query ma własny cache —
    // refetchujemy też na focus żeby po kliku „Dodaj" licznik się odświeżył.
    refetchOnWindowFocus: true,
  });

  return (
    <div style={SHELL_STYLE}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          borderBottom: '1px solid #ddd',
          paddingBottom: 12,
        }}
      >
        <h1 style={{ fontSize: 20, margin: 0 }}>Szczurogród · CMS</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#888' }}>
            każda edycja → auto-reload registry
          </span>
          <button
            type="button"
            onClick={clear}
            style={{
              padding: '6px 12px',
              fontSize: 13,
              background: '#eee',
              border: '1px solid #ccc',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Wyloguj
          </button>
        </div>
      </header>
      <nav style={{ marginBottom: 20, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <TabButton
            key={t.id}
            label={t.label}
            count={countsQuery.data?.[t.countKey]}
            active={tab === t.id}
            onClick={() => setTab(t.id)}
          />
        ))}
      </nav>
      {tab === 'items' && <ItemTemplatesEditor />}
      {tab === 'shop' && <ShopListingsEditor />}
      {tab === 'quests' && <QuestTemplatesEditor />}
      {tab === 'enemies' && <EnemyTemplatesEditor />}
      {tab === 'companions' && <CompanionTemplatesEditor />}
      {tab === 'daily' && <DailyLadderEditor />}
      {tab === 'mobTiers' && <MobTierConfigEditor />}
    </div>
  );
}

function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 14px',
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        background: active ? '#2a1810' : 'transparent',
        color: active ? '#fff' : '#444',
        border: active ? 'none' : '1px solid #ccc',
        borderRadius: 4,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span>{label}</span>
      {typeof count === 'number' && (
        <span
          style={{
            fontSize: 13,
            padding: '1px 6px',
            borderRadius: 8,
            background: active ? 'rgba(255,255,255,0.2)' : '#eee',
            color: active ? '#fff' : '#666',
            fontWeight: 500,
            minWidth: 18,
            textAlign: 'center',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function AdminApp() {
  const token = useAdminStore((s) => s.token);
  return token ? <AdminDashboard /> : <AdminLogin />;
}
