import type { Appearance, CharacterClass } from './appearance';

export type { CharacterClass };

export interface CharacterStats {
  atk: number;
  def: number;
  mag: number;
  spd: number;
}

export interface Character {
  id: string;
  name: string;
  cls: CharacterClass;
  lvl: number;
  xp: number;
  xpMax: number;
  hp: number;
  hpMax: number;
  mp: number;
  mpMax: number;
  gold: number;
  gems: number;
  /** Zasób "złom" u Kowala (dismantle items → scrap). Używany do upgrade'ów. */
  scrap: number;
  stamina: number;
  staminaMax: number;
  stats: CharacterStats;
  appearance: Appearance;
  /** Unix millis — server-authoritative. Used for offline catch-up. */
  lastTickAt: number;
  createdAt: number;
  /**
   * Unix millis when the tavern healer becomes available again. `null` = ready
   * now. The client uses this to render the countdown on the healer card.
   */
  healerReadyAt: number | null;
  /** Gold cost of a tavern full heal (scales with lvl). */
  healerCost: number;
  /** Dungeon keys — cap-capped at `dungeonKeysMax`. Every `combat.engage` costs 1. */
  dungeonKeys: number;
  dungeonKeysMax: number;
  /** Unix millis of last key-regen tick, advanced only by consumed ticks. */
  lastKeyTickAt: number;
  /**
   * Aktywny wynajem wierzchowca ze Stajni. `null` = brak (lub najem już
   * wygasł). Klient wykorzystuje to do preview'u skróconego czasu questa
   * oraz wyświetlenia pill'a na topbarze.
   */
  activeMount: {
    slug: string;
    name: string;
    icon: string;
    /** 0..80 — procent skrócenia `duration` na quests.start. */
    speedPct: number;
    /** Unix millis — klient liczy countdown do wygaśnięcia. */
    expiresAt: number;
  } | null;
  /**
   * Podsumowanie offline-progress — wypełnione gdy gracz był nieobecny
   * >= 30 minut. `null` przy zwykłych wywołaniach me.get. Klient pokazuje
   * modal raz przy pierwszym me.get z summary i potem już nie.
   */
  offlineSummary: OfflineSummary | null;
  /**
   * Slugi tropów faktycznie dolosowanych w tym me.get tick'u. Klient
   * odpala toast per slug (serwer wie co wstawił, klient by się musiał
   * bawić w diff'owanie). Pusta tablica przy większości wywołań.
   */
  newTrackSlugs: string[];
  /**
   * Gildia do której należy postać. NULL gdy nie jest w gildii.
   * Denormalizowane z guild_members przez server-side hook w me.get.
   */
  guild: {
    id: string;
    name: string;
    tag: string;
    rank: 'leader' | 'officer' | 'member' | 'recruit';
  } | null;
  /**
   * Aktywne timed buffy z elixirów. Pusta tablica gdy nic nie kapie. Klient
   * wyświetla pasek pod topbarem z countdownem do `expiresAt`. Wygasłe wiersze
   * są lazy-purge'owane w `me.get` — to co tu dostajesz, faktycznie działa.
   */
  activeBuffs: ActiveBuffInfo[];
  /**
   * Aktywna praca (idle quest). NULL gdy postać nie pracuje. Klient używa do:
   * (a) blokowania nawigacji do trybów walki + redirectu do tablicy pracy,
   * (b) pokazania pill'a w topbarze. Pełna nagroda + countdown żyją w
   * `work.status` query — tu tylko minimum potrzebne do gating'u.
   */
  work: {
    kindSlug: string;
    kindName: string;
    /** Unix millis kiedy zmiana się kończy. */
    endsAt: number;
    /** True gdy `Date.now() >= endsAt` — można odebrać. */
    ready: boolean;
  } | null;
  /**
   * Szczurogród+ subskrypcja — unix millis wygaśnięcia. NULL = brak subskrypcji.
   * Klient porównuje z Date.now() żeby pokazać badge / countdown w settings.
   * Aktywna subskrypcja nadaje +20% XP do każdego gain'u.
   */
  szczurogrodPlusUntil: number | null;
}

export type BuffKind =
  | 'hp_max_pct'
  | 'mp_max_pct'
  | 'atk_flat'
  | 'def_flat'
  | 'mag_flat'
  | 'spd_flat';

export interface ActiveBuffInfo {
  kind: BuffKind;
  /** `*_pct` → procent (25 = +25%). `*_flat` → raw delta statu.
   *  Zawsze dodatni; klątwy mają `isCurse=true` i efekt ujemny w agregacji. */
  magnitude: number;
  /** Unix millis — klient liczy countdown. */
  expiresAt: number;
  /** Template id mikstury / slug klątwy — klient może pokazać ikonę/nazwę. */
  sourceItemId: string | null;
  /** True = klątwa (efekt negatywny). UI rysuje na czerwono, Baba Jaga zdejmuje. */
  isCurse: boolean;
}

export interface OfflineSummary {
  /** Jak długo gracza nie było, w ms. */
  awayMs: number;
  /** HP odzyskane podczas nieobecności (0 jeśli nic). */
  hpGained: number;
  /** MP odzyskane. */
  mpGained: number;
  /** Wytrzymałość odzyskana. */
  staminaGained: number;
  /** Klucze do lochu odzyskane. */
  keysGained: number;
  /** Nowe tropy wylosowane na polowanie. */
  tracksRolled: number;
  /** Uzdrowicielka była na cooldownie, teraz gotowa. */
  healerReady: boolean;
}

/**
 * Subset of Character used by purely-presentational components (TopBar, portraits).
 * Full Character is always available — this just documents what the compact displays need.
 */
export type CharacterHeader = Pick<
  Character,
  'name' | 'cls' | 'lvl' | 'xp' | 'xpMax' | 'hp' | 'hpMax' | 'mp' | 'mpMax' | 'gold' | 'gems'
> & {
  appearance?: Partial<Appearance> | null;
};
