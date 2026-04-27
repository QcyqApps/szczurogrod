import { useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { GameIcon } from '@/components/game-icons';
import { IcoGem, IcoRefresh } from '@/components/icons';
import { useAdminStore } from '@/api/admin-store';
import { trpc } from '@/api/trpc';
import { GEM_SINK_COSTS } from '@grodno/shared';

// Bumped manually until we wire a build-time constant via Vite's `define`.
const APP_VERSION = '0.1.0-alpha';

export interface ScreenSettingsProps {
  email: string | null;
  isGuest: boolean;
  characterName: string;
  playerGems: number;
  onBack: () => void;
  onLogout: () => void;
  onAccountDeleted: () => void;
  onEditAppearance: () => void;
  onReplayTutorial: () => void;
  onRename: (newName: string) => void;
  renamePending: boolean;
}

export function ScreenSettings({
  email,
  isGuest,
  characterName,
  playerGems,
  onBack,
  onLogout,
  onAccountDeleted,
  onEditAppearance,
  onReplayTutorial,
  onRename,
  renamePending,
}: ScreenSettingsProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [legalOpen, setLegalOpen] = useState<null | 'privacy' | 'terms'>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div
        className="panel"
        style={{
          padding: 12,
          marginBottom: 12,
          background: 'linear-gradient(180deg, #3a2a4a 0%, #2a1a3a 100%)',
          color: '#fff3e0',
          textAlign: 'center',
        }}
      >
        <div className="h-display" style={{ fontSize: 22, color: '#ffc830' }}>
          USTAWIENIA
        </div>
        <div className="flavor light" style={{ fontSize: 15, marginTop: 2 }}>
          Pokręcisz, poskrobiesz, wyjdziesz.
        </div>
      </div>

      <Section title="KONTO" icon="helmet">
        <Row label={isGuest ? 'Gość bez nazwiska' : 'Email'}>
          <span className="mono" style={{ fontSize: 14 }}>
            {isGuest ? '—' : (email ?? '—')}
          </span>
        </Row>
        <Row label="Twoja postać">
          <span className="h-title" style={{ fontSize: 14 }}>
            {characterName}
          </span>
        </Row>
        <button
          type="button"
          className="cbtn ghost sm"
          style={{ width: '100%', marginTop: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          onClick={() => {
            setNewName(characterName);
            setRenameOpen(true);
          }}
          disabled={playerGems < GEM_SINK_COSTS.renameCharacter}
          title={
            playerGems < GEM_SINK_COSTS.renameCharacter
              ? `Potrzeba ${GEM_SINK_COSTS.renameCharacter} gemów.`
              : 'Zmień imię postaci. 30-dniowy cooldown.'
          }
        >
          ZMIEŃ IMIĘ · <IcoGem s={12} /> {GEM_SINK_COSTS.renameCharacter}
        </button>
        {renameOpen && (
          <div
            onClick={() => setRenameOpen(false)}
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
              style={{ width: '100%', maxWidth: 320, background: '#f3ead9', padding: 16 }}
            >
              <div className="h-display" style={{ fontSize: 18, textAlign: 'center', marginBottom: 10 }}>
                NOWE IMIĘ
              </div>
              <input
                value={newName}
                maxLength={20}
                onChange={(e) => setNewName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '2.5px solid #2a1810',
                  borderRadius: 8,
                  background: '#fff7e0',
                  fontFamily: 'inherit',
                  marginBottom: 10,
                }}
              />
              <div style={{ fontSize: 13, color: '#5a3a2a', textAlign: 'center', marginBottom: 10 }}>
                Koszt: <IcoGem s={10} /> {GEM_SINK_COSTS.renameCharacter} · cooldown 30 dni
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="cbtn ghost sm"
                  style={{ flex: 1 }}
                  onClick={() => setRenameOpen(false)}
                >
                  ANULUJ
                </button>
                <button
                  type="button"
                  className="cbtn green sm"
                  style={{ flex: 1 }}
                  disabled={renamePending || newName.trim().length < 1 || newName.trim() === characterName}
                  onClick={() => {
                    onRename(newName.trim());
                    setRenameOpen(false);
                  }}
                >
                  ZMIEŃ
                </button>
              </div>
            </div>
          </div>
        )}
        {isGuest && (
          <div
            style={{
              fontSize: 12,
              color: '#8a3030',
              background: '#fce0e0',
              border: '2px solid #c83232',
              borderRadius: 8,
              padding: '6px 10px',
              margin: '8px 0 4px',
              lineHeight: 1.3,
            }}
          >
            <b>Uwaga gościu:</b> konto bez emaila znika razem z pamięcią
            przeglądarki. Zarejestruj się aby nie stracić postępu.
          </div>
        )}
        <button
          type="button"
          className="cbtn red"
          style={{ width: '100%', marginTop: 10 }}
          onClick={onLogout}
        >
          WYLOGUJ
        </button>
      </Section>

      <Section title="GRA" icon="dice">
        <Button onClick={onEditAppearance} iconName="spark" label="ZMIEŃ WYGLĄD" />
        <Button onClick={onReplayTutorial} iconName="scroll" label="POWTÓRZ TUTORIAL" />
      </Section>

      <Section title="ZASADY" icon="scroll">
        <Button
          onClick={() => setLegalOpen('privacy')}
          iconName="scroll"
          label="POLITYKA PRYWATNOŚCI"
        />
        <Button
          onClick={() => setLegalOpen('terms')}
          iconName="scroll"
          label="REGULAMIN"
        />
      </Section>

      <Section title="STREFA ZAGROŻENIA" icon="skull-lich">
        <div
          style={{
            fontSize: 13,
            color: '#5a3a2a',
            lineHeight: 1.35,
            marginBottom: 8,
          }}
        >
          Usunięcie konta jest <b>nieodwracalne</b>. Postać, ekwipunek, gildia,
          historia — wszystko znika. Gemy też.
        </div>
        <button
          type="button"
          className="cbtn red sm"
          style={{ width: '100%' }}
          onClick={() => setDeleteOpen(true)}
        >
          USUŃ KONTO
        </button>
      </Section>

      {legalOpen && (
        <LegalOverlay kind={legalOpen} onClose={() => setLegalOpen(null)} />
      )}

      {deleteOpen && (
        <DeleteAccountModal
          isGuest={isGuest}
          onClose={() => setDeleteOpen(false)}
          onDeleted={onAccountDeleted}
        />
      )}

      <AdminSection />

      <Section title="O GRZE" icon="crown">
        <Row label="Wersja">
          <span className="mono" style={{ fontSize: 14 }}>
            {APP_VERSION}
          </span>
        </Row>
        <Row label="Silnik">
          <span className="mono" style={{ fontSize: 14 }}>
            Szczurogród Engine v1
          </span>
        </Row>
        <div
          className="flavor"
          style={{
            fontSize: 15,
            marginTop: 10,
            color: '#5a3a2a',
            textAlign: 'center',
          }}
        >
          Zrobiono z miłości i sera.
        </div>
      </Section>

      <button
        type="button"
        className="cbtn ghost"
        style={{ width: '100%', marginTop: 4 }}
        onClick={onBack}
      >
        ← Wróć
      </button>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof GameIcon>['name'];
  children: React.ReactNode;
}) {
  return (
    <div className="panel" style={{ padding: 12, marginBottom: 12 }}>
      <div
        className="h-title"
        style={{
          fontSize: 14,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#5a3a2a',
        }}
      >
        <GameIcon name={icon} size={16} /> {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 0',
        borderBottom: '1px dashed #c8b890',
        fontSize: 14,
      }}
    >
      <span style={{ color: '#5a3a2a' }}>{label}</span>
      {children}
    </div>
  );
}

/**
 * Admin-only sekcja do reload'owania REGISTRY z bazy bez restartu serwera.
 * Gate'owana wpisanym tokenem (= env.ADMIN_TOKEN na serwerze). Token persystuje
 * w localStorage, trzeba go wpisać raz. Wywołanie idzie bezpośrednio przez
 * fetch (nie trpc client), bo endpoint używa x-admin-token header zamiast
 * Bearer JWT — osobna dimensja auth.
 */
function AdminSection() {
  const token = useAdminStore((s) => s.token);
  const setToken = useAdminStore((s) => s.setToken);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'ok'; message: string }
    | { kind: 'err'; message: string }
  >({ kind: 'idle' });

  async function doReload() {
    if (!token) return;
    setStatus({ kind: 'loading' });
    try {
      const res = await fetch('/trpc/admin.reload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        setStatus({
          kind: 'err',
          message: data?.error?.json?.message ?? `HTTP ${res.status}`,
        });
        return;
      }
      const counts = data?.result?.data?.json?.counts;
      const summary = counts
        ? `items:${counts.items} enemies:${counts.enemies} dungeons:${counts.dungeons} achievements:${counts.achievements}`
        : 'OK';
      setStatus({ kind: 'ok', message: summary });
    } catch (e) {
      setStatus({ kind: 'err', message: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <div className="panel" style={{ padding: 12, marginBottom: 12 }}>
      <div
        className="h-title"
        style={{
          fontSize: 14,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#5a3a2a',
        }}
      >
        <GameIcon name="bolt" size={16} /> ADMIN — RELOAD CONTENT
      </div>
      <div style={{ fontSize: 12, color: '#5a3a2a', marginBottom: 8, lineHeight: 1.3 }}>
        Wpisz <b>ADMIN_TOKEN</b> (z .env serwera). Przeładowuje REGISTRY po
        edycjach w DataGrip bez restartu.
      </div>
      {!token ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ADMIN_TOKEN"
            style={{
              flex: 1,
              minWidth: 0,
              padding: '6px 8px',
              border: '2.5px solid #2a1810',
              borderRadius: 6,
              fontFamily: 'inherit',
              fontSize: 13,
              background: '#fff7e0',
            }}
          />
          <button
            type="button"
            className="cbtn sm"
            disabled={!input.trim()}
            onClick={() => setToken(input)}
            style={{ fontSize: 13 }}
          >
            ZAPISZ
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: 13,
              color: '#5a3a2a',
              marginBottom: 6,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span className="mono">token: •••{token.slice(-3)}</span>
            <button
              type="button"
              onClick={() => setToken(null)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 13,
                color: '#8a3030',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              zapomnij
            </button>
          </div>
          <button
            type="button"
            className="cbtn"
            disabled={status.kind === 'loading'}
            onClick={doReload}
            style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <IcoRefresh s={16} />
            {status.kind === 'loading' ? 'ŁADUJĘ…' : 'RELOAD CONTENT'}
          </button>
        </>
      )}
      {status.kind === 'ok' && (
        <div
          className="mono"
          style={{
            fontSize: 13,
            marginTop: 6,
            padding: '6px 8px',
            borderRadius: 6,
            background: '#d6ebc0',
            color: '#2a4a3a',
            wordBreak: 'break-all',
          }}
        >
          OK · {status.message}
        </div>
      )}
      {status.kind === 'err' && (
        <div
          className="mono"
          style={{
            fontSize: 13,
            marginTop: 6,
            padding: '6px 8px',
            borderRadius: 6,
            background: '#fce0e0',
            color: '#8a3030',
            wordBreak: 'break-all',
          }}
        >
          BŁĄD · {status.message}
        </div>
      )}
    </div>
  );
}

function Button({
  onClick,
  iconName,
  label,
}: {
  onClick: () => void;
  iconName: React.ComponentProps<typeof GameIcon>['name'];
  label: string;
}) {
  return (
    <button
      type="button"
      className="cbtn"
      onClick={onClick}
      style={{
        width: '100%',
        marginTop: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <GameIcon name={iconName} size={18} /> {label}
    </button>
  );
}

const PRIVACY_TEXT = `POLITYKA PRYWATNOŚCI · Szczurogród

OSTATNIA AKTUALIZACJA: kwiecień 2026

1. KTO PRZETWARZA TWOJE DANE
Administratorem danych jest deweloper gry Szczurogród. Kontakt: support@szczurogrod.pl (placeholder — uzupełnij przed launchem).

2. JAKIE DANE ZBIERAMY
• Konto z emailem: adres email + hash hasła (argon2id, hasła nie da się odwrócić).
• Konto-gość: tylko anonimowe ID. Bez emaila.
• Stan gry: postać, ekwipunek, postępy, statystyki walk, członkostwo w gildii, czat gildii.
• Logi techniczne: czas zapytań, błędy. Bez adresu IP w logach aplikacji.

3. PO CO TO ZBIERAMY
• Identyfikacja konta i logowanie (podstawa: wykonanie umowy, art. 6 ust. 1 lit. b RODO).
• Działanie mechanik gry server-authoritative — bez tego serwer nie wie kim jesteś.
• Anty-cheat: weryfikacja, że klient nie zmienia stanu samowolnie.

4. KOMU UDOSTĘPNIAMY
Nie sprzedajemy ani nie udostępniamy danych firmom trzecim do celów marketingowych. Hosting bazy: VPS UE (placeholder — wpisz konkretną lokalizację). Dane nie wychodzą poza EOG.

5. JAK DŁUGO TRZYMAMY
Konto aktywne — bezterminowo. Po usunięciu konta przez Ciebie (Ustawienia → STREFA ZAGROŻENIA → USUŃ KONTO) Twoje dane są kasowane natychmiast z bazy produkcyjnej. Backupy są nadpisywane w cyklu 30 dni.

6. TWOJE PRAWA (RODO)
• Prawo dostępu do danych — napisz na support, wyślemy export.
• Prawo do sprostowania — możesz zmienić email/hasło/imię postaci w grze.
• Prawo do usunięcia („prawo do bycia zapomnianym") — Ustawienia → USUŃ KONTO. Realizowane natychmiastowo, bez kosztu.
• Prawo do ograniczenia / sprzeciwu — napisz na support.
• Prawo do skargi do Prezesa UODO (uodo.gov.pl).

7. CIASTECZKA / LOCALSTORAGE
Używamy localStorage do przechowywania tokenów sesji (access + refresh JWT). Bez tego musiałbyś logować się przy każdym otwarciu. Brak ciasteczek śledzących.

8. DZIECI
Gra nie jest skierowana do osób poniżej 13 roku życia (COPPA). Nie zbieramy świadomie ich danych.

9. ZMIANY
Gdy zmienimy tę politykę, zobaczysz nowy banner przy logowaniu. Stara wersja zostaje w archiwum (link na żądanie).
`;

const TERMS_TEXT = `REGULAMIN · Szczurogród

OSTATNIA AKTUALIZACJA: kwiecień 2026

1. POSTANOWIENIA OGÓLNE
Gra Szczurogród (dalej: „gra") jest dostarczana „tak jak jest". Korzystając z niej akceptujesz ten regulamin.

2. KONTO
• Możesz założyć konto z emailem albo grać jako gość.
• Konto-gość znika razem z pamięcią przeglądarki — żadnej gwarancji odzyskania postępu.
• Jedno konto = jedna postać.
• Zakaz udostępniania konta osobom trzecim.

3. ZASADY GRY
• Zabronione: cheaty, exploity, modyfikowanie klienta, automatyzacja (boty, makra, skrypty).
• Zabronione: kupowanie/sprzedawanie kont, gemów, przedmiotów za prawdziwą walutę poza oficjalnymi kanałami.
• Zabronione w czacie gildii: spam, mowa nienawiści, doxing, treści nielegalne.

4. SANKCJE
Naruszenie zasad = ban czasowy lub permanentny. W skrajnych przypadkach (cheating, oszustwa płatnicze) konto kasowane bez zwrotu wpłat.

5. PŁATNOŚCI (gemy / season pass)
• Gemy są walutą wirtualną. Nie podlegają zwrotowi po wydaniu w grze.
• Premium Season Pass jest sezonowy — kupujesz dostęp do drugiego tracka nagród. Po sezonie premium-only nagrody przepadają (free tier zostaje).
• Płatności obsługuje Google Play (kanał mobilny) lub Stripe (web — placeholder).
• Reklamacje: support@szczurogrod.pl w ciągu 14 dni od transakcji.

6. ODPOWIEDZIALNOŚĆ
Gra jest udostępniana bezpłatnie. Nie odpowiadamy za:
• Przerwy w działaniu serwera (planowane lub awaryjne).
• Utratę progresu konta-gościa po wyczyszczeniu pamięci przeglądarki.
• Decyzje gracza (sprzedaż uniqua, brak healera przed bossem).

7. WŁASNOŚĆ INTELEKTUALNA
Wszystkie grafiki, teksty, kod, mechaniki gry są chronione prawem autorskim. Zakazane: kopiowanie assetów do innych projektów.

8. ZAKOŃCZENIE USŁUGI
Możemy zakończyć działanie gry z 30-dniowym wyprzedzeniem (banner w grze). Po wygaszeniu serwerów konta przestają działać; dane są kasowane.

9. ROZSTRZYGANIE SPORÓW
Prawo polskie. Sąd właściwy: miejsce siedziby konsumenta. Pierwsza droga: support@szczurogrod.pl.

10. KONTAKT
support@szczurogrod.pl (placeholder — uzupełnij przed launchem)
`;

function LegalOverlay({
  kind,
  onClose,
}: {
  kind: 'privacy' | 'terms';
  onClose: () => void;
}) {
  const text = kind === 'privacy' ? PRIVACY_TEXT : TERMS_TEXT;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 240,
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
          maxWidth: 420,
          maxHeight: '80vh',
          background: '#f3ead9',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            fontFamily: 'inherit',
            whiteSpace: 'pre-wrap',
            fontSize: 13,
            lineHeight: 1.45,
            color: '#2a1810',
            overflowY: 'auto',
            flex: 1,
            paddingRight: 4,
          }}
        >
          {text}
        </div>
        <button
          type="button"
          className="cbtn ghost sm"
          style={{ width: '100%', marginTop: 10 }}
          onClick={onClose}
        >
          ZAMKNIJ
        </button>
      </div>
    </div>
  );
}

function DeleteAccountModal({
  isGuest,
  onClose,
  onDeleted,
}: {
  isGuest: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const deleteMut = trpc.me.deleteAccount.useMutation({
    onSuccess: () => onDeleted(),
    onError: (e) => {
      setErr(
        e instanceof TRPCClientError
          ? e.message
          : 'Coś poszło nie tak. Spróbuj ponownie.',
      );
    },
  });
  const ready = confirm === 'USUŃ' && (isGuest || password.length > 0);
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 240,
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
        style={{ width: '100%', maxWidth: 360, background: '#f3ead9', padding: 16 }}
      >
        <div
          className="h-display"
          style={{ fontSize: 18, textAlign: 'center', marginBottom: 8, color: '#8a3030' }}
        >
          USUWASZ KONTO
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#2a1810',
            lineHeight: 1.4,
            background: '#fce0e0',
            border: '2px solid #c83232',
            borderRadius: 8,
            padding: '8px 10px',
            marginBottom: 12,
          }}
        >
          Postać, ekwipunek, gemy, gildia, historia walk — znikną. Nie da się
          tego cofnąć. Jeśli prowadzisz gildię, najpierw przekaż przywództwo.
        </div>
        {!isGuest && (
          <>
            <div style={{ fontSize: 13, color: '#5a3a2a', marginBottom: 4 }}>
              Hasło:
            </div>
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '2.5px solid #2a1810',
                borderRadius: 8,
                background: '#fff7e0',
                fontFamily: 'inherit',
                marginBottom: 10,
                boxSizing: 'border-box',
              }}
            />
          </>
        )}
        <div style={{ fontSize: 13, color: '#5a3a2a', marginBottom: 4 }}>
          Wpisz <b>USUŃ</b> żeby potwierdzić:
        </div>
        <input
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="USUŃ"
          style={{
            width: '100%',
            padding: '8px 10px',
            border: '2.5px solid #2a1810',
            borderRadius: 8,
            background: '#fff7e0',
            fontFamily: 'inherit',
            marginBottom: 10,
            boxSizing: 'border-box',
          }}
        />
        {err && (
          <div
            style={{
              fontSize: 13,
              color: '#8a3030',
              background: '#fce0e0',
              borderRadius: 6,
              padding: '6px 8px',
              marginBottom: 10,
            }}
          >
            {err}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="cbtn ghost sm"
            style={{ flex: 1 }}
            onClick={onClose}
            disabled={deleteMut.isPending}
          >
            ANULUJ
          </button>
          <button
            type="button"
            className="cbtn red sm"
            style={{ flex: 1 }}
            disabled={!ready || deleteMut.isPending}
            onClick={() => {
              setErr(null);
              deleteMut.mutate({
                confirm: 'USUŃ',
                password: isGuest ? undefined : password,
              });
            }}
          >
            {deleteMut.isPending ? 'KASUJĘ…' : 'USUŃ KONTO'}
          </button>
        </div>
      </div>
    </div>
  );
}
