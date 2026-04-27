// Claude-generated kroniki NPC — batch ~20 per dzień UTC, globalny (bez klasy).
// Wzorzec 1:1 z `town-flavor.ts`: lock system, fallback, fire-and-forget
// background generation. `pickChronicleFlavorPool(db, N)` zwraca N tekstów
// (random sample z dzisiejszego batchu), uruchamia generowanie gdy pusto.

import Anthropic from '@anthropic-ai/sdk';
import { and, eq, sql } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { townChronicles } from '../db/schema.js';
import { env } from '../env.js';
import { isoDateUTC } from './daily.js';

const TARGET_PER_DAY = 20;
const MAX_ENTRY_LENGTH = 200;

/**
 * Stałe ziarenka — backup na wypadek brakującego API key'a lub pierwszego
 * requestu zanim batch się wygeneruje. Ten sam ton co gra: sucho, fragmenty,
 * konkret. Imiona — polskie ludowe, miejsca — swojskie.
 */
export const SEED_CHRONICLES: readonly string[] = [
  'Wojciech utopił miecz w fosie. Twierdzi, że celowo.',
  'Jadwiga wygrała turniej w rzut podkową. Nikt się nie zdziwił.',
  'Bolek przespał swój poziom. Rano był zdziwiony.',
  'Helena otworzyła skrzynię. Znalazła inną skrzynię.',
  'Karczmarz podniósł ceny piwa. Gildia kronikarzy ogłasza żałobę.',
  'Mieszko poszedł po grzyby. Wrócił z trollem. Trolla zostawił w stodole.',
  'Gretka z Rzepnicy wróciła z lochu. Z lochem.',
  'Stasio nauczył się nowego zaklęcia. Na razie tylko go rani.',
];

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
 * Zwraca do `limit` losowych flavorów dla dzisiejszego dnia. Jeśli batch
 * niepełny — wystrzeliwuje background generation i zwraca co jest (lub
 * SEED_CHRONICLES gdy nic).
 */
export async function pickChronicleFlavorPool(db: Db, limit: number): Promise<string[]> {
  const today = isoDateUTC();
  const rows = await db
    .select({ text: townChronicles.text })
    .from(townChronicles)
    .where(eq(townChronicles.generatedDate, today));

  if (rows.length < TARGET_PER_DAY) {
    void maybeGenerate(db, today);
  }

  if (rows.length > 0) {
    return pickRandomSample(
      rows.map((r) => r.text),
      limit,
    );
  }

  return pickRandomSample(SEED_CHRONICLES, limit);
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

const SYSTEM_PROMPT = `Jesteś generatorem jednozdaniowych kronik do idle-RPG „Szczurogród". Każda kronika to krótki nagłówek z życia JEDNEGO bohatera lub NPC miasta — coś między plotką a notką w gazecie. Styl: suchy humor, fragmenty, konkret. Polskie ludowe imiona (Gretka, Wojciech, Mieszko, Jadwiga, Bolek, Helena, Stasio, Maryla, Janko, Weronika). Max 14 słów. Bez emoji, bez wielu wykrzykników, bez cudzysłowów na końcu. Informacja first, joke second.

Przykłady tonu z gry (NIE kopiuj treści):
- "Staruszka jest głodna. I zła. Jest zgłodniała."
- "Mikstura Pierwsza Lepsza — Leczy trochę. Albo wcale."
- "Rdzawy Miecz — +5 ATK. Rdza wliczona w cenę."

Przykłady formatu kroniki (NIE kopiuj):
- "Wojciech utopił miecz w fosie. Twierdzi, że celowo."
- "Jadwiga wygrała turniej w rzut podkową. Nikt się nie zdziwił."
- "Karczmarz podniósł ceny piwa. Gildia kronikarzy ogłasza żałobę."`;

function userPrompt(): string {
  return `Wygeneruj ${TARGET_PER_DAY} unikatowych kronik miasta Szczurogród. Każda kronika w osobnym stringu, różne imiona, różne sytuacje (łowy, targowisko, karczma, kapłan, złodziej, magiczne dziwactwa, codzienne absurdy). Nie powtarzaj się. Zwróć JSON array stringów.`;
}

interface GeneratedPayload {
  chronicles: string[];
}

async function generateBatch(db: Db, date: string): Promise<void> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt() }],
    output_config: {
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            chronicles: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['chronicles'],
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
  if (!Array.isArray(parsed.chronicles)) {
    throw new Error('Response missing chronicles array');
  }

  const clean = parsed.chronicles
    .map((t) => t?.trim())
    .filter((t): t is string => Boolean(t) && t.length <= MAX_ENTRY_LENGTH);

  if (clean.length === 0) {
    throw new Error('Generated 0 usable chronicles');
  }

  await db
    .insert(townChronicles)
    .values(clean.map((text) => ({ generatedDate: date, text })))
    .onConflictDoNothing();

  const [after] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(townChronicles)
    .where(and(eq(townChronicles.generatedDate, date)));

  console.log(
    `[town-chronicle] generated batch date=${date} added=${clean.length} total=${after?.n ?? 0}`,
  );
}
