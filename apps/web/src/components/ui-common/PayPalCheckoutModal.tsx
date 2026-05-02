// PayPal Checkout modal — web fallback gdy gracz nie jest na Capacitor build.
//
// Flow:
//   1. ScreenGemShop wykrył real-money pack na web → wywołał `onPaypal` →
//      App.tsx ustawił `paypalPack` state → ten modal się renderuje.
//   2. createOrder callback woła naszą tRPC `paypal.createOrder({ packId })` →
//      server tworzy PayPal order z server-authoritative amount → zwraca orderId.
//   3. PayPal Buttons SDK pokazuje gracza do PayPal popup → on autoryzuje.
//   4. onApprove callback woła naszą `paypal.captureOrder({ orderId, packId })` →
//      server captureuje + idempotentnie kredytuje gemy → zwraca status.
//   5. Sukces → toast + me.get invalidate + zamykamy modal.

import { useState } from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { tStatic } from '@/i18n';

export interface PayPalCheckoutModalProps {
  /** Pack id z GEM_PACKAGES (`p1`..`p5`, `vip30`). */
  packId: string;
  productLabel: string;
  /** Sformatowana cena dla wyświetlenia (e.g. "19,99 zł"). */
  priceLabel: string;
  onClose: () => void;
  /** Sukces — App invalidate'uje me.get, pokazuje toast itd. */
  onSuccess: (gemsGranted: number) => void;
}

export function PayPalCheckoutModal({
  packId,
  productLabel,
  priceLabel,
  onClose,
  onSuccess,
}: PayPalCheckoutModalProps) {
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  const [busy, setBusy] = useState(false);

  const createOrderMut = trpc.paypal.createOrder.useMutation();
  const captureOrderMut = trpc.paypal.captureOrder.useMutation();

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 250,
        background: 'rgba(42,24,16,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel"
        style={{
          width: '100%',
          maxWidth: 340,
          background: '#f3ead9',
          padding: 18,
          textAlign: 'center',
          animation: 'qrm-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div className="h-display clean" style={{ fontSize: 18, marginBottom: 4 }}>
          {tStatic('gemShop.paypal.title')}
        </div>
        <div className="flavor" style={{ fontSize: 14, marginBottom: 10 }}>
          {productLabel}
        </div>
        <div
          style={{
            background: '#f9e6a8',
            border: '2.5px solid #2a1810',
            borderRadius: 10,
            padding: 10,
            marginBottom: 14,
          }}
        >
          <div className="h-title" style={{ fontSize: 22, color: '#c83232' }}>
            {priceLabel}
          </div>
        </div>

        <div style={{ minHeight: 50 }}>
          <PayPalButtons
            style={{ layout: 'vertical', shape: 'rect', label: 'paypal' }}
            disabled={busy}
            forceReRender={[packId]}
            createOrder={async () => {
              setBusy(true);
              try {
                const res = await createOrderMut.mutateAsync({ packId });
                return res.orderId;
              } catch (err) {
                setBusy(false);
                pushToast({
                  text: tStatic('gemShop.paypal.toast.createFailed'),
                  accent: '#c83232',
                });
                console.error('[paypal] createOrder failed', err);
                throw err;
              }
            }}
            onApprove={async (data) => {
              try {
                const res = await captureOrderMut.mutateAsync({
                  orderId: data.orderID,
                  packId,
                });
                if (res.status === 'credited' || res.status === 'already_credited') {
                  void utils.me.get.invalidate();
                  pushToast({
                    text: tStatic('gemShop.paypal.toast.success').replace(
                      '{n}',
                      String(res.gemsGranted),
                    ),
                    accent: '#2a4a3a',
                  });
                  onSuccess(res.gemsGranted);
                  onClose();
                } else {
                  pushToast({
                    text: tStatic('gemShop.paypal.toast.captureFailed').replace(
                      '{reason}',
                      res.reason ?? 'UNKNOWN',
                    ),
                    accent: '#c83232',
                  });
                }
              } catch (err) {
                console.error('[paypal] capture failed', err);
                pushToast({
                  text: tStatic('gemShop.paypal.toast.captureFailed').replace(
                    '{reason}',
                    'NETWORK',
                  ),
                  accent: '#c83232',
                });
              } finally {
                setBusy(false);
              }
            }}
            onCancel={() => {
              setBusy(false);
              pushToast({
                text: tStatic('gemShop.paypal.toast.cancelled'),
                accent: '#7a4a2a',
              });
            }}
            onError={(err) => {
              setBusy(false);
              console.error('[paypal] sdk error', err);
              pushToast({
                text: tStatic('gemShop.paypal.toast.sdkError'),
                accent: '#c83232',
              });
            }}
          />
        </div>

        <button
          type="button"
          className="cbtn ghost sm"
          style={{ width: '100%', marginTop: 8 }}
          onClick={onClose}
          disabled={busy}
        >
          {tStatic('gemShop.confirm.cancel')}
        </button>
      </div>
    </div>
  );
}
