// Hardcoded list of gem-pack product IDs registered with Google Play.
// Single source of truth — both server (`apps/server/src/game/gemPackages.ts`)
// and client (`apps/web/src/native/billing.ts`) consume this constant.
//
// Adding a new pack:
//   1. Append id here.
//   2. Add the matching entry in server's GEM_PACKAGES with the same
//      `googlePlayProductId`.
//   3. Create the in-app product in Google Play Console with this exact ID.
//
// Note: this is a *list of SKUs*, not the catalog. Gem amounts and bonuses
// live server-side because the server is authoritative for crediting. The
// client only needs the IDs to register with the native IAP plugin (so
// the plugin can pull localized prices from Play Billing).

export const GEM_PRODUCT_IDS = [
  'gems_p1',
  'gems_p2',
  'gems_p3',
  'gems_p4',
  'gems_p5',
  // VIP — wpięte przez ten sam pipeline (consumable in-app product w Play
  // Console, NIE subskrypcja recurring). Realna subskrypcja z auto-renew
  // wymaga osobnego SKU subscription type + server-side handlerów RTDN —
  // Phase 2. Na razie one-shot 30-dniowy boost z premium gemsami.
  'vip_30days',
] as const;

export type GemProductId = (typeof GEM_PRODUCT_IDS)[number];
