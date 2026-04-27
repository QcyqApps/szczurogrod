import { useMemo, useState } from 'react';
import { trpc } from '@/api/trpc';
import { useAdminStore } from './admin-store';
import {
  Field,
  IconPickerField,
  IconPreview,
  ModalShell,
  NumField,
  TableShell,
  Toolbar,
  type FilterPillGroup,
} from './ui';
import { btnGhostStyle, inputStyle, tdStyle } from './ui-styles';

const DIFFS = ['Łatwe', 'Średnie', 'Trudne', 'Ekstr.', 'Boss'] as const;
const CHAPTERS = ['akt-1', 'akt-2', 'akt-3', 'akt-4', 'akt-5'] as const;
type Diff = (typeof DIFFS)[number];
type Chapter = (typeof CHAPTERS)[number];

interface Draft {
  id: string;
  title: string;
  desc: string;
  icon: string;
  diff: Diff;
  gold: number;
  xp: number;
  itemChance: number;
  duration: number;
  requiredLvl: number;
  chapter: Chapter;
}

function emptyDraft(): Draft {
  return {
    id: '',
    title: '',
    desc: '',
    icon: '',
    diff: 'Łatwe',
    gold: 0,
    xp: 0,
    itemChance: 15,
    duration: 30_000,
    requiredLvl: 1,
    chapter: 'akt-1',
  };
}

export function QuestTemplatesEditor() {
  const token = useAdminStore((s) => s.token);
  const utils = trpc.useUtils();
  const list = trpc.admin.questTemplates.list.useQuery(undefined, { enabled: Boolean(token) });
  const update = trpc.admin.questTemplates.update.useMutation({
    onSuccess: () => {
      void utils.admin.questTemplates.list.invalidate();
      void utils.admin.counts.invalidate();
    },
  });
  const create = trpc.admin.questTemplates.create.useMutation({
    onSuccess: () => {
      void utils.admin.questTemplates.list.invalidate();
      void utils.admin.counts.invalidate();
    },
  });
  const remove = trpc.admin.questTemplates.remove.useMutation({
    onSuccess: () => {
      void utils.admin.questTemplates.list.invalidate();
      void utils.admin.counts.invalidate();
    },
  });

  const [filter, setFilter] = useState('');
  const [chapterFilter, setChapterFilter] = useState<string | null>(null);
  const [diffFilter, setDiffFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [creating, setCreating] = useState(false);

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const src = list.data ?? [];
    const filtered = src.filter((r) => {
      if (chapterFilter && r.chapter !== chapterFilter) return false;
      if (diffFilter && r.diff !== diffFilter) return false;
      return true;
    });
    if (!q) return filtered;
    return filtered.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.chapter.toLowerCase().includes(q),
    );
  }, [list.data, filter, chapterFilter, diffFilter]);

  const chapterCounts = useMemo(() => {
    const src = list.data ?? [];
    const m = new Map<string, number>();
    for (const r of src) m.set(r.chapter, (m.get(r.chapter) ?? 0) + 1);
    return m;
  }, [list.data]);

  const diffCounts = useMemo(() => {
    const src = list.data ?? [];
    const m = new Map<string, number>();
    for (const r of src) m.set(r.diff, (m.get(r.diff) ?? 0) + 1);
    return m;
  }, [list.data]);

  const pillGroups: ReadonlyArray<FilterPillGroup> = [
    {
      label: 'Chapter:',
      value: chapterFilter,
      onChange: setChapterFilter,
      options: [
        { value: null, label: 'wszystkie' },
        ...CHAPTERS.map((c) => ({ value: c, label: c, count: chapterCounts.get(c) })),
      ],
    },
    {
      label: 'Diff:',
      value: diffFilter,
      onChange: setDiffFilter,
      options: [
        { value: null, label: 'wszystkie' },
        ...DIFFS.map((d) => ({ value: d, label: d, count: diffCounts.get(d) })),
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
        createLabel="+ Dodaj quest"
        pillGroups={pillGroups}
      />
      <TableShell
        headers={[
          'id',
          'icon',
          'title',
          'diff',
          'chapter',
          'lvl',
          'gold/xp',
          'itemChance',
          'duration',
          '',
        ]}
      >
        {rows.map((r) => (
          <tr key={r.id} style={{ borderTop: '1px solid #eee' }}>
            <td style={tdStyle}>
              <code style={{ fontSize: 13 }}>{r.id}</code>
            </td>
            <td style={tdStyle}>
              <IconPreview name={r.icon} size={26} />
            </td>
            <td style={tdStyle}>{r.title}</td>
            <td style={tdStyle}>{r.diff}</td>
            <td style={tdStyle}>{r.chapter}</td>
            <td style={tdStyle}>{r.requiredLvl}</td>
            <td style={tdStyle}>
              {r.gold}g / {r.xp}xp
            </td>
            <td style={tdStyle}>{r.itemChance}%</td>
            <td style={tdStyle}>{Math.round(r.duration / 1000)}s</td>
            <td style={tdStyle}>
              <button
                type="button"
                onClick={() =>
                  setEditing({
                    id: r.id,
                    title: r.title,
                    desc: r.desc,
                    icon: r.icon,
                    diff: r.diff as Diff,
                    gold: r.gold,
                    xp: r.xp,
                    itemChance: r.itemChance,
                    duration: r.duration,
                    requiredLvl: r.requiredLvl,
                    chapter: r.chapter as Chapter,
                  })
                }
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
            if (!confirm(`Usunąć quest ${editing.id}? Referencje w boss_unique_drops zablokują.`))
              return;
            await remove.mutateAsync({ id: editing.id });
            setEditing(null);
          }}
        />
      )}
      {creating && (
        <DraftModal
          draft={emptyDraft()}
          title="Nowy quest_template"
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
      canSave={Boolean(draft.id && draft.title && draft.icon)}
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
      <Field label="title">
        <input
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
          style={inputStyle}
        />
      </Field>
      <IconPickerField label="icon" value={draft.icon} onChange={(v) => set('icon', v)} />
      <Field label="desc">
        <textarea
          value={draft.desc}
          onChange={(e) => set('desc', e.target.value)}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="diff">
          <select
            value={draft.diff}
            onChange={(e) => set('diff', e.target.value as Diff)}
            style={inputStyle}
          >
            {DIFFS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="chapter">
          <select
            value={draft.chapter}
            onChange={(e) => set('chapter', e.target.value as Chapter)}
            style={inputStyle}
          >
            {CHAPTERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <NumField
          label="gold"
          value={draft.gold}
          onChange={(v) => set('gold', v ?? 0)}
          min={0}
        />
        <NumField label="xp" value={draft.xp} onChange={(v) => set('xp', v ?? 0)} min={0} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <NumField
          label="itemChance %"
          value={draft.itemChance}
          onChange={(v) => set('itemChance', v ?? 0)}
          min={0}
          max={100}
        />
        <NumField
          label="duration (ms)"
          value={draft.duration}
          onChange={(v) => set('duration', v ?? 1000)}
          min={1000}
        />
        <NumField
          label="requiredLvl"
          value={draft.requiredLvl}
          onChange={(v) => set('requiredLvl', v ?? 1)}
          min={1}
          max={100}
        />
      </div>
    </ModalShell>
  );
}
