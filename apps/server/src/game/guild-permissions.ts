// Gildie — macierz uprawnień. Każda mutacja routers/guild.ts woła assertCan()
// żeby wymusić rank-based access. PERMISSIONS encoding:
// action → lista rangów które mogą wykonać. Lider jest zawsze implicit
// (jeśli action jest w liście officer, lider też może), ale explicit
// zapis tutaj dla czytelności.
//
// Promocje specjalne:
// - promote() — oficer może tylko rekrut→członek; pozostałe (członek→oficer)
//   zarezerwowane dla lidera. Osobna logika w routerze, nie w tej macierzy.

import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { guildMembers } from '../db/schema.js';

export type GuildRank = 'leader' | 'officer' | 'member' | 'recruit';

export type GuildAction =
  | 'chat.send'
  | 'treasury.deposit'
  | 'treasury.withdrawGold'
  | 'treasury.withdrawGems'
  | 'invite'
  | 'approveApplication'
  | 'kickRecruit'
  | 'kickMember'
  | 'kickOfficer'
  | 'promoteToMember'
  | 'promoteToOfficer'
  | 'demote'
  | 'updateMotto'
  | 'updateEmblem'
  | 'updateOpenness'
  | 'buildingUpgrade'
  | 'declareWar'
  | 'commitToWar'
  | 'raidHit'
  | 'transferLeader'
  | 'disband';

/**
 * Kolejność wewnętrznie — lider zawsze ma wszystko, więc nie zapisujemy
 * go w każdym wpisie. Sprawdzamy osobno rank === 'leader' przed matching'iem.
 */
const NON_LEADER_PERMISSIONS: Record<GuildAction, readonly GuildRank[]> = {
  'chat.send': ['officer', 'member', 'recruit'],
  'treasury.deposit': ['officer', 'member', 'recruit'],
  'treasury.withdrawGold': ['officer'],
  'treasury.withdrawGems': [], // tylko lider
  invite: ['officer'],
  approveApplication: ['officer'],
  kickRecruit: ['officer'],
  kickMember: ['officer'],
  kickOfficer: [], // tylko lider
  promoteToMember: ['officer'],
  promoteToOfficer: [], // tylko lider
  demote: [], // tylko lider
  updateMotto: ['officer'],
  updateEmblem: ['officer'],
  updateOpenness: ['officer'],
  buildingUpgrade: ['officer'],
  declareWar: ['officer'],
  commitToWar: ['officer', 'member', 'recruit'],
  raidHit: ['officer', 'member', 'recruit'],
  transferLeader: [], // tylko lider
  disband: [], // tylko lider
};

/** Czy rank może wykonać action. */
export function canPerform(rank: GuildRank, action: GuildAction): boolean {
  if (rank === 'leader') return true;
  return NON_LEADER_PERMISSIONS[action].includes(rank);
}

/**
 * Rzuca TRPCError FORBIDDEN gdy postać nie jest członkiem gildii lub nie ma
 * wymaganego ranku dla action. Zwraca { guildId, rank } przy sukcesie —
 * można reuse w dalszej logice routerów.
 */
export async function assertCan(
  db: Db,
  characterId: string,
  action: GuildAction,
): Promise<{ guildId: string; rank: GuildRank }> {
  const [row] = await db
    .select({ guildId: guildMembers.guildId, rank: guildMembers.rank })
    .from(guildMembers)
    .where(eq(guildMembers.characterId, characterId))
    .limit(1);

  if (!row) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Nie jesteś w żadnej gildii.',
    });
  }

  const rank = row.rank as GuildRank;
  if (!canPerform(rank, action)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Twoja ranga (${rank}) nie pozwala na tę akcję.`,
    });
  }

  return { guildId: row.guildId, rank };
}

/**
 * Zwraca ({guildId, rank}) postaci jeśli jest w gildii, inaczej null —
 * bez rzucania. Używane tam gdzie brak gildii to OK scenario (np. me.get).
 */
export async function getMembershipOrNull(
  db: Db,
  characterId: string,
): Promise<{ guildId: string; rank: GuildRank } | null> {
  const [row] = await db
    .select({ guildId: guildMembers.guildId, rank: guildMembers.rank })
    .from(guildMembers)
    .where(eq(guildMembers.characterId, characterId))
    .limit(1);
  return row ? { guildId: row.guildId, rank: row.rank as GuildRank } : null;
}

/**
 * Pobiera konkretne członkostwo w konkretnej gildii. Używane do walidacji
 * targetu akcji (kick/promote/demote) — "czy ta postać rzeczywiście jest
 * w mojej gildii".
 */
export async function getTargetMembership(
  db: Db,
  guildId: string,
  characterId: string,
): Promise<{ rank: GuildRank } | null> {
  const [row] = await db
    .select({ rank: guildMembers.rank })
    .from(guildMembers)
    .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.characterId, characterId)))
    .limit(1);
  return row ? { rank: row.rank as GuildRank } : null;
}
