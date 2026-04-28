// Web-only blocker — pokazywany kiedy gracz w przeglądarce klika BUY na
// jakimkolwiek produkcie real-money (gem packs, bundle, VIP). Wyjaśnia że
// płatności są dostępne tylko w aplikacji Android i pokazuje znaczek
// Google Play. Modal zamiast toastu, bo to ważna informacja bramkująca
// transakcję — toast łatwo przeoczyć, modal nie.
//
// Renderowany TYLKO gdy `!isNative()` — Capacitor build w ogóle nie zobaczy
// tego komponentu, więc bundle mobilny nie ma martwego kodu.

import { useEffect } from 'react';
import { useT } from '@/i18n';

export interface NativeOnlyPurchaseModalProps {
  productLabel: string;
  onClose: () => void;
}

export function NativeOnlyPurchaseModal({
  productLabel,
  onClose,
}: NativeOnlyPurchaseModalProps) {
  const t = useT();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 400,
        background: 'rgba(20,12,8,0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'modal-fade-in 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel"
        style={{
          width: '100%',
          maxWidth: 340,
          padding: 18,
          background: '#fff7e0',
          border: '4px solid #2a1810',
          borderRadius: 14,
          boxShadow: '4px 4px 0 #2a1810, 0 0 32px rgba(212, 162, 76, 0.35)',
          textAlign: 'center',
        }}
      >
        <div
          className="h-title"
          style={{
            fontSize: 13,
            color: '#a87d2e',
            letterSpacing: 2.5,
            marginBottom: 6,
          }}
        >
          {t('gemShop.modal.heading')}
        </div>

        <div
          style={{
            width: 80,
            height: 80,
            margin: '8px auto 12px',
            borderRadius: 16,
            border: '4px solid #2a1810',
            background: '#fff7e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 12px rgba(0,0,0,0.15), 0 0 16px rgba(212,162,76,0.4)',
          }}
        >
          <img src="/google-play.png" alt="" width={56} height={56} />
        </div>

        <div
          className="h-display"
          style={{ fontSize: 20, color: '#2a1810', lineHeight: 1.1, marginBottom: 6 }}
        >
          {t('gemShop.modal.title')}
        </div>

        <div
          className="flavor"
          style={{
            fontSize: 14,
            color: '#5a3a2a',
            marginBottom: 12,
            lineHeight: 1.4,
          }}
        >
          {t('gemShop.modal.body').replace('{product}', productLabel)}
        </div>

        <div
          style={{
            background: '#e8dcb9',
            border: '2.5px solid #2a1810',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 13,
            color: '#3a2a1a',
            marginBottom: 14,
            textAlign: 'left',
            lineHeight: 1.4,
          }}
        >
          {t('gemShop.modal.note')}
        </div>

        <button
          type="button"
          className="cbtn green"
          style={{ width: '100%' }}
          onClick={onClose}
        >
          {t('gemShop.modal.ok')}
        </button>
      </div>
    </div>
  );
}
