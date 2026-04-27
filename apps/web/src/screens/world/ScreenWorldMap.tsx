import { useMemo, useState } from 'react';
import { GameIcon } from '@/components/game-icons';
import { HelpIcon } from '@/components/ui-common';
import type { RegionSummary, DungeonSummary } from '@grodno/shared';

// SVG canvas — DB trzyma mapX/mapY w 0..1000. Klient skaluje do viewBox.
const VIEW = 1000;
const NODE_R = 72;

const INK = '#2a1810';

export interface ScreenWorldMapProps {
  regions: readonly RegionSummary[];
  charLvl: number;
  onDungeonOpen: (slug: string) => void;
  onBack: () => void;
}

/**
 * Wybór startowego regionu po me.get: pokazujemy pierwszy region gdzie jest
 * przynajmniej jeden unlocked/cleared dungeon (czyli „gdzie gracz aktualnie
 * gra"). Gdy wszystko zamknięte — default 0 (pierwszy). Gdy wszystko
 * ukończone — ostatni.
 */
function pickInitialRegionIdx(regions: readonly RegionSummary[]): number {
  let lastEngaged = 0;
  for (let i = 0; i < regions.length; i += 1) {
    const hasProgress = regions[i].dungeons.some(
      (d) => d.status === 'unlocked' || d.status === 'cleared',
    );
    if (hasProgress) lastEngaged = i;
  }
  return lastEngaged;
}

export function ScreenWorldMap({ regions, charLvl, onDungeonOpen, onBack }: ScreenWorldMapProps) {
  const [idx, setIdx] = useState<number>(() => pickInitialRegionIdx(regions));
  // Clamp — gdy tabela regions skurczy się w locie (np. server usunął region
  // podczas sesji) i idx wyleciał poza zakres, zbijamy do ostatniego.
  const clampedIdx = regions.length === 0 ? 0 : Math.min(idx, regions.length - 1);
  const region = regions[clampedIdx];

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div
        style={{
          background: 'linear-gradient(180deg, #3a2a4a 0%, #1a1a2a 100%)',
          border: '3px solid #2a1810',
          borderRadius: 14,
          boxShadow: '3px 3px 0 #2a1810',
          padding: 14,
          color: '#fff3e0',
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        <div className="h-display" style={{ fontSize: 22 }}>MAPA ŚWIATA</div>
        <div className="flavor light" style={{ fontSize: 17, marginTop: 4 }}>
          Idziesz, walczysz, wracasz. Tak to się kręci.
        </div>
      </div>

      {region ? (
        <RegionPanel region={region} charLvl={charLvl} onDungeonOpen={onDungeonOpen} />
      ) : (
        <div
          className="panel"
          style={{ padding: 20, textAlign: 'center', color: '#5a3a2a' }}
        >
          Brak regionów. Wróć później.
        </div>
      )}

      {regions.length > 1 && (
        <RegionNav
          regions={regions}
          idx={clampedIdx}
          onChange={setIdx}
        />
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: 10,
        }}
      >
        <HelpIcon title="Jak działa mapa?" label="Jak to działa?">
          <p style={{ margin: '0 0 8px' }}>
            Każdy region to osobna mapa. Strzałkami pod mapą przeskakujesz
            między regionami. Każdy loch na mapie to jeden węzeł.
          </p>
          <p style={{ margin: '0 0 8px' }}>
            <b>Zielone</b> — ukończone (bossa już pokonałeś, moby nadal farmisz).
            <b> Żółte</b> — otwarte, idź i walcz. <b>Szare</b> — zamknięte;
            najedź, żeby zobaczyć czego brakuje.
          </p>
          <p style={{ margin: 0 }}>
            Każdy boss raz na dobę. Potem czekasz do 00:00 UTC.
          </p>
        </HelpIcon>
      </div>

      <button
        type="button"
        className="cbtn ghost"
        style={{ marginTop: 12, width: '100%' }}
        onClick={onBack}
      >
        ← Miasto
      </button>
    </div>
  );
}

function RegionNav({
  regions,
  idx,
  onChange,
}: {
  regions: readonly RegionSummary[];
  idx: number;
  onChange: (next: number) => void;
}) {
  const canPrev = idx > 0;
  const canNext = idx < regions.length - 1;
  const current = regions[idx];

  // Sub-label z mini-progresem — np. „2/3 ukończone" dla orientacji.
  const cleared = current.dungeons.filter((d) => d.status === 'cleared').length;
  const total = current.dungeons.length;

  return (
    <div
      className="panel"
      style={{
        padding: 8,
        marginTop: 10,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        gap: 8,
        background: '#fff7e0',
      }}
    >
      <button
        type="button"
        onClick={() => canPrev && onChange(idx - 1)}
        disabled={!canPrev}
        className="cbtn sm"
        style={{
          padding: '6px 12px',
          opacity: canPrev ? 1 : 0.35,
          cursor: canPrev ? 'pointer' : 'not-allowed',
        }}
        aria-label="Poprzedni region"
      >
        ‹
      </button>
      <div style={{ textAlign: 'center', minWidth: 0 }}>
        <div
          className="h-title"
          style={{
            fontSize: 14,
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {current.name}
        </div>
        <div style={{ fontSize: 13, color: '#5a3a2a', marginTop: 2 }}>
          Region {idx + 1} / {regions.length} · {cleared}/{total} ukończone
        </div>
      </div>
      <button
        type="button"
        onClick={() => canNext && onChange(idx + 1)}
        disabled={!canNext}
        className="cbtn sm"
        style={{
          padding: '6px 12px',
          opacity: canNext ? 1 : 0.35,
          cursor: canNext ? 'pointer' : 'not-allowed',
        }}
        aria-label="Następny region"
      >
        ›
      </button>
    </div>
  );
}

function RegionPanel({
  region,
  charLvl,
  onDungeonOpen,
}: {
  region: RegionSummary;
  charLvl: number;
  onDungeonOpen: (slug: string) => void;
}) {
  const theme = useMemo(() => getRegionTheme(region.slug), [region.slug]);

  // Ścieżka łącząca węzły w kolejności sortOrder — cubic bezier między
  // sąsiednimi węzłami, przyjazny dla oka „trakt".
  const sorted = [...region.dungeons].sort((a, b) => a.sortOrder - b.sortOrder);
  const pathSegments: string[] = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const midX = (a.mapX + b.mapX) / 2;
    const arch = (a.mapY + b.mapY) / 2 - 80;
    pathSegments.push(
      i === 0
        ? `M ${a.mapX} ${a.mapY} Q ${midX} ${arch}, ${b.mapX} ${b.mapY}`
        : `Q ${midX} ${arch}, ${b.mapX} ${b.mapY}`,
    );
  }
  const pathD = pathSegments.join(' ');

  return (
    <div
      className="panel"
      style={{
        padding: 10,
        marginBottom: 12,
        background: '#e8d8a8',
        position: 'relative',
      }}
    >
      <div
        className="h-title"
        style={{
          fontSize: 14,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <GameIcon name="banner" size={14} /> {region.name.toUpperCase()}
      </div>

      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        style={{
          width: '100%',
          height: 'auto',
          aspectRatio: '1 / 1',
          display: 'block',
          borderRadius: 8,
          background: theme.background,
          border: `3px solid ${INK}`,
          boxShadow: `2px 2px 0 ${INK}`,
        }}
      >
        {/* Tło regionu — unikalny dla każdego regionu */}
        <theme.Decor />

        {/* Ścieżka między lochami (trakt) */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={theme.pathColor}
            strokeWidth={8}
            strokeDasharray="18 10"
            strokeLinecap="round"
            opacity={0.75}
          />
        )}

        {/* Węzły-lochy z tematyczną grafiką w środku koła */}
        {sorted.map((d) => (
          <DungeonNode
            key={d.slug}
            dungeon={d}
            charLvl={charLvl}
            theme={theme}
            onOpen={() => onDungeonOpen(d.slug)}
          />
        ))}
      </svg>

      {/* Lista pod mapą z kluczowymi info o każdym lochu — dla mobilki
          łatwiej klikać w karty niż w SVG. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
        {sorted.map((d) => (
          <DungeonRowCard
            key={d.slug}
            dungeon={d}
            charLvl={charLvl}
            onOpen={() => onDungeonOpen(d.slug)}
          />
        ))}
      </div>
    </div>
  );
}

// ==================== Region themes ====================
//
// Per-region: tło (gradient SVG color string), kolor traktu, komponent decor,
// oraz mapa slug → tematyczna ikona lochu w środku koła-węzła. Nowy region
// dodajesz tutaj (rejestr) + seed w `game/dungeons.ts`. Brak rejestracji =
// fallback na dekoracje generyczne (`defaultTheme`).

interface RegionTheme {
  background: string;
  pathColor: string;
  Decor: () => React.JSX.Element;
  /** Ikona w środku koła-węzła — zwraca SVG <g> lub null (wtedy generyczny status-glyph). */
  dungeonIcon: (slug: string) => React.JSX.Element | null;
}

const defaultTheme: RegionTheme = {
  background: 'radial-gradient(circle at 30% 30%, #f3e8c4 0%, #d4b878 60%, #a88848 100%)',
  pathColor: INK,
  Decor: () => <g />,
  dungeonIcon: () => null,
};

function getRegionTheme(slug: string): RegionTheme {
  return REGION_THEMES[slug] ?? defaultTheme;
}

/** Rejestr theme'ów per regionSlug. Nowy region → tutaj dokładamy wpis. */
const REGION_THEMES: Record<string, RegionTheme> = {
  'okolice-szczurogrodu': {
    background:
      'radial-gradient(circle at 30% 30%, #f3e8c4 0%, #d4b878 60%, #a88848 100%)',
    pathColor: INK,
    Decor: OkoliceDecor,
    dungeonIcon: (slug) => {
      if (slug === 'piwnice-miasta') return <CityGateIcon />;
      if (slug === 'stare-katakumby') return <CryptIcon />;
      if (slug === 'mroczna-gran') return <MountainPeakIcon />;
      return null;
    },
  },
  'puszcza-cien': {
    background:
      'radial-gradient(circle at 50% 30%, #3a5a3a 0%, #2a4228 55%, #1a2a18 100%)',
    pathColor: '#f0d8a0',
    Decor: PuszczaDecor,
    dungeonIcon: (slug) => {
      if (slug === 'szlaki-lesne') return <ForestPathIcon />;
      if (slug === 'kurhany-starych-bogow') return <BurialStonesIcon />;
      if (slug === 'serce-puszczy') return <AncientTreeIcon />;
      return null;
    },
  },
  'bagna-czarnej-strzygi': {
    background:
      'radial-gradient(ellipse at 50% 45%, #4a3a4a 0%, #2a2a38 55%, #16161e 100%)',
    pathColor: '#c8a890',
    Decor: BagnaDecor,
    dungeonIcon: (slug) => {
      if (slug === 'mielizny-topielcow') return <MarshSurfaceIcon />;
      if (slug === 'gaszcz-bolesny') return <ThornedThicketIcon />;
      if (slug === 'czarna-obrzednica') return <WitchAltarIcon />;
      return null;
    },
  },
  'granie-strzelistych': {
    background:
      'radial-gradient(circle at 50% 25%, #d8e4f0 0%, #7a96b0 55%, #2e3e52 100%)',
    pathColor: '#fff7e0',
    Decor: GranieDecor,
    dungeonIcon: (slug) => {
      if (slug === 'lodowa-jaskinia') return <IceCaveIcon />;
      if (slug === 'otchlan-skarbnika') return <MineShaftIcon />;
      return null;
    },
  },
};

// ==================== Region 1: Okolice Szczurogrodu ====================
// Miasto Szczurogród widoczne w lewym-dolnym (gdzie jest piwnice-miasta,
// mapX=180, mapY=720), katakumby w środku (kurhany/wzgórze), Mroczna Grań =
// turnia w prawym-dolnym (mapX=820, mapY=680). Droga (trakt) łączy je dashed
// path'em — tutaj tylko tło/landscape.

function OkoliceDecor() {
  return (
    <g>
      {/* Pasmo gór na północy (cały górny brzeg mapy) */}
      <path
        d="M -10 220 L 80 110 L 180 200 L 260 120 L 340 200 L 440 100 L 540 210 L 640 130 L 740 220 L 860 120 L 1010 210 L 1010 -10 L -10 -10 Z"
        fill="#6a5a48"
        stroke={INK}
        strokeWidth={4}
        strokeLinejoin="round"
        opacity={0.85}
      />
      {/* Śniegowe czapy na kilku szczytach */}
      <path d="M 60 150 L 80 110 L 100 150 Z" fill="#e8e8e8" stroke={INK} strokeWidth={2} />
      <path d="M 240 160 L 260 120 L 280 160 Z" fill="#e8e8e8" stroke={INK} strokeWidth={2} />
      <path d="M 420 140 L 440 100 L 460 140 Z" fill="#e8e8e8" stroke={INK} strokeWidth={2} />
      <path d="M 620 170 L 640 130 L 660 170 Z" fill="#e8e8e8" stroke={INK} strokeWidth={2} />
      <path d="M 840 160 L 860 120 L 880 160 Z" fill="#e8e8e8" stroke={INK} strokeWidth={2} />

      {/* Łąki — wybrane plamy zieleni na tle piaskowym */}
      <ellipse cx={380} cy={450} rx={120} ry={40} fill="#9fb86a" opacity={0.5} />
      <ellipse cx={640} cy={480} rx={100} ry={34} fill="#9fb86a" opacity={0.5} />

      {/* Rzeka — meandryczna linia od lewej do prawej krawędzi */}
      <path
        d="M -20 540 Q 200 510 350 560 T 700 600 T 1020 560"
        fill="none"
        stroke="#6aa0d8"
        strokeWidth={20}
        strokeLinecap="round"
        opacity={0.75}
      />
      <path
        d="M -20 540 Q 200 510 350 560 T 700 600 T 1020 560"
        fill="none"
        stroke="#aad0f0"
        strokeWidth={9}
        strokeLinecap="round"
      />

      {/* Miasto Szczurogród — lewo-dolne, otoczki wokół piwnice-miasta (180,720).
         Mury, brama, kilka wież, dachy. Skala dopasowana tak żeby węzeł koła
         (r=72) siedział mniej-więcej na bramie miasta. */}
      <CityCluster centerX={180} centerY={720} />

      {/* Drzewa wokół Katakumb (500, 350) — cmentarny gaj */}
      {[
        [380, 280],
        [420, 260],
        [460, 290],
        [540, 280],
        [600, 300],
        [620, 260],
      ].map(([x, y], i) => (
        <TreeClump key={`kt-${i}`} x={x} y={y} />
      ))}

      {/* Kamienny szczyt wokół Mroczna Grań (820, 680) — turnia */}
      <path
        d="M 680 880 L 780 620 L 840 800 L 900 640 L 970 880 Z"
        fill="#5a4a38"
        stroke={INK}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path d="M 770 680 L 780 620 L 790 680 Z" fill="#e8e8e8" stroke={INK} strokeWidth={2} />
      <path d="M 890 700 L 900 640 L 910 700 Z" fill="#e8e8e8" stroke={INK} strokeWidth={2} />

      {/* Chorągiew Szczurogrodu nad miastem — mały banner */}
      <g transform="translate(100, 600)">
        <rect x={0} y={0} width={4} height={60} fill={INK} />
        <path d="M 4 5 L 36 15 L 4 25 Z" fill="#c83232" stroke={INK} strokeWidth={2} />
      </g>
    </g>
  );
}

/** Skupisko budynków miasta — mury, 2 wieże strażnicze, dachy, brama. */
function CityCluster({ centerX, centerY }: { centerX: number; centerY: number }) {
  // Koordinaty liczone lokalnie w obrębie clusteru, potem translate.
  // Baza = linia (0, 0) jako „grunt" pod miastem; mury w górę.
  return (
    <g transform={`translate(${centerX}, ${centerY})`}>
      {/* Trawa wokół */}
      <ellipse cx={0} cy={40} rx={200} ry={40} fill="#9fb86a" opacity={0.6} />

      {/* Mur zachodni */}
      <rect x={-170} y={-90} width={24} height={120} fill="#a89680" stroke={INK} strokeWidth={4} />
      {/* Blanki lewego muru */}
      <rect x={-172} y={-106} width={8} height={16} fill="#a89680" stroke={INK} strokeWidth={3} />
      <rect x={-158} y={-106} width={8} height={16} fill="#a89680" stroke={INK} strokeWidth={3} />
      <rect x={-144} y={-106} width={8} height={16} fill="#a89680" stroke={INK} strokeWidth={3} />

      {/* Mur wschodni */}
      <rect x={146} y={-90} width={24} height={120} fill="#a89680" stroke={INK} strokeWidth={4} />
      <rect x={144} y={-106} width={8} height={16} fill="#a89680" stroke={INK} strokeWidth={3} />
      <rect x={158} y={-106} width={8} height={16} fill="#a89680" stroke={INK} strokeWidth={3} />
      <rect x={172} y={-106} width={8} height={16} fill="#a89680" stroke={INK} strokeWidth={3} />

      {/* Wieża strażnicza - lewa */}
      <rect x={-170} y={-160} width={28} height={70} fill="#8a7860" stroke={INK} strokeWidth={4} />
      <path
        d="M -178 -160 L -156 -186 L -134 -160 Z"
        fill="#7a2a2a"
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {/* Wieża strażnicza - prawa */}
      <rect x={142} y={-160} width={28} height={70} fill="#8a7860" stroke={INK} strokeWidth={4} />
      <path
        d="M 134 -160 L 156 -186 L 178 -160 Z"
        fill="#7a2a2a"
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />

      {/* Kamienice w środku — 3 dachy różnej wysokości */}
      <rect x={-90} y={-70} width={50} height={100} fill="#c8a868" stroke={INK} strokeWidth={4} />
      <path d="M -96 -70 L -65 -102 L -34 -70 Z" fill="#7a2a2a" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <rect x={-78} y={-30} width={10} height={16} fill="#f3ead9" stroke={INK} strokeWidth={2} />
      <rect x={-58} y={-30} width={10} height={16} fill="#f3ead9" stroke={INK} strokeWidth={2} />

      <rect x={-20} y={-90} width={50} height={120} fill="#c8a868" stroke={INK} strokeWidth={4} />
      <path d="M -26 -90 L 5 -124 L 36 -90 Z" fill="#7a2a2a" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <rect x={-10} y={-50} width={10} height={16} fill="#f3ead9" stroke={INK} strokeWidth={2} />
      <rect x={10} y={-50} width={10} height={16} fill="#f3ead9" stroke={INK} strokeWidth={2} />

      <rect x={50} y={-70} width={50} height={100} fill="#c8a868" stroke={INK} strokeWidth={4} />
      <path d="M 44 -70 L 75 -102 L 106 -70 Z" fill="#7a2a2a" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <rect x={62} y={-30} width={10} height={16} fill="#f3ead9" stroke={INK} strokeWidth={2} />
      <rect x={82} y={-30} width={10} height={16} fill="#f3ead9" stroke={INK} strokeWidth={2} />
    </g>
  );
}

function TreeClump({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 5} y={y + 16} width={10} height={22} fill="#4a3a28" stroke={INK} strokeWidth={2} />
      <path
        d={`M ${x - 24} ${y + 16} L ${x} ${y - 18} L ${x + 24} ${y + 16} Z`}
        fill="#3a6a3a"
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </g>
  );
}

// ==================== Region 2: Puszcza Cień ====================
// Ciemny, dense las. Trzy lochy: Szlaki Leśne (200,300), Kurhany (500,600),
// Serce Puszczy (800,300). Paleta zimna, zielono-fioletowa. Koronę drzew
// rozłożoną gęsto po całej mapie, przerwy tylko wokół węzłów.

function PuszczaDecor() {
  // Pseudo-random ale deterministyczny layout drzew — generowany raz
  // z seedu, nie re-renderuje się przy każdym mount'cie.
  const trees = useMemo(() => genForestTrees(), []);
  return (
    <g>
      {/* Mgła przy podłożu */}
      <rect x={0} y={700} width={VIEW} height={300} fill="url(#puszcza-fog)" opacity={0.25} />
      <defs>
        <radialGradient id="puszcza-fog" cx="0.5" cy="1" r="0.8">
          <stop offset="0%" stopColor="#d8e8d8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#d8e8d8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Korzenie/pnącza na krawędziach */}
      <path
        d="M -20 80 Q 120 40 180 120 Q 260 200 120 240 Q 20 260 -20 220 Z"
        fill="#2a4a28"
        stroke={INK}
        strokeWidth={3}
        opacity={0.65}
      />
      <path
        d="M 1020 900 Q 900 860 860 780 Q 820 700 950 720 Q 1020 740 1020 780 Z"
        fill="#2a4a28"
        stroke={INK}
        strokeWidth={3}
        opacity={0.65}
      />

      {/* Strumień — przecina las środkiem, ciemniejszy niż w Okolicach */}
      <path
        d="M -20 480 Q 260 460 420 500 T 780 530 T 1020 490"
        fill="none"
        stroke="#4a7a9a"
        strokeWidth={18}
        strokeLinecap="round"
        opacity={0.75}
      />
      <path
        d="M -20 480 Q 260 460 420 500 T 780 530 T 1020 490"
        fill="none"
        stroke="#8ab8d0"
        strokeWidth={7}
        strokeLinecap="round"
      />

      {/* Drzewa — gęsty las, opuszczamy strefy wokół węzłów (200,300), (500,600), (800,300) */}
      {trees.map((t, i) => (
        <DarkTree key={`pt-${i}`} x={t.x} y={t.y} size={t.size} />
      ))}

      {/* Grzyby przy strumieniu */}
      <g transform="translate(320, 540)">
        <rect x={-3} y={0} width={6} height={14} fill="#e8d8b0" stroke={INK} strokeWidth={2} />
        <ellipse cx={0} cy={-2} rx={14} ry={9} fill="#c83232" stroke={INK} strokeWidth={2} />
      </g>
      <g transform="translate(660, 560)">
        <rect x={-3} y={0} width={6} height={14} fill="#e8d8b0" stroke={INK} strokeWidth={2} />
        <ellipse cx={0} cy={-2} rx={14} ry={9} fill="#c83232" stroke={INK} strokeWidth={2} />
      </g>
    </g>
  );
}

function DarkTree({ x, y, size }: { x: number; y: number; size: number }) {
  const s = size;
  return (
    <g>
      <rect x={x - s * 0.12} y={y + s * 0.45} width={s * 0.24} height={s * 0.6} fill="#2a1a10" stroke={INK} strokeWidth={2} />
      <path
        d={`M ${x - s * 0.55} ${y + s * 0.45} L ${x} ${y - s * 0.65} L ${x + s * 0.55} ${y + s * 0.45} Z`}
        fill="#1a3a1a"
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path
        d={`M ${x - s * 0.4} ${y + s * 0.2} L ${x} ${y - s * 0.3} L ${x + s * 0.4} ${y + s * 0.2} Z`}
        fill="#2a5a2a"
        stroke={INK}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </g>
  );
}

/**
 * Deterministyczny layout drzew w Puszczy — omija strefy wokół 3 węzłów
 * (ustalone w DUNGEONS seed'zie dla puszczy-cień: 200/300, 500/600, 800/300).
 * Używam seeded PRNG (Mulberry32 light) żeby każdy mount renderował ten sam
 * las — inaczej las „chodzi" przy re-renderach.
 */
function genForestTrees(): ReadonlyArray<{ x: number; y: number; size: number }> {
  const exclusions: ReadonlyArray<{ x: number; y: number; r: number }> = [
    { x: 200, y: 300, r: 140 },
    { x: 500, y: 600, r: 140 },
    { x: 800, y: 300, r: 140 },
  ];
  let seed = 0xdeadbeef;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out: Array<{ x: number; y: number; size: number }> = [];
  for (let i = 0; i < 80; i += 1) {
    const x = 30 + rnd() * 940;
    const y = 60 + rnd() * 900;
    const tooClose = exclusions.some((e) => {
      const dx = x - e.x;
      const dy = y - e.y;
      return dx * dx + dy * dy < e.r * e.r;
    });
    if (tooClose) continue;
    out.push({ x, y, size: 80 + rnd() * 60 });
  }
  return out;
}

// ==================== Dungeon node icons ====================
// Renderowane w środku koła-węzła gdy theme zwraca non-null dla slug'a.
// Każdy to SVG <g> bez transform — pozycjonowanie narzucone z zewnątrz
// przez translate na okrąg. Skala ~80 jednostek.

function CityGateIcon() {
  return (
    <g>
      {/* Mini-miasto — brama + 2 wieże */}
      <rect x={-30} y={-20} width={60} height={40} fill="#8a7860" stroke={INK} strokeWidth={3} />
      <path d="M -10 -20 Q -10 -40, 0 -40 Q 10 -40, 10 -20 Z" fill="#2a1810" stroke={INK} strokeWidth={3} />
      <rect x={-38} y={-32} width={14} height={52} fill="#a89680" stroke={INK} strokeWidth={3} />
      <rect x={24} y={-32} width={14} height={52} fill="#a89680" stroke={INK} strokeWidth={3} />
      <path d="M -38 -32 L -31 -42 L -24 -32 Z" fill="#7a2a2a" stroke={INK} strokeWidth={2} />
      <path d="M 24 -32 L 31 -42 L 38 -32 Z" fill="#7a2a2a" stroke={INK} strokeWidth={2} />
    </g>
  );
}

function CryptIcon() {
  return (
    <g>
      {/* Czaszka nad wejściem do krypty */}
      <circle cx={0} cy={-8} r={20} fill="#f0e8d0" stroke={INK} strokeWidth={3} />
      <ellipse cx={-7} cy={-10} rx={4} ry={5} fill={INK} />
      <ellipse cx={7} cy={-10} rx={4} ry={5} fill={INK} />
      <path d="M -4 0 L -2 6 L 0 0 L 2 6 L 4 0" stroke={INK} strokeWidth={2} fill="none" />
      {/* Łuk wejścia */}
      <path d="M -22 28 L -22 10 Q -22 -4, 0 -4 Q 22 -4, 22 10 L 22 28" stroke={INK} strokeWidth={3} fill="none" />
    </g>
  );
}

function MountainPeakIcon() {
  return (
    <g>
      {/* Dwa szczyty górskie */}
      <path
        d="M -34 22 L -10 -22 L 6 6 L 22 -14 L 34 22 Z"
        fill="#5a4a38"
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d="M -16 -10 L -10 -22 L -4 -10 Z" fill="#f0f0f0" stroke={INK} strokeWidth={2} />
      <path d="M 16 -4 L 22 -14 L 28 -4 Z" fill="#f0f0f0" stroke={INK} strokeWidth={2} />
    </g>
  );
}

function ForestPathIcon() {
  return (
    <g>
      {/* Ścieżka schodząca w głąb lasu, dwa drzewa */}
      <path d="M -8 22 Q 0 0, 8 -18" stroke="#e8d8a0" strokeWidth={6} fill="none" strokeLinecap="round" />
      <g>
        <rect x={-24} y={-4} width={6} height={14} fill="#2a1a10" stroke={INK} strokeWidth={2} />
        <path d="M -34 -4 L -21 -24 L -8 -4 Z" fill="#1a4a1a" stroke={INK} strokeWidth={2} />
      </g>
      <g>
        <rect x={18} y={0} width={6} height={16} fill="#2a1a10" stroke={INK} strokeWidth={2} />
        <path d="M 8 0 L 21 -20 L 34 0 Z" fill="#2a5a2a" stroke={INK} strokeWidth={2} />
      </g>
    </g>
  );
}

function BurialStonesIcon() {
  return (
    <g>
      {/* 3 standing stones */}
      <path
        d="M -26 22 L -26 -6 Q -26 -18, -18 -18 Q -10 -18, -10 -6 L -10 22 Z"
        fill="#8a8278"
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path
        d="M -6 22 L -6 -12 Q -6 -22, 0 -22 Q 6 -22, 6 -12 L 6 22 Z"
        fill="#a89e90"
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path
        d="M 10 22 L 10 -4 Q 10 -16, 18 -16 Q 26 -16, 26 -4 L 26 22 Z"
        fill="#8a8278"
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {/* Runy */}
      <path d="M -20 2 L -16 -4 L -12 2" stroke={INK} strokeWidth={1.5} fill="none" />
      <path d="M -3 -4 L 3 -4 M 0 -8 L 0 0" stroke={INK} strokeWidth={1.5} />
    </g>
  );
}

function AncientTreeIcon() {
  return (
    <g>
      {/* Potężne drzewo z koroną i splątanymi korzeniami */}
      <rect x={-10} y={-6} width={20} height={26} fill="#3a2418" stroke={INK} strokeWidth={3} />
      <path d="M -10 20 L -20 28 M 10 20 L 20 28 M 0 20 L 0 30" stroke={INK} strokeWidth={2} />
      <circle cx={0} cy={-16} r={28} fill="#1a3a1a" stroke={INK} strokeWidth={3} />
      <circle cx={-14} cy={-20} r={12} fill="#2a5a2a" stroke={INK} strokeWidth={2} />
      <circle cx={14} cy={-18} r={10} fill="#2a5a2a" stroke={INK} strokeWidth={2} />
      <circle cx={0} cy={-28} r={8} fill="#3a7a3a" stroke={INK} strokeWidth={2} />
    </g>
  );
}

// ==================== Region 3: Bagna Czarnej Strzygi ====================
// Mokradła, wszędzie woda, martwe wierzby, mgła nad lustrem, błędne ognie.
// Paleta zimno-fioletowa, z czarnymi oczkami wody i karmazynowymi bog
// lantern'ami. Lochy: Mielizny (200,720), Gąszcz (520,420), Obrzędnica (800,180).

function BagnaDecor() {
  const willows = useMemo(() => genDeadWillows(), []);
  const lanterns = useMemo(() => genBogLanterns(), []);
  return (
    <g>
      <defs>
        <radialGradient id="bagna-pool" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#0a0a14" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#1a1828" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#1a1828" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bagna-fog-top" cx="0.5" cy="0" r="0.8">
          <stop offset="0%" stopColor="#786a80" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#786a80" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Górny pas mgły — nad Obrzędnicą */}
      <rect x={0} y={0} width={VIEW} height={280} fill="url(#bagna-fog-top)" />

      {/* Oczka stojącej wody — kilka plam rozłożonych na mapie */}
      <ellipse cx={120} cy={620} rx={120} ry={40} fill="url(#bagna-pool)" />
      <ellipse cx={380} cy={780} rx={140} ry={48} fill="url(#bagna-pool)" />
      <ellipse cx={680} cy={560} rx={120} ry={44} fill="url(#bagna-pool)" />
      <ellipse cx={400} cy={520} rx={90} ry={30} fill="url(#bagna-pool)" />
      <ellipse cx={860} cy={340} rx={110} ry={36} fill="url(#bagna-pool)" />

      {/* Trzciny wystające z wody — cienkie żółto-brązowe paski */}
      {[
        [60, 620], [200, 620], [320, 780], [440, 780],
        [640, 560], [740, 560], [820, 340], [900, 340],
        [160, 860], [260, 880], [580, 840], [700, 880],
      ].map(([x, y], i) => (
        <ReedCluster key={`reed-${i}`} x={x} y={y} />
      ))}

      {/* Martwe wierzby — kilkanaście rozsianych po mapie */}
      {willows.map((w, i) => (
        <DeadWillow key={`willow-${i}`} x={w.x} y={w.y} size={w.size} />
      ))}

      {/* Stary rozwalony mostek przy Mieliznach (koło 200,720) */}
      <g transform="translate(280, 770)">
        <rect x={-60} y={-4} width={120} height={8} fill="#3a2818" stroke={INK} strokeWidth={2} />
        <rect x={-56} y={-18} width={4} height={30} fill="#3a2818" stroke={INK} strokeWidth={2} />
        <rect x={-28} y={-16} width={4} height={28} fill="#3a2818" stroke={INK} strokeWidth={2} />
        <rect x={8} y={-16} width={4} height={28} fill="#3a2818" stroke={INK} strokeWidth={2} />
        <rect x={40} y={-20} width={4} height={32} fill="#3a2818" stroke={INK} strokeWidth={2} />
        {/* jedna deska wygięta — pokazuje że mostek to ruina */}
        <rect x={-56} y={-12} width={50} height={4} transform="rotate(-8 -40 -10)" fill="#3a2818" stroke={INK} strokeWidth={2} />
      </g>

      {/* Kurhan-nieboszczyk na Gąszczu Bolesnym (520,420) — nadłamany grób */}
      <g transform="translate(580, 390)">
        <rect x={-24} y={-16} width={48} height={32} fill="#5a4858" stroke={INK} strokeWidth={3} rx={2} />
        <rect x={-20} y={-28} width={40} height={16} fill="#5a4858" stroke={INK} strokeWidth={3} rx={2} />
        <path d="M -16 -16 L 16 -16" stroke={INK} strokeWidth={2} />
        {/* pęknięcie */}
        <path d="M -6 -28 L 4 16" stroke={INK} strokeWidth={2} opacity={0.6} />
      </g>

      {/* Ołtarz przy Czarnej Obrzędnicy (800,180) — znak w tle */}
      <g transform="translate(860, 120)" opacity={0.65}>
        <path d="M -20 20 L 0 -20 L 20 20 Z" fill="none" stroke="#c83232" strokeWidth={3} />
        <circle cx={0} cy={0} r={6} fill="#c83232" />
      </g>

      {/* Błędne ognie — karmazynowe punkciki */}
      {lanterns.map((l, i) => (
        <BogLantern key={`lantern-${i}`} x={l.x} y={l.y} />
      ))}

      {/* Dolny pas czarnej mgły — najgęstszej */}
      <rect x={0} y={820} width={VIEW} height={180} fill="url(#bagna-fog-bottom)" opacity={0.45} />
      <defs>
        <radialGradient id="bagna-fog-bottom" cx="0.5" cy="1" r="0.8">
          <stop offset="0%" stopColor="#1a1020" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#1a1020" stopOpacity="0" />
        </radialGradient>
      </defs>
    </g>
  );
}

function ReedCluster({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <path d="M -10 0 L -12 -26" stroke="#a88850" strokeWidth={2} strokeLinecap="round" />
      <path d="M 0 0 L 0 -34" stroke="#a88850" strokeWidth={2} strokeLinecap="round" />
      <path d="M 10 0 L 12 -28" stroke="#a88850" strokeWidth={2} strokeLinecap="round" />
      <circle cx={-12} cy={-28} r={2.5} fill="#6a4828" />
      <circle cx={0} cy={-36} r={2.5} fill="#6a4828" />
      <circle cx={12} cy={-30} r={2.5} fill="#6a4828" />
    </g>
  );
}

function DeadWillow({ x, y, size }: { x: number; y: number; size: number }) {
  const s = size;
  return (
    <g>
      {/* Pień — krzywy */}
      <path
        d={`M ${x - s * 0.06} ${y + s * 0.55} Q ${x - s * 0.1} ${y}, ${x} ${y - s * 0.5} Q ${x + s * 0.1} ${y - s * 0.15}, ${x + s * 0.06} ${y + s * 0.55}`}
        fill="#1a0f12"
        stroke={INK}
        strokeWidth={2.5}
      />
      {/* Gałęzie — spadające w dół jak wierzba płacząca */}
      <path d={`M ${x - 2} ${y - s * 0.4} Q ${x - s * 0.4} ${y - s * 0.3}, ${x - s * 0.55} ${y - s * 0.05}`} stroke="#2a1f28" strokeWidth={2.5} fill="none" />
      <path d={`M ${x + 2} ${y - s * 0.42} Q ${x + s * 0.45} ${y - s * 0.35}, ${x + s * 0.6} ${y - s * 0.1}`} stroke="#2a1f28" strokeWidth={2.5} fill="none" />
      <path d={`M ${x} ${y - s * 0.48} Q ${x - s * 0.15} ${y - s * 0.25}, ${x - s * 0.35} ${y - s * 0.1}`} stroke="#2a1f28" strokeWidth={2} fill="none" />
      <path d={`M ${x} ${y - s * 0.48} Q ${x + s * 0.2} ${y - s * 0.25}, ${x + s * 0.4} ${y - s * 0.15}`} stroke="#2a1f28" strokeWidth={2} fill="none" />
    </g>
  );
}

function BogLantern({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={9} fill="#c83232" opacity={0.35} />
      <circle cx={x} cy={y} r={5} fill="#f05060" opacity={0.75} />
      <circle cx={x} cy={y} r={2.5} fill="#fff0e0" />
    </g>
  );
}

function genDeadWillows(): ReadonlyArray<{ x: number; y: number; size: number }> {
  const exclusions: ReadonlyArray<{ x: number; y: number; r: number }> = [
    { x: 200, y: 720, r: 140 },
    { x: 520, y: 420, r: 140 },
    { x: 800, y: 180, r: 140 },
  ];
  let seed = 0xbaadf00d;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out: Array<{ x: number; y: number; size: number }> = [];
  for (let i = 0; i < 22; i += 1) {
    const x = 60 + rnd() * 880;
    const y = 120 + rnd() * 820;
    const tooClose = exclusions.some((e) => {
      const dx = x - e.x;
      const dy = y - e.y;
      return dx * dx + dy * dy < e.r * e.r;
    });
    if (tooClose) continue;
    out.push({ x, y, size: 90 + rnd() * 50 });
  }
  return out;
}

function genBogLanterns(): ReadonlyArray<{ x: number; y: number }> {
  let seed = 0xfeedbeef;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 12; i += 1) {
    out.push({ x: 80 + rnd() * 860, y: 160 + rnd() * 720 });
  }
  return out;
}

// --- Dungeon icons for Region 3 ---

function MarshSurfaceIcon() {
  return (
    <g>
      {/* Powierzchnia wody + 2 trzciny + ręka wystająca */}
      <path d="M -30 10 Q -15 4, 0 10 T 30 10" stroke="#6aa0d8" strokeWidth={3} fill="none" />
      <path d="M -30 22 Q -15 16, 0 22 T 30 22" stroke="#6aa0d8" strokeWidth={3} fill="none" opacity={0.7} />
      {/* Trzciny */}
      <path d="M -18 10 L -20 -20" stroke="#a88850" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={-20} cy={-22} r={2.5} fill="#6a4828" />
      <path d="M 18 10 L 16 -24" stroke="#a88850" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={16} cy={-26} r={2.5} fill="#6a4828" />
      {/* Ręka topielca — otwarta dłoń wystająca z wody */}
      <g>
        <path d="M 0 10 L 0 -8 M -6 -4 L -6 -14 M 6 -4 L 6 -14 M -3 -6 L -3 -18 M 3 -6 L 3 -18" stroke="#d0c8b0" strokeWidth={3} strokeLinecap="round" />
      </g>
    </g>
  );
}

function ThornedThicketIcon() {
  return (
    <g>
      {/* Splątane ciernie — plątanina */}
      <path d="M -28 16 Q -14 -20, 4 -10 Q 20 -2, 28 16" stroke="#3a2418" strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M -22 20 Q 4 6, 24 22" stroke="#3a2418" strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M -18 -4 Q -4 -22, 10 -18" stroke="#3a2418" strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* Kolce na cierniach */}
      <path d="M -10 -8 L -8 -14 M 8 -12 L 10 -18 M 14 0 L 20 -4 M -16 8 L -22 10 M 2 10 L 4 16" stroke={INK} strokeWidth={1.5} />
      {/* Krwawa kropla */}
      <circle cx={18} cy={12} r={3} fill="#8a2a2a" />
    </g>
  );
}

function WitchAltarIcon() {
  return (
    <g>
      {/* Ołtarz z czaszką i czerwoną świecą */}
      <rect x={-22} y={0} width={44} height={20} fill="#4a3a4a" stroke={INK} strokeWidth={3} />
      <rect x={-18} y={-4} width={36} height={6} fill="#3a2a3a" stroke={INK} strokeWidth={2} />
      {/* Czaszka */}
      <circle cx={0} cy={-14} r={12} fill="#f0e8d0" stroke={INK} strokeWidth={2.5} />
      <ellipse cx={-4} cy={-15} rx={2.5} ry={3} fill={INK} />
      <ellipse cx={4} cy={-15} rx={2.5} ry={3} fill={INK} />
      {/* Świeca po lewej */}
      <rect x={-26} y={-14} width={5} height={14} fill="#e8d8b0" stroke={INK} strokeWidth={2} />
      <path d="M -24 -22 Q -22 -18, -23 -14 Q -24 -18, -24 -22" fill="#f05060" stroke={INK} strokeWidth={1.5} />
      {/* Ognik po prawej */}
      <rect x={21} y={-14} width={5} height={14} fill="#e8d8b0" stroke={INK} strokeWidth={2} />
      <path d="M 24 -22 Q 26 -18, 25 -14 Q 24 -18, 24 -22" fill="#f05060" stroke={INK} strokeWidth={1.5} />
      {/* Pentagramowy znak */}
      <path d="M -8 24 L 0 8 L 8 24 Z" fill="none" stroke="#c83232" strokeWidth={2} />
    </g>
  );
}

// ==================== Region 4: Granie Strzelistych Iglic ====================
// Wysokie pasmo. Ostre iglice skalne ze śnieżnymi czapami, lodowa równia u
// podnóża, zamarznięty wodospad przecinający środek. Paleta zimna — biel, lód,
// kamień. Lochy: Lodowa Jaskinia (200,600), Otchłań Skarbnika (750,250).

function GranieDecor() {
  return (
    <g>
      <defs>
        <radialGradient id="granie-mist" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="granie-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#f0c860" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f0c860" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Najdalsze pasmo — bladoniebieskie sylwetki przy horyzoncie */}
      <path
        d="M -10 360 L 60 240 L 140 330 L 240 220 L 340 320 L 460 240 L 580 330 L 700 230 L 820 320 L 940 240 L 1010 320 L 1010 -10 L -10 -10 Z"
        fill="#7a92a8"
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
        opacity={0.85}
      />
      {/* Czapy śniegowe na dalekich szczytach */}
      <path d="M 50 260 L 60 240 L 70 260 Z" fill="#f0f4f8" stroke={INK} strokeWidth={1.5} />
      <path d="M 230 240 L 240 220 L 250 240 Z" fill="#f0f4f8" stroke={INK} strokeWidth={1.5} />
      <path d="M 450 260 L 460 240 L 470 260 Z" fill="#f0f4f8" stroke={INK} strokeWidth={1.5} />
      <path d="M 690 250 L 700 230 L 710 250 Z" fill="#f0f4f8" stroke={INK} strokeWidth={1.5} />
      <path d="M 930 260 L 940 240 L 950 260 Z" fill="#f0f4f8" stroke={INK} strokeWidth={1.5} />

      {/* Średnie pasmo — ciemniejsze, bardziej poszarpane grzbiety */}
      <path
        d="M -10 480 L 50 380 L 100 450 L 170 320 L 240 440 L 320 360 L 400 470 L 500 340 L 580 460 L 680 380 L 770 480 L 870 360 L 1010 460 L 1010 -10 L -10 -10 Z"
        fill="#4a5a6a"
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
        opacity={0.55}
      />

      {/* Iglice — tytułowe ostre wieże skalne. Pomijają strefy węzłów
          (200,600) i (750,250). Ułożone żeby kadrować mapę, nie krzyżować
          ścieżki dashed między lochami. */}
      <SpirePeak x={50} baseY={780} h={460} />
      <SpirePeak x={380} baseY={820} h={540} />
      <SpirePeak x={580} baseY={780} h={470} />
      <SpirePeak x={870} baseY={620} h={290} />
      <SpirePeak x={950} baseY={820} h={500} />

      {/* Zamarznięty wodospad — niebieska wstęga z górnego pasma do lodowej
          równi, między iglicami. Sugeruje pionowy ruch i przerywa monotonię. */}
      <path
        d="M 470 470 Q 458 620, 480 870"
        stroke="#a8d0e0"
        strokeWidth={16}
        fill="none"
        strokeLinecap="round"
        opacity={0.7}
      />
      <path
        d="M 470 470 Q 458 620, 480 870"
        stroke="#e8f4fa"
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
      />

      {/* Lodowa równia u podnóża — szeroki pas chłodnej bieli z pęknięciami */}
      <path
        d="M -20 870 Q 200 830, 380 870 Q 540 905, 700 880 Q 860 860, 1020 880 L 1020 1020 L -20 1020 Z"
        fill="#cce4ec"
        stroke={INK}
        strokeWidth={4}
        strokeLinejoin="round"
        opacity={0.9}
      />
      <path
        d="M 100 920 L 250 940 M 380 905 L 480 950 M 600 920 L 730 940 M 820 925 L 920 950"
        stroke={INK}
        strokeWidth={1.5}
        opacity={0.45}
        fill="none"
      />

      {/* Zaspy w rogach — białe kupy śniegu */}
      <ellipse cx={140} cy={950} rx={150} ry={22} fill="#f8f8f8" stroke={INK} strokeWidth={2} opacity={0.85} />
      <ellipse cx={840} cy={960} rx={130} ry={20} fill="#f8f8f8" stroke={INK} strokeWidth={2} opacity={0.85} />

      {/* Mgła chłodna — łagodzi kontrasty w środku, podkreśla zimno */}
      <ellipse cx={500} cy={720} rx={420} ry={55} fill="url(#granie-mist)" />

      {/* Kryształy lodu rozsiane po lodowej równi */}
      <IceCrystal x={120} y={830} />
      <IceCrystal x={330} y={870} />
      <IceCrystal x={620} y={830} />
      <IceCrystal x={770} y={880} />

      {/* Sugestia szybu kopalni przy Otchłani Skarbnika (750,250) — drobna
          wieża wyciągowa na grzbiecie obok węzła, z poświatą lampki. */}
      <g transform="translate(670, 200)" opacity={0.85}>
        <ellipse cx={20} cy={20} rx={26} ry={18} fill="url(#granie-glow)" />
        <rect x={-4} y={-30} width={6} height={56} fill="#3a2818" stroke={INK} strokeWidth={2} />
        <rect x={36} y={-30} width={6} height={56} fill="#3a2818" stroke={INK} strokeWidth={2} />
        <path d="M -4 -30 L 42 -30 L 19 -54 Z" fill="#5a3a20" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        <circle cx={19} cy={-12} r={4} fill="#f0c860" stroke={INK} strokeWidth={1.5} />
      </g>

      {/* Zamarznięte jezioro u stóp Lodowej Jaskini (200,600) — owalne
          tafelki lodu obok, sugerują że loch wychodzi z lodowca. */}
      <ellipse cx={140} cy={760} rx={90} ry={26} fill="#aac8d8" stroke={INK} strokeWidth={2.5} opacity={0.8} />
      <path d="M 80 760 L 200 760 M 110 750 L 170 770" stroke="#fff" strokeWidth={1.5} opacity={0.7} fill="none" />
    </g>
  );
}

/** Pojedyncza iglica — wąski, wysoki trójkąt ze śnieżną czapą na szczycie. */
function SpirePeak({ x, baseY, h }: { x: number; baseY: number; h: number }) {
  const apex = baseY - h;
  const w = h * 0.18;
  return (
    <g>
      {/* Korpus iglicy — wydłużony trójkąt */}
      <path
        d={`M ${x - w} ${baseY} L ${x} ${apex} L ${x + w} ${baseY} Z`}
        fill="#5a6878"
        stroke={INK}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      {/* Cień po prawej stronie — daje trochę objętości */}
      <path
        d={`M ${x} ${apex} L ${x + w} ${baseY} L ${x + w * 0.3} ${baseY} Z`}
        fill="#3e4c5c"
        opacity={0.55}
      />
      {/* Czapa śnieżna — nieregularny zygzak ostro przy szczycie */}
      <path
        d={`M ${x - w * 0.5} ${apex + h * 0.16} L ${x - w * 0.18} ${apex + h * 0.08} L ${x} ${apex} L ${x + w * 0.22} ${apex + h * 0.1} L ${x + w * 0.5} ${apex + h * 0.16} L ${x + w * 0.25} ${apex + h * 0.2} L ${x} ${apex + h * 0.13} L ${x - w * 0.25} ${apex + h * 0.2} Z`}
        fill="#f8f8f8"
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* Pęknięcie pionowe — tekstura skały */}
      <path
        d={`M ${x - w * 0.25} ${baseY - h * 0.05} L ${x - w * 0.05} ${apex + h * 0.4}`}
        stroke={INK}
        strokeWidth={1.5}
        opacity={0.5}
        fill="none"
      />
    </g>
  );
}

/** Mały kryształ lodu — sześcioramienny błysk na lodowej równi. */
function IceCrystal({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <path
        d="M 0 -11 L 0 11 M -10 -6 L 10 6 M -10 6 L 10 -6"
        stroke="#7ac0d8"
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
      <circle cx={0} cy={0} r={2} fill="#fff" />
    </g>
  );
}

// --- Dungeon icons for Region 4 ---

function IceCaveIcon() {
  return (
    <g>
      {/* Ośnieżony grzbiet nad wejściem */}
      <path
        d="M -32 -10 Q -18 -32, 0 -34 Q 18 -32, 32 -10 Q 18 -22, 4 -24 Q -10 -24, -22 -20 Q -28 -16, -32 -10 Z"
        fill="#f8f8f8"
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* Otwór jaskini — łuk z ciemnym wnętrzem */}
      <path
        d="M -26 24 L -26 -8 Q -26 -24, -12 -28 Q 0 -32, 12 -28 Q 26 -24, 26 -8 L 26 24 Z"
        fill="#1a2838"
        stroke={INK}
        strokeWidth={3}
      />
      {/* Lodowa poświata wewnątrz */}
      <ellipse cx={0} cy={8} rx={14} ry={10} fill="#6aa0c0" opacity={0.45} />
      {/* Sople zwisające z górnej krawędzi otworu */}
      <path d="M -20 -8 L -18 -1 L -16 -8 Z" fill="#a8d8e8" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M -10 -10 L -7 1 L -4 -10 Z" fill="#c8e4ec" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M 4 -10 L 7 -1 L 10 -10 Z" fill="#a8d8e8" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M 14 -8 L 16 -2 L 18 -8 Z" fill="#c8e4ec" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
    </g>
  );
}

function MineShaftIcon() {
  return (
    <g>
      {/* Drewniana rama szybu */}
      <rect x={-22} y={-22} width={6} height={44} fill="#5a3a20" stroke={INK} strokeWidth={2.5} />
      <rect x={16} y={-22} width={6} height={44} fill="#5a3a20" stroke={INK} strokeWidth={2.5} />
      <rect x={-22} y={-26} width={44} height={8} fill="#5a3a20" stroke={INK} strokeWidth={2.5} />
      {/* Wnętrze — ciemny wlot szybu */}
      <rect x={-16} y={-18} width={32} height={40} fill="#0e1218" />
      {/* Skrzyżowane kilofy */}
      <path d="M -10 -8 L 12 16" stroke="#4a3220" strokeWidth={3} strokeLinecap="round" />
      <path d="M 10 -8 L -12 16" stroke="#4a3220" strokeWidth={3} strokeLinecap="round" />
      <path d="M -16 -12 Q -14 -18, -8 -16 Q -6 -10, -10 -8 Z" fill="#9a9a9a" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M 16 -12 Q 14 -18, 8 -16 Q 6 -10, 10 -8 Z" fill="#9a9a9a" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      {/* Lampka kopalniana zwisająca z lewego słupka — wciąż się świeci, sama */}
      <path d="M -19 -22 L -19 -14" stroke={INK} strokeWidth={1.5} />
      <rect x={-23} y={-14} width={8} height={9} fill="#2a1810" stroke={INK} strokeWidth={1.5} />
      <circle cx={-19} cy={-9} r={3.5} fill="#f0c860" />
      <circle cx={-19} cy={-9} r={1.5} fill="#fff5a0" />
    </g>
  );
}

// ==================== Dungeon node ====================

function DungeonNode({
  dungeon,
  charLvl,
  theme,
  onOpen,
}: {
  dungeon: DungeonSummary;
  charLvl: number;
  theme: RegionTheme;
  onOpen: () => void;
}) {
  const { status, mapX, mapY, name, requiredLvl } = dungeon;
  const clickable = status !== 'locked';

  const fill =
    status === 'cleared' ? '#6aaa5a' : status === 'unlocked' ? '#f0c860' : '#8a8070';
  const lvlBadgeFill = charLvl >= requiredLvl ? '#fff3e0' : '#c83232';
  const lvlBadgeText = charLvl >= requiredLvl ? INK : '#fff';

  // Themed ikona lochu — gdy theme zwraca non-null, renderujemy tematyczny
  // sprite zamiast generycznego status-glyph'u. Status pokazujemy wtedy jako
  // mały pip w rogu.
  const themedIcon = theme.dungeonIcon(dungeon.slug);

  return (
    <g
      style={{ cursor: clickable ? 'pointer' : 'not-allowed' }}
      onClick={clickable ? onOpen : undefined}
    >
      {/* Cień pod węzłem */}
      <circle cx={mapX + 4} cy={mapY + 4} r={NODE_R} fill={INK} opacity={0.4} />
      {/* Właściwe koło */}
      <circle cx={mapX} cy={mapY} r={NODE_R} fill={fill} stroke={INK} strokeWidth={5} />

      {/* Ikona w środku — themed jeśli dostępna, inaczej generyczny status-glyph */}
      {themedIcon ? (
        <>
          <g transform={`translate(${mapX}, ${mapY})`} opacity={status === 'locked' ? 0.35 : 1}>
            {themedIcon}
          </g>
          {/* Mały status-pip w prawym-dolnym rogu koła — zachowuje sygnał
              cleared/unlocked/locked bez zasłaniania tematycznej grafiki. */}
          <StatusPip cx={mapX + NODE_R - 20} cy={mapY + NODE_R - 20} status={status} />
        </>
      ) : (
        <GenericStatusGlyph cx={mapX} cy={mapY} status={status} />
      )}

      {/* LVL badge — górny-prawy róg */}
      <g transform={`translate(${mapX + NODE_R - 28}, ${mapY - NODE_R + 16})`}>
        <rect
          x={-42}
          y={-22}
          width={84}
          height={44}
          rx={10}
          fill={lvlBadgeFill}
          stroke={INK}
          strokeWidth={5}
        />
        <text
          x={0}
          y={9}
          textAnchor="middle"
          fontFamily="Luckiest Guy, sans-serif"
          fontSize={32}
          fill={lvlBadgeText}
        >
          L{requiredLvl}
        </text>
      </g>

      {/* Nazwa pod węzłem */}
      <g transform={`translate(${mapX}, ${mapY + NODE_R + 44})`}>
        <rect
          x={-160}
          y={-34}
          width={320}
          height={56}
          rx={10}
          fill="#fff7e0"
          stroke={INK}
          strokeWidth={5}
        />
        <text
          x={0}
          y={6}
          textAnchor="middle"
          fontFamily="Luckiest Guy, sans-serif"
          fontSize={36}
          fill={INK}
        >
          {name.toUpperCase()}
        </text>
      </g>
    </g>
  );
}

/** Mały pip z ikoną statusu (check/arrow/lock) — na themed node'ach. */
function StatusPip({
  cx,
  cy,
  status,
}: {
  cx: number;
  cy: number;
  status: 'locked' | 'unlocked' | 'cleared';
}) {
  const bg =
    status === 'cleared' ? '#3a8a3a' : status === 'unlocked' ? '#f0c860' : '#4a4038';
  return (
    <g>
      <circle cx={cx} cy={cy} r={18} fill={bg} stroke={INK} strokeWidth={4} />
      {status === 'cleared' && (
        <path
          d={`M ${cx - 8} ${cy} L ${cx - 2} ${cy + 6} L ${cx + 9} ${cy - 6}`}
          fill="none"
          stroke="#fff"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {status === 'locked' && (
        <g>
          <path
            d={`M ${cx - 4} ${cy - 2} Q ${cx - 4} ${cy - 10}, ${cx} ${cy - 10} Q ${cx + 4} ${cy - 10}, ${cx + 4} ${cy - 2}`}
            fill="none"
            stroke="#e0e0e0"
            strokeWidth={2}
          />
          <rect x={cx - 7} y={cy - 2} width={14} height={10} rx={2} fill="#e0e0e0" stroke={INK} strokeWidth={1.5} />
        </g>
      )}
      {status === 'unlocked' && (
        <path
          d={`M ${cx - 5} ${cy - 7} L ${cx + 7} ${cy} L ${cx - 5} ${cy + 7} Z`}
          fill={INK}
        />
      )}
    </g>
  );
}

/** Fallback glyph dla lochów bez themed icon'y. */
function GenericStatusGlyph({
  cx,
  cy,
  status,
}: {
  cx: number;
  cy: number;
  status: 'locked' | 'unlocked' | 'cleared';
}) {
  if (status === 'cleared') {
    return (
      <path
        d={`M ${cx - 26} ${cy} L ${cx - 6} ${cy + 20} L ${cx + 28} ${cy - 20}`}
        fill="none"
        stroke="#fff"
        strokeWidth={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }
  if (status === 'locked') {
    return (
      <g>
        <path
          d={`M ${cx - 14} ${cy - 10} Q ${cx - 14} ${cy - 28}, ${cx} ${cy - 28} Q ${cx + 14} ${cy - 28}, ${cx + 14} ${cy - 10}`}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={5}
        />
        <rect
          x={cx - 20}
          y={cy - 10}
          width={40}
          height={32}
          rx={4}
          fill="#e0e0e0"
          stroke={INK}
          strokeWidth={3}
        />
        <circle cx={cx} cy={cy + 6} r={3.5} fill={INK} />
      </g>
    );
  }
  return (
    <path
      d={`M ${cx - 14} ${cy - 20} L ${cx + 18} ${cy} L ${cx - 14} ${cy + 20} Z`}
      fill={INK}
      stroke={INK}
      strokeWidth={2}
    />
  );
}

// ==================== Dungeon row card (lista pod mapą) ====================

function DungeonRowCard({
  dungeon,
  charLvl,
  onOpen,
}: {
  dungeon: DungeonSummary;
  charLvl: number;
  onOpen: () => void;
}) {
  const { status, name, requiredLvl, boss, lockReason } = dungeon;
  const disabled = status === 'locked';
  const statusBadge =
    status === 'cleared'
      ? { text: 'UKOŃCZONY', bg: '#6aaa5a', color: '#fff' }
      : status === 'unlocked'
        ? { text: 'OTWARTY', bg: '#f0c860', color: INK }
        : { text: `LVL ${requiredLvl}+`, bg: '#8a8070', color: '#fff' };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onOpen}
      className="panel-tight"
      style={{
        padding: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: disabled ? '#e0d8c0' : '#fff7e0',
        border: '2.5px solid #2a1810',
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.65 : 1,
        textAlign: 'left',
        width: '100%',
        font: 'inherit',
      }}
      title={disabled ? (lockReason ?? '') : undefined}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="h-title" style={{ fontSize: 14, lineHeight: 1 }}>
          {name}
        </div>
        <div style={{ fontSize: 12, color: '#5a3a2a', marginTop: 2 }}>
          Boss: {boss.name} · LVL {boss.lvl}
        </div>
        {disabled && lockReason && (
          <div style={{ fontSize: 13, color: '#8a3030', marginTop: 3 }}>
            {lockReason}
          </div>
        )}
        {!disabled && charLvl < requiredLvl && (
          <div style={{ fontSize: 13, color: '#8a6030', marginTop: 3 }}>
            Twój LVL {charLvl} — niska szansa
          </div>
        )}
      </div>
      <span
        className="pip"
        style={{
          fontSize: 13,
          background: statusBadge.bg,
          color: statusBadge.color,
          fontWeight: 700,
        }}
      >
        {statusBadge.text}
      </span>
    </button>
  );
}
