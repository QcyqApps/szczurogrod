// Pure domain types for the survivor run loop. Lives in the survivor app
// (not in @grodno/shared) because nothing on the server needs to reason about
// per-frame state — the server only sees the start/finish report.

import type { EnemyKind } from '@grodno/shared/survivor';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Player {
  /** Position is fixed at left edge but exposed so render can read it. */
  pos: Vec2;
  hp: number;
  maxHp: number;
  fireCooldownMs: number;
}

export interface Enemy {
  id: number;
  kind: EnemyKind;
  pos: Vec2;
  vx: number;
  hp: number;
  maxHp: number;
  radius: number;
  /** Wall-clock ms timestamp until which the slow effect applies. */
  slowUntil: number;
  /** Wall-clock ms timestamp until which the hit-flash visual is on. */
  hitFlashUntil: number;
  /** Wall-clock ms timestamp until which knockback applies (wróg leci do
   * tyłu zamiast naprzód). 0 = brak knockback. Bossy nigdy nie dostają
   * knockback'u, więc dla nich zawsze 0. */
  knockbackUntil: number;
}

export interface FloatingText {
  id: number;
  text: string;
  pos: Vec2;
  /** Initial vy in px/sec. Decays linearly toward 0 over lifetime. */
  vy: number;
  spawnedAt: number;
  lifetimeMs: number;
  /** Tint color (Pixi hex) — usually white for normal, gold for crit. */
  color: number;
}

export interface Projectile {
  id: number;
  pos: Vec2;
  /** Parabolic velocity (px/s). Gravity is applied to `vel.y` each tick. */
  vel: Vec2;
  /** Detonation point captured at fire-time. The projectile snaps here at
   * `detonateAtMs`; mid-flight collisions never apply. */
  targetAt: Vec2;
  /** Wall-clock state.t at which the bomb explodes. Decoupled from position
   * so we can detonate cleanly even when float drift moves the body slightly
   * off the closed-form arc. */
  detonateAtMs: number;
  damage: number;
  /** AOE radius applied at `targetAt` on detonation. */
  splash: number;
}

/** A short-lived expanding ring at a detonation point. Render only — no game
 * effect (the AOE damage is applied immediately when the explosion spawns). */
export interface Explosion {
  id: number;
  pos: Vec2;
  radius: number;
  spawnedAt: number;
  lifetimeMs: number;
}

/** Odłamek wystrzelony z eksplozji w stronę konkretnego wroga. Trajektoria:
 * inicjalna velocity z bocznym push'em (każdy odłamek ma offset kątowy
 * względem kierunku do celu) + lekka grawitacja + homing acceleration co
 * tick zakrzywia tor w stronę moba. Czyta się jako rozprysk z efektowną
 * krzywą, nie sterylna prosta. Despawn:
 *   (a) trafienie celu (damage + lifesteal),
 *   (b) cel zniknął przed trafieniem,
 *   (c) ttl wygasł (failsafe na sytuacje brzegowe). */
export interface Shard {
  id: number;
  pos: Vec2;
  /** Aktualna prędkość px/s. Modyfikowana co tick przez homing + grawitację. */
  vel: Vec2;
  targetEnemyId: number;
  damage: number;
  spawnedAt: number;
  ttlMs: number;
}

export type RunStatus = 'running' | 'won' | 'lost';

export interface RunState {
  /** Wall-clock ms since `startRun` returned. */
  t: number;
  stageId: number;
  rngState: number;
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  shards: Shard[];
  explosions: Explosion[];
  floatingTexts: FloatingText[];
  nextFloatingTextId: number;
  nextExplosionId: number;
  nextShardId: number;
  /** World-space (canvas-space) crosshair position. */
  crosshair: Vec2;
  killCount: number;
  bossSpawned: boolean;
  bossKilled: boolean;
  /** Mirrors `stage.boss` for tick-time access without re-importing the def. */
  bossKindId: EnemyKind | null;
  status: RunStatus;
  nextEnemyId: number;
  nextProjectileId: number;
  /** Internal accumulator for spawn cadence (Poisson sampling). */
  spawnAccumulatorMs: number;
  /** Inkrementowany przy każdym contact-damage event (mob dotyka gracza).
   * Run.tsx watchuje delta i triggeruje screen shake + red flash overlay,
   * żeby trafienie miało wagę wizualną, nie tylko spadek HP w pillsie. */
  contactHitCount: number;
}

export interface TickInput {
  crosshair: Vec2;
}

export interface AppliedSkillsRuntime {
  hpMaxBonus: number;
  dmgMult: number;
  castTimeReductionMs: number;
  splashRadiusBonus: number;
  projectileSpeedMult: number;
  slowOnHit: boolean;
  critChance: number;
  maxEnemiesBonus: number;
  lifestealHpPerHit: number;
  shardChance: number;
  shardMax: number;
  knockbackChance: number;
}
