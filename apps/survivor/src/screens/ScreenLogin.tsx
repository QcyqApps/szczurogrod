// Login screen — guest-only for now. Mirrors the survivor app's only auth
// flow at this stage; email/password reuse will land when survivor exposes
// its own register/login forms (or simply punt to apps/web for that).

import { useState } from 'react';
import { trpc } from '@/api/trpc';
import { useAuthStore } from '@/api/auth-store';
import { useT } from '@/i18n';
import { LangPicker } from '@/i18n/LangPicker';

export function ScreenLogin() {
  const t = useT();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [error, setError] = useState<string | null>(null);

  const guestMutation = trpc.auth.guest.useMutation({
    onSuccess: (data) => {
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        userId: data.userId,
        email: data.email,
        isGuest: data.isGuest,
      });
    },
    onError: (err) => setError(err.message),
  });

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 24,
        textAlign: 'center',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <LangPicker />
      </div>

      <h1 className="h-display" style={{ fontSize: 38, margin: 0, color: 'var(--ink-dark)' }}>
        {t('login.title')}
      </h1>
      <h2
        className="h-display"
        style={{
          fontSize: 28,
          margin: 0,
          color: 'var(--okruchy)',
          letterSpacing: 2,
        }}
      >
        {t('login.subtitle')}
      </h2>
      <p className="flavor" style={{ fontSize: 18, maxWidth: 360, margin: 0 }}>
        {t('login.flavor')}
      </p>

      <button
        type="button"
        className="cbtn"
        disabled={guestMutation.isPending}
        onClick={() => {
          setError(null);
          guestMutation.mutate();
        }}
      >
        {guestMutation.isPending ? t('login.wait') : t('login.guest')}
      </button>

      {error && (
        <div className="flavor" style={{ color: 'var(--danger)', fontSize: 16 }}>
          {error}
        </div>
      )}

      <div
        className="flavor"
        style={{ fontSize: 14, color: 'var(--ink-warm)', marginTop: 32 }}
      >
        {t('login.scaffold.note')}
      </div>
    </div>
  );
}
