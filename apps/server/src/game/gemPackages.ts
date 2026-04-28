// Gem-pack catalog — single source of truth shared by client and server.
//
// Each entry maps a logical pack id (`p1`..`p5`) to:
//   - `gems` — exact amount credited on successful verification
//   - `googlePlayProductId` — SKU as configured in Google Play Console.
//     **Must match exactly** or `verifyPlay` returns SKU_MISMATCH and the
//     server refuses to credit (defends against malicious replay of cheap
//     SKU tokens against expensive packs).
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
}

export const GEM_PACKAGES: readonly GemPackage[] = [
  { id: 'p1', gems: 80,   bonus: 0,  googlePlayProductId: 'gems_p1' },
  { id: 'p2', gems: 450,  bonus: 12, googlePlayProductId: 'gems_p2' },
  { id: 'p3', gems: 1200, bonus: 25, googlePlayProductId: 'gems_p3' },
  { id: 'p4', gems: 2800, bonus: 40, googlePlayProductId: 'gems_p4' },
  { id: 'p5', gems: 6500, bonus: 55, googlePlayProductId: 'gems_p5' },
  // VIP — Phase 1: one-shot consumable z premium gem-grant (3000 gemów).
  // Phase 2 doda `vip_expires_at` na characterze + premium perks (daily
  // gems, +50% gold, crown). Na razie kupujący dostają 3000 gemów (~30
  // dni × ~100/dzień) jako wymierna wartość pasująca do brandu „SUBSKRYPCJA".
  { id: 'vip30', gems: 3000, bonus: 0, googlePlayProductId: 'vip_30days' },
] as const;

export function findPackageByProductId(productId: string): GemPackage | undefined {
  return GEM_PACKAGES.find((p) => p.googlePlayProductId === productId);
}

export function findPackageById(id: string): GemPackage | undefined {
  return GEM_PACKAGES.find((p) => p.id === id);
}
