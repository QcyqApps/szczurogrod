// Mnich Panteleon — router blessing'ów.
//
// Endpointy:
//   - status — lista ofert + cooldown do następnego kupna
//   - buy    — validate (cooldown, gold, nie override'uje silniejszego
//              istniejącego buff'a), applyBuff, deduct gold, set cooldown.
//
// Sloty buff'ów są wspólne z elixir-mikstur (te same `buff_kind` enum)
// przez istniejącą tabelę `character_buffs`. Gdy gracz ma już aktywny
// silniejszy buff tej samej kategorii, odmawiamy — nie ma sensu downgrade'ować.

import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import {
  blessingBuyInputSchema,
  type BlessingBuyResponse,
  type BlessingStatusResponse,
} from '@grodno/shared';
import { characters } from '../db/schema.js';
import {
  BLESSINGS,
  blessingReadyAtMs,
  computeBlessingCost,
  getBlessing,
} from '../game/blessings.js';
import { applyBuff, loadActiveBuffs } from '../game/buffs.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

export const blessingRouter = router({
  status: protectedProcedure.query(async ({ ctx }): Promise<BlessingStatusResponse> => {
    const [row] = await ctx.db
      .select({ lastBlessingAt: characters.lastBlessingAt, lvl: characters.lvl })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
    return {
      offers: BLESSINGS.map((b) => ({
        id: b.id,
        name: b.name,
        desc: b.desc,
        icon: b.icon,
        kind: b.kind,
        magnitude: b.magnitude,
        durationHours: b.durationHours,
        // Scaling LVL — player-specific. L1 płaci base, L30 ~30× base.
        costGold: computeBlessingCost(b.costGoldBase, row.lvl),
      })),
      cooldownReadyAt: blessingReadyAtMs(row.lastBlessingAt),
    };
  }),

  buy: protectedProcedure
    .input(blessingBuyInputSchema)
    .mutation(async ({ ctx, input }): Promise<BlessingBuyResponse> => {
      const offer = getBlessing(input.id);
      if (!offer) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Nieznane błogosławieństwo.' });
      }
      const [char] = await ctx.db
        .select()
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);
      if (!char) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
      }

      const now = new Date();
      const readyAt = blessingReadyAtMs(char.lastBlessingAt, now);
      if (readyAt !== null) {
        const sec = Math.ceil((readyAt - now.getTime()) / 1000);
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Panteleon medytuje. Wróć za ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}.`,
        });
      }

      // Anti-cheat: recompute cost server-side z LVL gracza. Klient mógł
      // dostać nieaktualny status (level-up w międzyczasie) albo próbować
      // zapłacić za starą cenę — serwer zawsze validuje na świeżej wartości.
      const scaledCost = computeBlessingCost(offer.costGoldBase, char.lvl);

      if (char.gold < scaledCost) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Brak gold'a (${scaledCost}). Masz ${char.gold}.`,
        });
      }

      // Odmów downgrade'owania silniejszego aktywnego buff'a tej samej kategorii.
      // Elixir +50% HP aktywny → nie pozwalaj kupić Panteleon +10% który by go
      // wymazał. Ten sam lub słabszy override (np. wcześniejszy +10% HP) jest OK
      // — odświeża timer.
      const active = await loadActiveBuffs(ctx.db, char.id, now);
      const existing = active.find((b) => b.kind === offer.kind);
      if (existing && existing.magnitude > offer.magnitude) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Masz już silniejsze: +${existing.magnitude}${offer.kind.endsWith('_pct') ? '%' : ''}. Panteleon nie zepsuje Ci tego.`,
        });
      }

      let buffExpiresAt: Date | null = null;
      await ctx.db.transaction(async (tx) => {
        buffExpiresAt = await applyBuff(
          tx,
          char.id,
          offer.kind,
          offer.magnitude,
          offer.durationHours,
          null, // sourceItemId null — to nie item, tylko blessing
          now,
        );
        await tx
          .update(characters)
          .set({
            gold: char.gold - scaledCost,
            lastBlessingAt: now,
            updatedAt: now,
          })
          .where(eq(characters.id, char.id));
      });

      return {
        ok: true as const,
        gold: char.gold - scaledCost,
        buffExpiresAt: (buffExpiresAt as Date | null)?.getTime() ?? 0,
        cooldownReadyAt: blessingReadyAtMs(now, now),
      };
    }),
});
