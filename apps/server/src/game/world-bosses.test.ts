import { describe, expect, it } from 'vitest';
import {
  applyTapBonusToEchoes,
  clampTapCount,
  TAP_FURY_DURATION_MS,
  TAP_FURY_MAX_TAPS,
  TAP_FURY_MIN_TAPS,
  tapMultiplier,
} from './world-bosses.js';

describe('clampTapCount', () => {
  it('clampuje zero/poniżej min do MIN_TAPS', () => {
    expect(clampTapCount(0, TAP_FURY_DURATION_MS)).toBe(TAP_FURY_MIN_TAPS);
    expect(clampTapCount(2, TAP_FURY_DURATION_MS)).toBe(TAP_FURY_MIN_TAPS);
  });

  it('zwraca taps gdy w zakresie', () => {
    expect(clampTapCount(15, TAP_FURY_DURATION_MS)).toBe(15);
  });

  it('clampuje powyżej do MAX_TAPS gdy duration daje wyższy ceiling', () => {
    // 4s × 12 taps/sec = 48 → cap = min(30, 48) = 30
    expect(clampTapCount(999, TAP_FURY_DURATION_MS)).toBe(TAP_FURY_MAX_TAPS);
    expect(clampTapCount(50, TAP_FURY_DURATION_MS)).toBe(TAP_FURY_MAX_TAPS);
  });

  it('clampuje do rateCap gdy duration jest krótszy', () => {
    // 2s × 12 = 24 — niżej niż MAX_TAPS=30
    expect(clampTapCount(40, 2000)).toBe(24);
    expect(clampTapCount(20, 2000)).toBe(20);
  });

  it('nie zmienia floor=MIN_TAPS gdy taps poniżej', () => {
    expect(clampTapCount(3, 2000)).toBe(TAP_FURY_MIN_TAPS);
  });
});

describe('tapMultiplier', () => {
  it('MIN_TAPS daje 0.6×', () => {
    expect(tapMultiplier(TAP_FURY_MIN_TAPS)).toBeCloseTo(0.6, 5);
  });

  it('MAX_TAPS daje 1.4×', () => {
    expect(tapMultiplier(TAP_FURY_MAX_TAPS)).toBeCloseTo(1.4, 5);
  });

  it('w połowie zakresu daje 1.0×', () => {
    const mid = (TAP_FURY_MIN_TAPS + TAP_FURY_MAX_TAPS) / 2;
    expect(tapMultiplier(mid)).toBeCloseTo(1.0, 5);
  });

  it('liniowo skaluje', () => {
    // 10 tapów → t = (10-5)/(30-5) = 0.2 → 0.6 + 0.16 = 0.76
    expect(tapMultiplier(10)).toBeCloseTo(0.76, 5);
    // 25 tapów → t = 0.8 → 0.6 + 0.64 = 1.24
    expect(tapMultiplier(25)).toBeCloseTo(1.24, 5);
  });
});

describe('applyTapBonusToEchoes', () => {
  it('brak bonusu poniżej progu', () => {
    expect(applyTapBonusToEchoes(10, 24)).toBe(10);
    expect(applyTapBonusToEchoes(10, 0)).toBe(10);
  });

  it('+50% gdy taps >= próg (25)', () => {
    expect(applyTapBonusToEchoes(10, 25)).toBe(15);
    expect(applyTapBonusToEchoes(20, 30)).toBe(30);
  });

  it('floor zaokrągla w dół', () => {
    expect(applyTapBonusToEchoes(7, 25)).toBe(10); // 7 * 1.5 = 10.5 → 10
    expect(applyTapBonusToEchoes(11, 25)).toBe(16); // 11 * 1.5 = 16.5 → 16
  });
});
