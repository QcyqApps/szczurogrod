import { describe, expect, it } from 'vitest';
import { applyStaminaRegen, STAMINA_REGEN_MS } from './stamina.js';

describe('applyStaminaRegen', () => {
  it('returns max and fast-forwards lastTickAt when already full', () => {
    const lastTick = new Date(1_000_000);
    const now = new Date(2_000_000);
    const res = applyStaminaRegen(10, 10, lastTick, now);
    expect(res.stamina).toBe(10);
    expect(res.lastTickAt.getTime()).toBe(now.getTime());
  });

  it('returns unchanged when no regen tick has elapsed', () => {
    const lastTick = new Date(1_000_000);
    const now = new Date(1_000_000 + STAMINA_REGEN_MS - 1);
    const res = applyStaminaRegen(5, 10, lastTick, now);
    expect(res.stamina).toBe(5);
    expect(res.lastTickAt.getTime()).toBe(lastTick.getTime());
  });

  it('regenerates 1 point after a single tick', () => {
    const lastTick = new Date(1_000_000);
    const now = new Date(1_000_000 + STAMINA_REGEN_MS);
    const res = applyStaminaRegen(5, 10, lastTick, now);
    expect(res.stamina).toBe(6);
    expect(res.lastTickAt.getTime()).toBe(lastTick.getTime() + STAMINA_REGEN_MS);
  });

  it('regenerates multiple points when many ticks have elapsed', () => {
    const lastTick = new Date(1_000_000);
    const now = new Date(1_000_000 + STAMINA_REGEN_MS * 3 + 5000);
    const res = applyStaminaRegen(5, 10, lastTick, now);
    expect(res.stamina).toBe(8);
    // lastTickAt advances by 3 full ticks only (5000ms remainder stays pending).
    expect(res.lastTickAt.getTime()).toBe(lastTick.getTime() + STAMINA_REGEN_MS * 3);
  });

  it('caps regen at max even when many ticks would overshoot', () => {
    const lastTick = new Date(1_000_000);
    const now = new Date(1_000_000 + STAMINA_REGEN_MS * 100);
    const res = applyStaminaRegen(8, 10, lastTick, now);
    expect(res.stamina).toBe(10);
  });

  it('handles negative elapsed (clock skew) without regressing', () => {
    const lastTick = new Date(2_000_000);
    const now = new Date(1_000_000);
    const res = applyStaminaRegen(5, 10, lastTick, now);
    expect(res.stamina).toBe(5);
    expect(res.lastTickAt.getTime()).toBe(lastTick.getTime());
  });

  it('does not advance lastTickAt when no whole tick elapsed', () => {
    const lastTick = new Date(1_000_000);
    const now = new Date(1_000_000 + 5000);
    const res = applyStaminaRegen(3, 10, lastTick, now);
    expect(res.lastTickAt.getTime()).toBe(lastTick.getTime());
  });
});
