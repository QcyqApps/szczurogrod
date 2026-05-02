// Bilingual chronicle templates — render structured `ChroniclePayload` from
// the server in PL or EN at the client side based on the active language.
//
// **Pool sizes MUST match server's `TEMPLATE_POOL_SIZES`** in
// `apps/server/src/game/chronicle.ts`. Server pre-computes `templateIdx`
// using the same hash + same pool size, so each event lands on a template
// at the same index here. If you add/remove a variant, update both files
// in lockstep — out-of-bounds idx falls back to `entry.text` (the PL
// pre-render the server still ships).

import type { ChronicleEntry, ChroniclePayload } from '@grodno/shared';
import type { Lang } from './store';

type Lib<T> = Record<Lang, T>;

const BOSS: Lib<Array<(h: string, t: string) => string>> = {
  pl: [
    (h, t) => `${h} ubił coś co kiedyś było wielkie. Zwane: ${t}.`,
    (h, t) => `${h} wracał z lasu. Trzymał ${t} za włosy.`,
    (h, t) => `${h} nie pamięta ile uderzeń. Pamięta: ${t} padł.`,
    (h, t) => `„${t}" — sprawa zamknięta. Podpisane: ${h}.`,
  ],
  en: [
    (h, t) => `${h} put down something that used to be big. They called it: ${t}.`,
    (h, t) => `${h} came back from the woods. Dragging ${t} by the hair.`,
    (h, t) => `${h} can't say how many strikes. They can say: ${t} went down.`,
    (h, t) => `"${t}" — case closed. Signed: ${h}.`,
  ],
};

const LEGENDARY: Lib<Array<(h: string, it: string) => string>> = {
  pl: [
    (h, it) => `${h} wyciągnął ${it} ze skrzyni. Nie pytaj z której.`,
    (h, it) => `${h} trafił na ${it}. Zazdrośnicy milczą głośno.`,
    (h, it) => `Komuś się poszczęściło — ${h}, rzecz zwana ${it}.`,
    (h, it) => `${h} znalazł ${it}. Będzie się chwalił tydzień.`,
  ],
  en: [
    (h, it) => `${h} pulled ${it} out of a chest. Don't ask which one.`,
    (h, it) => `${h} got their hands on ${it}. The envious are loud about it.`,
    (h, it) => `Lucky day — ${h}, the thing called ${it}.`,
    (h, it) => `${h} found ${it}. We're going to hear about it for a week.`,
  ],
};

const LEVEL: Lib<Array<(h: string, l: number) => string>> = {
  pl: [
    (h, l) => `${h} osiągnął ${l}. poziom. Już go tak nie wyśmiewają.`,
    (h, l) => `${h} — ${l}. poziom. Karczmarz zapamiętuje zamówienie.`,
    (h, l) => `${h} skończył ${l}. lvl. Ktoś, gdzieś, jest z niego dumny.`,
    (h, l) => `${h} awansował na ${l}. poziom. Bez fanfar.`,
  ],
  en: [
    (h, l) => `${h} reached level ${l}. They mock them less now.`,
    (h, l) => `${h} — level ${l}. The innkeep memorises their order.`,
    (h, l) => `${h} finished lvl ${l}. Someone, somewhere, is proud.`,
    (h, l) => `${h} advanced to level ${l}. No fanfare.`,
  ],
};

const ARENA_VICTORY: Lib<Array<(h: string, o: string, d: number) => string>> = {
  pl: [
    (h, o, d) => `${h} rozstawił ${o} po sieni. ${d >= 0 ? '+' : ''}${d} pkt, bez łez.`,
    (h, o, d) => `W arenie: ${h} → ${o}. Różnica punktów: ${d >= 0 ? '+' : ''}${d}.`,
    (h, o, d) => `${o} poszedł się umyć. ${h} ma to gdzieś (${d >= 0 ? '+' : ''}${d}).`,
    (h, o, _d) => `${h} pobił ${o}. Tłum mruknął z aprobatą. Jeden raz.`,
  ],
  en: [
    (h, o, d) => `${h} ran ${o} around the room. ${d >= 0 ? '+' : ''}${d} pts, no tears.`,
    (h, o, d) => `In the arena: ${h} → ${o}. Point swing: ${d >= 0 ? '+' : ''}${d}.`,
    (h, o, d) => `${o} went to wash up. ${h} doesn't care (${d >= 0 ? '+' : ''}${d}).`,
    (h, o, _d) => `${h} beat ${o}. The crowd grunted approval. Once.`,
  ],
};

const ARENA_STREAK: Lib<Array<(h: string, s: number) => string>> = {
  pl: [
    (h, s) => `${h} — ${s} wygrane z rzędu. Ktoś powinien mu odebrać miecz.`,
    (h, s) => `Passa ${h}a: ${s}. Tabulator się kończy.`,
    (h, s) => `${s} z rzędu. ${h} pije wodę i wraca do kolejki.`,
  ],
  en: [
    (h, s) => `${h} — ${s} wins in a row. Someone should take their sword away.`,
    (h, s) => `${h}'s streak: ${s}. The tally's running out.`,
    (h, s) => `${s} in a row. ${h} drinks water and gets back in line.`,
  ],
};

const GUILD_FOUNDED: Lib<Array<(h: string, g: string) => string>> = {
  pl: [
    (h, g) => `${h} założył gildię „${g}". Ma już logo i motto.`,
    (h, g) => `Nowa gildia: „${g}". Wódz — ${h}. Herb do ustalenia.`,
    (h, g) => `„${g}" — sformowana. Za podpisem: ${h}.`,
  ],
  en: [
    (h, g) => `${h} founded the guild "${g}". Logo and motto already.`,
    (h, g) => `New guild: "${g}". Chieftain — ${h}. Coat of arms TBD.`,
    (h, g) => `"${g}" — formed. Under the signature of: ${h}.`,
  ],
};

const GUILD_JOINED: Lib<Array<(h: string, g: string) => string>> = {
  pl: [
    (h, g) => `${h} dołączył do „${g}". Będzie pił na czyjś rachunek.`,
    (h, g) => `„${g}" przyjmuje ${h}a. Rekrut, ale ambitny.`,
    (h, g) => `${h} — nowy w „${g}". Sztandar trochę wymiętoszony.`,
  ],
  en: [
    (h, g) => `${h} joined "${g}". They'll be drinking on someone else's tab.`,
    (h, g) => `"${g}" takes in ${h}. A recruit, but an ambitious one.`,
    (h, g) => `${h} — new in "${g}". The banner's a touch crumpled.`,
  ],
};

const GUILD_WAR_WON: Lib<Array<(g: string, o: string, s: string) => string>> = {
  pl: [
    (g, o, s) => `„${g}" ogarnia „${o}" ${s}. Karczmarz policzył.`,
    (g, o, s) => `Wojna: „${g}" vs „${o}" ${s}. Sztandar zostaje.`,
    (g, o, s) => `„${g}" wygrywa z „${o}" ${s}. Głosy spokojniejsze.`,
  ],
  en: [
    (g, o, s) => `"${g}" handled "${o}" ${s}. The innkeep tallied it.`,
    (g, o, s) => `War: "${g}" vs "${o}" ${s}. The banner stays.`,
    (g, o, s) => `"${g}" beats "${o}" ${s}. Voices are quieter now.`,
  ],
};

const GUILD_RAID_KILLED: Lib<Array<(g: string, b: string, t: number) => string>> = {
  pl: [
    (g, b, t) => `„${g}" ubija „${b}" (tier ${t}). Następny już za rogiem.`,
    (g, b, t) => `„${b}" padł. „${g}" zbiera. Tier ${t} — zamknięty.`,
    (g, b, t) => `„${g}" kończy temat z „${b}" na tier ${t}. Krótko i rzeczowo.`,
  ],
  en: [
    (g, b, t) => `"${g}" puts down "${b}" (tier ${t}). Next one's around the corner.`,
    (g, b, t) => `"${b}" fell. "${g}" gathers. Tier ${t} — closed.`,
    (g, b, t) => `"${g}" finishes business with "${b}" at tier ${t}. Short, to the point.`,
  ],
};

const WORLD_BOSS_KILLED: Lib<
  Array<(h: string, b: string, t: number, c: number) => string>
> = {
  pl: [
    (h, b, t, c) =>
      `${h} dobija „${b}" (tier ${t}). Świat patrzył — ${c} osób w tym maczało palce.`,
    (h, b, t, c) =>
      `„${b}" padł. ${h} zadał ostatni cios. Tier ${t}, ${c} chętnych do napluwania.`,
    (h, b, t, c) =>
      `Wybudzony zasnął. ${h} z ${c}-osobowej zgrai zamyka „${b}" na tier ${t}.`,
  ],
  en: [
    (h, b, t, c) =>
      `${h} finishes "${b}" (tier ${t}). The whole server watched — ${c} hands on the kill.`,
    (h, b, t, c) =>
      `"${b}" fell. ${h} landed the killing blow. Tier ${t}, ${c} contributors.`,
    (h, b, t, c) =>
      `The Awakened sleeps. ${h} from a ${c}-strong mob seals "${b}" at tier ${t}.`,
  ],
};

const ACHIEVEMENT: Record<string, Lib<Array<(h: string, n: string) => string>>> = {
  bronze: {
    pl: [
      (h, n) => `${h} odhaczył: „${n}". Niczym kwitek na regale.`,
      (h, n) => `${h} — „${n}". Cicho, ale stało się.`,
    ],
    en: [
      (h, n) => `${h} ticked off: "${n}". Like a slip on the shelf.`,
      (h, n) => `${h} — "${n}". Quiet, but done.`,
    ],
  },
  silver: {
    pl: [
      (h, n) => `${h} zalicza „${n}". Rośnie legenda.`,
      (h, n) => `${h} wpisuje do kroniki: „${n}". Dobre.`,
    ],
    en: [
      (h, n) => `${h} clears "${n}". The legend grows.`,
      (h, n) => `${h} writes into the chronicle: "${n}". Good.`,
    ],
  },
  gold: {
    pl: [
      (h, n) => `${h} rozwala „${n}". Karczmarz nalewa na koszt firmy.`,
      (h, n) => `Kronikarz zapisuje: „${n}" — robota ${h}a.`,
    ],
    en: [
      (h, n) => `${h} smashes "${n}". The innkeep pours one on the house.`,
      (h, n) => `The chronicler writes: "${n}" — ${h}'s work.`,
    ],
  },
  legendary: {
    pl: [
      (h, n) => `„${n}" — ${h} zostanie zapamiętany. Może nawet w pieśni.`,
      (h, n) => `${h} kończy „${n}". Starzy mówią „widzieliśmy go".`,
    ],
    en: [
      (h, n) => `"${n}" — ${h} will be remembered. Maybe even in song.`,
      (h, n) => `${h} finishes "${n}". The elders say "we saw them".`,
    ],
  },
};

// Static EN-only flavor pool — shown in place of PL flavor/seed entries when
// `lang === 'en'`. Daily AI-generated content stays PL until Phase 2 adds
// bilingual generation. Mapping is index-based: flavor:#0 → SEED[0], etc.,
// so the same in-game day shows stable EN copy.
const SEED_CHRONICLES_EN: readonly string[] = [
  'Wojciech drowned his sword in the moat. Says he meant to.',
  'Jadwiga won the horseshoe-toss tournament. Nobody was surprised.',
  'Bolek slept through his level-up. Confused in the morning.',
  'Helena opened a chest. Found another chest.',
  'The innkeep raised the price of beer. The chroniclers declare mourning.',
  'Mieszko went mushroom-hunting. Came back with a troll. Left it in the barn.',
  'Gretka of Rzepnica returned from the dungeon. With the dungeon.',
  'Stasio learned a new spell. So far it only hurts him.',
  'A passing bard tried to sing. The dogs took it personally.',
  'Someone tipped over the gravediggers\' barrel. They thanked the gravediggers.',
  'A delivery of pierogi went missing. The duke noticed.',
  'The town clock chimed thirteen. The clock-keeper denies everything.',
];

function pickFromLib<T>(
  lib: Lib<T[]>,
  lang: Lang,
  idx: number,
): T | null {
  const arr = lib[lang];
  if (!arr || arr.length === 0) return null;
  return arr[idx % arr.length];
}

/**
 * Renders a chronicle entry into the active language. Falls back to the
 * server-shipped PL `text` whenever:
 *   - no payload (flavor/seed) and `lang !== 'en'`
 *   - kind unknown to client (forward-compat: old client + new event kind)
 *   - templateIdx out of range (theoretical, post-deploy mismatch)
 */
export function renderChronicleEntry(entry: ChronicleEntry, lang: Lang): string {
  // Flavor / seed without payload — swap to EN seed pool when applicable.
  if (entry.payload === null) {
    if (lang === 'en') {
      // Flavor entries get stable EN copy keyed by their position in the
      // current day's batch; seed entries fall through to the EN seed
      // pool at their literal index.
      const m = entry.id.match(/(?:flavor|seed):.*:(\d+)$/) ??
        entry.id.match(/^seed:(\d+)$/);
      const idx = m ? Number(m[1]) : 0;
      return SEED_CHRONICLES_EN[idx % SEED_CHRONICLES_EN.length];
    }
    return entry.text;
  }
  const payload = entry.payload;
  const idx = entry.templateIdx ?? 0;

  switch (payload.kind) {
    case 'boss_kill': {
      const tpl = pickFromLib(BOSS, lang, idx);
      return tpl ? tpl(payload.heroName, payload.questTitle) : entry.text;
    }
    case 'legendary_drop': {
      const tpl = pickFromLib(LEGENDARY, lang, idx);
      return tpl ? tpl(payload.heroName, payload.itemName) : entry.text;
    }
    case 'level_milestone': {
      const tpl = pickFromLib(LEVEL, lang, idx);
      return tpl ? tpl(payload.heroName, payload.level) : entry.text;
    }
    case 'achievement_unlock': {
      const tier = payload.tier;
      const lib = ACHIEVEMENT[tier] ?? ACHIEVEMENT.bronze;
      const tpl = pickFromLib(lib, lang, idx);
      return tpl ? tpl(payload.heroName, payload.achievementName) : entry.text;
    }
    case 'arena_victory': {
      const tpl = pickFromLib(ARENA_VICTORY, lang, idx);
      return tpl
        ? tpl(payload.heroName, payload.opponentName, payload.pointsDelta)
        : entry.text;
    }
    case 'arena_streak': {
      const tpl = pickFromLib(ARENA_STREAK, lang, idx);
      return tpl ? tpl(payload.heroName, payload.streak) : entry.text;
    }
    case 'guild_founded': {
      const tpl = pickFromLib(GUILD_FOUNDED, lang, idx);
      return tpl ? tpl(payload.heroName, payload.guildName) : entry.text;
    }
    case 'guild_joined': {
      const tpl = pickFromLib(GUILD_JOINED, lang, idx);
      return tpl ? tpl(payload.heroName, payload.guildName) : entry.text;
    }
    case 'guild_war_won': {
      const tpl = pickFromLib(GUILD_WAR_WON, lang, idx);
      const score = `${payload.attackerScore}:${payload.defenderScore}`;
      return tpl ? tpl(payload.guildName, payload.opponentName, score) : entry.text;
    }
    case 'guild_raid_killed': {
      const tpl = pickFromLib(GUILD_RAID_KILLED, lang, idx);
      return tpl ? tpl(payload.guildName, payload.bossName, payload.tier) : entry.text;
    }
    case 'world_boss_killed': {
      const tpl = pickFromLib(WORLD_BOSS_KILLED, lang, idx);
      return tpl
        ? tpl(payload.heroName, payload.bossName, payload.tier, payload.contributors)
        : entry.text;
    }
    default: {
      const _exhaustive: never = payload;
      void _exhaustive;
      return entry.text;
    }
  }
}

// Re-exported so callers don't have to import ChroniclePayload separately
// from @grodno/shared just for type ergonomics.
export type { ChroniclePayload };
