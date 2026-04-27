import { useMemo, useState } from 'react';
import { trpc } from '@/api/trpc';
import { useAdminStore } from './admin-store';
import { Field, IconPreview, ModalShell, NumField, TableShell } from './ui';
import { btnGhostStyle, inputStyle, tdStyle } from './ui-styles';

const KINDS = ['gold', 'xp', 'potion', 'gem', 'gift', 'crown'] as const;
type Kind = (typeof KINDS)[number];

interface Draft {
  day: number;
  kind: Kind;
  v: string;
  gold: number;
  gems: number;
  xp: number;
  itemTemplateId: string | null;
}

export function DailyLadderEditor() {
  const token = useAdminStore((s) => s.token);
  const utils = trpc.useUtils();
  const list = trpc.admin.dailyLadder.list.useQuery(undefined, { enabled: Boolean(token) });
  const items = trpc.admin.itemTemplates.list.useQuery(undefined, { enabled: Boolean(token) });
  const update = trpc.admin.dailyLadder.update.useMutation({
    onSuccess: () => {
      void utils.admin.dailyLadder.list.invalidate();
      void utils.admin.counts.invalidate();
    },
  });

  const iconByTemplateId = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of items.data ?? []) map.set(it.id, it.icon);
    return map;
  }, [items.data]);

  const [editing, setEditing] = useState<Draft | null>(null);

  if (list.isLoading) return <div>Ładowanie…</div>;
  if (list.error) return <div style={{ color: 'crimson' }}>Błąd: {list.error.message}</div>;

  return (
    <div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
        7 stałych slotów (day 1..7). Nie można dodawać / usuwać — tylko edytować nagrodę.
      </div>
      <TableShell headers={['day', 'kind', 'v', 'gold', 'gems', 'xp', 'item_template_id', '']}>
        {(list.data ?? []).map((r) => (
          <tr key={r.day} style={{ borderTop: '1px solid #eee' }}>
            <td style={tdStyle}>{r.day}</td>
            <td style={tdStyle}>{r.kind}</td>
            <td style={tdStyle}>{r.v}</td>
            <td style={tdStyle}>{r.gold}</td>
            <td style={tdStyle}>{r.gems}</td>
            <td style={tdStyle}>{r.xp}</td>
            <td style={tdStyle}>
              {r.itemTemplateId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconPreview name={iconByTemplateId.get(r.itemTemplateId) ?? ''} size={22} />
                  <code style={{ fontSize: 13 }}>{r.itemTemplateId}</code>
                </div>
              ) : (
                <span style={{ color: '#888' }}>—</span>
              )}
            </td>
            <td style={tdStyle}>
              <button
                type="button"
                onClick={() =>
                  setEditing({
                    day: r.day,
                    kind: r.kind as Kind,
                    v: r.v,
                    gold: r.gold,
                    gems: r.gems,
                    xp: r.xp,
                    itemTemplateId: r.itemTemplateId,
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
          title={`Edytuj day ${editing.day}`}
          busy={update.isPending}
          error={update.error?.message ?? null}
          onCancel={() => {
            setEditing(null);
            update.reset();
          }}
          onSave={async (d) => {
            await update.mutateAsync({
              day: d.day,
              kind: d.kind,
              v: d.v,
              gold: d.gold,
              gems: d.gems,
              xp: d.xp,
              itemTemplateId: d.itemTemplateId,
            });
            setEditing(null);
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
  onCancel,
  onSave,
}: {
  draft: Draft;
  title: string;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: (d: Draft) => Promise<void> | void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  return (
    <ModalShell
      title={title}
      busy={busy}
      error={error}
      canSave={true}
      onCancel={onCancel}
      onSave={() => void onSave(draft)}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="kind">
          <select
            value={draft.kind}
            onChange={(e) => set('kind', e.target.value as Kind)}
            style={inputStyle}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>
        <Field label="v (display label)">
          <input
            value={draft.v}
            onChange={(e) => set('v', e.target.value)}
            style={inputStyle}
            maxLength={16}
          />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <NumField
          label="gold"
          value={draft.gold}
          onChange={(v) => set('gold', v ?? 0)}
          min={0}
        />
        <NumField
          label="gems"
          value={draft.gems}
          onChange={(v) => set('gems', v ?? 0)}
          min={0}
        />
        <NumField label="xp" value={draft.xp} onChange={(v) => set('xp', v ?? 0)} min={0} />
      </div>
      <Field label="item_template_id (puste = bez itemu)">
        <input
          value={draft.itemTemplateId ?? ''}
          onChange={(e) => set('itemTemplateId', e.target.value || null)}
          style={inputStyle}
          placeholder="np. item_f144da358dc5"
        />
      </Field>
    </ModalShell>
  );
}
