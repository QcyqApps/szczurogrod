import { GameIcon } from '@/components/game-icons';
import { trpc } from '@/api/trpc';

export interface ScreenChronicleProps {
  onBack: () => void;
}

export function ScreenChronicle({ onBack }: ScreenChronicleProps) {
  const q = trpc.town.chronicle.useQuery(undefined, {
    // Chronicle feed to głównie stałe wartości na dzień — nie spamuj serwera.
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const entries = q.data?.entries ?? [];

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div
        style={{
          background: 'linear-gradient(180deg, #5a3a2a 0%, #3a1a1a 100%)',
          border: '3px solid #2a1810',
          borderRadius: 14,
          boxShadow: '3px 3px 0 #2a1810',
          padding: 14,
          color: '#fff3e0',
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 4,
          }}
        >
          <GameIcon name="megaphone" size={44} />
        </div>
        <div className="h-display" style={{ fontSize: 22 }}>KRONIKI SZCZUROGRODU</div>
        <div className="flavor light" style={{ fontSize: 17, marginTop: 4 }}>
          Co miasto widziało. Co karczmarz słyszał.
        </div>
      </div>

      <div className="panel" style={{ padding: 10 }}>
        {entries.length === 0 ? (
          <div
            className="flavor"
            style={{ textAlign: 'center', padding: 12, color: '#5a3a2a' }}
          >
            {q.isLoading ? 'Ładowanie kroniki…' : 'Kronikarz pisze. Wróć za chwilę.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                style={{
                  padding: '8px 4px',
                  borderBottom: i < entries.length - 1 ? '1px dashed #c8b890' : 'none',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 28,
                    textAlign: 'center',
                    fontFamily: 'Luckiest Guy, sans-serif',
                    fontSize: 14,
                    color: entry.source === 'event' ? '#c83232' : '#8a6a4a',
                    paddingTop: 2,
                    lineHeight: 1,
                  }}
                  title={
                    entry.source === 'event'
                      ? 'Prawdziwy event gracza'
                      : 'Plotka z miasta'
                  }
                >
                  {entry.source === 'event' ? '!' : '·'}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.3, flex: 1, color: '#2a1810' }}>
                  {entry.text}
                  {entry.createdAt !== null && (
                    <div
                      className="mono"
                      style={{ fontSize: 10, color: '#8a6a4a', marginTop: 2 }}
                    >
                      {formatAgo(entry.createdAt)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="cbtn ghost"
        style={{ marginTop: 14, width: '100%' }}
        onClick={onBack}
      >
        ← Wróć
      </button>
    </div>
  );
}

function formatAgo(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'przed chwilą';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min temu`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h temu`;
  return `${Math.floor(diff / 86_400_000)} dni temu`;
}
