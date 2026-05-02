// Server zwraca user-facing error messages po polsku (TRPCError.message)
// — tu mapujemy znane polskie stringi na klucze i18n, żeby gracz EN widział
// przetłumaczone toasty.
//
// To jest whitelist — nieznane stringi przechodzą bez zmian (graceful
// degradation: PL gracz dostanie oryginalny string, EN gracz zobaczy PL
// zamiast crashu). Każdy nowy server-side message wymagający tłumaczenia →
// dopisz tutaj wpis Pl→DictKey + dict.ts entry.

import type { DictKey } from './dict';
import { tStatic } from './use-t';

/** Mapowanie polskich stringów z serwera → klucze i18n. */
const SERVER_ERROR_MAP: Record<string, DictKey> = {
  'Pracujesz. Wróć do tablicy pracy żeby skończyć albo wyjść.': 'error.work.blocksCombat',
};

/**
 * Tłumaczy znany polski server-side error message na bieżący język UI.
 * Nieznane stringi zwraca bez zmian.
 */
export function translateServerError(message: string): string {
  const key = SERVER_ERROR_MAP[message];
  if (key) return tStatic(key);
  return message;
}
