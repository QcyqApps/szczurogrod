import { useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { GameIcon } from '@/components/game-icons';
import { IcoGem, IcoRefresh } from '@/components/icons';
import { useAdminStore } from '@/api/admin-store';
import { useAuthStore } from '@/api/auth-store';
import { useToastQueue } from '@/api/toast-queue-store';
import { trpc } from '@/api/trpc';
import { getSurvivorUrl } from '@/api/survivor-url';
import { useT, tStatic } from '@/i18n';
import { LangPicker } from '@/i18n/LangPicker';
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
  const t = useT();
  const utils = trpc.useUtils();
  const setTokens = useAuthStore((s) => s.setTokens);
  const pushToast = useToastQueue((s) => s.push);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [legalOpen, setLegalOpen] = useState<null | 'privacy' | 'terms'>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const linkMut = trpc.auth.linkAccount.useMutation({
    onSuccess: (data) => {
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        userId: data.userId,
        email: data.email,
        isGuest: data.isGuest,
      });
      pushToast({ text: tStatic('settings.guest.linkToast.success'), accent: '#2a4a3a' });
      setLinkOpen(false);
      setLinkEmail('');
      setLinkPassword('');
      void utils.me.get.invalidate();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : 'Nie udało się.',
        accent: '#c83232',
      });
    },
  });
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
          {t('settings.heading')}
        </div>
        <div className="flavor light" style={{ fontSize: 15, marginTop: 2 }}>
          {t('settings.flavor')}
        </div>
      </div>

      <Section title={t('settings.section.lang')} icon="scroll">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ color: '#5a3a2a', fontSize: 14 }}>{t('settings.lang.heading')}</span>
          <LangPicker size="sm" />
        </div>
      </Section>

      <Section title={t('settings.section.account')} icon="helmet">
        <Row label={isGuest ? t('settings.guest.label') : t('settings.email')}>
          <span className="mono" style={{ fontSize: 14 }}>
            {isGuest ? '—' : (email ?? '—')}
          </span>
        </Row>
        <Row label={t('settings.character')}>
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
              ? t('settings.rename.title.notEnough').replace('{n}', String(GEM_SINK_COSTS.renameCharacter))
              : t('settings.rename.title')
          }
        >
          {t('settings.rename.btn')} · <IcoGem s={12} /> {GEM_SINK_COSTS.renameCharacter}
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
                {t('settings.rename.heading')}
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
                {t('settings.rename.cost')}<IcoGem s={10} /> {GEM_SINK_COSTS.renameCharacter}{t('settings.rename.cooldown')}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="cbtn ghost sm"
                  style={{ flex: 1 }}
                  onClick={() => setRenameOpen(false)}
                >
                  {t('settings.btn.cancel')}
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
                  {t('settings.btn.change')}
                </button>
              </div>
            </div>
          </div>
        )}
        {isGuest && (
          <>
            <div
              style={{
                fontSize: 12,
                color: '#8a3030',
                background: '#fce0e0',
                border: '2px solid #c83232',
                borderRadius: 8,
                padding: '6px 10px',
                margin: '8px 0 6px',
                lineHeight: 1.3,
              }}
            >
              <b>{t('settings.guest.warningPrefix')}</b> {t('settings.guest.warning')}
            </div>
            <button
              type="button"
              className="cbtn green"
              style={{ width: '100%', marginBottom: 4 }}
              onClick={() => setLinkOpen(true)}
            >
              {t('settings.guest.linkBtn')}
            </button>
          </>
        )}
        {linkOpen && (
          <div
            onClick={() => !linkMut.isPending && setLinkOpen(false)}
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
              style={{ width: '100%', maxWidth: 340, background: '#f3ead9', padding: 16 }}
            >
              <div className="h-display" style={{ fontSize: 18, textAlign: 'center', marginBottom: 6 }}>
                {t('settings.guest.linkModal.title')}
              </div>
              <div
                className="flavor"
                style={{
                  fontSize: 14,
                  color: '#5a3a2a',
                  textAlign: 'center',
                  marginBottom: 12,
                }}
              >
                {t('settings.guest.linkModal.body')}
              </div>
              <label
                className="h-title"
                style={{ fontSize: 12, color: '#2a1810', display: 'block', marginBottom: 4 }}
              >
                {t('settings.guest.linkModal.email')}
              </label>
              <input
                type="email"
                autoComplete="email"
                value={linkEmail}
                maxLength={254}
                onChange={(e) => setLinkEmail(e.target.value)}
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
              <label
                className="h-title"
                style={{ fontSize: 12, color: '#2a1810', display: 'block', marginBottom: 4 }}
              >
                {t('settings.guest.linkModal.password')}
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={linkPassword}
                maxLength={200}
                onChange={(e) => setLinkPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '2.5px solid #2a1810',
                  borderRadius: 8,
                  background: '#fff7e0',
                  fontFamily: 'inherit',
                  marginBottom: 12,
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="cbtn ghost sm"
                  style={{ flex: 1 }}
                  disabled={linkMut.isPending}
                  onClick={() => setLinkOpen(false)}
                >
                  {t('settings.btn.cancel')}
                </button>
                <button
                  type="button"
                  className="cbtn green sm"
                  style={{ flex: 1.4 }}
                  disabled={
                    linkMut.isPending ||
                    !linkEmail.includes('@') ||
                    linkPassword.length < 5
                  }
                  onClick={() =>
                    linkMut.mutate({
                      email: linkEmail.trim(),
                      password: linkPassword,
                    })
                  }
                >
                  {t('settings.guest.linkModal.submit')}
                </button>
              </div>
            </div>
          </div>
        )}
        <button
          type="button"
          className="cbtn red"
          style={{ width: '100%', marginTop: 10 }}
          onClick={onLogout}
        >
          {t('settings.logout')}
        </button>
      </Section>

      <Section title={t('settings.section.game')} icon="dice">
        <Button onClick={onEditAppearance} iconName="spark" label={t('settings.btn.editAppearance')} />
        <Button onClick={onReplayTutorial} iconName="scroll" label={t('settings.btn.replayTutorial')} />
      </Section>

      <Section title={t('settings.section.community')} icon="megaphone">
        <Button
          onClick={() => {
            window.open('https://discord.gg/uk3cCeNKxf', '_blank', 'noopener');
          }}
          iconName="megaphone"
          label={t('settings.btn.discord')}
        />
      </Section>

      <Section title={t('settings.section.othergames')} icon="bolt">
        <Button
          onClick={() => {
            window.open(getSurvivorUrl(), '_blank', 'noopener');
          }}
          iconName="bolt"
          label={t('settings.btn.survivor')}
        />
      </Section>

      <Section title={t('settings.section.legal')} icon="scroll">
        <Button
          onClick={() => setLegalOpen('privacy')}
          iconName="scroll"
          label={t('settings.btn.privacy')}
        />
        <Button
          onClick={() => setLegalOpen('terms')}
          iconName="scroll"
          label={t('settings.btn.terms')}
        />
      </Section>

      <Section title={t('settings.section.danger')} icon="skull-lich">
        <div
          style={{
            fontSize: 13,
            color: '#5a3a2a',
            lineHeight: 1.35,
            marginBottom: 8,
          }}
        >
          {t('settings.danger.body.before')}<b>{t('settings.danger.body.bold')}</b>{t('settings.danger.body.after')}
        </div>
        <button
          type="button"
          className="cbtn red sm"
          style={{ width: '100%' }}
          onClick={() => setDeleteOpen(true)}
        >
          {t('settings.deleteAccount')}
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

      <Section title={t('settings.section.about')} icon="crown">
        <Row label={t('settings.about.version')}>
          <span className="mono" style={{ fontSize: 14 }}>
            {APP_VERSION}
          </span>
        </Row>
        <Row label={t('settings.about.engine')}>
          <span className="mono" style={{ fontSize: 14 }}>
            Ratburg Engine v1
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
          {t('settings.about.flavor')}
        </div>
      </Section>

      <button
        type="button"
        className="cbtn ghost"
        style={{ width: '100%', marginTop: 4 }}
        onClick={onBack}
      >
        {t('settings.back')}
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
  const t = useT();
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
        <GameIcon name="bolt" size={16} /> {t('settings.admin.title')}
      </div>
      <div style={{ fontSize: 12, color: '#5a3a2a', marginBottom: 8, lineHeight: 1.3 }}>
        {t('settings.admin.body.prefix')}<b>ADMIN_TOKEN</b> {t('settings.admin.body')}
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
            {t('settings.admin.save')}
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
              {t('settings.admin.forget')}
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
            {status.kind === 'loading' ? t('settings.admin.loading') : t('settings.admin.reload')}
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
          {t('settings.admin.err')}{status.message}
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

function LegalOverlay({
  kind,
  onClose,
}: {
  kind: 'privacy' | 'terms';
  onClose: () => void;
}) {
  const t = useT();
  const text = kind === 'privacy' ? t('settings.legal.privacy') : t('settings.legal.terms');
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
          {t('settings.legal.close')}
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
  const t = useT();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const confirmKeyword = t('settings.delete.confirmKeyword');
  const deleteMut = trpc.me.deleteAccount.useMutation({
    onSuccess: () => onDeleted(),
    onError: (e) => {
      setErr(
        e instanceof TRPCClientError ? e.message : t('settings.delete.errFallback'),
      );
    },
  });
  const ready = confirm.toUpperCase() === confirmKeyword && (isGuest || password.length > 0);
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
          {t('settings.delete.heading')}
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
          {t('settings.delete.warning')}
        </div>
        {!isGuest && (
          <>
            <div style={{ fontSize: 13, color: '#5a3a2a', marginBottom: 4 }}>
              {t('settings.delete.password')}
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
          {t('settings.delete.confirmAsk')}<b>{confirmKeyword}</b>{t('settings.delete.confirmAsk.suffix')}
        </div>
        <input
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={confirmKeyword}
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
            {t('settings.btn.cancel')}
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
            {deleteMut.isPending ? t('settings.delete.deleting') : t('settings.deleteAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}
