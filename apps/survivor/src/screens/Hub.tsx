// Hub — meta-progression home. Landscape 3-kolumnowy layout (telefon w
// poziomie):
//
//   ┌─ HEADER (lewa) ──┐ ┌─ ETAPY / TOP 10 (środek) ──┐ ┌─ DRZEWKO (prawa) ──┐
//   │ tytuł + flavor   │ │ tabs: stages | leaderboard │ │ kompaktowe skille  │
//   │ stat-pills       │ │ aktywna lista              │ │ scroll wewn.       │
//   │ sister-game link │ │                            │ │                    │
//   │ logout           │ │                            │ │                    │
//   └──────────────────┘ └────────────────────────────┘ └────────────────────┘
//
// Brak outer-scroll — wszystko mieści się w 920×460 ramce, tylko drzewko
// skilli i tabela leaderboardu mają scroll wewnętrzny gdy lista urośnie.
// Stary single-column layout wymagał 1500+px wysokości i był ciężki do
// czytania na landscape phone.

import { useState } from 'react';
import { trpc } from '@/api/trpc';
import { useAuthStore } from '@/api/auth-store';
import { STAGE_DEFS, type StageDef } from '@grodno/shared/survivor';
import { useT, type DictKey } from '@/i18n';
import { HelpIcon } from '@/components/HelpIcon';
import { LeaderboardPanel } from './Leaderboard';
import { SkillTree } from './SkillTree';

type CenterTab = 'stages' | 'leaderboard';

export interface HubProps {
  onStartRun: (stageId: number) => void;
}

export function Hub({ onStartRun }: HubProps) {
  const t = useT();
  const clear = useAuthStore((s) => s.clear);
  const isGuest = useAuthStore((s) => s.isGuest);
  const hubQuery = trpc.survivor.getHub.useQuery();
  const [centerTab, setCenterTab] = useState<CenterTab>('stages');

  const meta = hubQuery.data?.meta;
  const maxUnlocked = meta?.maxStageUnlocked ?? 1;

  return (
    <div
      style={{
        height: '100%',
        minHeight: '100%',
        display: 'grid',
        // Landscape 3-col grid. Lewa wąska (stats), środek elastyczny
        // (gameplay CTA), prawa szersza (drzewko z dłuższymi opisami).
        // Min-widths zapewniają że nawet na małym landscape phone'ie
        // (~720×360) layout się nie rozjedzie.
        gridTemplateColumns: 'minmax(190px, 220px) minmax(240px, 1fr) minmax(280px, 360px)',
        gap: 10,
        padding: 12,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ===== Lewa kolumna: branding + stats + sister + logout ===== */}
      <aside
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 0,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 className="h-display" style={{ fontSize: 22, margin: 0, lineHeight: 1, flex: 1 }}>
              {t('hub.title')}
            </h1>
            <HelpIcon
              title={t('hub.help.title')}
              ariaLabel={t('hub.help.title')}
              size={20}
            >
              <HelpSection
                heading={t('hub.help.body.goal.title')}
                text={t('hub.help.body.goal.text')}
              />
              <HelpSection
                heading={t('hub.help.body.controls.title')}
                text={t('hub.help.body.controls.text')}
              />
              <HelpSection
                heading={t('hub.help.body.economy.title')}
                text={t('hub.help.body.economy.text')}
              />
              <HelpSection
                heading={t('hub.help.body.idle.title')}
                text={t('hub.help.body.idle.text')}
              />
              <HelpSection
                heading={t('hub.help.body.tip.title')}
                text={t('hub.help.body.tip.text')}
                last
              />
            </HelpIcon>
          </div>
          <div
            className="flavor"
            style={{ fontSize: 13, color: 'var(--ink-mid)', lineHeight: 1.2, marginTop: 2 }}
          >
            {t('hub.flavor')}
          </div>
        </div>

        <div
          className="panel"
          style={{
            padding: 8,
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 4,
          }}
        >
          <StatRow
            label={t('hub.stat.okruchy')}
            value={meta?.okruchy ?? '—'}
            color="var(--okruchy)"
          />
          <StatRow label={t('hub.stat.runs')} value={meta?.totalRuns ?? '—'} />
          <StatRow label={t('hub.stat.kills')} value={meta?.totalKills ?? '—'} />
        </div>

        {hubQuery.data && <IdleXpBar idleXp={hubQuery.data.idleXp} />}

        <SisterGameLink />

        <button
          type="button"
          onClick={clear}
          style={{
            marginTop: 'auto',
            background: 'transparent',
            border: 'none',
            color: 'var(--ink-warm)',
            fontFamily: 'inherit',
            fontSize: 12,
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          {isGuest ? t('hub.logout.guest') : t('hub.logout.user')}
        </button>
      </aside>

      {/* ===== Środkowa kolumna: tabs ETAPY / TOP 10 ===== */}
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          <TabButton
            active={centerTab === 'stages'}
            onClick={() => setCenterTab('stages')}
          >
            {t('hub.tab.stages')}
          </TabButton>
          <TabButton
            active={centerTab === 'leaderboard'}
            onClick={() => setCenterTab('leaderboard')}
          >
            {t('leaderboard.title')}
          </TabButton>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingRight: 4,
          }}
        >
          {centerTab === 'stages' &&
            STAGE_DEFS.map((stage) => (
              <StageCard
                key={stage.id}
                stage={stage}
                unlocked={stage.id <= maxUnlocked}
                cleared={stage.id < maxUnlocked}
                onPlay={() => onStartRun(stage.id)}
              />
            ))}
          {centerTab === 'leaderboard' && <LeaderboardPanel />}
        </div>
      </main>

      {/* ===== Prawa kolumna: drzewko skilli ===== */}
      <section
        style={{
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {hubQuery.data && (
          <SkillTree
            okruchy={hubQuery.data.meta.okruchy}
            progression={hubQuery.data.skillProgression}
          />
        )}
      </section>
    </div>
  );
}

type HubIdleXp =
  | { available: false }
  | {
      available: true;
      barFill: number;
      barThreshold: number;
      nextPackageXp: number;
      pendingGrantsCount: number;
      pendingGrantsXpTotal: number;
      idleLvl: number;
    };

/** Pasek progresji do idle XP. Pokazuje fill / threshold + preview kolejnej
 * paczki. Gdy są pending grants, panel zmienia się w "PACZKI CZEKAJĄ" CTA
 * z gentle pulse — gracz wie żeby wrócił do idle game'a po claim. Dla
 * usera bez character'a w idle: hint "Stwórz postać w Szczurogrodzie aby
 * zbierać XP". */
function IdleXpBar({ idleXp }: { idleXp: HubIdleXp }) {
  const t = useT();
  if (!idleXp.available) {
    return (
      <div
        className="panel"
        style={{
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <div className="h-display" style={{ fontSize: 12, letterSpacing: 0.5 }}>
          {t('hub.idleXp.title')}
        </div>
        <div className="flavor" style={{ fontSize: 14, color: 'var(--ink-mid)', lineHeight: 1.2 }}>
          {t('hub.idleXp.noChar')}
        </div>
      </div>
    );
  }
  const { barFill, barThreshold, nextPackageXp, pendingGrantsCount, pendingGrantsXpTotal, idleLvl } = idleXp;
  const fillPct = Math.min(100, (barFill / barThreshold) * 100);
  const hasPending = pendingGrantsCount > 0;
  return (
    <div
      className={`panel${hasPending ? ' boss-warning-pulse' : ''}`}
      style={{
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        background: hasPending
          ? 'linear-gradient(180deg, #ffd76a 0%, #d4a24c 100%)'
          : 'var(--parchment-mid)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 4,
        }}
      >
        <span className="h-display" style={{ fontSize: 12, letterSpacing: 0.5 }}>
          {t('hub.idleXp.title')}
        </span>
        <span style={{ fontSize: 11, color: 'var(--ink-warm)' }}>
          L{idleLvl}
        </span>
      </div>
      {hasPending ? (
        <div className="flavor" style={{ fontSize: 14, color: 'var(--ink-dark)', lineHeight: 1.15 }}>
          {t('hub.idleXp.pending')
            .replace('{count}', String(pendingGrantsCount))
            .replace('{xp}', String(pendingGrantsXpTotal))}
        </div>
      ) : (
        <>
          <div
            style={{
              height: 7,
              background: 'rgba(42, 24, 16, 0.18)',
              border: '1.5px solid var(--ink-dark)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${fillPct}%`,
                height: '100%',
                background: 'linear-gradient(180deg, var(--gold-light), var(--gold))',
                transition: 'width 200ms ease',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: 'var(--ink-mid)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span>{barFill} / {barThreshold}</span>
            <span>+{nextPackageXp} XP</span>
          </div>
        </>
      )}
    </div>
  );
}

function HelpSection({
  heading,
  text,
  last,
}: {
  heading: string;
  text: string;
  last?: boolean;
}) {
  return (
    <div style={{ marginBottom: last ? 0 : 10 }}>
      <div className="h-display" style={{ fontSize: 13, letterSpacing: 0.5, marginBottom: 2 }}>
        {heading}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.4, color: 'var(--ink-dark)' }}>
        {text}
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 4,
        fontSize: 12,
      }}
    >
      <span style={{ color: 'var(--ink-mid)', whiteSpace: 'nowrap' }}>{label}</span>
      <span
        className="h-display"
        style={{
          fontSize: 16,
          color: color ?? 'var(--ink-dark)',
          letterSpacing: 0.5,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-display"
      style={{
        flex: 1,
        padding: '6px 8px',
        background: active ? 'var(--ink-dark)' : 'var(--parchment-mid)',
        color: active ? 'var(--parchment-bg)' : 'var(--ink-dark)',
        border: '2.5px solid var(--ink-dark)',
        borderRadius: 8,
        fontFamily: 'inherit',
        fontSize: 13,
        letterSpacing: 0.5,
        cursor: 'pointer',
        boxShadow: active ? '2px 2px 0 var(--ink-dark)' : 'none',
        transition: 'all 80ms ease',
      }}
    >
      {children}
    </button>
  );
}

function SisterGameLink() {
  const t = useT();
  const url =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname.startsWith('192.168.'))
      ? `${window.location.protocol}//${window.location.hostname}:5173`
      : 'https://ratburg.com';
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      className="panel"
      style={{
        textDecoration: 'none',
        padding: 8,
        background: 'linear-gradient(180deg, #ffd76a 0%, #d4a24c 100%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        textAlign: 'center',
      }}
    >
      <div className="h-display" style={{ fontSize: 12, color: 'var(--ink-dark)', letterSpacing: 0.5 }}>
        {t('hub.sister.title')}
      </div>
      <div className="flavor" style={{ fontSize: 12, color: 'var(--ink-mid)', lineHeight: 1.1 }}>
        {t('hub.sister.flavor')}
      </div>
    </a>
  );
}

function StageCard({
  stage,
  unlocked,
  cleared,
  onPlay,
}: {
  stage: StageDef;
  unlocked: boolean;
  cleared: boolean;
  onPlay: () => void;
}) {
  const t = useT();
  const nameKey = `stage.${stage.id}.name` as DictKey;
  const flavorKey = `stage.${stage.id}.flavor` as DictKey;
  const tryT = (key: DictKey, fallback: string): string => {
    try {
      return t(key);
    } catch {
      return fallback;
    }
  };
  return (
    <div
      className="panel"
      style={{
        padding: 10,
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        opacity: unlocked ? 1 : 0.55,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="h-display" style={{ fontSize: 16 }}>
          {stage.id}. {tryT(nameKey, stage.name)}
        </div>
        <div
          className="flavor"
          style={{ fontSize: 13, color: 'var(--ink-mid)', lineHeight: 1.2 }}
        >
          {tryT(flavorKey, stage.flavor)}
        </div>
        {cleared && (
          <div style={{ fontSize: 11, color: 'var(--ink-warm)', marginTop: 2 }}>
            {t('hub.stage.cleared')}
          </div>
        )}
      </div>
      <button
        type="button"
        className="cbtn"
        disabled={!unlocked}
        onClick={onPlay}
        style={{ fontSize: 14, padding: '8px 12px' }}
      >
        {unlocked ? t('hub.stage.play') : t('hub.stage.locked')}
      </button>
    </div>
  );
}
