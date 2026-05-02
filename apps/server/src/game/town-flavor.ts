// Town flavor one-liners. Claude generates ~25 bilingual pairs per class per
// day (PL + EN razem w jednym callu) na pierwszym requeście który znajdzie
// pusty batch. Późniejsze requesty losują z zapisanych. Jeśli generation
// jeszcze biegnie, API key brak, lub call failed — `pickFlavor` zwraca
// hardcoded default w odpowiednim języku, ekran nigdy nie jest pusty.

import Anthropic from '@anthropic-ai/sdk';
import { and, eq, sql } from 'drizzle-orm';
import type { CharacterClass } from '@grodno/shared';
import type { Db } from '../db/client.js';
import { townFlavors } from '../db/schema.js';
import { isoDateUTC } from './daily.js';
import { env } from '../env.js';

export type FlavorLang = 'pl' | 'en';

const TARGET_PER_DAY = 25;
const MAX_QUIP_LENGTH = 200;

/**
 * Hardcoded fallbacks per (class × lang). Pokazane gdy batch nie gotowy
 * lub generation failed. EN to nie maszynowy przekład — pisane w tym samym
 * deadpan rejstrze co reszta kopii.
 */
const DEFAULTS: Record<CharacterClass, Record<FlavorLang, readonly string[]>> = {
  warrior: {
    pl: [
      'Jeszcze jeden smok i wracam na piwo.',
      'Miecz mam zatępiony, ale piwo zawsze ostre.',
      'Tarcza ciężka jak sumienie kowala.',
    ],
    en: [
      'One more dragon and I’m off for a beer.',
      'Sword’s blunt. Beer’s sharp. Priorities.',
      'Shield’s heavy. Conscience heavier.',
    ],
  },
  mage: {
    pl: [
      'Czy wszyscy widzą tę fioletową mgłę, czy tylko ja?',
      'Staroslowianska klątwa czy zwykły kac — trzeba sprawdzić.',
      'Różdżka mruczy. Zwykle wie, co robi.',
    ],
    en: [
      'Does everyone see the purple mist, or just me?',
      'Ancient curse or just a hangover. Hard to tell.',
      'The wand’s humming. It usually knows things.',
    ],
  },
  rogue: {
    pl: [
      'Nie ukradłem. Przesunąłem do swojej kieszeni.',
      'Zamek był otwarty. Ja tylko sprawdziłem.',
      'Cień to też mieszkanie, nawet mam adres.',
    ],
    en: [
      'I didn’t steal it. I moved it to my pocket.',
      'The lock was open. I just verified.',
      'A shadow is also an address.',
    ],
  },
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
 * Returns a flavor text for the given class + lang. Jeśli dzisiejszy batch
 * < TARGET_PER_DAY, triggeruje async generation (best-effort, fire-and-
 * forget) i zwraca fallback default w żądanym języku.
 *
 * EN'em przy NULL `text_en` (legacy rows sprzed migracji 0066) fallback'uje
 * na PL — brzydkie ale unikatowe ryzyko jest tylko dla jednego dnia po
 * deployu, kolejne batch'e są bilingual.
 */
export async function pickFlavor(
  db: Db,
  cls: CharacterClass,
  lang: FlavorLang,
): Promise<string> {
  const today = isoDateUTC();
  const rows = await db
    .select({ pl: townFlavors.textPl, en: townFlavors.textEn })
    .from(townFlavors)
    .where(and(eq(townFlavors.generatedDate, today), eq(townFlavors.cls, cls)));

  if (rows.length >= TARGET_PER_DAY) {
    const row = pickRandom(rows);
    return resolveLang(row, lang);
  }

  void maybeGenerate(db, today, cls);

  if (rows.length > 0) {
    const row = pickRandom(rows);
    return resolveLang(row, lang);
  }
  return pickRandom(DEFAULTS[cls][lang]);
}

function resolveLang(row: { pl: string; en: string | null }, lang: FlavorLang): string {
  if (lang === 'en') return row.en ?? row.pl;
  return row.pl;
}

function maybeGenerate(db: Db, date: string, cls: CharacterClass): Promise<void> {
  const key = lockKey(date, cls);
  const started = inFlight.get(key);
  const now = Date.now();
  if (started !== undefined && now - started < LOCK_TIMEOUT_MS) {
    return Promise.resolve();
  }
  if (!env.ANTHROPIC_API_KEY) {
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

const CLASS_EXAMPLES: Record<CharacterClass, { pl: string; en: string }> = {
  warrior: {
    pl: 'Jeszcze jeden smok i wracam na piwo.',
    en: 'One more dragon and I’m off for a beer.',
  },
  mage: {
    pl: 'Czy wszyscy widzą tę fioletową mgłę, czy tylko ja?',
    en: 'Does everyone see the purple mist, or just me?',
  },
  rogue: {
    pl: 'Nie ukradłem. Przesunąłem do swojej kieszeni.',
    en: 'I didn’t steal it. I moved it to my pocket.',
  },
};

const CLASS_LABEL: Record<CharacterClass, { pl: string; en: string }> = {
  warrior: { pl: 'wojownik', en: 'warrior' },
  mage: { pl: 'mag', en: 'mage' },
  rogue: { pl: 'łotrzyk', en: 'rogue' },
};

const SYSTEM_PROMPT = `You write short bilingual one-liners (Polish + English) for an idle-RPG called Szczurogród (English brand: Ratburg). Style: deadpan absurdist humor, dry, restrained. Polish original is the lead — English mirrors the tone, not a literal translation. Both languages: max 12 words, no emoji, no trailing quotes, one beat per line. Each output is a JSON array of objects { "pl": "...", "en": "..." }.`;

function userPrompt(cls: CharacterClass): string {
  const ex = CLASS_EXAMPLES[cls];
  const label = CLASS_LABEL[cls];
  return `Generate ${TARGET_PER_DAY} unique bilingual one-liners that a ${label.en} (PL: ${label.pl}) might say upon entering Ratburg. Style example (DO NOT copy): { "pl": "${ex.pl}", "en": "${ex.en}" }. Return as JSON object with "pairs" array.`;
}

interface GeneratedPair {
  pl: string;
  en: string;
}
interface GeneratedPayload {
  pairs: GeneratedPair[];
}

async function generateBatch(db: Db, date: string, cls: CharacterClass): Promise<void> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 6000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt(cls) }],
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
        p.pl.length <= MAX_QUIP_LENGTH &&
        p.en.length <= MAX_QUIP_LENGTH,
    );

  if (clean.length === 0) {
    throw new Error('Generated 0 usable pairs');
  }

  await db
    .insert(townFlavors)
    .values(
      clean.map((p) => ({
        generatedDate: date,
        cls,
        textPl: p.pl,
        textEn: p.en,
      })),
    )
    .onConflictDoNothing();

  const [after] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(townFlavors)
    .where(and(eq(townFlavors.generatedDate, date), eq(townFlavors.cls, cls)));

  console.log(
    `[town-flavor] generated bilingual batch date=${date} cls=${cls} added=${clean.length} total=${after?.n ?? 0}`,
  );
}
