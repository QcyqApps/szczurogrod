import { useEffect, useState } from 'react';
import { GameIcon } from '@/components/game-icons';
import { LocTile } from '@/components/ui-common';
import { trpc } from '@/api/trpc';
import { getSurvivorUrl } from '@/api/survivor-url';
import { useT } from '@/i18n';
import type { DictKey } from '@/i18n';
import type { Character } from '@grodno/shared';
import type { SubScreen, Tab } from '@/types/nav';

const FALLBACK_KEY: Record<string, DictKey> = {
  warrior: 'town.flavor.warrior',
  mage: 'town.flavor.mage',
  rogue: 'town.flavor.rogue',
};

/**
 * Co ile sekund szczur przebiega przez hero-panel. Dash sam zajmuje ~30%
 * tego czasu, pozostałe ~70% szczur siedzi offscreen z prawej. Zmniejsz →
 * częściej; powiększ → rzadziej. Stałe keyframe'ów w `global.css`
 * (`castle-rat-dash`) trzymają `0% → 30%` proporcję — gdybyś chciał
 * wolniejszy/szybszy sam przebieg, edytuj tam.
 */
const RAT_DASH_CYCLE_SEC = 8;

export interface ScreenTownProps {
  char: Character;
  nav: (target: Tab | SubScreen) => void;
  dailyAvailable: boolean;
  questsDone: number;
  /** Liczba odblokowanych tierów w Season Pass gotowych do odebrania.
   *  Gdy > 0, pokazujemy banner na górze town'u. */
  seasonPassClaimableCount: number;
  /** Liczba pending XP packages z Okruchów (cross-game integration).
   *  Gdy > 0, banner z ODBIERZ — claim aplikuje XP do character'a. */
  survivorIdleXpPendingCount: number;
  /** Sumaryczne XP wszystkich pending packages. Banner pokazuje "+X XP". */
  survivorIdleXpPendingTotal: number;
  onClaimSurvivorXp: () => void;
  /** Mutation pending — disabluje banner żeby gracz nie spamował kliknięć. */
  survivorClaimPending: boolean;
}

export function ScreenTown({
  char,
  nav,
  dailyAvailable,
  questsDone,
  seasonPassClaimableCount,
  survivorIdleXpPendingCount,
  survivorIdleXpPendingTotal,
  onClaimSurvivorXp,
  survivorClaimPending,
}: ScreenTownProps) {
  const t = useT();
  // Fresh flavor quip per mount — each entry into town re-queries.
  const flavorQuery = trpc.town.flavor.useQuery(undefined, {
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  const fallbackKey = FALLBACK_KEY[char.cls] ?? 'town.flavor.warrior';
  const flavor = flavorQuery.data?.text ?? t(fallbackKey);

  // Dynamic counts previously hardcoded.
  const catalogQuery = trpc.shop.catalog.useQuery();
  const questsQuery = trpc.quests.list.useQuery();
  const enemiesQuery = trpc.combat.enemies.useQuery();
  const shopOffers = catalogQuery.data?.items.length ?? 0;
  const questsTotal = questsQuery.data?.length ?? 0;
  const enemiesAvailable = enemiesQuery.data?.filter((e) => e.available).length ?? 0;

  // Kroniki — pokazujemy top 3 (z ~20 w odpowiedzi serwera). Trzeci z fade'em
  // pod spodem, jako teaser że jest więcej. Brak rotacji — gracz klika
  // „WIĘCEJ" żeby zobaczyć pełny feed w osobnym ekranie.
  const chronicleQuery = trpc.town.chronicle.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const chronicleEntries = chronicleQuery.data?.entries ?? [];
  const chroniclePreview = chronicleEntries.slice(0, 3);

  // Zaproszenia gildyjne — banner tylko gdy gracz nie jest w gildii.
  const invitesQuery = trpc.guild.myInvites.useQuery(undefined, {
    enabled: char.guild === null,
    staleTime: 60_000,
  });
  const invitesCount = invitesQuery.data?.invites.length ?? 0;

  // Warunki kontekstowe dla castle animations. Liczone raz przy render'ze;
  // gdy gracz wisi w grze przez cały wieczór, rozblysk okien i tak się
  // aktywuje przy następnym me.get invalidate (co kilka minut). Dokładność
  // na minutę nie jest tu potrzebna.
  const hour = new Date().getHours();
  const isEvening = hour >= 17 || hour < 7; // 17:00 – 06:59 lokalnie

  // 1Hz tick gdy aktywna praca trwa — countdown na bannerze bez network traffic.
  const [, tickRerender] = useState(0);
  const isWorking = char.work !== null;
  useEffect(() => {
    if (!isWorking || char.work?.ready) return;
    const handle = setInterval(() => tickRerender((x) => x + 1), 1000);
    return () => clearInterval(handle);
  }, [isWorking, char.work?.ready]);

  const [survivorModalOpen, setSurvivorModalOpen] = useState(false);
  const openSurvivor = () => {
    window.open(getSurvivorUrl(), '_blank', 'noopener');
  };

  return (
    <div className="screen-in" style={{ padding: '12px 12px 10px' }}>
      {char.work && (
        <WorkBanner
          kindName={char.work.kindName}
          endsAt={char.work.endsAt}
          ready={char.work.ready}
          onClick={() => nav('work')}
        />
      )}
      {char.guild === null && invitesCount > 0 && (
        <button
          type="button"
          onClick={() => nav('guild')}
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            gap: 10,
            padding: 10,
            marginBottom: 10,
            border: '2.5px solid #2a1810',
            borderRadius: 10,
            background: '#f0c8a0',
            boxShadow: '2px 2px 0 #2a1810',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          <GameIcon name="banner" size={28} />
          <div style={{ flex: 1 }}>
            <div className="h-title" style={{ fontSize: 13 }}>
              {t('town.banner.guildInvites.title')}
            </div>
            <div style={{ fontSize: 12, color: '#5a3a2a' }}>
              {(() => {
                const [before, after] = t('town.banner.guildInvites.body').split('{count}');
                return (
                  <>
                    {before}
                    <b className="mono">{invitesCount}</b>
                    {after}
                  </>
                );
              })()}
            </div>
          </div>
          <GameIcon name="arrow-right" size={18} />
        </button>
      )}
      {/* Season Pass banner — TYLKO gdy jakiś tier do odebrania. Priorytet
          wyżej niż daily — SP to meta-progression, daily to routine. */}
      {seasonPassClaimableCount > 0 && (
        <button
          type="button"
          onClick={() => nav('seasonPass')}
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            gap: 10,
            padding: 10,
            marginBottom: 10,
            border: '2.5px solid #2a1810',
            borderRadius: 10,
            background: 'linear-gradient(90deg, #ffc830 0%, #d48020 100%)',
            boxShadow: '2px 2px 0 #2a1810',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          <GameIcon name="crown" size={28} />
          <div style={{ flex: 1 }}>
            <div className="h-title" style={{ fontSize: 13 }}>
              {t('town.banner.seasonPass.title')}
            </div>
            <div style={{ fontSize: 12, color: '#3a1a00' }}>
              <b className="mono">{seasonPassClaimableCount}</b>{' '}
              {seasonPassClaimableCount === 1
                ? t('town.banner.seasonPass.tier')
                : t('town.banner.seasonPass.tiers')}
              .
            </div>
          </div>
          <GameIcon name="arrow-right" size={18} />
        </button>
      )}
      {/* Survivor (Okruchy) XP claim — pending packages z mini-gry. Banner
          tylko gdy gracz ma >0 pending. Single-click claim aplikuje XP do
          character'a (przez survivor.claimIdleXp), invalidate'uje me.get +
          status. LevelUp triggeruje LevelUpModal w App.tsx automatycznie. */}
      {survivorIdleXpPendingCount > 0 && (
        <button
          type="button"
          onClick={() => {
            if (!survivorClaimPending) onClaimSurvivorXp();
          }}
          disabled={survivorClaimPending}
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            gap: 10,
            padding: 10,
            marginBottom: 10,
            border: '2.5px solid #2a1810',
            borderRadius: 10,
            background:
              'linear-gradient(90deg, #c39060 0%, #8a6a4a 50%, #5a3a2a 100%)',
            boxShadow: '2px 2px 0 #2a1810',
            cursor: survivorClaimPending ? 'wait' : 'pointer',
            opacity: survivorClaimPending ? 0.6 : 1,
            fontFamily: 'inherit',
            textAlign: 'left',
            color: '#fff3e0',
          }}
        >
          <GameIcon name="bolt" size={28} />
          <div style={{ flex: 1 }}>
            <div className="h-title" style={{ fontSize: 13, color: '#fff3e0' }}>
              {survivorClaimPending
                ? t('town.banner.survivor.claiming')
                : t('town.banner.survivor.title')}
            </div>
            <div style={{ fontSize: 12, color: '#f0d8b8' }}>
              <b className="mono">{survivorIdleXpPendingCount}</b>{' '}
              {survivorIdleXpPendingCount === 1
                ? t('town.banner.survivor.package')
                : t('town.banner.survivor.packages')}
              {' · '}
              <b className="mono">+{survivorIdleXpPendingTotal} XP</b>
            </div>
          </div>
          <GameIcon name="arrow-right" size={18} />
        </button>
      )}
      {/* Daily banner — pokazuje się TYLKO gdy nagroda do odebrania. Daily
          przeniesione z grid'a (jeden klik dziennie — szkoda miejsca). Stały
          dostęp (np. sprawdzenie streak'a) jest w zakładce POSTAĆ. */}
      {dailyAvailable && (
        <button
          type="button"
          onClick={() => nav('daily')}
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            gap: 10,
            padding: 10,
            marginBottom: 10,
            border: '2.5px solid #2a1810',
            borderRadius: 10,
            background: '#f0d080',
            boxShadow: '2px 2px 0 #2a1810',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          <GameIcon name="gift" size={28} />
          <div style={{ flex: 1 }}>
            <div className="h-title" style={{ fontSize: 13 }}>
              {t('town.banner.daily.title')}
            </div>
            <div style={{ fontSize: 12, color: '#5a3a2a' }}>
              {t('town.banner.daily.body')}
            </div>
          </div>
          <GameIcon name="arrow-right" size={18} />
        </button>
      )}
      <div
        style={{
          background: 'linear-gradient(180deg, #2a4a3a 0%, #1a3a2a 100%)',
          border: '3px solid #2a1810',
          borderRadius: 14,
          boxShadow: '3px 3px 0 #2a1810',
          padding: 14,
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(#f3ead9 1px, transparent 1.5px)',
            backgroundSize: '10px 10px',
            opacity: 0.1,
          }}
        />
        <svg
          viewBox="0 0 360 80"
          preserveAspectRatio="none"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 80 }}
        >
          <path
            d="M0 50 Q60 20 120 50 T240 50 T360 40 L360 80 L0 80 Z"
            fill="#0e2a1e"
          />
          <path d="M0 70 Q90 50 180 70 T360 65 L360 80 L0 80 Z" fill="#081a12" />
        </svg>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            height: 108,
          }}
        >
          <svg viewBox="0 0 200 120" width="200" height="120" style={{ overflow: 'visible' }}>
            <rect x="30" y="50" width="140" height="60" fill="#a8a8a0" stroke="#2a1810" strokeWidth="3" />
            <rect x="20" y="40" width="24" height="72" fill="#888880" stroke="#2a1810" strokeWidth="3" />
            <rect x="156" y="40" width="24" height="72" fill="#888880" stroke="#2a1810" strokeWidth="3" />
            <rect x="90" y="20" width="20" height="90" fill="#a8a8a0" stroke="#2a1810" strokeWidth="3" />
            <path
              d="M20 40 L22 32 L26 40 L30 32 L34 40 L38 32 L42 40 Z"
              fill="#888880"
              stroke="#2a1810"
              strokeWidth="2"
            />
            <path
              d="M156 40 L158 32 L162 40 L166 32 L170 40 L174 32 L178 40 Z"
              fill="#888880"
              stroke="#2a1810"
              strokeWidth="2"
            />
            <path d="M90 20 L100 6 L110 20 Z" fill="#c83232" stroke="#2a1810" strokeWidth="2.5" />
            <rect x="92" y="60" width="16" height="28" rx="8" fill="#2a1810" />
            {/* Komin na dachu głównego muru dymi. */}
            <rect x="66" y="42" width="8" height="10" fill="#2a1810" stroke="#2a1810" strokeWidth="1.5" />
            <circle className="castle-smoke" cx="70" cy="40" r="3" fill="#c8c8c8" />
            <circle className="castle-smoke castle-smoke-1" cx="70" cy="40" r="3.5" fill="#d4d4d4" />
            <circle className="castle-smoke castle-smoke-2" cx="70" cy="40" r="3" fill="#c8c8c8" />
            {/* Maszt flagowy na prawej wieży (wychodzi ze szczeliny między
                blankami na x=170) + czerwony proporzec. `castle-flag` animuje
                keyframes w global.css. Y=14..22 — cały proporzec w obszarze
                widocznym SVG (górny overflow hero-panela zjadał go gdy siedział
                na środkowej wieży z y=-10). */}
            <line x1="170" y1="40" x2="170" y2="14" stroke="#2a1810" strokeWidth="2" strokeLinecap="round" />
            <path
              className="castle-flag"
              d="M 170 14 L 184 18 L 170 22 Z"
              fill="#c83232"
              stroke="#2a1810"
              strokeWidth="1.5"
            />
            {/* Okna w basztach — wieczorem żółty blask z migotaniem, w dzień
                ciemne szczeliny (światło słoneczne wygasza wewnętrzne świece). */}
            <circle
              className={isEvening ? 'castle-window-lit' : undefined}
              cx="28"
              cy="60"
              r="3"
              fill={isEvening ? '#ffc830' : '#3a2a1a'}
            />
            <circle
              className={isEvening ? 'castle-window-lit' : undefined}
              cx="168"
              cy="60"
              r="3"
              fill={isEvening ? '#ffc830' : '#3a2a1a'}
            />
          </svg>
          {/* Szczur — przebiega po krawędzi gruntu tuż nad „WITAJ W SZCZUROGRODZIE!".
              Cykl = RAT_DASH_CYCLE_SEC. `castle-rat` robi dash poziomo, wewnętrzny
              SVG z klasą `castle-rat-body` robi krótki bounce pionowy (imituje
              sprint). Parent hero-panel ma `overflow: hidden` więc szczur poza
              widocznym obszarem jest cicho schowany. */}
          <div
            className="castle-rat"
            style={{ animationDuration: `${RAT_DASH_CYCLE_SEC}s` }}
            aria-hidden
          >
            <svg
              className="castle-rat-body"
              width="40"
              height="18"
              viewBox="0 0 40 18"
              style={{ display: 'block' }}
            >
              <ellipse cx="18" cy="16.5" rx="13" ry="1.2" fill="#000" opacity="0.25" />
              <ellipse cx="16" cy="10" rx="13" ry="5.5" fill="#3a2a1a" stroke="#2a1810" strokeWidth="1.5" />
              <ellipse cx="28" cy="9" rx="5" ry="4.5" fill="#3a2a1a" stroke="#2a1810" strokeWidth="1.5" />
              <polygon points="32,9 38,9.5 32,11" fill="#3a2a1a" stroke="#2a1810" strokeWidth="1.2" />
              <polygon points="26,5 28,2 30,5" fill="#3a2a1a" stroke="#2a1810" strokeWidth="1.2" />
              <circle cx="29" cy="8" r="0.9" fill="#ffc830" />
              <path d="M 4 10 Q -4 7 -2 14" stroke="#2a1810" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <line x1="10" y1="15" x2="9" y2="17.5" stroke="#2a1810" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="15" y1="15" x2="16" y2="17.5" stroke="#2a1810" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="22" y1="14" x2="21" y2="16.5" stroke="#2a1810" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="26" y1="14" x2="27" y2="16.5" stroke="#2a1810" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <div
          className="h-display"
          style={{ fontSize: 22, textAlign: 'center', marginTop: 4, position: 'relative' }}
        >
          {t('town.welcome')}
        </div>
        <div
          className="bubble flavor"
          style={{
            marginTop: 14,
            position: 'relative',
            maxWidth: 280,
            marginLeft: 'auto',
            marginRight: 'auto',
            fontSize: 15,
          }}
        >
          {flavor}
        </div>
        <div
          style={{
            textAlign: 'right',
            fontSize: 12,
            color: '#f3ead9',
            position: 'relative',
            marginTop: 10,
            paddingRight: 14,
            fontStyle: 'italic',
          }}
        >
          — {char.name}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <LocTile
          label={t('town.tile.quests')}
          sub={
            questsTotal > 0
              ? t('town.tile.quests.sub')
                  .replace('{done}', String(questsDone))
                  .replace('{total}', String(questsTotal))
              : t('town.tile.quests.loading')
          }
          bg="#e8c870"
          badge={questsDone > 0 ? questsDone : undefined}
          onClick={() => nav('quest')}
          icon={<GameIcon name="scroll" size={40} />}
        />
        <LocTile
          label={t('town.tile.dungeons')}
          sub={
            enemiesAvailable > 0
              ? t('town.tile.dungeons.sub').replace('{count}', String(enemiesAvailable))
              : t('town.tile.dungeons.none')
          }
          bg="#c8a090"
          onClick={() => nav('dungeons')}
          icon={<GameIcon name="sword" size={40} />}
        />
        <LocTile
          label={t('town.tile.arena')}
          sub={t('town.tile.arena.sub')}
          bg="#c89090"
          onClick={() => nav('arena')}
          icon={<GameIcon name="crossed" size={40} />}
        />
        <LocTile
          label={t('town.tile.shop')}
          sub={
            shopOffers > 0
              ? t('town.tile.shop.sub').replace('{count}', String(shopOffers))
              : t('town.tile.shop.closed')
          }
          bg="#b0d8a0"
          onClick={() => nav('shop')}
          icon={<GameIcon name="shop" size={40} />}
        />
        <LocTile
          label={t('town.tile.tavern')}
          sub={t('town.tile.tavern.sub')}
          bg="#d8b880"
          onClick={() => nav('tavern')}
          icon={<GameIcon name="tavern" size={40} />}
        />
        <LocTile
          label={t('town.tile.stables')}
          sub={
            char.activeMount
              ? t('town.tile.stables.sub.speed').replace(
                  '{pct}',
                  String(char.activeMount.speedPct),
                )
              : t('town.tile.stables.sub.fast')
          }
          bg="#b8906a"
          onClick={() => nav('stables')}
          icon={<GameIcon name="horse" size={40} />}
        />
        <LocTile
          label={t('town.tile.blacksmith')}
          sub={t('town.tile.blacksmith.sub')}
          bg="#9a6a4a"
          onClick={() => nav('blacksmith')}
          icon={<GameIcon name="sword" size={40} />}
        />
        <LocTile
          label={t('town.tile.tower')}
          sub={t('town.tile.tower.sub')}
          bg="#6a4a8a"
          onClick={() => nav('tower')}
          icon={<GameIcon name="castle" size={40} />}
        />
        <LocTile
          label={t('town.tile.worldBoss')}
          sub={t('town.tile.worldBoss.sub')}
          bg="linear-gradient(135deg, #d8a8e8 0%, #9a6ac8 100%)"
          onClick={() => nav('worldBoss')}
          icon={<GameIcon name="skull-mage" size={40} />}
        />
        <LocTile
          label={t('town.tile.fame')}
          sub={t('town.tile.fame.sub')}
          bg="#d8a850"
          onClick={() => nav('leaderboards')}
          icon={<GameIcon name="crown" size={40} />}
        />
        <LocTile
          label={t('town.tile.work')}
          sub={t('town.tile.work.sub')}
          bg="#a0907a"
          onClick={() => nav('work')}
          icon={<GameIcon name="scroll" size={40} />}
        />
        <LocTile
          label={t('town.tile.survivor')}
          sub={t('town.tile.survivor.sub')}
          bg="linear-gradient(135deg, #c39060 0%, #8a6a4a 100%)"
          onClick={() => setSurvivorModalOpen(true)}
          icon={<GameIcon name="bolt" size={40} />}
        />
      </div>

      <div className="panel-tight" style={{ marginTop: 12, padding: 10 }}>
        <div
          className="h-title"
          style={{
            fontSize: 14,
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <GameIcon name="megaphone" size={16} /> {t('town.chronicle.title')}
        </div>
        {chroniclePreview.length === 0 ? (
          <div style={{ fontSize: 14, lineHeight: 1.3, minHeight: 36 }}>
            {t('town.chronicle.empty')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {chroniclePreview.map((entry, i) => {
              const isLast = i === chroniclePreview.length - 1;
              const canFade = isLast && chronicleEntries.length > chroniclePreview.length;
              return (
                <div
                  key={entry.id}
                  style={{
                    fontSize: 14,
                    lineHeight: 1.3,
                    color: '#2a1810',
                    paddingBottom: i < chroniclePreview.length - 1 ? 4 : 0,
                    borderBottom:
                      i < chroniclePreview.length - 1
                        ? '1px dashed #c8b890'
                        : 'none',
                    // Mgła na ostatnim gdy jest „więcej" pod spodem.
                    maskImage: canFade
                      ? 'linear-gradient(to bottom, #000 20%, transparent 100%)'
                      : undefined,
                    WebkitMaskImage: canFade
                      ? 'linear-gradient(to bottom, #000 20%, transparent 100%)'
                      : undefined,
                    opacity: canFade ? 0.7 : 1,
                  }}
                >
                  {entry.text}
                </div>
              );
            })}
          </div>
        )}
        {chronicleEntries.length > chroniclePreview.length && (
          <button
            type="button"
            className="cbtn sm"
            style={{
              width: '100%',
              marginTop: 8,
              fontSize: 13,
              background: '#e8dcb9',
            }}
            onClick={() => nav('chronicle')}
          >
            {t('town.chronicle.more').replace('{count}', String(chronicleEntries.length))}
          </button>
        )}
      </div>

      {survivorModalOpen && (
        <SurvivorConfirmModal
          onCancel={() => setSurvivorModalOpen(false)}
          onConfirm={() => {
            setSurvivorModalOpen(false);
            openSurvivor();
          }}
        />
      )}
    </div>
  );
}

/** Banner u góry town'u gdy postać pracuje. Click → tablica pracy. Pokazuje
 *  countdown do końca zmiany; gdy ready, zachęca do odebrania zapłaty. */
function WorkBanner({
  kindName,
  endsAt,
  ready,
  onClick,
}: {
  kindName: string;
  endsAt: number;
  ready: boolean;
  onClick: () => void;
}) {
  const t = useT();
  const remainingMs = Math.max(0, endsAt - Date.now());
  const hh = Math.floor(remainingMs / 3_600_000);
  const mm = Math.floor((remainingMs % 3_600_000) / 60_000);
  const ss = Math.floor((remainingMs % 60_000) / 1000);
  const remaining =
    hh > 0
      ? `${hh}h ${String(mm).padStart(2, '0')}m`
      : `${mm}m ${String(ss).padStart(2, '0')}s`;
  const body = (ready ? t('work.banner.bodyReady') : t('work.banner.body'))
    .replace('{kind}', kindName)
    .replace('{remaining}', remaining);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        gap: 10,
        padding: 10,
        marginBottom: 10,
        border: '2.5px solid #2a1810',
        borderRadius: 10,
        background: ready
          ? 'linear-gradient(90deg, #82c060, #4a7c3a)'
          : 'linear-gradient(90deg, #d4a24c, #a07030)',
        boxShadow: '2px 2px 0 #2a1810',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        color: '#2a1810',
      }}
    >
      <GameIcon name="scroll" size={28} />
      <div style={{ flex: 1 }}>
        <div className="h-title" style={{ fontSize: 13 }}>
          {t('work.banner.title')}
        </div>
        <div style={{ fontSize: 12 }}>{body}</div>
      </div>
      <GameIcon name="arrow-right" size={18} />
    </button>
  );
}

/** Confirm popup wyjaśniający że Okruchy to inny tryb gry. Pokazuje się raz
 * przed otwarciem nowej karty żeby gracz nie pomyślał że klika sub-screen
 * w idle, tylko żeby wiedział że to side-game survivor-shooter z osobną
 * ekonomią okruchów + cross-game XP do zbierania w mieście (tu, banner
 * "PACZKA Z OKRUCHÓW"). */
function SurvivorConfirmModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useT();
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="panel pop-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#f3ead9',
          padding: 18,
          maxWidth: 360,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #c39060 0%, #8a6a4a 100%)',
              border: '3px solid #2a1810',
              boxShadow: '2px 2px 0 #2a1810',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GameIcon name="bolt" size={32} />
          </div>
        </div>
        <div className="h-display" style={{ fontSize: 18, marginBottom: 10, letterSpacing: 0.5 }}>
          {t('town.modal.survivor.title')}
        </div>
        <div style={{ fontSize: 14, color: '#3a2a1a', lineHeight: 1.4, textAlign: 'left' }}>
          <p style={{ margin: '0 0 8px' }}>{t('town.modal.survivor.intro')}</p>
          <p style={{ margin: '0 0 8px' }}>{t('town.modal.survivor.economy')}</p>
          <p style={{ margin: '0 0 8px' }}>
            <b>{t('town.modal.survivor.xp')}</b>
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#5a3a2a', fontStyle: 'italic' }}>
            {t('town.modal.survivor.note')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            type="button"
            className="cbtn ghost"
            style={{ flex: 1 }}
            onClick={onCancel}
          >
            {t('town.modal.survivor.cancel')}
          </button>
          <button
            type="button"
            className="cbtn"
            style={{ flex: 1.4 }}
            onClick={onConfirm}
          >
            {t('town.modal.survivor.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
