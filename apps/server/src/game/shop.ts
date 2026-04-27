import type { CharacterClass, IconName, ItemSlot, Rarity } from '@grodno/shared';
import { REGISTRY, type ShopListing } from '../content/registry.js';

/** Ile różnych przedmiotów widoczna jest w sklepie na jednym "rollu". */
export const SHOP_DAILY_SLOTS = 6;

/** FNV-1a (ten sam co w arena.ts) — taniutki deterministyczny uint32 hash. */
function fnv1a(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — mały deterministyczny PRNG seedowany uint32. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Losuje `n` listingów ze `pool`'a deterministycznie na podstawie `seedStr`.
 * Ten sam seed → zawsze te same przedmioty (stabilna lista między refetch'ami).
 * Kolejność wynikowa też deterministyczna (Fisher-Yates na kopii).
 *
 * Gdy `pool.length < n` — zwracamy co jest (sklep przy L1 może mieć <6 opcji,
 * niech i tak coś pokaże, lepsze niż pusty panel).
 */
export function pickDailyShopListings(
  pool: readonly ShopListing[],
  seedStr: string,
  n: number = SHOP_DAILY_SLOTS,
): ShopListing[] {
  const rng = mulberry32(fnv1a(seedStr));
  // Stabilne uporządkowanie po id przed shuffle — order Map.values() zależy
  // od kolejności insert'u z `content/seed.ts`; bez tego fix seed mógłby dawać
  // różne wyniki przy reimporcie contentu.
  const copy = [...pool].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy.slice(0, Math.min(n, copy.length));
}

/** Zwraca listing'i widoczne dla postaci: filtr klasy + LVL (+2 bufora). */
export function filterShopPool(
  pool: readonly ShopListing[],
  charLvl: number,
  charCls: CharacterClass | undefined,
): ShopListing[] {
  return pool.filter((l) => {
    if (l.requiredLvl > charLvl + 2) return false;
    if (charCls && l.item.allowedClasses && !l.item.allowedClasses.includes(charCls)) return false;
    return true;
  });
}

/**
 * Seed string do daily rolla. Bumpuje przez `refreshCountToday`, więc manual
 * refresh (+1) → inne 6 przedmiotów. Daty UTC → przeskok o północy.
 */
export function buildShopSeed(
  characterId: string,
  today: string,
  refreshCountToday: number,
): string {
  return `shop:${characterId}:${today}:${refreshCountToday}`;
}

export interface ShopItemTemplate {
  id: string;
  name: string;
  icon: IconName;
  slot: ItemSlot;
  rarity: Rarity;
  price: number;
  desc: string;
  gems?: boolean;
  atk?: number;
  def?: number;
  mag?: number;
  requiredLvl: number;
  /** Undefined = universal. Weapons are typically class-gated. */
  allowedClasses?: readonly CharacterClass[];
  /** Opcjonalny timed buff. Po wypiciu odpala `applyBuff` zamiast hp/mp heal'a. */
  buffKind?:
    | 'hp_max_pct'
    | 'mp_max_pct'
    | 'atk_flat'
    | 'def_flat'
    | 'mag_flat'
    | 'spd_flat';
  buffMagnitude?: number;
  buffDurationHours?: number;
}

const MELEE: readonly CharacterClass[] = ['warrior', 'rogue'];
const CASTER: readonly CharacterClass[] = ['mage'];

export const SHOP_CATALOG: readonly ShopItemTemplate[] = [
  // ===== Akt I (L1-5) =====
  { id: 's1', name: 'Paracetamol+', icon: 'pill', slot: 'potion', rarity: 'common', price: 20, desc: 'Leczy 30 HP. Smak truskawkowy.', requiredLvl: 1 },
  { id: 's2', name: 'Mikstura Buraka', icon: 'potion', slot: 'potion', rarity: 'common', price: 45, desc: 'Leczy 80 HP. Trochę słona.', requiredLvl: 1 },
  { id: 's3', name: 'Stary Hełm', icon: 'helmet', slot: 'head', rarity: 'common', price: 90, desc: '+3 DEF. Pachnie piwem.', def: 3, requiredLvl: 2 },
  { id: 's4', name: 'Rdzawy Miecz', icon: 'sword-rusted', slot: 'weapon', rarity: 'common', price: 140, desc: '+5 ATK. Rdza wliczona w cenę.', atk: 5, requiredLvl: 3, allowedClasses: MELEE },
  { id: 's4m', name: 'Różdżka Ucznia', icon: 'orb', slot: 'weapon', rarity: 'common', price: 140, desc: '+6 MAG. Drewniana, ale próbuje.', mag: 6, requiredLvl: 3, allowedClasses: CASTER },
  // ===== Akt II (L6-10) =====
  { id: 's5', name: 'Hełm Myśliwego', icon: 'helm-hunter', slot: 'head', rarity: 'rare', price: 420, desc: '+14 DEF, +3 SPD.', def: 14, requiredLvl: 6 },
  { id: 's6', name: 'Buty 7-Milowe', icon: 'seven-league-boots', slot: 'feet', rarity: 'rare', price: 380, desc: '+8 SPD. 6 mil? Zniżka!', requiredLvl: 6 },
  { id: 's7', name: 'Skórzany Napierśnik', icon: 'cuirass-leather', slot: 'chest', rarity: 'rare', price: 560, desc: '+12 DEF. Szeleści trochę.', def: 12, requiredLvl: 7 },
  { id: 's8', name: 'Mikstura Wojownika', icon: 'potion-warrior', slot: 'potion', rarity: 'rare', price: 180, desc: 'Leczy 180 HP. Wzmacnia w boju.', requiredLvl: 8 },
  { id: 's9', name: 'Miecz Świtu', icon: 'sword-dawn', slot: 'weapon', rarity: 'epic', price: 850, desc: '+22 ATK. Wschód słońca w pochwie.', atk: 22, requiredLvl: 8, allowedClasses: MELEE },
  { id: 's9m', name: 'Orb Świtu', icon: 'orb-dawn', slot: 'weapon', rarity: 'epic', price: 850, desc: '+25 MAG. Ciepły o poranku.', mag: 25, requiredLvl: 8, allowedClasses: CASTER },
  { id: 's10', name: 'Pierścień Lotu', icon: 'ring-flight', slot: 'ring', rarity: 'epic', price: 1100, desc: '+5 SPD, +5 MAG. Lekki jak myśl.', mag: 5, requiredLvl: 10 },
  // ===== Akt III (L11-15) =====
  { id: 's11', name: 'Amulet Katakumb', icon: 'amulet-catacombs', slot: 'neck', rarity: 'epic', price: 1500, desc: '+10 MAG. Echo z głębin.', mag: 10, requiredLvl: 11 },
  { id: 's12', name: 'Topór Bezgłowy', icon: 'axe-headless', slot: 'weapon', rarity: 'epic', price: 1800, desc: '+24 ATK. Bez głowy, bez problemu.', atk: 24, requiredLvl: 12, allowedClasses: MELEE },
  { id: 's12m', name: 'Kostur Bezgłowy', icon: 'staff-headless', slot: 'weapon', rarity: 'epic', price: 1800, desc: '+28 MAG. Czasami sam sobie coś mruczy.', mag: 28, requiredLvl: 12, allowedClasses: CASTER },
  { id: 's13', name: 'Peleryna Cienia', icon: 'cloak-shadow', slot: 'chest', rarity: 'epic', price: 2200, desc: '+15 DEF, +4 SPD. Mrugnij i już jej nie ma.', def: 15, requiredLvl: 13 },
  { id: 's14', name: 'Kostur Chaosu', icon: 'staff-chaos', slot: 'weapon', rarity: 'legendary', price: 2400, desc: '+35 MAG. Emituje złe wibracje.', gems: true, mag: 35, requiredLvl: 13, allowedClasses: CASTER },
  { id: 's15', name: 'Korona Nieumarłych', icon: 'crown-undead', slot: 'head', rarity: 'legendary', price: 3200, desc: '+18 DEF, +10 MAG. Koronę się dziedziczy.', def: 18, mag: 10, requiredLvl: 14 },
  { id: 's16', name: 'Ostrze Tronu', icon: 'sword-throne', slot: 'weapon', rarity: 'legendary', price: 4200, desc: '+40 ATK. Tylko dla godnych. I bogatych.', atk: 40, requiredLvl: 15, allowedClasses: MELEE },
  { id: 's16m', name: 'Berło Tronu', icon: 'scepter-throne', slot: 'weapon', rarity: 'legendary', price: 4200, desc: '+48 MAG. Wydaje wyroki zanim pomyślisz o nich.', mag: 48, requiredLvl: 15, allowedClasses: CASTER },
  // ===== Akt IV — Puszcza Cień (L16-30) =====
  { id: 's17', name: 'Mikstura Puszczańska', icon: 'potion-forest', slot: 'potion', rarity: 'epic', price: 400, desc: 'Leczy 320 HP. Pachnie mchem.', requiredLvl: 16 },
  { id: 's18', name: 'Rękawice Strażnika', icon: 'gloves-guard', slot: 'hands', rarity: 'epic', price: 2600, desc: '+14 DEF, +3 SPD. Szare, funkcjonalne.', def: 14, requiredLvl: 17 },
  { id: 's19', name: 'Buty Borowe', icon: 'boots-bor', slot: 'feet', rarity: 'epic', price: 2800, desc: '+16 DEF, +6 SPD. Idą ciszej niż sarna.', def: 16, requiredLvl: 18 },
  { id: 's20', name: 'Miecz Borowy', icon: 'sword-bor', slot: 'weapon', rarity: 'epic', price: 5200, desc: '+32 ATK. Runa leśna wybudzi ostrze sama.', atk: 32, requiredLvl: 20, allowedClasses: MELEE },
  { id: 's20m', name: 'Kostur Runowy', icon: 'staff-rune', slot: 'weapon', rarity: 'epic', price: 5200, desc: '+38 MAG. Pamięta wszystkie przesądy.', mag: 38, requiredLvl: 20, allowedClasses: CASTER },
  { id: 's22', name: 'Pierścień Starych Bogów', icon: 'ring-old-gods', slot: 'ring', rarity: 'legendary', price: 7400, desc: '+12 MAG, +6 DEF. Żyje. Oddycha.', mag: 12, def: 6, requiredLvl: 22 },
  { id: 's25', name: 'Kolczuga Watahy', icon: 'chestplate-pack', slot: 'chest', rarity: 'legendary', price: 9800, desc: '+28 DEF, +6 ATK. Ogniwa kute na poroża.', def: 28, requiredLvl: 25 },
  { id: 's28', name: 'Sztylet Mgły', icon: 'dagger-mist', slot: 'weapon', rarity: 'legendary', price: 14000, desc: '+58 ATK. Znika gdy tego potrzebujesz.', atk: 58, requiredLvl: 28, allowedClasses: MELEE },
  { id: 's28m', name: 'Kostur Starszej', icon: 'staff-elder', slot: 'weapon', rarity: 'legendary', price: 14000, desc: '+68 MAG. Mówi głosem babci, o której się nie mówi.', mag: 68, requiredLvl: 28, allowedClasses: CASTER },
  // ===== Akt V — Bagna Czarnej Strzygi (L33-50) =====
  { id: 's33', name: 'Mikstura Bagienna', icon: 'potion-marsh', slot: 'potion', rarity: 'rare', price: 600, desc: 'Leczy 420 HP. Podbite błotem — liczy się intencja.', requiredLvl: 33 },
  { id: 's35', name: 'Kiścień Łowcy', icon: 'flail-hunter', slot: 'weapon', rarity: 'epic', price: 12000, desc: '+52 ATK. Krótki trzonek, długa pamięć.', atk: 52, requiredLvl: 35, allowedClasses: MELEE },
  { id: 's35m', name: 'Fujarka Pasterza', icon: 'pipe-shepherd', slot: 'weapon', rarity: 'epic', price: 12000, desc: '+58 MAG. Pasterz umarł, owce poszły same.', mag: 58, requiredLvl: 35, allowedClasses: CASTER },
  { id: 's38', name: 'Pancerz Trzcinowy', icon: 'chestplate-reed', slot: 'chest', rarity: 'epic', price: 14500, desc: '+32 DEF. Szeleści. Bardzo szeleści.', def: 32, requiredLvl: 38 },
  { id: 's42', name: 'Rękawice Błotne', icon: 'gloves-mud', slot: 'hands', rarity: 'epic', price: 18000, desc: '+22 DEF, +4 ATK. Lepkie na uścisk ręki.', def: 22, atk: 4, requiredLvl: 42 },
  { id: 's44', name: 'Amulet Grzybiarki', icon: 'amulet-mushroom', slot: 'neck', rarity: 'legendary', price: 22000, desc: '+18 MAG, +8 DEF. Znany z dobrych zbiorów.', mag: 18, def: 8, requiredLvl: 44 },
  { id: 's46', name: 'Buty Smolne', icon: 'boots-tar', slot: 'feet', rarity: 'epic', price: 25000, desc: '+26 DEF, +4 SPD. Kapią w progu. Zostań bosy.', def: 26, requiredLvl: 46 },
  { id: 's50', name: 'Wielka Mikstura Czarna', icon: 'potion-black-big', slot: 'potion', rarity: 'legendary', price: 1200, desc: 'Leczy 900 HP + 240 MP. Nie pytaj co zawiera.', requiredLvl: 50 },
  // ===== Akt VI — Granie Strzelistych Iglic (L48-65) =====
  { id: 's48', name: 'Eliksir Wysokogórski', icon: 'potion-altitude', slot: 'potion', rarity: 'epic', price: 1800, desc: 'Leczy 1200 HP + 320 MP. Smak — tylko halny.', requiredLvl: 48 },
  { id: 's52', name: 'Buty Halnego', icon: 'boots-mountain', slot: 'feet', rarity: 'epic', price: 32000, desc: '+34 DEF, +6 SPD. Trzymają na lodzie. Pasterz przeprosił.', def: 34, requiredLvl: 52 },
  { id: 's60', name: 'Rękawice Pasterza', icon: 'gloves-shepherd', slot: 'hands', rarity: 'legendary', price: 48000, desc: '+30 DEF, +12 ATK. Wełna z owcy która znikła.', def: 30, atk: 12, requiredLvl: 60 },
  // ===== Healing gap-fillers =====
  { id: 's-heal-18', name: 'Eliksir Borowy', icon: 'potion-forest', slot: 'potion', rarity: 'epic', price: 350, desc: 'Leczy 300 HP + 80 MP. Pachnie żywicą.', requiredLvl: 18 },
  { id: 's-heal-30', name: 'Wywar Końca Puszczy', icon: 'potion-big', slot: 'potion', rarity: 'epic', price: 550, desc: 'Leczy 500 HP. Robiony z tego, co zostało.', requiredLvl: 30 },
  // ===== Buff elixirs — HP max % =====
  // `buffKind` skutkuje override w `character_buffs` per kategoria. Wypicie
  // drugiej mikstury tej samej kategorii nadpisuje. Wartości +25/+50/+100%
  // są intencjonalnie spójne: early/mid/endgame tier'y. Cena kalibrowana na
  // ~3-4 questy gold'a w danym paśmie LVL — buffy mają być ekonomicznym
  // wyborem, nie auto-buy.
  { id: 's-buff-hp25', name: 'Eliksir Żył Grubych', icon: 'potion-hp-small', slot: 'potion', rarity: 'rare', price: 800, desc: '+25% HP max na 12 godzin. Napływ krzepkości.', requiredLvl: 6, buffKind: 'hp_max_pct', buffMagnitude: 25, buffDurationHours: 12 },
  { id: 's-buff-hp50', name: 'Eliksir Krwi Smoka', icon: 'potion-hp-big', slot: 'potion', rarity: 'epic', price: 6000, desc: '+50% HP max na 12 godzin. Smoczy się już nie pojawił.', requiredLvl: 18, buffKind: 'hp_max_pct', buffMagnitude: 50, buffDurationHours: 12 },
  { id: 's-buff-hp100', name: 'Wywar Trzewi Strzygi', icon: 'potion-black-big', slot: 'potion', rarity: 'legendary', price: 40, desc: '+100% HP max na 6 godzin. Smak pomijalny.', gems: true, requiredLvl: 35, buffKind: 'hp_max_pct', buffMagnitude: 100, buffDurationHours: 6 },
  // ===== Buff elixirs — MP max % =====
  { id: 's-buff-mp25', name: 'Mikstura Głębokiej Many', icon: 'potion-first', slot: 'potion', rarity: 'rare', price: 1000, desc: '+25% MP max na 12 godzin. Pachnie kiszonką.', requiredLvl: 10, buffKind: 'mp_max_pct', buffMagnitude: 25, buffDurationHours: 12 },
  { id: 's-buff-mp50', name: 'Eliksir Magii Starszej', icon: 'potion-black', slot: 'potion', rarity: 'epic', price: 8000, desc: '+50% MP max na 12 godzin. Buteleczkę daj babce.', requiredLvl: 25, buffKind: 'mp_max_pct', buffMagnitude: 50, buffDurationHours: 12 },
  // ===== Buff elixirs — stat flat =====
  { id: 's-buff-atk15', name: 'Olej Bojowy', icon: 'potion-warrior', slot: 'potion', rarity: 'rare', price: 700, desc: '+15 ATK na 6 godzin. Smar do mięśni.', requiredLvl: 8, buffKind: 'atk_flat', buffMagnitude: 15, buffDurationHours: 6 },
  { id: 's-buff-atk30', name: 'Żar Bitewny', icon: 'potion-warrior', slot: 'potion', rarity: 'epic', price: 4500, desc: '+30 ATK na 6 godzin. Piekło w żyłach.', requiredLvl: 25, buffKind: 'atk_flat', buffMagnitude: 30, buffDurationHours: 6 },
  { id: 's-buff-def12', name: 'Tarczowy Smar', icon: 'potion-medium', slot: 'potion', rarity: 'rare', price: 1200, desc: '+12 DEF na 12 godzin. Lepki — tak ma być.', requiredLvl: 12, buffKind: 'def_flat', buffMagnitude: 12, buffDurationHours: 12 },
  { id: 's-buff-def25', name: 'Mur Żelazny', icon: 'potion-marsh', slot: 'potion', rarity: 'epic', price: 5500, desc: '+25 DEF na 12 godzin. Ruszyć się ciężej.', requiredLvl: 28, buffKind: 'def_flat', buffMagnitude: 25, buffDurationHours: 12 },
  { id: 's-buff-mag18', name: 'Eliksir Płomienia', icon: 'potion-big', slot: 'potion', rarity: 'rare', price: 1400, desc: '+18 MAG na 6 godzin. Grzeje bebechy.', requiredLvl: 14, buffKind: 'mag_flat', buffMagnitude: 18, buffDurationHours: 6 },
  { id: 's-buff-spd8', name: 'Wywar Prędki', icon: 'potion-forest', slot: 'potion', rarity: 'rare', price: 900, desc: '+8 SPD na 12 godzin. Nogi same niosą.', requiredLvl: 10, buffKind: 'spd_flat', buffMagnitude: 8, buffDurationHours: 12 },
];

/** Fetch a shop listing (merged with its item template) from the registry. */
export function getShopListing(id: string): ShopListing | null {
  return REGISTRY.shop.get(id) ?? null;
}

/** @deprecated Use getShopListing for the live DB-backed listing. */
export function getShopItem(id: string): ShopItemTemplate | null {
  return SHOP_CATALOG.find((i) => i.id === id) ?? null;
}

/**
 * Koszt ręcznego odświeżenia sklepu jako funkcja liczby odświeżeń dziś.
 * Scaling geometryczny `10 * 2^count`, cap 160 (5+ odświeżeń tego samego dnia).
 * Daily reset przez sprawdzenie `shopRefreshDate` kontra `isoDateUTC()`.
 */
export const SHOP_REFRESH_BASE_COST = 10;
export const SHOP_REFRESH_MAX_COST = 160;

export function computeShopRefreshCost(countToday: number): number {
  const n = Math.max(0, countToday);
  const scaled = SHOP_REFRESH_BASE_COST * 2 ** Math.min(n, 4); // 10,20,40,80,160
  return Math.min(SHOP_REFRESH_MAX_COST, scaled);
}
