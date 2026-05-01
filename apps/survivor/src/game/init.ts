// Run state factory. Called once when `Run.tsx` mounts after `startRun`
// resolves. Skill-tree levels are baked into the player's starting stats so
// the tick loop reads from a stable struct without needing to re-apply
// skills each frame.

import type { AppliedSkills } from '@grodno/shared/survivor';
import { PLAYER, WORLD } from './balance';
import type { AppliedSkillsRuntime, RunState } from './types';

export interface InitArgs {
  readonly stageId: number;
  readonly seed: number;
  readonly skills: AppliedSkills;
}

export function initRun({ stageId, seed, skills }: InitArgs): {
  state: RunState;
  skills: AppliedSkillsRuntime;
} {
  const maxHp = PLAYER.baseMaxHp + skills.hpMaxBonus;
  return {
    state: {
      t: 0,
      stageId,
      rngState: seed >>> 0,
      player: {
        pos: { x: WORLD.playerX, y: WORLD.playerY },
        hp: maxHp,
        maxHp,
        fireCooldownMs: 0,
      },
      enemies: [],
      projectiles: [],
      shards: [],
      explosions: [],
      floatingTexts: [],
      nextFloatingTextId: 1,
      nextExplosionId: 1,
      nextShardId: 1,
      crosshair: { x: WORLD.width / 2, y: WORLD.height / 2 },
      killCount: 0,
      bossSpawned: false,
      bossKilled: false,
      bossKindId: null,
      status: 'running',
      nextEnemyId: 1,
      nextProjectileId: 1,
      spawnAccumulatorMs: 0,
      contactHitCount: 0,
    },
    skills: { ...skills },
  };
}
