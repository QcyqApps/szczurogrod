// Gildie — runtime helpery (Phase 2).
//
// loadGuildWarBuffs(db, charId) — zwraca %-bonusy z altar'a gildii, aplikowane
// w arena.fight + przyszłych wojnach/rajdach. Zero gdy brak gildii lub brak altar'a.
//
// Fast path: czytamy characters.guild_id (denormalizowany), potem jeden JOIN
// z guild_buildings.slug='altar'. One round-trip.

import { and, eq } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { characters, guildBuildings } from '../db/schema.js';
import type { CombatFighter } from './arena.js';
import { altarBuffs } from './guild-buildings.js';

export interface GuildWarBuffs {
  atkPct: number;
  magPct: number;
  defPct: number;
}

export const ZERO_BUFFS: GuildWarBuffs = { atkPct: 0, magPct: 0, defPct: 0 };

/**
 * Ładuje %-buffy do arena/wojen/rajdów. Zwraca zera gdy postać nie jest
 * w gildii lub gildia nie ma altar'a L1+.
 */
export async function loadGuildWarBuffs(
  db: Db,
  characterId: string,
): Promise<GuildWarBuffs> {
  const [row] = await db
    .select({ guildId: characters.guildId })
    .from(characters)
    .where(eq(characters.id, characterId))
    .limit(1);

  if (!row?.guildId) return ZERO_BUFFS;

  const [building] = await db
    .select({ level: guildBuildings.level })
    .from(guildBuildings)
    .where(and(eq(guildBuildings.guildId, row.guildId), eq(guildBuildings.slug, 'altar')))
    .limit(1);

  if (!building || building.level <= 0) return ZERO_BUFFS;

  return altarBuffs(building.level);
}

/**
 * Nakłada %-buffy na stat'y CombatFighter'a. floor'uje wartości. Bezpieczne
 * dla ZERO_BUFFS (zwraca identyczny fighter przez Math.floor(x * 1) = x).
 */
export function applyGuildWarBuffs(
  fighter: CombatFighter,
  buffs: GuildWarBuffs,
): CombatFighter {
  return {
    ...fighter,
    atk: Math.floor(fighter.atk * (1 + buffs.atkPct)),
    mag: Math.floor(fighter.mag * (1 + buffs.magPct)),
    def: Math.floor(fighter.def * (1 + buffs.defPct)),
  };
}
