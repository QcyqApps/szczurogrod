import { useEffect } from 'react';
import { useToastQueue, type Toast } from '@/api/toast-queue-store';

/**
 * Stacka aktywnych toastów — top-center, non-blocking, nie pcha layoutu.
 * Każdy toast znika automatycznie po swoim `ttlMs` (default 3200ms).
 * Klik na toast zamyka od razu.
 */
export function ToastContainer() {
  const queue = useToastQueue((s) => s.queue);

  return (
    <div
      style={{
        position: 'absolute',
        top: 54,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        zIndex: 200,
        pointerEvents: 'none',
      }}
    >
      {queue.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const ttl = toast.ttlMs ?? 3200;
  // Bierzemy `dismiss` ze store'a bezpośrednio — Zustand actions są stabilne,
  // więc timer wystartuje raz na mount i nie resetuje się przy re-renderach
  // parent'a. Wcześniej `onDismiss` przychodziło jako inline arrow z parenta
  // i zmieniało się przy każdym push'u kolejnego toasta — efektywnie
  // resetowało TTL wszystkich widocznych toastów.
  const dismiss = useToastQueue((s) => s.dismiss);
  useEffect(() => {
    const timerId = setTimeout(() => dismiss(toast.id), ttl);
    return () => clearTimeout(timerId);
  }, [toast.id, ttl, dismiss]);

  const accent = toast.accent ?? '#ffc830';

  return (
    <div
      role="status"
      onClick={() => dismiss(toast.id)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        maxWidth: '90%',
        padding: '6px 10px',
        background: '#fff7e0',
        border: '2.5px solid #2a1810',
        borderRadius: 10,
        boxShadow: '2px 2px 0 #2a1810',
        fontSize: 13,
        color: '#2a1810',
        pointerEvents: 'auto',
        cursor: 'pointer',
        animation: 'toast-slide 0.25s ease-out',
      }}
    >
      {toast.tag && (
        <span
          className="h-title"
          style={{
            fontSize: 10,
            letterSpacing: 0.6,
            background: accent,
            color: '#2a1810',
            padding: '2px 6px',
            borderRadius: 6,
            border: '2px solid #2a1810',
          }}
        >
          {toast.tag}
        </span>
      )}
      <span style={{ fontWeight: 500 }}>{toast.text}</span>
    </div>
  );
}
