// Pure-ish (mutates state in-place for perf) tick function. Called from the
// Pixi ticker each frame with a real `dtMs`. The state object is the *same*
// reference across ticks — render reads it directly. Returns the same
// reference so call sites compose `state = tick(state, dt, input)` if they
// prefer.
//
// Splits responsibilities:
//   1. spawn:    applySpawns advances `state.spawnAccumulatorMs` and may push enemies
//   2. fire:     if cooldown elapsed and enemies present, spawn projectile aimed at crosshair
//   3. integrate: advance enemies (left), projectiles (straight line, no gravity)
//   4. detonate: projectile reaches its captured target → AOE explosion damages all enemies in radius
//   5. drain:    HP/s drain on the player
//   6. contact:  enemies that reach playerX deal contact damage
//   7. status:   detect win (boss killed) / lose (HP <= 0)

import type { StageDef } from '@grodno/shared/survivor';
import { applySpawns } from './spawn';
import { solveParabola } from './projectile';
import { ENEMY_STATS, KNOCKBACK, PLAYER, PROJECTILE, SHARD, WORLD } from './balance';
import type { AppliedSkillsRuntime, Projectile, RunState, Shard, TickInput } from './types';

const ENEMY_REACHED_PLAYER_X = WORLD.playerX + WORLD.playerRadius;

export function tick(
  state: RunState,
  dtMs: number,
  input: TickInput,
  stage: StageDef,
  skills: AppliedSkillsRuntime,
): RunState {
  if (state.status !== 'running') return state;

  state.t += dtMs;
  state.crosshair = input.crosshair;

  applySpawns({ state, stage, dtMs, maxEnemiesBonus: skills.maxEnemiesBonus });
  state.bossKindId = stage.boss;

  // 2. Fire (auto-fire while there's at least one enemy on screen).
  state.player.fireCooldownMs = Math.max(0, state.player.fireCooldownMs - dtMs);
  const fireCdActual = Math.max(
    PLAYER.minFireCooldownMs,
    PLAYER.baseFireCooldownMs - skills.castTimeReductionMs,
  );
  if (state.player.fireCooldownMs <= 0 && state.enemies.length > 0) {
    spawnProjectile(state, skills);
    state.player.fireCooldownMs = fireCdActual;
  }

  // 3. Integrate enemies. Priorytet: knockback (push +x) > slow (mult na vx) >
  // normalny ruch. Knockback nadpisuje slow bo to discrete event reaction —
  // gracz widzi wroga lecącego do tyłu, nie wolniejszą wersję forward'a.
  for (const e of state.enemies) {
    if (e.knockbackUntil > state.t) {
      e.pos.x += KNOCKBACK.speed * (dtMs / 1000);
    } else {
      const slowMult = e.slowUntil > state.t ? 0.75 : 1;
      e.pos.x += e.vx * (dtMs / 1000) * slowMult;
    }
  }

  // 3b. Integrate projectiles along the parabola: pos += vel*dt; vy += g*dt.
  // Mid-flight collisions never apply — the bomb arcs over enemies and only
  // explodes on arrival at `targetAt`, signaled by `state.t >= detonateAtMs`.
  // Detonation time is decoupled from position so we don't have to chase
  // float drift; we snap pos to `targetAt` right before detonating so the
  // explosion ring lands exactly where the crosshair was at fire-time.
  const dt = dtMs / 1000;
  const survivedProjectiles: Projectile[] = [];
  for (const p of state.projectiles) {
    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;
    p.vel.y += PROJECTILE.gravity * dt;

    if (state.t >= p.detonateAtMs) {
      p.pos.x = p.targetAt.x;
      p.pos.y = p.targetAt.y;
      detonate(state, p, skills);
    } else {
      survivedProjectiles.push(p);
    }
  }
  state.projectiles = survivedProjectiles;

  // 3c. Integrate shards — krzywe homing-with-arc.
  // Każdy odłamek ma własną velocity (wachlarz boczny przy spawn'ie + lekka
  // grawitacja + homing acceleration co tick zakrzywia tor w kierunku celu).
  // Daje efekt rozprysku: początkowo lecą "na boki", ale homing zakręca je
  // z powrotem do moba — czyta się jako parabola/krzywa w stronę celu.
  if (state.shards.length > 0) {
    const survivedShards: Shard[] = [];
    for (const sh of state.shards) {
      if (state.t - sh.spawnedAt > sh.ttlMs) continue;
      let target = state.enemies.find((e) => e.id === sh.targetEnemyId);
      // Retarget gdy oryginalny cel zginął (typowo: poprzedni shard go zabił).
      // Bez tego shard znikał cicho mid-flight i gracz widział "rozprysk co
      // znika w powietrzu". Szukamy najbliższego żywego wroga w zasięgu —
      // jeśli żaden nie pasuje, shard się rozpływa naturalnie po TTL.
      if (!target) {
        let bestD2 = SHARD.targetSearchRadius * SHARD.targetSearchRadius;
        let best: typeof state.enemies[number] | null = null;
        for (const e of state.enemies) {
          if (e.hp <= 0) continue;
          const dx = e.pos.x - sh.pos.x;
          const dy = e.pos.y - sh.pos.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestD2) { bestD2 = d2; best = e; }
        }
        if (!best) continue; // nikogo nie ma — shard znika
        sh.targetEnemyId = best.id;
        target = best;
      }
      // Swept hit detection — sprawdzamy czy odcinek (oldPos → newPos) krzyżuje
      // dysk wroga. Bez tego szybkie shard'y (po homing accel) tunelowały przez
      // moba między klatkami, gracz widział "leci we wroga ale brak damage".
      const newX = sh.pos.x + sh.vel.x * dt;
      const newY = sh.pos.y + sh.vel.y * dt;
      const hitDist = target.radius + SHARD.hitPaddingPx;
      if (segmentHitsCircle(sh.pos.x, sh.pos.y, newX, newY, target.pos.x, target.pos.y, hitDist)) {
        applyDamage(state, target, sh.damage, skills);
        continue;
      }
      const ddx = target.pos.x - sh.pos.x;
      const ddy = target.pos.y - sh.pos.y;
      const distNow = Math.hypot(ddx, ddy);
      // Homing: blend velocity toward direction-to-target. Acceleration
      // dodawana do aktualnej velocity, więc inicjalny wachlarz krzywi się
      // w stronę celu zamiast się resetować (linear path).
      if (distNow > 0) {
        const ux = ddx / distNow;
        const uy = ddy / distNow;
        sh.vel.x += ux * SHARD.homingAccel * dt;
        sh.vel.y += uy * SHARD.homingAccel * dt;
      }
      // Subtle gravity — odłamek "ciąży" w dół podczas krzywej, dodaje
      // organic feel.
      sh.vel.y += SHARD.gravityY * dt;
      // Cap speed żeby homing accel nie rozpędził odłamka do absurdu —
      // utrzymuje stałą czytelną prędkość, krzywa zostaje widoczna.
      const speedNow = Math.hypot(sh.vel.x, sh.vel.y);
      const maxSpeed = SHARD.speed * SHARD.maxSpeedMult;
      if (speedNow > maxSpeed) {
        sh.vel.x = (sh.vel.x / speedNow) * maxSpeed;
        sh.vel.y = (sh.vel.y / speedNow) * maxSpeed;
      }
      sh.pos.x = newX;
      sh.pos.y = newY;
      survivedShards.push(sh);
    }
    state.shards = survivedShards;
  }

  // 5. HP drain (passive damage from the timer).
  state.player.hp -= stage.drainPerSec * (dtMs / 1000);

  // 6. Contact damage — enemies that reach the player do contact dmg and
  // get removed (sacrificial). contactHitCount inkrementuje się raz na hit
  // event (a nie raz na klatkę × N wrogów na zasięgu) — wrappery w Run.tsx
  // watchują delta i odpalają shake + red flash.
  const remaining = state.enemies.filter((e) => {
    if (e.pos.x - e.radius <= ENEMY_REACHED_PLAYER_X) {
      state.player.hp -= ENEMY_STATS[e.kind].contactDamage;
      state.contactHitCount++;
      return false;
    }
    return true;
  });
  state.enemies = remaining;

  // 6b. Floating texts — advance + cull.
  const livingTexts = [];
  for (const ft of state.floatingTexts) {
    const age = state.t - ft.spawnedAt;
    if (age > ft.lifetimeMs) continue;
    ft.pos.y += ft.vy * (dtMs / 1000);
    livingTexts.push(ft);
  }
  state.floatingTexts = livingTexts;

  // 6c. Explosions — pure visual, just cull when expired.
  state.explosions = state.explosions.filter((x) => state.t - x.spawnedAt < x.lifetimeMs);

  // 7. End conditions.
  if (state.player.hp <= 0) {
    state.player.hp = 0;
    state.status = 'lost';
  } else if (state.bossKilled) {
    state.status = 'won';
  }

  return state;
}

function spawnProjectile(state: RunState, skills: AppliedSkillsRuntime): void {
  const playerPos = state.player.pos;
  const start = { x: playerPos.x, y: playerPos.y - 8 };
  // Snapshot the crosshair at fire-time — moving the mouse after firing must
  // not redirect a projectile already in the air.
  const target = { x: state.crosshair.x, y: state.crosshair.y };
  // Distance-based arc: szczyt paraboli skaluje się z odległością celu, żeby
  // close-range shots miały płaski łuk. Ze stałej grawitacji `g` i pożądanego
  // szczytu `h` wynika t = sqrt(8h/g) (dla startu i celu na tej samej y;
  // dy ≠ 0 lekko przesunie szczyt, akceptowalne przybliżenie).
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const dist = Math.hypot(dx, dy);
  const desiredPeakPx = Math.max(
    PROJECTILE.minArcPeakPx,
    Math.min(PROJECTILE.maxArcPeakPx, dist * PROJECTILE.arcRatio),
  );
  const baseFlight = Math.sqrt((8 * desiredPeakPx) / PROJECTILE.gravity) * 1000;
  // proj_speed skill shrinks flight time (faster lob). Floor zachowuje
  // czytelność animacji.
  const flightTimeMs = Math.max(
    PROJECTILE.minFlightTimeMs,
    baseFlight / skills.projectileSpeedMult,
  );
  const { vx, vy } = solveParabola(start, target, flightTimeMs, PROJECTILE.gravity);
  state.projectiles.push({
    id: state.nextProjectileId++,
    pos: start,
    vel: { x: vx, y: vy },
    targetAt: target,
    detonateAtMs: state.t + flightTimeMs,
    damage: PROJECTILE.baseDamage * skills.dmgMult,
    splash: PROJECTILE.baseExplosionRadius + skills.splashRadiusBonus,
  });
}

/** AOE blast at the projectile's targetAt. Damages every enemy whose center
 * falls within `p.splash` px. Spawns a render-only explosion ring. */
function detonate(state: RunState, p: Projectile, skills: AppliedSkillsRuntime): void {
  const r2 = p.splash * p.splash;
  const damagedIds = new Set<number>();
  let anyHit = false;
  // Iteracja po snapshot'ie idów — applyDamage filtruje state.enemies, więc
  // continued mutation w tej pętli jest bezpieczne (filtrujemy tylko rekordy
  // które już mieliśmy).
  const candidates = state.enemies.slice();
  for (const e of candidates) {
    const dx = e.pos.x - p.targetAt.x;
    const dy = e.pos.y - p.targetAt.y;
    if (dx * dx + dy * dy <= r2) {
      applyDamage(state, e, p.damage, skills);
      damagedIds.add(e.id);
      anyHit = true;
    }
  }
  state.explosions.push({
    id: state.nextExplosionId++,
    pos: { x: p.targetAt.x, y: p.targetAt.y },
    radius: p.splash,
    spawnedAt: state.t,
    lifetimeMs: 320,
  });
  // Shard split — tylko jeśli (a) eksplozja kogoś trafiła, (b) gracz ma
  // chance > 0 i shardMax > 0, (c) RNG roll passuje. Bez (a) odłamki
  // wystrzeliwałyby z pustki, co czyta się dziwnie wizualnie.
  if (
    anyHit &&
    skills.shardChance > 0 &&
    skills.shardMax > 0 &&
    pseudoCrit(state, skills.shardChance)
  ) {
    spawnShards(state, p, damagedIds, skills);
  }
}

function spawnShards(
  state: RunState,
  p: Projectile,
  damagedIds: ReadonlySet<number>,
  skills: AppliedSkillsRuntime,
): void {
  const r2 = SHARD.targetSearchRadius * SHARD.targetSearchRadius;
  // Kandydaci: wrogowie żywi, NIE w pierwotnej AOE, w promieniu szukania.
  // Sortujemy po dystansie żeby najbliżsi byli pierwszymi celami.
  type Cand = { id: number; d2: number; e: (typeof state.enemies)[number] };
  const candidates: Cand[] = [];
  for (const e of state.enemies) {
    if (damagedIds.has(e.id)) continue;
    if (e.hp <= 0) continue;
    const dx = e.pos.x - p.targetAt.x;
    const dy = e.pos.y - p.targetAt.y;
    const d2 = dx * dx + dy * dy;
    if (d2 <= r2) candidates.push({ id: e.id, d2, e });
  }
  candidates.sort((a, b) => a.d2 - b.d2);
  const count = Math.min(skills.shardMax, candidates.length);
  if (count === 0) return;
  // Każdy odłamek dostaje offset kątowy w wachlarzu wokół kierunku do swojego
  // celu — symetryczny rozkład (środkowy idzie prosto, boczne odchylają się
  // o coraz większy kąt). Daje efekt eksplozji rozchodzącej się na boki.
  // Homing acceleration w głównej pętli zakrzywia tor z powrotem do moba.
  const spreadRad = (SHARD.spreadDeg * Math.PI) / 180;
  for (let i = 0; i < count; i++) {
    const c = candidates[i]!;
    const dx = c.e.pos.x - p.targetAt.x;
    const dy = c.e.pos.y - p.targetAt.y;
    const baseAng = Math.atan2(dy, dx);
    // Offset: count=1 → 0, count=2 → ±0.5, count=3 → -1, 0, +1, etc.
    // Zakres pełny ±spreadRad/2 rozdzielony równomiernie.
    const offsetFrac = count === 1 ? 0 : (i - (count - 1) / 2) / (count - 1);
    const angOffset = offsetFrac * spreadRad;
    const ang = baseAng + angOffset;
    state.shards.push({
      id: state.nextShardId++,
      pos: { x: p.targetAt.x, y: p.targetAt.y },
      vel: {
        x: Math.cos(ang) * SHARD.speed,
        y: Math.sin(ang) * SHARD.speed,
      },
      targetEnemyId: c.id,
      damage: p.damage * SHARD.damageMult,
      spawnedAt: state.t,
      ttlMs: SHARD.ttlMs,
    });
  }
}

function applyDamage(
  state: RunState,
  e: {
    id: number;
    hp: number;
    pos: import('./types').Vec2;
    kind: import('@grodno/shared/survivor').EnemyKind;
    slowUntil: number;
    hitFlashUntil: number;
    knockbackUntil: number;
  },
  baseDamage: number,
  skills: AppliedSkillsRuntime,
): void {
  const isCrit = skills.critChance > 0 && pseudoCrit(state, skills.critChance);
  const dmg = Math.round(baseDamage * (isCrit ? 2 : 1));
  e.hp -= dmg;
  e.hitFlashUntil = state.t + 100;
  if (skills.slowOnHit) {
    e.slowUntil = state.t + 1000;
  }
  // Knockback — bossowie immune (state.bossKindId === e.kind). Re-roll przy
  // każdym hit'cie, refresh duration jeśli już aktywny → spammed-shot combo
  // może utrzymać moba w powietrzu kilka chwil.
  if (
    skills.knockbackChance > 0 &&
    e.kind !== state.bossKindId &&
    pseudoCrit(state, skills.knockbackChance)
  ) {
    e.knockbackUntil = state.t + KNOCKBACK.durationMs;
  }
  // Lifesteal — subtelny heal per trafienie. Cap na maxHp żeby nie overshoot
  // (np. chunk multi-AOE w spore'a wrogów na pełnym HP jest no-op).
  if (skills.lifestealHpPerHit > 0 && state.player.hp < state.player.maxHp) {
    state.player.hp = Math.min(
      state.player.maxHp,
      state.player.hp + skills.lifestealHpPerHit,
    );
  }
  state.floatingTexts.push({
    id: state.nextFloatingTextId++,
    text: String(dmg),
    pos: { x: e.pos.x, y: e.pos.y - 18 },
    vy: -50,
    spawnedAt: state.t,
    lifetimeMs: 700,
    color: isCrit ? 0xffd76a : 0xfff0c8,
  });
  if (e.hp <= 0) {
    state.killCount++;
    if (state.bossKindId !== null && e.kind === state.bossKindId) {
      state.bossKilled = true;
    }
    state.enemies = state.enemies.filter((x) => x.id !== e.id);
  }
}

function pseudoCrit(state: RunState, chance: number): boolean {
  // Use the same RNG state so crits are deterministic given the seed.
  const t = (state.rngState + 0x6d2b79f5) >>> 0;
  state.rngState = t;
  return ((t % 1000) / 1000) < chance;
}

/** Czy odcinek (x0,y0)–(x1,y1) krzyżuje (lub zawiera się w) okrąg o środku
 * (cx,cy) i promieniu r. Zwraca true gdy najmniejsza odległość od środka okręgu
 * do odcinka <= r. Używane do swept collision shard'ów: bez tego szybkie
 * pociski tunelowały między klatkami przez wrogów. */
function segmentHitsCircle(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  r: number,
): boolean {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const lenSq = dx * dx + dy * dy;
  // Degenerate segment — point distance check.
  if (lenSq === 0) {
    const px = x0 - cx;
    const py = y0 - cy;
    return px * px + py * py <= r * r;
  }
  // Project (cx,cy) onto the segment, clamped to [0,1].
  let t = ((cx - x0) * dx + (cy - y0) * dy) / lenSq;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const px = x0 + t * dx - cx;
  const py = y0 + t * dy - cy;
  return px * px + py * py <= r * r;
}
