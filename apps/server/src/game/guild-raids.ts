// Gildie — rajdy continuous S&F (Phase 4).
//
// 5 bossów w puli, rotacja przez (tier-1) % 5. HP rośnie liniowo z tier'em.
// Damage fighter'a skalowany przez atk+mag + random variance. Hit cap =
// pozostałe HP bossa (ostatni hit nie przekracza).
//
// Reward po killu: gold + gems, split'nięty proportional do contribution
// (guild_raid_hits.dmg / boss.hp_max). Minimum 1g per contributor.

import type { IconName } from '@grodno/shared';
import type { CombatFighter } from './arena.js';

export interface RaidBossTemplate {
  slug: string;
  name: string;
  icon: IconName;
  flavor: string;
  /** Base HP na tier 1. Rośnie przez nextBossHp(). */
  baseHp: number;
  /** 0..4 — miejsce w rotacji. (tier-1) % 5 mapuje. */
  rotationIndex: number;
}

export const RAID_BOSS_TEMPLATES: readonly RaidBossTemplate[] = [
  {
    slug: 'szczur-wielki',
    name: 'Szczur Wielki',
    icon: 'mouse',
    flavor: 'Wyrósł. Ma ambicje. Gryzie długo.',
    baseHp: 8000,
    rotationIndex: 0,
  },
  {
    slug: 'kucharz-z-kanalow',
    name: 'Kucharz z Kanałów',
    icon: 'knife-fisherman',
    flavor: 'Gotuje. Pierogi. Z kogoś.',
    baseHp: 15000,
    rotationIndex: 1,
  },
  {
    slug: 'wojewoda-goblinow',
    name: 'Wojewoda Goblinów',
    icon: 'crown-goblin',
    flavor: 'Ma plan. Zawsze ma plan.',
    baseHp: 28000,
    rotationIndex: 2,
  },
  {
    slug: 'topielec-starszy',
    name: 'Topielec Starszy',
    icon: 'skull-mage',
    flavor: 'Zielony. Mokry. Głodny.',
    baseHp: 48000,
    rotationIndex: 3,
  },
  {
    slug: 'lich-podgrodzia',
    name: 'Lich Podgrodzia',
    icon: 'skull-lich',
    flavor: 'Kości oportunizm. Woli lato od zimy.',
    baseHp: 90000,
    rotationIndex: 4,
  },
];

export const RAID_HITS_PER_DAY = 3;

/** Skalowanie HP z tier'em. Tier 1 = baseHp, tier 6 = 2.5×, tier 11 = 4×. */
export function computeBossHp(baseHp: number, tier: number): number {
  return Math.floor(baseHp * (1 + (tier - 1) * 0.3));
}

/** Reward gold/gems po killu. Rośnie z tier'em. */
export function computeBossReward(tier: number): { gold: number; gems: number } {
  return {
    gold: 500 * tier + 200,
    gems: Math.floor(tier / 2),
  };
}

/** Lookup templatu po tier'ze (rotacja 5-element). */
export function templateForTier(tier: number): RaidBossTemplate {
  const idx = (tier - 1) % RAID_BOSS_TEMPLATES.length;
  return RAID_BOSS_TEMPLATES[idx]!;
}

/**
 * Damage formula: (atk + mag) / 2 * (1 + tier*0.05) * variance(0.8..1.2) - bossDef.
 * bossDef = tier * 5 (light scaling). Minimum 10 damage.
 * Cap: hpCurrent żeby ostatni hit nie przekraczał.
 */
export function rollRaidDamage(
  fighter: CombatFighter,
  tier: number,
  hpCurrent: number,
): number {
  const baseDamage = (fighter.atk + fighter.mag) / 2;
  const tierScale = 1 + tier * 0.05;
  const variance = 0.8 + Math.random() * 0.4;
  const bossDef = tier * 5;
  const raw = Math.max(10, Math.floor((baseDamage * tierScale - bossDef) * variance));
  return Math.min(raw, hpCurrent);
}
