// SVG sprite library. Each sprite is a hand-authored SVG string designed
// at a target visual size; we load them into Pixi `Texture` objects at
// stage init so the renderer can use `Sprite` (one drawcall, batched) instead
// of rebuilding `Graphics` every frame. Bigger visual quality + better perf.
//
// Why inline SVG strings vs PNG files: keeps assets in TS so a
// `vite build` makes them part of the JS bundle (no separate fetch, no
// 404 risk on Capacitor), and SVG scales crisply at any DPI without
// pre-rendered mipmaps. Pixi v8 rasterizes the SVG to a bitmap on
// `Texture.from(...)`, so we control the rasterization size via the
// `width`/`height` attributes on the SVG root.
//
// If a future iteration wants real painted sprites (Aseprite output etc.),
// drop PNGs into `public/sprites/` and switch to `Assets.load(url)`.

import { Assets, Texture } from 'pixi.js';
import type { EnemyKind } from '@grodno/shared/survivor';
import type { CharacterClass } from '@grodno/shared';

// ─── Player sprites (3 classes, all face right toward incoming wave) ───

const SVG_WARRIOR = `
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <!-- Sword -->
  <g stroke="#1a0e08" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
    <polygon points="78,42 102,18 108,22 84,46" fill="#cfd1d0"/>
    <line x1="84" y1="44" x2="92" y2="36" stroke="#7a8080" stroke-width="1.5"/>
    <rect x="74" y="40" width="20" height="6" fill="#3a2418"/>
    <rect x="80" y="46" width="8" height="14" fill="#6a4a2a"/>
  </g>
  <!-- Body / tunic -->
  <ellipse cx="60" cy="78" rx="22" ry="26" fill="#8a3a2a" stroke="#1a0e08" stroke-width="3"/>
  <rect x="40" y="86" width="40" height="6" fill="#3a2418" stroke="#1a0e08" stroke-width="2"/>
  <circle cx="60" cy="89" r="3" fill="#ffd76a" stroke="#1a0e08" stroke-width="1.5"/>
  <!-- Pants -->
  <rect x="48" y="100" width="10" height="14" fill="#3a2418" stroke="#1a0e08" stroke-width="2"/>
  <rect x="62" y="100" width="10" height="14" fill="#3a2418" stroke="#1a0e08" stroke-width="2"/>
  <!-- Head -->
  <circle cx="62" cy="48" r="14" fill="#e8c898" stroke="#1a0e08" stroke-width="2"/>
  <!-- Helmet -->
  <path d="M46,48 Q46,28 62,28 Q78,28 78,48 Z" fill="#a08060" stroke="#1a0e08" stroke-width="2.5"/>
  <rect x="60" y="34" width="4" height="14" fill="#1a0e08"/>
  <rect x="54" y="42" width="16" height="3" fill="#1a0e08"/>
  <ellipse cx="62" cy="48" rx="16" ry="3" fill="#a08060" stroke="#1a0e08" stroke-width="2"/>
  <!-- Beard hint -->
  <path d="M54,56 Q62,64 70,56" fill="#3a2418"/>
</svg>`;

const SVG_MAGE = `
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <!-- Staff -->
  <g stroke="#1a0e08" stroke-width="2" stroke-linejoin="round">
    <rect x="84" y="22" width="5" height="86" fill="#6a4a2a"/>
    <circle cx="86.5" cy="22" r="10" fill="#80d0ff" stroke-width="2.5"/>
    <circle cx="89" cy="20" r="3" fill="#ffffff" stroke="none"/>
  </g>
  <!-- Robe -->
  <path d="M30,114 L46,60 L74,60 L90,114 Z" fill="#4a3a8a" stroke="#1a0e08" stroke-width="3" stroke-linejoin="round"/>
  <rect x="42" y="80" width="36" height="6" fill="#2a1a4a" stroke="#1a0e08" stroke-width="2"/>
  <circle cx="60" cy="83" r="3" fill="#ffd76a"/>
  <!-- Robe stripes -->
  <line x1="50" y1="86" x2="44" y2="110" stroke="#3a2a6a" stroke-width="2"/>
  <line x1="60" y1="86" x2="60" y2="110" stroke="#3a2a6a" stroke-width="2"/>
  <line x1="70" y1="86" x2="76" y2="110" stroke="#3a2a6a" stroke-width="2"/>
  <!-- Head -->
  <circle cx="62" cy="48" r="13" fill="#e8c898" stroke="#1a0e08" stroke-width="2"/>
  <!-- Pointy hat -->
  <polygon points="44,48 70,12 80,52" fill="#4a3a8a" stroke="#1a0e08" stroke-width="2.5" stroke-linejoin="round"/>
  <ellipse cx="62" cy="48" rx="20" ry="4" fill="#4a3a8a" stroke="#1a0e08" stroke-width="2"/>
  <polygon points="58,28 60,33 65,33 61,36 63,41 58,38 53,41 55,36 51,33 56,33" fill="#ffd76a"/>
  <!-- Beard -->
  <path d="M52,56 Q62,72 72,56 Q72,64 62,68 Q52,64 52,56 Z" fill="#cfcfcf" stroke="#1a0e08" stroke-width="1.5"/>
</svg>`;

const SVG_ROGUE = `
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <!-- Dagger -->
  <g stroke="#1a0e08" stroke-width="2" stroke-linejoin="round">
    <polygon points="76,52 100,30 105,33 80,56" fill="#cfd1d0"/>
    <rect x="74" y="50" width="10" height="4" fill="#3a2418"/>
    <rect x="76" y="54" width="6" height="8" fill="#6a4a2a"/>
  </g>
  <!-- Cloaked body -->
  <ellipse cx="60" cy="80" rx="20" ry="26" fill="#2a3a2a" stroke="#1a0e08" stroke-width="3"/>
  <!-- Cloak edges -->
  <path d="M40,90 L36,114 L48,108" fill="#1a2a1a" stroke="#1a0e08" stroke-width="2"/>
  <path d="M80,90 L84,114 L72,108" fill="#1a2a1a" stroke="#1a0e08" stroke-width="2"/>
  <!-- Hood -->
  <path d="M44,52 Q50,28 60,28 Q70,28 76,52 Q72,58 60,58 Q48,58 44,52 Z" fill="#2a3a2a" stroke="#1a0e08" stroke-width="2.5"/>
  <!-- Face shadow -->
  <ellipse cx="60" cy="48" rx="11" ry="9" fill="#0e1810"/>
  <!-- Eyes glint -->
  <circle cx="56" cy="46" r="1.8" fill="#ffd76a"/>
  <circle cx="64" cy="46" r="1.8" fill="#ffd76a"/>
  <!-- Belt -->
  <rect x="42" y="84" width="36" height="4" fill="#1a1a1a" stroke="#1a0e08" stroke-width="1.5"/>
  <!-- Pants -->
  <rect x="48" y="100" width="10" height="12" fill="#1a2a1a" stroke="#1a0e08" stroke-width="2"/>
  <rect x="62" y="100" width="10" height="12" fill="#1a2a1a" stroke="#1a0e08" stroke-width="2"/>
</svg>`;

// ─── Enemy sprites ───

const SVG_GOBLIN = `
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <!-- Club -->
  <g stroke="#1a0e08" stroke-width="2" stroke-linejoin="round">
    <rect x="6" y="14" width="5" height="32" fill="#6a4a2a"/>
    <ellipse cx="8.5" cy="14" rx="8" ry="6" fill="#6a4a2a"/>
  </g>
  <!-- Body -->
  <ellipse cx="42" cy="50" rx="18" ry="22" fill="#4a8a3a" stroke="#1a0e08" stroke-width="2.5"/>
  <!-- Loincloth -->
  <rect x="28" y="62" width="28" height="6" fill="#6a4a2a" stroke="#1a0e08" stroke-width="1.5"/>
  <!-- Head -->
  <circle cx="42" cy="26" r="14" fill="#5a9a44" stroke="#1a0e08" stroke-width="2.5"/>
  <!-- Pointed ears -->
  <polygon points="28,22 18,12 30,18" fill="#5a9a44" stroke="#1a0e08" stroke-width="1.5"/>
  <polygon points="56,22 66,12 54,18" fill="#5a9a44" stroke="#1a0e08" stroke-width="1.5"/>
  <!-- Eyes -->
  <circle cx="36" cy="26" r="3" fill="#ffd76a"/>
  <circle cx="36" cy="26" r="1.5" fill="#1a0e08"/>
  <circle cx="48" cy="26" r="3" fill="#ffd76a"/>
  <circle cx="48" cy="26" r="1.5" fill="#1a0e08"/>
  <!-- Teeth grin -->
  <path d="M34,32 L42,38 L50,32" fill="none" stroke="#1a0e08" stroke-width="1.5"/>
  <polygon points="40,33 42,37 44,33" fill="#fff0c8"/>
  <!-- Nose -->
  <polygon points="42,28 39,32 45,32" fill="#3a6a28"/>
</svg>`;

const SVG_BANDIT = `
<svg xmlns="http://www.w3.org/2000/svg" width="76" height="76" viewBox="0 0 76 76">
  <!-- Knife -->
  <g stroke="#1a0e08" stroke-width="1.5" stroke-linejoin="round">
    <polygon points="14,38 4,28 2,32 12,40" fill="#cfd1d0"/>
    <rect x="11" y="38" width="4" height="6" fill="#1a1a1a"/>
  </g>
  <!-- Cloaked body -->
  <ellipse cx="40" cy="48" rx="16" ry="22" fill="#6a5a3a" stroke="#1a0e08" stroke-width="2.5"/>
  <!-- Hood (over head) -->
  <path d="M22,30 Q26,8 40,8 Q54,8 58,30 Q56,38 40,38 Q24,38 22,30 Z"
        fill="#5a4a30" stroke="#1a0e08" stroke-width="2.5"/>
  <!-- Face shadow -->
  <ellipse cx="40" cy="26" rx="11" ry="9" fill="#1a1a1a"/>
  <!-- Eyes glint -->
  <circle cx="36" cy="24" r="1.6" fill="#c83232"/>
  <circle cx="44" cy="24" r="1.6" fill="#c83232"/>
  <!-- Mask line -->
  <rect x="29" y="29" width="22" height="2" fill="#1a0e08"/>
  <!-- Belt -->
  <rect x="26" y="56" width="28" height="4" fill="#1a0e08"/>
  <circle cx="40" cy="58" r="2" fill="#ffd76a"/>
</svg>`;

const SVG_ORC = `
<svg xmlns="http://www.w3.org/2000/svg" width="92" height="92" viewBox="0 0 92 92">
  <!-- Shoulders + spikes -->
  <g stroke="#1a0e08" stroke-width="2" fill="#1a0e08">
    <polygon points="22,28 26,16 30,28"/>
    <polygon points="46,24 50,12 54,24"/>
    <polygon points="62,28 66,16 70,28"/>
  </g>
  <!-- Body -->
  <circle cx="46" cy="46" r="28" fill="#3a5a2a" stroke="#1a0e08" stroke-width="3"/>
  <!-- Belly armor plate -->
  <ellipse cx="46" cy="58" rx="14" ry="10" fill="#2a4a1a" stroke="#1a0e08" stroke-width="2"/>
  <!-- Head merging into body -->
  <circle cx="46" cy="38" r="14" fill="#3a5a2a" stroke="none"/>
  <!-- Eye -->
  <circle cx="40" cy="36" r="4" fill="#c83232"/>
  <circle cx="40" cy="36" r="1.8" fill="#1a0e08"/>
  <circle cx="52" cy="36" r="4" fill="#c83232"/>
  <circle cx="52" cy="36" r="1.8" fill="#1a0e08"/>
  <!-- Tusks -->
  <polygon points="38,46 36,54 42,50" fill="#fff0c8" stroke="#1a0e08" stroke-width="1"/>
  <polygon points="54,46 56,54 50,50" fill="#fff0c8" stroke="#1a0e08" stroke-width="1"/>
  <!-- Mouth line -->
  <path d="M40,48 L52,48" stroke="#1a0e08" stroke-width="1.5"/>
  <!-- Forehead scar -->
  <path d="M42,28 L48,34" stroke="#1a0e08" stroke-width="2"/>
</svg>`;

const SVG_SKELETON = `
<svg xmlns="http://www.w3.org/2000/svg" width="76" height="76" viewBox="0 0 76 76">
  <!-- Bow -->
  <g fill="none" stroke-linejoin="round">
    <path d="M14,16 Q4,38 14,60" stroke="#6a4a2a" stroke-width="2.5"/>
    <line x1="14" y1="16" x2="14" y2="60" stroke="#fff0c8" stroke-width="1"/>
  </g>
  <!-- Ribcage -->
  <ellipse cx="40" cy="48" rx="14" ry="20" fill="#cfd1d0" stroke="#1a0e08" stroke-width="2.5"/>
  <line x1="32" y1="38" x2="48" y2="38" stroke="#1a0e08" stroke-width="1.5"/>
  <line x1="30" y1="44" x2="50" y2="44" stroke="#1a0e08" stroke-width="1.5"/>
  <line x1="30" y1="50" x2="50" y2="50" stroke="#1a0e08" stroke-width="1.5"/>
  <line x1="32" y1="56" x2="48" y2="56" stroke="#1a0e08" stroke-width="1.5"/>
  <line x1="40" y1="32" x2="40" y2="62" stroke="#1a0e08" stroke-width="1.5"/>
  <!-- Skull -->
  <circle cx="40" cy="22" r="12" fill="#efe6cf" stroke="#1a0e08" stroke-width="2.5"/>
  <ellipse cx="35" cy="22" rx="3" ry="4" fill="#1a0e08"/>
  <ellipse cx="45" cy="22" rx="3" ry="4" fill="#1a0e08"/>
  <rect x="35" y="28" width="2" height="3" fill="#1a0e08"/>
  <rect x="39" y="28" width="2" height="3" fill="#1a0e08"/>
  <rect x="43" y="28" width="2" height="3" fill="#1a0e08"/>
  <path d="M34,33 L40,30 L46,33" fill="none" stroke="#1a0e08" stroke-width="1.5"/>
  <!-- Pelvis hint -->
  <ellipse cx="40" cy="68" rx="10" ry="3" fill="#cfd1d0" stroke="#1a0e08" stroke-width="1.5"/>
</svg>`;

const SVG_SLIME = `
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="100" viewBox="0 0 120 100">
  <!-- Body shape -->
  <path d="M10,80 Q10,30 60,18 Q110,30 110,80 Z"
        fill="#5aac4a" stroke="#1a0e08" stroke-width="3" stroke-linejoin="round"/>
  <!-- Highlight -->
  <ellipse cx="40" cy="35" rx="14" ry="6" fill="#a8e89a" opacity="0.7"/>
  <!-- Drip below -->
  <ellipse cx="32" cy="86" rx="6" ry="4" fill="#5aac4a" stroke="#1a0e08" stroke-width="2"/>
  <ellipse cx="84" cy="88" rx="5" ry="3.5" fill="#5aac4a" stroke="#1a0e08" stroke-width="2"/>
  <!-- Eyes -->
  <circle cx="46" cy="50" r="9" fill="#ffffff" stroke="#1a0e08" stroke-width="2"/>
  <circle cx="49" cy="52" r="4.5" fill="#1a0e08"/>
  <circle cx="50" cy="50" r="1.8" fill="#ffffff"/>
  <circle cx="74" cy="50" r="9" fill="#ffffff" stroke="#1a0e08" stroke-width="2"/>
  <circle cx="77" cy="52" r="4.5" fill="#1a0e08"/>
  <circle cx="78" cy="50" r="1.8" fill="#ffffff"/>
  <!-- Mouth -->
  <path d="M46,68 Q60,78 74,68" fill="none" stroke="#1a0e08" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

const SVG_LICH = `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="120" viewBox="0 0 100 120">
  <!-- Robe -->
  <path d="M14,114 L34,38 L66,38 L86,114 Z" fill="#6a4a8a" stroke="#1a0e08" stroke-width="3" stroke-linejoin="round"/>
  <!-- Robe inner shadow -->
  <path d="M30,114 L40,50 L60,50 L70,114 Z" fill="#4a2a6a" opacity="0.6"/>
  <!-- Hood -->
  <path d="M28,40 Q32,8 50,8 Q68,8 72,40 Q66,52 50,52 Q34,52 28,40 Z"
        fill="#6a4a8a" stroke="#1a0e08" stroke-width="3"/>
  <!-- Skull face -->
  <ellipse cx="50" cy="36" rx="15" ry="14" fill="#efe6cf" stroke="#1a0e08" stroke-width="2"/>
  <!-- Glowing eyes -->
  <circle cx="44" cy="34" r="4" fill="#80d0ff"/>
  <circle cx="44" cy="34" r="2" fill="#ffffff"/>
  <circle cx="56" cy="34" r="4" fill="#80d0ff"/>
  <circle cx="56" cy="34" r="2" fill="#ffffff"/>
  <!-- Skull mouth -->
  <rect x="44" y="42" width="2" height="3" fill="#1a0e08"/>
  <rect x="48" y="42" width="2" height="3" fill="#1a0e08"/>
  <rect x="52" y="42" width="2" height="3" fill="#1a0e08"/>
  <!-- Staff -->
  <rect x="78" y="14" width="5" height="92" fill="#3a1a4a" stroke="#1a0e08" stroke-width="2"/>
  <circle cx="80.5" cy="14" r="9" fill="#80d0ff" stroke="#1a0e08" stroke-width="2"/>
  <circle cx="83" cy="11" r="2.5" fill="#ffffff"/>
</svg>`;

const SVG_DEMON_KING = `
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <!-- Body -->
  <ellipse cx="60" cy="80" rx="32" ry="28" fill="#c83232" stroke="#1a0e08" stroke-width="3"/>
  <!-- Belt -->
  <rect x="32" y="92" width="56" height="6" fill="#1a0e08"/>
  <circle cx="60" cy="95" r="4" fill="#ffd76a" stroke="#1a0e08" stroke-width="1.5"/>
  <!-- Head -->
  <ellipse cx="60" cy="48" rx="22" ry="20" fill="#a02828" stroke="#1a0e08" stroke-width="3"/>
  <!-- Horns -->
  <polygon points="42,32 28,8 48,24" fill="#1a0e08"/>
  <polygon points="78,32 92,8 72,24" fill="#1a0e08"/>
  <!-- Crown between horns -->
  <polygon points="44,18 50,10 54,18 60,8 66,18 70,10 76,18 76,22 44,22"
           fill="#ffd76a" stroke="#1a0e08" stroke-width="2"/>
  <circle cx="60" cy="13" r="3" fill="#c83232" stroke="#1a0e08" stroke-width="1"/>
  <!-- Glowing eyes -->
  <ellipse cx="50" cy="46" rx="6" ry="4" fill="#ffd76a"/>
  <ellipse cx="50" cy="46" rx="3" ry="2" fill="#ffffff"/>
  <ellipse cx="70" cy="46" rx="6" ry="4" fill="#ffd76a"/>
  <ellipse cx="70" cy="46" rx="3" ry="2" fill="#ffffff"/>
  <!-- Snarl -->
  <path d="M44,58 Q60,68 76,58" fill="none" stroke="#1a0e08" stroke-width="2.5"/>
  <polygon points="50,58 52,66 54,58" fill="#fff0c8" stroke="#1a0e08" stroke-width="1"/>
  <polygon points="66,58 68,66 70,58" fill="#fff0c8" stroke="#1a0e08" stroke-width="1"/>
  <!-- Beard hint -->
  <path d="M48,68 Q60,82 72,68 Q72,76 60,80 Q48,76 48,68 Z" fill="#1a0e08"/>
</svg>`;

const ENEMY_SVG: Record<EnemyKind, string> = {
  rat_walker: SVG_GOBLIN,
  rat_fast: SVG_BANDIT,
  rat_tank: SVG_ORC,
  rat_ranged: SVG_SKELETON,
  sewer_worm: SVG_SLIME,
  lich_szczur: SVG_LICH,
  rat_king: SVG_DEMON_KING,
};

const PLAYER_SVG: Record<CharacterClass, string> = {
  warrior: SVG_WARRIOR,
  mage: SVG_MAGE,
  rogue: SVG_ROGUE,
};

// ─── Stage backgrounds (per-stage thematic floor, 800×450) ───
//
// **Hard rule (DO NOT BREAK):** Każdy stage to **pełnoekranowy floor**.
// Cała mapa jest powierzchnią po której chodzą potwory, więc backgroundy
// NIE mogą zawierać żadnych "obiektów 3D":
//   - bez budynków, murów, baszt, arkad, ruin
//   - bez drzew (pełnowymiarowych ani sylwetek)
//   - bez nagrobków, kół, beczek, skrzyń
//   - bez postaci, zwierząt, NPC
//   - bez nieba/horyzontu (cała mapa to PODŁOGA z lotu ptaka)
//
// Klimat oddajemy tylko przez:
//   - kolor + gradient podłoża (trawa / mokra cegła / popękany bruk)
//   - flat patterny textury (kępki trawy, fugi cegieł, pęknięcia)
//   - flat plamy painterskie (mech, błoto, dust, kwiaty jako kropki)
//   - subtle vignette na krawędziach
//
// Wszystko musi czytać się jako rysunek z lotu ptaka, nie scena 3D z głębią.
// Wcześniejsze próby z budynkami/drzewami w pasach top/bottom wyglądały
// jakby mob deptał po nich — nie wracać.
//
// Render layered jako pojedynczy Sprite na dnie stage'u — pod wrogami, pod
// pociskami. Szczegóły są low-contrast żeby nie rywalizowały z spritami
// botów które są wysokie kontrastowo.
//
// Wymiar 800×450 = WORLD.{width,height}. Zmieniasz WORLD → zaktualizuj
// viewBox + width/height tutaj.

// ───── Stage 1 — Bramy Szczurogrodu (top-down trawiasta murawa) ─────
const SVG_STAGE_GATES = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="g1-grass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6a8a4a"/>
      <stop offset="0.5" stop-color="#5e7c40"/>
      <stop offset="1" stop-color="#506a36"/>
    </linearGradient>
    <pattern id="g1-tuft" x="0" y="0" width="40" height="32" patternUnits="userSpaceOnUse">
      <path d="M5 22 L5 17 M7 22 L8 18 M3 22 L2 19" stroke="#7aa05a" stroke-width="1" stroke-linecap="round" opacity="0.7"/>
      <path d="M22 28 L22 24 M24 28 L25 25 M20 28 L19 25" stroke="#3a5a2a" stroke-width="1" stroke-linecap="round" opacity="0.85"/>
      <path d="M32 12 L32 8 M34 12 L35 9" stroke="#5a7a3a" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
    </pattern>
    <pattern id="g1-tuft-2" x="20" y="14" width="64" height="48" patternUnits="userSpaceOnUse">
      <path d="M14 32 L14 26 M16 32 L17 28" stroke="#496a30" stroke-width="0.9" stroke-linecap="round" opacity="0.65"/>
      <path d="M44 40 L44 35 M46 40 L47 36 M42 40 L41 36" stroke="#2e441e" stroke-width="0.9" stroke-linecap="round" opacity="0.7"/>
    </pattern>
    <pattern id="g1-pebbles" x="0" y="0" width="120" height="100" patternUnits="userSpaceOnUse">
      <ellipse cx="20" cy="30" rx="3" ry="2" fill="#8a8068" opacity="0.45"/>
      <ellipse cx="84" cy="14" rx="2.5" ry="1.8" fill="#736a55" opacity="0.4"/>
      <ellipse cx="60" cy="76" rx="3" ry="2" fill="#8a8068" opacity="0.45"/>
      <ellipse cx="100" cy="60" rx="2.2" ry="1.6" fill="#736a55" opacity="0.4"/>
    </pattern>
    <radialGradient id="g1-vignette" cx="0.5" cy="0.5" r="0.78">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#1a0e08" stop-opacity="0.32"/>
    </radialGradient>
  </defs>

  <!-- Base grass -->
  <rect width="800" height="450" fill="url(#g1-grass)"/>

  <!-- Worn dirt patches (flat, jak ślady deptania — bez głębi 3D) -->
  <g fill="#7a6244">
    <ellipse cx="180" cy="110" rx="120" ry="34" opacity="0.22"/>
    <ellipse cx="560" cy="180" rx="160" ry="38" opacity="0.2"/>
    <ellipse cx="320" cy="280" rx="180" ry="42" opacity="0.22"/>
    <ellipse cx="640" cy="360" rx="140" ry="32" opacity="0.2"/>
    <ellipse cx="120" cy="380" rx="100" ry="28" opacity="0.22"/>
  </g>
  <!-- Darker color blotches (zacienione miejsca, bujniejsza trawa) -->
  <g fill="#3a5226">
    <ellipse cx="420" cy="60" rx="110" ry="22" opacity="0.32"/>
    <ellipse cx="80" cy="220" rx="90" ry="24" opacity="0.3"/>
    <ellipse cx="700" cy="80" rx="80" ry="20" opacity="0.32"/>
    <ellipse cx="500" cy="410" rx="120" ry="26" opacity="0.3"/>
    <ellipse cx="240" cy="190" rx="70" ry="18" opacity="0.28"/>
  </g>

  <!-- Grass tuft pattern (główna tekstura) -->
  <rect width="800" height="450" fill="url(#g1-tuft)"/>
  <rect width="800" height="450" fill="url(#g1-tuft-2)"/>

  <!-- Tiny pebbles scattered -->
  <rect width="800" height="450" fill="url(#g1-pebbles)"/>

  <!-- Flat painted flowers (kropki kolorów, nie 3D obiekty) -->
  <g>
    <circle cx="68" cy="84" r="2.4" fill="#ffd76a"/>
    <circle cx="142" cy="248" r="2.4" fill="#c83232"/>
    <circle cx="220" cy="64" r="2.4" fill="#e0a8d8"/>
    <circle cx="296" cy="324" r="2.4" fill="#ffd76a"/>
    <circle cx="384" cy="144" r="2.4" fill="#e0a8d8"/>
    <circle cx="446" cy="92" r="2.4" fill="#c83232"/>
    <circle cx="528" cy="332" r="2.4" fill="#ffd76a"/>
    <circle cx="612" cy="232" r="2.4" fill="#e0a8d8"/>
    <circle cx="680" cy="404" r="2.4" fill="#c83232"/>
    <circle cx="744" cy="156" r="2.4" fill="#ffd76a"/>
    <circle cx="356" cy="408" r="2.4" fill="#e0a8d8"/>
    <circle cx="92" cy="356" r="2.4" fill="#ffd76a"/>
  </g>

  <!-- Soft vignette -->
  <rect width="800" height="450" fill="url(#g1-vignette)"/>
</svg>`;

// ───── Stage 2 — Kanały (top-down mokra kamienna posadzka) ─────
const SVG_STAGE_SEWERS = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="g2-base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a3e3e"/>
      <stop offset="0.5" stop-color="#363a3a"/>
      <stop offset="1" stop-color="#2c302e"/>
    </linearGradient>
    <pattern id="g2-cobble" x="0" y="0" width="56" height="40" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="56" height="40" fill="#3e4242"/>
      <ellipse cx="14" cy="12" rx="11" ry="8" fill="#4a4e48" stroke="#1a1e1a" stroke-width="0.9"/>
      <ellipse cx="40" cy="14" rx="10" ry="7" fill="#525848" stroke="#1a1e1a" stroke-width="0.9"/>
      <ellipse cx="6" cy="32" rx="9" ry="6" fill="#4a4e48" stroke="#1a1e1a" stroke-width="0.9"/>
      <ellipse cx="30" cy="34" rx="11" ry="7" fill="#525848" stroke="#1a1e1a" stroke-width="0.9"/>
      <ellipse cx="52" cy="34" rx="6" ry="5" fill="#46484a" stroke="#1a1e1a" stroke-width="0.9"/>
      <!-- subtle highlights na top-left każdego kamienia -->
      <ellipse cx="11" cy="9" rx="4" ry="2.5" fill="#5a605a" opacity="0.4"/>
      <ellipse cx="37" cy="11" rx="4" ry="2.5" fill="#62685a" opacity="0.4"/>
      <ellipse cx="27" cy="31" rx="4" ry="2.5" fill="#62685a" opacity="0.4"/>
    </pattern>
    <radialGradient id="g2-vignette" cx="0.5" cy="0.5" r="0.78">
      <stop offset="0.45" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
  </defs>

  <!-- Base stone -->
  <rect width="800" height="450" fill="url(#g2-base)"/>

  <!-- Cobble pattern -->
  <rect width="800" height="450" fill="url(#g2-cobble)"/>

  <!-- Wet/damp dark patches (flat plamy wilgoci) -->
  <g fill="#0e1212">
    <ellipse cx="160" cy="100" rx="90" ry="22" opacity="0.4"/>
    <ellipse cx="440" cy="60" rx="120" ry="20" opacity="0.32"/>
    <ellipse cx="640" cy="140" rx="110" ry="24" opacity="0.42"/>
    <ellipse cx="220" cy="240" rx="140" ry="28" opacity="0.38"/>
    <ellipse cx="540" cy="280" rx="130" ry="26" opacity="0.42"/>
    <ellipse cx="320" cy="380" rx="160" ry="30" opacity="0.45"/>
    <ellipse cx="700" cy="380" rx="100" ry="22" opacity="0.4"/>
    <ellipse cx="80" cy="370" rx="90" ry="20" opacity="0.4"/>
  </g>

  <!-- Greenish moss/algae stains rosnące w fugach -->
  <g fill="#3a5a2a">
    <ellipse cx="120" cy="180" rx="40" ry="10" opacity="0.35"/>
    <ellipse cx="380" cy="160" rx="50" ry="12" opacity="0.32"/>
    <ellipse cx="600" cy="220" rx="46" ry="11" opacity="0.35"/>
    <ellipse cx="240" cy="320" rx="60" ry="14" opacity="0.4"/>
    <ellipse cx="500" cy="400" rx="52" ry="12" opacity="0.4"/>
    <ellipse cx="720" cy="300" rx="44" ry="10" opacity="0.34"/>
  </g>

  <!-- Slime puddles z lekkim shimmerem (flat color + cienka linia) -->
  <g>
    <ellipse cx="200" cy="220" rx="36" ry="9" fill="#2e4838" opacity="0.85"/>
    <path d="M170 218 Q200 214 232 218" stroke="#5aac4a" stroke-width="1.2" fill="none" opacity="0.55"/>

    <ellipse cx="560" cy="120" rx="32" ry="8" fill="#2e4838" opacity="0.85"/>
    <path d="M534 119 Q560 116 588 119" stroke="#5aac4a" stroke-width="1.2" fill="none" opacity="0.55"/>

    <ellipse cx="380" cy="340" rx="40" ry="10" fill="#2e4838" opacity="0.85"/>
    <path d="M346 338 Q380 334 416 338" stroke="#5aac4a" stroke-width="1.2" fill="none" opacity="0.55"/>

    <ellipse cx="660" cy="80" rx="28" ry="7" fill="#2e4838" opacity="0.85"/>
    <path d="M640 79 Q660 76 682 79" stroke="#5aac4a" stroke-width="1.2" fill="none" opacity="0.55"/>
  </g>

  <!-- Centralna spoina/odpływ jako lekko ciemniejszy pas (flat) -->
  <rect x="0" y="222" width="800" height="6" fill="#1a1e1a" opacity="0.45"/>
  <rect x="0" y="222" width="800" height="1" fill="#0a0e10" opacity="0.6"/>
  <rect x="0" y="227" width="800" height="1" fill="#0a0e10" opacity="0.6"/>

  <!-- Cracks / fugi międzyceglane (flat ciemne linie) -->
  <g stroke="#0a0e10" fill="none" stroke-width="0.8" opacity="0.45">
    <path d="M40 50 L120 64 L200 58 L280 72"/>
    <path d="M340 90 L440 102 L520 96 L620 110"/>
    <path d="M700 60 L780 74"/>
    <path d="M0 320 L80 332 L180 326"/>
    <path d="M260 410 L340 420 L460 414 L580 426"/>
    <path d="M620 360 L760 376"/>
  </g>

  <!-- Vignette (mocny — kanały są ciemne) -->
  <rect width="800" height="450" fill="url(#g2-vignette)"/>
</svg>`;

// ───── Stage 3 — Podgrodzie (top-down popękany, zniszczony bruk) ─────
const SVG_STAGE_OUTSKIRTS = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="g3-base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a4248"/>
      <stop offset="0.5" stop-color="#3e3438"/>
      <stop offset="1" stop-color="#2e2630"/>
    </linearGradient>
    <pattern id="g3-cobble" x="0" y="0" width="56" height="44" patternUnits="userSpaceOnUse">
      <polygon points="2,2 22,4 26,20 10,22 0,14" fill="#5a525a" stroke="#1a0e10" stroke-width="0.7" opacity="0.7"/>
      <polygon points="26,2 50,4 54,22 36,24 26,14" fill="#52484e" stroke="#1a0e10" stroke-width="0.7" opacity="0.7"/>
      <polygon points="2,24 18,24 22,42 10,42 0,34" fill="#534850" stroke="#1a0e10" stroke-width="0.7" opacity="0.7"/>
      <polygon points="22,26 46,26 54,42 32,42" fill="#5a525a" stroke="#1a0e10" stroke-width="0.7" opacity="0.7"/>
      <!-- subtle worn highlights -->
      <ellipse cx="13" cy="9" rx="6" ry="2" fill="#6a606a" opacity="0.35"/>
      <ellipse cx="40" cy="11" rx="7" ry="2" fill="#605660" opacity="0.35"/>
    </pattern>
    <radialGradient id="g3-vignette" cx="0.5" cy="0.5" r="0.78">
      <stop offset="0.45" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#1a0e1a" stop-opacity="0.55"/>
    </radialGradient>
  </defs>

  <!-- Base ground -->
  <rect width="800" height="450" fill="url(#g3-base)"/>

  <!-- Cobble tile pattern -->
  <rect width="800" height="450" fill="url(#g3-cobble)"/>

  <!-- Dust/ash drifty (jasne plamy popiołu, flat) -->
  <g fill="#6a5a52">
    <ellipse cx="120" cy="80" rx="100" ry="22" opacity="0.3"/>
    <ellipse cx="460" cy="140" rx="140" ry="26" opacity="0.32"/>
    <ellipse cx="700" cy="220" rx="90" ry="20" opacity="0.3"/>
    <ellipse cx="200" cy="320" rx="120" ry="24" opacity="0.32"/>
    <ellipse cx="560" cy="380" rx="130" ry="26" opacity="0.32"/>
  </g>

  <!-- Soot dark patches (osmolone strefy) -->
  <g fill="#1a0e10">
    <ellipse cx="340" cy="60" rx="70" ry="16" opacity="0.42"/>
    <ellipse cx="80" cy="200" rx="80" ry="20" opacity="0.4"/>
    <ellipse cx="620" cy="80" rx="90" ry="18" opacity="0.4"/>
    <ellipse cx="380" cy="240" rx="100" ry="22" opacity="0.4"/>
    <ellipse cx="120" cy="400" rx="80" ry="20" opacity="0.45"/>
    <ellipse cx="440" cy="400" rx="100" ry="22" opacity="0.42"/>
    <ellipse cx="720" cy="340" rx="70" ry="18" opacity="0.4"/>
  </g>

  <!-- Cracks across cobblestone (flat dark lines) -->
  <g stroke="#0a0408" fill="none" opacity="0.7">
    <path d="M0 60 Q120 80 220 100 Q310 120 380 140" stroke-width="1.4"/>
    <path d="M380 140 Q460 160 540 184 Q640 210 760 232" stroke-width="1.4"/>
    <path d="M40 250 L120 264 L210 268 L300 282 L380 296" stroke-width="1.2"/>
    <path d="M380 296 L460 308 L560 312 L660 326 L760 340" stroke-width="1.2"/>
    <path d="M520 80 L580 92 L640 94 L720 102" stroke-width="1.1"/>
    <path d="M120 380 L200 392 L290 396 L380 408" stroke-width="1.1"/>
    <path d="M560 410 L640 416 L720 420" stroke-width="1"/>
    <!-- mniejsze pęknięcia bocznicze -->
    <path d="M180 150 L200 170 M198 165 L220 178" stroke-width="0.9"/>
    <path d="M450 220 L468 240 M460 235 L480 250" stroke-width="0.9"/>
    <path d="M620 360 L640 380 M634 372 L656 388" stroke-width="0.9"/>
  </g>

  <!-- Flat rubble jako tile inlay (małe, nieregularne kształty NA podłodze,
       nie 3d obiekty — wyglądają jak wbudowane w bruk fragmenty cegieł) -->
  <g fill="#3a2820" stroke="#1a0e10" stroke-width="0.6">
    <polygon points="78,134 96,138 92,148 74,144" opacity="0.7"/>
    <polygon points="284,194 304,196 302,206 282,204" opacity="0.7"/>
    <polygon points="500,68 518,72 516,82 498,78" opacity="0.7"/>
    <polygon points="660,170 676,172 674,182 658,180" opacity="0.7"/>
    <polygon points="160,330 180,332 178,342 158,340" opacity="0.7"/>
    <polygon points="400,360 420,362 418,372 398,370" opacity="0.7"/>
    <polygon points="600,300 616,304 614,314 598,310" opacity="0.7"/>
    <polygon points="720,392 736,394 734,404 718,402" opacity="0.7"/>
  </g>

  <!-- Ash flecks (drobne plamki popiołu/kurzu) -->
  <g fill="#7a6e62" opacity="0.55">
    <circle cx="44" cy="88" r="1.2"/>
    <circle cx="142" cy="56" r="1"/>
    <circle cx="240" cy="120" r="1.2"/>
    <circle cx="324" cy="80" r="1"/>
    <circle cx="408" cy="184" r="1.2"/>
    <circle cx="488" cy="120" r="1"/>
    <circle cx="572" cy="200" r="1.2"/>
    <circle cx="656" cy="148" r="1"/>
    <circle cx="744" cy="200" r="1.2"/>
    <circle cx="68" cy="270" r="1"/>
    <circle cx="180" cy="248" r="1.2"/>
    <circle cx="304" cy="304" r="1"/>
    <circle cx="416" cy="280" r="1.2"/>
    <circle cx="520" cy="332" r="1"/>
    <circle cx="624" cy="288" r="1.2"/>
    <circle cx="708" cy="248" r="1"/>
    <circle cx="100" cy="380" r="1.2"/>
    <circle cx="240" cy="416" r="1"/>
    <circle cx="380" cy="384" r="1.2"/>
    <circle cx="500" cy="424" r="1"/>
    <circle cx="660" cy="404" r="1.2"/>
  </g>

  <!-- Vignette -->
  <rect width="800" height="450" fill="url(#g3-vignette)"/>
</svg>`;

const STAGE_BG_SVG: Record<number, string> = {
  1: SVG_STAGE_GATES,
  2: SVG_STAGE_SEWERS,
  3: SVG_STAGE_OUTSKIRTS,
};

function svgToDataUri(svg: string): string {
  const trimmed = svg.trim();
  // btoa() przyjmuje TYLKO Latin1. SVG mogą zawierać znaki UTF-8
  // (box-drawing w komentarzach, polskie znaki w napisach, etc.) — przed
  // base64 trzeba zakodować do bajtów UTF-8 i zbinaryfikować.
  if (typeof btoa !== 'undefined' && typeof TextEncoder !== 'undefined') {
    const bytes = new TextEncoder().encode(trimmed);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return `data:image/svg+xml;base64,${btoa(binary)}`;
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;
}

export interface SpriteAtlas {
  enemy: Record<EnemyKind, Texture>;
  player: Record<CharacterClass, Texture>;
  stageBg: Record<number, Texture>;
}

let cachedAtlas: Promise<SpriteAtlas> | null = null;

/** Load all sprites once per app session. Cached so a second `<Run>` mount
 * doesn't re-rasterize the same SVGs. */
export function loadSpriteAtlas(): Promise<SpriteAtlas> {
  if (cachedAtlas) return cachedAtlas;
  cachedAtlas = (async () => {
    const enemyEntries = await Promise.all(
      (Object.keys(ENEMY_SVG) as EnemyKind[]).map(async (kind) => {
        const tex = (await Assets.load(svgToDataUri(ENEMY_SVG[kind]))) as Texture;
        return [kind, tex] as const;
      }),
    );
    const playerEntries = await Promise.all(
      (Object.keys(PLAYER_SVG) as CharacterClass[]).map(async (cls) => {
        const tex = (await Assets.load(svgToDataUri(PLAYER_SVG[cls]))) as Texture;
        return [cls, tex] as const;
      }),
    );
    const stageEntries = await Promise.all(
      Object.keys(STAGE_BG_SVG).map(async (idStr) => {
        const id = Number(idStr);
        const tex = (await Assets.load(svgToDataUri(STAGE_BG_SVG[id]!))) as Texture;
        return [id, tex] as const;
      }),
    );

    return {
      enemy: Object.fromEntries(enemyEntries) as Record<EnemyKind, Texture>,
      player: Object.fromEntries(playerEntries) as Record<CharacterClass, Texture>,
      stageBg: Object.fromEntries(stageEntries) as Record<number, Texture>,
    };
  })();
  return cachedAtlas;
}
