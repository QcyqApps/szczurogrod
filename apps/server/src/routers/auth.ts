import { TRPCError } from '@trpc/server';
import { and, eq, gt, isNull } from 'drizzle-orm';
import {
  type AuthResponse,
  loginInputSchema,
  registerInputSchema,
} from '@grodno/shared';
import { z } from 'zod';
import { env } from '../env.js';
import { hashPassword, verifyPassword } from '../auth/passwords.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
  ttlToMs,
} from '../auth/tokens.js';
import { characters, refreshTokens, users } from '../db/schema.js';
import { publicProcedure, router } from '../trpc/trpc.js';

async function issueTokens(
  db: typeof import('../db/client.js').db,
  userId: string,
): Promise<AuthResponse> {
  const accessToken = await signAccessToken(userId);
  const { raw, hash } = generateRefreshToken();
  const expiresAt = new Date(Date.now() + ttlToMs(env.JWT_REFRESH_TTL));
  await db.insert(refreshTokens).values({ userId, tokenHash: hash, expiresAt });
  const [userRow] = await db
    .select({ email: users.email, isGuest: users.isGuest })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const charRows = await db
    .select({ id: characters.id })
    .from(characters)
    .where(eq(characters.userId, userId))
    .limit(1);
  return {
    accessToken,
    refreshToken: raw,
    userId,
    email: userRow?.email ?? null,
    isGuest: userRow?.isGuest ?? false,
    hasCharacter: charRows.length > 0,
  };
}

export const authRouter = router({
  register: publicProcedure.input(registerInputSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);
    if (existing.length > 0) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Email already registered' });
    }
    const passwordHash = await hashPassword(input.password);
    const [inserted] = await ctx.db
      .insert(users)
      .values({ email: input.email, passwordHash, isGuest: false })
      .returning({ id: users.id });
    return issueTokens(ctx.db, inserted.id);
  }),

  login: publicProcedure.input(loginInputSchema).mutation(async ({ ctx, input }) => {
    const [user] = await ctx.db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);
    if (!user || !user.passwordHash) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }
    const ok = await verifyPassword(user.passwordHash, input.password);
    if (!ok) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }
    return issueTokens(ctx.db, user.id);
  }),

  guest: publicProcedure.mutation(async ({ ctx }) => {
    const [inserted] = await ctx.db
      .insert(users)
      .values({ isGuest: true })
      .returning({ id: users.id });
    return issueTokens(ctx.db, inserted.id);
  }),

  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const hash = hashRefreshToken(input.refreshToken);
      const [record] = await ctx.db
        .select({ id: refreshTokens.id, userId: refreshTokens.userId })
        .from(refreshTokens)
        .where(
          and(
            eq(refreshTokens.tokenHash, hash),
            gt(refreshTokens.expiresAt, new Date()),
            isNull(refreshTokens.revokedAt),
          ),
        )
        .limit(1);
      if (!record) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid refresh token' });
      }
      // Rotate: revoke old, issue new.
      await ctx.db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.id, record.id));
      return issueTokens(ctx.db, record.userId);
    }),

  logout: publicProcedure
    .input(z.object({ refreshToken: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const hash = hashRefreshToken(input.refreshToken);
      await ctx.db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.tokenHash, hash));
      return { ok: true };
    }),
});
