// Guild wars scheduler — cron-like setInterval(60s). Scan'uje guild_wars w
// stanie 'scheduled' których scheduledAt <= now. Dla każdej:
// 1. Status 'resolving' (żeby race z następnym tick'iem nie drugiego razu nie ruszył).
// 2. Load participants z obu stron, sort po orderIndex.
// 3. resolveGauntlet() (pure, w game/guild-wars.ts).
// 4. Persist: winner_guild_id, scores, log jsonb, glory/treasury transfer,
//    participants.won_duel, chronicle, achievements.
// 5. Status 'resolved'.
//
// Single-instance deployment — jeśli skalujemy, trzeba distributed lock.

import { and, eq, lte, sql } from 'drizzle-orm';
import type { AchievementUnlockPayload } from '@grodno/shared';
import type { Db } from '../db/client.js';
import {
  characters,
  guildChatMessages,
  guildMembers,
  guildTreasuryLogs,
  guildWarParticipants,
  guildWars,
  guilds,
} from '../db/schema.js';
import { collectBump, collectSetMax } from './achievements.js';
import type { CombatFighter } from './arena.js';
import { logGuildWarWon } from './chronicle.js';
import {
  WAR_GLORY_LOSS,
  WAR_GLORY_WIN,
  WAR_GOLD_PRIZE,
  type WarParticipant,
  resolveGauntlet,
} from './guild-wars.js';

const TICK_INTERVAL_MS = 60_000;
let schedulerHandle: NodeJS.Timeout | null = null;

export function startGuildWarsScheduler(db: Db): void {
  if (schedulerHandle !== null) return;
  schedulerHandle = setInterval(() => {
    void tick(db).catch((err) => {
      console.error('[guild-wars-scheduler] tick error', err);
    });
  }, TICK_INTERVAL_MS);
  // Pierwszy tick natychmiast (po boot'ie serwera — rozgrywamy overdue wojny).
  void tick(db).catch((err) => {
    console.error('[guild-wars-scheduler] initial tick error', err);
  });
  console.log('[guild-wars-scheduler] started, tick interval = 60s');
}

export function stopGuildWarsScheduler(): void {
  if (schedulerHandle !== null) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
  }
}

async function tick(db: Db): Promise<void> {
  const now = new Date();
  const due = await db
    .select()
    .from(guildWars)
    .where(and(eq(guildWars.status, 'scheduled'), lte(guildWars.scheduledAt, now)));

  for (const war of due) {
    try {
      await resolveOne(db, war.id);
    } catch (err) {
      console.error(`[guild-wars-scheduler] failed to resolve war ${war.id}:`, err);
    }
  }
}

async function resolveOne(db: Db, warId: string): Promise<void> {
  // Claim — atomic status flip scheduled → resolving.
  const claimed = await db
    .update(guildWars)
    .set({ status: 'resolving' })
    .where(and(eq(guildWars.id, warId), eq(guildWars.status, 'scheduled')))
    .returning();
  if (claimed.length === 0) return; // race — ktoś inny przejął

  const [war] = claimed;
  if (!war) return;

  // Load participants
  const partRows = await db
    .select({
      characterId: guildWarParticipants.characterId,
      side: guildWarParticipants.side,
      orderIndex: guildWarParticipants.orderIndex,
      snapshot: guildWarParticipants.snapshot,
    })
    .from(guildWarParticipants)
    .where(eq(guildWarParticipants.warId, warId));

  const attackers: WarParticipant[] = [];
  const defenders: WarParticipant[] = [];
  for (const p of partRows) {
    const wp: WarParticipant = {
      characterId: p.characterId,
      orderIndex: p.orderIndex,
      fighter: p.snapshot as CombatFighter,
    };
    if (p.side === 'attacker') attackers.push(wp);
    else if (p.side === 'defender') defenders.push(wp);
  }

  const result = resolveGauntlet(attackers, defenders);
  const winnerGuildId =
    result.winner === 'attacker' ? war.attackerGuildId : war.defenderGuildId;
  const loserGuildId =
    result.winner === 'attacker' ? war.defenderGuildId : war.attackerGuildId;

  // Reward: wygrywająca gildia +goldPrize (ze skarbca przegranego, cap na jego balance).
  const [loser] = await db.select().from(guilds).where(eq(guilds.id, loserGuildId)).limit(1);
  const [winner] = await db.select().from(guilds).where(eq(guilds.id, winnerGuildId)).limit(1);
  if (!loser || !winner) {
    // Gildia zniknęła — mark cancelled.
    await db
      .update(guildWars)
      .set({ status: 'cancelled', resolvedAt: new Date() })
      .where(eq(guildWars.id, warId));
    return;
  }

  const goldPrize = Math.min(WAR_GOLD_PRIZE, loser.treasuryGold);
  const winnerGloryDelta = WAR_GLORY_WIN;
  const loserGloryDelta = -Math.min(WAR_GLORY_LOSS, loser.glory);

  await db.transaction(async (tx) => {
    // 1. Finalize war row.
    await tx
      .update(guildWars)
      .set({
        status: 'resolved',
        resolvedAt: new Date(),
        winnerGuildId,
        attackerScore: result.attackerScore,
        defenderScore: result.defenderScore,
        goldPrize,
        gloryDelta: winnerGloryDelta,
        log: result.rounds,
      })
      .where(eq(guildWars.id, warId));

    // 2. Per-participant wonDuel
    for (const [charId, wonDuel] of result.participantResults) {
      await tx
        .update(guildWarParticipants)
        .set({ wonDuel })
        .where(
          and(
            eq(guildWarParticipants.warId, warId),
            eq(guildWarParticipants.characterId, charId),
          ),
        );
    }

    // 3. Treasury transfer + glory delta
    if (goldPrize > 0) {
      await tx
        .update(guilds)
        .set({
          treasuryGold: sql`${guilds.treasuryGold} - ${goldPrize}`,
          updatedAt: new Date(),
        })
        .where(eq(guilds.id, loserGuildId));
      await tx
        .update(guilds)
        .set({
          treasuryGold: sql`${guilds.treasuryGold} + ${goldPrize}`,
          updatedAt: new Date(),
        })
        .where(eq(guilds.id, winnerGuildId));

      // Treasury logs dla obu stron
      await tx.insert(guildTreasuryLogs).values([
        {
          guildId: loserGuildId,
          actorCharId: null,
          actorName: 'Wojna',
          kind: 'war_reward',
          goldDelta: -goldPrize,
          gemsDelta: 0,
          memo: 'Przegrana wojna',
        },
        {
          guildId: winnerGuildId,
          actorCharId: null,
          actorName: 'Wojna',
          kind: 'war_reward',
          goldDelta: goldPrize,
          gemsDelta: 0,
          memo: 'Wygrana wojna',
        },
      ]);
    }

    await tx
      .update(guilds)
      .set({ glory: sql`${guilds.glory} + ${winnerGloryDelta}`, updatedAt: new Date() })
      .where(eq(guilds.id, winnerGuildId));
    if (loserGloryDelta !== 0) {
      await tx
        .update(guilds)
        .set({ glory: sql`${guilds.glory} + ${loserGloryDelta}`, updatedAt: new Date() })
        .where(eq(guilds.id, loserGuildId));
    }

    // 4. System msgs w obu chat'ach
    const scoreStr = `${result.attackerScore}:${result.defenderScore}`;
    const winnerName = winner.name;
    const loserName = loser.name;
    const msgBody = `Wojna rozstrzygnięta: „${winnerName}" wygrała z „${loserName}" ${scoreStr}.`;
    await tx.insert(guildChatMessages).values([
      {
        guildId: war.attackerGuildId,
        authorCharId: null,
        authorName: 'Kronikarz',
        authorCls: 'warrior',
        body: msgBody,
        kind: 'system',
      },
      {
        guildId: war.defenderGuildId,
        authorCharId: null,
        authorName: 'Kronikarz',
        authorCls: 'warrior',
        body: msgBody,
        kind: 'system',
      },
    ]);
  });

  // 5. Chronicle + achievements dla zwycięskich członków (poza transakcją,
  // bo collectBump sam rządzi transakcjami). Każdy member zwycięskiej gildii
  // dostaje bump first_win + wins_10.
  const winnerMembers = await db
    .select({
      characterId: guildMembers.characterId,
      name: characters.name,
    })
    .from(guildMembers)
    .innerJoin(characters, eq(characters.id, guildMembers.characterId))
    .where(eq(guildMembers.guildId, winnerGuildId));

  const opponentName =
    result.winner === 'attacker' ? loser.name : loser.name;
  const winnerGuildName =
    result.winner === 'attacker' ? winner.name : winner.name;

  for (const wm of winnerMembers) {
    try {
      await logGuildWarWon(
        db,
        wm.characterId,
        wm.name,
        warId,
        winnerGuildName,
        opponentName,
        result.attackerScore,
        result.defenderScore,
      );
      const unlocks: AchievementUnlockPayload[] = [];
      await collectBump(unlocks, db, wm.characterId, 'guild_war_first_win');
      await collectSetMax(
        unlocks,
        db,
        wm.characterId,
        'guild_war_wins_10',
        1 + (await countPriorWins(db, winnerGuildId, warId)),
      );
    } catch (err) {
      console.error(`[guild-wars-scheduler] chronicle/ach for ${wm.characterId}`, err);
    }
  }

  console.log(
    `[guild-wars-scheduler] resolved war ${warId}: ${result.winner} wins ${result.attackerScore}:${result.defenderScore}`,
  );
}

async function countPriorWins(
  db: Db,
  guildId: string,
  currentWarId: string,
): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(guildWars)
    .where(
      and(
        eq(guildWars.winnerGuildId, guildId),
        eq(guildWars.status, 'resolved'),
        // nie liczymy aktualnej (wiesz na fresh insert)
      ),
    );
  void currentWarId; // wojna już zliczona w wins — brak exclude'a, bo
  // aktualna ma status='resolved' + winnerGuildId. Użytkownik bitego zdobywa
  // wins_10 w dobrym momencie.
  return row?.n ?? 0;
}
