// Claude-generated bilingual NPC chronicles — batch ~20 par PL/EN per dzień
// UTC, globalny (bez klasy). Wzorzec 1:1 z `town-flavor.ts`: lock system,
// fallback, fire-and-forget background generation, jeden Claude call na
// PL+EN razem (połowa kosztu API vs dwa osobne wywołania).

import Anthropic from '@anthropic-ai/sdk';
import { and, eq, sql } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { townChronicles } from '../db/schema.js';
import { env } from '../env.js';
import { isoDateUTC } from './daily.js';

export type ChronicleLang = 'pl' | 'en';

const TARGET_PER_DAY = 20;
const MAX_ENTRY_LENGTH = 200;

/**
 * Stałe ziarenka — backup na wypadek brakującego API key'a lub pierwszego
 * requestu zanim batch się wygeneruje. Ten sam ton co gra: sucho, fragmenty,
 * konkret. Imiona — polskie ludowe, EN: tłumaczenie zachowujące tone.
 */
export const SEED_CHRONICLES: Record<ChronicleLang, readonly string[]> = {
  pl: [
    'Wojciech utopił miecz w fosie. Twierdzi, że celowo.',
    'Jadwiga wygrała turniej w rzut podkową. Nikt się nie zdziwił.',
    'Bolek przespał swój poziom. Rano był zdziwiony.',
    'Helena otworzyła skrzynię. Znalazła inną skrzynię.',
    'Karczmarz podniósł ceny piwa. Gildia kronikarzy ogłasza żałobę.',
    'Mieszko poszedł po grzyby. Wrócił z trollem. Trolla zostawił w stodole.',
    'Gretka z Rzepnicy wróciła z lochu. Z lochem.',
    'Stasio nauczył się nowego zaklęcia. Na razie tylko go rani.',
  ],
  en: [
    'Wojciech dropped his sword in the moat. Claims it was intentional.',
    'Jadwiga won the horseshoe-toss tournament. No one was surprised.',
    'Bolek slept through his level-up. Confused in the morning.',
    'Helena opened a chest. Found another chest.',
    'The innkeeper raised beer prices. The chroniclers’ guild declares mourning.',
    'Mieszko went mushroom-picking. Came back with a troll. Left it in the barn.',
    'Gretka of Rzepnica returned from the dungeon. With the dungeon.',
    'Stasio learned a new spell. So far it only hurts him.',
  ],
};

const inFlight = new Map<string, number>();
const LOCK_TIMEOUT_MS = 10 * 60 * 1000;
let warnedNoKey = false;

function pickRandomSample<T>(arr: readonly T[], n: number): T[] {
  if (arr.length <= n) return arr.slice();
  const pool = arr.slice();
  const out: T[] = [];
  for (let i = 0; i < n; i += 1) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}

/**
 * Zwraca do `limit` losowych flavorów dla dzisiejszego dnia w żądanym
 * języku. Jeśli batch niepełny — wystrzeliwuje background generation.
 * EN przy NULL `text_en` (legacy rows) fallback'uje na PL — patrz komentarz
 * w `pickFlavor`.
 */
export async function pickChronicleFlavorPool(
  db: Db,
  limit: number,
  lang: ChronicleLang,
): Promise<string[]> {
  const today = isoDateUTC();
  const rows = await db
    .select({ pl: townChronicles.textPl, en: townChronicles.textEn })
    .from(townChronicles)
    .where(eq(townChronicles.generatedDate, today));

  if (rows.length < TARGET_PER_DAY) {
    void maybeGenerate(db, today);
  }

  if (rows.length > 0) {
    const sampled = pickRandomSample(rows, limit);
    return sampled.map((r) => (lang === 'en' ? r.en ?? r.pl : r.pl));
  }

  return pickRandomSample(SEED_CHRONICLES[lang], limit);
}

function maybeGenerate(db: Db, date: string): Promise<void> {
  const started = inFlight.get(date);
  const now = Date.now();
  if (started !== undefined && now - started < LOCK_TIMEOUT_MS) {
    return Promise.resolve();
  }
  if (!env.ANTHROPIC_API_KEY) {
    if (!warnedNoKey) {
      console.warn('[town-chronicle] ANTHROPIC_API_KEY is unset — using SEED_CHRONICLES only');
      warnedNoKey = true;
    }
    return Promise.resolve();
  }

  inFlight.set(date, now);
  return generateBatch(db, date)
    .catch((err) => {
      console.error('[town-chronicle] generation failed', { date, err });
    })
    .finally(() => {
      inFlight.delete(date);
    });
}

const SYSTEM_PROMPT = `You write bilingual (Polish + English) one-line town chronicles for an idle-RPG called Szczurogród (English brand: Ratburg). Each chronicle is a short headline from the life of ONE hero or NPC — somewhere between gossip and a newspaper note. Style: dry humor, fragments, concrete. Polish original uses Polish folk names (Gretka, Wojciech, Mieszko, Jadwiga, Bolek, Helena, Stasio, Maryla, Janko, Weronika); keep the same names in EN. Max 14 words per line, no emoji, no trailing quotes. Information first, joke second.

Tone references from the game (DO NOT copy):
- "Staruszka jest głodna. I zła. Jest zgłodniała." / "Old lady's hungry. And angry. And starving."
- "Mikstura Pierwsza Lepsza — Leczy trochę. Albo wcale." / "Plain Old Potion — heals a bit. Or not at all."

Format example (DO NOT copy content):
{ "pl": "Wojciech utopił miecz w fosie. Twierdzi, że celowo.", "en": "Wojciech dropped his sword in the moat. Claims it was intentional." }`;

function userPrompt(): string {
  return `Generate ${TARGET_PER_DAY} unique bilingual chronicles for the town of Ratburg / Szczurogród. Each chronicle in its own pair, different names, different situations (hunting, market, tavern, priest, thief, magical oddities, daily absurdities). Don't repeat. Return JSON object with "pairs" array.`;
}

interface GeneratedPair {
  pl: string;
  en: string;
}
interface GeneratedPayload {
  pairs: GeneratedPair[];
}

async function generateBatch(db: Db, date: string): Promise<void> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 6000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt() }],
    output_config: {
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            pairs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  pl: { type: 'string' },
                  en: { type: 'string' },
                },
                required: ['pl', 'en'],
                additionalProperties: false,
              },
            },
          },
          required: ['pairs'],
          additionalProperties: false,
        },
      },
    },
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text block in response');
  }
  const parsed = JSON.parse(textBlock.text) as GeneratedPayload;
  if (!Array.isArray(parsed.pairs)) {
    throw new Error('Response missing pairs array');
  }

  const clean = parsed.pairs
    .map((p) => ({ pl: p?.pl?.trim(), en: p?.en?.trim() }))
    .filter(
      (p): p is { pl: string; en: string } =>
        Boolean(p.pl) &&
        Boolean(p.en) &&
        p.pl.length <= MAX_ENTRY_LENGTH &&
        p.en.length <= MAX_ENTRY_LENGTH,
    );

  if (clean.length === 0) {
    throw new Error('Generated 0 usable pairs');
  }

  await db
    .insert(townChronicles)
    .values(clean.map((p) => ({ generatedDate: date, textPl: p.pl, textEn: p.en })))
    .onConflictDoNothing();

  const [after] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(townChronicles)
    .where(and(eq(townChronicles.generatedDate, date)));

  console.log(
    `[town-chronicle] generated bilingual batch date=${date} added=${clean.length} total=${after?.n ?? 0}`,
  );
}
