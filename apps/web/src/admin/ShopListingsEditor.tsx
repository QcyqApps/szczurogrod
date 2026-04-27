import { useMemo, useState } from 'react';
import { trpc } from '@/api/trpc';
import { useAdminStore } from './admin-store';
import {
  Field,
  IconPreview,
  ModalShell,
  NumField,
  TableShell,
  Toolbar,
  type FilterPillGroup,
} from './ui';
import { btnGhostStyle, inputStyle, tdStyle } from './ui-styles';

interface Draft {
  id: string;
  itemTemplateId: string;
  price: number;
  usesGems: boolean;
  requiredLvl: number;
}

function emptyDraft(): Draft {
  return { id: '', itemTemplateId: '', price: 0, usesGems: false, requiredLvl: 1 };
}

export function ShopListingsEditor() {
  const token = useAdminStore((s) => s.token);
  const utils = trpc.useUtils();
  const list = trpc.admin.shopListings.list.useQuery(undefined, { enabled: Boolean(token) });
  const items = trpc.admin.itemTemplates.list.useQuery(undefined, { enabled: Boolean(token) });
  const update = trpc.admin.shopListings.update.useMutation({
    onSuccess: () => {
      void utils.admin.shopListings.list.invalidate();
      void utils.admin.counts.invalidate();
    },
  });
  const create = trpc.admin.shopListings.create.useMutation({
    onSuccess: () => {
      void utils.admin.shopListings.list.invalidate();
      void utils.admin.counts.invalidate();
    },
  });
  const remove = trpc.admin.shopListings.remove.useMutation({
    onSuccess: () => {
      void utils.admin.shopListings.list.invalidate();
      void utils.admin.counts.invalidate();
    },
  });

  const itemById = useMemo(() => {
    const map = new Map<
      string,
      { name: string; slot: string; rarity: string; icon: string }
    >();
    for (const it of items.data ?? []) {
      map.set(it.id, { name: it.name, slot: it.slot, rarity: it.rarity, icon: it.icon });
    }
    return map;
  }, [items.data]);

  const [filter, setFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState<'gold' | 'gems' | null>(null);
  const [slotFilter, setSlotFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [creating, setCreating] = useState(false);

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const src = list.data ?? [];
    const filtered = src.filter((r) => {
      if (currencyFilter === 'gems' && !r.usesGems) return false;
      if (currencyFilter === 'gold' && r.usesGems) return false;
      if (slotFilter) {
        const slot = itemById.get(r.itemTemplateId)?.slot ?? null;
        if (slot !== slotFilter) return false;
      }
      return true;
    });
    if (!q) return filtered;
    return filtered.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.itemTemplateId.toLowerCase().includes(q) ||
        (itemById.get(r.itemTemplateId)?.name ?? '').toLowerCase().includes(q),
    );
  }, [list.data, filter, itemById, currencyFilter, slotFilter]);

  const currencyCounts = useMemo(() => {
    const src = list.data ?? [];
    let gold = 0;
    let gems = 0;
    for (const r of src) {
      if (r.usesGems) gems += 1;
      else gold += 1;
    }
    return { gold, gems };
  }, [list.data]);

  const slotCounts = useMemo(() => {
    const src = list.data ?? [];
    const m = new Map<string, number>();
    for (const r of src) {
      const slot = itemById.get(r.itemTemplateId)?.slot;
      if (slot) m.set(slot, (m.get(slot) ?? 0) + 1);
    }
    return m;
  }, [list.data, itemById]);

  const pillGroups: ReadonlyArray<FilterPillGroup> = [
    {
      label: 'Waluta:',
      value: currencyFilter,
      onChange: (v) => setCurrencyFilter(v as 'gold' | 'gems' | null),
      options: [
        { value: null, label: 'wszystkie' },
        { value: 'gold', label: 'gold', count: currencyCounts.gold },
        { value: 'gems', label: 'gems', count: currencyCounts.gems },
      ],
    },
    {
      label: 'Slot:',
      value: slotFilter,
      onChange: setSlotFilter,
      options: [
        { value: null, label: 'wszystkie' },
        ...Array.from(slotCounts.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([slot, count]) => ({ value: slot, label: slot, count })),
      ],
    },
  ];

  if (list.isLoading) return <div>Ładowanie…</div>;
  if (list.error) return <div style={{ color: 'crimson' }}>Błąd: {list.error.message}</div>;

  return (
    <div>
      <Toolbar
        filter={filter}
        setFilter={setFilter}
        visible={rows.length}
        total={list.data?.length ?? 0}
        onCreate={() => setCreating(true)}
        createLabel="+ Dodaj listing"
        pillGroups={pillGroups}
      />
      <TableShell
        headers={['id', 'item (template)', 'price', 'currency', 'requiredLvl', '']}
      >
        {rows.map((r) => {
          const item = itemById.get(r.itemTemplateId);
          return (
            <tr key={r.id} style={{ borderTop: '1px solid #eee' }}>
              <td style={tdStyle}>
                <code style={{ fontSize: 13 }}>{r.id}</code>
              </td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {item && <IconPreview name={item.icon} size={28} />}
                  <div>
                    <code style={{ fontSize: 13 }}>{r.itemTemplateId}</code>
                    {item && (
                      <div style={{ color: '#666', fontSize: 13 }}>
                        {item.name} · {item.slot} · {item.rarity}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td style={tdStyle}>{r.price}</td>
              <td style={tdStyle}>{r.usesGems ? 'gems' : 'gold'}</td>
              <td style={tdStyle}>{r.requiredLvl}</td>
              <td style={tdStyle}>
                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      id: r.id,
                      itemTemplateId: r.itemTemplateId,
                      price: r.price,
                      usesGems: r.usesGems,
                      requiredLvl: r.requiredLvl,
                    })
                  }
                  style={btnGhostStyle}
                >
                  Edytuj
                </button>
              </td>
            </tr>
          );
        })}
      </TableShell>
      {editing && (
        <DraftModal
          draft={editing}
          title={`Edytuj ${editing.id}`}
          busy={update.isPending || remove.isPending}
          error={update.error?.message ?? remove.error?.message ?? null}
          lockId
          onCancel={() => {
            setEditing(null);
            update.reset();
            remove.reset();
          }}
          onSave={async (d) => {
            await update.mutateAsync(d);
            setEditing(null);
          }}
          onDelete={async () => {
            if (!confirm(`Usunąć listing ${editing.id}?`)) return;
            await remove.mutateAsync({ id: editing.id });
            setEditing(null);
          }}
        />
      )}
      {creating && (
        <DraftModal
          draft={emptyDraft()}
          title="Nowy shop_listing"
          busy={create.isPending}
          error={create.error?.message ?? null}
          onCancel={() => {
            setCreating(false);
            create.reset();
          }}
          onSave={async (d) => {
            await create.mutateAsync(d);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function DraftModal({
  draft: initial,
  title,
  busy,
  error,
  lockId,
  onCancel,
  onSave,
  onDelete,
}: {
  draft: Draft;
  title: string;
  busy: boolean;
  error: string | null;
  lockId?: boolean;
  onCancel: () => void;
  onSave: (d: Draft) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  return (
    <ModalShell
      title={title}
      busy={busy}
      error={error}
      canSave={Boolean(draft.id && draft.itemTemplateId)}
      onCancel={onCancel}
      onSave={() => void onSave(draft)}
      onDelete={onDelete ? () => void onDelete() : undefined}
    >
      <Field label="id">
        <input
          value={draft.id}
          onChange={(e) => set('id', e.target.value)}
          disabled={lockId}
          style={inputStyle}
        />
      </Field>
      <Field label="item_template_id">
        <input
          value={draft.itemTemplateId}
          onChange={(e) => set('itemTemplateId', e.target.value)}
          style={inputStyle}
        />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <NumField
          label="price"
          value={draft.price}
          onChange={(v) => set('price', v ?? 0)}
          min={0}
        />
        <NumField
          label="requiredLvl"
          value={draft.requiredLvl}
          onChange={(v) => set('requiredLvl', v ?? 1)}
          min={1}
          max={100}
        />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
        <input
          type="checkbox"
          checked={draft.usesGems}
          onChange={(e) => set('usesGems', e.target.checked)}
        />
        usesGems (płacisz gemami zamiast złotem)
      </label>
    </ModalShell>
  );
}
