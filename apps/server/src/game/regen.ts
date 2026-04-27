// HP and MP regen. Semantics: "a full bar refills in a fixed wall-clock time,
// regardless of level". Because `hpMax`/`mpMax` grow every level-up, a flat
// "1 HP per 20 s" would make high-level players wait hours for a full heal.
// Instead we anchor the tick interval to the current `max` — a bigger bar
// means smaller intervals, preserving the overall regen duration.
//
// Mirrors the read-time pattern in `game/stamina.ts`: compute how many ticks
// have elapsed since `lastTickAt`, credit them (capped at max), and advance
// the timestamp by the consumed multiple so sub-tick fractions aren't lost.
// Runs inside `me.get`, so it catches up even when the game is closed.

/** A full HP bar refills in this many milliseconds, regardless of level. */
export const HP_FULL_REGEN_MS = 60 * 60 * 1000; // 60 min
/** A full MP bar refills in this many milliseconds, regardless of level. */
export const MP_FULL_REGEN_MS = 45 * 60 * 1000; // 45 min

export interface RegenResult {
  value: number;
  lastTickAt: Date;
}

/**
 * Per-point tick interval derived from the configured full-regen duration.
 * Floor to an integer ms so `lastTickAt` advances by whole milliseconds.
 * For max=0 we return the whole full-regen window so callers short-circuit.
 */
function perPointIntervalMs(fullRegenMs: number, max: number): number {
  if (max <= 0) return fullRegenMs;
  return Math.max(1, Math.floor(fullRegenMs / max));
}

function applyRegen(
  current: number,
  max: number,
  lastTickAt: Date,
  fullRegenMs: number,
  now: Date,
): RegenResult {
  if (current >= max) {
    // Stay flush against `now` so the first drop below max starts counting fresh.
    return { value: max, lastTickAt: now };
  }
  const elapsed = now.getTime() - lastTickAt.getTime();
  if (elapsed <= 0) {
    return { value: current, lastTickAt };
  }
  const interval = perPointIntervalMs(fullRegenMs, max);
  const gained = Math.floor(elapsed / interval);
  if (gained <= 0) {
    return { value: current, lastTickAt };
  }
  return {
    value: Math.min(max, current + gained),
    lastTickAt: new Date(lastTickAt.getTime() + gained * interval),
  };
}

export function applyHpRegen(
  current: number,
  max: number,
  lastTickAt: Date,
  now: Date = new Date(),
): RegenResult {
  return applyRegen(current, max, lastTickAt, HP_FULL_REGEN_MS, now);
}

export function applyMpRegen(
  current: number,
  max: number,
  lastTickAt: Date,
  now: Date = new Date(),
): RegenResult {
  return applyRegen(current, max, lastTickAt, MP_FULL_REGEN_MS, now);
}
