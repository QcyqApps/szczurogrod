// Gildie — katalog budynków (Phase 2).
//
// 3 budynki:
// - fortress — zwiększa member_cap gildii (L1 +5, L2 +10, L3 +15, L4 +20 → 30 max).
// - altar    — buff do arena/wojen/rajdów: atkPct/magPct/defPct. Cap L5 = +10%.
// - vault    — zwiększa daily withdraw cap (baza 20% → +10/20/30/40%).
//
// Buffy altar'a aplikowane TYLKO w arena.fight + przyszłych guild-wars/raids.
// NIE w PvE (combat.engage, quests.collect) — per decyzja user'a. Zachowuje
// balance aktów 1-5.
//
// costCurve[i] = koszt PODNIESIENIA z level i na i+1 (0-indexed):
//   costCurve[0] = koszt z L0 na L1, costCurve[1] = L1→L2, etc.
// Długość = maxLevel. buffSpec type-punned wg slug'a (patrz BuffSpec).

import type { IconName } from '@grodno/shared';

export interface BuildingCost {
  gold: number;
  gems: number;
  /** Wymagany guild.level żeby upgrade był dostępny. Default 1. */
  guildLvl?: number;
}

export interface FortressBuffSpec {
  kind: 'fortress';
  /** Bonus do memberCap per level (cumulative). [L1, L2, L3, L4]. */
  memberCapByLevel: readonly number[];
}

export interface AltarBuffSpec {
  kind: 'altar';
  /** %-bonus do atk per level (cumulative). [L1, L2, ...]. */
  atkPctByLevel: readonly number[];
  magPctByLevel: readonly number[];
  defPctByLevel: readonly number[];
}

export interface VaultBuffSpec {
  kind: 'vault';
  /** Dodatkowy % treasury dozwolony do withdrawu per day. Baza 20%. [L1, L2, ...]. */
  extraWithdrawPctByLevel: readonly number[];
}

export type BuffSpec = FortressBuffSpec | AltarBuffSpec | VaultBuffSpec;

export interface GuildBuildingTemplate {
  slug: string;
  name: string;
  icon: IconName;
  desc: string;
  maxLevel: number;
  costCurve: readonly BuildingCost[];
  buffSpec: BuffSpec;
}

export const GUILD_BUILDING_TEMPLATES: readonly GuildBuildingTemplate[] = [
  {
    slug: 'fortress',
    name: 'Forteca',
    icon: 'castle',
    desc: 'Grubsze mury — więcej szczurów się zmieści.',
    maxLevel: 4,
    costCurve: [
      { gold: 5000, gems: 0 },
      { gold: 15000, gems: 0 },
      { gold: 40000, gems: 10, guildLvl: 2 },
      { gold: 100000, gems: 30, guildLvl: 3 },
    ],
    buffSpec: {
      kind: 'fortress',
      memberCapByLevel: [5, 10, 15, 20], // L0=10, L1=15, L2=20, L3=25, L4=30
    },
  },
  {
    slug: 'altar',
    name: 'Ołtarz',
    icon: 'emblem-skull',
    desc: 'Szepty wstępują w oręż. Tylko w arenie i rajdach.',
    maxLevel: 5,
    costCurve: [
      { gold: 3000, gems: 5 },
      { gold: 8000, gems: 10 },
      { gold: 20000, gems: 20 },
      { gold: 50000, gems: 40, guildLvl: 2 },
      { gold: 120000, gems: 80, guildLvl: 3 },
    ],
    buffSpec: {
      kind: 'altar',
      atkPctByLevel: [0.02, 0.04, 0.06, 0.08, 0.1],
      magPctByLevel: [0.02, 0.04, 0.06, 0.08, 0.1],
      defPctByLevel: [0.02, 0.04, 0.06, 0.08, 0.1],
    },
  },
  {
    slug: 'vault',
    name: 'Skarbiec',
    icon: 'gold',
    desc: 'Więcej złota do wypłaty. Oficerowie mniej kombinują.',
    maxLevel: 4,
    costCurve: [
      { gold: 4000, gems: 0 },
      { gold: 12000, gems: 0 },
      { gold: 30000, gems: 10, guildLvl: 2 },
      { gold: 80000, gems: 25, guildLvl: 3 },
    ],
    buffSpec: {
      kind: 'vault',
      extraWithdrawPctByLevel: [0.1, 0.2, 0.3, 0.4], // baza 20%, L4 → 60%
    },
  },
];

/**
 * Bonus do memberCap z aktualnego levela fortress'a. Zwraca 0 gdy brak.
 */
export function fortressMemberCapBonus(level: number): number {
  if (level <= 0) return 0;
  const tpl = GUILD_BUILDING_TEMPLATES.find((b) => b.slug === 'fortress');
  if (!tpl || tpl.buffSpec.kind !== 'fortress') return 0;
  const idx = Math.min(level, tpl.buffSpec.memberCapByLevel.length) - 1;
  return tpl.buffSpec.memberCapByLevel[idx] ?? 0;
}

/**
 * Bonus do withdraw cap (ponad bazowe 20%) z vault'a. Zwraca 0 gdy brak.
 */
export function vaultExtraWithdrawPct(level: number): number {
  if (level <= 0) return 0;
  const tpl = GUILD_BUILDING_TEMPLATES.find((b) => b.slug === 'vault');
  if (!tpl || tpl.buffSpec.kind !== 'vault') return 0;
  const idx = Math.min(level, tpl.buffSpec.extraWithdrawPctByLevel.length) - 1;
  return tpl.buffSpec.extraWithdrawPctByLevel[idx] ?? 0;
}

/**
 * Pakiet %-buff'ów z altar'a dla arena/wojen/rajdów. Zwraca zera gdy brak.
 */
export function altarBuffs(level: number): {
  atkPct: number;
  magPct: number;
  defPct: number;
} {
  if (level <= 0) return { atkPct: 0, magPct: 0, defPct: 0 };
  const tpl = GUILD_BUILDING_TEMPLATES.find((b) => b.slug === 'altar');
  if (!tpl || tpl.buffSpec.kind !== 'altar') {
    return { atkPct: 0, magPct: 0, defPct: 0 };
  }
  const idx = Math.min(level, tpl.buffSpec.atkPctByLevel.length) - 1;
  return {
    atkPct: tpl.buffSpec.atkPctByLevel[idx] ?? 0,
    magPct: tpl.buffSpec.magPctByLevel[idx] ?? 0,
    defPct: tpl.buffSpec.defPctByLevel[idx] ?? 0,
  };
}

/**
 * Koszt upgrade'u z poziomu `currentLevel` na następny. `null` gdy max'd.
 */
export function nextUpgradeCost(
  slug: string,
  currentLevel: number,
): BuildingCost | null {
  const tpl = GUILD_BUILDING_TEMPLATES.find((b) => b.slug === slug);
  if (!tpl) return null;
  if (currentLevel >= tpl.maxLevel) return null;
  return tpl.costCurve[currentLevel] ?? null;
}
