// Town flavor one-liners. Claude generates ~25 quips per class per day on the
// first request that finds the batch empty; later requests pick one at random
// from the stored batch. If generation is still running — or the API key is
// unset / the call failed — `pickFlavor` returns a baked-in default so the
// town screen is never blank.

import Anthropic from '@anthropic-ai/sdk';
import { and, eq, sql } from 'drizzle-orm';
import type { CharacterClass } from '@grodno/shared';
import type { Db } from '../db/client.js';
import { townFlavors } from '../db/schema.js';
import { isoDateUTC } from './daily.js';
import { env } from '../env.js';

/** How many quips we aim to have per (day, class) before stopping generation. */
const TARGET_PER_DAY = 25;

/** Never trust LLM output blindly — cap each quip. */
const MAX_QUIP_LENGTH = 200;

/** Hardcoded fallbacks. Shown when the batch isn't ready yet or generation fails. */
const DEFAULTS: Record<CharacterClass, readonly string[]> = {
  warrior: [
    'Jeszcze jeden smok i wracam na piwo.',
    'Miecz mam zatępiony, ale piwo zawsze ostre.',
    'Tarcza ciężka jak sumienie kowala.',
  ],
  mage: [
    'Czy wszyscy widzą tę fioletową mgłę, czy tylko ja?',
    'Staroslowianska klątwa czy zwykły kac — trzeba sprawdzić.',
    'Różdżka mruczy. Zwykle wie, co robi.',
  ],
  rogue: [
    'Nie ukradłem. Przesunąłem do swojej kieszeni.',
    'Zamek był otwarty. Ja tylko sprawdziłem.',
    'Cień to też mieszkanie, nawet mam adres.',
  ],
};

/** Locks to keep multiple concurrent requests from spinning up N generations. */
const inFlight = new Map<string, number>();
const LOCK_TIMEOUT_MS = 10 * 60 * 1000;

function lockKey(date: string, cls: CharacterClass): string {
  return `${date}|${cls}`;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns a flavor text for the given class. If today's batch has fewer than
 * TARGET_PER_DAY entries, triggers async generation (best-effort, fire-and-
 * forget) and returns a fallback default for this request.
 */
export async function pickFlavor(db: Db, cls: CharacterClass): Promise<string> {
  const today = isoDateUTC();
  const rows = await db
    .select({ text: townFlavors.text })
    .from(townFlavors)
    .where(and(eq(townFlavors.generatedDate, today), eq(townFlavors.cls, cls)));

  if (rows.length >= TARGET_PER_DAY) {
    return pickRandom(rows).text;
  }

  // Background generation — don't block the user's request.
  void maybeGenerate(db, today, cls);

  // If we have *some* rows (partial batch), prefer those over defaults.
  if (rows.length > 0) return pickRandom(rows).text;
  return pickRandom(DEFAULTS[cls]);
}

function maybeGenerate(db: Db, date: string, cls: CharacterClass): Promise<void> {
  const key = lockKey(date, cls);
  const started = inFlight.get(key);
  const now = Date.now();
  if (started !== undefined && now - started < LOCK_TIMEOUT_MS) {
    return Promise.resolve(); // already generating
  }
  if (!env.ANTHROPIC_API_KEY) {
    // Log once per process — no point retrying without credentials.
    if (!warnedNoKey) {
      console.warn('[town-flavor] ANTHROPIC_API_KEY is unset — using defaults only');
      warnedNoKey = true;
    }
    return Promise.resolve();
  }

  inFlight.set(key, now);
  return generateBatch(db, date, cls)
    .catch((err) => {
      console.error('[town-flavor] generation failed', { date, cls, err });
    })
    .finally(() => {
      inFlight.delete(key);
    });
}

let warnedNoKey = false;

const CLASS_EXAMPLES: Record<CharacterClass, string> = {
  warrior: "Jeszcze jeden smok i wracam na piwo.",
  mage: "Czy wszyscy widzą tę fioletową mgłę, czy tylko ja?",
  rogue: "Nie ukradłem. Przesunąłem do swojej kieszeni.",
};

const CLASS_LABEL: Record<CharacterClass, string> = {
  warrior: 'wojownika',
  mage: 'maga',
  rogue: 'łotrzyka',
};

const SYSTEM_PROMPT = `Jesteś generatorem krótkich, zabawnych powiedzonek po polsku do idle-RPG o nazwie Szczurogród. Styl: absurdalny, suchy humor, miejscami fantasy-groteska, czasem odwołania do prostego życia (piwo, lokalni ludzie, plotki). Każde powiedzonko to JEDNO zdanie, wypowiedziane przez bohatera po wejściu do miasta. Bez emoji. Bez cudzysłowów na końcu.`;

function userPrompt(cls: CharacterClass): string {
  return `Wygeneruj ${TARGET_PER_DAY} unikatowych powiedzonek, które może wypowiedzieć ${CLASS_LABEL[cls]} wchodząc do miasta Szczurogród. Przykład ogólnego stylu (NIE kopiuj): "${CLASS_EXAMPLES[cls]}". Każde powiedzonko: krótkie (do 12 słów), wpadające w ucho, z odrobiną humoru. Nie powtarzaj się. Zwróć wynik jako JSON array stringów.`;
}

interface GeneratedPayload {
  texts: string[];
}

async function generateBatch(db: Db, date: string, cls: CharacterClass): Promise<void> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt(cls) }],
    output_config: {
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            texts: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['texts'],
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
  if (!Array.isArray(parsed.texts)) {
    throw new Error('Response missing texts array');
  }

  const clean = parsed.texts
    .map((t) => t?.trim())
    .filter((t): t is string => Boolean(t) && t.length <= MAX_QUIP_LENGTH);

  if (clean.length === 0) {
    throw new Error('Generated 0 usable quips');
  }

  // Insert; ignore duplicates (unique index on date+cls+text) so re-runs within
  // the same lock window don't explode.
  await db
    .insert(townFlavors)
    .values(
      clean.map((text) => ({
        generatedDate: date,
        cls,
        text,
      })),
    )
    .onConflictDoNothing();

  const [after] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(townFlavors)
    .where(and(eq(townFlavors.generatedDate, date), eq(townFlavors.cls, cls)));

  console.log(
    `[town-flavor] generated batch date=${date} cls=${cls} added=${clean.length} total=${after?.n ?? 0}`,
  );
}
