import { useMemo, useState } from 'react';
import { trpc } from '@/api/trpc';
import { useAdminStore } from './admin-store';
import { IconPickerField, IconPreview, Toolbar, type FilterPillGroup } from './ui';

const SLOTS = [
  'head',
  'neck',
  'chest',
  'weapon',
  'off',
  'hands',
  'ring',
  'feet',
  'potion',
  'any',
] as const;
const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const;
const CLASSES = ['warrior', 'mage', 'rogue'] as const;

type Slot = (typeof SLOTS)[number];
type Rarity = (typeof RARITIES)[number];
type CharacterClass = (typeof CLASSES)[number];

interface Draft {
  id: string;
  name: string;
  icon: string;
  slot: Slot;
  rarity: Rarity;
  atk: number | null;
  def: number | null;
  mag: number | null;
  desc: string | null;
  allowedClasses: readonly CharacterClass[] | null;
}

function emptyDraft(): Draft {
  return {
    id: '',
    name: '',
    icon: '',
    slot: 'any',
    rarity: 'common',
    atk: null,
    def: null,
    mag: null,
    desc: '',
    allowedClasses: null,
  };
}

export function ItemTemplatesEditor() {
  const utils = trpc.useUtils();
  const token = useAdminStore((s) => s.token);
  const list = trpc.admin.itemTemplates.list.useQuery(undefined, { enabled: Boolean(token) });
  const updateMut = trpc.admin.itemTemplates.update.useMutation({
    onSuccess: () => {
      void utils.admin.itemTemplates.list.invalidate();
      void utils.admin.counts.invalidate();
    },
  });
  const createMut = trpc.admin.itemTemplates.create.useMutation({
    onSuccess: () => {
      void utils.admin.itemTemplates.list.invalidate();
      void utils.admin.counts.invalidate();
    },
  });
  const removeMut = trpc.admin.itemTemplates.remove.useMutation({
    onSuccess: () => {
      void utils.admin.itemTemplates.list.invalidate();
      void utils.admin.counts.invalidate();
    },
  });

  const [filter, setFilter] = useState('');
  const [classFilter, setClassFilter] = useState<'all' | 'universal' | CharacterClass>('all');
  const [slotFilter, setSlotFilter] = useState<Slot | null>(null);
  const [rarityFilter, setRarityFilter] = useState<Rarity | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [creating, setCreating] = useState(false);

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const src = list.data ?? [];
    const filtered = src.filter((r) => {
      // Class filter.
      const allowed = r.allowedClasses as readonly CharacterClass[] | null;
      if (classFilter === 'universal' && allowed !== null) return false;
      if (classFilter !== 'all' && classFilter !== 'universal') {
        if (allowed !== null && !allowed.includes(classFilter)) return false;
      }
      // Slot / rarity pill filters.
      if (slotFilter && r.slot !== slotFilter) return false;
      if (rarityFilter && r.rarity !== rarityFilter) return false;
      return true;
    });
    if (!q) return filtered;
    return filtered.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.desc ?? '').toLowerCase().includes(q) ||
        r.slot.toLowerCase().includes(q) ||
        r.rarity.toLowerCase().includes(q),
    );
  }, [list.data, filter, classFilter, slotFilter, rarityFilter]);

  /** Per-value counts dla pill'ów — liczone raz po list.data żeby filter'y same nie wpływały. */
  const slotCounts = useMemo(() => {
    const src = list.data ?? [];
    const m = new Map<Slot, number>();
    for (const r of src) m.set(r.slot as Slot, (m.get(r.slot as Slot) ?? 0) + 1);
    return m;
  }, [list.data]);

  const rarityCounts = useMemo(() => {
    const src = list.data ?? [];
    const m = new Map<Rarity, number>();
    for (const r of src) m.set(r.rarity as Rarity, (m.get(r.rarity as Rarity) ?? 0) + 1);
    return m;
  }, [list.data]);

  const classCounts = useMemo(() => {
    const src = list.data ?? [];
    let universal = 0;
    const m = new Map<CharacterClass, number>();
    for (const r of src) {
      const allowed = r.allowedClasses as readonly CharacterClass[] | null;
      if (allowed === null) {
        universal += 1;
        continue;
      }
      for (const cls of allowed) m.set(cls, (m.get(cls) ?? 0) + 1);
    }
    return { universal, byClass: m };
  }, [list.data]);

  const pillGroups: ReadonlyArray<FilterPillGroup> = [
    {
      label: 'Klasa:',
      value: classFilter === 'all' ? null : classFilter,
      onChange: (v) => setClassFilter((v as 'universal' | CharacterClass) ?? 'all'),
      options: [
        { value: null, label: 'wszystkie', count: list.data?.length },
        { value: 'universal', label: 'uniwersalne', count: classCounts.universal },
        { value: 'warrior', label: 'warrior', count: classCounts.byClass.get('warrior') },
        { value: 'mage', label: 'mage', count: classCounts.byClass.get('mage') },
        { value: 'rogue', label: 'rogue', count: classCounts.byClass.get('rogue') },
      ],
    },
    {
      label: 'Slot:',
      value: slotFilter,
      onChange: (v) => setSlotFilter(v as Slot | null),
      options: [
        { value: null, label: 'wszystkie' },
        ...SLOTS.map((s) => ({ value: s, label: s, count: slotCounts.get(s) })),
      ],
    },
    {
      label: 'Rarity:',
      value: rarityFilter,
      onChange: (v) => setRarityFilter(v as Rarity | null),
      options: [
        { value: null, label: 'wszystkie' },
        ...RARITIES.map((r) => ({ value: r, label: r, count: rarityCounts.get(r) })),
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
        createLabel="+ Dodaj item"
        pillGroups={pillGroups}
      />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f4f4f4', textAlign: 'left' }}>
              <th style={thStyle}>id</th>
              <th style={thStyle}>icon</th>
              <th style={thStyle}>name</th>
              <th style={thStyle}>slot</th>
              <th style={thStyle}>rarity</th>
              <th style={thStyle}>atk/def/mag</th>
              <th style={thStyle}>classes</th>
              <th style={thStyle}>desc</th>
              <th style={thStyle} />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={tdStyle}>
                  <code style={{ fontSize: 13 }}>{r.id}</code>
                </td>
                <td style={tdStyle}>
                  <IconPreview name={r.icon} size={28} />
                </td>
                <td style={tdStyle}>{r.name}</td>
                <td style={tdStyle}>{r.slot}</td>
                <td style={tdStyle}>
                  <RarityBadge rarity={r.rarity} />
                </td>
                <td style={tdStyle}>
                  {[r.atk && `ATK ${r.atk}`, r.def && `DEF ${r.def}`, r.mag && `MAG ${r.mag}`]
                    .filter(Boolean)
                    .join(' · ')}
                </td>
                <td style={tdStyle}>
                  {r.allowedClasses ? (r.allowedClasses as readonly string[]).join(', ') : '—'}
                </td>
                <td style={{ ...tdStyle, maxWidth: 360, color: '#555' }}>{r.desc}</td>
                <td style={tdStyle}>
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        id: r.id,
                        name: r.name,
                        icon: r.icon,
                        slot: r.slot as Slot,
                        rarity: r.rarity as Rarity,
                        atk: r.atk,
                        def: r.def,
                        mag: r.mag,
                        desc: r.desc ?? '',
                        allowedClasses:
                          (r.allowedClasses as readonly CharacterClass[] | null) ?? null,
                      })
                    }
                    style={btnGhostStyle}
                  >
                    Edytuj
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <ItemDraftModal
          draft={editing}
          title={`Edytuj ${editing.id}`}
          busy={updateMut.isPending || removeMut.isPending}
          error={updateMut.error?.message ?? removeMut.error?.message ?? null}
          onCancel={() => {
            setEditing(null);
            updateMut.reset();
            removeMut.reset();
          }}
          onSave={async (draft) => {
            await updateMut.mutateAsync({
              id: draft.id,
              name: draft.name,
              icon: draft.icon,
              slot: draft.slot,
              rarity: draft.rarity,
              atk: draft.atk,
              def: draft.def,
              mag: draft.mag,
              desc: draft.desc,
              allowedClasses: draft.allowedClasses ? [...draft.allowedClasses] : null,
            });
            setEditing(null);
          }}
          onDelete={async () => {
            if (!confirm(`Usunąć ${editing.id}? Referencje w shop/loot pools zablokują delete.`))
              return;
            await removeMut.mutateAsync({ id: editing.id });
            setEditing(null);
          }}
          lockId
        />
      )}
      {creating && (
        <ItemDraftModal
          draft={emptyDraft()}
          title="Nowy item_template"
          busy={createMut.isPending}
          error={createMut.error?.message ?? null}
          onCancel={() => {
            setCreating(false);
            createMut.reset();
          }}
          onSave={async (draft) => {
            await createMut.mutateAsync({
              id: draft.id,
              name: draft.name,
              icon: draft.icon,
              slot: draft.slot,
              rarity: draft.rarity,
              atk: draft.atk,
              def: draft.def,
              mag: draft.mag,
              desc: draft.desc,
              allowedClasses: draft.allowedClasses ? [...draft.allowedClasses] : null,
            });
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

interface ItemDraftModalProps {
  draft: Draft;
  title: string;
  busy: boolean;
  error: string | null;
  lockId?: boolean;
  onCancel: () => void;
  onSave: (draft: Draft) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}

function ItemDraftModal({
  draft: initial,
  title,
  busy,
  error,
  lockId,
  onCancel,
  onSave,
  onDelete,
}: ItemDraftModalProps) {
  const [draft, setDraft] = useState<Draft>(initial);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: 20,
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>{title}</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          <Field label="id">
            <input
              value={draft.id}
              onChange={(e) => set('id', e.target.value)}
              disabled={lockId}
              style={inputStyle}
            />
          </Field>
          <Field label="name">
            <input
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
              style={inputStyle}
            />
          </Field>
          <IconPickerField label="icon" value={draft.icon} onChange={(v) => set('icon', v)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="slot">
              <select
                value={draft.slot}
                onChange={(e) => set('slot', e.target.value as Slot)}
                style={inputStyle}
              >
                {SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="rarity">
              <select
                value={draft.rarity}
                onChange={(e) => set('rarity', e.target.value as Rarity)}
                style={inputStyle}
              >
                {RARITIES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <NumField label="atk" value={draft.atk} onChange={(v) => set('atk', v)} />
            <NumField label="def" value={draft.def} onChange={(v) => set('def', v)} />
            <NumField label="mag" value={draft.mag} onChange={(v) => set('mag', v)} />
          </div>
          <Field label="desc">
            <textarea
              value={draft.desc ?? ''}
              onChange={(e) => set('desc', e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>
          <Field label="allowed classes (empty = universal)">
            <div style={{ display: 'flex', gap: 10 }}>
              {CLASSES.map((cls) => {
                const active = draft.allowedClasses?.includes(cls) ?? false;
                return (
                  <label
                    key={cls}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => {
                        const current = new Set(draft.allowedClasses ?? []);
                        if (e.target.checked) current.add(cls);
                        else current.delete(cls);
                        set('allowedClasses', current.size === 0 ? null : [...current]);
                      }}
                    />
                    {cls}
                  </label>
                );
              })}
            </div>
          </Field>
        </div>
        {error && (
          <div
            style={{
              marginTop: 12,
              padding: 8,
              background: '#fee',
              color: '#a00',
              fontSize: 13,
              borderRadius: 4,
            }}
          >
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          {onDelete && (
            <button
              type="button"
              onClick={() => void onDelete()}
              disabled={busy}
              style={btnDangerStyle}
            >
              Usuń
            </button>
          )}
          <span style={{ flex: 1 }} />
          <button type="button" onClick={onCancel} style={btnGhostStyle}>
            Anuluj
          </button>
          <button
            type="button"
            onClick={() => void onSave(draft)}
            disabled={busy || !draft.id || !draft.name || !draft.icon}
            style={btnPrimaryStyle}
          >
            {busy ? 'Zapisuję…' : 'Zapisz'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 12, color: '#555' }}>{label}</span>
      {children}
    </label>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === '' ? null : Number(raw));
        }}
        style={inputStyle}
      />
    </Field>
  );
}

function RarityBadge({ rarity }: { rarity: string }) {
  const color =
    rarity === 'legendary'
      ? '#c89b2c'
      : rarity === 'epic'
        ? '#a04ef0'
        : rarity === 'rare'
          ? '#3a8ac8'
          : '#888';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 6px',
        fontSize: 13,
        background: color,
        color: '#fff',
        borderRadius: 3,
      }}
    >
      {rarity}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 13,
  border: '1px solid #bbb',
  borderRadius: 4,
  fontFamily: 'inherit',
};

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: 12,
  fontWeight: 600,
  color: '#555',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 10px',
  verticalAlign: 'top',
};

const btnPrimaryStyle: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: 13,
  background: '#2a1810',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
};

const btnGhostStyle: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: 13,
  background: '#eee',
  color: '#222',
  border: '1px solid #ccc',
  borderRadius: 4,
  cursor: 'pointer',
};

const btnDangerStyle: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: 13,
  background: '#a42a2a',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
};
