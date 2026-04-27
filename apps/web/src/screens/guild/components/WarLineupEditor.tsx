import { useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { PortraitByClass } from '@/components/portraits';
import type { GuildWarParticipant } from '@grodno/shared';

export interface WarLineupEditorProps {
  warId: string;
  mySideParticipants: readonly GuildWarParticipant[];
  onClose: () => void;
}

export function WarLineupEditor({
  warId,
  mySideParticipants,
  onClose,
}: WarLineupEditorProps) {
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);

  // Local order — klonowane, posortowane po orderIndex. User może ↑↓.
  const [order, setOrder] = useState(() =>
    [...mySideParticipants].sort((a, b) => a.orderIndex - b.orderIndex),
  );

  const reorderMut = trpc.guildWars.reorder.useMutation({
    onSuccess: () => {
      pushToast({ text: 'Szyk ustawiony.', accent: '#2a4a3a' });
      void utils.guildWars.get.invalidate({ warId });
      onClose();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : 'Nie udało się.',
        accent: '#c83232',
      });
    },
  });

  const move = (idx: number, delta: -1 | 1) => {
    const nextIdx = idx + delta;
    if (nextIdx < 0 || nextIdx >= order.length) return;
    const copy = [...order];
    [copy[idx], copy[nextIdx]] = [copy[nextIdx]!, copy[idx]!];
    setOrder(copy);
  };

  const onSave = () => {
    reorderMut.mutate({
      warId,
      orders: order.map((p, i) => ({ characterId: p.characterId, orderIndex: i })),
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 230,
        background: 'rgba(42,24,16,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'modal-fade-in 0.25s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel"
        style={{
          width: '100%',
          maxWidth: 360,
          background: '#f3ead9',
          padding: 14,
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div className="h-display" style={{ fontSize: 18, textAlign: 'center', marginBottom: 6 }}>
          USTAW SZYK
        </div>
        <div
          className="flavor"
          style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', marginBottom: 10 }}
        >
          Pierwszy walczy z pierwszym przeciwnika. Zwycięzca zostaje z resztką HP.
        </div>

        {order.length === 0 && (
          <div
            className="flavor"
            style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', padding: 12 }}
          >
            Nikt nie zgłoszony. Najpierw członkowie, potem szyk.
          </div>
        )}

        {order.map((p, i) => (
          <div
            key={p.characterId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: 6,
              marginBottom: 4,
              border: '2px solid #2a1810',
              borderRadius: 6,
              background: '#fff7e0',
            }}
          >
            <span
              className="mono"
              style={{ fontSize: 14, fontWeight: 700, minWidth: 24, textAlign: 'center' }}
            >
              #{i + 1}
            </span>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                overflow: 'hidden',
                border: '2px solid #2a1810',
                flexShrink: 0,
              }}
            >
              <PortraitByClass cls={p.cls} size={30} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="h-title" style={{ fontSize: 12 }}>
                {p.name}
              </div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>LVL {p.lvl}</div>
            </div>
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              style={{
                width: 28,
                height: 28,
                border: '2px solid #2a1810',
                borderRadius: 4,
                background: '#e8dcb9',
                cursor: i === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 700,
              }}
              aria-label="W górę"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === order.length - 1}
              style={{
                width: 28,
                height: 28,
                border: '2px solid #2a1810',
                borderRadius: 4,
                background: '#e8dcb9',
                cursor: i === order.length - 1 ? 'not-allowed' : 'pointer',
                fontWeight: 700,
              }}
              aria-label="W dół"
            >
              ↓
            </button>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button type="button" className="cbtn ghost sm" style={{ flex: 1 }} onClick={onClose}>
            ANULUJ
          </button>
          <button
            type="button"
            className="cbtn green sm"
            style={{ flex: 1 }}
            disabled={reorderMut.isPending || order.length === 0}
            onClick={onSave}
          >
            {reorderMut.isPending ? '...' : 'ZAPISZ'}
          </button>
        </div>
      </div>
    </div>
  );
}
