// Survivor skill tree — single source of truth for client UI rendering and
// server-side cost validation. Effects are interpreted at run-start time:
// `applySkillsToBalance(baseBalance, skillProgression)` -> tunables used by
// the client tick loop. Server validates `unlockSkill` against `costCurve`
// and `maxLevel`.

export type SkillNodeId =
  | 'hp_max'
  | 'dmg'
  | 'fire_rate'
  | 'splash'
  | 'proj_speed'
  | 'slow'
  | 'crit'
  | 'density'
  | 'lifesteal'
  | 'shard_chance'
  | 'shard_max'
  | 'knockback';

export interface SkillNode {
  readonly id: SkillNodeId;
  readonly name: string;
  readonly desc: string;
  readonly maxLevel: number;
  /** Cost in okruchy to BUY level N+1 (0-indexed). Length must equal maxLevel. */
  readonly costCurve: readonly number[];
}

export const SKILL_NODES: readonly SkillNode[] = [
  {
    id: 'hp_max',
    name: 'Wytrzymałość',
    desc: 'Skóra grubsza. +20 max HP za poziom.',
    maxLevel: 5,
    costCurve: [5, 20, 60, 150, 400],
  },
  {
    id: 'dmg',
    name: 'Ostry pazur',
    desc: 'Pociski boleśniejsze. +22% obrażeń za poziom.',
    maxLevel: 5,
    costCurve: [8, 25, 70, 180, 450],
  },
  {
    id: 'fire_rate',
    name: 'Szybka łapa',
    desc: 'Krótszy czas castu. -0.2s za poziom (min 0.6s).',
    maxLevel: 5,
    costCurve: [10, 30, 90, 230, 580],
  },
  {
    id: 'splash',
    name: 'Wybuchowe okruchy',
    desc: 'Większa eksplozja. +22 px promienia za poziom.',
    maxLevel: 4,
    costCurve: [20, 70, 200, 600],
  },
  {
    id: 'proj_speed',
    name: 'Lekki ładunek',
    desc: 'Pocisk leci szybciej. +25% prędkości za poziom.',
    maxLevel: 4,
    costCurve: [10, 35, 110, 320],
  },
  {
    id: 'slow',
    name: 'Lepkie błoto',
    desc: 'Trafiony wróg zwalnia o 25% na 1s.',
    maxLevel: 3,
    costCurve: [15, 60, 220],
  },
  {
    id: 'crit',
    name: 'Celne oko',
    desc: 'Szansa na podwójne obrażenia. +10% za poziom.',
    maxLevel: 3,
    costCurve: [18, 75, 260],
  },
  {
    id: 'density',
    name: 'Wabik',
    desc: 'Więcej szczurów = więcej okruchów. +5 max enemies.',
    maxLevel: 2,
    costCurve: [30, 120],
  },
  {
    id: 'lifesteal',
    name: 'Krwawe okruchy',
    desc: 'Trafienie wroga przywraca 1 HP za poziom (subtelnie).',
    maxLevel: 4,
    costCurve: [12, 40, 130, 360],
  },
  {
    id: 'shard_chance',
    name: 'Rozprysk',
    desc: 'Eksplozja wystrzeli odłamek w innego wroga. +15% szansy za poziom.',
    maxLevel: 5,
    costCurve: [20, 55, 160, 420, 700],
  },
  {
    id: 'shard_max',
    name: 'Roztrzaskanie',
    desc: 'Dodatkowe odłamki: +1, +2, +3. Wymaga „Rozprysku”.',
    maxLevel: 3,
    costCurve: [40, 140, 380],
  },
  {
    id: 'knockback',
    name: 'Odrzut',
    desc: 'Szansa, że trafiony wróg zostanie odepchnięty. +12% za poziom. Bossowie się nie ruszą.',
    maxLevel: 4,
    costCurve: [18, 60, 200, 500],
  },
];

export function getSkillNode(id: string): SkillNode | null {
  return SKILL_NODES.find((n) => n.id === id) ?? null;
}

export interface AppliedSkills {
  readonly hpMaxBonus: number;
  readonly dmgMult: number;
  /** Linearne odejmowanie od baseFireCooldownMs (200ms per level). Floor
   * na poziomie 5 to 1.0s (z bazy 2.0s). Logika tick'u dodatkowo clamp'uje
   * na minFireCooldownMs żeby nie zejść poniżej grywalnego limitu. */
  readonly castTimeReductionMs: number;
  /** Bonus pixels added to PROJECTILE.baseExplosionRadius. */
  readonly splashRadiusBonus: number;
  /** Multiplier on PROJECTILE.baseSpeed. */
  readonly projectileSpeedMult: number;
  readonly slowOnHit: boolean;
  readonly critChance: number;
  readonly maxEnemiesBonus: number;
  /** HP regenerated per damaged enemy. 0 disables. Subtle scaling — even
   * at max level lifesteal nie kompensuje pełnego drainu, ale pozwala
   * przeżyć dłuższy clutch. */
  readonly lifestealHpPerHit: number;
  /** 0..1 prawdopodobieństwo, że eksplozja wystrzeli odłamki w innych
   * wrogów. Roll raz per detonację. */
  readonly shardChance: number;
  /** Maksymalna liczba odłamków przy udanym roll'u (2/3/4). 0 = nie spawnuj
   * shardów (np. gdy gracz wziął shard_chance bez shard_max). */
  readonly shardMax: number;
  /** 0..1 prawdopodobieństwo, że trafienie odepchnie wroga do tyłu. Roll
   * raz per `applyDamage`, więc multi-hit AOE = N rolls. Bossowie ignorują
   * (zbyt potężni żeby się dać odepchnąć i utrzymanie pacingu boss-fightu). */
  readonly knockbackChance: number;
}

export function applySkills(
  progression: ReadonlyMap<SkillNodeId, number>,
): AppliedSkills {
  const lvl = (id: SkillNodeId): number => progression.get(id) ?? 0;
  const shardChanceLvl = lvl('shard_chance');
  const shardMaxLvl = lvl('shard_max');
  return {
    hpMaxBonus: lvl('hp_max') * 20,
    // 22% per lvl daje progresję 1.0 / 1.22 / 1.44 / 1.66 / 1.88 / 2.10.
    // Każdy poziom czuć — punkt 2 1-shotuje rat_walker'y na bazie, max
    // mniej-więcej podwaja DPS przed dodaniem fire_rate / crit.
    dmgMult: 1 + lvl('dmg') * 0.22,
    castTimeReductionMs: lvl('fire_rate') * 200,
    splashRadiusBonus: lvl('splash') * 22,
    projectileSpeedMult: 1 + lvl('proj_speed') * 0.25,
    slowOnHit: lvl('slow') > 0,
    critChance: lvl('crit') * 0.1,
    maxEnemiesBonus: lvl('density') * 5,
    lifestealHpPerHit: lvl('lifesteal'),
    shardChance: shardChanceLvl * 0.15,
    // shard_chance lvl ≥ 1 daje min 1 odłamek (działa STANDALONE — bez
    // shard_max gracz widzi efekt natychmiast po zakupie). shard_max dodaje
    // dodatkowe odłamki: lvl 1 → +1 (razem 2), lvl 2 → +2 (3), lvl 3 → +3 (4).
    // Wymaga shard_chance ≥ 1, inaczej brak roll'u → 0 odłamków bez względu
    // na shard_max.
    shardMax: shardChanceLvl > 0 ? 1 + shardMaxLvl : 0,
    // 12% per level, max 48% (lvl 4). Lvl 1 (12%) — czytelny "co kilka hitów
    // wróg odlatuje", lvl 4 (48%) — niemal co drugi hit, ale bossowie filtr.
    knockbackChance: lvl('knockback') * 0.12,
  };
}
