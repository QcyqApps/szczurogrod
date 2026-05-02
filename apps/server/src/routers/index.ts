import { router } from '../trpc/trpc.js';
import { achievementsRouter } from './achievements.js';
import { adminRouter } from './admin.js';
import { arenaRouter } from './arena.js';
import { authRouter } from './auth.js';
import { blacksmithRouter } from './blacksmith.js';
import { blessingRouter } from './blessing.js';
import { combatRouter } from './combat.js';
import { dailyRouter } from './daily.js';
import { devRouter } from './dev.js';
import { diceRouter } from './dice.js';
import { gemShopRouter } from './gemShop.js';
import { guildRouter } from './guild.js';
import { guildBuildingsRouter } from './guildBuildings.js';
import { guildRaidsRouter } from './guildRaids.js';
import { guildTreasuryRouter } from './guildTreasury.js';
import { guildWarsRouter } from './guildWars.js';
import { scrapbookRouter } from './scrapbook.js';
import { seasonPassRouter } from './seasonPass.js';
import { towerRouter } from './tower.js';
import { inventoryRouter } from './inventory.js';
import { landingRouter } from './landing.js';
import { leaderboardsRouter } from './leaderboards.js';
import { meRouter } from './me.js';
import { oracleRouter } from './oracle.js';
import { patchesRouter } from './patches.js';
import { paypalRouter } from './paypal.js';
import { questsRouter } from './quests.js';
import { shopRouter } from './shop.js';
import { stablesRouter } from './stables.js';
import { survivorRouter } from './survivor.js';
import { tavernRouter } from './tavern.js';
import { townRouter } from './town.js';
import { tracksRouter } from './tracks.js';
import { trainerRouter } from './trainer.js';
import { witchRouter } from './witch.js';
import { workRouter } from './work.js';
import { worldRouter } from './world.js';
import { worldBossRouter } from './worldBoss.js';

export const appRouter = router({
  achievements: achievementsRouter,
  admin: adminRouter,
  arena: arenaRouter,
  auth: authRouter,
  blacksmith: blacksmithRouter,
  blessing: blessingRouter,
  combat: combatRouter,
  daily: dailyRouter,
  dev: devRouter,
  dice: diceRouter,
  gemShop: gemShopRouter,
  guild: guildRouter,
  guildBuildings: guildBuildingsRouter,
  guildRaids: guildRaidsRouter,
  guildTreasury: guildTreasuryRouter,
  guildWars: guildWarsRouter,
  inventory: inventoryRouter,
  landing: landingRouter,
  leaderboards: leaderboardsRouter,
  me: meRouter,
  oracle: oracleRouter,
  patches: patchesRouter,
  paypal: paypalRouter,
  quests: questsRouter,
  scrapbook: scrapbookRouter,
  seasonPass: seasonPassRouter,
  shop: shopRouter,
  stables: stablesRouter,
  survivor: survivorRouter,
  tavern: tavernRouter,
  tower: towerRouter,
  town: townRouter,
  tracks: tracksRouter,
  trainer: trainerRouter,
  witch: witchRouter,
  work: workRouter,
  world: worldRouter,
  worldBoss: worldBossRouter,
});

export type AppRouter = typeof appRouter;
