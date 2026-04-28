// Tiny client-side mirror of the gem-pack catalog so we can map between the
// in-shop pack id ('p3') and Google Play product id ('gems_p3') without a
// server round-trip on every buy click. Server stays authoritative for
// crediting; this is just the SKU-resolution table for the native plugin.
//
// Must stay in sync with apps/server/src/game/gemPackages.ts. Keep this
// file boring and short — the moment it grows complexity, move to a
// shared package or a server-fetched catalog.

import type { GemProductId } from '@grodno/shared';

export interface ClientGemPackage {
  id: string;
  googlePlayProductId: GemProductId;
}

// Mapping między packId używanym w UI (`p1`..`p5`, `vip30`) a Google Play
// SKU. Jawne mapowanie bo SKU dla VIP nie pasuje do prostej konwencji
// `gems_<id>`.
const PACKAGES: readonly ClientGemPackage[] = [
  { id: 'p1', googlePlayProductId: 'gems_p1' },
  { id: 'p2', googlePlayProductId: 'gems_p2' },
  { id: 'p3', googlePlayProductId: 'gems_p3' },
  { id: 'p4', googlePlayProductId: 'gems_p4' },
  { id: 'p5', googlePlayProductId: 'gems_p5' },
  { id: 'vip30', googlePlayProductId: 'vip_30days' },
];

export function findPackageById(id: string): ClientGemPackage | undefined {
  return PACKAGES.find((p) => p.id === id);
}
