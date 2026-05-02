// Tiny client-side mirror of the gem-pack catalog so we can map between the
// in-shop pack id ('p3') and Google Play product id ('gems1200') without a
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
// SKU. Jawne mapowanie bo Play Console rejekt'uje separatory („-", „_"),
// więc SKU to alphanumeric continuous string (np. `gems450`, `ratburgplus30`).
const PACKAGES: readonly ClientGemPackage[] = [
  { id: 'p1', googlePlayProductId: 'gems80' },
  { id: 'p2', googlePlayProductId: 'gems450' },
  { id: 'p3', googlePlayProductId: 'gems1200' },
  { id: 'p4', googlePlayProductId: 'gems2800' },
  { id: 'p5', googlePlayProductId: 'gems6500' },
  { id: 'vip30', googlePlayProductId: 'ratburgplus30' },
];

export function findPackageById(id: string): ClientGemPackage | undefined {
  return PACKAGES.find((p) => p.id === id);
}
