// Patch log router.
//
// `list` — public, paginowane (default page=0, pageSize=10). Klient pull'uje
//   z refetchInterval'em ~5 minut. Jeśli najnowszy id różni się od
//   localStorage `lastSeenPatchId`, banner zachęca do hard-refresha.
// `create` — admin-gated (x-admin-token). Wywoływane przez Claude Code
//   po explicitnym approval'u w czacie z PL+EN tłumaczeniem. Alternatywnie
//   skrypt `scripts/add-patch.ts` z bezpośrednim DB connectem.

import { desc, sql } from 'drizzle-orm';
import {
  patchCreateInputSchema,
  patchListInputSchema,
  type PatchListResponse,
} from '@grodno/shared';
import { patches } from '../db/schema.js';
import { adminProcedure, publicProcedure, router } from '../trpc/trpc.js';

const MAX_PAGE_SIZE = 50;

export const patchesRouter = router({
  list: publicProcedure
    .input(patchListInputSchema.optional())
    .query(async ({ ctx, input }): Promise<PatchListResponse> => {
      const page = input?.page ?? 0;
      const pageSize = Math.min(input?.pageSize ?? 10, MAX_PAGE_SIZE);
      const offset = page * pageSize;

      const [{ count }] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(patches);

      const rows = await ctx.db
        .select({
          id: patches.id,
          version: patches.version,
          titlePl: patches.titlePl,
          bodyPl: patches.bodyPl,
          titleEn: patches.titleEn,
          bodyEn: patches.bodyEn,
          releasedAt: patches.releasedAt,
        })
        .from(patches)
        .orderBy(desc(patches.releasedAt))
        .limit(pageSize)
        .offset(offset);

      return {
        entries: rows.map((r) => ({
          id: r.id,
          version: r.version,
          titlePl: r.titlePl,
          bodyPl: r.bodyPl,
          titleEn: r.titleEn,
          bodyEn: r.bodyEn,
          releasedAt: r.releasedAt.getTime(),
        })),
        total: count ?? 0,
        page,
        pageSize,
      };
    }),

  create: adminProcedure
    .input(patchCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(patches)
        .values({
          version: input.version,
          titlePl: input.titlePl,
          bodyPl: input.bodyPl,
          titleEn: input.titleEn,
          bodyEn: input.bodyEn,
        })
        .returning({
          id: patches.id,
          version: patches.version,
          titlePl: patches.titlePl,
          titleEn: patches.titleEn,
          releasedAt: patches.releasedAt,
        });
      return {
        ok: true as const,
        id: row.id,
        version: row.version,
        titlePl: row.titlePl,
        titleEn: row.titleEn,
        releasedAt: row.releasedAt.getTime(),
      };
    }),
});
