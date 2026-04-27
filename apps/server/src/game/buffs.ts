// Timed buffy z mikstur-elixirów.
//
// Semantyka:
// - Jeden aktywny buff danej kategorii per postać (PK w DB wymusza). Ponowne
//   wypicie mikstury tej samej kategorii nadpisuje magnitude + expiresAt.
// - `*_pct` = procentowy boost do hpMax/mpMax (25 = +25%). Cap current HP
//   nie jest mutowany w DB — efektywny hpMax liczymy przy każdym me.get /
//   combat.engage. Po wygaśnięciu buff'a HP zostaje wyklampowany do base cap
//   (lazy-clamp w me.get).
// - `*_flat` = sztywne +N do staty (atk/def/mag/spd). Doliczamy w kompozycji
//   CombatFighter, bez dotykania `characters.stats`.
//
// Usunięcie wygasłych wierszy robimy lazy w `me.get`; wystarcza jeden DELETE
// per wywołanie. Między me.get'ami wiersz może istnieć z expiresAt < now —
// `loadActiveBuffs` filtruje in-flight.

import { and, eq, lt } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { characterBuffs } from '../db/schema.js';

export type BuffKind =
  | 'hp_max_pct'
  | 'mp_max_pct'
  | 'atk_flat'
  | 'def_flat'
  | 'mag_flat'
  | 'spd_flat';

export const ALL_BUFF_KINDS: readonly BuffKind[] = [
  'hp_max_pct',
  'mp_max_pct',
  'atk_flat',
  'def_flat',
  'mag_flat',
  'spd_flat',
];

export interface ActiveBuff {
  kind: BuffKind;
  magnitude: number;
  expiresAt: Date;
  sourceItemId: string | null;
  /**
   * True = klątwa (efekt negatywny). Magnitude jest ZAWSZE dodatnie w DB
   * — aggregateBuffs odejmuje gdy isCurse=true. Pozwala mieć jednocześnie
   * pozytywny buff i negatywną klątwę na tej samej staty (PK w DB
   * obejmuje is_curse). Klątwy zdejmowane u Baby Jagi (router `witch`).
   */
  isCurse: boolean;
}

/** Suma płaskich deltek + procentowych mnożników. */
export interface BuffDeltas {
  atkFlat: number;
  defFlat: number;
  magFlat: number;
  spdFlat: number;
  hpMaxPct: number;
  mpMaxPct: number;
}

export const ZERO_DELTAS: BuffDeltas = {
  atkFlat: 0,
  defFlat: 0,
  magFlat: 0,
  spdFlat: 0,
  hpMaxPct: 0,
  mpMaxPct: 0,
};

/** Pobiera aktywne (nieprzeterminowane) buffy postaci. */
export async function loadActiveBuffs(
  db: Pick<Db, 'select'>,
  characterId: string,
  now: Date = new Date(),
): Promise<ActiveBuff[]> {
  const rows = await db
    .select()
    .from(characterBuffs)
    .where(eq(characterBuffs.characterId, characterId));
  return rows
    .filter((r) => r.expiresAt.getTime() > now.getTime())
    .map((r) => ({
      kind: r.kind as BuffKind,
      magnitude: r.magnitude,
      expiresAt: r.expiresAt,
      sourceItemId: r.sourceItemId,
      isCurse: r.isCurse,
    }));
}

/** Agreguje listę aktywnych buff'ów + klątw do deltek. Klątwy są odejmowane
 *  od deltek (magnitude jest zawsze dodatnie w DB, sign'a daje `isCurse`). */
export function aggregateBuffs(buffs: readonly ActiveBuff[]): BuffDeltas {
  const d: BuffDeltas = { ...ZERO_DELTAS };
  for (const b of buffs) {
    const signed = b.isCurse ? -b.magnitude : b.magnitude;
    switch (b.kind) {
      case 'hp_max_pct':
        d.hpMaxPct += signed;
        break;
      case 'mp_max_pct':
        d.mpMaxPct += signed;
        break;
      case 'atk_flat':
        d.atkFlat += signed;
        break;
      case 'def_flat':
        d.defFlat += signed;
        break;
      case 'mag_flat':
        d.magFlat += signed;
        break;
      case 'spd_flat':
        d.spdFlat += signed;
        break;
    }
  }
  return d;
}

/** Efektywny cap z buff/klątwą procentową. `pct=25` → baseMax * 1.25;
 *  `pct=-10` → baseMax * 0.9. Klamp na 0.5× baseMax floor — nawet stacked
 *  klątwami gracz nie spadnie poniżej połowy swoich statów. */
export function effectiveMax(baseMax: number, pct: number): number {
  if (pct === 0) return baseMax;
  const mult = Math.max(0.5, 1 + pct / 100);
  return Math.round(baseMax * mult);
}

/**
 * Upsert buff'a lub klątwy. Gdy postać ma już wiersz z tą samą (kind,
 * isCurse) kombinacją — nadpisuje magnitude + expiresAt (override, nie
 * stacking). PK zawiera isCurse więc buff i klątwa tej samej `kind`
 * koegzystują w osobnych wierszach. Zwraca nowy `expiresAt`.
 */
export async function applyBuff(
  db: Pick<Db, 'insert'>,
  characterId: string,
  kind: BuffKind,
  magnitude: number,
  durationHours: number,
  sourceItemId: string | null,
  now: Date = new Date(),
  isCurse: boolean = false,
): Promise<Date> {
  const expiresAt = new Date(now.getTime() + durationHours * 3600 * 1000);
  await db
    .insert(characterBuffs)
    .values({
      characterId,
      kind,
      magnitude,
      expiresAt,
      sourceItemId,
      appliedAt: now,
      isCurse,
    })
    .onConflictDoUpdate({
      target: [characterBuffs.characterId, characterBuffs.kind, characterBuffs.isCurse],
      set: {
        magnitude,
        expiresAt,
        sourceItemId,
        appliedAt: now,
      },
    });
  return expiresAt;
}

/** Usuwa wszystkie wygasłe wiersze postaci (jeden DELETE). */
export async function purgeExpiredBuffs(
  db: Pick<Db, 'delete'>,
  characterId: string,
  now: Date = new Date(),
): Promise<void> {
  await db
    .delete(characterBuffs)
    .where(and(eq(characterBuffs.characterId, characterId), lt(characterBuffs.expiresAt, now)));
}
