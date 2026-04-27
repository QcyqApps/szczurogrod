// Dungeon keys — the primary throttle on combat engagement. Each
// `combat.engage` consumes one key; keys regenerate `+1 per 15 min` up to a
// hard cap of 15. Mirrors the read-time regen pattern from `game/regen.ts`
// and `game/stamina.ts`: we advance `lastTickAt` only by consumed ticks, so
// offline catch-up lands naturally on the next `me.get` or `combat.engage`.

/** Time to gain one dungeon key. */
export const KEY_REGEN_MS = 15 * 60 * 1000;
/** Maximum keys a character can hold. */
export const DUNGEON_KEYS_MAX = 15;
/** Keys consumed per engage. Flat across all mob tiers. */
export const KEY_COST_PER_FIGHT = 1;

export interface KeyRegenResult {
  value: number;
  lastTickAt: Date;
}

export function applyKeyRegen(
  current: number,
  max: number,
  lastTickAt: Date,
  now: Date = new Date(),
): KeyRegenResult {
  if (current >= max) {
    // Stay flush against `now` so the first drop below cap starts counting
    // from the moment the player spent a key, not from some ancient tick.
    return { value: max, lastTickAt: now };
  }
  const elapsed = now.getTime() - lastTickAt.getTime();
  if (elapsed <= 0) {
    return { value: current, lastTickAt };
  }
  const gained = Math.floor(elapsed / KEY_REGEN_MS);
  if (gained <= 0) {
    return { value: current, lastTickAt };
  }
  return {
    value: Math.min(max, current + gained),
    lastTickAt: new Date(lastTickAt.getTime() + gained * KEY_REGEN_MS),
  };
}
