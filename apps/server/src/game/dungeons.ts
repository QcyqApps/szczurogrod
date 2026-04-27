// Lochy i regiony — seed source dla fresh DB. Runtime czyta z REGISTRY.
// Edycja w DataGrip + admin.reload, jak reszta contentu.
//
// Unlock logika: gracz widzi loch gdy `char.lvl >= requiredLvl` ORAZ
// prerequisite został clear (lub prerequisite=null). Pokonanie bossa → wpis
// w `character_dungeon_clears` → otwiera kolejny loch.

export interface RegionSeed {
  slug: string;
  name: string;
  sortOrder: number;
}

export interface DungeonSeed {
  slug: string;
  regionSlug: string;
  name: string;
  desc: string;
  requiredLvl: number;
  /** `null` = pierwszy loch regionu, brak wymogów po stronie chain. */
  prerequisiteDungeonSlug: string | null;
  bossEnemySlug: string;
  /** Współrzędne 0..1000 na logicznym canvasie regionu — klient skaluje. */
  mapX: number;
  mapY: number;
  sortOrder: number;
}

export interface DungeonMobSeed {
  dungeonSlug: string;
  enemySlug: string;
  sortOrder: number;
}

export const REGIONS: readonly RegionSeed[] = [
  { slug: 'okolice-szczurogrodu', name: 'Okolice Szczurogrodu', sortOrder: 1 },
  { slug: 'puszcza-cien', name: 'Puszcza Cień', sortOrder: 2 },
  { slug: 'bagna-czarnej-strzygi', name: 'Bagna Czarnej Strzygi', sortOrder: 3 },
  { slug: 'granie-strzelistych', name: 'Granie Strzelistych Iglic', sortOrder: 4 },
];

export const DUNGEONS: readonly DungeonSeed[] = [
  {
    slug: 'piwnice-miasta',
    regionSlug: 'okolice-szczurogrodu',
    name: 'Piwnice Miasta',
    desc: 'Pod miastem śmierdzi. Coś tam się rusza. Ktoś musi to sprawdzić.',
    requiredLvl: 1,
    prerequisiteDungeonSlug: null,
    bossEnemySlug: 'rat-king-baltazar',
    mapX: 180,
    mapY: 720,
    sortOrder: 1,
  },
  {
    slug: 'stare-katakumby',
    regionSlug: 'okolice-szczurogrodu',
    name: 'Stare Katakumby',
    desc: 'Pamiętają czasy przed Szczurogrodem. Umarli pamiętają najdłużej.',
    requiredLvl: 6,
    prerequisiteDungeonSlug: 'piwnice-miasta',
    bossEnemySlug: 'kosciej-elder',
    mapX: 500,
    mapY: 350,
    sortOrder: 2,
  },
  {
    slug: 'mroczna-gran',
    regionSlug: 'okolice-szczurogrodu',
    name: 'Mroczna Grań',
    desc: 'Tam gdzie kamień zaczyna szeptać. Chodź się przekonaj.',
    requiredLvl: 10,
    prerequisiteDungeonSlug: 'stare-katakumby',
    bossEnemySlug: 'lord-of-the-peaks',
    mapX: 820,
    mapY: 680,
    sortOrder: 3,
  },
  // --- Region 2: Puszcza Cień (L16-32) ---
  {
    slug: 'szlaki-lesne',
    regionSlug: 'puszcza-cien',
    name: 'Szlaki Leśne',
    desc: 'Ścieżki wijące się między drzewami. Las wie, kto idzie.',
    requiredLvl: 16,
    prerequisiteDungeonSlug: 'mroczna-gran',
    bossEnemySlug: 'wilkolak-matecznika',
    mapX: 200,
    mapY: 300,
    sortOrder: 1,
  },
  {
    slug: 'kurhany-starych-bogow',
    regionSlug: 'puszcza-cien',
    name: 'Kurhany Starych Bogów',
    desc: 'Stare kamienie. Starsze kości. Jeszcze starsze obietnice.',
    requiredLvl: 22,
    prerequisiteDungeonSlug: 'szlaki-lesne',
    bossEnemySlug: 'strzygon-dziadowski',
    mapX: 500,
    mapY: 600,
    sortOrder: 2,
  },
  {
    slug: 'serce-puszczy',
    regionSlug: 'puszcza-cien',
    name: 'Serce Puszczy',
    desc: 'Tu las się nie kończy. Tu las zaczyna.',
    requiredLvl: 28,
    prerequisiteDungeonSlug: 'kurhany-starych-bogow',
    bossEnemySlug: 'panna-leszczyna',
    mapX: 800,
    mapY: 300,
    sortOrder: 3,
  },
  // --- Region 3: Bagna Czarnej Strzygi (L33-50) ---
  {
    slug: 'mielizny-topielcow',
    regionSlug: 'bagna-czarnej-strzygi',
    name: 'Mielizny Topielców',
    desc: 'Woda dochodzi do kolan. Później wyżej. Ktoś łapie za kostkę.',
    requiredLvl: 33,
    prerequisiteDungeonSlug: 'serce-puszczy',
    bossEnemySlug: 'zasmucony-topielec-starszy',
    mapX: 200,
    mapY: 720,
    sortOrder: 1,
  },
  {
    slug: 'gaszcz-bolesny',
    regionSlug: 'bagna-czarnej-strzygi',
    name: 'Gąszcz Bolesny',
    desc: 'Drzewa martwe, ale rosną. Ktoś słyszał, że tu ktoś rąbał.',
    requiredLvl: 40,
    prerequisiteDungeonSlug: 'mielizny-topielcow',
    bossEnemySlug: 'upior-drwala',
    mapX: 520,
    mapY: 420,
    sortOrder: 2,
  },
  {
    slug: 'czarna-obrzednica',
    regionSlug: 'bagna-czarnej-strzygi',
    name: 'Czarna Obrzędnica',
    desc: 'Wyspa z altaną. Altana z ołtarzem. Ołtarz z czegoś, co pamięta.',
    requiredLvl: 47,
    prerequisiteDungeonSlug: 'gaszcz-bolesny',
    bossEnemySlug: 'czarna-strzyga',
    mapX: 800,
    mapY: 180,
    sortOrder: 3,
  },
  // --- Region 4: Granie Strzelistych Iglic (L48-65) ---
  {
    slug: 'lodowa-jaskinia',
    regionSlug: 'granie-strzelistych',
    name: 'Lodowa Jaskinia',
    desc: 'Wąskie wejście, szerokie echo. Świszcze przekrzykują halny.',
    requiredLvl: 48,
    prerequisiteDungeonSlug: 'czarna-obrzednica',
    bossEnemySlug: 'ognista-pani',
    mapX: 200,
    mapY: 600,
    sortOrder: 1,
  },
  {
    slug: 'otchlan-skarbnika',
    regionSlug: 'granie-strzelistych',
    name: 'Otchłań Skarbnika',
    desc: 'Stare sztolnie pod szczytem. Lampka kopalniana wciąż świeci. Sama.',
    requiredLvl: 56,
    prerequisiteDungeonSlug: 'lodowa-jaskinia',
    bossEnemySlug: 'skarbnik-otchlani',
    mapX: 750,
    mapY: 250,
    sortOrder: 2,
  },
];

/**
 * Moby "regular" (bez bossa) per loch. Boss jest w `DungeonSeed.bossEnemySlug`
 * i NIE powtarza się w tej tabeli, żeby UI nie listował go dwa razy.
 */
export const DUNGEON_MOBS: readonly DungeonMobSeed[] = [
  // Piwnice — L1-5 (6 mobów)
  { dungeonSlug: 'piwnice-miasta', enemySlug: 'goblin-scav', sortOrder: 1 },
  { dungeonSlug: 'piwnice-miasta', enemySlug: 'rat-giant', sortOrder: 2 },
  { dungeonSlug: 'piwnice-miasta', enemySlug: 'slime-green', sortOrder: 3 },
  { dungeonSlug: 'piwnice-miasta', enemySlug: 'kobold-thief', sortOrder: 4 },
  { dungeonSlug: 'piwnice-miasta', enemySlug: 'goblin-warrior', sortOrder: 5 },
  { dungeonSlug: 'piwnice-miasta', enemySlug: 'cave-spider', sortOrder: 6 },
  // Katakumby — L5-8 (6 mobów)
  { dungeonSlug: 'stare-katakumby', enemySlug: 'skeleton-soldier', sortOrder: 1 },
  { dungeonSlug: 'stare-katakumby', enemySlug: 'bat-dire', sortOrder: 2 },
  { dungeonSlug: 'stare-katakumby', enemySlug: 'troll-cave', sortOrder: 3 },
  { dungeonSlug: 'stare-katakumby', enemySlug: 'demon-imp', sortOrder: 4 },
  { dungeonSlug: 'stare-katakumby', enemySlug: 'ogre-brute', sortOrder: 5 },
  { dungeonSlug: 'stare-katakumby', enemySlug: 'skeleton-captain', sortOrder: 6 },
  // Mroczna Grań — L10-18 (7 mobów, w tym 3 quest-bossy jako regular mobki)
  { dungeonSlug: 'mroczna-gran', enemySlug: 'goblin-shaman', sortOrder: 1 },
  { dungeonSlug: 'mroczna-gran', enemySlug: 'minotaur', sortOrder: 2 },
  { dungeonSlug: 'mroczna-gran', enemySlug: 'slime-shadow', sortOrder: 3 },
  { dungeonSlug: 'mroczna-gran', enemySlug: 'wraith', sortOrder: 4 },
  { dungeonSlug: 'mroczna-gran', enemySlug: 'hobgoblin-king', sortOrder: 5 },
  { dungeonSlug: 'mroczna-gran', enemySlug: 'bone-dragon', sortOrder: 6 },
  { dungeonSlug: 'mroczna-gran', enemySlug: 'void-horror', sortOrder: 7 },
  // --- Region 2: Puszcza Cień ---
  // Szlaki Leśne — L16-20
  { dungeonSlug: 'szlaki-lesne', enemySlug: 'forest-bandit', sortOrder: 1 },
  { dungeonSlug: 'szlaki-lesne', enemySlug: 'boar-tusk', sortOrder: 2 },
  { dungeonSlug: 'szlaki-lesne', enemySlug: 'goblin-scout', sortOrder: 3 },
  { dungeonSlug: 'szlaki-lesne', enemySlug: 'wolf-pack', sortOrder: 4 },
  { dungeonSlug: 'szlaki-lesne', enemySlug: 'treant-young', sortOrder: 5 },
  // Kurhany Starych Bogów — L21-25
  { dungeonSlug: 'kurhany-starych-bogow', enemySlug: 'ghoul-risen', sortOrder: 1 },
  { dungeonSlug: 'kurhany-starych-bogow', enemySlug: 'skeleton-priest', sortOrder: 2 },
  { dungeonSlug: 'kurhany-starych-bogow', enemySlug: 'bone-golem', sortOrder: 3 },
  { dungeonSlug: 'kurhany-starych-bogow', enemySlug: 'wraith-howler', sortOrder: 4 },
  { dungeonSlug: 'kurhany-starych-bogow', enemySlug: 'lich-acolyte', sortOrder: 5 },
  // Serce Puszczy — L26-30
  { dungeonSlug: 'serce-puszczy', enemySlug: 'dryad-matron', sortOrder: 1 },
  { dungeonSlug: 'serce-puszczy', enemySlug: 'treant-elder', sortOrder: 2 },
  { dungeonSlug: 'serce-puszczy', enemySlug: 'corrupted-deer', sortOrder: 3 },
  { dungeonSlug: 'serce-puszczy', enemySlug: 'mist-wraith', sortOrder: 4 },
  { dungeonSlug: 'serce-puszczy', enemySlug: 'shadow-beast', sortOrder: 5 },
  // --- Region 3: Bagna Czarnej Strzygi ---
  // Mielizny Topielców — L33-37
  { dungeonSlug: 'mielizny-topielcow', enemySlug: 'topielec-maly', sortOrder: 1 },
  { dungeonSlug: 'mielizny-topielcow', enemySlug: 'blotna-pijawka', sortOrder: 2 },
  { dungeonSlug: 'mielizny-topielcow', enemySlug: 'zabnik-dwukrotny', sortOrder: 3 },
  { dungeonSlug: 'mielizny-topielcow', enemySlug: 'larwa-trzcinowa', sortOrder: 4 },
  { dungeonSlug: 'mielizny-topielcow', enemySlug: 'mgielny-duch', sortOrder: 5 },
  // Gąszcz Bolesny — L38-42
  { dungeonSlug: 'gaszcz-bolesny', enemySlug: 'cierniak-pelzajacy', sortOrder: 1 },
  { dungeonSlug: 'gaszcz-bolesny', enemySlug: 'dziadek-z-trzciny', sortOrder: 2 },
  { dungeonSlug: 'gaszcz-bolesny', enemySlug: 'kikut-chodzacy', sortOrder: 3 },
  { dungeonSlug: 'gaszcz-bolesny', enemySlug: 'ropuch-straznik', sortOrder: 4 },
  { dungeonSlug: 'gaszcz-bolesny', enemySlug: 'zelazny-komar', sortOrder: 5 },
  // Czarna Obrzędnica — L44-48
  { dungeonSlug: 'czarna-obrzednica', enemySlug: 'sluga-strzygi', sortOrder: 1 },
  { dungeonSlug: 'czarna-obrzednica', enemySlug: 'nietoperz-upiora', sortOrder: 2 },
  { dungeonSlug: 'czarna-obrzednica', enemySlug: 'slepy-oracz', sortOrder: 3 },
  { dungeonSlug: 'czarna-obrzednica', enemySlug: 'kocica-obrzedowa', sortOrder: 4 },
  { dungeonSlug: 'czarna-obrzednica', enemySlug: 'pan-ogrodow', sortOrder: 5 },
  // --- Region 4: Granie Strzelistych Iglic ---
  // Lodowa Jaskinia — L48-54
  { dungeonSlug: 'lodowa-jaskinia', enemySlug: 'swiszcz-hardy', sortOrder: 1 },
  { dungeonSlug: 'lodowa-jaskinia', enemySlug: 'straznik-granii', sortOrder: 2 },
  { dungeonSlug: 'lodowa-jaskinia', enemySlug: 'lodowy-tropiciel', sortOrder: 3 },
  // Otchłań Skarbnika — L57-65
  { dungeonSlug: 'otchlan-skarbnika', enemySlug: 'lodowy-tropiciel', sortOrder: 1 },
  { dungeonSlug: 'otchlan-skarbnika', enemySlug: 'mrozny-upior', sortOrder: 2 },
  { dungeonSlug: 'otchlan-skarbnika', enemySlug: 'ognista-pani', sortOrder: 3 },
];
