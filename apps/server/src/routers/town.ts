import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import type { ChronicleListResponse } from '@grodno/shared';
import { characters } from '../db/schema.js';
import { listChronicleEntries } from '../game/chronicle.js';
import { pickFlavor } from '../game/town-flavor.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

export const townRouter = router({
  flavor: protectedProcedure.query(async ({ ctx }) => {
    const [char] = await ctx.db
      .select({ cls: characters.cls })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
    const text = await pickFlavor(ctx.db, char.cls);
    return { text };
  }),

  chronicle: protectedProcedure.query(async ({ ctx }): Promise<ChronicleListResponse> => {
    const entries = await listChronicleEntries(ctx.db);
    return { entries };
  }),
});
