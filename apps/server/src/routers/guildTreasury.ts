// Guild treasury router — Phase 2.
//
// 3 endpointy: deposit, withdraw, log.
// - deposit: recruit+, cap'owane przez char.gold/gems. Bumpuje contributed_*.
// - withdraw: officer (gold) / leader (gems). Daily cap = (20% + vault bonus) * treasury.
// - log: wszyscy członkowie, 30 ostatnich akcji.
//
// Wszystkie mutacje logowane w guild_treasury_logs (immutable audit).

import { TRPCError } from '@trpc/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import type {
  GuildTreasuryLogResponse,
} from '@grodno/shared';
import {
  guildTreasuryDepositInputSchema,
  guildTreasuryWithdrawInputSchema,
} from '@grodno/shared';
import { characters, guildBuildings, guildMembers, guildTreasuryLogs, guilds } from '../db/schema.js';
import { isoDateUTC } from '../game/daily.js';
import { vaultExtraWithdrawPct } from '../game/guild-buildings.js';
import { assertCan } from '../game/guild-permissions.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

/** Daily withdraw cap base = 20% treasury. Vault dodaje więcej. */
const WITHDRAW_CAP_BASE_PCT = 0.2;

/**
 * Anti-alt: członek może wpłacać do skarbca dopiero po 24h od dołączenia
 * do gildii. Wraz z gating'iem rangowym (recruit nie może deposit'ować)
 * dodaje real-world friction do farmienia altów: alt → join → wait 24h
 * → promote → deposit. Fast-funding gildii staje się kosztowne czasowo.
 */
const DEPOSIT_TENURE_MS = 24 * 60 * 60 * 1000;

async function requireChar(
  db: import('../db/client.js').Db,
  userId: string,
): Promise<typeof characters.$inferSelect> {
  const [char] = await db.select().from(characters).where(eq(characters.userId, userId)).limit(1);
  if (!char) throw new TRPCError({ code: 'NOT_FOUND', message: 'Brak postaci.' });
  return char;
}

async function vaultLevel(
  db: import('../db/client.js').Db,
  guildId: string,
): Promise<number> {
  const [row] = await db
    .select({ level: guildBuildings.level })
    .from(guildBuildings)
    .where(and(eq(guildBuildings.guildId, guildId), eq(guildBuildings.slug, 'vault')))
    .limit(1);
  return row?.level ?? 0;
}

export const guildTreasuryRouter = router({
  deposit: protectedProcedure
    .input(guildTreasuryDepositInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);
      const { guildId } = await assertCan(ctx.db, char.id, 'treasury.deposit');

      // Tenure cooldown — 24h od join. Anti-alt: świeżo wprowadzony alt
      // nie może natychmiast wstrzykiwać gold'a do skarbca.
      const [member] = await ctx.db
        .select({ joinedAt: guildMembers.joinedAt })
        .from(guildMembers)
        .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.characterId, char.id)))
        .limit(1);
      if (member) {
        const tenureMs = Date.now() - member.joinedAt.getTime();
        if (tenureMs < DEPOSIT_TENURE_MS) {
          const hoursLeft = Math.ceil((DEPOSIT_TENURE_MS - tenureMs) / 3_600_000);
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Wpłaty dostępne po 24h od dołączenia. Jeszcze ${hoursLeft}h.`,
          });
        }
      }

      if (char.gold < input.gold || char.gems < input.gems) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Masz za mało złota/gemów.' });
      }

      await ctx.db.transaction(async (tx) => {
        // 1. Zabierz z postaci.
        await tx
          .update(characters)
          .set({
            gold: sql`${characters.gold} - ${input.gold}`,
            gems: sql`${characters.gems} - ${input.gems}`,
          })
          .where(eq(characters.id, char.id));

        // 2. Dodaj do skarbca.
        await tx
          .update(guilds)
          .set({
            treasuryGold: sql`${guilds.treasuryGold} + ${input.gold}`,
            treasuryGems: sql`${guilds.treasuryGems} + ${input.gems}`,
            updatedAt: new Date(),
          })
          .where(eq(guilds.id, guildId));

        // 3. Bump contributed tracking.
        await tx
          .update(guildMembers)
          .set({
            contributedGold: sql`${guildMembers.contributedGold} + ${input.gold}`,
            contributedGems: sql`${guildMembers.contributedGems} + ${input.gems}`,
            lastActiveAt: new Date(),
          })
          .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.characterId, char.id)));

        // 4. Log.
        await tx.insert(guildTreasuryLogs).values({
          guildId,
          actorCharId: char.id,
          actorName: char.name,
          kind: 'deposit',
          goldDelta: input.gold,
          gemsDelta: input.gems,
          memo: '',
        });
      });

      return { ok: true };
    }),

  withdraw: protectedProcedure
    .input(guildTreasuryWithdrawInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await requireChar(ctx.db, ctx.userId);

      // Gems → leader only; gold → officer+. Sprawdzamy granularnie.
      if (input.gems > 0) {
        await assertCan(ctx.db, char.id, 'treasury.withdrawGems');
      }
      if (input.gold > 0) {
        await assertCan(ctx.db, char.id, 'treasury.withdrawGold');
      }
      const { guildId } = await assertCan(ctx.db, char.id, 'treasury.withdrawGold');

      const [guild] = await ctx.db.select().from(guilds).where(eq(guilds.id, guildId)).limit(1);
      if (!guild) throw new TRPCError({ code: 'NOT_FOUND', message: 'Gildia nie istnieje.' });
      if (guild.treasuryGold < input.gold || guild.treasuryGems < input.gems) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Skarbiec nie ma tyle.',
        });
      }

      // Daily cap dla złota — reset UTC. Gems bez daily cap (tylko lider).
      const today = isoDateUTC();
      let dailyUsedToday = guild.dailyWithdrawalSum;
      let dailyDate = guild.lastWithdrawalDate;
      if (dailyDate !== today) {
        dailyUsedToday = 0;
        dailyDate = today;
      }

      if (input.gold > 0) {
        const vaultLvl = await vaultLevel(ctx.db, guildId);
        const capPct = WITHDRAW_CAP_BASE_PCT + vaultExtraWithdrawPct(vaultLvl);
        // Cap liczony od treasury SPRZED tej wypłaty + już wypłacone = baseline dla dziennego limitu.
        const capAbs = Math.floor((guild.treasuryGold + dailyUsedToday) * capPct);
        if (dailyUsedToday + input.gold > capAbs) {
          const remaining = Math.max(0, capAbs - dailyUsedToday);
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Dzienny limit wypłat: ${remaining}g (z ${capAbs}g cap).`,
          });
        }
      }

      await ctx.db.transaction(async (tx) => {
        // 1. Zabierz ze skarbca + bump daily tracker.
        await tx
          .update(guilds)
          .set({
            treasuryGold: sql`${guilds.treasuryGold} - ${input.gold}`,
            treasuryGems: sql`${guilds.treasuryGems} - ${input.gems}`,
            lastWithdrawalDate: dailyDate,
            dailyWithdrawalSum: dailyUsedToday + input.gold,
            updatedAt: new Date(),
          })
          .where(eq(guilds.id, guildId));

        // 2. Dodaj do postaci.
        await tx
          .update(characters)
          .set({
            gold: sql`${characters.gold} + ${input.gold}`,
            gems: sql`${characters.gems} + ${input.gems}`,
          })
          .where(eq(characters.id, char.id));

        // 3. Log.
        await tx.insert(guildTreasuryLogs).values({
          guildId,
          actorCharId: char.id,
          actorName: char.name,
          kind: 'withdraw',
          goldDelta: -input.gold,
          gemsDelta: -input.gems,
          memo: '',
        });
      });

      return { ok: true };
    }),

  log: protectedProcedure.query(async ({ ctx }): Promise<GuildTreasuryLogResponse> => {
    const char = await requireChar(ctx.db, ctx.userId);
    // Każdy członek może zobaczyć log.
    const [member] = await ctx.db
      .select({ guildId: guildMembers.guildId })
      .from(guildMembers)
      .where(eq(guildMembers.characterId, char.id))
      .limit(1);
    if (!member) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Nie jesteś w gildii.' });
    }

    const [guild] = await ctx.db
      .select()
      .from(guilds)
      .where(eq(guilds.id, member.guildId))
      .limit(1);
    if (!guild) throw new TRPCError({ code: 'NOT_FOUND', message: 'Gildia nie istnieje.' });

    const rows = await ctx.db
      .select()
      .from(guildTreasuryLogs)
      .where(eq(guildTreasuryLogs.guildId, member.guildId))
      .orderBy(desc(guildTreasuryLogs.createdAt))
      .limit(30);

    const today = isoDateUTC();
    const sumToday = guild.lastWithdrawalDate === today ? guild.dailyWithdrawalSum : 0;
    const vaultLvl = await vaultLevel(ctx.db, member.guildId);
    const capPct = WITHDRAW_CAP_BASE_PCT + vaultExtraWithdrawPct(vaultLvl);
    const cap = Math.floor((guild.treasuryGold + sumToday) * capPct);

    return {
      entries: rows.map((r) => ({
        id: r.id,
        actorName: r.actorName,
        kind: r.kind as GuildTreasuryLogResponse['entries'][number]['kind'],
        goldDelta: r.goldDelta,
        gemsDelta: r.gemsDelta,
        memo: r.memo,
        createdAt: r.createdAt.getTime(),
      })),
      dailyWithdrawalSum: sumToday,
      dailyWithdrawalCap: cap,
    };
  }),
});
