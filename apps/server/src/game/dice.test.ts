import { describe, expect, it } from 'vitest';
import type { ItemTemplate } from '../content/registry.js';
import { rollToReward } from './dice.js';

const mkItem = (id: string): ItemTemplate => ({
  id,
  name: id,
  icon: 'sword',
  slot: 'weapon',
  rarity: 'rare',
  atk: 10,
  def: 0,
  mag: 0,
  hpHeal: 0,
  mpHeal: 0,
  desc: null,
  allowedClasses: null,
  buffKind: null,
  buffMagnitude: null,
  buffDurationHours: null,
});

describe('rollToReward', () => {
  it('rolls 1-3 → nothing', () => {
    for (const r of [1, 2, 3]) {
      const rew = rollToReward(r, () => mkItem('x'), 'item');
      expect(rew.kind).toBe('nothing');
      expect(rew.gold).toBe(0);
    }
  });

  it('rolls 4-6 → 500 gold', () => {
    for (const r of [4, 5, 6]) {
      const rew = rollToReward(r, () => mkItem('x'), 'item');
      expect(rew.kind).toBe('gold');
      expect(rew.gold).toBe(500);
    }
  });

  it('rolls 7-9 → 1500 gold', () => {
    for (const r of [7, 8, 9]) {
      const rew = rollToReward(r, () => mkItem('x'), 'item');
      expect(rew.kind).toBe('gold');
      expect(rew.gold).toBe(1500);
    }
  });

  it('roll 10 + flip=item → rare item', () => {
    const rew = rollToReward(10, () => mkItem('sword-dawn'), 'item');
    expect(rew.kind).toBe('rare_item');
    expect(rew.item?.id).toBe('sword-dawn');
  });

  it('roll 10 + flip=gems → 20 gems', () => {
    const rew = rollToReward(10, () => mkItem('x'), 'gems');
    expect(rew.kind).toBe('gems');
    expect(rew.gems).toBe(20);
  });

  it('roll 10 but item pool empty → fallback to 20 gems', () => {
    const rew = rollToReward(10, () => null, 'item');
    expect(rew.kind).toBe('gems');
    expect(rew.gems).toBe(20);
  });
});
