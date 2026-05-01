// Balance constants for the survivor run loop. M2 = single tier (rat_walker)
// + boss arrives but isn't killable yet. M3 expands enemy roster + per-stage
// boss roster.

import type { EnemyKind } from '@grodno/shared/survivor';

export const WORLD = {
  width: 800,
  height: 450,
  playerX: 60,
  playerY: 225,
  playerRadius: 18,
  /** Safe area Y na górze i dole mapy gdzie regular spawnery NIE generują
   * wrogów. Wcześniej rat'y respowały na samym brzegu i ich sprite (rasterized
   * z radius * 2.4 wysokości — np. sewer_worm ~86px) wystawał poza widoczny
   * canvas. 40px daje komfort nawet dla większych mob'ów. Boss ignoruje
   * margines (spawnuje w center y), bo to single entity i tak wycentrowany
   * dla efektu intro. */
  spawnYMargin: 40,
} as const;

/** Parabolic "lobbed bomb" projectile. Flies from player to the crosshair
 * position captured at fire-time along a gravity arc, then detonates as an
 * AOE on arrival. No mid-flight collisions — the projectile passes *over*
 * intervening enemies (high arc reads visually as a lob, not a piercing
 * shot), and the whole damage budget lands on the explosion at `targetAt`.
 *
 * Flight time is **distance-based**: close shots get a short flight (small
 * arc), far shots a longer one (high lob). Wcześniej stałe 850ms sprawiało,
 * że strzał z 50px miał ten sam ~145px szczyt łuku co strzał z 700px —
 * pocisk leciał głównie w górę zamiast w cel, point-blank trafienia były
 * niemal niemożliwe. `proj_speed` skill obniża wynik (szybszy lob).
 * Closed-form solver in `projectile.ts` returns the launch velocity such
 * that pos(flightTime) == targetAt under constant gravity. */
export const PROJECTILE = {
  /** Base damage per projectile detonation. Tuned tak żeby:
   * - 1× rat_walker (30 HP) padał w 2 strzałach na bazie, 1-szot przy
   *   `dmg` lvl 2 (22 × 1.44 = 31.7).
   * - rat_fast/rat_ranged (22 HP) padały w 1 strzale od bazy.
   * - rat_tank (90 HP) potrzebował 5 strzałów na bazie, 3 przy `dmg` lvl 5.
   * Boss timing: rat_king 380 HP / 22 dmg = 17 strzałów * 1.4s = 24s czysty
   * solo TTK na bazie (akceptowalny first-attempt clear). */
  baseDamage: 22,
  /** Px/s² downward acceleration. World y-axis is "down positive". */
  gravity: 1600,
  /** Stosunek szczytu łuku do horyzontalnej odległości celu. 0.3 = pocisk
   * dla strzału na 200px wznosi się ~60px nad start. */
  arcRatio: 0.3,
  /** Floor szczytu łuku — nawet point-blank shot ma widoczny lob, nie strzał
   * po linii prostej. */
  minArcPeakPx: 14,
  /** Cap szczytu łuku — strzał na drugi koniec mapy nie wzlatuje przez pół
   * ekranu. */
  maxArcPeakPx: 160,
  /** Floor czasu lotu po skill mult — pocisk pozostaje czytelny na ekranie. */
  minFlightTimeMs: 150,
  /** AOE radius at level-0 splash skill. 40px daje średnicę 80, dwukrotność
   * radiusa rat_walker (16) — czyli jeden strzał wycelowany w gęsty cluster
   * łapie 2-3 wrogów. Splash skill rośnie do 128px na max (czterokrotnie
   * większa powierzchnia). */
  baseExplosionRadius: 40,
  /** Visual radius of the projectile body itself (for the trail). */
  baseRadius: 5,
} as const;

/** Odłamki — wtórne pociski wystrzeliwane z eksplozji. Trajektoria z arc'iem:
 * inicjalna velocity z bocznym push'em (offset kątowy w wachlarzu wokół
 * kierunku do celu, każdy odłamek ma inny → rozchodzą się różnie), lekka
 * grawitacja `gravityY`, plus homing acceleration zakrzywia tor w stronę
 * moba. Bez homing'u byłoby strzelnicze; z homing'iem pewne trafienie ale
 * nadal efektowny rozprysk. */
export const SHARD = {
  /** Multiplier obrażeń odłamka względem damage głównego pocisku. */
  damageMult: 0.4,
  /** Px/s — początkowa prędkość. Wystarczająco szybko żeby trafić cel
   * w ~0.5-0.8s, ale na tyle wolno żeby krzywa była widoczna. */
  speed: 380,
  /** Px/s — siła homing'u (acceleration toward target direction). Wyższa
   * wartość = ciaśniejsza krzywa. Bumped 1400→2600 bo wcześniej odłamki
   * po wachlarzu spread'u nie nadążały zakrzywić toru i target uciekał za
   * TTL — graczowi czytało się to jako "leci losowo i znika". */
  homingAccel: 2600,
  /** Px/s² — grawitacja. Niższa niż projectile (1600) bo odłamki nie mają
   * lobować, mają subtle ciążyć w dół podczas lotu. Reduced 600→200 bo przy
   * 1s TTL i krótkich dystansach drag w dół przesuwał shard pod monstera. */
  gravityY: 200,
  /** Stopnie — szerokość wachlarza inicjalnej velocity wokół kierunku do
   * celu. Im więcej odłamków tym szerszy spread (tworzy efekt eksplozji).
   * Reduced 70→40 bo szeroki rozrzut + słaby homing dawał "leci w bok i
   * znika". 40° wciąż daje czytelny fan (3 odłamki = ±20°). */
  spreadDeg: 40,
  /** Max promień szukania celu od epicentrum eksplozji. */
  targetSearchRadius: 280,
  /** Failsafe — odłamek nie poluje wiecznie gdy cel ucieknie. Bumped
   * 1000→1400 razem z retargetingiem — czas na znalezienie nowego celu
   * gdy oryginalny zginie od wcześniejszego shard'a. */
  ttlMs: 1400,
  /** Px — kolizja z celem gdy dist <= targetEnemy.radius + this. Bumped
   * 4→8 bo szybsze odłamki czasem tunelowały przez wroga między klatkami. */
  hitPaddingPx: 8,
  /** Multiplier max prędkości względem `speed`. Cap zapobiega rozpędzeniu
   * homing accelem do absurdu. Bumped 1.6→2.2 żeby shard mógł nadrobić
   * po overshoocie i nie pętlował się wokół moba w nieskończoność. */
  maxSpeedMult: 2.2,
  /** Visual radius. */
  visualRadius: 3,
} as const;

/** Knockback — push-back wroga przy trafieniu (skill `knockback`). Stała
 * prędkość w +x (od gracza) na fixed duration, niezależna od baseSpeed wroga
 * — tank dostaje ten sam jolt co fast, co czyta się jako "uderzenie odepchnęło"
 * a nie "zwolniło proporcjonalnie". Bossy ignorują flag (decyzja w applyDamage). */
export const KNOCKBACK = {
  /** Px/s — prędkość odpychania. */
  speed: 240,
  /** Ms — jak długo knockback trwa po trafieniu. 180ms × 240px/s = ~43px push,
   * dwa razy radius rat_walker'a = czytelny. Dłuższy duration robiłby że
   * spamowane hity trzymałyby moba w miejscu na zawsze. */
  durationMs: 180,
} as const;

export const PLAYER = {
  baseMaxHp: 100,
  /** Czas między strzałami na zerze fire_rate. 1400ms = 0.71 strzał/s.
   * Z 22 base dmg + częstym splash trafiającym 2 wrogów, fresh player
   * utrzymuje ~1 kill/s — szybciej niż stage 1 spawn rate (0.7/s), więc
   * pierwszy run jest do wygrania bez skilli. Skill `fire_rate` obniża
   * 200ms/lvl: 1400 → 1200 → 1000 → 800 → 600 → 400 (floor). Max poziom
   * przyspiesza do 2.5 strzał/s — feel survivora, nie powolnego turret'a.
   * Wcześniej baseline 2000ms był za wolny: gracz przegrywał wyścig ze
   * spawn rate'em bo TTK rat_walker'a (~4s) > spawn interval (1.66s). */
  baseFireCooldownMs: 1400,
  minFireCooldownMs: 400,
} as const;

export interface EnemyKindStats {
  readonly maxHp: number;
  readonly speed: number;
  readonly radius: number;
  readonly contactDamage: number;
  /** Visual-only — render uses this to tint the sprite. */
  readonly tintHex: number;
}

// HP/contact tuning notes:
// - rat_walker (basic): 30 HP daje 2-shot na bazie, 1-shot od `dmg` lvl 2.
//   Contact 10 — fresh-player przeżywa 10 kontaktów (HP 100), wystarczająco
//   na nieostry aiming na pierwszym runie.
// - rat_fast: 22 HP — 1-shot od bazy, ale szybki, więc trzeba reagować.
// - rat_tank: 90 HP — 5-shot na bazie, 3-shot na max dmg. Soak dla AOE.
// - rat_ranged: 22 HP — squishy, ale trzymany w głębi bo pociski ranged.
// - rat_king (boss S1): 280 HP → 13-shot * 1.4s = 18s czysty TTK. Razem z
//   rats w boss-fight'cie split-fire scenariusz: 12 shots na bossa + 6 na
//   rats = ~25s total fight. Z drainem 0.7 i ~30 HP zapasu fresh-gracz
//   przeżywa.
// - sewer_worm (boss S2): 720 HP → 33-shot. Wymaga już skilla na dmg lub
//   fire_rate.
// - lich_szczur (boss S3): 1050 HP → 48-shot. Endgame fight.
export const ENEMY_STATS: Record<EnemyKind, EnemyKindStats> = {
  rat_walker: { maxHp: 30, speed: 50, radius: 16, contactDamage: 10, tintHex: 0x4a8a3a },
  rat_fast: { maxHp: 22, speed: 95, radius: 14, contactDamage: 8, tintHex: 0x6a5a3a },
  rat_tank: { maxHp: 90, speed: 32, radius: 22, contactDamage: 18, tintHex: 0x3a5a2a },
  rat_ranged: { maxHp: 22, speed: 42, radius: 14, contactDamage: 8, tintHex: 0xcfd1d0 },
  sewer_worm: { maxHp: 720, speed: 38, radius: 36, contactDamage: 22, tintHex: 0x5aac4a },
  lich_szczur: { maxHp: 1050, speed: 48, radius: 32, contactDamage: 26, tintHex: 0x6a4a8a },
  rat_king: { maxHp: 280, speed: 30, radius: 30, contactDamage: 22, tintHex: 0xc83232 },
} as const;

/** Hard ceiling so the screen doesn't get unmanageable on slow devices. */
export const BASE_MAX_ENEMIES_ON_SCREEN = 30;
