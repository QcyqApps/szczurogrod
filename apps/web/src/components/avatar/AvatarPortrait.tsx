// Modular avatar — warstwowy SVG sterowany obiektem `appearance`.
// Wszystkie pola mają sensowne fallbacki, więc stare wywołania też działają.

import type {
  Appearance,
  BeardStyle,
  CharacterClass,
  EyeColorKey,
  EyeStyle,
  HairColorKey,
  HairStyle,
  HeadwearStyle,
  MouthStyle,
  AccessoryStyle,
} from '@grodno/shared';
import { EYE_COLORS, HAIR_COLORS, mergeAppearance, SKIN_TONES } from '@grodno/shared';

const INK = '#2a1810';

interface LayerProps {
  ink: string;
}

function Hair({ style, color, ink }: LayerProps & { style: HairStyle; color: HairColorKey }) {
  if (style === 'bald') return null;
  const c = HAIR_COLORS[color] ?? HAIR_COLORS.brown;
  switch (style) {
    case 'short':
      return (
        <path
          d="M28 34 Q30 20 50 18 Q70 20 72 34 L68 40 Q68 28 50 26 Q32 28 32 40 Z"
          fill={c}
          stroke={ink}
          strokeWidth="3"
        />
      );
    case 'messy':
      return (
        <path
          d="M28 36 Q24 22 34 18 Q38 12 46 18 Q52 10 58 18 Q66 14 68 20 Q76 22 72 38 L68 40 Q66 28 50 26 Q34 28 32 42 Z"
          fill={c}
          stroke={ink}
          strokeWidth="3"
        />
      );
    case 'long':
      return (
        <g>
          <path
            d="M28 36 Q28 20 50 18 Q72 20 72 36 L74 70 L68 72 L68 40 Q66 28 50 26 Q34 28 32 42 L32 72 L26 70 Z"
            fill={c}
            stroke={ink}
            strokeWidth="3"
          />
        </g>
      );
    case 'mohawk':
      return (
        <path
          d="M44 18 L50 6 L56 18 L56 34 L44 34 Z"
          fill={c}
          stroke={ink}
          strokeWidth="3"
        />
      );
    case 'ponytail':
      return (
        <g>
          <path
            d="M30 34 Q30 20 50 18 Q70 20 70 34 L66 40 Q66 28 50 26 Q34 28 34 40 Z"
            fill={c}
            stroke={ink}
            strokeWidth="3"
          />
          <path
            d="M66 34 Q84 34 82 56 Q78 48 70 44 Z"
            fill={c}
            stroke={ink}
            strokeWidth="3"
          />
        </g>
      );
    default:
      return null;
  }
}

function Beard({ style, color, ink }: LayerProps & { style: BeardStyle; color: HairColorKey }) {
  if (style === 'none') return null;
  const c = HAIR_COLORS[color] ?? HAIR_COLORS.brown;
  switch (style) {
    case 'stubble':
      return (
        <path
          d="M40 54 Q50 62 60 54 Q58 58 50 60 Q42 58 40 54 Z"
          fill={c}
          opacity="0.55"
        />
      );
    case 'goatee':
      return (
        <path
          d="M45 56 Q50 68 55 56 Q54 62 50 64 Q46 62 45 56 Z"
          fill={c}
          stroke={ink}
          strokeWidth="2"
        />
      );
    case 'full':
      return (
        <path
          d="M34 52 Q50 72 66 52 Q64 66 50 72 Q36 66 34 52 Z"
          fill={c}
          stroke={ink}
          strokeWidth="2.5"
        />
      );
    default:
      return null;
  }
}

function Eyes({ style, color, ink }: LayerProps & { style: EyeStyle; color: EyeColorKey }) {
  const ec = EYE_COLORS[color] ?? EYE_COLORS.brown;
  switch (style) {
    case 'angry':
      return (
        <g>
          <path d="M37 40 L47 43" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <path d="M53 43 L63 40" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <circle cx="42" cy="46" r="2.2" fill={ec} />
          <circle cx="58" cy="46" r="2.2" fill={ec} />
        </g>
      );
    case 'sleepy':
      return (
        <g>
          <path
            d="M37 44 Q42 42 47 44"
            stroke={ink}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M53 44 Q58 42 63 44"
            stroke={ink}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="42" cy="46" r="1.6" fill={ec} />
          <circle cx="58" cy="46" r="1.6" fill={ec} />
        </g>
      );
    case 'glow':
      return (
        <g>
          <circle cx="42" cy="45" r="3.5" fill="#fff3c0" />
          <circle cx="58" cy="45" r="3.5" fill="#fff3c0" />
          <circle cx="42" cy="45" r="2" fill={ec} />
          <circle cx="58" cy="45" r="2" fill={ec} />
        </g>
      );
    default:
      return (
        <g>
          <circle cx="42" cy="44" r="2.4" fill={ink} />
          <circle cx="58" cy="44" r="2.4" fill={ink} />
          <path d="M37 40 L47 39" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M53 39 L63 40" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
  }
}

function Mouth({ style, ink }: LayerProps & { style: MouthStyle }) {
  switch (style) {
    case 'smirk':
      return (
        <g>
          <path
            d="M43 54 Q50 58 57 54"
            stroke={ink}
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="57" cy="54" r="1.2" fill={ink} />
        </g>
      );
    case 'grin':
      return (
        <path
          d="M40 52 Q50 62 60 52 L58 56 Q50 58 42 56 Z"
          fill={ink}
          strokeLinejoin="round"
        />
      );
    case 'grim':
      return <path d="M42 55 L58 55" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />;
    default:
      return (
        <path
          d="M43 54 Q50 52 57 54"
          stroke={ink}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
      );
  }
}

function Accessory({ style, ink }: LayerProps & { style: AccessoryStyle }) {
  switch (style) {
    case 'scar':
      return <path d="M62 36 L67 46" stroke={ink} strokeWidth="2" strokeLinecap="round" />;
    case 'eyepatch':
      return (
        <g>
          <rect x="52" y="40" width="14" height="10" fill="#2a1810" stroke={ink} strokeWidth="2" />
          <path d="M52 44 L36 42" stroke={ink} strokeWidth="2" />
          <path d="M66 44 L74 46" stroke={ink} strokeWidth="2" />
        </g>
      );
    case 'monocle':
      return (
        <g>
          <circle cx="58" cy="44" r="6" fill="none" stroke={ink} strokeWidth="2" />
          <path d="M64 48 L70 58" stroke={ink} strokeWidth="1.5" />
        </g>
      );
    case 'mask':
      return (
        <rect x="33" y="41" width="34" height="9" fill="#1a1a1a" stroke={ink} strokeWidth="2" />
      );
    default:
      return null;
  }
}

function Headwear({
  style,
  accent,
  ink,
}: LayerProps & { style: Exclude<HeadwearStyle, 'auto'>; accent: string }) {
  const dark = '#2a1810';
  switch (style) {
    case 'helmet':
      return (
        <g>
          <path
            d="M24 30 Q24 14 50 12 Q76 14 76 30 L76 40 L66 40 L66 30 Q66 22 50 22 Q34 22 34 30 L34 40 L24 40 Z"
            fill="#a8a8a0"
            stroke={ink}
            strokeWidth="3"
          />
          <rect x="46" y="32" width="8" height="14" fill={dark} />
          <path
            d="M50 8 L50 14 M44 10 L56 10"
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      );
    case 'wizardHat':
      return (
        <g>
          <path d="M22 30 L50 -4 L78 30 Z" fill="#3a2a6a" stroke={ink} strokeWidth="3" />
          <path
            d="M22 30 Q50 22 78 30 L80 38 Q50 32 20 38 Z"
            fill="#2a1850"
            stroke={ink}
            strokeWidth="3"
          />
          <circle cx="50" cy="10" r="4" fill={accent} stroke={ink} strokeWidth="2" />
          <text x="58" y="20" fontSize="7" fill={accent}>
            ★
          </text>
        </g>
      );
    case 'hood':
      return (
        <g>
          <path
            d="M22 48 Q22 20 50 16 Q78 20 78 48 L72 52 Q72 28 50 24 Q28 28 28 52 Z"
            fill="#1a3a2a"
            stroke={ink}
            strokeWidth="3"
          />
        </g>
      );
    case 'crown':
      return (
        <g>
          <path
            d="M28 22 L34 8 L40 18 L50 4 L60 18 L66 8 L72 22 L70 30 L30 30 Z"
            fill={accent}
            stroke={ink}
            strokeWidth="3"
          />
          <circle cx="50" cy="12" r="2.5" fill="#c83232" stroke={ink} strokeWidth="1.5" />
        </g>
      );
    case 'bandana':
      return (
        <g>
          <path
            d="M24 30 Q30 20 50 20 Q70 20 76 30 L74 38 Q50 30 26 38 Z"
            fill={accent}
            stroke={ink}
            strokeWidth="3"
          />
          <circle cx="36" cy="30" r="1.2" fill="#fff" />
          <circle cx="50" cy="28" r="1.2" fill="#fff" />
          <circle cx="64" cy="30" r="1.2" fill="#fff" />
        </g>
      );
    // ============ Premium ============
    case 'dragonHelm':
      return (
        <g>
          {/* Korpus — symetryczna kopia profilu `helmet`, krwistoczerwona */}
          <path
            d="M24 30 Q24 14 50 12 Q76 14 76 30 L76 42 L66 42 L66 30 Q66 22 50 22 Q34 22 34 30 L34 42 L24 42 Z"
            fill="#5a1810"
            stroke={ink}
            strokeWidth="3"
          />
          {/* Slit twarzowy — pionowy ciemny otwór */}
          <rect
            x="46"
            y="32"
            width="8"
            height="14"
            fill="#0a0404"
            stroke={ink}
            strokeWidth="1.5"
          />
          {/* Centralny szpic na czole — ostry, wystaje w górę */}
          <path
            d="M46 14 L50 4 L54 14 Z"
            fill="#a8a8a0"
            stroke={ink}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Lewy róg smoka — łukowaty, ostry, jasny kostny */}
          <path
            d="M28 22 Q10 8 4 4 Q14 18 26 22 Z"
            fill="#c8c0a8"
            stroke={ink}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Prawy róg — mirror */}
          <path
            d="M72 22 Q90 8 96 4 Q86 18 74 22 Z"
            fill="#c8c0a8"
            stroke={ink}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Łuski na policzkach — drobne myślniki, akcent */}
          <path
            d="M30 36 L34 34 M30 40 L34 38 M70 34 L66 36 M70 38 L66 40"
            stroke={ink}
            strokeWidth="1.2"
            fill="none"
            opacity="0.6"
          />
          {/* Czerwone oczy w slit — glow */}
          <ellipse cx="48" cy="38" rx="1.2" ry="1.6" fill="#ff5028" />
          <ellipse cx="52" cy="38" rx="1.2" ry="1.6" fill="#ff5028" />
        </g>
      );
    case 'lichCrown':
      return (
        <g>
          {/* Gnijąca korona z czaszką — szpiczasta, zardzewiała */}
          <path
            d="M26 26 L30 10 L36 22 L42 8 L50 24 L58 8 L64 22 L70 10 L74 26 L72 32 L28 32 Z"
            fill="#5a4a38"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Zielonkawe klejnoty */}
          <circle cx="36" cy="22" r="1.8" fill="#5af07a" stroke={ink} strokeWidth="1.2" />
          <circle cx="50" cy="22" r="2.2" fill="#5af07a" stroke={ink} strokeWidth="1.2" />
          <circle cx="64" cy="22" r="1.8" fill="#5af07a" stroke={ink} strokeWidth="1.2" />
          {/* Mała czaszka centrycznie pod koroną */}
          <ellipse cx="50" cy="30" rx="3.5" ry="3" fill="#f0e8d0" stroke={ink} strokeWidth="1.5" />
          <circle cx="48.5" cy="30" r="0.8" fill={ink} />
          <circle cx="51.5" cy="30" r="0.8" fill={ink} />
          {/* Pęknięcia/erozja */}
          <path d="M32 18 L34 26 M58 16 L60 24" stroke={ink} strokeWidth="0.8" opacity="0.6" />
        </g>
      );
    case 'valkyrieHelm':
      return (
        <g>
          {/* Hełm bazowy — stal z polerowanym blaskiem */}
          <path
            d="M24 30 Q24 14 50 12 Q76 14 76 30 L76 42 L66 42 L66 30 Q66 22 50 22 Q34 22 34 30 L34 42 L24 42 Z"
            fill="#c8c8c8"
            stroke={ink}
            strokeWidth="3"
          />
          {/* Środkowa nosnik */}
          <rect x="48" y="28" width="4" height="14" fill="#7a7a7a" stroke={ink} strokeWidth="1.5" />
          {/* Skrzydło lewe — pióra */}
          <path
            d="M24 26 L10 18 L12 22 L4 18 L8 26 L2 26 L8 32 L4 34 L14 32 L16 36 L24 32 Z"
            fill="#f0f0f0"
            stroke={ink}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Skrzydło prawe */}
          <path
            d="M76 26 L90 18 L88 22 L96 18 L92 26 L98 26 L92 32 L96 34 L86 32 L84 36 L76 32 Z"
            fill="#f0f0f0"
            stroke={ink}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Akcent na czole — czerwony rubin */}
          <path d="M48 14 L50 10 L52 14 L50 17 Z" fill={accent} stroke={ink} strokeWidth="1.5" />
        </g>
      );
    case 'archmageHat':
      return (
        <g>
          {/* Bardzo wysoki, krzywiący się kapelusz */}
          <path
            d="M22 32 Q34 20 50 -10 Q66 20 78 32 Z"
            fill="#1a1248"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Rondo szerokie */}
          <path
            d="M16 30 Q50 22 84 30 L86 38 Q50 32 14 38 Z"
            fill="#0e0828"
            stroke={ink}
            strokeWidth="3"
          />
          {/* Złota wstęga */}
          <path d="M22 32 Q50 26 78 32 L78 35 Q50 30 22 35 Z" fill="#e8c870" stroke={ink} strokeWidth="1.5" />
          {/* Gwiazdy */}
          <text x="40" y="14" fontSize="6" fill="#e8c870">★</text>
          <text x="56" y="22" fontSize="5" fill="#e8c870">★</text>
          <text x="48" y="6" fontSize="4" fill="#e8c870">★</text>
          {/* Półksiężyc na dole */}
          <path d="M44 28 Q42 26 44 23 Q48 25 46 28 Z" fill="#e8c870" stroke={ink} strokeWidth="1" />
        </g>
      );
    case 'shadowVeil':
      return (
        <g>
          {/* Czarny welon zakrywający górną część twarzy + cienie ramion */}
          <path
            d="M22 16 Q24 38 36 42 L64 42 Q76 38 78 16 Q50 8 22 16 Z"
            fill="#0e0814"
            stroke={ink}
            strokeWidth="3"
            opacity="0.95"
          />
          {/* Aura purpurowa */}
          <path
            d="M22 16 Q50 6 78 16"
            stroke="#7a3aa8"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />
          {/* Drobne błyski */}
          <circle cx="34" cy="22" r="0.8" fill="#c890e8" />
          <circle cx="50" cy="14" r="0.8" fill="#c890e8" />
          <circle cx="68" cy="22" r="0.8" fill="#c890e8" />
          {/* Wycięcie na oczy — biały blask */}
          <path d="M40 36 Q50 32 60 36" stroke="#e0c8f8" strokeWidth="1.5" fill="none" opacity="0.7" />
        </g>
      );
    case 'goldenLaurel':
      return (
        <g>
          {/* Wieniec laurowy — symetryczne liście, NIE zakrywa włosów */}
          <path
            d="M28 32 Q24 26 22 18 Q26 22 30 24 Q28 18 30 12 Q34 18 34 24 Q40 18 44 16 Q42 24 38 28 Q44 24 50 24 Q46 30 42 32 Z"
            fill="#e8c870"
            stroke={ink}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M72 32 Q76 26 78 18 Q74 22 70 24 Q72 18 70 12 Q66 18 66 24 Q60 18 56 16 Q58 24 62 28 Q56 24 50 24 Q54 30 58 32 Z"
            fill="#e8c870"
            stroke={ink}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Środkowy klejnot */}
          <circle cx="50" cy="22" r="2.5" fill={accent} stroke={ink} strokeWidth="1.5" />
        </g>
      );
    case 'hornedHelm':
      return (
        <g>
          {/* Barbarski hełm z dwoma rogami */}
          <path
            d="M26 32 Q26 16 50 14 Q74 16 74 32 L74 42 L66 42 L66 32 Q66 24 50 24 Q34 24 34 32 L34 42 L26 42 Z"
            fill="#7a5028"
            stroke={ink}
            strokeWidth="3"
          />
          {/* Wstawki metalowe */}
          <rect x="46" y="30" width="8" height="12" fill="#2a1810" />
          <path d="M46 30 L54 30 L52 36 L48 36 Z" fill="#a8a8a0" stroke={ink} strokeWidth="1.5" />
          {/* Rogi — duże, łukowate */}
          <path
            d="M26 26 Q12 22 6 8 Q18 14 28 18 Q22 22 26 26 Z"
            fill="#f0e8d0"
            stroke={ink}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M74 26 Q88 22 94 8 Q82 14 72 18 Q78 22 74 26 Z"
            fill="#f0e8d0"
            stroke={ink}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Stutka na rogu */}
          <path d="M14 14 L18 12 M82 12 L86 14" stroke={ink} strokeWidth="0.8" />
        </g>
      );
    default:
      return null;
  }
}

// ==================== Armor ====================
//
// Renderowane na barkach + torsie awatara. Default 'plain' = brak nakładki
// (renderuje się stary trapez tunki w głównym SVG). Premium warianty
// nakładają własną grafikę PRZED rendering trapezu, więc trapez jest niewidoczny.
function Armor({
  style,
  accent,
  ink,
}: LayerProps & { style: import('@grodno/shared').ArmorStyle; accent: string }) {
  switch (style) {
    case 'plate':
      return (
        <g>
          {/* Pełna płyta — torso */}
          <path
            d="M14 96 Q18 64 50 62 Q82 64 86 96 Z"
            fill="#a8a8a0"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Środkowa runa/godło */}
          <path d="M50 72 L46 84 L50 92 L54 84 Z" fill={accent} stroke={ink} strokeWidth="2" />
          {/* Linie pancerza */}
          <path d="M30 80 L70 80 M28 90 L72 90" stroke={ink} strokeWidth="1.5" opacity="0.5" />
          {/* Naramienniki — wybrzuszone z kolcami */}
          <path
            d="M8 78 Q4 64 18 62 Q26 64 28 78 Z"
            fill="#7a7a7a"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M92 78 Q96 64 82 62 Q74 64 72 78 Z"
            fill="#7a7a7a"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M16 64 L14 60 M84 64 L86 60" stroke={ink} strokeWidth="2" />
          {/* Nity */}
          <circle cx="18" cy="74" r="1.6" fill={accent} stroke={ink} strokeWidth="0.8" />
          <circle cx="82" cy="74" r="1.6" fill={accent} stroke={ink} strokeWidth="0.8" />
        </g>
      );
    case 'scale':
      return (
        <g>
          {/* Łuskowy gambeson — baza */}
          <path
            d="M12 96 Q16 64 50 62 Q84 64 88 96 Z"
            fill={accent}
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Wzór łusek — 3 rzędy */}
          {[
            { y: 72, xs: [22, 32, 42, 52, 62, 72] },
            { y: 80, xs: [18, 28, 38, 48, 58, 68, 78] },
            { y: 88, xs: [22, 32, 42, 52, 62, 72] },
          ].map((row, ri) =>
            row.xs.map((x) => (
              <path
                key={`s-${ri}-${x}`}
                d={`M ${x - 4} ${row.y} Q ${x} ${row.y - 4} ${x + 4} ${row.y} Q ${x} ${row.y + 2} ${x - 4} ${row.y} Z`}
                fill="#5a5a5a"
                stroke={ink}
                strokeWidth="1"
              />
            )),
          )}
          {/* Naramienniki łuskowe */}
          <ellipse cx="20" cy="76" rx="11" ry="9" fill="#888" stroke={ink} strokeWidth="3" />
          <ellipse cx="80" cy="76" rx="11" ry="9" fill="#888" stroke={ink} strokeWidth="3" />
        </g>
      );
    case 'arcane':
      return (
        <g>
          {/* Szata maga — falujące fioletowo-niebieskie */}
          <defs>
            <linearGradient id="arcane-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a2a8a" />
              <stop offset="100%" stopColor="#0e0838" />
            </linearGradient>
          </defs>
          <path
            d="M10 96 Q14 62 50 60 Q86 62 90 96 Z"
            fill="url(#arcane-grad)"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Złoty kołnierz */}
          <path d="M36 64 Q50 58 64 64 L62 70 Q50 66 38 70 Z" fill="#e8c870" stroke={ink} strokeWidth="2" />
          {/* Runy */}
          <text x="46" y="80" fontSize="7" fill="#c890e8" stroke={ink} strokeWidth="0.4">✦</text>
          <text x="36" y="92" fontSize="5" fill="#c890e8" stroke={ink} strokeWidth="0.3">✦</text>
          <text x="58" y="92" fontSize="5" fill="#c890e8" stroke={ink} strokeWidth="0.3">✦</text>
          {/* Świetlne smugi */}
          <path d="M22 80 Q26 90 22 96 M78 80 Q74 90 78 96" stroke="#7a4ac8" strokeWidth="1.2" fill="none" opacity="0.7" />
          {/* Naramienniki — fioletowe ze złotem */}
          <ellipse cx="20" cy="76" rx="11" ry="9" fill="#3a2a6a" stroke={ink} strokeWidth="3" />
          <ellipse cx="80" cy="76" rx="11" ry="9" fill="#3a2a6a" stroke={ink} strokeWidth="3" />
          <circle cx="20" cy="76" r="2.5" fill="#e8c870" stroke={ink} strokeWidth="1.2" />
          <circle cx="80" cy="76" r="2.5" fill="#e8c870" stroke={ink} strokeWidth="1.2" />
        </g>
      );
    case 'bone':
      return (
        <g>
          {/* Kościana zbroja — biało-szara baza */}
          <path
            d="M14 96 Q18 64 50 62 Q82 64 86 96 Z"
            fill="#d8d0b8"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Żebra */}
          <path d="M30 74 Q50 70 70 74" stroke={ink} strokeWidth="2.5" fill="none" />
          <path d="M28 80 Q50 76 72 80" stroke={ink} strokeWidth="2.5" fill="none" />
          <path d="M28 86 Q50 82 72 86" stroke={ink} strokeWidth="2.5" fill="none" />
          <path d="M28 92 Q50 88 72 92" stroke={ink} strokeWidth="2.5" fill="none" />
          {/* Centralny mostek */}
          <rect x="48" y="68" width="4" height="28" fill="#a89e80" stroke={ink} strokeWidth="1.5" />
          {/* Mała czaszka na piersi */}
          <ellipse cx="50" cy="70" rx="5" ry="4" fill="#f0e8d0" stroke={ink} strokeWidth="1.5" />
          <circle cx="48" cy="70" r="0.8" fill={ink} />
          <circle cx="52" cy="70" r="0.8" fill={ink} />
          {/* Naramienniki — kolce kostne */}
          <path
            d="M10 80 Q4 64 14 60 L20 64 Q26 70 24 80 Z"
            fill="#d8d0b8"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M90 80 Q96 64 86 60 L80 64 Q74 70 76 80 Z"
            fill="#d8d0b8"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M14 64 L12 58 L16 56 M86 64 L88 58 L84 56" stroke={ink} strokeWidth="2" fill="none" />
        </g>
      );
    case 'dragon':
      return (
        <g>
          {/* Dragon plate — body */}
          <path
            d="M12 96 Q16 64 50 62 Q84 64 88 96 Z"
            fill="#3a1810"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Łuski */}
          {[68, 76, 84, 92].map((y, i) =>
            [22, 32, 42, 52, 62, 72].map((x) => (
              <path
                key={`d-${i}-${x}`}
                d={`M ${x - 4} ${y} Q ${x} ${y - 3} ${x + 4} ${y} Q ${x} ${y + 1} ${x - 4} ${y} Z`}
                fill="#7a2418"
                stroke={ink}
                strokeWidth="0.8"
              />
            )),
          )}
          {/* Pysk smoka centrycznie — paszcza z kłami */}
          <path
            d="M40 70 L50 64 L60 70 L62 76 L56 78 L54 74 L50 76 L46 74 L44 78 L38 76 Z"
            fill="#a8a8a0"
            stroke={ink}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="46" cy="70" r="1.2" fill={accent} />
          <circle cx="54" cy="70" r="1.2" fill={accent} />
          {/* Naramienniki — z kolcami smoczymi */}
          <path
            d="M8 78 Q4 62 16 60 Q24 62 28 78 L24 80 L14 78 Z"
            fill="#5a1810"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M92 78 Q96 62 84 60 Q76 62 72 78 L76 80 L86 78 Z"
            fill="#5a1810"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Rogi/kolce naramienników */}
          <path d="M14 60 L12 52 L16 56 M86 60 L88 52 L84 56" stroke={ink} strokeWidth="2" fill="none" />
          {/* Akcent — diamentowy klejnot */}
          <path d="M50 68 L48 64 L52 64 Z" fill={accent} stroke={ink} strokeWidth="1.5" />
        </g>
      );
    case 'plain':
    default:
      return null;
  }
}

export interface AvatarPortraitProps {
  appearance?: Partial<Appearance> | null;
  cls?: CharacterClass;
  size?: number;
  bgHue?: string;
}

export function AvatarPortrait({
  appearance,
  cls = 'warrior',
  size = 96,
  bgHue,
}: AvatarPortraitProps) {
  const a = mergeAppearance(appearance, cls);
  const ink = INK;
  const skin = SKIN_TONES[a.skin] ?? SKIN_TONES.medium;
  const accent = a.accentColor || '#c83232';

  const bg = bgHue ?? (cls === 'mage' ? '#b8a8e0' : cls === 'rogue' ? '#8ab8a0' : '#e8b870');

  const hidesNativeHair =
    a.headwear === 'wizardHat' ||
    a.headwear === 'hood' ||
    a.headwear === 'crown' ||
    a.headwear === 'bandana' ||
    a.headwear === 'helmet' ||
    a.headwear === 'dragonHelm' ||
    a.headwear === 'lichCrown' ||
    a.headwear === 'valkyrieHelm' ||
    a.headwear === 'archmageHat' ||
    a.headwear === 'shadowVeil' ||
    a.headwear === 'hornedHelm';
  // goldenLaurel jest jedynym premium headwearem nie zakrywającym włosów —
  // wieniec jest cienkim ringiem i pod nim zostaje fryzura.

  const usesPremiumArmor = a.armor !== 'plain';

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>
      <circle cx="50" cy="50" r="48" fill={bg} stroke={ink} strokeWidth="3" />
      <defs>
        <pattern
          id={`ht-${a.skin}-${size}`}
          x="0"
          y="0"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="3" cy="3" r="1" fill={ink} />
        </pattern>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#ht-${a.skin}-${size})`} opacity="0.12" />

      {/* Armor — premium nakładki rysują własny torso + naramienniki.
          Plain pozostawia stary trapez (tunika + szare barki + nity). */}
      {usesPremiumArmor ? (
        <Armor style={a.armor} accent={accent} ink={ink} />
      ) : (
        <>
          <path
            d="M10 96 Q14 68 50 66 Q86 68 90 96 Z"
            fill={accent}
            stroke={ink}
            strokeWidth="3"
          />
          <ellipse cx="20" cy="76" rx="11" ry="9" fill="#888" stroke={ink} strokeWidth="3" />
          <ellipse cx="80" cy="76" rx="11" ry="9" fill="#888" stroke={ink} strokeWidth="3" />
          <circle cx="20" cy="76" r="2.5" fill={accent} stroke={ink} strokeWidth="1.2" />
          <circle cx="80" cy="76" r="2.5" fill={accent} stroke={ink} strokeWidth="1.2" />
        </>
      )}

      <rect x="45" y="56" width="10" height="12" fill={skin.base} stroke={ink} strokeWidth="3" />

      <ellipse cx="50" cy="42" rx="19" ry="21" fill={skin.base} stroke={ink} strokeWidth="3" />
      <path
        d="M32 46 Q36 58 44 62"
        stroke={skin.shadow}
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />

      {!hidesNativeHair && <Hair style={a.hairStyle} color={a.hairColor} ink={ink} />}
      {a.headwear === 'wizardHat' && a.hairStyle !== 'bald' && (
        <path
          d="M30 36 Q30 40 30 48 L34 50 Q34 42 34 38 M70 36 Q70 40 70 48 L66 50 Q66 42 66 38"
          fill={HAIR_COLORS[a.hairColor] ?? HAIR_COLORS.brown}
          stroke={ink}
          strokeWidth="2"
        />
      )}

      <Eyes style={a.eyes} color={a.eyeColor} ink={ink} />
      <Mouth style={a.mouth} ink={ink} />
      <Beard style={a.beardStyle} color={a.hairColor} ink={ink} />
      <Accessory style={a.accessory} ink={ink} />

      <Headwear style={a.headwear} accent={accent} ink={ink} />
    </svg>
  );
}
