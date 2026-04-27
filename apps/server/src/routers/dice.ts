// Karciarz Franek — router Kości.
//
// Endpointy:
//   - status — czy darmowy dostępny + cena extra + timestamp północy UTC
//   - roll   — wykonaj rzut (darmowy lub za 5 gemów)
//
// Anti-cheat: wszystko server-authoritative. Klient tylko animuje
// wynik — zwracany `roll` jest single source of truth. Free roll blokowany
// przez date-compare z `isoDateUTC()`; extra roll odlicza gemy atomowo.

import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import {
  GEM_SINK_COSTS,
  diceRollInputSchema,
  type DiceRollResponse,
  type DiceStatusResponse,
} from '@grodno/shared';
import { characterItems, characters } from '../db/schema.js';
import { isoDateUTC } from '../game/daily.js';
import { performDiceThrow } from '../game/dice.js';
import {
  BAG_CAP,
  getBagCount,
  insertOrStackPotion,
  itemTemplateToRowValues,
} from '../game/inventory.js';
import { registerScrapbookFind } from '../game/scrapbook.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

/** Unix ms najbliższej północy UTC. */
function nextUtcMidnightMs(now: Date = new Date()): number {
  return Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0,
  );
}

function computeStatus(
  diceFreeUsedDate: string | null,
  today: string,
): DiceStatusResponse {
  return {
    freeAvailable: diceFreeUsedDate !== today,
    extraCostGems: GEM_SINK_COSTS.extraDiceRoll,
    nextFreeAt: nextUtcMidnightMs(),
  };
}

/** Flavor quipy per wynik — krótkie, dry, w stylu gry. Rotacja losowa
 *  wewnątrz danej kategorii żeby nie czytał tego samego 10× pod rząd. */
const FLAVORS = {
  nothing: [
    'Kości pokazały szkło. Franek kiwa głową.',
    'Pech. Franek chowa monety do własnej sakiewki.',
    'Rzut bez emocji. Następny raz może być.',
    'Franek milczy. Dobrze wiesz co to znaczy.',
  ],
  gold_small: [
    'Drobniaki, ale zawsze coś. Franek liczy po swojemu.',
    '500 sztuk. Starczy na kawę i chleb.',
    'Franek wypłaca bez uśmiechu, ale wypłaca.',
  ],
  gold_big: [
    '1500! Franek spogląda podejrzliwie — pewnie szukasz haczyka.',
    'Dobry rzut. Franek zaraz zacznie kombinować jak to odzyskać.',
    'Tyle złota że aż za dużo na raz. Weź szybko, bo się rozmyśli.',
  ],
  jackpot_item: [
    'Dziesiątka! Coś Ci się trafiło z pod stołu.',
    'Franek sięga do kufra — to akurat masz mieć Ty.',
    'Jackpot. Pod lada kuchenny wypluwa coś rzadkiego.',
  ],
  jackpot_gems: [
    'Dziesiątka! Franek wyciąga garść kamieni z rękawa.',
    'Jackpot, same gemy. Franek udaje że go to boli.',
    '20 gemów! Mówiłeś, że nie przesądny?',
  ],
};

function pickFlavor(
  kind: DiceRollResponse['kind'],
  gold: number,
  rng: () => number = Math.random,
): string {
  let pool: readonly string[];
  if (kind === 'nothing') pool = FLAVORS.nothing;
  else if (kind === 'gold' && gold <= 500) pool = FLAVORS.gold_small;
  else if (kind === 'gold') pool = FLAVORS.gold_big;
  else if (kind === 'rare_item') pool = FLAVORS.jackpot_item;
  else pool = FLAVORS.jackpot_gems;
  return pool[Math.floor(rng() * pool.length)] ?? pool[0]!;
}

export const diceRouter = router({
  status: protectedProcedure.query(async ({ ctx }): Promise<DiceStatusResponse> => {
    const [row] = await ctx.db
      .select({ diceFreeUsedDate: characters.diceFreeUsedDate })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
    return computeStatus(row.diceFreeUsedDate, isoDateUTC());
  }),

  roll: protectedProcedure
    .input(diceRollInputSchema)
    .mutation(async ({ ctx, input }): Promise<DiceRollResponse> => {
      const [char] = await ctx.db
        .select()
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);
      if (!char) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
      }

      const today = isoDateUTC();
      const freeAvailable = char.diceFreeUsedDate !== today;

      if (input.useFree) {
        if (!freeAvailable) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Darmowy rzut już wykorzystany dziś. Wróć jutro albo zapłać gemami.',
          });
        }
      } else {
        const cost = GEM_SINK_COSTS.extraDiceRoll;
        if (char.gems < cost) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Brak gemów (${cost}). Masz ${char.gems}.`,
          });
        }
      }

      const { roll, reward } = performDiceThrow(char.lvl, char.cls);

      // Zapisujemy wszystko atomowo — reward + deduct gemów + mark free used.
      await ctx.db.transaction(async (tx) => {
        if (input.useFree) {
          await tx
            .update(characters)
            .set({ diceFreeUsedDate: today, updatedAt: new Date() })
            .where(eq(characters.id, char.id));
        } else {
          await tx
            .update(characters)
            .set({
              gems: char.gems - GEM_SINK_COSTS.extraDiceRoll,
              updatedAt: new Date(),
            })
            .where(eq(characters.id, char.id));
        }

        if (reward.gold > 0) {
          await tx
            .update(characters)
            .set({ gold: char.gold + reward.gold, updatedAt: new Date() })
            .where(eq(characters.id, char.id));
        }
        if (reward.gems > 0) {
          // Jeśli zużyliśmy gemy na extra, nasz `char.gems` lokalnie jest już
          // stary. Użyj SQL expression żeby inc na świeżej wartości.
          await tx
            .update(characters)
            .set({
              gems: input.useFree
                ? char.gems + reward.gems
                : char.gems - GEM_SINK_COSTS.extraDiceRoll + reward.gems,
              updatedAt: new Date(),
            })
            .where(eq(characters.id, char.id));
        }
        if (reward.kind === 'rare_item' && reward.item) {
          const it = reward.item;
          if (it.slot === 'potion') {
            const stored = await insertOrStackPotion(tx, char.id, it.id, 'shop');
            if (stored === null) {
              // Plecak pełny — zamień na gemy żeby gracz nie stracił jackpot'a.
              reward.kind = 'gems';
              reward.gems = 20;
              reward.item = null;
              await tx
                .update(characters)
                .set({
                  gems: input.useFree
                    ? char.gems + 20
                    : char.gems - GEM_SINK_COSTS.extraDiceRoll + 20,
                  updatedAt: new Date(),
                })
                .where(eq(characters.id, char.id));
            }
          } else {
            if ((await getBagCount(tx, char.id)) >= BAG_CAP) {
              reward.kind = 'gems';
              reward.gems = 20;
              reward.item = null;
              await tx
                .update(characters)
                .set({
                  gems: input.useFree
                    ? char.gems + 20
                    : char.gems - GEM_SINK_COSTS.extraDiceRoll + 20,
                  updatedAt: new Date(),
                })
                .where(eq(characters.id, char.id));
            } else {
              await tx
                .insert(characterItems)
                .values(itemTemplateToRowValues(it, char.id, 'shop'));
              await registerScrapbookFind(tx, char.id, it.id);
            }
          }
        }
      });

      const freshStatus = computeStatus(
        input.useFree ? today : char.diceFreeUsedDate,
        today,
      );
      return {
        roll,
        kind: reward.kind,
        gold: reward.gold,
        gems: reward.gems,
        item: reward.item
          ? {
              id: reward.item.id,
              name: reward.item.name,
              icon: reward.item.icon,
              rarity: reward.item.rarity,
            }
          : null,
        flavor: pickFlavor(reward.kind, reward.gold),
        status: freshStatus,
      };
    }),
});
