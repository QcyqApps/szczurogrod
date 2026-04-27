import { useMemo, useState } from 'react';
import { trpc } from '@/api/trpc';
import { PortraitByClass } from '@/components/portraits';
import type { CharacterClass as SharedClass } from '@grodno/shared';
import { useAdminStore } from './admin-store';
import { Field, ModalShell, NumField, TableShell, Toolbar, type FilterPillGroup } from './ui';
import { btnGhostStyle, inputStyle, tdStyle } from './ui-styles';

const CLASSES = ['warrior', 'mage', 'rogue'] as const;
type Cls = (typeof CLASSES)[number];

interface Draft {
  slug: string;
  name: string;
  cls: Cls;
  lvl: number;
  price: number;
  trait: string;
  buff: {
    atkBonus: number | null;
    magBonus: number | null;
    lootBonusPct: number | null;
    healBonus: number | null;
  };
}

function emptyDraft(): Draft {
  return {
    slug: '',
    name: '',
    cls: 'warrior',
    lvl: 1,
    price: 100,
    trait: '',
    buff: { atkBonus: null, magBonus: null, lootBonusPct: null, healBonus: null },
  };
}

function stripBuff(buff: Draft['buff']) {
  const out: Record<string, number> = {};
  if (buff.atkBonus !== null) out.atkBonus = buff.atkBonus;
  if (buff.magBonus !== null) out.magBonus = buff.magBonus;
  if (buff.lootBonusPct !== null) out.lootBonusPct = buff.lootBonusPct;
  if (buff.healBonus !== null) out.healBonus = buff.healBonus;
  return out;
}

export function CompanionTemplatesEditor() {
  const token = useAdminStore((s) => s.token);
  const utils = trpc.useUtils();
  const list = trpc.admin.companionTemplates.list.useQuery(undefined, { enabled: Boolean(token) });
  const update = trpc.admin.companionTemplates.update.useMutation({
    onSuccess: () => {
      void utils.admin.companionTemplates.list.invalidate();
      void utils.admin.counts.invalidate();
    },
  });
  const create = trpc.admin.companionTemplates.create.useMutation({
    onSuccess: () => {
      void utils.admin.companionTemplates.list.invalidate();
      void utils.admin.counts.invalidate();
    },
  });
  const remove = trpc.admin.companionTemplates.remove.useMutation({
    onSuccess: () => {
      void utils.admin.companionTemplates.list.invalidate();
      void utils.admin.counts.invalidate();
    },
  });

  const [filter, setFilter] = useState('');
  const [clsFilter, setClsFilter] = useState<Cls | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [creating, setCreating] = useState(false);

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const src = list.data ?? [];
    const filtered = src.filter((r) => {
      if (clsFilter && r.cls !== clsFilter) return false;
      return true;
    });
    if (!q) return filtered;
    return filtered.filter(
      (r) =>
        r.slug.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.trait.toLowerCase().includes(q),
    );
  }, [list.data, filter, clsFilter]);

  const clsCounts = useMemo(() => {
    const src = list.data ?? [];
    const m = new Map<Cls, number>();
    for (const r of src) m.set(r.cls as Cls, (m.get(r.cls as Cls) ?? 0) + 1);
    return m;
  }, [list.data]);

  const pillGroups: ReadonlyArray<FilterPillGroup> = [
    {
      label: 'Klasa:',
      value: clsFilter,
      onChange: (v) => setClsFilter(v as Cls | null),
      options: [
        { value: null, label: 'wszystkie' },
        ...CLASSES.map((c) => ({ value: c, label: c, count: clsCounts.get(c) })),
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
        createLabel="+ Dodaj companion"
        pillGroups={pillGroups}
      />
      <TableShell
        headers={['portret', 'slug', 'name', 'cls', 'lvl', 'price', 'trait', 'buff', '']}
      >
        {rows.map((r) => (
          <tr key={r.slug} style={{ borderTop: '1px solid #eee' }}>
            <td style={tdStyle}>
              <PortraitByClass cls={r.cls as SharedClass} size={48} />
            </td>
            <td style={tdStyle}>
              <code style={{ fontSize: 13 }}>{r.slug}</code>
            </td>
            <td style={tdStyle}>{r.name}</td>
            <td style={tdStyle}>{r.cls}</td>
            <td style={tdStyle}>{r.lvl}</td>
            <td style={tdStyle}>{r.price}g</td>
            <td style={tdStyle}>{r.trait}</td>
            <td style={{ ...tdStyle, fontSize: 13, color: '#555' }}>
              {Object.entries(r.buff as Record<string, number>)
                .map(([k, v]) => `${k}=${v}`)
                .join(', ') || '—'}
            </td>
            <td style={tdStyle}>
              <button
                type="button"
                onClick={() => {
                  const b = r.buff as Record<string, number | undefined>;
                  setEditing({
                    slug: r.slug,
                    name: r.name,
                    cls: r.cls as Cls,
                    lvl: r.lvl,
                    price: r.price,
                    trait: r.trait,
                    buff: {
                      atkBonus: b.atkBonus ?? null,
                      magBonus: b.magBonus ?? null,
                      lootBonusPct: b.lootBonusPct ?? null,
                      healBonus: b.healBonus ?? null,
                    },
                  });
                }}
                style={btnGhostStyle}
              >
                Edytuj
              </button>
            </td>
          </tr>
        ))}
      </TableShell>
      {editing && (
        <DraftModal
          draft={editing}
          title={`Edytuj ${editing.slug}`}
          busy={update.isPending || remove.isPending}
          error={update.error?.message ?? remove.error?.message ?? null}
          lockId
          onCancel={() => {
            setEditing(null);
            update.reset();
            remove.reset();
          }}
          onSave={async (d) => {
            await update.mutateAsync({
              slug: d.slug,
              name: d.name,
              cls: d.cls,
              lvl: d.lvl,
              price: d.price,
              trait: d.trait,
              buff: stripBuff(d.buff),
            });
            setEditing(null);
          }}
          onDelete={async () => {
            if (!confirm(`Usunąć companion ${editing.slug}?`)) return;
            await remove.mutateAsync({ slug: editing.slug });
            setEditing(null);
          }}
        />
      )}
      {creating && (
        <DraftModal
          draft={emptyDraft()}
          title="Nowy companion_template"
          busy={create.isPending}
          error={create.error?.message ?? null}
          onCancel={() => {
            setCreating(false);
            create.reset();
          }}
          onSave={async (d) => {
            await create.mutateAsync({
              slug: d.slug,
              name: d.name,
              cls: d.cls,
              lvl: d.lvl,
              price: d.price,
              trait: d.trait,
              buff: stripBuff(d.buff),
            });
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
  const setBuff = <K extends keyof Draft['buff']>(k: K, v: Draft['buff'][K]) =>
    setDraft((d) => ({ ...d, buff: { ...d.buff, [k]: v } }));
  return (
    <ModalShell
      title={title}
      busy={busy}
      error={error}
      canSave={Boolean(draft.slug && draft.name)}
      onCancel={onCancel}
      onSave={() => void onSave(draft)}
      onDelete={onDelete ? () => void onDelete() : undefined}
    >
      <Field label="slug">
        <input
          value={draft.slug}
          onChange={(e) => set('slug', e.target.value)}
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <Field label="cls">
          <select
            value={draft.cls}
            onChange={(e) => set('cls', e.target.value as Cls)}
            style={inputStyle}
          >
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <NumField label="lvl" value={draft.lvl} onChange={(v) => set('lvl', v ?? 1)} min={1} />
        <NumField
          label="price"
          value={draft.price}
          onChange={(v) => set('price', v ?? 0)}
          min={0}
        />
      </div>
      <Field label="trait (display text)">
        <input
          value={draft.trait}
          onChange={(e) => set('trait', e.target.value)}
          style={inputStyle}
        />
      </Field>
      <div
        style={{
          marginTop: 6,
          padding: 10,
          border: '1px dashed #bbb',
          borderRadius: 6,
          display: 'grid',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 12, color: '#555' }}>
          buff (każde pole opcjonalne — puste = nie stosuj)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <NumField
            label="atkBonus"
            value={draft.buff.atkBonus}
            onChange={(v) => setBuff('atkBonus', v)}
          />
          <NumField
            label="magBonus"
            value={draft.buff.magBonus}
            onChange={(v) => setBuff('magBonus', v)}
          />
          <NumField
            label="lootBonusPct (0-100)"
            value={draft.buff.lootBonusPct}
            onChange={(v) => setBuff('lootBonusPct', v)}
            min={0}
            max={100}
          />
          <NumField
            label="healBonus (0-1) — potion heal multiplier"
            value={draft.buff.healBonus}
            onChange={(v) => setBuff('healBonus', v)}
            min={0}
            max={1}
            step={0.05}
          />
        </div>
      </div>
    </ModalShell>
  );
}
