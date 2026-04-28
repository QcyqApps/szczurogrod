// Desktop-only marketing/landing rails wrapping the IOSDevice mockup.
//
// Hits a single public endpoint `landing.public` (cached server-side, 30s) so
// anonymous visitors see life in the world. Renders top players, latest
// chronicle, quick stats, plus the player's own rank when authenticated. A
// Google Play teaser sits at the bottom of the left rail. All strings funnel
// through useT() / useContentT() so EN ↔ PL toggle keeps panels in sync.

import { useEffect } from 'react';
import { useAuthStore } from '@/api/auth-store';
import { trpc } from '@/api/trpc';
import { useT, useLangStore } from '@/i18n';
import { renderChronicleEntry } from '@/i18n/chronicle-templates';
import { IcoCoin, IcoPaw, IcoSword, IcoMagic } from '@/components/icons';

const RAIL_WIDTH = 280;

// Refetch landing snapshot whenever the auth token flips (login, logout, guest
// upgrade, refresh). The endpoint reads `myRank` from `ctx.userId`, so the
// stale anonymous response would otherwise stick around until the 60s interval
// fires — leaving "TWOJE MIEJSCE" empty after a fresh login.
function useLandingAuthSync() {
  const utils = trpc.useUtils();
  const accessToken = useAuthStore((s) => s.accessToken);
  useEffect(() => {
    void utils.landing.public.invalidate();
  }, [accessToken, utils]);
}

export function DesktopSidePanelLeft() {
  const t = useT();
  useLandingAuthSync();
  const q = trpc.landing.public.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const top = q.data?.topByLevel ?? [];

  return (
    <aside style={railStyle}>
      <SectionPanel
        title={t('landing.leaderboard.title')}
        subtitle={t('landing.leaderboard.subtitle')}
      >
        {top.length === 0 ? (
          <div style={emptyStyle}>{t('landing.leaderboard.empty')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={leaderboardHeaderStyle}>
              <span style={{ width: 22 }}>{t('landing.leaderboard.colPos')}</span>
              <span style={{ flex: 1 }}>{t('landing.leaderboard.colName')}</span>
              <span>{t('landing.leaderboard.colLvl')}</span>
            </div>
            {top.map((row) => (
              <LeaderboardRow
                key={row.characterId}
                pos={row.pos}
                name={row.name}
                cls={row.cls}
                lvl={row.lvl}
              />
            ))}
          </div>
        )}
      </SectionPanel>

      <GooglePlayCard />
    </aside>
  );
}

export function DesktopSidePanelRight() {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  useLandingAuthSync();
  const q = trpc.landing.public.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const stats = q.data?.stats;
  const chronicle = q.data?.chronicle ?? [];
  const myRank = q.data?.myRank ?? null;

  return (
    <aside style={railStyle}>
      <SectionPanel title={t('landing.stats.title')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <StatRow
            label={t('landing.stats.online')}
            value={stats ? String(stats.onlineCount) : '—'}
            dotColor="#4a7c3a"
            pulse
          />
          <StatRow
            label={t('landing.stats.totalChars')}
            value={stats ? formatNumber(stats.totalCharacters) : '—'}
          />
          <StatRow
            label={t('landing.stats.totalGuilds')}
            value={stats ? formatNumber(stats.totalGuilds) : '—'}
          />
        </div>
      </SectionPanel>

      <SectionPanel title={t('landing.myrank.title')}>
        {myRank === null ? (
          <div style={emptyStyle}>{t('landing.myrank.signedOut')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <RankBadge
              label={t('landing.myrank.level')}
              pos={myRank.levelPos}
              detail={`LVL ${myRank.lvl}`}
            />
            <RankBadge
              label={t('landing.myrank.arena')}
              pos={myRank.arenaPos}
              detail={
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <IcoCoin s={11} /> {formatNumber(myRank.arenaPoints)}
                </span>
              }
            />
          </div>
        )}
      </SectionPanel>

      <SectionPanel
        title={t('landing.chronicle.title')}
        subtitle={t('landing.chronicle.subtitle')}
      >
        {chronicle.length === 0 ? (
          <div style={emptyStyle}>{t('landing.chronicle.empty')}</div>
        ) : (
          <ul style={chronicleListStyle}>
            {chronicle.map((entry) => (
              <li key={entry.id} style={chronicleItemStyle}>
                <span style={chronicleBulletStyle} aria-hidden="true" />
                <span style={chronicleTextStyle}>{renderChronicleEntry(entry, lang)}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionPanel>
    </aside>
  );
}

// ---------- Sub-components ----------

function SectionPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel" style={panelStyle}>
      <div style={titleRowStyle}>
        <span style={titleEdgeStyle} aria-hidden="true" />
        <span className="h-title" style={titleTextStyle}>
          {title}
        </span>
        <span style={titleEdgeStyle} aria-hidden="true" />
      </div>
      {subtitle && (
        <div className="flavor" style={subtitleStyle}>
          {subtitle}
        </div>
      )}
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  );
}

function LeaderboardRow({
  pos,
  name,
  cls,
  lvl,
}: {
  pos: number;
  name: string;
  cls: 'warrior' | 'mage' | 'rogue';
  lvl: number;
}) {
  const medal = pos === 1 ? '#ffc830' : pos === 2 ? '#c8c8d0' : pos === 3 ? '#a86a3a' : null;
  return (
    <div style={leaderboardRowStyle}>
      <span
        style={{
          width: 22,
          textAlign: 'center',
          fontWeight: 700,
          color: medal ?? '#5a3a2a',
          textShadow: medal ? '1px 1px 0 #2a1810' : 'none',
        }}
      >
        {pos}
      </span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          color: '#2a1810',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
        title={name}
      >
        <ClassGlyph cls={cls} />
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </span>
      </span>
      <span style={{ fontWeight: 700, color: '#2a1810' }}>{lvl}</span>
    </div>
  );
}

function StatRow({
  label,
  value,
  dotColor,
  pulse,
}: {
  label: string;
  value: string;
  dotColor?: string;
  pulse?: boolean;
}) {
  return (
    <div style={statRowStyle}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: '#5a3a2a',
        }}
      >
        {dotColor && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: dotColor,
              boxShadow: `0 0 6px ${dotColor}`,
              animation: pulse ? 'pulse-dot 1.6s ease-in-out infinite' : 'none',
              flexShrink: 0,
            }}
          />
        )}
        {label}
      </span>
      <span className="mono" style={{ fontWeight: 700, color: '#2a1810' }}>
        {value}
      </span>
    </div>
  );
}

function RankBadge({
  label,
  pos,
  detail,
}: {
  label: string;
  pos: number | null;
  detail: React.ReactNode;
}) {
  return (
    <div style={rankBadgeStyle}>
      <span style={{ fontSize: 12, color: '#5a3a2a' }}>{label}</span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: "'Luckiest Guy', sans-serif",
          color: '#2a1810',
        }}
      >
        <span style={{ fontSize: 16 }}>#{pos ?? '—'}</span>
        <span
          style={{
            fontFamily: 'inherit',
            fontSize: 11,
            color: '#5a3a2a',
            fontWeight: 'normal',
          }}
        >
          {detail}
        </span>
      </span>
    </div>
  );
}

function GooglePlayCard() {
  const t = useT();
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      aria-disabled="true"
      className="panel"
      style={ctaCardStyle}
    >
      <div style={ctaInnerStyle}>
        <span style={ctaIconBoxStyle} aria-hidden="true">
          <img
            src="/google-play.png"
            alt=""
            width={28}
            height={28}
            style={{ display: 'block' }}
          />
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span
            style={{
              fontSize: 10,
              letterSpacing: 1.2,
              color: '#5a3a2a',
              textTransform: 'uppercase',
            }}
          >
            {t('landing.cta.googlePlay.kicker')}
          </span>
          <span
            className="h-title"
            style={{ fontSize: 18, color: '#2a1810', letterSpacing: 0.5 }}
          >
            {t('landing.cta.googlePlay.label')}
          </span>
          <span
            style={{
              fontSize: 10,
              color: '#a87d2e',
              fontStyle: 'italic',
              marginTop: 2,
            }}
          >
            {t('landing.cta.googlePlay.soon')}
          </span>
        </span>
      </div>
      <div className="flavor" style={ctaNoteStyle}>
        {t('landing.cta.googlePlay.note')}
      </div>
    </a>
  );
}

// ---------- Helpers ----------

function ClassGlyph({ cls }: { cls: 'warrior' | 'mage' | 'rogue' }) {
  if (cls === 'warrior') return <IcoSword s={12} />;
  if (cls === 'mage') return <IcoMagic s={12} />;
  return <IcoPaw s={12} />;
}

function formatNumber(n: number): string {
  return n.toLocaleString('pl-PL');
}

// ---------- Styles ----------

const railStyle: React.CSSProperties = {
  width: RAIL_WIDTH,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  alignSelf: 'stretch',
};

const panelStyle: React.CSSProperties = {
  padding: '12px 14px',
  background: '#fff7e0',
};

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 2,
};

const titleEdgeStyle: React.CSSProperties = {
  flex: 1,
  height: 2,
  background:
    'repeating-linear-gradient(90deg, #2a1810 0 6px, transparent 6px 9px)',
  opacity: 0.4,
};

const titleTextStyle: React.CSSProperties = {
  fontSize: 13,
  letterSpacing: 1.5,
  color: '#2a1810',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 14,
  textAlign: 'center',
  color: '#5a3a2a',
  marginTop: 0,
};

const emptyStyle: React.CSSProperties = {
  padding: '8px 4px',
  fontSize: 13,
  textAlign: 'center',
  color: '#7a5a3a',
  fontStyle: 'italic',
};

const leaderboardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 10,
  letterSpacing: 1,
  color: '#7a5a3a',
  borderBottom: '1.5px dashed #c8a878',
  paddingBottom: 4,
  marginBottom: 2,
};

const leaderboardRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  padding: '3px 4px',
  borderRadius: 4,
};

const statRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: 13,
  padding: '4px 6px',
  background: '#e8dcb9',
  border: '1.5px solid #c8a878',
  borderRadius: 6,
};

const rankBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 10px',
  background: '#e8dcb9',
  border: '2px solid #2a1810',
  borderRadius: 6,
};

const chronicleListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const chronicleItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  fontSize: 14,
  color: '#3a2a1a',
  lineHeight: 1.35,
  paddingBottom: 6,
  borderBottom: '1px dashed #d4c491',
};

const chronicleBulletStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  marginTop: 8,
  borderRadius: '50%',
  background: '#a87d2e',
  border: '1.5px solid #2a1810',
  flexShrink: 0,
};

const chronicleTextStyle: React.CSSProperties = {
  fontFamily: "'Patrick Hand', 'Comic Sans MS', system-ui, sans-serif",
};

const ctaCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '12px 14px',
  background: 'linear-gradient(180deg, #ffd76a 0%, #f3a71e 100%)',
  textDecoration: 'none',
  cursor: 'default',
  position: 'relative',
};

const ctaInnerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const ctaIconBoxStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 10,
  background: '#fff7e0',
  border: '2.5px solid #2a1810',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const ctaNoteStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#3a2a1a',
  textAlign: 'center',
  marginTop: 2,
};
