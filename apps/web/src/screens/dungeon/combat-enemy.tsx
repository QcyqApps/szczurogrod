// Adapter DungeonEnemy → CombatEnemyInfo. W osobnym pliku, żeby
// CombatView.tsx pozostał „tylko komponenty" i nie łamał react-refresh.

import { Monster } from '@/components/monsters';
import type { CombatEnemyInfo } from './CombatView';
import type { DungeonEnemy } from './ScreenDungeon';

export function dungeonEnemyToCombatInfo(enemy: DungeonEnemy): CombatEnemyInfo {
  return {
    slug: enemy.slug,
    name: enemy.name,
    lvl: enemy.lvl,
    flavor: enemy.flavor,
    isBoss: enemy.recipe.tier === 'boss',
    renderPortrait: (size) => <Monster recipe={enemy.recipe} size={size} />,
  };
}
