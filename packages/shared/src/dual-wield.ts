// Dual-wield helpers — używane przez server i web.
//
// Konwencja: każda broń typu "sztylet" ma icon zaczynający się od `dagger`
// (`dagger`, `dagger-mist`, `dagger-spire`, `daggers-flame` itd.). Łotrzyk
// może założyć drugi sztylet w slot off-hand zamiast tarczy. To jedyne
// dual-wield w grze — wojownik nadal może mieć tylko miecz+tarczę,
// mag staff/orb tylko w głównej ręce.
//
// Reguła load-bearing: PRZY DODAWANIU NOWEJ broni typu sztylet ZAWSZE używaj
// icon z prefixem `dagger`. Brak prefixa = item nie wejdzie w off-slot dla
// łotrzyka mimo że tematycznie pasuje. Alternatywą byłby `subtype` field
// w schemacie itemów ale to jeden join slot, jedna klasa, jeden subtype —
// konwencja icon prefixa wystarcza.

import type { CharacterClass } from './character';
import type { InventoryItem, ItemSlot } from './schemas';

/**
 * True jeśli item to sztylet (broń typu dagger). Używa icon prefixa
 * `dagger` jako single source of truth.
 */
export function isDaggerWeapon(item: { slot: ItemSlot; icon: string }): boolean {
  return item.slot === 'weapon' && item.icon.startsWith('dagger');
}

/**
 * True gdy postać może założyć ten item w slot off-hand. Reguły:
 *   - shieldy/tarcze (slot='off') — wszyscy.
 *   - sztylety (dagger weapons) — tylko łotrzyk, dla dual-wield.
 */
export function canEquipInOffSlot(
  cls: CharacterClass,
  item: { slot: ItemSlot; icon: string },
): boolean {
  if (item.slot === 'off') return true;
  if (cls === 'rogue' && isDaggerWeapon(item)) return true;
  return false;
}

/** Lekka wersja dla konsumentów którzy mają tylko `InventoryItem`. */
export function canEquipInventoryInOffSlot(
  cls: CharacterClass,
  item: InventoryItem,
): boolean {
  return canEquipInOffSlot(cls, item);
}
