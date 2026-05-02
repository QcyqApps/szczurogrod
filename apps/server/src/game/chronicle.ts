// Kroniki Szczurogrodu. Hybrydowy feed: prawdziwe eventy graczy + flavor NPC
// generowany przez Claude'a (batch w `town-chronicle.ts`) + statyczne SEED'y.
//
// Logowanie: `logBossKill` / `logLegendaryDrop` / `logLevelMilestone` robią
// insert z ON CONFLICT DO NOTHING — dedup `(character_id, dedup_key)` gwarantuje
// że ten sam boss/drop/milestone nie trafia dwa razy.
//
// Rendering: `renderChronicleEvent(payload)` wybiera deterministycznie jeden
// szablon spośród 3-4 per kind — ten sam event zawsze wygląda tak samo, ale
// kolejne eventy tego samego typu nie nudzą.
//
// Listing: `listChronicleEntries(db)` zwraca ~20 wpisów dla ekranu Miasta.
// 12 ostatnich eventów + do 8 flavorów z dzisiejszego batchu; tasowane
// deterministycznie po dniu UTC, żeby kolejność w ciągu dnia była stała.

import { desc, eq, sql } from 'drizzle-orm';
import type { ChronicleEntry, ChroniclePayload } from '@grodno/shared';
import type { Db } from '../db/client.js';
import { chronicleEvents } from '../db/schema.js';
import { isoDateUTC } from './daily.js';
import { pickChronicleFlavorPool, SEED_CHRONICLES } from './town-chronicle.js';

/** Poziomy, przy których warto wrzucić notkę do kronik. Mniej zalewa feed. */
export const MILESTONES: readonly number[] = [5, 10, 15, 20, 30, 50, 75, 100];

const MAX_EVENTS = 12;
const MAX_FLAVOR = 8;

// ---------- Logowanie eventów ----------

interface LogArgs {
  db: Db;
  characterId: string;
  payload: ChroniclePayload;
  dedupKey: string;
}

async function insertEvent({ db, characterId, payload, dedupKey }: LogArgs): Promise<void> {
  await db
    .insert(chronicleEvents)
    .values({ characterId, kind: payload.kind, payload, dedupKey })
    .onConflictDoNothing();
}

export async function logBossKill(
  db: Db,
  characterId: string,
  heroName: string,
  questId: string,
  questTitle: string,
): Promise<void> {
  await insertEvent({
    db,
    characterId,
    dedupKey: `boss_kill:${questId}`,
    payload: { kind: 'boss_kill', questId, questTitle, heroName },
  });
}

export async function logLegendaryDrop(
  db: Db,
  characterId: string,
  heroName: string,
  itemName: string,
): Promise<void> {
  await insertEvent({
    db,
    characterId,
    // Per-item dedup, żeby ten sam item nie był kronikowany wielokrotnie dla
    // jednego gracza (np. po sprzedaniu i re-rolowaniu przy kolejnym drop'ie).
    dedupKey: `legendary_drop:${itemName}`,
    payload: { kind: 'legendary_drop', itemName, heroName },
  });
}

export async function logLevelMilestone(
  db: Db,
  characterId: string,
  heroName: string,
  level: number,
): Promise<void> {
  if (!MILESTONES.includes(level)) return;
  await insertEvent({
    db,
    characterId,
    dedupKey: `level_milestone:${level}`,
    payload: { kind: 'level_milestone', level, heroName },
  });
}

export async function logAchievementUnlock(
  db: Db,
  characterId: string,
  heroName: string,
  achievementId: string,
  achievementName: string,
  tier: 'bronze' | 'silver' | 'gold' | 'legendary',
): Promise<void> {
  // Dedup per-gracz per-achievement — odblokowanie raz na życie.
  await insertEvent({
    db,
    characterId,
    dedupKey: `achievement_unlock:${achievementId}`,
    payload: {
      kind: 'achievement_unlock',
      heroName,
      achievementId,
      achievementName,
      tier,
    },
  });
}

/**
 * Arena victory — tylko gdy gracz pokonał REAL playera (nie NPC'a — nie
 * jest to ciekawe dla kroniki). Dedup po matchId żeby każda walka = co
 * najwyżej jeden wpis.
 */
export async function logArenaVictory(
  db: Db,
  characterId: string,
  heroName: string,
  opponentName: string,
  pointsDelta: number,
  matchId: string,
): Promise<void> {
  await insertEvent({
    db,
    characterId,
    dedupKey: `arena_victory:${matchId}`,
    payload: { kind: 'arena_victory', heroName, opponentName, pointsDelta },
  });
}

/** Streak ≥ 3 wygranych z rzędu — bump per streak value (dedup po streak). */
export async function logArenaStreak(
  db: Db,
  characterId: string,
  heroName: string,
  streak: number,
): Promise<void> {
  if (streak < 3) return;
  await insertEvent({
    db,
    characterId,
    dedupKey: `arena_streak:${streak}`,
    payload: { kind: 'arena_streak', heroName, streak },
  });
}

/** Założenie gildii — dedup per guildId (raz per gildia na całą grę). */
export async function logGuildFounded(
  db: Db,
  characterId: string,
  heroName: string,
  guildId: string,
  guildName: string,
): Promise<void> {
  await insertEvent({
    db,
    characterId,
    dedupKey: `guild_founded:${guildId}`,
    payload: { kind: 'guild_founded', heroName, guildName },
  });
}

/** Dołączenie do gildii — dedup per (character, guild) — raz per przynależność. */
export async function logGuildJoined(
  db: Db,
  characterId: string,
  heroName: string,
  guildId: string,
  guildName: string,
): Promise<void> {
  await insertEvent({
    db,
    characterId,
    dedupKey: `guild_joined:${guildId}`,
    payload: { kind: 'guild_joined', heroName, guildName },
  });
}

/** Server-wide world boss padł — dedup per (character, bossId). Logowane
 * tylko dla killing-blow gracza (chronicle to feed osobisty per char). */
export async function logWorldBossKilled(
  db: Db,
  characterId: string,
  heroName: string,
  bossId: string,
  bossName: string,
  tier: number,
  contributors: number,
): Promise<void> {
  await insertEvent({
    db,
    characterId,
    dedupKey: `world_boss_killed:${bossId}`,
    payload: {
      kind: 'world_boss_killed',
      heroName,
      bossName,
      tier,
      contributors,
    },
  });
}

/** Zabity boss rajdu — dedup per (character, bossId). Kluczowy dla killingBlow
 * charId oraz wszystkich contributorów. */
export async function logGuildRaidKilled(
  db: Db,
  characterId: string,
  heroName: string,
  bossId: string,
  guildName: string,
  bossName: string,
  tier: number,
): Promise<void> {
  await insertEvent({
    db,
    characterId,
    dedupKey: `guild_raid_killed:${bossId}`,
    payload: {
      kind: 'guild_raid_killed',
      heroName,
      guildName,
      bossName,
      tier,
    },
  });
}

/** Wygrana wojna gildyjna — dedup per (character, warId). */
export async function logGuildWarWon(
  db: Db,
  characterId: string,
  heroName: string,
  warId: string,
  guildName: string,
  opponentName: string,
  attackerScore: number,
  defenderScore: number,
): Promise<void> {
  await insertEvent({
    db,
    characterId,
    dedupKey: `guild_war_won:${warId}`,
    payload: {
      kind: 'guild_war_won',
      heroName,
      guildName,
      opponentName,
      attackerScore,
      defenderScore,
    },
  });
}

// ---------- Rendering ----------

const BOSS_TEMPLATES = [
  (h: string, t: string) => `${h} zakończył sprawę z „${t}". Bez komentarza.`,
  (h: string, t: string) => `${h} rozwiązał „${t}". Naród oddycha z ulgą.`,
  (h: string, t: string) => `${h} domknął „${t}". Karczmarz nalewa jedno mniej.`,
  (h: string, t: string) => `„${t}" — sprawa zamknięta. Podpisane: ${h}.`,
];

const LEGENDARY_TEMPLATES = [
  (h: string, it: string) => `${h} wyciągnął ${it} ze skrzyni. Nie pytaj z której.`,
  (h: string, it: string) => `${h} trafił na ${it}. Zazdrośnicy milczą głośno.`,
  (h: string, it: string) => `Komuś się poszczęściło — ${h}, rzecz zwana ${it}.`,
  (h: string, it: string) => `${h} znalazł ${it}. Będzie się chwalił tydzień.`,
];

const LEVEL_TEMPLATES = [
  (h: string, l: number) => `${h} osiągnął ${l}. poziom. Już go tak nie wyśmiewają.`,
  (h: string, l: number) => `${h} — ${l}. poziom. Karczmarz zapamiętuje zamówienie.`,
  (h: string, l: number) => `${h} skończył ${l}. lvl. Ktoś, gdzieś, jest z niego dumny.`,
  (h: string, l: number) => `${h} awansował na ${l}. poziom. Bez fanfar.`,
];

const ARENA_VICTORY_TEMPLATES = [
  (h: string, o: string, d: number) =>
    `${h} rozstawił ${o} po sieni. ${d >= 0 ? '+' : ''}${d} pkt, bez łez.`,
  (h: string, o: string, d: number) =>
    `W arenie: ${h} → ${o}. Różnica punktów: ${d >= 0 ? '+' : ''}${d}.`,
  (h: string, o: string, d: number) =>
    `${o} poszedł się umyć. ${h} ma to gdzieś (${d >= 0 ? '+' : ''}${d}).`,
  (h: string, o: string, _d: number) =>
    `${h} pobił ${o}. Tłum mruknął z aprobatą. Jeden raz.`,
];

const ARENA_STREAK_TEMPLATES = [
  (h: string, s: number) => `${h} — ${s} wygrane z rzędu. Ktoś powinien mu odebrać miecz.`,
  (h: string, s: number) => `Passa ${h}a: ${s}. Tabulator się kończy.`,
  (h: string, s: number) => `${s} z rzędu. ${h} pije wodę i wraca do kolejki.`,
];

const GUILD_FOUNDED_TEMPLATES = [
  (h: string, g: string) => `${h} założył gildię „${g}". Ma już logo i motto.`,
  (h: string, g: string) => `Nowa gildia: „${g}". Wódz — ${h}. Herb do ustalenia.`,
  (h: string, g: string) => `„${g}" — sformowana. Za podpisem: ${h}.`,
];

const GUILD_JOINED_TEMPLATES = [
  (h: string, g: string) => `${h} dołączył do „${g}". Będzie pił na czyjś rachunek.`,
  (h: string, g: string) => `„${g}" przyjmuje ${h}a. Rekrut, ale ambitny.`,
  (h: string, g: string) => `${h} — nowy w „${g}". Sztandar trochę wymiętoszony.`,
];

const GUILD_WAR_WON_TEMPLATES = [
  (g: string, o: string, s: string) => `„${g}" ogarnia „${o}" ${s}. Karczmarz policzył.`,
  (g: string, o: string, s: string) => `Wojna: „${g}" vs „${o}" ${s}. Sztandar zostaje.`,
  (g: string, o: string, s: string) => `„${g}" wygrywa z „${o}" ${s}. Głosy spokojniejsze.`,
];

const GUILD_RAID_KILLED_TEMPLATES = [
  (g: string, b: string, t: number) => `„${g}" ubija „${b}" (tier ${t}). Następny już za rogiem.`,
  (g: string, b: string, t: number) => `„${b}" padł. „${g}" zbiera. Tier ${t} — zamknięty.`,
  (g: string, b: string, t: number) => `„${g}" kończy temat z „${b}" na tier ${t}. Krótko i rzeczowo.`,
];

const WORLD_BOSS_KILLED_TEMPLATES = [
  (h: string, b: string, t: number, c: number) =>
    `${h} dobija „${b}" (tier ${t}). Świat patrzył — ${c} osób w tym maczało palce.`,
  (h: string, b: string, t: number, c: number) =>
    `„${b}" padł. ${h} zadał ostatni cios. Tier ${t}, ${c} chętnych do napluwania.`,
  (h: string, b: string, t: number, c: number) =>
    `Wybudzony zasnął. ${h} z ${c}-osobowej zgrai zamyka „${b}" na tier ${t}.`,
];

/** Per-tier — gold/legendary dostaje mocniejszy ton. */
const ACHIEVEMENT_TEMPLATES: Record<string, Array<(h: string, n: string) => string>> = {
  bronze: [
    (h, n) => `${h} odhaczył: „${n}". Niczym kwitek na regale.`,
    (h, n) => `${h} — „${n}". Cicho, ale stało się.`,
  ],
  silver: [
    (h, n) => `${h} zalicza „${n}". Rośnie legenda.`,
    (h, n) => `${h} wpisuje do kroniki: „${n}". Dobre.`,
  ],
  gold: [
    (h, n) => `${h} rozwala „${n}". Karczmarz nalewa na koszt firmy.`,
    (h, n) => `Kronikarz zapisuje: „${n}" — robota ${h}a.`,
  ],
  legendary: [
    (h, n) => `„${n}" — ${h} zostanie zapamiętany. Może nawet w pieśni.`,
    (h, n) => `${h} kończy „${n}". Starzy mówią „widzieliśmy go".`,
  ],
};

/** Stabilny, niekryptograficzny hash string → non-negative int. */
function hashIndex(seed: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h % mod;
}

/**
 * Rozmiary pul template'ów per-kind. **Musi pasować 1:1** do tablic w tym
 * pliku (BOSS_TEMPLATES, LEGENDARY_TEMPLATES, ...) ORAZ do client-side
 * `apps/web/src/i18n/chronicle-templates.ts`. Klient liczy idx z tej samej
 * formuły co my, więc rozmiary muszą się zgadzać dla determinizmu.
 */
const TEMPLATE_POOL_SIZES = {
  boss_kill: 4,
  legendary_drop: 4,
  level_milestone: 4,
  arena_victory: 4,
  arena_streak: 3,
  guild_founded: 3,
  guild_joined: 3,
  guild_war_won: 3,
  guild_raid_killed: 3,
  world_boss_killed: 3,
  achievement_unlock: 2, // per tier — wszystkie tiery mają 2 warianty
} as const;

/**
 * Liczy deterministyczny indeks template'u dla danego eventu. Wywoływany
 * przy `listChronicleEntries` żeby klient mógł wybrać matching template
 * po stronie i18n.
 */
export function computeTemplateIdx(payload: ChroniclePayload, stableKey: string): number {
  const size = TEMPLATE_POOL_SIZES[payload.kind];
  return hashIndex(stableKey, size);
}

/**
 * Zwraca tekst kroniki dla eventu. `stableKey` (np. event.id) zapewnia że
 * ten sam event zawsze renderuje się tym samym szablonem — brak "mrugania".
 */
export function renderChronicleEvent(payload: ChroniclePayload, stableKey: string): string {
  switch (payload.kind) {
    case 'boss_kill': {
      const tpl = BOSS_TEMPLATES[hashIndex(stableKey, BOSS_TEMPLATES.length)];
      return tpl(payload.heroName, payload.questTitle);
    }
    case 'legendary_drop': {
      const tpl = LEGENDARY_TEMPLATES[hashIndex(stableKey, LEGENDARY_TEMPLATES.length)];
      return tpl(payload.heroName, payload.itemName);
    }
    case 'level_milestone': {
      const tpl = LEVEL_TEMPLATES[hashIndex(stableKey, LEVEL_TEMPLATES.length)];
      return tpl(payload.heroName, payload.level);
    }
    case 'achievement_unlock': {
      const pool = ACHIEVEMENT_TEMPLATES[payload.tier] ?? ACHIEVEMENT_TEMPLATES.bronze;
      const tpl = pool[hashIndex(stableKey, pool.length)];
      return tpl(payload.heroName, payload.achievementName);
    }
    case 'arena_victory': {
      const tpl =
        ARENA_VICTORY_TEMPLATES[hashIndex(stableKey, ARENA_VICTORY_TEMPLATES.length)];
      return tpl(payload.heroName, payload.opponentName, payload.pointsDelta);
    }
    case 'arena_streak': {
      const tpl =
        ARENA_STREAK_TEMPLATES[hashIndex(stableKey, ARENA_STREAK_TEMPLATES.length)];
      return tpl(payload.heroName, payload.streak);
    }
    case 'guild_founded': {
      const tpl =
        GUILD_FOUNDED_TEMPLATES[hashIndex(stableKey, GUILD_FOUNDED_TEMPLATES.length)];
      return tpl(payload.heroName, payload.guildName);
    }
    case 'guild_joined': {
      const tpl =
        GUILD_JOINED_TEMPLATES[hashIndex(stableKey, GUILD_JOINED_TEMPLATES.length)];
      return tpl(payload.heroName, payload.guildName);
    }
    case 'guild_war_won': {
      const tpl =
        GUILD_WAR_WON_TEMPLATES[hashIndex(stableKey, GUILD_WAR_WON_TEMPLATES.length)];
      const score = `${payload.attackerScore}:${payload.defenderScore}`;
      return tpl(payload.guildName, payload.opponentName, score);
    }
    case 'guild_raid_killed': {
      const tpl =
        GUILD_RAID_KILLED_TEMPLATES[
          hashIndex(stableKey, GUILD_RAID_KILLED_TEMPLATES.length)
        ];
      return tpl(payload.guildName, payload.bossName, payload.tier);
    }
    case 'world_boss_killed': {
      const tpl =
        WORLD_BOSS_KILLED_TEMPLATES[
          hashIndex(stableKey, WORLD_BOSS_KILLED_TEMPLATES.length)
        ];
      return tpl(payload.heroName, payload.bossName, payload.tier, payload.contributors);
    }
  }
}

// ---------- Listing ----------

/** Mulberry32 — prosty, deterministyczny PRNG. Seed = string → uint32. */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h ^ seed.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  const rand = () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Zwraca listę wpisów do wyświetlenia w panelu Kronik. Miesza real eventy ze
 * smakowymi NPC/SEED'ami, tasuje deterministycznie po dniu UTC, tak żeby
 * gracz w ciągu dnia widział stabilną kolejność (rotacja co 60s w kliencie
 * ma sens), ale nowy dzień = nowa tasowanka.
 */
export async function listChronicleEntries(db: Db): Promise<ChronicleEntry[]> {
  const today = isoDateUTC();

  const eventRows = await db
    .select({
      id: chronicleEvents.id,
      payload: chronicleEvents.payload,
      createdAt: chronicleEvents.createdAt,
    })
    .from(chronicleEvents)
    .orderBy(desc(chronicleEvents.createdAt))
    .limit(MAX_EVENTS);

  const eventEntries: ChronicleEntry[] = eventRows.map((row) => ({
    id: `event:${row.id}`,
    text: renderChronicleEvent(row.payload, row.id),
    source: 'event' as const,
    createdAt: row.createdAt.getTime(),
    payload: row.payload,
    templateIdx: computeTemplateIdx(row.payload, row.id),
  }));

  // Flavor pool — odpowiada za kick-off batchu Claude jeśli go brak.
  // PL-only na razie (Claude generuje po polsku). Klient w trybie EN
  // mapuje te wpisy na statyczne SEED_CHRONICLES_EN po stronie i18n.
  const flavorTexts = await pickChronicleFlavorPool(db, MAX_FLAVOR);
  const flavorEntries: ChronicleEntry[] = flavorTexts.map((text, i) => ({
    id: `flavor:${today}:${i}`,
    text,
    source: 'flavor' as const,
    createdAt: null,
    payload: null,
    templateIdx: null,
  }));

  const combined = [...eventEntries, ...flavorEntries];
  if (combined.length === 0) {
    return SEED_CHRONICLES.map((text, i) => ({
      id: `seed:${i}`,
      text,
      source: 'flavor' as const,
      createdAt: null,
      payload: null,
      templateIdx: null,
    }));
  }

  return seededShuffle(combined, today);
}

/** Count helper — used by tests to introspect dedup behavior. */
export async function countEventsForCharacter(db: Db, characterId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(chronicleEvents)
    .where(eq(chronicleEvents.characterId, characterId));
  return row?.n ?? 0;
}
