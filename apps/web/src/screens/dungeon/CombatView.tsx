import { useEffect, useRef, useState } from 'react';
import { AvatarPortrait } from '@/components/avatar';
import { GameIcon } from '@/components/game-icons';
import type { IconName } from '@/components/game-icons';
import { IcoClock, IcoCoin, IcoGem, IcoPaw } from '@/components/icons';
import { StatBar } from '@/components/ui-common';
import { trpc } from '@/api/trpc';
import { useCombatPrefs } from '@/api/combat-prefs-store';
import { useUnlockQueue } from '@/api/unlock-queue-store';
import { useT, tStatic, useContentT } from '@/i18n';
import type { DictKey } from '@/i18n';
import type {
  Character,
  CombatLoot,
  CombatState,
  EnemyAbility,
  InventoryItem,
  Rarity,
  StatusEffect,
  TowerCombatOutcome,
} from '@grodno/shared';

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#a8a890',
  rare: '#3a8ac8',
  epic: '#a04ef0',
  legendary: '#ffc830',
};
const RARITY_LABEL_KEY: Record<Rarity, DictKey> = {
  common: 'rarity.common',
  rare: 'rarity.rare',
  epic: 'rarity.epic',
  legendary: 'rarity.legendary.short',
};
const rarityClass = (r: Rarity) =>
  r === 'epic' ? 'epic' : r === 'legendary' ? 'legendary' : r === 'rare' ? 'rare' : '';

type AttackKind = 'norm' | 'heavy' | 'magic';
type DmgKind =
  | 'norm'
  | 'crit'
  | 'heal'
  | 'miss'
  | 'dodge'
  /** Damage from an active DOT (currently only poison). Green popup. */
  | 'poison'
  /** Enemy proc'd magic attack (DEF-ignoring). Purple popup. */
  | 'magic'
  /** Enemy proc'd armor pierce (boss hit through half DEF). Orange popup. */
  | 'pierce';

interface DmgNum {
  id: number;
  target: 'player' | 'enemy';
  value: number;
  kind: DmgKind;
}

function dmgLabel(d: Pick<DmgNum, 'value' | 'kind'>): string {
  if (d.kind === 'miss') return tStatic('combat.dmg.miss');
  if (d.kind === 'dodge') return tStatic('combat.dmg.dodge');
  if (d.kind === 'heal') return `+${d.value}`;
  return `-${d.value}`;
}

/** Mirror of server-side `reduce(raw, def)` in game/combat.ts. Kept in sync
 * manually — formula is dead-simple (raw × 100 / (100 + def), min 1). */
function previewReduce(raw: number, def: number): number {
  if (raw <= 0) return 0;
  return Math.max(1, Math.ceil((raw * 100) / (100 + Math.max(0, def))));
}

/**
 * Build the post-reduction damage range for each attack kind. Matches the
 * server formula in `rollPlayerAttack`. Crits aren't shown — label stays terse.
 */
// Client mirror. MUST match rollPlayerAttack constants in game/combat.ts.
// Keep in sync on every balance pass.
const PLAYER_ATK_SCALE_CLIENT = 0.5;
const PLAYER_NORM_FLAT_CLIENT = 4;
const PLAYER_HEAVY_FLAT_CLIENT = 4;
const PLAYER_MAGIC_FLAT_CLIENT = 8;

function previewRange(
  kind: AttackKind,
  eff: { atk: number; mag: number; spd: number },
  enemyDef: number,
): { lo: number; hi: number } {
  if (kind === 'magic') {
    const pierce = Math.floor(enemyDef * 0.5);
    const base = eff.mag * PLAYER_ATK_SCALE_CLIENT + PLAYER_MAGIC_FLAT_CLIENT;
    return {
      lo: previewReduce(Math.round(base), pierce),
      hi: previewReduce(Math.round(base + 8), pierce),
    };
  }
  if (kind === 'heavy') {
    const base =
      (eff.atk * PLAYER_ATK_SCALE_CLIENT + PLAYER_HEAVY_FLAT_CLIENT) * 1.6;
    return {
      lo: previewReduce(Math.round(base), enemyDef),
      hi: previewReduce(Math.round(base + 8), enemyDef),
    };
  }
  const base = eff.atk * PLAYER_ATK_SCALE_CLIENT + PLAYER_NORM_FLAT_CLIENT;
  return {
    lo: previewReduce(Math.round(base), enemyDef),
    hi: previewReduce(Math.round(base + 6), enemyDef),
  };
}

/** Miss% shown on MOCNY button. Mirrors `heavyMissRate(spd)` from server. */
function heavyMissPct(spd: number): number {
  return Math.round(Math.max(0.05, 0.25 - spd * 0.006) * 100);
}

/** Log copy for enemy ability proc. Terse, dry — matches game voice. */
function abilityLogLine(enemyName: string, ab: EnemyAbility): string {
  switch (ab.kind) {
    case 'magic':
      return tStatic('combat.ability.magic').replace('{name}', enemyName);
    case 'poison':
      return tStatic('combat.ability.poison').replace('{name}', enemyName).replace('{turns}', String(ab.turns));
    case 'armor_pierce':
      return tStatic('combat.ability.armor_pierce').replace('{name}', enemyName);
  }
}

function statusLabel(s: StatusEffect): string {
  switch (s.kind) {
    case 'poison':
      return tStatic('combat.status.poison')
        .replace('{dmg}', String(s.dmgPerTurn))
        .replace('{turns}', String(s.turnsRemaining));
  }
}

/**
 * Defeat flourish — chunky cartoon skull rising out of a grey smoke plume.
 * Absolutely positioned; parent must be `position: relative`. `size` is the
 * overall pixel extent (matches the sprite it's covering). Animations + the
 * `defeat-wilt` class on the sibling sprite live in `styles/global.css`.
 */
function DefeatOverlay({ size }: { size: number }) {
  return (
    <div
      aria-hidden
      className="defeat-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {/* Smoke plume — three overlapping blobs, chunky black outline. */}
      <svg
        className="defeat-smoke"
        width={size}
        height={size * 0.6}
        viewBox="0 0 100 60"
        style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)' }}
      >
        <path
          d="M15 48 Q10 30 22 24 Q20 10 38 14 Q44 4 56 12 Q72 6 74 20 Q90 22 86 42 Q90 56 72 56 L26 56 Q8 58 15 48 Z"
          fill="#6e6862"
          stroke="#2a1810"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M30 50 Q24 40 34 36 Q36 28 46 32 Q54 26 58 34 Q68 32 66 44"
          fill="#938b82"
          stroke="none"
          opacity="0.85"
        />
      </svg>
      {/* Cartoon skull. Cranium + eye sockets + nose + teeth. */}
      <svg
        className="defeat-skull"
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 60 60"
        style={{ position: 'absolute', bottom: size * 0.22, left: '50%', marginLeft: -size * 0.275 }}
      >
        {/* cranium + jaw silhouette */}
        <path
          d="M12 24 Q12 8 30 8 Q48 8 48 24 L48 36 Q48 42 44 42 L40 42 L40 48 Q40 52 36 52 L34 52 L34 48 L30 48 L30 52 L26 52 Q22 52 22 48 L22 42 L16 42 Q12 42 12 36 Z"
          fill="#f3ead9"
          stroke="#2a1810"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* eye sockets */}
        <ellipse cx="22" cy="26" rx="5" ry="6" fill="#2a1810" />
        <ellipse cx="38" cy="26" rx="5" ry="6" fill="#2a1810" />
        {/* nose */}
        <path d="M30 32 L27 38 L33 38 Z" fill="#2a1810" />
        {/* teeth */}
        <line x1="26" y1="42" x2="26" y2="48" stroke="#2a1810" strokeWidth="2" />
        <line x1="30" y1="42" x2="30" y2="48" stroke="#2a1810" strokeWidth="2" />
        <line x1="34" y1="42" x2="34" y2="48" stroke="#2a1810" strokeWidth="2" />
      </svg>
    </div>
  );
}

/**
 * Abstrakcja przeciwnika dla CombatView — pozwala używać tego samego
 * komponentu z różnymi źródłami (mobki lochowe z MonsterRecipe i tower
 * bossami renderowanymi jako GameIcon). `renderPortrait(size)` dostaje
 * rozmiar i zwraca dowolny node — CombatView tylko osadza go w ramce.
 */
export interface CombatEnemyInfo {
  /** Server enemy slug — used for content translation lookup. Optional for
   *  non-mob portraits (tower bosses) where we just display `name`. */
  slug?: string;
  name: string;
  lvl: number;
  flavor: string;
  /** Trigger dla overlayu „OSTRZEŻENIE / BOSS" na początku walki. */
  isBoss: boolean;
  renderPortrait: (size: number) => import('react').ReactNode;
}

/**
 * Tryb walki — decyduje o panelu zwycięstwa/porażki, inwalidacji cache
 * i paru UI szczegółach. `dungeon` to oryginalne zachowanie (XP/łup/track
 * bonus). `tower` dostaje własny panel z floor++/gold/gems + cooldown
 * komunikatem po porażce.
 */
export type CombatMode = 'dungeon' | 'tower';

export interface CombatViewProps {
  enemy: CombatEnemyInfo;
  char: Character;
  initialState: CombatState;
  onBack: () => void;
  onLevelUp?: (info: import('@grodno/shared').LevelUpInfo) => void;
  mode?: CombatMode;
}

export function CombatView({
  enemy,
  char,
  initialState,
  onBack,
  onLevelUp,
  mode = 'dungeon',
}: CombatViewProps) {
  const t = useT();
  const tc = useContentT();
  const enemyDisplayName = tc.enemyName(enemy.slug, enemy.name);
  const [state, setState] = useState<CombatState>(initialState);
  const [log, setLog] = useState<string[]>([
    t('combat.log.met').replace('{name}', enemyDisplayName).replace('{flavor}', enemy.flavor),
  ]);
  const [anims, setAnims] = useState<{ player: string; enemy: string }>({
    player: '',
    enemy: '',
  });
  const [dmgNums, setDmgNums] = useState<DmgNum[]>([]);
  const [burst, setBurst] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const attackMut = trpc.combat.attack.useMutation();
  const healMut = trpc.combat.heal.useMutation();
  const pushUnlocks = useUnlockQueue((s) => s.push);

  // Live bag snapshot — re-queried on every inventory mutation so the picker
  // reflects real stock (victories add drops, heals deplete).
  const inventoryQuery = trpc.inventory.list.useQuery();
  const potions: InventoryItem[] = (inventoryQuery.data ?? []).filter(
    (it) => it.slot === 'potion' && it.qty > 0 && (it.hpHeal > 0 || it.mpHeal > 0),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  /** Victory loot drop — set on the killing blow, rendered in the victory panel. */
  const [lastLoot, setLastLoot] = useState<CombatLoot | null>(null);
  /**
   * Tower-mode outcome dla ostatniej akcji. Victory ustawia `reward`+nowy
   * floor; defeat ustawia `failedUntil`. Panel zwycięstwa/porażki używa
   * tego do wyświetlenia konkretów zamiast dungeonowego XP/łup układu.
   */
  const [lastTower, setLastTower] = useState<TowerCombatOutcome | null>(null);

  // Keep buttons locked through the enemy's counter-attack animation so the UI
  // feels turn-based — player action, short beat, enemy reply, then ready for
  // the next input. Without this, the mutation resolves in ~50ms and the user
  // can queue the next attack before the enemy-shake is even visible.
  const [turnLock, setTurnLock] = useState(false);

  // Symuluj: auto-pilot. Gdy włączone, decision-timer odpala akcję natychmiast
  // po zwolnieniu lockowania tury zamiast czekać DECISION_MS. Manualny klik
  // wciąż działa — gracz może w każdej chwili wbić MOCNY/MAGIA/LECZ bez
  // wyłączania sima. Toggle leci przyciskiem nad akcjami.
  const [simMode, setSimMode] = useState(false);
  // Boss intro — 1.5s overlay na początku walki z dungeon-bossem. Blokuje akcje
  // żeby gracz nie klikał na ślepo. Odpala się dla `isBoss=true` — w dungeon
  // mode dla 3 dungeon bossów + quest-bossów; w tower mode zawsze (każdy
  // floor = boss). Decyzję podejmuje caller (ScreenDungeon / ScreenTower).
  const [introOpen, setIntroOpen] = useState(enemy.isBoss);
  useEffect(() => {
    if (!introOpen) return;
    const t = setTimeout(() => setIntroOpen(false), 1500);
    return () => clearTimeout(t);
  }, [introOpen]);
  // Settingi sim-pickera — persystowane globalnie (zustand + localStorage), żeby
  // ustawienia przetrwały między walkami. simMode (czy symuluję TĘ walkę)
  // zostaje per-fight i resetuje się na każdy engage.
  const simAutoHeal = useCombatPrefs((s) => s.simAutoHeal);
  const simUseHeavy = useCombatPrefs((s) => s.simUseHeavy);
  const simUseMagic = useCombatPrefs((s) => s.simUseMagic);
  const setSimAutoHeal = useCombatPrefs((s) => s.setSimAutoHeal);
  const setSimUseHeavy = useCombatPrefs((s) => s.setSimUseHeavy);
  const setSimUseMagic = useCombatPrefs((s) => s.setSimUseMagic);
  /** Próg HP do auto-heala (0..1). Hardcoded 40% — UI-wybór może dojść później. */
  const SIM_HEAL_THRESHOLD = 0.4;

  // Decision timer — player has DECISION_MS to pick an action; otherwise we
  // auto-trigger a basic attack so the fight keeps moving. `timerStartedAt` is
  // the unix-ms when the current decision window opened (null while locked or
  // outside of 'fight').
  const DECISION_MS = 5000;
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [, setTimerTick] = useState(0); // re-render ~10× per second to animate the bar

  function addDmg(target: 'player' | 'enemy', value: number, kind: DmgKind) {
    const id = Math.random();
    setDmgNums((d) => [...d, { id, target, value, kind }]);
    setTimeout(() => setDmgNums((d) => d.filter((x) => x.id !== id)), 900);
  }
  function pushLog(s: string) {
    setLog((l) => [...l.slice(-3), s]);
  }

  const locked = attackMut.isPending || healMut.isPending || turnLock || introOpen;

  function playEnemyCounter(
    enemyDmg: number,
    enemyDodged: boolean,
    ability: EnemyAbility | null,
  ) {
    // No counter to animate when the enemy isn't attacking at all (victory branch).
    if (enemyDmg <= 0 && !enemyDodged) return;
    setTimeout(() => {
      if (enemyDodged) {
        addDmg('player', 0, 'dodge');
        pushLog(t('combat.log.dodged').replace('{name}', char.name));
        return;
      }
      setAnims((a) => ({ ...a, player: 'shake' }));
      setTimeout(() => setAnims((a) => ({ ...a, player: '' })), 400);
      // Kind kolorowy w zależności od proca — magia fiolet, pierce pomarańcz.
      // Poison jako ability ma własne dmg (DOT) osobno tickowane; tutaj hit
      // fizyczny który dołożył poison leci w 'norm'.
      const kind: DmgKind =
        ability?.kind === 'magic'
          ? 'magic'
          : ability?.kind === 'armor_pierce'
            ? 'pierce'
            : 'norm';
      addDmg('player', enemyDmg, kind);
      pushLog(
        t('combat.log.enemyHit').replace('{enemy}', enemyDisplayName).replace('{dmg}', String(enemyDmg)),
      );
    }, 500);
  }

  /**
   * Hold the turn lock long enough for the full animation to play:
   *   - player attack hit flash (~400ms)
   *   - enemy counter delay (500ms)
   *   - enemy shake (400ms)
   *   - small breathing room
   */
  function holdTurnLock(enemyAttacked: boolean) {
    setTurnLock(true);
    // Full animation when the enemy actually strikes (hit *or* dodge popup
    // both need the beat); short lock when the enemy isn't attacking at all.
    const totalMs = enemyAttacked ? 1100 : 500;
    setTimeout(() => setTurnLock(false), totalMs);
  }

  async function attack(kind: AttackKind) {
    if (state.status !== 'fight' || locked) return;
    try {
      const res = await attackMut.mutateAsync({ combatId: state.combatId, kind });
      // DOT tick happens BEFORE the swing (patrz combat.ts). Pokazujemy go
      // w logu i popup'em żeby gracz wiedział że trucizna go je każdą turę.
      // Kind 'poison' → zielony popup, odróżnia od zwykłego hita.
      if (res.playerStatusDmg > 0) {
        addDmg('player', res.playerStatusDmg, 'poison');
        pushLog(t('combat.log.poisonTick').replace('{dmg}', String(res.playerStatusDmg)));
      }
      if (res.playerMiss) {
        addDmg('enemy', 0, 'miss');
        pushLog(t('combat.log.miss').replace('{name}', char.name));
      } else {
        setAnims((a) => ({ ...a, enemy: 'shake' }));
        setTimeout(() => setAnims((a) => ({ ...a, enemy: '' })), 400);
        // Crit ma priorytet (gold, 52px) — "kryt" to fakt niezależny od typu
        // ataku. Poza tym: magia → fioletowy popup (spójnie z enemy magic
        // proc'iem na graczu), norm/heavy → biały.
        const hitKind: DmgKind = res.playerCrit
          ? 'crit'
          : kind === 'magic'
            ? 'magic'
            : 'norm';
        addDmg('enemy', res.playerDmg, hitKind);
        if (res.playerCrit) {
          setBurst('CRIT!');
          setTimeout(() => setBurst(null), 500);
        }
        pushLog(
          t('combat.log.hit')
            .replace('{name}', char.name)
            .replace('{dmg}', String(res.playerDmg)) +
            (res.playerCrit ? t('combat.log.crit.suffix') : ''),
        );
      }
      if (res.enemyAbility) {
        pushLog(abilityLogLine(enemyDisplayName, res.enemyAbility));
      }
      setState(res.state);
      const enemyAttacked = res.state.status === 'fight';
      playEnemyCounter(res.enemyDmg, res.enemyDodged, res.enemyAbility);
      holdTurnLock(enemyAttacked);

      if (res.state.status === 'victory' || res.state.status === 'defeat') {
        void utils.me.get.invalidate();
        if (mode === 'tower') {
          void utils.tower.current.invalidate();
        }
      }
      if (res.tower) setLastTower(res.tower);
      if (res.loot) {
        setLastLoot(res.loot);
        pushLog(t('combat.log.loot').replace('{name}', res.loot.name));
        void utils.inventory.list.invalidate();
      }
      if (res.levelUp && onLevelUp) {
        onLevelUp(res.levelUp);
      }
      if (res.unlockedAchievements.length > 0) {
        pushUnlocks(res.unlockedAchievements);
      }
    } catch (e) {
      console.error('combat.attack failed', e);
    }
  }

  async function drinkPotion(item: InventoryItem) {
    if (state.status !== 'fight' || locked) return;
    setPickerOpen(false);
    try {
      const res = await healMut.mutateAsync({
        combatId: state.combatId,
        itemId: item.id,
      });
      if (res.playerStatusDmg > 0) {
        addDmg('player', res.playerStatusDmg, 'poison');
        pushLog(t('combat.log.poisonTick').replace('{dmg}', String(res.playerStatusDmg)));
      }
      if (res.healedHp > 0) addDmg('player', res.healedHp, 'heal');
      const parts: string[] = [];
      if (res.healedHp > 0) parts.push(`+${res.healedHp} HP`);
      if (res.healedMp > 0) parts.push(`+${res.healedMp} MP`);
      pushLog(
        t('combat.log.drank').replace('{name}', res.itemName) +
          (parts.length ? ` (${parts.join(', ')})` : ''),
      );
      if (res.enemyAbility) {
        pushLog(abilityLogLine(enemyDisplayName, res.enemyAbility));
      }
      setState(res.state);
      // Heal consumes a turn — enemy gets a hit in just like a normal attack.
      playEnemyCounter(res.enemyDmg, res.enemyDodged, res.enemyAbility);
      holdTurnLock(true);
      void utils.me.get.invalidate();
      void utils.inventory.list.invalidate();
      if (res.tower) setLastTower(res.tower);
      if (mode === 'tower' && res.state.status === 'defeat') {
        void utils.tower.current.invalidate();
      }
    } catch (e) {
      console.error('combat.heal failed', e);
    }
  }

  // Keep a ref to `attack` so the decision-timer useEffect can fire it without
  // rebinding every render (attack closes over mutations + setState).
  const attackRef = useRef(attack);
  attackRef.current = attack;

  /**
   * Sim action picker — wywoływany zamiast `attackRef.current('norm')` gdy
   * simMode=true. Priorytety: heal (HP-potion) > heavy > magic > norm.
   * Każdy krok gated flagą w settingsach — gracz wyłącza co nie chce.
   * Drinkując miksturę zużywa turę tak samo jak atak, więc to pełna
   * alternatywa, nie bonus.
   */
  const simActionRef = useRef<() => void>(() => {});
  simActionRef.current = () => {
    if (simAutoHeal) {
      const hpPotion = potions.find((p) => p.hpHeal > 0);
      if (hpPotion && state.playerHp <= state.playerHpMax * SIM_HEAL_THRESHOLD) {
        void drinkPotion(hpPotion);
        return;
      }
    }
    if (simUseHeavy && state.heavyCooldown === 0) {
      void attack('heavy');
      return;
    }
    if (simUseMagic && state.playerMp >= 10) {
      void attack('magic');
      return;
    }
    void attack('norm');
  };

  useEffect(() => {
    // Start a fresh decision window when we're fighting and inputs are free.
    if (state.status !== 'fight' || locked) {
      setTimerStartedAt(null);
      return;
    }
    // Sim = odpala picker natychmiast (heal/heavy/magic/norm wg settingsów);
    // manual = auto-NORM po DECISION_MS (5s). Pasek countdown'u pokazujemy
    // tylko w trybie manualnym.
    const delay = simMode ? 0 : DECISION_MS;
    const started = Date.now();
    setTimerStartedAt(simMode ? null : started);
    const autoAttack = setTimeout(() => {
      if (simMode) {
        simActionRef.current();
      } else {
        attackRef.current('norm');
      }
    }, delay);
    const rerender = simMode
      ? null
      : setInterval(() => setTimerTick((t) => t + 1), 100);
    return () => {
      clearTimeout(autoAttack);
      if (rerender) clearInterval(rerender);
    };
  }, [state.status, locked, simMode]);

  const decisionPct =
    timerStartedAt !== null
      ? Math.max(0, 100 - ((Date.now() - timerStartedAt) / DECISION_MS) * 100)
      : 0;
  const decisionSecondsLeft =
    timerStartedAt !== null
      ? Math.max(0, Math.ceil((DECISION_MS - (Date.now() - timerStartedAt)) / 100) / 10)
      : 0;

  return (
    <div className="screen-in" style={{ padding: 12, position: 'relative' }}>
      {introOpen && enemy.isBoss && <BossIntroOverlay enemy={enemy} />}
      <div
        style={{
          background: 'linear-gradient(180deg, #3a2a4a 0%, #1a0a1a 60%, #0a0a0a 100%)',
          border: '3px solid #2a1810',
          borderRadius: 14,
          boxShadow: '3px 3px 0 #2a1810',
          padding: 12,
          position: 'relative',
          overflow: 'hidden',
          height: 320,
        }}
      >
        <svg
          viewBox="0 0 360 80"
          preserveAspectRatio="none"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 90 }}
        >
          <path d="M0 0 L360 0 L280 80 L80 80 Z" fill="#2a1a2a" stroke="#2a1810" strokeWidth="2" />
          <path d="M60 60 L300 60" stroke="#5a3a4a" strokeWidth="1.5" />
          <path d="M40 40 L320 40" stroke="#5a3a4a" strokeWidth="1" />
        </svg>
        <div style={{ position: 'absolute', left: 6, top: 8, lineHeight: 0 }}>
          <GameIcon name="fire" size={22} />
        </div>
        <div style={{ position: 'absolute', right: 6, top: 8, lineHeight: 0 }}>
          <GameIcon name="fire" size={22} />
        </div>

        <div
          style={{
            position: 'absolute',
            top: 30,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              background: 'rgba(42,24,16,0.8)',
              padding: '4px 10px',
              borderRadius: 8,
              border: '2px solid #2a1810',
              color: '#fff',
              marginBottom: 4,
            }}
          >
            <div className="h-title" style={{ fontSize: 12, color: '#f0e0b0' }}>
              {state.enemyName} · LVL {state.enemyLvl}
            </div>
            {state.trackBonus && (
              <div
                style={{
                  marginTop: 2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: '#ffc830',
                  color: '#2a1810',
                  border: '1.5px solid #2a1810',
                  borderRadius: 999,
                  padding: '1px 6px',
                  fontFamily: 'Luckiest Guy, sans-serif',
                  fontSize: 10,
                  letterSpacing: 0.4,
                }}
                title={t('combat.tracked.title')}
              >
                <IcoPaw s={11} /> {t('combat.tracked.tag')}
              </div>
            )}
            <div style={{ width: 160, marginTop: 2 }}>
              <StatBar cur={state.enemyHp} max={state.enemyHpMax} kind="hp" />
            </div>
          </div>
        </div>
        {/* Outer owns the centering transform; inner owns the shake animation.
            Without the split, the shake's `transform: translate(...)` stomps
            the `translateX(-50%)` and the mob snaps half its width to the right. */}
        <div
          style={{
            position: 'absolute',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <div
            className={anims.enemy}
            style={{ position: 'relative', transformOrigin: '50% 100%' }}
          >
            <div className={state.status === 'victory' ? 'defeat-wilt' : undefined}>
              {enemy.renderPortrait(110)}
            </div>
            {dmgNums
              .filter((d) => d.target === 'enemy')
              .map((d) => (
                <div key={d.id} className={`dmg-num ${d.kind}`} style={{ top: 20 }}>
                  {dmgLabel(d)}
                </div>
              ))}
            {burst && <div className="burst">{burst}</div>}
            {state.status === 'victory' && <DefeatOverlay size={110} />}
          </div>
        </div>

        <div className={anims.player} style={{ position: 'absolute', bottom: 16, left: 16 }}>
          <div style={{ position: 'relative' }}>
            <div
              className={state.status === 'defeat' ? 'defeat-wilt' : undefined}
              style={{
                width: 90,
                height: 90,
                borderRadius: 999,
                border: '3px solid #2a1810',
                boxShadow: '3px 3px 0 #2a1810',
                overflow: 'hidden',
              }}
            >
              {/* Separate inner div owns the scaleX(-1) mirror so the wilt animation's
                  transform doesn't clobber it when the player is defeated. */}
              <div style={{ transform: 'scaleX(-1)' }}>
                <AvatarPortrait appearance={char.appearance} cls={char.cls} size={90} />
              </div>
            </div>
            {dmgNums
              .filter((d) => d.target === 'player')
              .map((d) => (
                <div key={d.id} className={`dmg-num ${d.kind}`} style={{ top: 0 }}>
                  {dmgLabel(d)}
                </div>
              ))}
            {state.status === 'defeat' && <DefeatOverlay size={90} />}
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            width: 140,
            background: 'rgba(42,24,16,0.8)',
            border: '2px solid #2a1810',
            padding: '4px 8px',
            borderRadius: 8,
          }}
        >
          <div className="h-title" style={{ fontSize: 13, color: '#f0e0b0' }}>
            {char.name}
          </div>
          <div style={{ marginTop: 2 }}>
            <StatBar cur={state.playerHp} max={state.playerHpMax} kind="hp" />
          </div>
          <div style={{ marginTop: 2 }}>
            <StatBar cur={state.playerMp} max={state.playerMpMax} kind="mp" />
          </div>
          {state.playerStatus.length > 0 && (
            <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {state.playerStatus.map((s, i) => (
                <div
                  key={`${s.kind}-${i}`}
                  style={{
                    fontSize: 9,
                    fontFamily: 'Luckiest Guy, sans-serif',
                    letterSpacing: 0.3,
                    background: '#4a6a2a',
                    color: '#d8f0c0',
                    border: '1.5px solid #2a1810',
                    borderRadius: 999,
                    padding: '1px 6px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                  title={t('combat.status.title')}
                >
                  {statusLabel(s)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          background: '#1a0a0a',
          color: '#f0e0b0',
          border: '3px solid #2a1810',
          borderRadius: 10,
          padding: 8,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12,
          lineHeight: 1.4,
          marginTop: 10,
          minHeight: 100,
          maxHeight: 100,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 2,
        }}
      >
        {log.slice(-4).map((l, i, arr) => (
          <div key={i} style={{ opacity: i === arr.length - 1 ? 1 : 0.55 }}>
            › {l}
          </div>
        ))}
      </div>

      {state.status === 'fight' && (
        // Blok countdown'a — zawsze w DOM-ie, fade przez opacity. Bez tego
        // przyciski akcji skakały w górę po każdym kliknięciu (lock=true →
        // timer znika → layout reflow). Teraz wysokość jest zarezerwowana
        // stale, tylko pasek znika wizualnie podczas tury.
        <div
          style={{
            marginTop: 10,
            opacity: timerStartedAt !== null ? 1 : 0,
            transition: 'opacity 150ms ease',
            pointerEvents: timerStartedAt !== null ? 'auto' : 'none',
          }}
          aria-hidden={timerStartedAt === null}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12,
              color: '#5a3a2a',
              marginBottom: 2,
            }}
          >
            <span>{t('combat.decision')}</span>
            <span className="mono" style={{ fontWeight: 700 }}>
              {decisionSecondsLeft.toFixed(1)}s
            </span>
          </div>
          <div
            style={{
              height: 8,
              background: '#1a0a0a',
              border: '2px solid #2a1810',
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                width: `${decisionPct}%`,
                height: '100%',
                background:
                  decisionPct > 40 ? '#6ad05e' : decisionPct > 15 ? '#f5c538' : '#ff4b4b',
                boxShadow:
                  decisionPct > 40
                    ? '0 0 6px rgba(106,208,94,0.6)'
                    : decisionPct > 15
                    ? '0 0 6px rgba(245,197,56,0.6)'
                    : '0 0 6px rgba(255,75,75,0.7)',
                transition: 'width 120ms linear, background 200ms, box-shadow 200ms',
              }}
            />
          </div>
        </div>
      )}
      {state.status === 'fight' && (
        <>
          <button
            type="button"
            className={simMode ? 'cbtn red sm' : 'cbtn sm'}
            onClick={() => setSimMode((v) => !v)}
            style={{
              marginTop: 10,
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: simMode ? undefined : '#e8dcb9',
            }}
            title={simMode ? t('combat.sim.toggleStop.title') : t('combat.sim.toggleStart.title')}
          >
            <GameIcon name="bolt" size={14} />
            {simMode ? t('combat.sim.toggleStop') : t('combat.sim.toggleStart')}
          </button>
          {simMode && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 6,
                marginTop: 6,
              }}
            >
              <SimToggle
                label={t('combat.sim.autoHeal')}
                sub={t('combat.sim.autoHeal.sub')}
                on={simAutoHeal}
                onToggle={() => setSimAutoHeal(!simAutoHeal)}
                title={t('combat.sim.autoHeal.title')}
              />
              <SimToggle
                label={t('combat.sim.heavy')}
                sub={t('combat.sim.heavy.sub')}
                on={simUseHeavy}
                onToggle={() => setSimUseHeavy(!simUseHeavy)}
                title={t('combat.sim.heavy.title')}
              />
              <SimToggle
                label={t('combat.sim.magic')}
                sub={t('combat.sim.magic.sub')}
                on={simUseMagic}
                onToggle={() => setSimUseMagic(!simUseMagic)}
                title={t('combat.sim.magic.title')}
              />
            </div>
          )}
        </>
      )}
      {state.status === 'fight' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
            marginTop: 10,
          }}
        >
          {(() => {
            const eff = { atk: state.playerAtk, mag: state.playerMag, spd: state.playerSpd };
            const norm = previewRange('norm', eff, state.enemyDef);
            const heavy = previewRange('heavy', eff, state.enemyDef);
            const magic = previewRange('magic', eff, state.enemyDef);
            const missPct = heavyMissPct(state.playerSpd);
            const heavyLocked = state.heavyCooldown > 0;
            return (
              <>
                <button
                  type="button"
                  className="cbtn red"
                  onClick={() => attack('norm')}
                  disabled={locked}
                  title={t('combat.btn.atk.title')}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <GameIcon name="sword" size={18} /> {t('combat.btn.atk')}
                    </span>
                    <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 400 }}>
                      {norm.lo}–{norm.hi}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  className="cbtn blue"
                  onClick={() => attack('heavy')}
                  disabled={locked || heavyLocked}
                  title={
                    heavyLocked
                      ? t('combat.btn.heavy.lockedTitle').replace('{n}', String(state.heavyCooldown))
                      : t('combat.btn.heavy.title').replace('{pct}', String(missPct))
                  }
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <GameIcon name="bolt" size={18} />
                      {t('combat.btn.heavy')}
                      {heavyLocked && (
                        <>
                          <IcoClock s={12} />
                          {state.heavyCooldown}
                        </>
                      )}
                    </span>
                    <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 400 }}>
                      {heavyLocked
                        ? t('combat.btn.heavy.cooldown')
                        : t('combat.btn.heavy.preview')
                            .replace('{lo}', String(heavy.lo))
                            .replace('{hi}', String(heavy.hi))
                            .replace('{pct}', String(missPct))}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  className="cbtn"
                  onClick={() => attack('magic')}
                  disabled={locked || state.playerMp < 10}
                  style={{ background: '#6a3a8a', color: '#fff' }}
                  title={t('combat.btn.magic.title')}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <GameIcon name="magic" size={18} /> {t('combat.btn.magic')}
                    </span>
                    <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 400 }}>
                      {magic.lo}–{magic.hi} · −10 MP
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  className="cbtn green"
                  onClick={() => setPickerOpen(true)}
                  disabled={locked || potions.length === 0}
                  title={potions.length === 0 ? t('combat.btn.heal.title.empty') : t('combat.btn.heal.title')}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <GameIcon name="potion" size={18} /> {t('combat.btn.heal')}
                    </span>
                    <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 400 }}>
                      {potions.length === 0
                        ? t('combat.btn.heal.none')
                        : t('combat.btn.heal.count').replace(
                            '{n}',
                            String(potions.reduce((n, p) => n + p.qty, 0)),
                          )}
                    </span>
                  </div>
                </button>
              </>
            );
          })()}
        </div>
      )}
      {state.status === 'fight' && (
        <button
          type="button"
          className="cbtn ghost sm"
          onClick={onBack}
          disabled={locked}
          style={{
            marginTop: 8,
            width: '100%',
            fontSize: 13,
            opacity: locked ? 0.55 : 0.85,
          }}
          title={t('combat.flee.title')}
        >
          {t('combat.flee')}
        </button>
      )}
      {pickerOpen && (
        <div
          role="dialog"
          onClick={() => setPickerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(20, 10, 10, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12,
            zIndex: 100,
          }}
        >
          <div
            className="panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: 12,
              width: '100%',
              maxWidth: 440,
              background: '#fff7e0',
              maxHeight: '60vh',
              overflowY: 'auto',
            }}
          >
            <div
              className="h-title"
              style={{
                fontSize: 14,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <GameIcon name="potion" size={16} /> {t('combat.picker.heading')}
              </span>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 16,
                  cursor: 'pointer',
                  color: '#5a3a2a',
                  padding: '0 4px',
                }}
                aria-label={t('combat.picker.close.aria')}
              >
                ✕
              </button>
            </div>
            {potions.length === 0 ? (
              <div style={{ fontSize: 12, color: '#5a3a2a', padding: 12, textAlign: 'center' }}>
                {t('combat.picker.empty')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {potions.map((p) => {
                  const healLabel = [
                    p.hpHeal > 0 ? `+${p.hpHeal} HP` : null,
                    p.mpHeal > 0 ? `+${p.mpHeal} MP` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ');
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className="panel-tight clickable"
                      onClick={() => void drinkPotion(p)}
                      disabled={locked}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: 8,
                        textAlign: 'left',
                        cursor: locked ? 'not-allowed' : 'pointer',
                        opacity: locked ? 0.5 : 1,
                        border: '2.5px solid #2a1810',
                        background: '#fff',
                      }}
                    >
                      <GameIcon name="potion" size={28} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="h-title" style={{ fontSize: 13, lineHeight: 1 }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 13, color: '#2e5020', marginTop: 2 }}>
                          {healLabel}
                        </div>
                      </div>
                      <span
                        className="pip"
                        style={{ fontSize: 13, background: '#e8dcb9' }}
                      >
                        ×{p.qty}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {state.status === 'victory' && mode === 'dungeon' && (
        <div
          className="panel pop-in"
          style={{ padding: 14, marginTop: 10, textAlign: 'center', background: '#d8f0c0' }}
        >
          <div className="h-display" style={{ fontSize: 26, color: '#2e5020' }}>
            {t('combat.victory')}
          </div>
          <div style={{ margin: '8px 0' }}>
            <span className="pip gold">
              <IcoCoin s={13} /> +{state.trackBonus ? state.enemyGold * 2 : state.enemyGold}
              {state.trackBonus && (
                <span style={{ fontSize: 9, marginLeft: 3, opacity: 0.8 }}>×2</span>
              )}
            </span>{' '}
            <span
              className="pip"
              style={{
                background: '#e8c870',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <GameIcon name="spark" size={13} /> +{state.trackBonus ? state.enemyXp * 2 : state.enemyXp} XP
              {state.trackBonus && (
                <span style={{ fontSize: 9, opacity: 0.8 }}>×2</span>
              )}
            </span>
          </div>
          {lastLoot && (
            <div
              className={`panel-tight ${rarityClass(lastLoot.rarity)}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: 10,
                marginBottom: 10,
                background: '#fff7e0',
                border: `2.5px solid ${RARITY_COLOR[lastLoot.rarity]}`,
                textAlign: 'left',
                animation: 'qrm-slide 0.4s ease-out 0.1s both, qrm-glow 1.6s ease-in-out infinite 0.6s',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: '#e8dcb9',
                  border: '2px solid #2a1810',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <GameIcon name={lastLoot.icon as IconName} size={28} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'inline-block',
                    fontFamily: 'Luckiest Guy, sans-serif',
                    fontSize: 9,
                    letterSpacing: 0.5,
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: RARITY_COLOR[lastLoot.rarity],
                    color: '#fff3e0',
                    marginBottom: 2,
                  }}
                >
                  {t('combat.victory.lootLabel')}{t(RARITY_LABEL_KEY[lastLoot.rarity])}
                </div>
                <div className="h-title" style={{ fontSize: 14, lineHeight: 1.1 }}>
                  {lastLoot.name}
                </div>
              </div>
            </div>
          )}
          <button type="button" className="cbtn green" onClick={onBack}>
            {t('combat.victory.next')}
          </button>
        </div>
      )}
      {state.status === 'victory' && mode === 'tower' && (
        <TowerVictoryPanel outcome={lastTower} onBack={onBack} />
      )}
      {state.status === 'defeat' && mode === 'dungeon' && (
        <div
          className="panel pop-in"
          style={{ padding: 14, marginTop: 10, textAlign: 'center', background: '#f0c0c0' }}
        >
          <div className="h-display" style={{ fontSize: 26, color: '#8a1e1e' }}>
            {t('combat.defeat')}
          </div>
          <div style={{ fontSize: 14, margin: '6px 0' }}>
            {t('combat.defeat.body')}
          </div>
          <button type="button" className="cbtn red" onClick={onBack}>
            {t('combat.defeat.retreat')}
          </button>
        </div>
      )}
      {state.status === 'defeat' && mode === 'tower' && (
        <TowerDefeatPanel outcome={lastTower} onBack={onBack} />
      )}
    </div>
  );
}

/**
 * Kompaktowy toggle w rzędzie ustawień sima — kliknięcie przełącza flagę,
 * wizualnie pokazuje stan (green/grey). Pod mainowym przyciskiem SYMULUJ.
 */
/**
 * Dramatyczny overlay wyświetlany przez 1.5s gdy zaczyna się walka z bossem.
 * Dark backdrop + duży portret + napis „BOSS: NAZWA" + LVL + ikonki abilities.
 * Blokuje klik w akcje (przez locked=true w CombatView). Animacja CSS inline —
 * fade-in 0-0.3s, hold, fade-out ostatnie 0.4s; implementowana przez
 * animation keyframes dodane w `global.css`.
 */
function BossIntroOverlay({ enemy }: { enemy: CombatEnemyInfo }) {
  const t = useT();
  const tc = useContentT();
  const enemyDisplayName = tc.enemyName(enemy.slug, enemy.name);
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(10, 5, 5, 0.88)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        animation: 'boss-intro-fade 1.5s ease-out forwards',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#c83232',
          fontFamily: 'Luckiest Guy, sans-serif',
          letterSpacing: 3,
          animation: 'boss-intro-pulse 1.2s ease-in-out infinite',
        }}
      >
        {t('combat.boss.warning')}
      </div>
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 16,
          border: '4px solid #c83232',
          background: 'linear-gradient(135deg, #4a0a0a 0%, #1a0000 100%)',
          boxShadow: '0 0 32px rgba(200, 50, 50, 0.6), inset 0 0 24px rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          animation: 'boss-intro-scale 0.6s ease-out',
        }}
      >
        {enemy.renderPortrait(170)}
      </div>
      <div
        style={{
          fontSize: 14,
          color: '#f3ead9',
          fontFamily: 'Luckiest Guy, sans-serif',
          letterSpacing: 2,
          marginTop: 4,
        }}
      >
        {t('combat.boss.label')}
      </div>
      <div
        style={{
          fontSize: 28,
          color: '#ffc830',
          fontFamily: 'Luckiest Guy, sans-serif',
          textShadow: '2px 2px 0 #2a1810, 0 0 20px rgba(255,200,48,0.5)',
          textAlign: 'center',
          padding: '0 12px',
          lineHeight: 1.1,
        }}
      >
        {enemyDisplayName.toUpperCase()}
      </div>
      <div
        style={{
          fontSize: 13,
          color: '#f3ead9',
          fontFamily: 'Luckiest Guy, sans-serif',
          letterSpacing: 1,
          opacity: 0.85,
        }}
      >
        LVL {enemy.lvl}
      </div>
    </div>
  );
}

/**
 * Panel wygranej w Wieży. Pokazuje ukończony floor + złoto/gemy z `outcome`,
 * opcjonalny milestone badge gdy floor był podzielny przez 10. Brak XP/łupu
 * (Wieża tego nie daje). Button „DALEJ" wraca do `ScreenTower`.
 */
function TowerVictoryPanel({
  outcome,
  onBack,
}: {
  outcome: TowerCombatOutcome | null;
  onBack: () => void;
}) {
  const t = useT();
  const reward = outcome?.reward ?? null;
  const completedFloor = outcome ? outcome.newFloor - 1 : null;
  const isMilestone = reward?.isMilestone ?? false;
  return (
    <div
      className="panel pop-in"
      style={{
        padding: 14,
        marginTop: 10,
        textAlign: 'center',
        background: isMilestone
          ? 'linear-gradient(180deg,#fff7e0 0%,#ffe8a0 100%)'
          : '#d8f0c0',
      }}
    >
      <div className="h-display" style={{ fontSize: 26, color: '#2e5020' }}>
        {isMilestone ? t('combat.tower.victory.milestone') : t('combat.tower.victory.up')}
      </div>
      {completedFloor !== null && (
        <div
          className="flavor"
          style={{ fontSize: 14, color: '#2a1810', marginTop: 4, marginBottom: 8 }}
        >
          {t('combat.tower.victory.completed').replace('{n}', String(completedFloor))}
        </div>
      )}
      {reward && (
        <div
          style={{
            display: 'inline-flex',
            gap: 12,
            alignItems: 'center',
            padding: '6px 12px',
            border: '2.5px solid #2a1810',
            borderRadius: 8,
            background: '#fff7e0',
            margin: '6px 0 10px',
          }}
        >
          {reward.gold > 0 && (
            <span
              className="mono"
              style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}
            >
              <IcoCoin s={14} /> +{reward.gold.toLocaleString('pl-PL')}
            </span>
          )}
          {reward.gems > 0 && (
            <span
              className="mono"
              style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}
            >
              <IcoGem s={14} /> +{reward.gems}
            </span>
          )}
        </div>
      )}
      <div>
        <button type="button" className="cbtn green" onClick={onBack}>
          {t('combat.tower.victory.next')}
        </button>
      </div>
    </div>
  );
}

/**
 * Panel porażki w Wieży. Pokazuje cooldown do kolejnej próby (lub komunikat
 * że padłeś). Wskrzeszenie za gemy robi się z `ScreenTower`, nie z combat view.
 */
function TowerDefeatPanel({
  outcome,
  onBack,
}: {
  outcome: TowerCombatOutcome | null;
  onBack: () => void;
}) {
  const t = useT();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!outcome?.failedUntil) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [outcome?.failedUntil]);
  const remainingMs = outcome?.failedUntil ? Math.max(0, outcome.failedUntil - now) : 0;
  const min = Math.floor(remainingMs / 60_000);
  const sec = Math.floor((remainingMs % 60_000) / 1000);
  return (
    <div
      className="panel pop-in"
      style={{ padding: 14, marginTop: 10, textAlign: 'center', background: '#f0c0c0' }}
    >
      <div className="h-display" style={{ fontSize: 26, color: '#8a1e1e' }}>
        {t('combat.defeat')}
      </div>
      <div className="flavor" style={{ fontSize: 14, margin: '6px 0', color: '#4a0a0a' }}>
        {t('combat.tower.defeat.body')}
      </div>
      {remainingMs > 0 && (
        <div
          className="mono"
          style={{
            fontSize: 14,
            margin: '4px 0 10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#2a1810',
          }}
        >
          <IcoClock s={14} /> {t('combat.tower.defeat.rest').replace('{time}', `${min}:${String(sec).padStart(2, '0')}`)}
        </div>
      )}
      <div style={{ fontSize: 12, color: '#5a1818', marginBottom: 10 }}>
        {t('combat.tower.defeat.tail')}
      </div>
      <button type="button" className="cbtn red" onClick={onBack}>
        {t('combat.defeat.retreat')}
      </button>
    </div>
  );
}

function SimToggle({
  label,
  sub,
  on,
  onToggle,
  title,
}: {
  label: string;
  sub: string;
  on: boolean;
  onToggle: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={title}
      style={{
        padding: '6px 4px',
        borderRadius: 8,
        border: '2.5px solid #2a1810',
        background: on ? '#b6d88a' : '#e0d8c0',
        color: on ? '#1a3a0a' : '#5a5040',
        boxShadow: '2px 2px 0 #2a1810',
        fontFamily: 'inherit',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        lineHeight: 1.1,
      }}
    >
      <span
        className="h-title"
        style={{
          fontSize: 12,
          letterSpacing: 0.3,
          textDecoration: on ? 'none' : 'line-through',
          opacity: on ? 1 : 0.65,
        }}
      >
        {label.toUpperCase()}
      </span>
      <span style={{ fontSize: 12, opacity: 0.75, fontWeight: 400 }}>{sub}</span>
    </button>
  );
}
