import { useEffect, useState, type CSSProperties } from 'react';
import { GameIcon } from '@/components/game-icons';
import {
  IcoClock,
  IcoCoin,
  IcoGem,
  IcoHourglass,
  IcoKey,
  IcoPaw,
  IcoRefresh,
} from '@/components/icons';
import { Monster, monsterBySlug } from '@/components/monsters';
import type { MonsterRecipe, MonsterSlug, MonsterTier } from '@/components/monsters';
import { GemSinkButton, HelpIcon } from '@/components/ui-common';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { useT, tStatic, useContentT, type DictKey } from '@/i18n';
import {
  GEM_SINK_COSTS,
  type Character,
  type CombatState,
  type EnemyAbility,
  type Track,
} from '@grodno/shared';
import { TRPCClientError } from '@trpc/client';
import { CombatView } from './CombatView';
import { dungeonEnemyToCombatInfo } from './combat-enemy';

// Style + polish labels dla ability pips — tło w tonacji "co to robi" (fiolet
// = magia, zielony = trucizna, czerwony = pierce). Tooltip objaśnia proc.
const ABILITY_PIP_STYLE: Record<EnemyAbility['kind'], CSSProperties> = {
  magic: { background: '#8a3a8a', color: '#fff', fontWeight: 700 },
  poison: { background: '#4a7c3a', color: '#fff', fontWeight: 700 },
  armor_pierce: { background: '#c83232', color: '#fff', fontWeight: 700 },
};
function abilityLabel(kind: EnemyAbility['kind']): string {
  if (kind === 'magic') return tStatic('dungeon.ability.magic');
  if (kind === 'poison') return tStatic('dungeon.ability.poison');
  return tStatic('dungeon.ability.armor_pierce');
}
function abilityTooltip(ab: EnemyAbility): string {
  const pct = String(Math.round(ab.chance * 100));
  if (ab.kind === 'magic') return tStatic('dungeon.ability.tooltip.magic').replace('{pct}', pct);
  if (ab.kind === 'poison')
    return tStatic('dungeon.ability.tooltip.poison')
      .replace('{pct}', pct)
      .replace('{dmg}', String(ab.dmgPerTurn))
      .replace('{turns}', String(ab.turns));
  return tStatic('dungeon.ability.tooltip.armor_pierce').replace('{pct}', pct);
}

/** Per-mob server state — kill counter + cooldown expiry + procowe abilities. */
interface EnemyGate {
  killsToday: number;
  dailyLimit: number;
  cooldownSec: number;
  nextAvailableAt: number | null;
  abilities: readonly EnemyAbility[];
  /** Chain unlock w obrębie lochu — `false` gdy poprzednik nie ubity. */
  unlockedInChain: boolean;
  /** Tekst tooltipa gdy `unlockedInChain=false`. */
  chainReason: string | null;
}

export interface DungeonEnemy {
  slug: MonsterSlug;
  lvl: number;
  hp: number;
  atk: number;
  gold: number;
  xp: number;
  flavor: string;
  name: string;
  tier: MonsterTier | 'normal';
  recipe: MonsterRecipe;
  requiredLvl: number;
}

// Slugs whose intro flavor we keep locally — server delivers stats; only the
// one-liner („*piszczy*") is client text and lives in i18n dict as
// `dungeon.enemy.flavor.<slug>`.
const FLAVORED_SLUGS = [
  'goblin-scav',
  'rat-giant',
  'slime-green',
  'kobold-thief',
  'goblin-warrior',
  'cave-spider',
  'skeleton-soldier',
  'bat-dire',
  'troll-cave',
  'demon-imp',
  'ogre-brute',
  'skeleton-captain',
  'goblin-shaman',
  'minotaur',
  'slime-shadow',
  'wraith',
  'hobgoblin-king',
  'bone-dragon',
  'void-horror',
] as const;

export interface ScreenDungeonProps {
  char: Character;
  onBack: () => void;
  onReward: () => void;
  onLevelUp?: (info: import('@grodno/shared').LevelUpInfo) => void;
  /** Gdy podany, widok ograniczony do mobów tego lochu + bossa. */
  dungeonSlug?: string;
  /** Nazwa lochu wyświetlana w nagłówku. Fallback: "Loch Zapomnienia" gdy brak. */
  dungeonName?: string;
  /** Flavor/desc lochu wyświetlany pod nagłówkiem. */
  dungeonDesc?: string;
  /** Callback do App.tsx — true gdy wchodzimy w walkę, false przy wyjściu. */
  onCombatStateChange?: (inCombat: boolean) => void;
}

export function ScreenDungeon({
  char,
  onBack,
  onReward,
  onLevelUp,
  dungeonSlug,
  dungeonName,
  dungeonDesc,
  onCombatStateChange,
}: ScreenDungeonProps) {
  const t = useT();
  const tc = useContentT();
  const [activeCombat, setActiveCombat] = useState<{
    state: CombatState;
    enemy: DungeonEnemy;
  } | null>(null);

  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  // Onsuccess → me.get invalidate, żeby topbar od razu pokazał zdjęty klucz
  // (serwer zawsze deductuje na engage, ale bez tego query pokazywał stare
  // saldo aż do końca walki).
  const engageMut = trpc.combat.engage.useMutation({
    onSuccess: () => {
      void utils.me.get.invalidate();
    },
  });
  const endMut = trpc.combat.end.useMutation();
  const buyKeyMut = trpc.combat.buyExtraKey.useMutation({
    onSuccess: () => {
      pushToast({ text: tStatic('dungeon.toast.keyBought'), accent: '#2a4a3a' });
      void utils.me.get.invalidate();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : tStatic('toast.failed'),
        accent: '#c83232',
      });
    },
  });
  const resetDailyMobsMut = trpc.combat.resetDailyMobs.useMutation({
    onSuccess: () => {
      pushToast({ text: tStatic('dungeon.toast.dailyReset'), accent: '#2a4a3a' });
      void utils.combat.enemies.invalidate();
      void utils.me.get.invalidate();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : tStatic('toast.failed'),
        accent: '#c83232',
      });
    },
  });
  const skipCooldownMut = trpc.combat.skipBossCooldown.useMutation({
    onSuccess: () => {
      pushToast({ text: tStatic('dungeon.toast.cooldownSkipped'), accent: '#2a4a3a' });
      void utils.combat.enemies.invalidate();
      void utils.me.get.invalidate();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : tStatic('toast.failed'),
        accent: '#c83232',
      });
    },
  });

  // Notyfikuj App.tsx o stanie walki — decyduje czy TabBar ma być widoczny.
  useEffect(() => {
    onCombatStateChange?.(activeCombat !== null);
  }, [activeCombat, onCombatStateChange]);
  // Per-mob kill counter + cooldown. Refetched when leaving combat so the grid
  // shows fresh state immediately after a victory. Gdy dungeonSlug podany —
  // filtrowanie po stronie serwera do mobów tego konkretnego lochu + bossa.
  const enemiesQuery = trpc.combat.enemies.useQuery(
    dungeonSlug ? { dungeonSlug } : undefined,
  );
  // Aktywne tropy — per-slot mob + TTL. Refetch po engage/reroll/leaveCombat.
  const tracksQuery = trpc.tracks.list.useQuery();
  const rerollMut = trpc.tracks.reroll.useMutation({
    onSuccess: () => {
      void utils.tracks.list.invalidate();
      void utils.me.get.invalidate();
    },
  });
  const tracks: readonly Track[] = tracksQuery.data?.tracks ?? [];
  const rerollCost = tracksQuery.data?.rerollCost ?? 10;
  const slotsMax = tracksQuery.data?.slotsMax ?? 3;
  const nextRollAt = tracksQuery.data?.nextRollAt ?? null;
  const trackedSlugs = new Set(tracks.map((t) => t.enemySlug));
  const gates = new Map<string, EnemyGate>(
    (enemiesQuery.data ?? []).map((e) => [
      e.slug,
      {
        killsToday: e.killsToday,
        dailyLimit: e.dailyLimit,
        cooldownSec: e.cooldownSec,
        nextAvailableAt: e.nextAvailableAt,
        abilities: e.abilities,
        unlockedInChain: e.unlockedInChain ?? true,
        chainReason: e.chainReason ?? null,
      },
    ]),
  );
  // Tick the clock every 500ms while any cooldown is running OR while the
  // keys pool isn't full OR while a track slot is awaiting auto-roll.
  const [now, setNow] = useState(Date.now());
  const anyCooldownActive = [...gates.values()].some(
    (g) => g.nextAvailableAt !== null && g.nextAvailableAt > now,
  );
  const hasAnyDailyMaxed = [...gates.values()].some(
    (g) => g.killsToday >= g.dailyLimit && g.dailyLimit > 0,
  );
  const keysRegenerating = char.dungeonKeys < char.dungeonKeysMax;
  const tracksRegenerating = nextRollAt !== null;
  const needTicker = anyCooldownActive || keysRegenerating || tracksRegenerating;
  useEffect(() => {
    if (!needTicker) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [needTicker]);

  // When the keys countdown lands on zero, refetch me.get so the UI picks up
  // the freshly-regenerated key. Client mirrors of KEY_REGEN_MS from server.
  useEffect(() => {
    if (!keysRegenerating) return;
    const KEY_REGEN_MS_CLIENT = 15 * 60 * 1000;
    const msUntilNextKey = Math.max(
      0,
      KEY_REGEN_MS_CLIENT - (Date.now() - char.lastKeyTickAt),
    );
    const t = setTimeout(() => {
      void utils.me.get.invalidate();
    }, msUntilNextKey + 100);
    return () => clearTimeout(t);
  }, [char.lastKeyTickAt, char.dungeonKeys, keysRegenerating, utils]);

  // Same deal for trop auto-roll: when countdown hits zero, invalidate both
  // me.get (server advances lastTrackRollAt there) and tracks.list so the new
  // slot shows up immediately without a page refresh.
  useEffect(() => {
    if (nextRollAt === null) return;
    const msUntil = Math.max(0, nextRollAt - Date.now());
    const t = setTimeout(() => {
      void utils.me.get.invalidate();
      void utils.tracks.list.invalidate();
    }, msUntil + 100);
    return () => clearTimeout(t);
  }, [nextRollAt, utils]);

  // Server (`combat.enemies`) is source of truth for stats — balance passes
  // (HP bumps etc.) land in DB and we want the dungeon list to read them fresh
  // without redeploy. Flavor one-liners live in i18n dict (PL/EN); slug→recipe
  // mapping lives in `monsters/recipes.ts`.
  const flavorBySlug = new Map<string, string>(
    FLAVORED_SLUGS.map((slug) => [slug, t(`dungeon.enemy.flavor.${slug}` as DictKey)]),
  );
  const enriched: DungeonEnemy[] = (enemiesQuery.data ?? []).map((server) => {
    const rec = monsterBySlug(server.slug as MonsterSlug);
    return {
      slug: server.slug as MonsterSlug,
      lvl: server.lvl,
      hp: server.hp,
      atk: server.atk,
      gold: server.gold,
      xp: server.xp,
      requiredLvl: server.requiredLvl,
      flavor: flavorBySlug.get(server.slug as MonsterSlug) ?? '',
      name: rec.name,
      tier: rec.tier ?? 'normal',
      recipe: rec,
    };
  });

  async function startCombat(enemy: DungeonEnemy) {
    try {
      const state = await engageMut.mutateAsync({ enemySlug: enemy.slug });
      setActiveCombat({ state, enemy });
    } catch (e) {
      console.error('combat.engage failed', e);
    }
  }

  async function leaveCombat() {
    const combatId = activeCombat?.state.combatId;
    setActiveCombat(null);
    if (combatId) {
      try {
        await endMut.mutateAsync({ combatId });
      } catch (e) {
        console.warn('combat.end failed', e);
      }
    }
    void utils.me.get.invalidate();
    // Refresh kill counters + cooldown timers — a victory bumps both.
    void utils.combat.enemies.invalidate();
    // Track slot was consumed on engage — refresh so UI shows the gap.
    void utils.tracks.list.invalidate();
    onReward();
  }

  if (activeCombat) {
    return (
      <CombatView
        char={char}
        enemy={dungeonEnemyToCombatInfo(activeCombat.enemy)}
        initialState={activeCombat.state}
        onBack={leaveCombat}
        onLevelUp={onLevelUp}
      />
    );
  }

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div
        className="panel"
        style={{
          padding: 12,
          marginBottom: 12,
          background: 'linear-gradient(180deg, #4a2a3a 0%, #2a1a2a 100%)',
        }}
      >
        <div className="h-display" style={{ fontSize: 22, textAlign: 'center' }}>
          {tc.dungeonName(dungeonSlug, dungeonName ?? t('dungeon.fallback.name')).toUpperCase()}
        </div>
        <div
          style={{
            color: '#f3ead9',
            fontSize: 14,
            textAlign: 'center',
            marginTop: 2,
            opacity: 0.85,
          }}
        >
          {tc.dungeonDesc(dungeonSlug, dungeonDesc ?? t('dungeon.fallback.desc'))}
        </div>
      </div>
      {(() => {
        // Keys HUD — counter + live countdown to next key. Mirror KEY_REGEN_MS
        // from apps/server/src/game/dungeon-keys.ts. Keep in sync.
        const KEY_REGEN_MS_CLIENT = 15 * 60 * 1000;
        const untilNextMs =
          char.dungeonKeys >= char.dungeonKeysMax
            ? null
            : Math.max(
                0,
                KEY_REGEN_MS_CLIENT - (now - char.lastKeyTickAt),
              );
        const mm = untilNextMs !== null ? Math.floor(untilNextMs / 60_000) : 0;
        const ss = untilNextMs !== null ? Math.floor((untilNextMs % 60_000) / 1000) : 0;
        return (
          <div
            className="panel"
            style={{
              padding: 10,
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: char.dungeonKeys === 0 ? '#f5d4d4' : '#fff7e0',
              border: char.dungeonKeys === 0 ? '2.5px solid #c83232' : '2.5px solid #2a1810',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#f3d886',
                border: '2.5px solid #2a1810',
                boxShadow: '1.5px 1.5px 0 #2a1810',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 0,
              }}
              aria-hidden
            >
              <IcoKey s={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="h-title"
                style={{ fontSize: 14, color: char.dungeonKeys === 0 ? '#5a1818' : '#2a1810' }}
              >
                {t('dungeon.keys.label')
                  .replace('{n}', String(char.dungeonKeys))
                  .replace('{max}', String(char.dungeonKeysMax))}
              </div>
              <div style={{ fontSize: 14, color: '#5a3a2a', marginTop: 2 }}>
                {untilNextMs === null
                  ? t('dungeon.keys.full')
                  : t('dungeon.keys.next').replace(
                      '{time}',
                      `${mm}:${String(ss).padStart(2, '0')}`,
                    )}
              </div>
            </div>
            <GemSinkButton
              label={t('dungeon.keys.buy')}
              cost={GEM_SINK_COSTS.extraKey}
              playerGems={char.gems}
              pending={buyKeyMut.isPending}
              onClick={() => buyKeyMut.mutate()}
              disabledReason={t('dungeon.keys.buy.reason')}
            />
          </div>
        );
      })()}

      {hasAnyDailyMaxed && (
        <div
          className="panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 10,
            marginBottom: 10,
            background: '#fce8c8',
          }}
        >
          <div style={{ flex: 1 }}>
            <div className="h-title" style={{ fontSize: 13, color: '#5a3a2a' }}>
              {t('dungeon.dailyMaxed.title')}
            </div>
            <div className="flavor" style={{ fontSize: 14, color: '#7a4a2a', marginTop: 2 }}>
              {t('dungeon.dailyMaxed.body')}
            </div>
          </div>
          <GemSinkButton
            label={t('dungeon.dailyMaxed.reset')}
            cost={GEM_SINK_COSTS.resetDailyMobs}
            playerGems={char.gems}
            pending={resetDailyMobsMut.isPending}
            onClick={() => resetDailyMobsMut.mutate()}
            disabledReason={t('dungeon.dailyMaxed.reset.reason')}
          />
        </div>
      )}

      {/* TROPY — 3 sloty aktywnych tropów. Klik 'reroll' wydaje gemy. */}
      {(() => {
        const slots: Array<Track | null> = Array.from({ length: slotsMax }, (_, i) => {
          return tracks.find((t) => t.slot === i) ?? null;
        });
        return (
          <div
            className="panel"
            style={{
              padding: 10,
              marginBottom: 10,
              background: '#fff7e0',
              color: '#2a1810',
            }}
          >
            <div
              className="h-title"
              style={{
                fontSize: 13,
                color: '#2a1810',
                marginBottom: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <IcoPaw s={16} /> {t('dungeon.tracks.title')}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${slotsMax}, 1fr)`,
                gap: 6,
              }}
            >
              {slots.map((trop, i) => {
                if (!trop) {
                  return (
                    <div
                      key={i}
                      style={{
                        background: '#e8dcb9',
                        border: '2px dashed #8a6a4a',
                        borderRadius: 8,
                        padding: 8,
                        textAlign: 'center',
                        fontSize: 13,
                        color: '#5a3a2a',
                        minHeight: 86,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{t('dungeon.tracks.empty')}</div>
                      <button
                        type="button"
                        className="cbtn sm"
                        disabled={char.gems < rerollCost || rerollMut.isPending}
                        onClick={() => void rerollMut.mutateAsync({ slot: i })}
                        style={{
                          fontSize: 10,
                          padding: '3px 6px',
                          background: '#a0d8f0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <IcoGem s={10} /> {rerollCost}
                      </button>
                    </div>
                  );
                }
                const rec = monsterBySlug(trop.enemySlug as MonsterSlug);
                const ttlMin = Math.max(0, (trop.expiresAt - now) / 60000);
                const ttlH = Math.floor(ttlMin / 60);
                const ttlM = Math.floor(ttlMin % 60);
                const ttlLabel = ttlH > 0 ? `${ttlH}h ${ttlM}m` : `${ttlM}m`;
                const nearExpiry = ttlMin < 15;
                return (
                  <div
                    key={i}
                    style={{
                      background: '#fffdf0',
                      border: `2.5px solid ${nearExpiry ? '#c83232' : '#2a1810'}`,
                      borderRadius: 8,
                      padding: 6,
                      minHeight: 86,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                      position: 'relative',
                      color: '#2a1810',
                      boxShadow: '2px 2px 0 #2a1810',
                    }}
                  >
                    <div style={{ width: 38, height: 38, lineHeight: 0 }}>
                      <Monster recipe={rec} size={38} />
                    </div>
                    <div
                      className="h-title"
                      style={{
                        fontSize: 10,
                        lineHeight: 1.1,
                        textAlign: 'center',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={trop.enemyName}
                    >
                      {trop.enemyName}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: nearExpiry ? '#8a1e1e' : '#5a3a2a',
                        fontFamily: 'JetBrains Mono, monospace',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <IcoHourglass s={10} /> {ttlLabel}
                    </div>
                    <button
                      type="button"
                      disabled={char.gems < rerollCost || rerollMut.isPending}
                      onClick={() => void rerollMut.mutateAsync({ slot: i })}
                      title={t('dungeon.tracks.reroll.title').replace('{n}', String(rerollCost))}
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        background: '#a0d8f0',
                        border: '2px solid #2a1810',
                        borderRadius: 999,
                        fontSize: 9,
                        padding: '1px 5px',
                        cursor:
                          char.gems < rerollCost || rerollMut.isPending
                            ? 'not-allowed'
                            : 'pointer',
                        opacity: char.gems < rerollCost ? 0.5 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2,
                        lineHeight: 1,
                      }}
                    >
                      <IcoRefresh s={10} />
                      <IcoGem s={9} />
                      {rerollCost}
                    </button>
                  </div>
                );
              })}
            </div>
            {tracks.length < slotsMax && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: '#5a3a2a',
                  lineHeight: 1.35,
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                {t('dungeon.tracks.fillIn')}
                {nextRollAt !== null && (() => {
                  const msLeft = Math.max(0, nextRollAt - now);
                  const totalSec = Math.ceil(msLeft / 1000);
                  const mm = Math.floor(totalSec / 60);
                  const ss = totalSec % 60;
                  const label =
                    mm > 0 ? `${mm}:${String(ss).padStart(2, '0')}` : `${ss}s`;
                  return (
                    <span
                      style={{
                        fontStyle: 'normal',
                        fontFamily: 'Luckiest Guy, sans-serif',
                        letterSpacing: 0.3,
                        color: '#2a1810',
                      }}
                    >
                      {t('dungeon.tracks.in')} <IcoClock s={10} /> {label}
                    </span>
                  );
                })()}
                {t('dungeon.tracks.fillIn.reroll')}<IcoGem s={10} /> {rerollCost}{t('dungeon.tracks.fillIn.suffix')}
              </div>
            )}
          </div>
        );
      })()}

      {/* Mirrors HP_ENGAGE_MIN in apps/server/src/routers/combat.ts. Keep in sync. */}
      {char.hp < 20 && (
        <div
          className="panel"
          style={{
            padding: 10,
            marginBottom: 10,
            background: '#f5d4d4',
            border: '2.5px solid #c83232',
            color: '#5a1818',
            fontSize: 12,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          {t('dungeon.lowHp')}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {enriched
          .filter((e) =>
            // W trybie "konkretny loch" pokazuj WSZYSTKIE moby lochu (wyższy
            // LVL i tak będzie zablokowany w UI). Flat-view filtruje +2 żeby
            // nie spoilować endgame przy pierwszym wejściu.
            dungeonSlug ? true : e.requiredLvl <= char.lvl + 2,
          )
          .map((e) => {
          const tierColor =
            e.tier === 'boss' ? '#c83232' : e.tier === 'elite' ? '#8a3a8a' : '#2a4a3a';
          const levelLocked = e.requiredLvl > char.lvl;
          const hpLocked = char.hp < 20;
          const noKeys = char.dungeonKeys < 1;
          const gate = gates.get(e.slug);
          const cooldownMs =
            gate?.nextAvailableAt !== null && gate?.nextAvailableAt !== undefined
              ? Math.max(0, gate.nextAvailableAt - now)
              : 0;
          const onCooldown = cooldownMs > 0;
          const dailyMaxed = gate ? gate.killsToday >= gate.dailyLimit : false;
          const chainLocked = gate ? !gate.unlockedInChain : false;
          const locked =
            levelLocked || hpLocked || noKeys || onCooldown || dailyMaxed || chainLocked;
          // "Cooldown-only" = mob jest niedostępny WYŁĄCZNIE dlatego że
          // odpoczywa po ostatnim ubiciu. Odróżniamy tę sytuację wizualnie od
          // twardego locka (LVL / limit dzienny) — tu gracz ma tylko poczekać
          // kilka-kilkanaście sekund, nie levelować czy czekać do północy.
          const cooldownOnly =
            onCooldown && !levelLocked && !hpLocked && !noKeys && !dailyMaxed;
          // Ładny format czasu: 45s / 2m 10s / 5m / 1h 2m
          const cooldownSec = Math.ceil(cooldownMs / 1000);
          const cooldownLabel =
            cooldownSec < 60
              ? `${cooldownSec}s`
              : cooldownSec < 3600
                ? `${Math.floor(cooldownSec / 60)}m ${cooldownSec % 60 < 10 ? '0' : ''}${cooldownSec % 60}s`
                : `${Math.floor(cooldownSec / 3600)}h ${Math.floor((cooldownSec % 3600) / 60)}m`;
          return (
            <div
              key={e.slug}
              className={locked ? 'panel' : 'panel clickable'}
              onClick={() => !locked && startCombat(e)}
              style={{
                padding: 8,
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                // Cooldown to tylko chwilowa przerwa — mniej agresywne
                // przyciemnienie niż dla hard-locków. Plus lekki niebieski
                // tint tła, żeby od razu było widać że to stan czekania.
                opacity: cooldownOnly ? 0.85 : locked ? 0.55 : 1,
                background: cooldownOnly ? '#e4ecf4' : undefined,
                cursor: locked ? 'not-allowed' : 'pointer',
                position: 'relative',
              }}
              title={
                chainLocked
                  ? (gate?.chainReason ?? t('dungeon.lock.chain'))
                  : levelLocked
                    ? t('dungeon.lock.lvl').replace('{lvl}', String(e.requiredLvl))
                    : hpLocked
                      ? t('dungeon.lock.hp')
                      : cooldownOnly
                        ? t('dungeon.cooldown.title').replace('{time}', cooldownLabel)
                        : dailyMaxed
                          ? t('dungeon.daily.title')
                          : undefined
              }
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: tierColor,
                  border: '2.5px solid #2a1810',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <Monster recipe={e.recipe} size={60} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <div className="h-title" style={{ fontSize: 14 }}>
                    {tc.enemyName(e.slug, e.name)}
                  </div>
                  {e.tier === 'elite' && (
                    <span
                      className="pip"
                      style={{ fontSize: 9, background: '#8a3a8a', color: '#fff' }}
                    >
                      {t('dungeon.tag.elite')}
                    </span>
                  )}
                  {e.tier === 'boss' && (
                    <span
                      className="pip"
                      style={{ fontSize: 9, background: '#c83232', color: '#fff' }}
                    >
                      {t('dungeon.tag.boss')}
                    </span>
                  )}
                  {trackedSlugs.has(e.slug) && (
                    <span
                      className="pip"
                      style={{
                        fontSize: 9,
                        background: '#ffc830',
                        color: '#2a1810',
                        fontWeight: 700,
                        border: '1.5px solid #2a1810',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                      title={t('dungeon.tracked.title')}
                    >
                      <IcoPaw s={10} /> {t('dungeon.track.tag')}
                    </span>
                  )}
                  {(gate?.abilities ?? []).map((ab) => (
                    <span
                      key={ab.kind}
                      className="pip"
                      style={{
                        fontSize: 9,
                        ...ABILITY_PIP_STYLE[ab.kind],
                      }}
                      title={abilityTooltip(ab)}
                    >
                      {abilityLabel(ab.kind)}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: '#5a3a2a' }}>
                  {t('dungeon.statline')
                    .replace('{lvl}', String(e.lvl))
                    .replace('{hp}', String(e.hp))
                    .replace('{atk}', String(e.atk))}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                  <span className="pip gold" style={{ fontSize: 9 }}>
                    <IcoCoin s={9} /> {e.gold}
                  </span>
                  <span
                    className="pip"
                    style={{
                      fontSize: 9,
                      background: '#e8c870',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <GameIcon name="spark" size={9} /> {e.xp}
                  </span>
                  {gate && !levelLocked && (
                    <span
                      className="pip"
                      style={{
                        fontSize: 9,
                        background: dailyMaxed ? '#f0b8b8' : '#e8dcb9',
                        color: dailyMaxed ? '#5a1818' : '#2a1810',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                      title={t('dungeon.daily.body').replace('{n}', String(gate.dailyLimit))}
                    >
                      {t('dungeon.daily.kills')
                        .replace('{cur}', String(gate.killsToday))
                        .replace('{max}', String(gate.dailyLimit))}
                    </span>
                  )}
                </div>
              </div>
              {/* Prawa kolumna: zegar z czasem gdy cooldown-only, inaczej
                  kłódka (hard-lock) lub strzałka (ready). Cooldown pokazany
                  dużym tekstem, nie małym pipem — ma być od razu widoczny. */}
              <div style={{ lineHeight: 0, textAlign: 'center', minWidth: 44 }}>
                {cooldownOnly ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <div style={{ lineHeight: 0 }}>
                      <IcoClock s={18} />
                    </div>
                    <div
                      style={{
                        fontFamily: 'Luckiest Guy, sans-serif',
                        fontSize: 12,
                        letterSpacing: 0.4,
                        color: '#2a1810',
                        whiteSpace: 'nowrap',
                        lineHeight: 1,
                      }}
                    >
                      {cooldownLabel}
                    </div>
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        skipCooldownMut.mutate({ enemySlug: e.slug });
                      }}
                      disabled={
                        skipCooldownMut.isPending ||
                        char.gems < GEM_SINK_COSTS.skipBossCooldown
                      }
                      title={
                        char.gems < GEM_SINK_COSTS.skipBossCooldown
                          ? t('dungeon.skip.noGems').replace('{n}', String(GEM_SINK_COSTS.skipBossCooldown))
                          : t('dungeon.skip.title')
                      }
                      style={{
                        marginTop: 2,
                        padding: '2px 6px',
                        border: '2px solid #2a1810',
                        borderRadius: 6,
                        background:
                          char.gems < GEM_SINK_COSTS.skipBossCooldown
                            ? '#c0b090'
                            : '#ffc830',
                        color: '#2a1810',
                        fontFamily: 'Luckiest Guy, sans-serif',
                        fontSize: 10,
                        letterSpacing: 0.4,
                        cursor:
                          char.gems < GEM_SINK_COSTS.skipBossCooldown
                            ? 'not-allowed'
                            : 'pointer',
                        boxShadow: '1.5px 1.5px 0 #2a1810',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <IcoGem s={9} /> {GEM_SINK_COSTS.skipBossCooldown}
                    </button>
                  </div>
                ) : locked ? (
                  <GameIcon name="lock" size={20} />
                ) : (
                  <GameIcon name="arrow-right" size={20} />
                )}
              </div>
              {chainLocked ? (
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: '#2a1810',
                    color: '#e8dcb9',
                    fontFamily: 'Luckiest Guy',
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 999,
                    border: '2px solid #e8dcb9',
                    letterSpacing: 0.4,
                  }}
                  title={gate?.chainReason ?? undefined}
                >
                  {t('dungeon.tag.byOrder')}
                </div>
              ) : levelLocked ? (
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: '#2a1810',
                    color: '#ffc830',
                    fontFamily: 'Luckiest Guy',
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 999,
                    border: '2px solid #ffc830',
                  }}
                >
                  {t('dungeon.tag.lvl').replace('{lvl}', String(e.requiredLvl))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
        <HelpIcon title={t('dungeon.help.title')} label={t('dungeon.help.label')}>
          <p style={{ margin: '0 0 8px' }}>
            {t('dungeon.help.p1.a')}<b>{t('dungeon.help.p1.b')}</b>{t('dungeon.help.p1.c')}
            <b>{t('dungeon.help.p1.d')}</b>{t('dungeon.help.p1.e')}<b>{t('dungeon.help.p1.f')}</b>{t('dungeon.help.p1.g')}
          </p>
          <p style={{ margin: '0 0 8px' }}>
            <b>{t('dungeon.help.p2.a')}</b>{t('dungeon.help.p2.b')}<b>{t('dungeon.help.p2.c')}</b>{t('dungeon.help.p2.d')}<b>{t('dungeon.help.p2.e')}</b>{t('dungeon.help.p2.f')}
          </p>
          <p style={{ margin: '0 0 8px' }}>
            {t('dungeon.help.p3.a')}<b>{t('dungeon.help.p3.b')}</b>{t('dungeon.help.p3.c')}<b>{t('dungeon.help.p3.d')}</b>{t('dungeon.help.p3.e')}
          </p>
          <p style={{ margin: '0 0 8px' }}>
            {t('dungeon.help.p4.a')}<b>{t('dungeon.help.p4.b')}</b>{t('dungeon.help.p4.c')}<b>{t('dungeon.help.p4.d')}</b>{t('dungeon.help.p4.e')}<b>{t('dungeon.help.p4.f')}</b>{t('dungeon.help.p4.g')}
          </p>
          <p style={{ margin: 0, fontStyle: 'italic' }}>
            {t('dungeon.help.p5')}
          </p>
        </HelpIcon>
      </div>
      <button
        type="button"
        className="cbtn ghost"
        style={{ marginTop: 14, width: '100%' }}
        onClick={onBack}
      >
        {dungeonSlug ? t('dungeon.back.world') : t('common.backToTown')}
      </button>
    </div>
  );
}
