import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppFrame } from '@/components/AppFrame';
import {
  AchievementUnlockModal,
  ActiveBuffsBar,
  LevelUpModal,
  OfflineSummaryModal,
  TabBar,
  ToastContainer,
  TopBar,
  QuestRewardModal,
} from '@/components/ui-common';
import type { Tab } from '@/components/ui-common';
import { ScreenTown } from '@/screens/town';
import { ScreenChar } from '@/screens/character';
import { ScreenQuests } from '@/screens/quests';
import { ScreenArena } from '@/screens/arena';
import { ScreenGuild } from '@/screens/guild';
import { ScreenDungeon } from '@/screens/dungeon';
import { ScreenShop } from '@/screens/shop';
import type { ShopItem } from '@/screens/shop';
import { ScreenTavern } from '@/screens/tavern';
import { ScreenDaily } from '@/screens/daily';
import { ScreenCreator } from '@/screens/creator';
import { ScreenAchievements } from '@/screens/achievements';
import { ScreenBlacksmith } from '@/screens/blacksmith';
import { ScreenChronicle } from '@/screens/chronicle';
import { ScreenLeaderboards } from '@/screens/leaderboards';
import { ScreenScrapbook } from '@/screens/scrapbook';
import { ScreenTower } from '@/screens/tower';
import { ScreenDice } from '@/screens/dice';
import { ScreenOracle } from '@/screens/oracle';
import { ScreenBlessing } from '@/screens/blessing';
import { ScreenWitch } from '@/screens/witch';
import { ScreenWork } from '@/screens/work';
import { ScreenSeasonPass } from '@/screens/season-pass';
import { ScreenSettings } from '@/screens/settings';
import { ScreenStables } from '@/screens/stables';
import { ScreenTrainer } from '@/screens/trainer';
import { ScreenWorldMap } from '@/screens/world';
import { ScreenGemShop } from '@/screens/gem-shop';
import type { Purchase } from '@/screens/gem-shop';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import {
  ScreenSplash,
  ScreenLogin,
  ScreenCreateChar,
  ScreenTutorial,
} from '@/screens/auth';
import type { CreateCharPayload, LoginPayload } from '@/screens/auth';
import { monsterBySlug } from '@/components/monsters';
import { useAuthStore } from '@/api/auth-store';
import { useToastQueue } from '@/api/toast-queue-store';
import { useUnlockQueue } from '@/api/unlock-queue-store';
import { isNative } from '@/api/use-is-native';
import { trpc } from '@/api/trpc';
import { BillingError, finishPurchase, purchase as nativePurchase } from '@/native/billing';
import { tStatic } from '@/i18n';
import { findPackageById } from '@/native/billing-catalog';
import type {
  Character,
  EquippedSlot,
  InventoryItem,
  LevelUpInfo,
  OfflineSummary,
  Quest,
  QuestReward,
  Stamina,
} from '@grodno/shared';
import type { SubScreen } from '@/types/nav';

type AppState = 'splash' | 'login' | 'createChar' | 'tutorial' | 'game';

/** Ludzka nazwa moba po slug'u — fallback na slug gdy nie znany. */
function enemyNameFor(slug: string): string {
  return monsterBySlug(slug).name;
}

export default function App() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const authEmail = useAuthStore((s) => s.email);
  const authIsGuest = useAuthStore((s) => s.isGuest);
  const setTokens = useAuthStore((s) => s.setTokens);
  const clearAuth = useAuthStore((s) => s.clear);

  const [appState, setAppState] = useState<AppState>(() =>
    accessToken ? 'game' : 'splash',
  );

  // ===== Server state =====
  // Character fetched whenever we're authenticated and past login; tutorial needs it too.
  const meQuery = trpc.me.get.useQuery(undefined, {
    enabled: Boolean(accessToken) && (appState === 'game' || appState === 'tutorial'),
  });
  const char: Character | null = meQuery.data ?? null;

  const questsQuery = trpc.quests.list.useQuery(undefined, {
    enabled: Boolean(accessToken) && Boolean(char) && appState === 'game',
  });
  const quests: readonly Quest[] = useMemo(() => questsQuery.data ?? [], [questsQuery.data]);

  // Local 1Hz tick to drive countdown UI (Town "ready" badge, quest card timers)
  // only while at least one quest is active. Zero network traffic.
  const hasActiveQuests = quests.some((q) => q.state === 'active');
  const [, setClockTick] = useState(0);
  useEffect(() => {
    if (!hasActiveQuests) return;
    const t = setInterval(() => setClockTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [hasActiveQuests]);

  // ===== Auth mutations =====
  const loginMut = trpc.auth.login.useMutation();
  const registerMut = trpc.auth.register.useMutation();
  const guestMut = trpc.auth.guest.useMutation();
  const createCharMut = trpc.me.createCharacter.useMutation();
  const updateAppearanceMut = trpc.me.updateAppearance.useMutation();
  const unlockCosmeticMut = trpc.me.unlockCosmetic.useMutation();

  // ===== Quest mutations =====
  const utils = trpc.useUtils();
  const startQuestMut = trpc.quests.start.useMutation({
    onSuccess: () => {
      void utils.quests.list.invalidate();
      void utils.me.get.invalidate();
    },
  });
  const collectQuestMut = trpc.quests.collect.useMutation({
    onSuccess: (data) => {
      void utils.quests.list.invalidate();
      void utils.me.get.invalidate();
      void utils.inventory.list.invalidate();
      if (data?.unlockedAchievements?.length) pushUnlocks(data.unlockedAchievements);
    },
  });
  const skipQuestMut = trpc.quests.skip.useMutation({
    onSuccess: () => {
      void utils.quests.list.invalidate();
      void utils.me.get.invalidate();
    },
  });
  const skipQuestHalfMut = trpc.quests.skipHalf.useMutation({
    onSuccess: () => {
      void utils.quests.list.invalidate();
      void utils.me.get.invalidate();
    },
    onError: (err) => {
      useToastQueue.getState().push({ text: err.message, accent: '#c83232' });
    },
  });
  const refillStaminaMut = trpc.me.refillStamina.useMutation({
    onSuccess: () => {
      void utils.me.get.invalidate();
      useToastQueue.getState().push({ text: tStatic('toast.staminaRefilled'), accent: '#2a4a3a' });
    },
    onError: (err) => {
      useToastQueue.getState().push({ text: err.message, accent: '#c83232' });
    },
  });
  const renameMut = trpc.me.rename.useMutation({
    onSuccess: (data) => {
      void utils.me.get.invalidate();
      useToastQueue.getState().push({
        text: tStatic('toast.renamed').replace('{name}', data.name),
        accent: '#2a4a3a',
      });
    },
    onError: (err) => {
      useToastQueue.getState().push({ text: err.message, accent: '#c83232' });
    },
  });

  // ===== Local UI state (not server-authoritative) =====
  const [tab, setTab] = useState<Tab>('town');
  const [sub, setSub] = useState<SubScreen | null>(null);
  /** Który loch otwarty (gdy sub === 'dungeon'). null = nic nie wybrane. */
  const [selectedDungeonSlug, setSelectedDungeonSlug] = useState<string | null>(null);
  /** True gdy gracz jest w aktywnej walce — chowamy TabBar i rozciągamy content na pełną wysokość. */
  const [inCombat, setInCombat] = useState(false);
  const [questReward, setQuestReward] = useState<{
    reward: QuestReward;
    title: string;
  } | null>(null);
  const [levelUp, setLevelUp] = useState<LevelUpInfo | null>(null);
  // Kolejka modali osiągnięć — App renderuje head, pushujemy z onSuccess mutacji.
  const unlockHead = useUnlockQueue((s) => s.queue[0] ?? null);
  const shiftUnlock = useUnlockQueue((s) => s.shift);
  const pushUnlocks = useUnlockQueue((s) => s.push);
  // Offline summary — pokazujemy raz per sesja. Serwer zwraca summary tylko
  // gdy gracz był offline >= 30 min; potem odświaża last_seen_at, więc
  // subsekwentne me.get zwracają null. Ref na object-identity żeby po
  // zamknięciu modala (setOfflineSummary(null)) effect nie re-otworzył go
  // z cachowanego pierwszego me.get — ten sam obiekt już został skonsumowany.
  const [offlineSummary, setOfflineSummary] = useState<OfflineSummary | null>(null);
  const seenOfflineSummaryRef = useRef<OfflineSummary | null>(null);
  useEffect(() => {
    const fresh = meQuery.data?.offlineSummary;
    if (fresh && seenOfflineSummaryRef.current !== fresh) {
      seenOfflineSummaryRef.current = fresh;
      setOfflineSummary(fresh);
    }
  }, [meQuery.data]);

  // Tropy auto-roll toasts — serwer zwraca slugs nowo wstawionych tropów w
  // tym tick'u me.get. Push toast per slug; dedup po lastSeenNewTracks żeby
  // szybkie refreshy nie spamowały (React StrictMode może wywołać useEffect
  // dwa razy).
  const pushToast = useToastQueue((s) => s.push);
  const newTrackSlugs = meQuery.data?.newTrackSlugs;
  const lastSeenNewTracksRef = useRef<string | null>(null);
  useEffect(() => {
    if (!newTrackSlugs || newTrackSlugs.length === 0) return;
    const key = newTrackSlugs.join(',');
    if (lastSeenNewTracksRef.current === key) return;
    lastSeenNewTracksRef.current = key;
    for (const slug of newTrackSlugs) {
      pushToast({
        tag: 'NOWY TROP',
        accent: '#c8a090',
        text: `Wytropiono: ${enemyNameFor(slug)}`,
      });
    }
  }, [newTrackSlugs, pushToast]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const dailyStatusQuery = trpc.daily.getStatus.useQuery(undefined, {
    enabled: Boolean(accessToken) && Boolean(char) && appState === 'game',
  });
  // Karciarz Franek — status darmowego rzutu. Enabled razem z resztą daily
  // queries; cache'ujemy krótko bo status zmienia się tylko po kliknięciu
  // „rzuć za darmo" (invalidate odpala ScreenDice).
  const diceStatusQuery = trpc.dice.status.useQuery(undefined, {
    enabled: Boolean(accessToken) && Boolean(char) && appState === 'game',
  });
  const oracleStatusQuery = trpc.oracle.status.useQuery(undefined, {
    enabled: Boolean(accessToken) && Boolean(char) && appState === 'game',
  });
  const blessingStatusQuery = trpc.blessing.status.useQuery(undefined, {
    enabled: Boolean(accessToken) && Boolean(char) && appState === 'game',
  });
  const witchStatusQuery = trpc.witch.status.useQuery(undefined, {
    enabled: Boolean(accessToken) && Boolean(char) && appState === 'game',
  });
  const seasonPassStatusQuery = trpc.seasonPass.status.useQuery(undefined, {
    enabled: Boolean(accessToken) && Boolean(char) && appState === 'game',
  });
  // Ile tierów do odebrania (reachable + unclaimed). Badge w banner town + char.
  const seasonPassClaimableCount = (() => {
    const s = seasonPassStatusQuery.data;
    if (!s) return 0;
    let count = 0;
    for (let t = 1; t <= s.currentTier; t += 1) {
      if ((s.claimedFreeBitmap & (1 << (t - 1))) === 0) count += 1;
      if (s.isPremium && (s.claimedPremiumBitmap & (1 << (t - 1))) === 0) count += 1;
    }
    return count;
  })();

  // Cross-game XP integration — pending XP packages z Okruchów. Slim status
  // endpoint, polled razem z innymi daily statuses. Banner w Town gdy > 0.
  const survivorIdleXpQuery = trpc.survivor.idleXpStatus.useQuery(undefined, {
    enabled: Boolean(accessToken) && Boolean(char) && appState === 'game',
  });
  const survivorIdleXpStatus = survivorIdleXpQuery.data;
  const survivorIdleXpPendingCount =
    survivorIdleXpStatus?.available ? survivorIdleXpStatus.pendingCount : 0;
  const survivorIdleXpPendingTotal =
    survivorIdleXpStatus?.available ? survivorIdleXpStatus.pendingXpTotal : 0;
  const survivorClaimMut = trpc.survivor.claimIdleXp.useMutation({
    onSuccess: (data) => {
      void utils.me.get.invalidate();
      void utils.survivor.idleXpStatus.invalidate();
      void utils.survivor.getHub.invalidate();
      useToastQueue.getState().push({
        tag: 'OKRUCHY',
        accent: '#d4a24c',
        text: `Odebrano ${data.grantsClaimed} paczek — łącznie +${data.totalXpGained} XP`,
      });
      if (data.levelUp) setLevelUp(data.levelUp);
    },
    onError: (err) => {
      useToastQueue.getState().push({ text: err.message, accent: '#c83232' });
    },
  });

  const dailyClaimMut = trpc.daily.claim.useMutation({
    onSuccess: (data) => {
      void utils.daily.getStatus.invalidate();
      void utils.me.get.invalidate();
      // Daily reward can drop a potion/item — refresh the bag so it shows up.
      void utils.inventory.list.invalidate();
      if (data?.unlockedAchievements?.length) pushUnlocks(data.unlockedAchievements);
    },
  });

  const inventoryQuery = trpc.inventory.list.useQuery(undefined, {
    enabled: Boolean(accessToken) && Boolean(char) && appState === 'game',
  });
  const shopCatalogQuery = trpc.shop.catalog.useQuery(undefined, {
    enabled: Boolean(accessToken) && appState === 'game',
    staleTime: 5 * 60_000,
  });
  const shopBuyMut = trpc.shop.buy.useMutation({
    onSuccess: (data) => {
      void utils.inventory.list.invalidate();
      void utils.me.get.invalidate();
      // Refresh catalog so the just-bought listing flips to soldOut right away.
      void utils.shop.catalog.invalidate();
      if (data?.unlockedAchievements?.length) pushUnlocks(data.unlockedAchievements);
    },
  });
  const shopRefreshMut = trpc.shop.refresh.useMutation({
    onSuccess: () => {
      void utils.shop.catalog.invalidate();
      void utils.me.get.invalidate();
      useToastQueue.getState().push({
        text: tStatic('toast.shopRefreshed'),
        accent: '#2a4a3a',
      });
    },
    onError: (err) => {
      useToastQueue.getState().push({ text: err.message, accent: '#c83232' });
    },
  });

  const tavernCompanionsQuery = trpc.tavern.listCompanions.useQuery(undefined, {
    enabled: Boolean(accessToken) && appState === 'game',
    staleTime: 5 * 60_000,
  });
  const tavernRumorsQuery = trpc.tavern.getRumors.useQuery(undefined, {
    enabled: Boolean(accessToken) && appState === 'game',
    staleTime: 60 * 60_000,
  });
  const activeCompanionQuery = trpc.tavern.getActive.useQuery(undefined, {
    enabled: Boolean(accessToken) && Boolean(char) && appState === 'game',
  });
  const invalidateTavern = () => {
    void utils.tavern.getActive.invalidate();
    void utils.me.get.invalidate();
  };
  const hireMut = trpc.tavern.hire.useMutation({ onSuccess: invalidateTavern });
  const dismissMut = trpc.tavern.dismiss.useMutation({ onSuccess: invalidateTavern });
  const healFullMut = trpc.tavern.healFull.useMutation({
    onSuccess: () => {
      void utils.me.get.invalidate();
    },
  });
  const healInstantMut = trpc.tavern.healInstant.useMutation({
    onSuccess: () => {
      void utils.me.get.invalidate();
      pushToast({ text: tStatic('toast.healInstant'), accent: '#2a4a3a' });
    },
    onError: (err) => {
      pushToast({ text: err.message, accent: '#c83232' });
    },
  });
  const rerollCompanionsMut = trpc.tavern.rerollCompanions.useMutation({
    onSuccess: () => {
      void utils.tavern.listCompanions.invalidate();
      void utils.me.get.invalidate();
      pushToast({ text: 'Nowa lista towarzyszy.', accent: '#2a4a3a' });
    },
    onError: (err) => {
      pushToast({ text: err.message, accent: '#c83232' });
    },
  });

  const trainerQuery = trpc.trainer.getQuote.useQuery(undefined, {
    enabled: Boolean(accessToken) && Boolean(char) && appState === 'game',
  });
  const trainerBuyMut = trpc.trainer.buyStat.useMutation({
    onSuccess: (data) => {
      void utils.trainer.getQuote.invalidate();
      void utils.me.get.invalidate();
      if (data?.unlockedAchievements?.length) pushUnlocks(data.unlockedAchievements);
    },
  });

  const stablesQuery = trpc.stables.list.useQuery(undefined, {
    enabled: Boolean(accessToken) && Boolean(char) && appState === 'game' && sub === 'stables',
  });

  const worldQuery = trpc.world.get.useQuery(undefined, {
    enabled:
      Boolean(accessToken) &&
      Boolean(char) &&
      appState === 'game' &&
      (sub === 'world' || sub === 'dungeon' || (tab === 'dungeons' && sub === null)),
  });
  const rentMountMut = trpc.stables.rent.useMutation({
    onSuccess: (data) => {
      void utils.stables.list.invalidate();
      void utils.me.get.invalidate();
      if (data?.unlockedAchievements?.length) pushUnlocks(data.unlockedAchievements);
    },
  });
  const invalidateInventory = () => {
    void utils.inventory.list.invalidate();
    void utils.me.get.invalidate();
  };
  const equipMut = trpc.inventory.equip.useMutation({ onSuccess: invalidateInventory });
  const unequipMut = trpc.inventory.unequip.useMutation({ onSuccess: invalidateInventory });
  const dropMut = trpc.inventory.drop.useMutation({ onSuccess: invalidateInventory });
  const sellMut = trpc.inventory.sell.useMutation({ onSuccess: invalidateInventory });
  const usePotionMut = trpc.inventory.usePotion.useMutation({ onSuccess: invalidateInventory });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [tab, sub]);

  // If authenticated but no character yet, redirect to creator step.
  useEffect(() => {
    if (appState !== 'game') return;
    if (meQuery.isLoading) return;
    if (meQuery.data === null) {
      setAppState('createChar');
    }
  }, [appState, meQuery.data, meQuery.isLoading]);

  const questsReady = quests.filter(
    (q) => q.state === 'active' && q.endsAt > 0 && q.endsAt <= Date.now(),
  ).length;

  const stamina: Stamina = char
    ? { cur: char.stamina, max: char.staminaMax }
    : { cur: 0, max: 10 };

  async function handleLogin(payload: LoginPayload) {
    const res = payload.isNew
      ? await registerMut.mutateAsync({ email: payload.email, password: payload.password })
      : await loginMut.mutateAsync({ email: payload.email, password: payload.password });
    setTokens({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      userId: res.userId,
      email: res.email,
      isGuest: res.isGuest,
    });
    setAppState(res.hasCharacter ? 'game' : 'createChar');
  }

  async function handleGuest() {
    const res = await guestMut.mutateAsync();
    setTokens({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      userId: res.userId,
      email: res.email,
      isGuest: res.isGuest,
    });
    setAppState('createChar');
  }

  async function handleCreateChar(payload: CreateCharPayload) {
    await createCharMut.mutateAsync(payload);
    await utils.me.get.invalidate();
    setAppState('tutorial');
  }

  const navTo = useCallback((screen: Tab | SubScreen) => {
    // Praca i walka nie są ekskluzywne dla nawigacji: gracz może przeglądać
    // arenę, gildię, lochy, wieżę i mapę świata podczas pracy (zarządzać
    // zaproszeniami, czytać czat, oglądać liderboardy). Same combat-trigger
    // mutacje są blokowane serwer-side z `WORKING_BLOCKS_COMBAT_MESSAGE` —
    // klient surfacuje to przez onError toast na próbie ataku.
    if (
      screen === 'town' ||
      screen === 'char' ||
      screen === 'quest' ||
      screen === 'arena' ||
      screen === 'dungeons' ||
      screen === 'guild'
    ) {
      setSub(null);
      setTab(screen);
    } else {
      setSub(screen);
    }
  }, []);

  async function startQuest(id: string) {
    try {
      await startQuestMut.mutateAsync({ questId: id });
    } catch (e) {
      console.error('startQuest failed', e);
    }
  }

  async function collectQuest(id: string) {
    const q = quests.find((x) => x.id === id);
    if (!q) return;
    try {
      const reward = await collectQuestMut.mutateAsync({ questId: id });
      setQuestReward({ reward, title: q.title });
      if (reward.levelUp) setLevelUp(reward.levelUp);
    } catch (e) {
      console.error('collectQuest failed', e);
    }
  }

  async function skipQuest(id: string, _cost: number) {
    void _cost;
    try {
      await skipQuestMut.mutateAsync({ questId: id });
    } catch (e) {
      console.error('skipQuest failed', e);
    }
  }

  function onCombatClosed() {
    void utils.me.get.invalidate();
  }

  async function onBuy(item: ShopItem) {
    try {
      await shopBuyMut.mutateAsync({ itemId: item.id });
    } catch (e) {
      console.error('shop.buy failed', e);
    }
  }

  const devGrantMut = trpc.dev.grantPurchase.useMutation({
    onSuccess: (data) => {
      const parts: string[] = [];
      if (data.grantedGems > 0) {
        parts.push(tStatic('toast.devGrant.gems').replace('{n}', String(data.grantedGems)));
      }
      if (data.grantedGold > 0) {
        parts.push(
          tStatic('toast.devGrant.gold').replace(
            '{n}',
            data.grantedGold.toLocaleString('pl-PL'),
          ),
        );
      }
      pushToast({
        tag: 'DEMO',
        accent: '#3a6aa8',
        text: parts.join(' · ') || tStatic('toast.devGrant.empty'),
      });
      void utils.me.get.invalidate();
    },
    onError: (err) => {
      pushToast({
        text: tStatic('toast.devGrant.failed').replace('{msg}', err.message),
        accent: '#c83232',
      });
    },
  });

  const verifyPlayMut = trpc.gemShop.verifyPlay.useMutation({
    onSuccess: (data) => {
      if (data.status === 'credited' || data.status === 'already_credited') {
        pushToast({
          text: tStatic('toast.devGrant.gems').replace('{n}', String(data.gemsGranted)),
          accent: '#3a6aa8',
        });
      } else {
        pushToast({
          text: tStatic('toast.gemShop.verifyFailed').replace(
            '{reason}',
            data.reason ?? 'unknown',
          ),
          accent: '#c83232',
        });
      }
      void utils.me.get.invalidate();
    },
    onError: (err) => {
      pushToast({
        text: tStatic('toast.gemShop.verifyFailed').replace('{reason}', err.message),
        accent: '#c83232',
      });
    },
  });

  async function buyGemPackNative(packId: string) {
    const pkg = findPackageById(packId);
    if (!pkg) {
      pushToast({ text: tStatic('toast.gemShop.unknownPack'), accent: '#c83232' });
      return;
    }
    try {
      const result = await nativePurchase(pkg.googlePlayProductId);
      const verify = await verifyPlayMut.mutateAsync({
        productId: result.productId,
        purchaseToken: result.purchaseToken,
      });
      // Only finish on the device once the server has accepted/credited the
      // purchase — keeps the receipt re-replayable if our server was down.
      if (verify.status === 'credited' || verify.status === 'already_credited') {
        await finishPurchase(result);
      }
    } catch (err) {
      const code = err instanceof BillingError ? err.code : 'NATIVE_BILLING_ERROR';
      console.error('[gemShop] native buy failed', err);
      pushToast({
        text: tStatic('toast.gemShop.nativeFailed').replace('{code}', code),
        accent: '#c83232',
      });
    }
  }

  function onGemPurchase(pack: Purchase) {
    // Real IAP on native: gem packs (p1..p5) AND the VIP pack (`vip30` id,
    // `vip_30days` SKU). Bundles still go through dev-grant because they
    // grant mixed rewards (items + gold + gems) that haven't been wired
    // through server-validated receipts yet.
    if (isNative() && !pack.bundle && pack.real) {
      void buyGemPackNative(pack.id);
      return;
    }

    // Web path is normally already gated by the screen-level modal in
    // ScreenGemShop. This is just a defensive guard for any future call
    // site that bypasses the screen.
    if (!isNative() && pack.real) {
      pushToast({
        text: tStatic('toast.gemShop.webNotSupported'),
        accent: '#c83232',
      });
      return;
    }

    // Dev / non-real path — keep the old mock so testing the UI still works.
    let gems = 0;
    let gold = 0;
    if (pack.bundle) {
      for (const r of pack.bundle.rewards) {
        if (r.kind === 'gems') gems += r.value;
        else if (r.kind === 'gold') gold += r.value;
      }
    } else if (pack.gems) {
      gems = pack.gems;
    }
    if (gems === 0 && gold === 0) {
      pushToast({ text: tStatic('toast.gemShop.emptyPack'), accent: '#c83232' });
      return;
    }
    devGrantMut.mutate({ packId: pack.id, gems, gold });
  }

  async function onDailyClaim() {
    try {
      return await dailyClaimMut.mutateAsync();
    } catch (e) {
      console.error('daily claim failed', e);
      return null;
    }
  }

  // ===== Render =====
  if (appState === 'splash') {
    return (
      <AppFrame>
        <ScreenSplash onContinue={() => setAppState('login')} />
      </AppFrame>
    );
  }

  // Wrapper dla pre-game stanów (login/createChar/tutorial). Ciemne purple
  // tło rozciąga się edge-to-edge (status bar systemu siedzi nad nim w swoim
  // kolorze parchment). Padding pcha inner content w bezpieczną strefę:
  // notch'e/status bar overlay na górze + home indicator/gesture nav na dole.
  // Dzieci używają `position: absolute; inset: 0` więc respektują padding box.
  const authWrapperStyle = {
    height: '100%',
    position: 'relative' as const,
    background: '#1a0a2a',
    paddingTop: 'var(--frame-top)',
    paddingBottom: 'var(--frame-bottom)',
    boxSizing: 'border-box' as const,
  };

  if (appState === 'login') {
    return (
      <AppFrame>
        <div style={authWrapperStyle}>
          <ScreenLogin onLogin={handleLogin} onGuest={handleGuest} />
        </div>
      </AppFrame>
    );
  }

  if (appState === 'createChar') {
    return (
      <AppFrame>
        <div style={authWrapperStyle}>
          <ScreenCreateChar
            onDone={handleCreateChar}
            onBackToLogin={() => {
              clearAuth();
              setAppState('login');
            }}
          />
        </div>
      </AppFrame>
    );
  }

  if (appState === 'tutorial' && char) {
    return (
      <AppFrame>
        <div style={authWrapperStyle}>
          <ScreenTutorial char={char} onDone={() => setAppState('game')} />
        </div>
      </AppFrame>
    );
  }

  if (!char) {
    return (
      <AppFrame>
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f3ead9',
            textAlign: 'center',
            padding: 20,
          }}
        >
          <div className="h-title" style={{ fontSize: 16, color: '#5a3a2a' }}>
            {meQuery.isError ? (
              <>
                {tStatic('app.boot.connError')}
                <br />
                <button
                  type="button"
                  className="cbtn sm"
                  style={{ marginTop: 8 }}
                  onClick={() => {
                    clearAuth();
                    setAppState('login');
                  }}
                >
                  {tStatic('app.boot.logout')}
                </button>
              </>
            ) : (
              tStatic('app.boot.loading')
            )}
          </div>
        </div>
      </AppFrame>
    );
  }

  // Sub-screens that should render bez TopBar/TabBar (jak walka). Wieża
  // ma własny header + back button i czyta się jako zamknięty encounter.
  const isFullscreenSub = sub === 'tower';

  let content: React.ReactNode = null;
  if (sub === 'dungeon') {
    // Gdy selectedDungeonSlug jest ustawiony — wchodzimy "w loch". Nazwa i
    // desc pobierane z worldQuery (cached gdy się chwilę wcześniej otworzyło
    // mapę). Fallback: stary flat-view gdy brak slugu (backward compat).
    const selectedDungeon = selectedDungeonSlug
      ? worldQuery.data?.regions
          .flatMap((r) => r.dungeons)
          .find((d) => d.slug === selectedDungeonSlug) ?? null
      : null;
    content = (
      <ScreenDungeon
        char={char}
        onBack={() => {
          if (selectedDungeonSlug) {
            // Loch otwarty z mapy → wracamy na mapę, nie do miasta.
            // Jeśli weszli z bottom-tab 'dungeons', sub był null (mapa renderowana
            // przez tab) → wracamy też do null. Inaczej zostawiamy sub='world'.
            setSelectedDungeonSlug(null);
            setSub(tab === 'dungeons' ? null : 'world');
          } else {
            setSub(null);
          }
        }}
        onReward={onCombatClosed}
        onLevelUp={(info) => setLevelUp(info)}
        dungeonSlug={selectedDungeonSlug ?? undefined}
        dungeonName={selectedDungeon?.name}
        dungeonDesc={selectedDungeon?.desc}
        onCombatStateChange={setInCombat}
      />
    );
  } else if (sub === 'world') {
    content = (
      <ScreenWorldMap
        regions={worldQuery.data?.regions ?? []}
        charLvl={char.lvl}
        onDungeonOpen={(slug) => {
          setSelectedDungeonSlug(slug);
          setSub('dungeon');
        }}
        onBack={() => setSub(null)}
      />
    );
  } else if (tab === 'dungeons' && !sub) {
    // Bottom-tab Lochy → mapa świata jako entry-point. Klik dungeona ustawia
    // sub='dungeon' (zachowujemy tab='dungeons' dla highlight), back wraca tu.
    content = (
      <ScreenWorldMap
        regions={worldQuery.data?.regions ?? []}
        charLvl={char.lvl}
        onDungeonOpen={(slug) => {
          setSelectedDungeonSlug(slug);
          setSub('dungeon');
        }}
        onBack={() => navTo('town')}
      />
    );
  } else if (sub === 'shop') {
    // Build the equipped map from the bag query so the shop can show deltas
    // vs what the character is wearing right now.
    const equippedForShop: Partial<Record<EquippedSlot, InventoryItem>> = {};
    for (const it of inventoryQuery.data ?? []) {
      if (it.equippedSlot) {
        equippedForShop[it.equippedSlot] = it;
      }
    }
    content = (
      <ScreenShop
        char={char}
        items={shopCatalogQuery.data?.items ?? []}
        equipped={equippedForShop}
        refreshCost={shopCatalogQuery.data?.refreshCost ?? 10}
        refreshCountToday={shopCatalogQuery.data?.refreshCountToday ?? 0}
        refreshPending={shopRefreshMut.isPending}
        onRefresh={() => shopRefreshMut.mutate()}
        onBuy={onBuy}
        onBack={() => setSub(null)}
      />
    );
  } else if (sub === 'tavern') {
    content = (
      <ScreenTavern
        rumors={tavernRumorsQuery.data ?? []}
        companions={tavernCompanionsQuery.data ?? []}
        activeCompanion={activeCompanionQuery.data ?? null}
        playerGold={char.gold}
        playerGems={char.gems}
        playerHp={char.hp}
        playerHpMax={char.hpMax}
        playerMp={char.mp}
        playerMpMax={char.mpMax}
        healerCost={char.healerCost}
        healerReadyAt={char.healerReadyAt}
        onHire={async (slug) => {
          try {
            await hireMut.mutateAsync({ slug });
          } catch (e) {
            console.error('tavern.hire failed', e);
          }
        }}
        onDismiss={async () => {
          try {
            await dismissMut.mutateAsync();
          } catch (e) {
            console.error('tavern.dismiss failed', e);
          }
        }}
        onHealFull={async () => {
          try {
            await healFullMut.mutateAsync();
          } catch (e) {
            console.error('tavern.healFull failed', e);
          }
        }}
        onHealInstant={() => healInstantMut.mutate()}
        healInstantPending={healInstantMut.isPending}
        onRerollCompanions={() => rerollCompanionsMut.mutate()}
        rerollCompanionsPending={rerollCompanionsMut.isPending}
        onBack={() => setSub(null)}
        onOpenDice={() => setSub('dice')}
        diceFreeAvailable={diceStatusQuery.data?.freeAvailable ?? false}
        onOpenOracle={() => setSub('oracle')}
        oracleFreeAvailable={oracleStatusQuery.data?.freeAvailable ?? false}
        onOpenBlessing={() => setSub('blessing')}
        blessingCooldownReadyAt={blessingStatusQuery.data?.cooldownReadyAt ?? null}
        onOpenWitch={() => setSub('witch')}
        witchCurseCount={witchStatusQuery.data?.curses.length ?? 0}
      />
    );
  } else if (sub === 'daily') {
    const status = dailyStatusQuery.data;
    content = (
      <ScreenDaily
        day={status?.day ?? 1}
        claimed={status?.claimedToday ?? false}
        onClaim={onDailyClaim}
        onBack={() => setSub(null)}
      />
    );
  } else if (sub === 'creator') {
    content = (
      <ScreenCreator
        cls={char.cls}
        appearance={char.appearance}
        mode="edit"
        gems={char.gems}
        onUnlock={async (slug) => {
          await unlockCosmeticMut.mutateAsync({ slug });
          await utils.me.get.invalidate();
        }}
        onSave={async (appearance) => {
          await updateAppearanceMut.mutateAsync({ appearance });
          await utils.me.get.invalidate();
          setSub(null);
        }}
        onCancel={() => setSub(null)}
      />
    );
  } else if (sub === 'gemshop') {
    // PayPal SDK ładuje się tylko przy otwarciu sklepu — nie blokuje boot'a.
    // Native build i tak go nie używa (Google Play Billing), ale ScriptProvider
    // bez VITE_PAYPAL_CLIENT_ID po prostu nie zarejestruje SDK i `<PayPalButtons>`
    // wyrenderuje warning. Modal otwiera się tylko gdy paypalReady (server check).
    const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;
    content = (
      <PayPalScriptProvider
        options={{
          clientId: paypalClientId ?? 'test',
          currency: 'PLN',
          intent: 'capture',
        }}
      >
        <ScreenGemShop char={char} onBack={() => setSub(null)} onPurchase={onGemPurchase} />
      </PayPalScriptProvider>
    );
  } else if (sub === 'trainer') {
    content = (
      <ScreenTrainer
        quote={trainerQuery.data ?? null}
        pending={trainerBuyMut.isPending ? (trainerBuyMut.variables?.stat ?? null) : null}
        onBuy={async (stat) => {
          try {
            await trainerBuyMut.mutateAsync({ stat });
          } catch (e) {
            console.error('trainer.buyStat failed', e);
          }
        }}
        onBack={() => setSub(null)}
      />
    );
  } else if (sub === 'stables') {
    content = (
      <ScreenStables
        mounts={stablesQuery.data?.mounts ?? []}
        activeMount={char.activeMount ?? stablesQuery.data?.active ?? null}
        playerGold={char.gold}
        playerLvl={char.lvl}
        nextUnlockLvl={stablesQuery.data?.nextUnlockLvl ?? null}
        onRent={async (slug) => {
          try {
            await rentMountMut.mutateAsync({ slug });
          } catch (e) {
            console.error('stables.rent failed', e);
          }
        }}
        onBack={() => setSub(null)}
      />
    );
  } else if (sub === 'achievements') {
    content = <ScreenAchievements onBack={() => setSub(null)} />;
  } else if (sub === 'chronicle') {
    content = <ScreenChronicle onBack={() => setSub(null)} />;
  } else if (sub === 'leaderboards') {
    content = <ScreenLeaderboards onBack={() => setSub(null)} />;
  } else if (sub === 'scrapbook') {
    content = <ScreenScrapbook onBack={() => setSub(null)} />;
  } else if (sub === 'blacksmith') {
    content = <ScreenBlacksmith onBack={() => setSub(null)} />;
  } else if (sub === 'tower') {
    content = <ScreenTower onBack={() => setSub(null)} />;
  } else if (sub === 'dice') {
    content = <ScreenDice onBack={() => setSub(null)} />;
  } else if (sub === 'oracle') {
    content = <ScreenOracle onBack={() => setSub(null)} />;
  } else if (sub === 'blessing') {
    content = <ScreenBlessing onBack={() => setSub(null)} />;
  } else if (sub === 'witch') {
    content = <ScreenWitch onBack={() => setSub(null)} />;
  } else if (sub === 'work') {
    content = <ScreenWork onBack={() => setSub(null)} />;
  } else if (sub === 'seasonPass') {
    content = <ScreenSeasonPass onBack={() => setSub(null)} />;
  } else if (sub === 'settings') {
    content = (
      <ScreenSettings
        email={authEmail}
        isGuest={authIsGuest}
        characterName={char.name}
        playerGems={char.gems}
        onRename={(newName) => renameMut.mutate({ name: newName })}
        renamePending={renameMut.isPending}
        onBack={() => setSub(null)}
        onLogout={() => {
          clearAuth();
          setSub(null);
          setTab('town');
          setAppState('splash');
        }}
        onAccountDeleted={() => {
          clearAuth();
          setSub(null);
          setTab('town');
          setAppState('splash');
        }}
        onEditAppearance={() => setSub('creator')}
        onReplayTutorial={() => {
          setSub(null);
          setAppState('tutorial');
        }}
      />
    );
  } else if (tab === 'town') {
    content = (
      <ScreenTown
        char={char}
        nav={navTo}
        dailyAvailable={dailyStatusQuery.data ? !dailyStatusQuery.data.claimedToday : false}
        questsDone={questsReady}
        seasonPassClaimableCount={seasonPassClaimableCount}
        survivorIdleXpPendingCount={survivorIdleXpPendingCount}
        survivorIdleXpPendingTotal={survivorIdleXpPendingTotal}
        onClaimSurvivorXp={() => survivorClaimMut.mutate()}
        survivorClaimPending={survivorClaimMut.isPending}
      />
    );
  } else if (tab === 'char') {
    content = (
      <ScreenChar
        char={char}
        items={inventoryQuery.data ?? []}
        onEditAppearance={() => setSub('creator')}
        onEquip={async (item, targetSlot) => {
          if (item.slot === 'potion' || item.slot === 'any') return;
          await equipMut.mutateAsync({
            itemId: item.id,
            // Explicit targetSlot ('off') używany przy dual-wield daggerów
            // dla łotrzyka. Bez parametru — domyślnie slot pasujący do itemu.
            targetSlot: targetSlot ?? item.slot,
          });
        }}
        onUnequip={async (item) => {
          await unequipMut.mutateAsync({ itemId: item.id });
        }}
        onDrop={async (item) => {
          await dropMut.mutateAsync({ itemId: item.id });
        }}
        onSell={async (item) => {
          await sellMut.mutateAsync({ itemId: item.id });
        }}
        onUsePotion={async (item) => {
          await usePotionMut.mutateAsync({ itemId: item.id });
        }}
        onNavigate={navTo}
        dailyAvailable={
          dailyStatusQuery.data ? !dailyStatusQuery.data.claimedToday : false
        }
        seasonPassClaimableCount={seasonPassClaimableCount}
      />
    );
  } else if (tab === 'quest') {
    content = (
      <ScreenQuests
        quests={quests}
        onStart={startQuest}
        onCollect={collectQuest}
        onSkip={skipQuest}
        onSkipHalf={(id) => skipQuestHalfMut.mutate({ questId: id })}
        onRefillStamina={() => refillStaminaMut.mutate()}
        refillStaminaPending={refillStaminaMut.isPending}
        onBack={() => navTo('town')}
        gems={char.gems}
        stamina={stamina}
        charLvl={char.lvl}
        mountSpeedPct={char.activeMount?.speedPct ?? 0}
      />
    );
  } else if (tab === 'arena') {
    content = <ScreenArena char={char} onBack={() => navTo('town')} />;
  } else if (tab === 'guild') {
    content = <ScreenGuild />;
  }

  return (
    <AppFrame>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#f3ead9',
          position: 'relative',
        }}
      >
        {!inCombat && !isFullscreenSub && (
          <div style={{ paddingTop: 'var(--frame-top)' }}>
            <TopBar
              char={char}
              onProfile={() => {
                setSub(null);
                setTab('char');
              }}
              onGemShop={() => {
                setTab('town');
                setSub('gemshop');
              }}
              onSettings={() => setSub('settings')}
            />
            <ActiveBuffsBar buffs={char.activeBuffs} />
          </div>
        )}

        <div
          ref={scrollRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            // Walka / fullscreen sub (Wieża): górny margin = frame-top (status bar iOS mockupu).
            // Bez walki TopBar już daje spacing — scroll bez paddingu góry.
            paddingTop: inCombat || isFullscreenSub ? 'var(--frame-top)' : 0,
            // Walka / fullscreen sub zajmuje pełną wysokość bez TabBar'a → dół frame-bottom
            // dla home indicator. Bez walki TabBar jest flex child — sam
            // bierze swój space, scroll nie rezerwuje.
            paddingBottom: inCombat || isFullscreenSub ? 'var(--frame-bottom)' : 0,
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            // Rezerwuj miejsce pod scrollbar zawsze — kiedy content rośnie
            // (np. po kliknięciu itemu u Kowala) scroll się pojawia bez
            // przeskoku layoutu. Na mobile scrollbar jest overlay, więc bez
            // wpływu. Webkit <14 ignoruje — akceptowalny fallback.
            scrollbarGutter: 'stable',
          }}
        >
          {content}
        </div>

        {!inCombat && !isFullscreenSub && (
          <TabBar
            tab={sub ? null : tab}
            setTab={(t) => navTo(t)}
          />
        )}

        {questReward && (
          <QuestRewardModal
            reward={questReward.reward}
            questTitle={questReward.title}
            onClose={() => setQuestReward(null)}
          />
        )}
        {levelUp && <LevelUpModal info={levelUp} onClose={() => setLevelUp(null)} />}
        {unlockHead && (
          <AchievementUnlockModal unlock={unlockHead} onClose={shiftUnlock} />
        )}
        {offlineSummary && (
          <OfflineSummaryModal
            summary={offlineSummary}
            onClose={() => setOfflineSummary(null)}
          />
        )}
        <ToastContainer />
      </div>
    </AppFrame>
  );
}
