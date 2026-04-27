import { initTRPC, TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import superjson from 'superjson';
import type { ZodError } from 'zod';
import { users } from '../db/schema.js';
import { env } from '../env.js';
import type { Context } from './context.js';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause instanceof Error && 'issues' in error.cause
            ? (error.cause as ZodError).flatten()
            : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Cache istnienia user_id'ów żeby nie bić PK lookup'em na każde
 * protectedProcedure'e (me.get jest pollowane, idle game robi ich dużo).
 * 30s TTL — kompromis między świeżością (po deleteAccount JWT zostaje
 * unieważniony w max 30s) a kosztem (większość requestów hituje cache).
 *
 * Deletion flow: po `me.deleteAccount` token gracza traci ważność najpóźniej
 * po 30s — wystarczająco do GDPR „natychmiastowe usunięcie". Stateless JWT
 * w teorii żyje 15min, ale ten gate ucina to do TTL cache'u.
 */
const USER_EXISTS_TTL_MS = 30_000;
const userExistsCache = new Map<string, number>();

async function assertUserExists(db: Context['db'], userId: string): Promise<void> {
  const cached = userExistsCache.get(userId);
  const now = Date.now();
  if (cached !== undefined && cached > now) return;
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) {
    userExistsCache.delete(userId);
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Konto nie istnieje.' });
  }
  userExistsCache.set(userId, now + USER_EXISTS_TTL_MS);
}

/**
 * Wywołaj po `me.deleteAccount` (lub każdej innej operacji co kasuje user'a)
 * żeby cache nie trzymał stale entry przez TTL.
 */
export function invalidateUserCache(userId: string): void {
  userExistsCache.delete(userId);
}

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sign in required' });
  }
  await assertUserExists(ctx.db, ctx.userId);
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

/**
 * Gates on the `x-admin-token` request header matching ADMIN_TOKEN env.
 * Separate from user auth so the admin UI can run alongside a normal player
 * session. If ADMIN_TOKEN is unset in env, the endpoint is disabled for
 * everyone.
 */
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  const header = ctx.req.headers['x-admin-token'];
  const token = Array.isArray(header) ? header[0] : header;
  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Admin token required' });
  }
  return next();
});
