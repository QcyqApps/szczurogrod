import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import {
  workStartInputSchema,
  type WorkActive,
  type WorkClaimResponse,
  type WorkStatusResponse,
} from '@grodno/shared';
import { characters } from '../db/schema.js';
import { applyXpGain, summarizeLevelUps } from '../game/leveling.js';
import {
  WORK_DURATIONS_HOURS,
  WORK_KINDS,
  computePartialReward,
  computeReward,
  durationMs,
  getKind,
  isValidDuration,
  isValidKind,
  type WorkDurationHours,
  type WorkKindSlug,
} from '../game/work.js';
import { protectedProcedure, router } from '../trpc/trpc.js';

async function loadCharacter(
  db: typeof import('../db/client.js').db,
  userId: string,
) {
  const [char] = await db
    .select()
    .from(characters)
    .where(eq(characters.userId, userId))
    .limit(1);
  if (!char) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Character not found' });
  }
  return char;
}

function activeFor(char: Awaited<ReturnType<typeof loadCharacter>>): WorkActive | null {
  if (!char.workStartedAt || !char.workEndsAt || !char.workKind) return null;
  const startedAt = char.workStartedAt.getTime();
  const endsAt = char.workEndsAt.getTime();
  const hoursRaw = Math.round((endsAt - startedAt) / 3_600_000);
  // Defensywnie clampujemy do dozwolonego setu, choćby DB miał śmiecia.
  const hours = isValidDuration(hoursRaw) ? hoursRaw : 1;
  const kind = getKind(char.workKind);
  if (!kind) return null;
  const reward = computeReward(char.lvl, hours, kind.slug);
  const partial = computePartialReward(
    char.lvl,
    hours,
    kind.slug,
    Math.max(0, Date.now() - startedAt),
  );
  return {
    kind: { slug: kind.slug, name: kind.name, flavor: kind.flavor },
    durationHours: hours,
    startedAt,
    endsAt,
    ready: Date.now() >= endsAt,
    reward,
    partial: { gold: partial.gold, xp: partial.xp },
  };
}

export const workRouter = router({
  status: protectedProcedure.query(async ({ ctx }): Promise<WorkStatusResponse> => {
    const char = await loadCharacter(ctx.db, ctx.userId);
    return {
      active: activeFor(char),
      kinds: WORK_KINDS.map((k) => ({ slug: k.slug, name: k.name, flavor: k.flavor })),
      // Preview nagród per (kind × hours) — UI pokazuje pełną siatkę.
      options: WORK_KINDS.flatMap((k) =>
        WORK_DURATIONS_HOURS.map((h) => {
          const r = computeReward(char.lvl, h, k.slug);
          return { kindSlug: k.slug, hours: h, goldReward: r.gold, xpReward: r.xp };
        }),
      ),
    };
  }),

  start: protectedProcedure
    .input(workStartInputSchema)
    .mutation(async ({ ctx, input }) => {
      const char = await loadCharacter(ctx.db, ctx.userId);
      if (char.workStartedAt) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Już pracujesz. Najpierw odbierz zapłatę albo wyjdź wcześniej.',
        });
      }
      if (!isValidDuration(input.durationHours)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nieprawidłowy czas pracy.' });
      }
      if (!isValidKind(input.kindSlug)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nieznane zlecenie.' });
      }
      const now = new Date();
      const endsAt = new Date(now.getTime() + durationMs(input.durationHours as WorkDurationHours));
      await ctx.db
        .update(characters)
        .set({
          workStartedAt: now,
          workEndsAt: endsAt,
          workKind: input.kindSlug,
          updatedAt: now,
        })
        .where(eq(characters.id, char.id));
      return { ok: true };
    }),

  claim: protectedProcedure.mutation(async ({ ctx }): Promise<WorkClaimResponse> => {
    const char = await loadCharacter(ctx.db, ctx.userId);
    if (!char.workStartedAt || !char.workEndsAt || !char.workKind) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Nie masz aktywnej pracy.' });
    }
    if (Date.now() < char.workEndsAt.getTime()) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Praca jeszcze trwa. Wróć później albo wyjdź wcześniej.',
      });
    }
    const hoursRaw = Math.round(
      (char.workEndsAt.getTime() - char.workStartedAt.getTime()) / 3_600_000,
    );
    const hours = isValidDuration(hoursRaw) ? hoursRaw : 1;
    const kindSlug = (isValidKind(char.workKind) ? char.workKind : 'rolnik') as WorkKindSlug;
    const { gold, xp } = computeReward(char.lvl, hours, kindSlug);
    const leveling = applyXpGain(char, xp);
    await ctx.db
      .update(characters)
      .set({
        gold: char.gold + gold,
        lvl: leveling.progression.lvl,
        xp: leveling.progression.xp,
        xpMax: leveling.progression.xpMax,
        hp: leveling.progression.hp,
        hpMax: leveling.progression.hpMax,
        mp: leveling.progression.mp,
        mpMax: leveling.progression.mpMax,
        stamina: leveling.progression.stamina,
        staminaMax: leveling.progression.staminaMax,
        workStartedAt: null,
        workEndsAt: null,
        workKind: null,
        updatedAt: new Date(),
      })
      .where(eq(characters.id, char.id));
    return {
      gold,
      xp,
      partial: false,
      levelUp: summarizeLevelUps(leveling.ups),
    };
  }),

  /**
   * Wcześniejsze wyjście. Płaci proporcjonalnie do czasu (floor),
   * czyści stan pracy, NIE blokuje natychmiastowego startu kolejnej.
   * Jeśli praca już dobiegła końca — zachowuje się jak claim.
   */
  cancel: protectedProcedure.mutation(async ({ ctx }): Promise<WorkClaimResponse> => {
    const char = await loadCharacter(ctx.db, ctx.userId);
    if (!char.workStartedAt || !char.workEndsAt || !char.workKind) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Nie masz aktywnej pracy.' });
    }
    const hoursRaw = Math.round(
      (char.workEndsAt.getTime() - char.workStartedAt.getTime()) / 3_600_000,
    );
    const hours = isValidDuration(hoursRaw) ? hoursRaw : 1;
    const kindSlug = (isValidKind(char.workKind) ? char.workKind : 'rolnik') as WorkKindSlug;
    const elapsedMs = Math.max(0, Date.now() - char.workStartedAt.getTime());
    const { gold, xp, fraction } = computePartialReward(char.lvl, hours, kindSlug, elapsedMs);
    const leveling = applyXpGain(char, xp);
    await ctx.db
      .update(characters)
      .set({
        gold: char.gold + gold,
        lvl: leveling.progression.lvl,
        xp: leveling.progression.xp,
        xpMax: leveling.progression.xpMax,
        hp: leveling.progression.hp,
        hpMax: leveling.progression.hpMax,
        mp: leveling.progression.mp,
        mpMax: leveling.progression.mpMax,
        stamina: leveling.progression.stamina,
        staminaMax: leveling.progression.staminaMax,
        workStartedAt: null,
        workEndsAt: null,
        workKind: null,
        updatedAt: new Date(),
      })
      .where(eq(characters.id, char.id));
    return {
      gold,
      xp,
      partial: fraction < 1,
      levelUp: summarizeLevelUps(leveling.ups),
    };
  }),
});
