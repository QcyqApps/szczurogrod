// Guild maintenance — Phase 5 auto-cleanup.
//
// Scheduler tick co 1h. Skan'uje gildie:
// - Leader nieaktywny >14d + są officerowie → transfer na najstarszego
//   (joined_at asc) active'go officera (lastSeenAt <14d).
// - Brak jakiegokolwiek members (0) ALBO leader >30d + brak officerów → disband.
//
// NIE ruszamy gildii które mają active'ą wojnę albo active'ny raid w trakcie —
// bezpieczeństwo data integrity. Wait until combat ends.

import { and, asc, eq, isNull, or, sql } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import {
  characters,
  guildChatMessages,
  guildMembers,
  guildWars,
  guilds,
} from '../db/schema.js';

const MAINTENANCE_TICK_MS = 60 * 60 * 1000; // 1h
const LEADER_INACTIVE_DAYS = 14;
const GUILD_DISBAND_DAYS = 30;

let maintenanceHandle: NodeJS.Timeout | null = null;

export function startGuildMaintenance(db: Db): void {
  if (maintenanceHandle !== null) return;
  maintenanceHandle = setInterval(() => {
    void tick(db).catch((err) => {
      console.error('[guild-maintenance] tick error', err);
    });
  }, MAINTENANCE_TICK_MS);
  // Pierwszy tick po 30s — nie blokujemy boot'u.
  setTimeout(() => {
    void tick(db).catch((err) => {
      console.error('[guild-maintenance] initial tick error', err);
    });
  }, 30_000);
  console.log('[guild-maintenance] started, tick interval = 1h');
}

export function stopGuildMaintenance(): void {
  if (maintenanceHandle !== null) {
    clearInterval(maintenanceHandle);
    maintenanceHandle = null;
  }
}

async function tick(db: Db): Promise<void> {
  const now = new Date();
  const leaderCutoff = new Date(now.getTime() - LEADER_INACTIVE_DAYS * 24 * 60 * 60 * 1000);
  const disbandCutoff = new Date(now.getTime() - GUILD_DISBAND_DAYS * 24 * 60 * 60 * 1000);

  // Scan active gildie.
  const active = await db
    .select({
      id: guilds.id,
      name: guilds.name,
      leaderCharId: guilds.leaderCharId,
      leaderLastSeen: characters.lastSeenAt,
    })
    .from(guilds)
    .innerJoin(characters, eq(characters.id, guilds.leaderCharId))
    .where(isNull(guilds.disbandedAt));

  for (const g of active) {
    try {
      // Skip gildie w aktywnej wojnie/resolving — nie tknij.
      const [war] = await db
        .select({ id: guildWars.id })
        .from(guildWars)
        .where(
          and(
            or(
              eq(guildWars.attackerGuildId, g.id),
              eq(guildWars.defenderGuildId, g.id),
            ),
            or(eq(guildWars.status, 'scheduled'), eq(guildWars.status, 'resolving')),
          ),
        )
        .limit(1);
      if (war) continue;

      if (g.leaderLastSeen >= leaderCutoff) continue; // leader aktywny

      // Leader inactive. Szukaj active'go officera.
      const [officer] = await db
        .select({
          characterId: guildMembers.characterId,
          name: characters.name,
          cls: characters.cls,
          joinedAt: guildMembers.joinedAt,
        })
        .from(guildMembers)
        .innerJoin(characters, eq(characters.id, guildMembers.characterId))
        .where(
          and(
            eq(guildMembers.guildId, g.id),
            eq(guildMembers.rank, 'officer'),
            sql`${characters.lastSeenAt} >= ${leaderCutoff}`,
          ),
        )
        .orderBy(asc(guildMembers.joinedAt))
        .limit(1);

      if (officer) {
        // Transfer leadership.
        await db.transaction(async (tx) => {
          await tx
            .update(guildMembers)
            .set({ rank: 'member' })
            .where(
              and(
                eq(guildMembers.guildId, g.id),
                eq(guildMembers.characterId, g.leaderCharId),
              ),
            );
          await tx
            .update(guildMembers)
            .set({ rank: 'leader' })
            .where(
              and(
                eq(guildMembers.guildId, g.id),
                eq(guildMembers.characterId, officer.characterId),
              ),
            );
          await tx
            .update(guilds)
            .set({ leaderCharId: officer.characterId, updatedAt: now })
            .where(eq(guilds.id, g.id));
          await tx
            .update(characters)
            .set({ guildRank: 'leader' })
            .where(eq(characters.id, officer.characterId));
          await tx
            .update(characters)
            .set({ guildRank: 'member' })
            .where(eq(characters.id, g.leaderCharId));
          await tx.insert(guildChatMessages).values({
            guildId: g.id,
            authorCharId: null,
            authorName: 'Kronikarz',
            authorCls: 'warrior',
            body: `Lider nieaktywny >14 dni. Przywództwo przejmuje ${officer.name}.`,
            kind: 'system',
          });
        });
        console.log(
          `[guild-maintenance] auto-transferred "${g.name}" → ${officer.name}`,
        );
        continue;
      }

      // Brak officera. Sprawdź czy leader >30d i dodatkowo members'ów ≤1 (sam leader).
      if (g.leaderLastSeen < disbandCutoff) {
        const [memberCountRow] = await db
          .select({ n: sql<number>`count(*)::int` })
          .from(guildMembers)
          .where(eq(guildMembers.guildId, g.id));
        const count = memberCountRow?.n ?? 0;

        // Disband jeśli pusta (tylko leader) albo wszyscy >14d nieaktywni
        // (sprawdzamy członków aktywnych).
        const [activeMemberRow] = await db
          .select({ n: sql<number>`count(*)::int` })
          .from(guildMembers)
          .innerJoin(characters, eq(characters.id, guildMembers.characterId))
          .where(
            and(
              eq(guildMembers.guildId, g.id),
              sql`${characters.lastSeenAt} >= ${leaderCutoff}`,
            ),
          );
        const activeCount = activeMemberRow?.n ?? 0;

        if (count <= 1 || activeCount === 0) {
          await db.transaction(async (tx) => {
            await tx
              .update(guilds)
              .set({ disbandedAt: now, updatedAt: now })
              .where(eq(guilds.id, g.id));
            await tx
              .update(characters)
              .set({ guildId: null, guildRank: null })
              .where(
                sql`${characters.id} IN (SELECT character_id FROM guild_members WHERE guild_id = ${g.id})`,
              );
            await tx.delete(guildMembers).where(eq(guildMembers.guildId, g.id));
          });
          console.log(`[guild-maintenance] auto-disbanded "${g.name}" (inactive 30d)`);
        }
      }
    } catch (err) {
      console.error(`[guild-maintenance] guild ${g.id}`, err);
    }
  }
}

// Eksport helpera do testów + manual triggers.
export { tick as runGuildMaintenanceTick };
