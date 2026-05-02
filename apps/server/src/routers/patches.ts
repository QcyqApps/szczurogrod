// Patch log router.
//
// `list` — public, klient pull'uje z refetchInterval'em ~5 minut. Jeśli
//   najnowszy id różni się od localStorage `lastSeenPatchId`, banner zachęca
//   do hard-refresha.
// `create` — admin-gated (x-admin-token). Wywoływane przez Claude Code
//   po explicitnym approval'u w czacie. Alternatywnie skrypt
//   `scripts/add-patch.ts` z bezpośrednim DB connectem (mirrored shape).

import { desc } from 'drizzle-orm';
import { z } from 'zod';
import type { PatchListResponse } from '@grodno/shared';
import { patches } from '../db/schema.js';
import { adminProcedure, publicProcedure, router } from '../trpc/trpc.js';

const LIST_LIMIT = 30;

const patchCreateInputSchema = z.object({
  version: z.string().min(1).max(64),
  title: z.string().min(1).max(255),
  body: z.string().min(1).max(20_000),
});

export const patchesRouter = router({
  list: publicProcedure.query(async ({ ctx }): Promise<PatchListResponse> => {
    const rows = await ctx.db
      .select({
        id: patches.id,
        version: patches.version,
        title: patches.title,
        body: patches.body,
        releasedAt: patches.releasedAt,
      })
      .from(patches)
      .orderBy(desc(patches.releasedAt))
      .limit(LIST_LIMIT);

    return {
      entries: rows.map((r) => ({
        id: r.id,
        version: r.version,
        title: r.title,
        body: r.body,
        releasedAt: r.releasedAt.getTime(),
      })),
    };
  }),

  create: adminProcedure
    .input(patchCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(patches)
        .values({
          version: input.version,
          title: input.title,
          body: input.body,
        })
        .returning({
          id: patches.id,
          version: patches.version,
          title: patches.title,
          releasedAt: patches.releasedAt,
        });
      return {
        ok: true as const,
        id: row.id,
        version: row.version,
        title: row.title,
        releasedAt: row.releasedAt.getTime(),
      };
    }),
});
