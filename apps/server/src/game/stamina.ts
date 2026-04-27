// Stamina regenerates +1 every STAMINA_REGEN_MS of real time. When a character row
// is touched we compute how much to credit based on (now - lastTickAt) and push
// lastTickAt forward by the consumed multiple. Never overshoot max.

export const STAMINA_REGEN_MS = 15_000;

export interface StaminaTickResult {
  stamina: number;
  lastTickAt: Date;
}

export function applyStaminaRegen(
  current: number,
  max: number,
  lastTickAt: Date,
  now: Date = new Date(),
): StaminaTickResult {
  if (current >= max) {
    // Even when full, fast-forward lastTickAt so a later drop starts counting fresh.
    return { stamina: max, lastTickAt: now };
  }
  const elapsed = now.getTime() - lastTickAt.getTime();
  if (elapsed <= 0) {
    return { stamina: current, lastTickAt };
  }
  const gained = Math.floor(elapsed / STAMINA_REGEN_MS);
  if (gained <= 0) {
    return { stamina: current, lastTickAt };
  }
  const next = Math.min(max, current + gained);
  const consumedMs = gained * STAMINA_REGEN_MS;
  return {
    stamina: next,
    lastTickAt: new Date(lastTickAt.getTime() + consumedMs),
  };
}
