import { describe, expect, it } from 'vitest';
import type { DungeonTemplate } from '../content/registry.js';
import {
  computeDungeonMobChainStatus,
  computeDungeonStatus,
  listUnlockedEnemySlugs,
} from './dungeon-progress.js';

function makeDungeon(overrides: Partial<DungeonTemplate> = {}): DungeonTemplate {
  return {
    slug: 'test-dungeon',
    regionSlug: 'region',
    name: 'Test',
    desc: '',
    requiredLvl: 1,
    prerequisiteDungeonSlug: null,
    bossEnemySlug: 'test-boss',
    mapX: 0,
    mapY: 0,
    sortOrder: 1,
    mobSlugs: [],
    ...overrides,
  };
}

describe('computeDungeonStatus', () => {
  it('pierwszy loch (prerequisite=null) — unlocked gdy LVL OK', () => {
    const d = makeDungeon({ requiredLvl: 1 });
    const res = computeDungeonStatus(d, 1, new Set());
    expect(res.status).toBe('unlocked');
    expect(res.lockReason).toBeNull();
  });

  it('loch wymaga LVL — locked gdy LVL za niski', () => {
    const d = makeDungeon({ requiredLvl: 6 });
    const res = computeDungeonStatus(d, 5, new Set());
    expect(res.status).toBe('locked');
    expect(res.lockReason).toContain('6');
  });

  it('loch z prerequisite — locked bez clear poprzednika', () => {
    const d = makeDungeon({
      slug: 'b',
      requiredLvl: 5,
      prerequisiteDungeonSlug: 'a',
    });
    const res = computeDungeonStatus(d, 10, new Set());
    expect(res.status).toBe('locked');
    expect(res.lockReason).toContain('Pokonaj bossa');
  });

  it('loch z prerequisite — unlocked gdy LVL OK i prerequisite cleared', () => {
    const d = makeDungeon({
      slug: 'b',
      requiredLvl: 5,
      prerequisiteDungeonSlug: 'a',
    });
    const res = computeDungeonStatus(d, 10, new Set(['a']));
    expect(res.status).toBe('unlocked');
    expect(res.lockReason).toBeNull();
  });

  it('LVL za niski nawet przy spełnionym prerequisite — nadal locked', () => {
    const d = makeDungeon({
      slug: 'b',
      requiredLvl: 10,
      prerequisiteDungeonSlug: 'a',
    });
    const res = computeDungeonStatus(d, 5, new Set(['a']));
    expect(res.status).toBe('locked');
    expect(res.lockReason).toContain('10');
  });

  it('loch w cleared set — status=cleared niezależnie od LVL', () => {
    const d = makeDungeon({ slug: 'x', requiredLvl: 100 });
    const res = computeDungeonStatus(d, 1, new Set(['x']));
    expect(res.status).toBe('cleared');
    expect(res.lockReason).toBeNull();
  });
});

describe('listUnlockedEnemySlugs', () => {
  it('zwraca mob+boss slugi z odblokowanych lochów', () => {
    const piwnice = makeDungeon({
      slug: 'piwnice',
      requiredLvl: 1,
      prerequisiteDungeonSlug: null,
      bossEnemySlug: 'rat-king',
      mobSlugs: ['goblin', 'rat'],
    });
    const katakumby = makeDungeon({
      slug: 'katakumby',
      requiredLvl: 6,
      prerequisiteDungeonSlug: 'piwnice',
      bossEnemySlug: 'kosciej',
      mobSlugs: ['skeleton', 'bat'],
    });

    const out = listUnlockedEnemySlugs([piwnice, katakumby], 1, new Set());
    expect(out.has('goblin')).toBe(true);
    expect(out.has('rat')).toBe(true);
    expect(out.has('rat-king')).toBe(true);
    expect(out.has('skeleton')).toBe(false); // katakumby locked
  });

  it('po clear piwnic — katakumby dołącza do puli', () => {
    const piwnice = makeDungeon({
      slug: 'piwnice',
      requiredLvl: 1,
      prerequisiteDungeonSlug: null,
      bossEnemySlug: 'rat-king',
      mobSlugs: ['goblin'],
    });
    const katakumby = makeDungeon({
      slug: 'katakumby',
      requiredLvl: 6,
      prerequisiteDungeonSlug: 'piwnice',
      bossEnemySlug: 'kosciej',
      mobSlugs: ['skeleton'],
    });
    const out = listUnlockedEnemySlugs([piwnice, katakumby], 10, new Set(['piwnice']));
    expect(out.has('skeleton')).toBe(true);
    expect(out.has('kosciej')).toBe(true);
  });
});

describe('computeDungeonMobChainStatus', () => {
  const names = new Map([
    ['goblin', 'Goblin Śmieciarz'],
    ['rat', 'Szczur Olbrzym'],
    ['slime', 'Zielony Slime'],
    ['rat-king', 'Szczurzy Król'],
  ]);
  const piwnice = makeDungeon({
    slug: 'piwnice',
    bossEnemySlug: 'rat-king',
    mobSlugs: ['goblin', 'rat', 'slime'],
  });

  it('pierwszy mob zawsze unlocked (brak poprzednika)', () => {
    const chain = computeDungeonMobChainStatus(piwnice, new Set(), names);
    expect(chain.get('goblin')?.unlocked).toBe(true);
    expect(chain.get('goblin')?.reason).toBeNull();
  });

  it('drugi mob locked gdy pierwszy nie ubity', () => {
    const chain = computeDungeonMobChainStatus(piwnice, new Set(), names);
    const s = chain.get('rat');
    expect(s?.unlocked).toBe(false);
    expect(s?.reason).toContain('Goblin Śmieciarz');
  });

  it('drugi mob unlocked po ubiciu pierwszego', () => {
    const chain = computeDungeonMobChainStatus(piwnice, new Set(['goblin']), names);
    expect(chain.get('rat')?.unlocked).toBe(true);
    expect(chain.get('slime')?.unlocked).toBe(false);
    expect(chain.get('slime')?.reason).toContain('Szczur Olbrzym');
  });

  it('boss locked gdy którykolwiek regular mob nie ubity', () => {
    const chain = computeDungeonMobChainStatus(
      piwnice,
      new Set(['goblin', 'rat']),
      names,
    );
    const boss = chain.get('rat-king');
    expect(boss?.unlocked).toBe(false);
    expect(boss?.reason).toContain('wszystkie potwory');
  });

  it('boss unlocked gdy wszystkie regular moby ubite', () => {
    const chain = computeDungeonMobChainStatus(
      piwnice,
      new Set(['goblin', 'rat', 'slime']),
      names,
    );
    expect(chain.get('rat-king')?.unlocked).toBe(true);
    expect(chain.get('rat-king')?.reason).toBeNull();
  });

  it('pusty loch (0 mobów) — boss od razu unlocked', () => {
    const empty = makeDungeon({ mobSlugs: [], bossEnemySlug: 'lonely-boss' });
    const chain = computeDungeonMobChainStatus(empty, new Set(), names);
    expect(chain.get('lonely-boss')?.unlocked).toBe(true);
  });

  it('fallback nazwy gdy slug nie ma wpisu w enemyNames', () => {
    const chain = computeDungeonMobChainStatus(
      piwnice,
      new Set(),
      new Map(), // brak nazw
    );
    expect(chain.get('rat')?.reason).toContain('goblin');
  });
});
