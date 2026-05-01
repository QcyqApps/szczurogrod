// Pixi-backed canvas. Mount once per run, listens to pointer events for the
// crosshair, runs a RAF loop calling `tick()` then redrawing.
//
// Render layers (bottom → top):
//   1. stageBg          — pełnoekranowy Sprite tła zgodny z etapem
//                         (Bramy / Kanały / Podgrodzie)
//   2. enemySpriteLayer — one Sprite per enemy, pooled by entity id
//   3. enemyHpLayer     — single Graphics with all HP bars (cleared each frame)
//   4. projectileLayer  — Graphics for arc trails + bodies (cheap, ~10 max)
//   5. playerSprite     — single Sprite from the atlas, rotates based on cls
//   6. floatingTextLayer — Text objects for damage numbers
//   7. crosshairGfx     — pointer reticle
//
// Enemy art comes from `loadSpriteAtlas()` — pre-rasterized SVG textures. Hit
// flash is done with `tint = 0xff8080` instead of redrawing geometry.

import { useEffect, useRef } from 'react';
import {
  Application,
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
  Texture,
} from 'pixi.js';
import { tick } from '@/game/tick';
import { WORLD } from '@/game/balance';
import type { AppliedSkillsRuntime, RunState } from '@/game/types';
import type { StageDef } from '@grodno/shared/survivor';
import type { CharacterClass } from '@grodno/shared';
import { loadSpriteAtlas, type SpriteAtlas } from './sprites';

export interface PixiStageProps {
  state: RunState;
  skills: AppliedSkillsRuntime;
  stage: StageDef;
  characterClass: CharacterClass;
  onTick: () => void;
}

export function PixiStage({ state, skills, stage, characterClass, onTick }: PixiStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef(state);
  const skillsRef = useRef(skills);
  const stageRef = useRef(stage);
  const onTickRef = useRef(onTick);
  const classRef = useRef(characterClass);
  stateRef.current = state;
  skillsRef.current = skills;
  stageRef.current = stage;
  onTickRef.current = onTick;
  classRef.current = characterClass;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Fit a WORLD-aspect-ratio box inside the host's parent (whichever
    // dimension binds first). Recompute on container resize — phone-frame
    // can change height when the user toggles devtools, rotates, etc.
    const parent = host.parentElement;
    let ro: ResizeObserver | null = null;
    if (parent) {
      const fit = () => {
        const W = parent.clientWidth;
        const H = parent.clientHeight;
        if (W <= 0 || H <= 0) return;
        const aspect = WORLD.width / WORLD.height;
        let w = W;
        let h = W / aspect;
        if (h > H) {
          h = H;
          w = H * aspect;
        }
        host.style.width = `${Math.floor(w)}px`;
        host.style.height = `${Math.floor(h)}px`;
      };
      fit();
      ro = new ResizeObserver(fit);
      ro.observe(parent);
    }

    let destroyed = false;
    const app = new Application();

    void (async () => {
      await app.init({
        width: WORLD.width,
        height: WORLD.height,
        background: 0xf3ead9,
        antialias: true,
        resolution: window.devicePixelRatio,
        autoDensity: true,
      });
      if (destroyed) {
        app.destroy(true);
        return;
      }

      const atlas: SpriteAtlas = await loadSpriteAtlas();
      if (destroyed) {
        app.destroy(true);
        return;
      }

      host.appendChild(app.canvas);
      // Pixi v8 with autoDensity sets canvas.style.{width,height} to a fixed
      // px value matching the init w/h. We want the canvas to fill our host
      // div (which is ResizeObserver-sized to fit the available aspect-ratio
      // box), so override here. Pointer-event coord mapping in updateCrosshair
      // already uses getBoundingClientRect, so any CSS scaling Just Works.
      app.canvas.style.width = '100%';
      app.canvas.style.height = '100%';
      app.canvas.style.display = 'block';

      // ─── Layers ─────────────────────────────────────────────────────────
      // Stage-themed background: pełnoekranowy Sprite z atlasu, dobrany pod
      // stage.id. Fallback do stage 1 gdy nieznany id (robust po dodaniu
      // nowych stage'y bez tła w atlasie).
      const stageBgTex =
        atlas.stageBg[stageRef.current.id] ?? atlas.stageBg[1] ?? Texture.WHITE;
      const stageBg = new Sprite(stageBgTex);
      stageBg.width = WORLD.width;
      stageBg.height = WORLD.height;

      const enemySpriteLayer = new Container();
      const enemyHpLayer = new Graphics();
      const projectileLayer = new Graphics();
      const playerSprite = new Sprite(atlas.player[classRef.current]);
      playerSprite.anchor.set(0.5);
      // Scale so visual height ≈ 2.6 × playerRadius. Texture comes from a
      // 120-tall SVG so the natural size is right around 120px.
      {
        const targetH = WORLD.playerRadius * 2.6;
        const s = targetH / playerSprite.texture.height;
        playerSprite.scale.set(s);
      }

      const floatingTextLayer = new Container();
      const crosshairGfx = new Graphics();

      app.stage.addChild(stageBg);
      app.stage.addChild(enemySpriteLayer);
      app.stage.addChild(enemyHpLayer);
      app.stage.addChild(projectileLayer);
      app.stage.addChild(playerSprite);
      app.stage.addChild(floatingTextLayer);
      app.stage.addChild(crosshairGfx);

      const dmgTextStyle = new TextStyle({
        fontFamily: 'Luckiest Guy, sans-serif',
        fontSize: 18,
        fill: 0xfff0c8,
        stroke: { color: 0x2a1810, width: 3 },
      });
      const critTextStyle = new TextStyle({
        fontFamily: 'Luckiest Guy, sans-serif',
        fontSize: 22,
        fill: 0xffd76a,
        stroke: { color: 0x2a1810, width: 3 },
      });

      // Pool of sprites keyed by enemy id. We reuse Sprite objects across
      // frames — only create on first sight, free on death.
      const enemyPool = new Map<number, Sprite>();
      let lastClass: CharacterClass = classRef.current;

      // ─── Pointer ────────────────────────────────────────────────────────
      app.canvas.style.cursor = 'crosshair';
      app.canvas.style.touchAction = 'none';

      const updateCrosshair = (clientX: number, clientY: number) => {
        const rect = app.canvas.getBoundingClientRect();
        const sx = WORLD.width / rect.width;
        const sy = WORLD.height / rect.height;
        stateRef.current.crosshair.x = (clientX - rect.left) * sx;
        stateRef.current.crosshair.y = (clientY - rect.top) * sy;
      };

      const onMove = (ev: PointerEvent) => updateCrosshair(ev.clientX, ev.clientY);
      app.canvas.addEventListener('pointermove', onMove);
      app.canvas.addEventListener('pointerdown', onMove);

      // ─── Ticker ─────────────────────────────────────────────────────────
      let lastT = performance.now();
      app.ticker.add(() => {
        const now = performance.now();
        const dtMs = Math.min(50, now - lastT);
        lastT = now;
        const s = stateRef.current;
        tick(s, dtMs, { crosshair: s.crosshair }, stageRef.current, skillsRef.current);
        draw(s);
        onTickRef.current();
      });

      function draw(s: RunState) {
        // Player — keep texture in sync if class ref ever changes mid-run
        // (won't normally happen, but cheap to check).
        if (lastClass !== classRef.current) {
          lastClass = classRef.current;
          playerSprite.texture = atlas.player[classRef.current];
          const targetH = WORLD.playerRadius * 2.6;
          playerSprite.scale.set(targetH / playerSprite.texture.height);
        }
        playerSprite.x = s.player.pos.x;
        playerSprite.y = s.player.pos.y;
        // Subtle "cast bobble" — easing as cooldown approaches zero.
        const cdNorm = Math.max(0, Math.min(1, s.player.fireCooldownMs / 2000));
        playerSprite.rotation = (1 - cdNorm) * 0.04 - 0.02;

        // Enemies — pool sprites by id.
        const seen = new Set<number>();
        for (const e of s.enemies) {
          seen.add(e.id);
          let sp = enemyPool.get(e.id);
          if (!sp) {
            sp = new Sprite(atlas.enemy[e.kind] ?? Texture.WHITE);
            sp.anchor.set(0.5);
            const targetH = e.radius * 2.4;
            sp.scale.set(targetH / sp.texture.height);
            enemySpriteLayer.addChild(sp);
            enemyPool.set(e.id, sp);
          }
          sp.x = e.pos.x;
          sp.y = e.pos.y;
          // Hit flash via tint — cheaper than rebuilding geometry.
          sp.tint = e.hitFlashUntil > s.t ? 0xff8080 : 0xffffff;
        }
        // Free sprites for enemies that died this frame.
        for (const [id, sp] of enemyPool) {
          if (!seen.has(id)) {
            enemySpriteLayer.removeChild(sp);
            sp.destroy();
            enemyPool.delete(id);
          }
        }

        // HP bars — single Graphics, cleared per frame. Skip full-HP enemies.
        enemyHpLayer.clear();
        for (const e of s.enemies) {
          if (e.hp >= e.maxHp) continue;
          const hpFrac = Math.max(0, e.hp / e.maxHp);
          const w = e.radius * 2;
          const x = e.pos.x - e.radius;
          const y = e.pos.y - e.radius - 10;
          enemyHpLayer.rect(x, y, w, 4);
          enemyHpLayer.fill({ color: 0x2a1810, alpha: 0.45 });
          enemyHpLayer.rect(x, y, w * hpFrac, 4);
          enemyHpLayer.fill({ color: 0xc83232 });
        }

        // Projectiles — gravity-aware ghost trail so the arc reads visually
        // (each ghost is one of the past few frames' positions, reconstructed
        // by integrating backwards: pos -= vel*Δ + 0.5*g*Δ²). Hand-tuned to
        // match the parabolic motion in tick.ts.
        projectileLayer.clear();
        for (const p of s.projectiles) {
          for (let i = 1; i <= 3; i++) {
            const dt = i * 0.03; // 30 ms ghosts
            const tx = p.pos.x - p.vel.x * dt;
            const ty = p.pos.y - p.vel.y * dt + 0.5 * 1600 * dt * dt;
            projectileLayer.circle(tx, ty, 4 - i * 0.5);
            projectileLayer.fill({ color: 0xc39060, alpha: 0.45 - i * 0.12 });
          }
          projectileLayer.circle(p.pos.x, p.pos.y, 5);
          projectileLayer.fill({ color: 0xffd76a });
          projectileLayer.stroke({ color: 0x2a1810, width: 1.5 });
        }

        // Shards — żółto-pomarańczowe iskierki na krzywej toru. Trail z
        // aktualnej velocity (back-trail wzdłuż toru lotu, nie wektora do
        // celu — pokazuje rzeczywistą krzywą rozprysku).
        for (const sh of s.shards) {
          const vlen = Math.hypot(sh.vel.x, sh.vel.y);
          if (vlen > 0.001) {
            const ux = sh.vel.x / vlen;
            const uy = sh.vel.y / vlen;
            for (let i = 1; i <= 3; i++) {
              const back = i * 5;
              projectileLayer.circle(sh.pos.x - ux * back, sh.pos.y - uy * back, 2.6 - i * 0.55);
              projectileLayer.fill({ color: 0xffb060, alpha: 0.55 - i * 0.15 });
            }
          }
          projectileLayer.circle(sh.pos.x, sh.pos.y, 3.2);
          projectileLayer.fill({ color: 0xffd76a });
          projectileLayer.stroke({ color: 0x2a1810, width: 1 });
        }

        // Explosions — expanding ring with fading alpha. The damage already
        // landed in the tick; this is purely cosmetic.
        for (const ex of s.explosions) {
          const age = s.t - ex.spawnedAt;
          const k = Math.max(0, Math.min(1, age / ex.lifetimeMs));
          const r = ex.radius * (0.45 + 0.55 * k);
          const alpha = 1 - k;
          // Outer warm-orange ring
          projectileLayer.circle(ex.pos.x, ex.pos.y, r);
          projectileLayer.fill({ color: 0xffb060, alpha: 0.18 * alpha });
          projectileLayer.stroke({ color: 0xc83232, width: 3, alpha: 0.7 * alpha });
          // Bright inner flash
          projectileLayer.circle(ex.pos.x, ex.pos.y, r * 0.55);
          projectileLayer.fill({ color: 0xffd76a, alpha: 0.35 * alpha });
        }

        // Floating damage texts.
        floatingTextLayer.removeChildren();
        for (const ft of s.floatingTexts) {
          const age = s.t - ft.spawnedAt;
          const fade = 1 - Math.max(0, age - ft.lifetimeMs * 0.4) / (ft.lifetimeMs * 0.6);
          const isCrit = ft.color === 0xffd76a;
          const t = new Text({
            text: ft.text,
            style: isCrit ? critTextStyle : dmgTextStyle,
          });
          t.anchor.set(0.5, 0.5);
          t.x = ft.pos.x;
          t.y = ft.pos.y;
          t.alpha = Math.max(0, Math.min(1, fade));
          floatingTextLayer.addChild(t);
        }

        // Crosshair.
        crosshairGfx.clear();
        const cx = s.crosshair.x;
        const cy = s.crosshair.y;
        crosshairGfx.circle(cx, cy, 14);
        crosshairGfx.stroke({ color: 0xc83232, width: 2, alpha: 0.7 });
        crosshairGfx.moveTo(cx - 18, cy);
        crosshairGfx.lineTo(cx - 6, cy);
        crosshairGfx.moveTo(cx + 6, cy);
        crosshairGfx.lineTo(cx + 18, cy);
        crosshairGfx.moveTo(cx, cy - 18);
        crosshairGfx.lineTo(cx, cy - 6);
        crosshairGfx.moveTo(cx, cy + 6);
        crosshairGfx.lineTo(cx, cy + 18);
        crosshairGfx.stroke({ color: 0xc83232, width: 2, alpha: 0.7 });
      }

      (host as HTMLDivElement & { __destroy?: () => void }).__destroy = () => {
        app.canvas.removeEventListener('pointermove', onMove);
        app.canvas.removeEventListener('pointerdown', onMove);
        for (const sp of enemyPool.values()) sp.destroy();
        enemyPool.clear();
        app.destroy(true);
      };
    })();

    return () => {
      destroyed = true;
      ro?.disconnect();
      const h = host as HTMLDivElement & { __destroy?: () => void };
      h.__destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={hostRef}
      style={{
        // Width / height are set by the ResizeObserver in the effect — we
        // just need a non-zero starting box so the observer kicks in.
        border: '3px solid var(--ink-dark)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '3px 3px 0 var(--ink-dark)',
        background: '#f3ead9',
      }}
    />
  );
}
