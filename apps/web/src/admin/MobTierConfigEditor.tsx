import { useState } from 'react';
import { trpc } from '@/api/trpc';
import { useAdminStore } from './admin-store';
import { Field, ModalShell, NumField, TableShell } from './ui';
import { btnGhostStyle, inputStyle, tdStyle } from './ui-styles';

interface RarityWeights {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
}

interface Draft {
  tier: number;
  dropRate: number;
  rarityWeights: RarityWeights;
}

export function MobTierConfigEditor() {
  const token = useAdminStore((s) => s.token);
  const utils = trpc.useUtils();
  const list = trpc.admin.mobTierConfig.list.useQuery(undefined, { enabled: Boolean(token) });
  const update = trpc.admin.mobTierConfig.update.useMutation({
    onSuccess: () => {
      void utils.admin.mobTierConfig.list.invalidate();
      void utils.admin.counts.invalidate();
    },
  });

  const [editing, setEditing] = useState<Draft | null>(null);

  if (list.isLoading) return <div>Ładowanie…</div>;
  if (list.error) return <div style={{ color: 'crimson' }}>Błąd: {list.error.message}</div>;

  return (
    <div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
        4 stałe tiery (1..4). dropRate 0-1, rarityWeights = liczby całkowite (sumowane relatywnie).
      </div>
      <TableShell headers={['tier', 'dropRate', 'common', 'rare', 'epic', 'legendary', '']}>
        {(list.data ?? []).map((r) => {
          const w = r.rarityWeights as unknown as RarityWeights;
          return (
            <tr key={r.tier} style={{ borderTop: '1px solid #eee' }}>
              <td style={tdStyle}>T{r.tier}</td>
              <td style={tdStyle}>{Number(r.dropRate).toFixed(2)}</td>
              <td style={tdStyle}>{w.common}</td>
              <td style={tdStyle}>{w.rare}</td>
              <td style={tdStyle}>{w.epic}</td>
              <td style={tdStyle}>{w.legendary}</td>
              <td style={tdStyle}>
                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      tier: r.tier,
                      dropRate: Number(r.dropRate),
                      rarityWeights: { ...w },
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
          title={`Edytuj tier ${editing.tier}`}
          busy={update.isPending}
          error={update.error?.message ?? null}
          onCancel={() => {
            setEditing(null);
            update.reset();
          }}
          onSave={async (d) => {
            await update.mutateAsync({
              tier: d.tier,
              dropRate: d.dropRate,
              rarityWeights: d.rarityWeights,
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
  const setWeight = <K extends keyof RarityWeights>(k: K, v: number) =>
    setDraft((d) => ({ ...d, rarityWeights: { ...d.rarityWeights, [k]: v } }));
  return (
    <ModalShell
      title={title}
      busy={busy}
      error={error}
      canSave={true}
      onCancel={onCancel}
      onSave={() => void onSave(draft)}
    >
      <Field label="dropRate (0.0 - 1.0)">
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={draft.dropRate}
          onChange={(e) => setDraft((d) => ({ ...d, dropRate: Number(e.target.value) }))}
          style={inputStyle}
        />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <NumField
          label="common"
          value={draft.rarityWeights.common}
          onChange={(v) => setWeight('common', v ?? 0)}
          min={0}
        />
        <NumField
          label="rare"
          value={draft.rarityWeights.rare}
          onChange={(v) => setWeight('rare', v ?? 0)}
          min={0}
        />
        <NumField
          label="epic"
          value={draft.rarityWeights.epic}
          onChange={(v) => setWeight('epic', v ?? 0)}
          min={0}
        />
        <NumField
          label="legendary"
          value={draft.rarityWeights.legendary}
          onChange={(v) => setWeight('legendary', v ?? 0)}
          min={0}
        />
      </div>
    </ModalShell>
  );
}
