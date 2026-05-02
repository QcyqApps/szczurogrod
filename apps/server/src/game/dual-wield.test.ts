// Locks the rogue dual-wield rules:
//   1. Tylko sztylety (icon prefix `dagger`) wpadają w slot 'off' dla rogue.
//   2. Off-hand sztylet kontrybuuje 50% atk (loadEquipBonuses w arena.ts).
//
// Test nie hituje DB — sprawdza pure helpery z shared + stałą OFF_HAND_DAGGER_ATK_MULT.

import { describe, expect, it } from 'vitest';
import { canEquipInOffSlot, isDaggerWeapon } from '@grodno/shared';
import { OFF_HAND_DAGGER_ATK_MULT } from './arena.js';

describe('isDaggerWeapon', () => {
  it('rozpoznaje sztylety po icon prefix dagger', () => {
    expect(isDaggerWeapon({ slot: 'weapon', icon: 'dagger' })).toBe(true);
    expect(isDaggerWeapon({ slot: 'weapon', icon: 'dagger-mist' })).toBe(true);
    expect(isDaggerWeapon({ slot: 'weapon', icon: 'daggers-flame' })).toBe(true);
  });

  it('odrzuca nie-broń mimo prefix', () => {
    expect(isDaggerWeapon({ slot: 'off', icon: 'dagger' })).toBe(false);
    expect(isDaggerWeapon({ slot: 'head', icon: 'dagger' })).toBe(false);
  });

  it('odrzuca broń bez prefix dagger', () => {
    expect(isDaggerWeapon({ slot: 'weapon', icon: 'sword-dawn' })).toBe(false);
    expect(isDaggerWeapon({ slot: 'weapon', icon: 'orb' })).toBe(false);
    expect(isDaggerWeapon({ slot: 'weapon', icon: 'staff' })).toBe(false);
  });
});

describe('canEquipInOffSlot', () => {
  const dagger = { slot: 'weapon' as const, icon: 'dagger' };
  const sword = { slot: 'weapon' as const, icon: 'sword-iron' };
  const shield = { slot: 'off' as const, icon: 'shield-item' };

  it('shieldy wszystkim klasom', () => {
    expect(canEquipInOffSlot('warrior', shield)).toBe(true);
    expect(canEquipInOffSlot('rogue', shield)).toBe(true);
    expect(canEquipInOffSlot('mage', shield)).toBe(true);
  });

  it('sztylet w off — tylko rogue', () => {
    expect(canEquipInOffSlot('warrior', dagger)).toBe(false);
    expect(canEquipInOffSlot('mage', dagger)).toBe(false);
    expect(canEquipInOffSlot('rogue', dagger)).toBe(true);
  });

  it('miecz w off — nikt (nawet rogue)', () => {
    expect(canEquipInOffSlot('warrior', sword)).toBe(false);
    expect(canEquipInOffSlot('rogue', sword)).toBe(false);
  });
});

describe('OFF_HAND_DAGGER_ATK_MULT', () => {
  it('nerf = 50% (D&D / WoW convention)', () => {
    expect(OFF_HAND_DAGGER_ATK_MULT).toBe(0.5);
  });

  it('20 atk sztylet w off → 10 effective atk', () => {
    expect(Math.floor(20 * OFF_HAND_DAGGER_ATK_MULT)).toBe(10);
  });

  it('218 atk legendary sztylet (Sztylety Płomienne) w off → 109', () => {
    expect(Math.floor(218 * OFF_HAND_DAGGER_ATK_MULT)).toBe(109);
  });
});
