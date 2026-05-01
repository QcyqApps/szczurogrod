// Closed-form parabola solver. Given a start point, target point, fixed
// flight time, and gravity, compute the launch velocity such that the
// projectile lands exactly at `target` at t = flightTime under constant
// downward gravity.
//
//   dx = vx * t_f                       => vx = dx / t_f
//   dy = vy0 * t_f + 0.5 * g * t_f^2    => vy0 = (dy - 0.5*g*t_f^2) / t_f
//
// World convention: y grows DOWN (canvas-native). Gravity is positive (pulls
// projectiles toward larger y), so a negative `vy0` makes the body lob up
// before arcing back down to the target — exactly what we want visually.

import type { Vec2 } from './types';

export interface ParabolaResult {
  vx: number;
  vy: number;
}

export function solveParabola(
  from: Vec2,
  to: Vec2,
  flightTimeMs: number,
  gravity: number,
): ParabolaResult {
  const t = flightTimeMs / 1000;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const vx = dx / t;
  const vy = (dy - 0.5 * gravity * t * t) / t;
  return { vx, vy };
}
