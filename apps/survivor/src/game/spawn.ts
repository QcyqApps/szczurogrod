// Wave spawner — translates the stage's `spawnRate` (enemies/sec) into actual
// enemy spawns each tick. Uses a simple time-budget accumulator: every tick
// we add `dt * spawnRate` enemies-worth of budget; whenever it crosses 1.0,
// spawn one and subtract 1.0 from the accumulator.
//
// Enemy kind is uniformly sampled from the stage's `enemyRoster`. Vertical
// position is uniform within world height. Boss spawns at exactly
// `bossEntryMs` if not yet spawned, regardless of accumulator.

import type { StageDef } from '@grodno/shared/survivor';
import { ENEMY_STATS, WORLD, BASE_MAX_ENEMIES_ON_SCREEN } from './balance';
import { nextFloat } from './rng';
import type { Enemy, RunState } from './types';

export interface SpawnArgs {
  state: RunState;
  stage: StageDef;
  dtMs: number;
  maxEnemiesBonus: number;
}

export function applySpawns({ state, stage, dtMs, maxEnemiesBonus }: SpawnArgs): void {
  const cap = BASE_MAX_ENEMIES_ON_SCREEN + maxEnemiesBonus;

  // Boss entry — spawn exactly once at bossEntryMs, even if cap is reached.
  if (!state.bossSpawned && state.t >= stage.bossEntryMs) {
    state.bossSpawned = true;
    const kind = stage.boss;
    const stats = ENEMY_STATS[kind];
    const e: Enemy = {
      id: state.nextEnemyId++,
      kind,
      pos: { x: WORLD.width + 20, y: WORLD.height / 2 },
      vx: -stats.speed,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      radius: stats.radius,
      slowUntil: 0,
      hitFlashUntil: 0,
      knockbackUntil: 0,
    };
    state.enemies.push(e);
  }

  if (state.enemies.length >= cap) return;
  if (state.t > stage.durationMs && stage.boss) {
    // After the timer runs out we keep regular spawns going so the player
    // still has fodder around the boss.
  }

  state.spawnAccumulatorMs += dtMs * stage.spawnRate;
  while (state.spawnAccumulatorMs >= 1000 && state.enemies.length < cap) {
    state.spawnAccumulatorMs -= 1000;
    const kindRoll = nextFloat(state.rngState);
    state.rngState = kindRoll.state;
    const yRoll = nextFloat(state.rngState);
    state.rngState = yRoll.state;
    const kindIdx = Math.floor(kindRoll.value * stage.enemyRoster.length);
    const kind = stage.enemyRoster[kindIdx] ?? stage.enemyRoster[0];
    const stats = ENEMY_STATS[kind];
    // Safe area: margines spawnYMargin od góry i dołu, plus radius żeby ciało
    // moba mieściło się w środku. Zapobiega "wystawianiu głów" dużych spritów
    // poza canvas.
    const yMin = WORLD.spawnYMargin + stats.radius;
    const yMax = WORLD.height - WORLD.spawnYMargin - stats.radius;
    const y = yMin + yRoll.value * (yMax - yMin);
    const e: Enemy = {
      id: state.nextEnemyId++,
      kind,
      pos: { x: WORLD.width + 20, y },
      vx: -stats.speed,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      radius: stats.radius,
      slowUntil: 0,
      hitFlashUntil: 0,
      knockbackUntil: 0,
    };
    state.enemies.push(e);
  }
}
