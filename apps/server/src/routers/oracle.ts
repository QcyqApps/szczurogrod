// Wróżka Hanusia — router Wyroczni. Wzorowane 1:1 na `dice.ts`:
// status + pull, darmowy 1/UTC dzień + extra za gemy.
//
// Różnice wobec dice: zawsze coś daje (brak 'nothing' outcome), XP jako
// kategoria (wymaga applyXpGain + level-up response), stablowe scaling
// gold'a wg LVL. Wszystko server-authoritative.

import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import {
  GEM_SINK_COSTS,
  oraclePullInputSchema,
  type OraclePullResponse,
  type OracleStatusResponse,
} from '@grodno/shared';
import { characterItems, characters } from '../db/schema.js';
import { isoDateUTC } from '../game/daily.js';
import {
  BAG_CAP,
  getBagCount,
  insertOrStackPotion,
  itemTemplateToRowValues,
} from '../game/inventory.js';
import { applyXpGain, summarizeLevelUps } from '../game/leveling.js';
import { performOraclePull } from '../game/oracle.js';
import { applyXpBonus } from '../game/subscription.js';
import { registerScrapbookFind } from '../game/scrapbook.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

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
  oracleFreeUsedDate: string | null,
  today: string,
): OracleStatusResponse {
  return {
    freeAvailable: oracleFreeUsedDate !== today,
    extraCostGems: GEM_SINK_COSTS.extraOraclePull,
    nextFreeAt: nextUtcMidnightMs(),
  };
}

const FLAVORS = {
  gold: [
    'Hanusia wypluwa monety w dłoń. Pachnie ziemią.',
    'Karty ułożyły się w żółty szlaczek. Bierz szybko.',
    'Grosiwo. „Nic wielkiego", mówi, „ale zawsze coś."',
  ],
  xp: [
    'Hanusia szepce coś w starej mowie. W głowie robi się jaśniej.',
    'Karta Księżyca — „Będziesz wiedział więcej niż chciałbyś."',
    'Okrągła mądrość. Nieduża, ale twoja.',
  ],
  potion: [
    'Hanusia wyciąga zza pazuchy flaszkę. Nie pytaj gdzie ją trzymała.',
    'Mikstura. „Na później", mówi. „Albo na nigdy."',
    'Szklana buteleczka z ciepłym mętnym płynem. Pachnie żalem.',
  ],
  common_item: [
    'Coś drewnianego. Coś metalowego. Coś twojego.',
    'Hanusia kładzie rzecz na stole i odwraca głowę. Weź.',
    '„To bez historii", mówi. „Ale działa."',
  ],
  rare_item: [
    'Hanusia łapie oddech. „To się rzadko zdarza." Biorąc, nie dziękuj.',
    'Karta trzecia: błysk. Coś cennego zeszło z półki.',
    '„Miało trafić do kogoś innego", mruczy. „Ale karty mówią — tobie."',
  ],
};

function pickFlavor(kind: OraclePullResponse['kind'], rng: () => number = Math.random): string {
  const pool = FLAVORS[kind];
  return pool[Math.floor(rng() * pool.length)] ?? pool[0]!;
}

export const oracleRouter = router({
  status: protectedProcedure.query(async ({ ctx }): Promise<OracleStatusResponse> => {
    const [row] = await ctx.db
      .select({ oracleFreeUsedDate: characters.oracleFreeUsedDate })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
    return computeStatus(row.oracleFreeUsedDate, isoDateUTC());
  }),

  pull: protectedProcedure
    .input(oraclePullInputSchema)
    .mutation(async ({ ctx, input }): Promise<OraclePullResponse> => {
      const [char] = await ctx.db
        .select()
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);
      if (!char) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
      }

      const today = isoDateUTC();
      const freeAvailable = char.oracleFreeUsedDate !== today;

      if (input.useFree) {
        if (!freeAvailable) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Darmowy pull już wykorzystany dziś. Wróć jutro albo zapłać gemami.',
          });
        }
      } else {
        const cost = GEM_SINK_COSTS.extraOraclePull;
        if (char.gems < cost) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Brak gemów (${cost}). Masz ${char.gems}.`,
          });
        }
      }

      const reward = performOraclePull(char.lvl, char.cls);

      let levelUpInfo: OraclePullResponse['levelUp'] = null;

      await ctx.db.transaction(async (tx) => {
        // 1. Free-use flag lub gem deduct.
        if (input.useFree) {
          await tx
            .update(characters)
            .set({ oracleFreeUsedDate: today, updatedAt: new Date() })
            .where(eq(characters.id, char.id));
        } else {
          await tx
            .update(characters)
            .set({
              gems: char.gems - GEM_SINK_COSTS.extraOraclePull,
              updatedAt: new Date(),
            })
            .where(eq(characters.id, char.id));
        }

        // 2. Gold bezpośrednio na konto.
        if (reward.gold > 0) {
          await tx
            .update(characters)
            .set({ gold: char.gold + reward.gold, updatedAt: new Date() })
            .where(eq(characters.id, char.id));
        }

        // 3. XP z level-up cascade.
        if (reward.xp > 0) {
          const xpGain = applyXpBonus(char, reward.xp);
          const { progression, ups } = applyXpGain(
            {
              cls: char.cls,
              lvl: char.lvl,
              xp: char.xp,
              xpMax: char.xpMax,
              hp: char.hp,
              hpMax: char.hpMax,
              mp: char.mp,
              mpMax: char.mpMax,
              stamina: char.stamina,
              staminaMax: char.staminaMax,
            },
            xpGain,
          );
          await tx
            .update(characters)
            .set({
              lvl: progression.lvl,
              xp: progression.xp,
              xpMax: progression.xpMax,
              hp: progression.hp,
              hpMax: progression.hpMax,
              mp: progression.mp,
              mpMax: progression.mpMax,
              stamina: progression.stamina,
              staminaMax: progression.staminaMax,
              updatedAt: new Date(),
            })
            .where(eq(characters.id, char.id));
          const summary = summarizeLevelUps(ups);
          if (summary) levelUpInfo = summary;
        }

        // 4. Item — potion lub equipment.
        if (reward.item) {
          const it = reward.item;
          if (it.slot === 'potion') {
            const stored = await insertOrStackPotion(tx, char.id, it.id, 'shop');
            if (stored === null) {
              // Plecak pełny — konwertuj na gold (equiv wartości sell).
              reward.kind = 'gold';
              reward.gold = 150;
              reward.item = null;
              await tx
                .update(characters)
                .set({ gold: char.gold + 150, updatedAt: new Date() })
                .where(eq(characters.id, char.id));
            }
          } else {
            if ((await getBagCount(tx, char.id)) >= BAG_CAP) {
              reward.kind = 'gold';
              reward.gold = 150;
              reward.item = null;
              await tx
                .update(characters)
                .set({ gold: char.gold + 150, updatedAt: new Date() })
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
        input.useFree ? today : char.oracleFreeUsedDate,
        today,
      );
      return {
        kind: reward.kind,
        gold: reward.gold,
        xp: reward.xp,
        item: reward.item
          ? {
              id: reward.item.id,
              name: reward.item.name,
              icon: reward.item.icon,
              rarity: reward.item.rarity,
              slot: reward.item.slot,
            }
          : null,
        flavor: pickFlavor(reward.kind),
        status: freshStatus,
        levelUp: levelUpInfo,
      };
    }),
});
