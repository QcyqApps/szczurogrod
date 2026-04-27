import { useMemo, useState } from 'react';
import { trpc } from '@/api/trpc';
import { Monster, monsterBySlug, MONSTERS } from '@/components/monsters';
import { useAdminStore } from './admin-store';
import { Field, ModalShell, NumField, TableShell, Toolbar, type FilterPillGroup } from './ui';
import { btnGhostStyle, inputStyle, tdStyle } from './ui-styles';

interface Draft {
  slug: string;
  name: string;
  lvl: number;
  hp: number;
  atk: number;
  gold: number;
  xp: number;
  requiredLvl: number;
  tier: number;
}

function emptyDraft(): Draft {
  return { slug: '', name: '', lvl: 1, hp: 50, atk: 5, gold: 10, xp: 10, requiredLvl: 1, tier: 1 };
}

export function EnemyTemplatesEditor() {
  const token = useAdminStore((s) => s.token);
  const utils = trpc.useUtils();
  const list = trpc.admin.enemyTemplates.list.useQuery(undefined, { enabled: Boolean(token) });
  const update = trpc.admin.enemyTemplates.update.useMutation({
    onSuccess: () => {
      void utils.admin.enemyTemplates.list.invalidate();
      void utils.admin.counts.invalidate();
    },
  });
  const create = trpc.admin.enemyTemplates.create.useMutation({
    onSuccess: () => {
      void utils.admin.enemyTemplates.list.invalidate();
      void utils.admin.counts.invalidate();
    },
  });
  const remove = trpc.admin.enemyTemplates.remove.useMutation({
    onSuccess: () => {
      void utils.admin.enemyTemplates.list.invalidate();
      void utils.admin.counts.invalidate();
    },
  });

  const [filter, setFilter] = useState('');
  const [tierFilter, setTierFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [creating, setCreating] = useState(false);

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const src = list.data ?? [];
    const filtered = src.filter((r) => {
      if (tierFilter && String(r.tier) !== tierFilter) return false;
      return true;
    });
    if (!q) return filtered;
    return filtered.filter(
      (r) => r.slug.toLowerCase().includes(q) || r.name.toLowerCase().includes(q),
    );
  }, [list.data, filter, tierFilter]);

  const tierCounts = useMemo(() => {
    const src = list.data ?? [];
    const m = new Map<number, number>();
    for (const r of src) m.set(r.tier, (m.get(r.tier) ?? 0) + 1);
    return m;
  }, [list.data]);

  const pillGroups: ReadonlyArray<FilterPillGroup> = [
    {
      label: 'Tier:',
      value: tierFilter,
      onChange: setTierFilter,
      options: [
        { value: null, label: 'wszystkie' },
        ...[1, 2, 3, 4, 5].map((t) => ({
          value: String(t),
          label: `T${t}`,
          count: tierCounts.get(t),
        })),
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
        createLabel="+ Dodaj enemy"
        pillGroups={pillGroups}
      />
      <TableShell
        headers={['avatar', 'slug', 'name', 'lvl', 'hp', 'atk', 'gold/xp', 'reqLvl', 'tier', '']}
      >
        {rows.map((r) => {
          const hasRecipe = r.slug in MONSTERS;
          return (
          <tr key={r.slug} style={{ borderTop: '1px solid #eee' }}>
            <td style={tdStyle}>
              {hasRecipe ? (
                <Monster recipe={monsterBySlug(r.slug)} size={48} />
              ) : (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fee',
                    border: '1px dashed #c99',
                    borderRadius: 4,
                    color: '#a00',
                    fontSize: 13,
                  }}
                  title="Brak receptury w components/monsters/recipes.ts"
                >
                  ?
                </div>
              )}
            </td>
            <td style={tdStyle}>
              <code style={{ fontSize: 13 }}>{r.slug}</code>
            </td>
            <td style={tdStyle}>{r.name}</td>
            <td style={tdStyle}>{r.lvl}</td>
            <td style={tdStyle}>{r.hp}</td>
            <td style={tdStyle}>{r.atk}</td>
            <td style={tdStyle}>
              {r.gold}g / {r.xp}xp
            </td>
            <td style={tdStyle}>{r.requiredLvl}</td>
            <td style={tdStyle}>T{r.tier}</td>
            <td style={tdStyle}>
              <button
                type="button"
                onClick={() => setEditing({ ...r })}
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
            await update.mutateAsync(d);
            setEditing(null);
          }}
          onDelete={async () => {
            if (!confirm(`Usunąć enemy ${editing.slug}?`)) return;
            await remove.mutateAsync({ slug: editing.slug });
            setEditing(null);
          }}
        />
      )}
      {creating && (
        <DraftModal
          draft={emptyDraft()}
          title="Nowy enemy_template"
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
        <NumField label="lvl" value={draft.lvl} onChange={(v) => set('lvl', v ?? 1)} min={1} />
        <NumField label="hp" value={draft.hp} onChange={(v) => set('hp', v ?? 1)} min={1} />
        <NumField label="atk" value={draft.atk} onChange={(v) => set('atk', v ?? 0)} min={0} />
        <NumField
          label="tier"
          value={draft.tier}
          onChange={(v) => set('tier', v ?? 1)}
          min={1}
          max={4}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <NumField
          label="gold"
          value={draft.gold}
          onChange={(v) => set('gold', v ?? 0)}
          min={0}
        />
        <NumField label="xp" value={draft.xp} onChange={(v) => set('xp', v ?? 0)} min={0} />
        <NumField
          label="requiredLvl"
          value={draft.requiredLvl}
          onChange={(v) => set('requiredLvl', v ?? 1)}
          min={1}
        />
      </div>
    </ModalShell>
  );
}
