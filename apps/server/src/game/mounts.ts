// Stajnie. Gracz wynajmuje wierzchowca (jednego na raz) za złoto; aktywny
// mount skraca czas nowo startowanych questów o `speedPct` procent.
// Szczegóły gospodarki w CLAUDE.md → sekcja "Stajnie".

import { REGISTRY, type MountTemplate } from '../content/registry.js';

/** Hard cap na redukcję czasu — admin wpisujący 99 w DataGrip nie robi instant-questów. */
export const MOUNT_SPEED_CAP_PCT = 80;

/**
 * Zwraca aktywnego wierzchowca dla postaci (jeśli jeszcze nie wygasł i slug
 * faktycznie istnieje w rejestrze). Lazy-expire: nie modyfikujemy `characters`
 * w tle; sam `quests.start` po prostu nie nakłada bonusu gdy `expiresAt` minął.
 */
export function getActiveMount(
  char: { mountSlug: string | null; mountExpiresAt: Date | null },
  now: Date,
): MountTemplate | null {
  if (!char.mountSlug || !char.mountExpiresAt) return null;
  if (char.mountExpiresAt.getTime() <= now.getTime()) return null;
  return REGISTRY.mounts.get(char.mountSlug) ?? null;
}

/**
 * Stosuje redukcję czasu wynikającą z wierzchowca. `mount = null` → duration
 * bez zmian. Wartości procentowe capowane do `MOUNT_SPEED_CAP_PCT` żeby DB
 * content-edit nie mógł wygenerować `endsAt` ujemnego lub równego now().
 */
export function applyMountSpeed(durationMs: number, mount: MountTemplate | null): number {
  if (!mount) return durationMs;
  const pct = Math.min(MOUNT_SPEED_CAP_PCT, Math.max(0, mount.speedPct));
  return Math.ceil(durationMs * (1 - pct / 100));
}

/**
 * Seed źródłowy. Trzy tier'y z rosnącą mocą; każdy sensowny w innym momencie
 * progressu. `sortOrder` trzyma porządek wyświetlania w ScreenStables nawet
 * jeśli admin zmieni ceny w DataGrip.
 */
export const MOUNT_TEMPLATES = [
  {
    slug: 'mount-kucyk',
    name: 'Kucyk Bogdan',
    icon: 'pony',
    desc: 'Stary, ale idzie równo. Nie pyta o cel.',
    speedPct: 20,
    price: 400,
    rentalHours: 24,
    requiredLvl: 1,
    sortOrder: 1,
  },
  {
    slug: 'mount-szkapa',
    name: 'Szkapa Kazimierz',
    icon: 'horse',
    desc: 'Nerwowy. Szybki. Ma zdanie na każdy temat.',
    speedPct: 40,
    price: 1_500,
    rentalHours: 24,
    requiredLvl: 5,
    sortOrder: 2,
  },
  {
    slug: 'mount-ogier',
    name: 'Ogier Bojowy',
    icon: 'warhorse',
    desc: 'Gryzie. Kopie. Dowozi.',
    speedPct: 60,
    price: 4_500,
    rentalHours: 24,
    requiredLvl: 10,
    sortOrder: 3,
  },
  {
    slug: 'mount-marchewka',
    name: 'Klacz Marchewka',
    icon: 'horse',
    desc: 'Lubi marchew. Inne też. Zjadła kowala raz, ale to jego wina.',
    speedPct: 65,
    price: 12_000,
    rentalHours: 24,
    requiredLvl: 18,
    sortOrder: 4,
  },
  {
    slug: 'mount-diabelska',
    name: 'Diabelska Klacz',
    icon: 'warhorse',
    desc: 'Czerwone oczy. Zimny pysk. Nie pyta dokąd, wie sama.',
    speedPct: 72,
    price: 35_000,
    rentalHours: 24,
    requiredLvl: 30,
    sortOrder: 5,
  },
  {
    slug: 'mount-mara',
    name: 'Mara Skrzydlata',
    icon: 'warhorse',
    desc: 'Skrzydeł nie ma. Nazwa się przyjęła. I tak dowozi szybciej niż reszta.',
    speedPct: 80,
    price: 90_000,
    rentalHours: 24,
    requiredLvl: 45,
    sortOrder: 6,
  },
] as const;

export type MountSeed = (typeof MOUNT_TEMPLATES)[number];
