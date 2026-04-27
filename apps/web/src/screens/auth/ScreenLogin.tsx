import { useEffect, useState } from 'react';
import { GrodnoNightBackdrop } from './NightBackdrop';

type Mode = 'login' | 'register';

/**
 * Opt-in persystencja pary email+hasło tylko do pre-wypełnienia inputów po
 * powrocie na ekran. Aktywowane przez checkbox „Zapamiętaj mnie"; odznaczenie
 * + submit kasuje zapis. Trzymane w localStorage osobno od auth tokenów (inny
 * klucz, inny cykl życia — logout nie czyści remember'a, zmiana checkboxa tak).
 *
 * Plaintext hasła w localStorage jest znaną słabością tego wzorca — użytkownik
 * explicite tego chciał, więc zostaje. Nie używać tej logiki do niczego poza
 * inputem formularza logowania.
 */
const REMEMBER_STORAGE_KEY = 'grodno-login-remember';

interface RememberedLogin {
  email: string;
  password: string;
}

function loadRemembered(): RememberedLogin | null {
  try {
    const raw = localStorage.getItem(REMEMBER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'email' in parsed &&
      'password' in parsed &&
      typeof (parsed as RememberedLogin).email === 'string' &&
      typeof (parsed as RememberedLogin).password === 'string'
    ) {
      return parsed as RememberedLogin;
    }
  } catch {
    // Malformed payload → zachowujemy się jak brak zapisu.
  }
  return null;
}

function saveRemembered(data: RememberedLogin): void {
  try {
    localStorage.setItem(REMEMBER_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // QuotaExceeded / disabled storage — cichy fallback, user zaloguje się normalnie.
  }
}

function clearRemembered(): void {
  try {
    localStorage.removeItem(REMEMBER_STORAGE_KEY);
  } catch {
    // noop
  }
}

export interface LoginPayload {
  email: string;
  password: string;
  isNew: boolean;
}

export interface ScreenLoginProps {
  onLogin: (payload: LoginPayload) => Promise<void> | void;
  onGuest: () => Promise<void> | void;
}

function LoginField({
  label,
  value,
  onChange,
  type,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: 'email' | 'password';
  placeholder: string;
}) {
  return (
    <label style={{ display: 'block' }}>
      <div
        style={{
          fontFamily: 'Luckiest Guy, sans-serif',
          fontSize: 13,
          letterSpacing: 0.6,
          color: '#5a3a2a',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: '#fff3e0',
          border: '2.5px solid #2a1810',
          borderRadius: 10,
          padding: '10px 12px',
          fontFamily: "'Patrick Hand', 'Comic Sans MS', sans-serif",
          fontSize: 16,
          color: '#2a1810',
          outline: 'none',
          boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.06)',
        }}
      />
    </label>
  );
}

export function ScreenLogin({ onLogin, onGuest }: ScreenLoginProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  // Remember = stan checkboxa + warunek zapisu. Hydratujemy raz na mount —
  // jeśli mamy zapis, ustawiamy pola i checkbox. Zmiana checkboxa w locie
  // NIE kasuje pól od razu; kasowanie leci dopiero przy submit (intencja:
  // „od teraz nie pamiętaj").
  const [remember, setRemember] = useState(false);
  useEffect(() => {
    const stored = loadRemembered();
    if (stored) {
      setEmail(stored.email);
      setPw(stored.password);
      setRemember(true);
    }
  }, []);

  async function submit() {
    setErr('');
    if (!email.includes('@')) {
      setErr('Wprowadź poprawny email');
      return;
    }
    if (mode === 'register' && pw.length < 5) {
      setErr('Hasło min. 5 znaków');
      return;
    }
    if (mode === 'login' && pw.length < 1) {
      setErr('Wprowadź hasło');
      return;
    }
    if (mode === 'register' && pw !== pw2) {
      setErr('Hasła się różnią');
      return;
    }
    setBusy(true);
    try {
      await onLogin({ email, password: pw, isNew: mode === 'register' });
      // Zapisz / wyczyść dopiero po udanym submicie — błędne creds nie zostają
      // w storage, a odznaczenie checkboxa przed kliknięciem „ZALOGUJ"
      // faktycznie kasuje poprzedni zapis.
      if (remember) {
        saveRemembered({ email, password: pw });
      } else {
        clearRemembered();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Błąd logowania');
    } finally {
      setBusy(false);
    }
  }

  async function submitGuest() {
    setErr('');
    setBusy(true);
    try {
      await onGuest();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Nie udało się');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <GrodnoNightBackdrop />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '80px 22px 26px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            className="h-display"
            style={{
              fontSize: 36,
              color: '#ffc830',
              lineHeight: 1,
              textShadow:
                '3px 3px 0 #2a1810, -2px 2px 0 #2a1810, 2px -2px 0 #2a1810, -2px -2px 0 #2a1810',
              letterSpacing: 1,
            }}
          >
            SZCZUROGRÓD
          </div>
          <div
            className="h-title"
            style={{
              fontSize: 14,
              color: '#fff3e0',
              letterSpacing: 3,
              marginTop: 2,
              opacity: 0.9,
            }}
          >
            IDLE RPG
          </div>
        </div>

        <div
          className="panel"
          style={{
            background: '#f3ead9',
            padding: 18,
            marginTop: 'auto',
            animation: 'card-slide 0.5s ease-out',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 4,
              background: '#e8dcb9',
              border: '2.5px solid #2a1810',
              borderRadius: 10,
              padding: 3,
              marginBottom: 14,
            }}
          >
            {(['login', 'register'] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => {
                  setMode(m);
                  setErr('');
                }}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  fontFamily: 'Luckiest Guy, sans-serif',
                  letterSpacing: 0.6,
                  fontSize: 14,
                  border: 0,
                  cursor: 'pointer',
                  borderRadius: 7,
                  background: mode === m ? '#d4a24c' : 'transparent',
                  color: '#2a1810',
                  boxShadow: mode === m ? 'inset 2px 2px 0 rgba(0,0,0,0.15)' : 'none',
                }}
              >
                {m === 'login' ? 'LOGOWANIE' : 'REJESTRACJA'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <LoginField
              label="EMAIL"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="rycerz@grodno.pl"
            />
            <LoginField
              label="HASŁO"
              value={pw}
              onChange={setPw}
              type="password"
              placeholder="••••••"
            />
            {mode === 'register' && (
              <LoginField
                label="POWTÓRZ HASŁO"
                value={pw2}
                onChange={setPw2}
                type="password"
                placeholder="••••••"
              />
            )}

            {err && (
              <div
                style={{
                  background: '#fce0e0',
                  border: '2px solid #c83232',
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontSize: 14,
                  color: '#8a2020',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ fontFamily: 'Luckiest Guy' }}>!</span> {err}
              </div>
            )}

            {mode === 'login' && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 12,
                }}
              >
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    color: '#2a1810',
                    userSelect: 'none',
                  }}
                  title="Email i hasło zostaną zapisane w tej przeglądarce, żeby wrócić prosto do inputów."
                >
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    style={{
                      width: 16,
                      height: 16,
                      accentColor: '#d4a24c',
                      cursor: 'pointer',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'Luckiest Guy, sans-serif',
                      letterSpacing: 0.5,
                      fontSize: 12,
                    }}
                  >
                    ZAPAMIĘTAJ MNIE
                  </span>
                </label>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  style={{ color: '#5a3a2a', textDecoration: 'underline' }}
                >
                  Zapomniałeś hasła?
                </a>
              </div>
            )}

            <button
              type="button"
              className="cbtn green lg"
              style={{ width: '100%', opacity: busy ? 0.7 : 1 }}
              disabled={busy}
              onClick={submit}
            >
              {busy ? 'CHWILA...' : mode === 'login' ? 'ZALOGUJ' : 'UTWÓRZ KONTO'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
              <div style={{ flex: 1, height: 2, background: '#c8b898' }} />
              <div
                style={{
                  fontSize: 13,
                  color: '#7a5a4a',
                  fontFamily: 'Luckiest Guy',
                  letterSpacing: 1,
                }}
              >
                LUB
              </div>
              <div style={{ flex: 1, height: 2, background: '#c8b898' }} />
            </div>

            <button
              type="button"
              className="cbtn ghost"
              style={{ width: '100%' }}
              onClick={submitGuest}
              disabled={busy}
            >
              GRAJ JAKO GOŚĆ
            </button>

            <div
              style={{
                fontSize: 13,
                color: '#7a5a4a',
                textAlign: 'center',
                lineHeight: 1.3,
                marginTop: 4,
              }}
            >
              {mode === 'register'
                ? 'Rejestrując się akceptujesz Regulamin i Politykę Prywatności'
                : 'Postęp gościa można utracić. Zarejestruj się aby zapisać!'}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes card-slide {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
