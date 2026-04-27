import { describe, expect, it } from 'vitest';
import type { MountTemplate } from '../content/registry.js';
import { applyMountSpeed, MOUNT_SPEED_CAP_PCT } from './mounts.js';

function makeMount(overrides: Partial<MountTemplate> = {}): MountTemplate {
  return {
    slug: 'mount-test',
    name: 'Testowiec',
    icon: 'horse',
    desc: '',
    speedPct: 40,
    price: 1000,
    rentalHours: 24,
    requiredLvl: 1,
    sortOrder: 0,
    ...overrides,
  };
}

describe('applyMountSpeed', () => {
  it('returns duration unchanged when no mount', () => {
    expect(applyMountSpeed(60_000, null)).toBe(60_000);
  });

  it('applies speedPct reduction (40% → 60% of original)', () => {
    const mount = makeMount({ speedPct: 40 });
    expect(applyMountSpeed(60_000, mount)).toBe(36_000);
  });

  it('applies 20% reduction (Kucyk baseline)', () => {
    const mount = makeMount({ speedPct: 20 });
    expect(applyMountSpeed(25_000, mount)).toBe(20_000);
  });

  it('applies 60% reduction (Ogier top tier)', () => {
    const mount = makeMount({ speedPct: 60 });
    // Math.ceil(600000 * 0.4) = 240000
    expect(applyMountSpeed(600_000, mount)).toBe(240_000);
  });

  it('caps reduction at MOUNT_SPEED_CAP_PCT when admin sets absurd values', () => {
    const mount = makeMount({ speedPct: 99 });
    // cap kicks in at 80 → 20% pozostaje
    expect(applyMountSpeed(10_000, mount)).toBe(Math.ceil(10_000 * 0.2));
    expect(MOUNT_SPEED_CAP_PCT).toBe(80);
  });

  it('treats negative speedPct as 0 (no speedup)', () => {
    const mount = makeMount({ speedPct: -10 });
    expect(applyMountSpeed(10_000, mount)).toBe(10_000);
  });

  it('ceils fractional results so the endsAt never rolls backwards', () => {
    const mount = makeMount({ speedPct: 33 });
    // 10_000 * 0.67 = 6700 (exact) — ceil keeps 6700
    expect(applyMountSpeed(10_000, mount)).toBe(6700);
    // 1 * 0.67 = 0.67 → ceil(0.67) = 1
    expect(applyMountSpeed(1, mount)).toBe(1);
  });
});
