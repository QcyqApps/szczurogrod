// Chapter catalog — used for intro modals when player crosses the gate level.

import type { ChapterId } from '@grodno/shared';

export interface ChapterDef {
  id: ChapterId;
  requiredLvl: number;
  name: string;
  subtitle: string;
  flavor: string;
}

export const CHAPTERS: readonly ChapterDef[] = [
  {
    id: 'akt-1',
    requiredLvl: 1,
    name: 'AKT I',
    subtitle: 'Szczurogród',
    flavor:
      'Bramy otwarte, wiedźma głodna, a w ciasteczarni ruch. Idealne miejsce, żeby zacząć od tego grzyba.',
  },
  {
    id: 'akt-2',
    requiredLvl: 6,
    name: 'AKT II',
    subtitle: 'Las Kunowy',
    flavor:
      'Drzewa szepczą, mgła kłamie, pająki tańczą. W lesie nic nie jest proste, ale serki znaleźć trzeba.',
  },
  {
    id: 'akt-3',
    requiredLvl: 11,
    name: 'AKT III',
    subtitle: 'Katakumby Tronu',
    flavor:
      'Pod miastem coś szepcze twoje imię. Pieczęć pękła. Hobgoblin King czeka. Trzymaj się lustra i świeczki.',
  },
  {
    id: 'akt-4',
    requiredLvl: 16,
    name: 'AKT IV',
    subtitle: 'Puszcza Cień',
    flavor:
      'Drzewa wiedzą, kurhany pamiętają, Panna Leszczyna nie wybacza. Las oddycha powoli — ty też tak musisz.',
  },
  {
    id: 'akt-5',
    requiredLvl: 33,
    name: 'AKT V',
    subtitle: 'Bagna Czarnej Strzygi',
    flavor:
      'Błoto sięga kolan, a potem głębiej. Topielcy znają cię z imienia. Strzyga czeka w altanie. Nie zdejmuj butów.',
  },
  {
    id: 'akt-6',
    requiredLvl: 48,
    name: 'AKT VI',
    subtitle: 'Granie Strzelistych Iglic',
    flavor:
      'Powietrze tnie jak ostrze, a kamień nie wybacza. Skarbnik liczy kości tych, którzy weszli za wysoko. Halny dmucha — i ktoś znika.',
  },
];

export function getChapterByLevel(lvl: number): ChapterDef {
  let best = CHAPTERS[0];
  for (const ch of CHAPTERS) {
    if (ch.requiredLvl <= lvl) best = ch;
  }
  return best;
}

export function getChapterUnlockedAt(lvl: number): ChapterDef | null {
  return CHAPTERS.find((c) => c.requiredLvl === lvl) ?? null;
}
