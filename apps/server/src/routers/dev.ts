// Dev-only router. Gated przez NODE_ENV !== 'production'.
//
// Używane wyłącznie do lokalnego testowania (np. gem shop bypass — dostajesz
// produkt bez płacenia). Każdy endpoint sprawdza env i rzuca FORBIDDEN
// w prod. Shared schemas ograniczają max wartości (10k gems, 1M gold).
//
// Gdy wejdzie prawdziwy IAP (Phase Capacitor M4), ten router zostaje jako
// tool developerski; w prod buildzie Vite'a podpięcie klient-side będzie
// gated przez `import.meta.env.DEV`.

import { TRPCError } from '@trpc/server';
import { eq, sql } from 'drizzle-orm';
import type { DevGrantPurchaseResponse } from '@grodno/shared';
import { devGrantPurchaseInputSchema } from '@grodno/shared';
import { characters } from '../db/schema.js';
import { env } from '../env.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

function assertDev(): void {
  if (env.NODE_ENV === 'production') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Endpoint dostępny tylko w dev.',
    });
  }
}

export const devRouter = router({
  /** DEV bypass gem shopu: grant'uje gems/gold bez płatności. */
  grantPurchase: protectedProcedure
    .input(devGrantPurchaseInputSchema)
    .mutation(async ({ ctx, input }): Promise<DevGrantPurchaseResponse> => {
      assertDev();
      if (input.gems === 0 && input.gold === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Nic do przyznania (gems=0, gold=0).',
        });
      }
      const [char] = await ctx.db
        .select({ id: characters.id })
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);
      if (!char) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });
      }
      await ctx.db
        .update(characters)
        .set({
          gems: sql`${characters.gems} + ${input.gems}`,
          gold: sql`${characters.gold} + ${input.gold}`,
        })
        .where(eq(characters.id, char.id));
      return {
        ok: true,
        grantedGems: input.gems,
        grantedGold: input.gold,
      };
    }),
});
