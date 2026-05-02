// Gem-pack catalog — single source of truth shared by client and server.
//
// Each entry maps a logical pack id (`p1`..`p5`, `vip30`) to:
//   - `gems` — exact amount credited on successful verification
//   - `googlePlayProductId` — SKU as configured in Google Play Console.
//     **Must match exactly** or `verifyPlay` returns SKU_MISMATCH and the
//     server refuses to credit (defends against malicious replay of cheap
//     SKU tokens against expensive packs).
//   - `priceGrosze` + `currency` — price autoritatywne na serwerze.
//     PayPal createOrder bierze tę kwotę. Klient pokazuje localized string
//     ale **nigdy** nie wysyła amount'u — server zawsze sam wpisuje. Inaczej
//     gracz mógłby kupić p5 (6500 gemów) za cenę p1.
//
// Google Play Console product creation:
//   1. App → Monetize → Products → In-app products → Create product
//   2. Product ID = `googlePlayProductId` below (immutable after create!)
//   3. Set price in PLN (Google fans-out to all currencies)
//   4. Status: Active
//
// Bundles (gold + items + gems mixes) are NOT yet wired through real IAP —
// they stay in dev-grant land until a focused release adds receipt-encoded
// bundle payloads.

export interface GemPackage {
  id: string;
  gems: number;
  bonus: number;
  googlePlayProductId: string;
  /** Cena w groszach (1 PLN = 100 groszy). Server-side authoritative. */
  priceGrosze: number;
  /** ISO-4217. PayPal akceptuje PLN. */
  currency: 'PLN';
  /**
   * Dni subskrypcji Szczurogród+ przyznane razem z gemami. Gdy `> 0`, grant
   * oprócz `gems` extenduje `characters.szczurogrodPlusUntil` (cap 90 dni
   * od now). Używane przez vip30 — paczka VIP daje też +20% XP przez 30 dni.
   */
  subscriptionDays?: number;
}

export const GEM_PACKAGES: readonly GemPackage[] = [
  { id: 'p1', gems: 80,   bonus: 0,  googlePlayProductId: 'gems80', priceGrosze:    499, currency: 'PLN' },
  { id: 'p2', gems: 450,  bonus: 12, googlePlayProductId: 'gems450', priceGrosze:   1999, currency: 'PLN' },
  { id: 'p3', gems: 1200, bonus: 25, googlePlayProductId: 'gems1200', priceGrosze:   4999, currency: 'PLN' },
  { id: 'p4', gems: 2800, bonus: 40, googlePlayProductId: 'gems2800', priceGrosze:   9999, currency: 'PLN' },
  { id: 'p5', gems: 6500, bonus: 55, googlePlayProductId: 'gems6500', priceGrosze:  19999, currency: 'PLN' },
  // sp1 = „Królewska oferta" w UI (`gemShop.special.*`). Promo pack — taniej
  // za gem niż p1..p5. Klient marketinguje to jako 70% off; tu zawsze dostępne.
  { id: 'sp1', gems: 1500, bonus: 0, googlePlayProductId: 'gemsroyal', priceGrosze: 1499, currency: 'PLN' },
  // VIP — 3000 gemów upfront (≈ 100 dziennie × 30 dni) + 30 dni subskrypcji
  // Szczurogród+ z bonusem +20% XP. Cena 19.99 PLN. Marketing copy
  // (`gemShop.vip.perk*`) musi pasować do faktycznego grantu.
  { id: 'vip30', gems: 3000, bonus: 0, googlePlayProductId: 'ratburgplus30', priceGrosze: 1999, currency: 'PLN', subscriptionDays: 30 },
] as const;

// ===== Bundle packages — gems + gold + items (PayPal only, na razie) =====
// Native (Play Billing) ich nie obsługuje, bo wymagałyby SKU per-bundle
// w Play Console + receipt-encoded payload. Klient (`ScreenGemShop.BUNDLES`)
// ma własny display catalog; serwer dostaje tylko id przy createOrder
// i decyduje cenę + payload tutaj. Item template ids muszą istnieć w
// `SHOP_CATALOG` (game/shop.ts) — w przeciwnym razie grant fail'uje.
export interface BundlePackage {
  id: string;
  gems: number;
  bonus: number;
  priceGrosze: number;
  currency: 'PLN';
  /** Bonus gold credit (UPDATE characters.gold). */
  goldBonus?: number;
  /** Item template ids inserted as character_items rows (one per id, dupli-
   *  cates allowed dla "x5 mikstur"). */
  itemTemplateIds?: readonly string[];
}

// `itemTemplateIds` to NAZWY itemów (lookup `REGISTRY.itemsByName.get`), NIE
// shop catalog id'ki ('s9', 's14', ...). Kluczem w `REGISTRY.items` jest
// content-hash z `seed.ts::contentId(item)`, niemożliwy do zhardcoded'owania.
// Lookup przez nazwę → stabilna względem rebuild'a hash'a. Zmiana nazwy itemu
// wymaga update'u tutaj (drift = silent skip + console.warn w PayPal grant).
export const BUNDLE_PACKAGES: readonly BundlePackage[] = [
  {
    id: 'b1',
    gems: 300,
    bonus: 0,
    priceGrosze: 999,
    currency: 'PLN',
    goldBonus: 5_000,
    itemTemplateIds: ['Miecz Świtu'],
  },
  {
    id: 'b2',
    gems: 800,
    bonus: 0,
    priceGrosze: 2499,
    currency: 'PLN',
    itemTemplateIds: [
      'Kostur Chaosu',
      'Mikstura Głębokiej Many',
      'Mikstura Głębokiej Many',
      'Mikstura Głębokiej Many',
      'Mikstura Głębokiej Many',
      'Mikstura Głębokiej Many',
    ],
  },
];

export function findBundleById(id: string): BundlePackage | undefined {
  return BUNDLE_PACKAGES.find((b) => b.id === id);
}

export function findPackageByProductId(productId: string): GemPackage | undefined {
  return GEM_PACKAGES.find((p) => p.googlePlayProductId === productId);
}

export function findPackageById(id: string): GemPackage | undefined {
  return GEM_PACKAGES.find((p) => p.id === id);
}

/** Zunifikowany lookup dla PayPal — zarówno gem packages jak i bundle. */
export type PaypalPaymentTarget =
  | { kind: 'gems'; pkg: GemPackage }
  | { kind: 'bundle'; pkg: BundlePackage };

export function findPaypalTarget(id: string): PaypalPaymentTarget | null {
  const gems = findPackageById(id);
  if (gems) return { kind: 'gems', pkg: gems };
  const bundle = findBundleById(id);
  if (bundle) return { kind: 'bundle', pkg: bundle };
  return null;
}

/** Format dla PayPal `value` field — "X.YZ" string z 2 cyframi po kropce. */
export function priceToPayPalAmount(grosze: number): string {
  const major = Math.floor(grosze / 100);
  const minor = grosze % 100;
  return `${major}.${minor.toString().padStart(2, '0')}`;
}
