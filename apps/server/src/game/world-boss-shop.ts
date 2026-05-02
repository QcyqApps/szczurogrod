// World boss shop — static catalog dla `worldBoss.shop.*`. Echa Wybudzonego
// → gem/scrap/gold/extra-hit. Ceny tunowane tak, że typowy gracz dropujący
// ~30-50 ech/dzień może zrobić jeden mały zakup co 1-2 dni.

export type WorldBossShopRewardKind = 'gems' | 'scrap' | 'gold' | 'extra_hit';

export interface WorldBossShopOffer {
  slug: string;
  /** Klucz i18n dla nazwy + opisu (PL/EN). */
  i18nKey: string;
  /** Ikona z game-icons registry. */
  icon: string;
  cost: number;
  reward: { kind: WorldBossShopRewardKind; amount: number };
}

export const WORLD_BOSS_SHOP: readonly WorldBossShopOffer[] = [
  {
    slug: 'gems_small',
    i18nKey: 'worldBoss.shop.gems.small',
    icon: 'gem',
    cost: 50,
    reward: { kind: 'gems', amount: 5 },
  },
  {
    slug: 'gems_medium',
    i18nKey: 'worldBoss.shop.gems.medium',
    icon: 'gem',
    cost: 200,
    reward: { kind: 'gems', amount: 25 },
  },
  {
    slug: 'scrap_small',
    i18nKey: 'worldBoss.shop.scrap.small',
    icon: 'chestplate',
    cost: 30,
    reward: { kind: 'scrap', amount: 50 },
  },
  {
    slug: 'gold_medium',
    i18nKey: 'worldBoss.shop.gold.medium',
    icon: 'gold',
    cost: 25,
    reward: { kind: 'gold', amount: 5_000 },
  },
  {
    slug: 'extra_hit',
    i18nKey: 'worldBoss.shop.extra.hit',
    icon: 'fire',
    cost: 80,
    reward: { kind: 'extra_hit', amount: 1 },
  },
];

export function findOffer(slug: string): WorldBossShopOffer | null {
  return WORLD_BOSS_SHOP.find((o) => o.slug === slug) ?? null;
}
