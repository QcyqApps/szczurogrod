// Survivor mini-game router. Uses the same auth (`protectedProcedure`) as
// the rest of the app. Pisze głównie do własnych tabel (`survivor_runs`,
// `survivor_meta`, `survivor_skill_progression`, `survivor_idle_xp_grants`).
// Cross-game XP integration: po finishRun napełnia idleXpProgress i może
// generować pending XP grants, które gracz claimuje przez `claimIdleXp` —
// to jedyne miejsce gdzie router survivor'a pisze do `characters` (przez
// applyXpGain).

import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import {
  finishRunInputSchema,
  getStage,
  IDLE_XP_BAR_THRESHOLD,
  SKILL_NODES,
  startRunInputSchema,
  survivorXpPackageAmount,
  unlockSkillInputSchema,
  type SkillNodeId,
} from '@grodno/shared/survivor';
import type { Db } from '../db/client.js';
import { z } from 'zod';
import {
  characters,
  survivorIdleXpGrants,
  survivorMeta,
  survivorRuns,
  survivorSkillProgression,
  users,
} from '../db/schema.js';
import { applyXpGain, summarizeLevelUps, xpToNext } from '../game/leveling.js';
import { computeOkruchyPayout, validateRunReport } from '../game/survivor/payout.js';
import { protectedProcedure, publicProcedure, router } from '../trpc/trpc.js';

interface MetaRow {
  okruchy: number;
  maxStageUnlocked: number;
  totalRuns: number;
  totalKills: number;
  idleXpProgress: number;
}

/** Lazily creates the meta row on first access; returns the latest. */
async function loadOrCreateMeta(db: Db, userId: string): Promise<MetaRow> {
  const [existing] = await db
    .select({
      okruchy: survivorMeta.okruchy,
      maxStageUnlocked: survivorMeta.maxStageUnlocked,
      totalRuns: survivorMeta.totalRuns,
      totalKills: survivorMeta.totalKills,
      idleXpProgress: survivorMeta.idleXpProgress,
    })
    .from(survivorMeta)
    .where(eq(survivorMeta.userId, userId))
    .limit(1);
  if (existing) return existing;
  await db
    .insert(survivorMeta)
    .values({ userId })
    .onConflictDoNothing({ target: survivorMeta.userId });
  return { okruchy: 0, maxStageUnlocked: 1, totalRuns: 0, totalKills: 0, idleXpProgress: 0 };
}

export const survivorRouter = router({
  ping: publicProcedure.query(() => {
    return { ok: true, game: 'survivor', phase: 'M2' as const };
  }),

  getHub: protectedProcedure.query(async ({ ctx }) => {
    const meta = await loadOrCreateMeta(ctx.db, ctx.userId);
    const progressionRows = await ctx.db
      .select({
        nodeId: survivorSkillProgression.nodeId,
        level: survivorSkillProgression.level,
      })
      .from(survivorSkillProgression)
      .where(eq(survivorSkillProgression.userId, ctx.userId));

    // Reach into the Szczurogród side: jeśli user ma character'a w idle,
    // (a) avatar dziedziczy klasę, (b) idle XP integration działa.
    const [char] = await ctx.db
      .select({ cls: characters.cls, name: characters.name, lvl: characters.lvl })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);

    // Pending XP grants — paczki czekające na claim po stronie idle game'a.
    // Liczymy łącznie + sumujemy XP, żeby UI mógł pokazać "X paczek = Y XP".
    let pendingGrantsCount = 0;
    let pendingGrantsXpTotal = 0;
    if (char) {
      const pending = await ctx.db
        .select({ xpAmount: survivorIdleXpGrants.xpAmount })
        .from(survivorIdleXpGrants)
        .where(
          and(
            eq(survivorIdleXpGrants.userId, ctx.userId),
            isNull(survivorIdleXpGrants.claimedAt),
          ),
        );
      pendingGrantsCount = pending.length;
      pendingGrantsXpTotal = pending.reduce((sum, g) => sum + g.xpAmount, 0);
    }

    return {
      meta,
      skillProgression: progressionRows,
      character: char ? { cls: char.cls, name: char.name, lvl: char.lvl } : null,
      // Cross-game XP integration: pasek + preview kolejnej paczki + lista
      // pending. Na froncie survivor'a renderowany jako pasek progresji w
      // hub'ie. Apps/web (idle) używa pendingGrantsCount żeby pokazać banner
      // w Town'cie z "ODBIERZ" CTA.
      idleXp: char
        ? {
            available: true as const,
            barFill: meta.idleXpProgress,
            barThreshold: IDLE_XP_BAR_THRESHOLD,
            // Snapshot tego co dostanie gracz za KOLEJNĄ paczkę przy aktualnym
            // levelu. Przy claim'ie używamy snapshot'ów ZAPISANYCH w grant
            // rows (xp_amount), więc preview może się różnić od już
            // wygenerowanych paczek jeśli gracz urósł.
            nextPackageXp: survivorXpPackageAmount(xpToNext(char.lvl)),
            pendingGrantsCount,
            pendingGrantsXpTotal,
            idleLvl: char.lvl,
          }
        : { available: false as const },
    };
  }),

  startRun: protectedProcedure
    .input(startRunInputSchema)
    .mutation(async ({ ctx, input }) => {
      const stage = getStage(input.stageId);
      if (!stage) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unknown stage' });
      }
      const meta = await loadOrCreateMeta(ctx.db, ctx.userId);
      if (input.stageId > meta.maxStageUnlocked) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Stage zablokowany — pokonaj wcześniejszego bossa.',
        });
      }
      // 32-bit unsigned seed. Stored as bigint in DB but lives in JS as number
      // (safe up to 2^53). Client uses this for deterministic wave sequencing.
      const seed = Math.floor(Math.random() * 2 ** 32);
      const [inserted] = await ctx.db
        .insert(survivorRuns)
        .values({
          userId: ctx.userId,
          stageId: input.stageId,
          seed,
          status: 'active',
        })
        .returning({ id: survivorRuns.id, startedAt: survivorRuns.startedAt });
      return {
        runId: inserted.id,
        stageId: input.stageId,
        seed,
        startedAt: inserted.startedAt.getTime(),
      };
    }),

  finishRun: protectedProcedure
    .input(finishRunInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [run] = await ctx.db
        .select({
          id: survivorRuns.id,
          stageId: survivorRuns.stageId,
          startedAt: survivorRuns.startedAt,
          status: survivorRuns.status,
          okruchyEarned: survivorRuns.okruchyEarned,
        })
        .from(survivorRuns)
        .where(and(eq(survivorRuns.id, input.runId), eq(survivorRuns.userId, ctx.userId)))
        .limit(1);

      if (!run) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Run nie istnieje.' });
      }

      const stage = getStage(run.stageId);
      if (!stage) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stage znikł.' });
      }

      // Idempotency — second call returns the original outcome.
      if (run.status !== 'active') {
        const meta = await loadOrCreateMeta(ctx.db, ctx.userId);
        return {
          accepted: run.status !== 'rejected',
          reason: null as string | null,
          okruchyEarned: run.okruchyEarned,
          unlockedStage: null as number | null,
          newOkruchyTotal: meta.okruchy,
          newMaxStageUnlocked: meta.maxStageUnlocked,
        };
      }

      const validation = validateRunReport({
        stage,
        startedAtMs: run.startedAt.getTime(),
        nowMs: Date.now(),
        reportedDurationMs: input.durationMs,
        reportedKills: input.kills,
        reportedBossKilled: input.bossKilled,
      });

      if (!validation.ok) {
        await ctx.db
          .update(survivorRuns)
          .set({
            status: 'rejected',
            endedAt: new Date(),
            durationMs: input.durationMs,
            kills: input.kills,
            bossKilled: input.bossKilled,
            okruchyEarned: 0,
          })
          .where(eq(survivorRuns.id, run.id));
        const meta = await loadOrCreateMeta(ctx.db, ctx.userId);
        return {
          accepted: false,
          reason: validation.reason,
          okruchyEarned: 0,
          unlockedStage: null as number | null,
          newOkruchyTotal: meta.okruchy,
          newMaxStageUnlocked: meta.maxStageUnlocked,
        };
      }

      const metaBefore = await loadOrCreateMeta(ctx.db, ctx.userId);
      const stageAlreadyCleared = run.stageId < metaBefore.maxStageUnlocked;

      const okruchy = computeOkruchyPayout({
        stage,
        kills: input.kills,
        bossKilled: input.bossKilled,
        stageAlreadyCleared,
      });

      const unlockNext =
        input.bossKilled && run.stageId === metaBefore.maxStageUnlocked;
      const newMaxStage = unlockNext
        ? metaBefore.maxStageUnlocked + 1
        : metaBefore.maxStageUnlocked;

      // Cross-game XP integration: pasek napełnia się TYLKO jeśli user ma
      // character'a w idle. Bez character'a okruchy rosną normalnie, ale
      // idleXpProgress zostaje 0 (gracz może zrobić character później —
      // wtedy bar zacznie rosnąć od nowych runów).
      const [char] = await ctx.db
        .select({ lvl: characters.lvl })
        .from(characters)
        .where(eq(characters.userId, ctx.userId))
        .limit(1);

      let newIdleXpProgress = metaBefore.idleXpProgress;
      let grantsGenerated = 0;
      let grantsXpTotal = 0;
      if (char) {
        const totalProgress = metaBefore.idleXpProgress + okruchy;
        grantsGenerated = Math.floor(totalProgress / IDLE_XP_BAR_THRESHOLD);
        newIdleXpProgress = totalProgress % IDLE_XP_BAR_THRESHOLD;
        if (grantsGenerated > 0) {
          // Snapshot xp amount na podstawie BIEŻĄCEGO levelu char'a — wszystkie
          // paczki wygenerowane w tym jednym runie używają tego samego snapshot'u,
          // co jest fair (jednorazowy wykonany wysiłek = jeden tier rewardu).
          const xpPerGrant = survivorXpPackageAmount(xpToNext(char.lvl));
          grantsXpTotal = xpPerGrant * grantsGenerated;
          await ctx.db.insert(survivorIdleXpGrants).values(
            Array.from({ length: grantsGenerated }, () => ({
              userId: ctx.userId,
              xpAmount: xpPerGrant,
            })),
          );
        }
      }

      await ctx.db
        .update(survivorRuns)
        .set({
          status: input.bossKilled ? 'won' : 'lost',
          endedAt: new Date(),
          durationMs: input.durationMs,
          kills: input.kills,
          bossKilled: input.bossKilled,
          okruchyEarned: okruchy,
        })
        .where(eq(survivorRuns.id, run.id));

      await ctx.db
        .update(survivorMeta)
        .set({
          okruchy: sql`${survivorMeta.okruchy} + ${okruchy}`,
          maxStageUnlocked: newMaxStage,
          totalRuns: sql`${survivorMeta.totalRuns} + 1`,
          totalKills: sql`${survivorMeta.totalKills} + ${input.kills}`,
          idleXpProgress: newIdleXpProgress,
          updatedAt: new Date(),
        })
        .where(eq(survivorMeta.userId, ctx.userId));

      return {
        accepted: true,
        reason: null as string | null,
        okruchyEarned: okruchy,
        unlockedStage: unlockNext ? newMaxStage : null,
        newOkruchyTotal: metaBefore.okruchy + okruchy,
        newMaxStageUnlocked: newMaxStage,
        idleXp: {
          barFill: newIdleXpProgress,
          barThreshold: IDLE_XP_BAR_THRESHOLD,
          grantsGenerated,
          grantsXpTotal,
        },
      };
    }),

  unlockSkill: protectedProcedure
    .input(unlockSkillInputSchema)
    .mutation(async ({ ctx, input }) => {
      const node = SKILL_NODES.find((n) => n.id === input.nodeId);
      if (!node) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nieznany skill.' });
      }

      const [progress] = await ctx.db
        .select({ level: survivorSkillProgression.level })
        .from(survivorSkillProgression)
        .where(
          and(
            eq(survivorSkillProgression.userId, ctx.userId),
            eq(survivorSkillProgression.nodeId, input.nodeId),
          ),
        )
        .limit(1);

      const currentLevel = progress?.level ?? 0;
      if (currentLevel >= node.maxLevel) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Maksymalny poziom osiągnięty.',
        });
      }
      const cost = node.costCurve[currentLevel];

      const meta = await loadOrCreateMeta(ctx.db, ctx.userId);
      if (meta.okruchy < cost) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Brakuje ${cost - meta.okruchy} okruchów.`,
        });
      }

      await ctx.db
        .update(survivorMeta)
        .set({
          okruchy: sql`${survivorMeta.okruchy} - ${cost}`,
          updatedAt: new Date(),
        })
        .where(eq(survivorMeta.userId, ctx.userId));

      if (progress) {
        await ctx.db
          .update(survivorSkillProgression)
          .set({ level: currentLevel + 1, updatedAt: new Date() })
          .where(
            and(
              eq(survivorSkillProgression.userId, ctx.userId),
              eq(survivorSkillProgression.nodeId, input.nodeId),
            ),
          );
      } else {
        await ctx.db
          .insert(survivorSkillProgression)
          .values({
            userId: ctx.userId,
            nodeId: input.nodeId as SkillNodeId,
            level: 1,
          });
      }

      return {
        nodeId: input.nodeId,
        newLevel: currentLevel + 1,
        spentOkruchy: cost,
        remainingOkruchy: meta.okruchy - cost,
      };
    }),

  /** Top fastest boss kills per stage. Public — anyone (logged or not) can
   * see the board. Identifies players by user.email or "GOŚĆ #<short-id>"
   * for guest accounts. */
  leaderboard: publicProcedure
    .input(z.object({ stageId: z.number().int().min(1).max(99), limit: z.number().int().min(1).max(50).default(10) }).optional())
    .query(async ({ ctx, input }) => {
      const stageId = input?.stageId ?? 1;
      const limit = input?.limit ?? 10;
      const rows = await ctx.db
        .select({
          runId: survivorRuns.id,
          userId: survivorRuns.userId,
          durationMs: survivorRuns.durationMs,
          kills: survivorRuns.kills,
          endedAt: survivorRuns.endedAt,
          email: users.email,
          isGuest: users.isGuest,
        })
        .from(survivorRuns)
        .leftJoin(users, eq(survivorRuns.userId, users.id))
        .where(
          and(
            eq(survivorRuns.stageId, stageId),
            eq(survivorRuns.bossKilled, true),
            eq(survivorRuns.status, 'won'),
            isNotNull(survivorRuns.durationMs),
          ),
        )
        .orderBy(asc(survivorRuns.durationMs))
        .limit(limit);

      return {
        stageId,
        entries: rows.map((row, idx) => ({
          rank: idx + 1,
          runId: row.runId,
          durationMs: row.durationMs ?? 0,
          kills: row.kills ?? 0,
          endedAt: row.endedAt?.getTime() ?? null,
          displayName: displayNameFor(row.email, row.isGuest, row.userId),
        })),
      };
    }),

  /** Slim status endpoint dla apps/web Town banner'a. Zwraca tylko liczbę
   * pending grants + sumaryczne XP, bez ładowania całego hub'a. Polled przez
   * useQuery razem z innymi status queries (daily, season pass etc.). */
  idleXpStatus: protectedProcedure.query(async ({ ctx }) => {
    const [char] = await ctx.db
      .select({ id: characters.id })
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) {
      return { available: false as const };
    }
    const pending = await ctx.db
      .select({ xpAmount: survivorIdleXpGrants.xpAmount })
      .from(survivorIdleXpGrants)
      .where(
        and(
          eq(survivorIdleXpGrants.userId, ctx.userId),
          isNull(survivorIdleXpGrants.claimedAt),
        ),
      );
    return {
      available: true as const,
      pendingCount: pending.length,
      pendingXpTotal: pending.reduce((s, g) => s + g.xpAmount, 0),
    };
  }),

  /** Cross-game XP claim. Wołane PO STRONIE IDLE GAME'a (apps/web Town) —
   * gracz widzi banner "X paczek z Okruchów do odebrania", klika ODBIERZ,
   * tu lądujemy. Sumujemy wszystkie pending grants, aplikujemy łączne XP
   * przez applyXpGain (cascades level-ups), markujemy grants claimed.
   *
   * Atomic: jedna transakcja na update characters + mark grants. Drugi
   * concurrent claim zobaczy 0 pending = throw (race-safe). */
  claimIdleXp: protectedProcedure.mutation(async ({ ctx }) => {
    const pending = await ctx.db
      .select({
        id: survivorIdleXpGrants.id,
        xpAmount: survivorIdleXpGrants.xpAmount,
      })
      .from(survivorIdleXpGrants)
      .where(
        and(
          eq(survivorIdleXpGrants.userId, ctx.userId),
          isNull(survivorIdleXpGrants.claimedAt),
        ),
      );

    if (pending.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Brak paczek z Okruchów do odebrania.',
      });
    }

    const [char] = await ctx.db
      .select()
      .from(characters)
      .where(eq(characters.userId, ctx.userId))
      .limit(1);
    if (!char) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Stwórz najpierw postać w Szczurogrodzie.',
      });
    }

    const totalXp = pending.reduce((sum, g) => sum + g.xpAmount, 0);
    const leveling = applyXpGain(char, totalXp);
    const levelUp = summarizeLevelUps(leveling.ups);
    const grantIds = pending.map((g) => g.id);

    await ctx.db.transaction(async (tx) => {
      await tx
        .update(characters)
        .set({
          lvl: leveling.progression.lvl,
          xp: leveling.progression.xp,
          xpMax: leveling.progression.xpMax,
          hp: leveling.progression.hp,
          hpMax: leveling.progression.hpMax,
          mp: leveling.progression.mp,
          mpMax: leveling.progression.mpMax,
          stamina: leveling.progression.stamina,
          staminaMax: leveling.progression.staminaMax,
          updatedAt: new Date(),
        })
        .where(eq(characters.id, char.id));

      await tx
        .update(survivorIdleXpGrants)
        .set({ claimedAt: new Date() })
        .where(inArray(survivorIdleXpGrants.id, grantIds));
    });

    return {
      grantsClaimed: pending.length,
      totalXpGained: totalXp,
      levelUp,
      newLvl: leveling.progression.lvl,
      newXp: leveling.progression.xp,
      newXpMax: leveling.progression.xpMax,
    };
  }),

  /** Latest 10 finished runs for the *signed-in* player — used as a "history"
   * panel in the hub. Public would be too noisy; per-user keeps it useful. */
  recentRuns: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        runId: survivorRuns.id,
        stageId: survivorRuns.stageId,
        durationMs: survivorRuns.durationMs,
        kills: survivorRuns.kills,
        bossKilled: survivorRuns.bossKilled,
        okruchyEarned: survivorRuns.okruchyEarned,
        status: survivorRuns.status,
        endedAt: survivorRuns.endedAt,
      })
      .from(survivorRuns)
      .where(and(eq(survivorRuns.userId, ctx.userId), isNotNull(survivorRuns.endedAt)))
      .orderBy(desc(survivorRuns.endedAt))
      .limit(10);
    return rows.map((row) => ({
      ...row,
      endedAt: row.endedAt?.getTime() ?? null,
    }));
  }),
});

function displayNameFor(
  email: string | null,
  isGuest: boolean | null,
  userId: string,
): string {
  if (email && !isGuest) {
    // Strip the domain — privacy. "asliwka@gmail.com" -> "asliwka"
    return email.split('@')[0];
  }
  // Guest fallback: stable suffix from userId so the same guest looks the
  // same across runs but isn't immediately doxable.
  return `GOŚĆ #${userId.slice(0, 4).toUpperCase()}`;
}
