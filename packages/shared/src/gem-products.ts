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

// Play Console product ID conventions: lowercase alphanumeric, bez separatorów.
// Nasz Play Console rejekt'uje zarówno "_" jak i "-" w product ID, więc IDs
// to jeden continuous string. Nazwy zawierają liczbę gemów base'owych (bez
// bonusu) żeby było jasne co gracz dostaje.
export const GEM_PRODUCT_IDS = [
  'gems80',
  'gems450',
  'gems1200',
  'gems2800',
  'gems6500',
  // Specjalna oferta — promo pack 1500 gemów, taniej niż standardowe.
  'gemsroyal',
  // VIP — wpięte przez ten sam pipeline (consumable in-app product w Play
  // Console, NIE subskrypcja recurring). Realna subskrypcja z auto-renew
  // wymaga osobnego SKU subscription type + server-side handlerów RTDN —
  // Phase 2. Na razie one-shot 30-dniowy boost z premium gemsami.
  'ratburgplus30',
] as const;

export type GemProductId = (typeof GEM_PRODUCT_IDS)[number];
