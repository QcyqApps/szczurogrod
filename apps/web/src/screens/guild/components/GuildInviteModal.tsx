import { useEffect, useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { PortraitByClass } from '@/components/portraits';

export interface GuildInviteModalProps {
  onClose: () => void;
}

export function GuildInviteModal({ onClose }: GuildInviteModalProps) {
  const pushToast = useToastQueue((s) => s.push);
  const [raw, setRaw] = useState('');
  const [query, setQuery] = useState('');

  // Debounce 300ms — nie obciążamy servera każdym wciśnięciem klawisza.
  useEffect(() => {
    const handle = setTimeout(() => setQuery(raw.trim()), 300);
    return () => clearTimeout(handle);
  }, [raw]);

  const searchQuery = trpc.guild.searchCharacter.useQuery(
    { query },
    { enabled: query.length >= 3 },
  );

  const inviteMut = trpc.guild.invite.useMutation({
    onSuccess: (_, vars) => {
      const target = searchQuery.data?.results.find((r) => r.id === vars.characterId);
      pushToast({
        text: `Zaproszono ${target?.name ?? 'gracza'}.`,
        accent: '#2a4a3a',
      });
      onClose();
    },
    onError: (err) => {
      const msg =
        err instanceof TRPCClientError ? err.message : 'Nie udało się zaprosić.';
      pushToast({ text: msg, accent: '#c83232', ttlMs: 4200 });
    },
  });

  const results = searchQuery.data?.results ?? [];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 220,
        background: 'rgba(42,24,16,0.65)',
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
          padding: 16,
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <div
          className="h-display"
          style={{ fontSize: 18, textAlign: 'center', marginBottom: 10 }}
        >
          ZAPROŚ GRACZA
        </div>

        <input
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="Szukaj po nazwie (min. 3 znaki)"
          autoFocus
          style={{
            width: '100%',
            padding: '8px 10px',
            border: '2.5px solid #2a1810',
            borderRadius: 8,
            background: '#fff7e0',
            fontFamily: 'inherit',
            fontSize: 14,
            marginBottom: 10,
          }}
        />

        {query.length < 3 && (
          <div
            className="flavor"
            style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', marginBottom: 8 }}
          >
            Wpisz kogo szukasz. Miasto duże.
          </div>
        )}

        {query.length >= 3 && searchQuery.isLoading && (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#5a3a2a' }}>Szukam...</div>
        )}

        {query.length >= 3 && !searchQuery.isLoading && results.length === 0 && (
          <div
            className="flavor"
            style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', marginBottom: 8 }}
          >
            Nikogo takiego w Szczurogrodzie. Albo już gdzieś siedzi.
          </div>
        )}

        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {results.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: 6,
                  border: '2px solid #2a1810',
                  borderRadius: 8,
                  background: '#fff7e0',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    overflow: 'hidden',
                    border: '2px solid #2a1810',
                    flexShrink: 0,
                  }}
                >
                  <PortraitByClass cls={r.cls} size={36} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="h-title" style={{ fontSize: 13, lineHeight: 1 }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 13, color: '#5a3a2a' }}>
                    {labelForClass(r.cls)} · LVL {r.lvl}
                  </div>
                </div>
                <button
                  type="button"
                  className="cbtn green sm"
                  disabled={inviteMut.isPending}
                  onClick={() => inviteMut.mutate({ characterId: r.id })}
                >
                  ZAPROŚ
                </button>
              </div>
            ))}
          </div>
        )}

        <button type="button" className="cbtn ghost sm" style={{ width: '100%' }} onClick={onClose}>
          ZAMKNIJ
        </button>
      </div>
    </div>
  );
}

function labelForClass(cls: 'warrior' | 'mage' | 'rogue'): string {
  if (cls === 'warrior') return 'Wojownik';
  if (cls === 'mage') return 'Mag';
  return 'Łotrzyk';
}
