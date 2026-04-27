// Prosta kolejka toastów (non-blocking notifications). `push` dodaje
// wiadomość z unikalnym id, auto-shift po `Toast.ttlMs` steruje ToastContainer.
// Bez persystencji — toast to efemerycz.

import { create } from 'zustand';

export interface Toast {
  id: number;
  text: string;
  /** Short tag na lewej krawędzi (np. „TROP"). Optional. */
  tag?: string;
  /** Kolor accent (tag background + border). Default złoty. */
  accent?: string;
  /** Jak długo pokazywać zanim się schowa. Default 3200ms. */
  ttlMs?: number;
}

interface ToastQueueState {
  queue: Toast[];
  push: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastQueue = create<ToastQueueState>((set) => ({
  queue: [],
  push: (toast) =>
    set((state) => ({
      queue: [...state.queue, { id: nextId++, ...toast }],
    })),
  dismiss: (id) =>
    set((state) => ({ queue: state.queue.filter((t) => t.id !== id) })),
}));
