# CLAUDE.md

Guidance dla Claude Code przy pracy nad tym repo.

## Project

**Szczurogród** (EN: Ratburg) — Polish mobile-first idle RPG, server-authoritative. Web-first, planowany Capacitor na Google Play. Zbudowany z HTML handoff'u Claude Design; oryginalny prototyp trzymamy read-only w `design/`.

Side game **Szczurogród: Okruchy** (`apps/survivor/`, port `:5174`) — landscape survivor-shooter spinoff współdzielący auth/users z głównym apps/web. Osobna waluta (`okruchy`), osobne tabele DB, osobny tRPC router (`survivor.*`). Szczegóły: [docs/survivor.md](docs/survivor.md).

## Commands (z repo root)

| Command | What |
|---------|------|
| `pnpm install` | Bootstrap workspace deps. |
| `pnpm dev` | Web **i** server dev równolegle. |
| `pnpm dev:web` / `pnpm dev:server` | Pojedynczy workspace. |
| `pnpm typecheck` | `tsc -b` across all workspaces. |
| `pnpm build` | Production build. |
| `pnpm lint` | ESLint flat config w repo root. |
| `pnpm test` | Vitest (92 testów na pure game functions). |
| `pnpm db:up` / `db:down` | Postgres + Adminer (docker-compose). |
| `pnpm db:migrate` | Aplikuje Drizzle migracje (`tsx src/db/migrate.ts`). |
| `pnpm db:generate` | Generuje migrację ze schema diff. |

Postgres host **:5434** (5432 i 5433 zajęte przez inne lokalne projekty). Server **:4000**, Vite **:5173**.

## Monorepo — trzy paczki

- `apps/web/` — Vite + React 18 + TS strict. Entry: `src/main.tsx`. Path alias `@/*` → `apps/web/src/*`.
- `apps/server/` — Fastify + tRPC v11 + Drizzle + node-postgres. Auth: JWT (jose) + argon2id. Eksportuje router type przez `exports["."].types: "./src/routers/index.ts"` więc web importuje `type { AppRouter } from '@grodno/server'` bez build step.
- `packages/shared/` — Runtime Zod schemas + TS types dzielone przez web+server. Dodanie nowego API shape tutaj jest load-bearing: tRPC input schema ORAZ DTO type żyją w jednym pliku żeby klient types były inferowane end-to-end.

## Cross-cutting invariants (MUST FOLLOW)

### Server-authoritative by design

Klient **nigdy nie mutuje** character/gold/gems/XP. Wysyła intents (`quests.start`, `combat.attack`, `shop.buy`, `trainer.buyStat`), server waliduje every precondition i commituje. Łamanie tego łamie anti-cheat.

- **XP → level-up**: każdy route przyznający XP **musi** wywołać `applyXpGain(characterProgression, xpGained)` z `apps/server/src/game/leveling.ts`, potem persistować whole progression slice (`lvl`, `xp`, `xpMax`, `hp/hpMax`, `mp/mpMax`, `stamina/staminaMax`) w jednym UPDATE. Zwracanie `summarizeLevelUps(leveling.ups)` w response triggeruje kliencki `LevelUpModal`. Podpięte w `routers/quests.ts` (collect), `routers/combat.ts` (applyVictoryReward), `routers/daily.ts` (claim).
- **Content gating**: każdy quest/enemy/shop item ma `requiredLvl` + `chapter: 'akt-1' | 'akt-2' | 'akt-3' | 'akt-4'`. List routery filtrują do `requiredLvl <= char.lvl + N` (quests: +1, shop: +2) żeby UI pokazywał locked items jeden tier forward. Mutation routery (start/buy/engage) re-checkują serwer-side.
- **Class restrictions on items**: `LootTemplate` + `ShopItemTemplate` mają opcjonalny `allowedClasses?: readonly CharacterClass[]`. Weapons są gated — melee → `warrior + rogue`; casters → `mage`. Armor/potions/trinkets uniwersalne. Filtering w roll time (`rollLoot`, `rollMobLoot`) i list time (`shop.catalog`); mutation routery (`shop.buy`) re-checkują. Dodając broń — **zawsze** taguj `allowedClasses` żeby opposing class nie dostał DoA loot'u.
- **Combat state**: in-memory `Map<combatId, CombatSession>` w `game/combat.ts` z 10-min TTL. RNG dla damage/crit leci server-side w `rollPlayerAttack` / `rollEnemyAttack`; klient animuje tylko reportowane wartości. Skalowanie poza single-instance → move to Redis.
- **Auth**: access JWT (15m) + opaque refresh token (30d, SHA-256 hashed w DB, rotated on refresh). `createContext` w `trpc/context.ts` ustawia `ctx.userId` jeśli `Authorization: Bearer` verify'uje; `protectedProcedure` wymaga.

### Web data flow

- **React Query + tRPC hooks** (`@/api/trpc.ts`). Mutations invalid'ują relevant query caches (`utils.me.get.invalidate()`, `utils.quests.list.invalidate()`, `utils.inventory.list.invalidate()`). Większość mutacji affectuje multiple caches — check existing routers w `App.tsx` for pattern.
- **Zustand** (`@/api/auth-store.ts`) trzyma tylko auth tokens + email/isGuest; persist'owany w localStorage via `persist` middleware. **Brak game state** w Zustand — wszystko z `me.get` query.
- **Brak client-side RNG / combat math / gold math.** Cokolwiek suspicious → serwer.

## Subsystems — detailed docs

Przy pracy nad konkretnym subsystemem czytaj odpowiedni plik:

- **[Combat](docs/combat.md)** — damage formula, 3 attack kinds, enemy abilities, dodge, engage gates, UX polish (sim, flee, boss intro).
- **[Arena PvP](docs/arena.md)** — async snapshot duels, Elo, matchmaking (real + NPC synth), streak, history, chronicle hooks.
- **[Dungeons + regions](docs/dungeons.md)** — chain unlock'i, boss drops, world map, Region 1/2.
- **[Mounts + tropy](docs/mounts-tracks.md)** — stajnie (gold sink, quest speed), tracks (gold×2/xp×2/drop×1.5 na wytropionych).
- **[Item economy](docs/items.md)** — 6 acquisition paths, template_id + snapshot storage, shop one-per-day, comparison UI.
- **[Achievements + Chronicles](docs/achievements-chronicles.md)** — hooki bump'ów, feed eventów, Claude-generated flavor.
- **[Regen + Offline summary](docs/regen-offline.md)** — HP/MP/stamina/keys regen (read-time w me.get), „WITAJ Z POWROTEM" modal.
- **[Game design model](docs/game-design.md)** — uncapped leveling, content bands, class system, DB-driven content + admin.reload workflow.
- **[Survivor (Okruchy)](docs/survivor.md)** — side-game survivor-shooter w `apps/survivor/`. Osobna ekonomia (okruchy), 3 stage'e + bossy, Pixi v8 render, drzewko 11 skilli, balance pass do production-ready feel.

## Conventions

### Content + i18n

- **User-facing strings są po polsku.** Code identifiers zostają po angielsku. Namespace `@grodno/*` + folder `grodno` to historia — rename byłoby 40+ importów bez code benefit. Game jest brandowany jako **Szczurogród** tylko w UI. Capacitor bundle ID to jedyne miejsce które weźmie real brand (M4).
- **Nie zmieniać folderu `design/`.** To original HTML prototype handoff od Claude Design, read-only reference.

### Icon convention — no emoji in UI chrome

**Każda ikona w UI to hand-drawn inline SVG.** Bez emoji (🔑 🐾 ⏱ ⏳ ❌), bez unicode symboli (↺ ✓ ✕ jako dekoracja), bez icon fonts. Powód: game ma chunky hand-drawn aesthetic (grube czarne bordery, ciepła paleta, Luckiest Guy glyphs), platform emoji łamią visual — renderują się jako glossy iOS circles, flat Material blobs, monochrome na kolejnym device. Spójność pada, styl czyta się jako „prototype".

**Dwa icon registries — wybierz właściwy:**
- **Compact resource / pip icons** — `apps/web/src/components/icons/index.tsx`. Małe hand-drawn SVG sized przez `s` prop (default 18). Obecny zestaw: `IcoCoin`, `IcoGem`, `IcoHeart`, `IcoSword`, `IcoShield`, `IcoMagic`, `IcoChest`, `IcoKey`, `IcoPaw`, `IcoClock`, `IcoHourglass`, `IcoRefresh`. Użycie inline obok tekstu: `<span>…<IcoKey s={12} /> 3</span>`.
- **Larger game-icon sprites** — `apps/web/src/components/game-icons/`. Nazwane przez `IconName` string (`sword`, `bolt`, `orb`, `potion`). Użycie: `<GameIcon name="bolt" size={18} />` dla kafli, buttonów, card art.

**Reguły gdy dodajesz UI:**
1. Brakuje ikony? Dodaj do `components/icons/index.tsx` (short SVG, grube `#2a1810` stroke, warm fill z palety). Nie sięgaj po emoji jako stopgap.
2. W plain tekście w long help copy: preferuj słowa nad glyph. *„przycisk odśwież"* czyta się lepiej niż ↺.
3. `✕` akceptowalne TYLKO jako close-button glyph na modalach.
4. Zamiana tekstu na ikonę inline w JSX (np. old `MOCNY ⏱ ${cd}`): restrukturyzuj JSX, wrap w fragment + SVG component. Nie template-literal'uj emoji z powrotem.

### Typography — flavor text minimum 14px

Klasa `.flavor` używa Caveat (handwritten). Caveat ma wąskie glify — poniżej 14px traci czytelność, szczególnie na mobile w jasnym świetle. **Wszystkie elementy z `className="flavor"` / `"flavor light"` muszą mieć `fontSize >= 14`.** CSS baseline w `global.css` ustawia 14px, ale inline style w TSX ma wyższą specyfikę — jeśli dopisujesz `fontSize`, nigdy <14. Hero flavor (splash, title banner'y) OK 17–22. Reguła egzekwowana ad-hoc, bo nie da się wymusić przez CSS bez `!important`, a `!important` psuje intencjonalne podbicia.

### Writing style — Polish, dry, with restraint

Voice gry to **deadpan absurdist humor** po polsku. Terse. Jeden beat per linia. Stanisław Bareja, nie Monty Python.

**Canon examples:**
- `"Staruszka jest głodna. I zła. Jest zgłodniała."` (quest q1)
- `"Mikstura Pierwsza Lepsza — Leczy trochę. Albo wcale."`
- `"Rdzawy Miecz — +5 ATK. Rdza wliczona w cenę."`

**Reguły:**
1. **Humor punktuje informację, nie zastępuje.** Help popup nie jest stand-up'em.
2. **Jeden joke na blok, nie na zdanie.** Piling quips = game czyta się jak toy.
3. **Konkret bije abstrakt.** „Dwa dziennie, bo chowa się w skałach" > „ograniczony limit dziennych zabić".
4. **Krótkie zdania, czasem fragmenty.** („Działa. Smak — pomijalny.") Ale nie fragmentuj *każdej* linii — variation matters.
5. **Brak emoji, spam `!`, CAPS.** Restraint jest żartem. Jeden `!` per response max.
6. **Functional text zostaje functional.** Button labels (`KUP`, `ZAŁÓŻ`, `WYRUSZ`), error messages, stat labels — plain. Comedy w content (quest titles, item descs, flavor), nie w UI chrome.
7. **Gdy wątpisz — tnij.** Dry register buduje się na tym, czego *nie* powiedziałeś.

**Bad (piles on):** „Wiedźma jest głodna jak wilk, zła jak osa, i wygłodzona jak trzydniowy kot!..."
**Good:** „Staruszka jest głodna. I zła. Jest zgłodniała."

## Gotchas

- **pnpm 10 native build scripts**: `argon2` i `esbuild` są whitelistowane w root `package.json` pod `"pnpm.onlyBuiltDependencies"`. Dodając dep z postinstall'em → tam dopisz + `pnpm rebuild <pkg>`.
- **Server używa ESM** (`"type": "module"`). Internal imports **muszą** mieć `.js` suffix nawet z `.ts` files (`import { foo } from './bar.js'`). TS resolver handles it; Node runtime wymaga suffix'a.
- **Drizzle migracje**: edit `apps/server/src/db/schema.ts`, potem `pnpm db:generate` → SQL w `apps/server/src/db/migrations/`, potem `pnpm db:migrate`. Schema changes PR-review'uj PRZED `db:generate` — diff może być szerszy niż oczekiwano.
- **Adding a tRPC router**: create `apps/server/src/routers/<name>.ts`, register w `apps/server/src/routers/index.ts`, input schemas → `packages/shared/src/schemas.ts`. Web picks up zero-wire (type inference through `AppRouter`).
- **Quest/shop/enemy gating**: dodając content, zawsze `requiredLvl` + `chapter`. Server filtruje w `list`/`catalog`; mutations re-checkują. Skip = low-level gracze na endgame content.
- **No MAX_LEVEL cap.** `applyXpGain` cascade'uje nieskończenie; `xpToNext` falls through do `xpFormula` (L15+). Daily reward `levelMultiplier` capped at ×3 (L20+) żeby nie dało absurdu past L100.
- **`xp` / `xp_max` są bigint.** Safe do `Number.MAX_SAFE_INTEGER` (~9·10¹⁵). Dodając content >L60 → double-check threshold w DataGrip: `SELECT 20000 * power(1.14, n-15)` przed designem quest XP.
- **Content edits wymagają reload'u, nie restart'u**: edit content w DataGrip (items/enemies/quests/shop/daily/companions/loot pools), potem `POST /trpc/admin.reload` z `x-admin-token: $ADMIN_TOKEN` header. Server restart też działa (seed-if-empty skipuje, loadContent leci). Bez reload'a in-memory `REGISTRY` zostaje stale i gracze widzą stare dane.
- **Adding new content templates**: najprościej — dopisz do TS array w `game/*.ts` (`QUEST_TEMPLATES`, `SHOP_CATALOG`, `COMPANIONS`, `BOSS_UNIQUE_DROPS`, `DUNGEONS`, `DUNGEON_MOBS`, `MOUNT_TEMPLATES`). Po restart'cie serwera `seedIfEmpty` (mimo nazwy — **gate usunięty**, runs every boot) wrzuca brakujące wiersze przez `onConflictDoNothing()`. Fresh DB dostaje pełny content; istniejące DB dostają top-up. Alternatywnie: edycja w DataGrip + `admin.reload`. Dla nowych TABEL potrzeba migracji.
- **character_items.template_id is nullable**: legacy rows sprzed migracji 0004 (i rows z deleted template) mają `template_id = NULL`. `rowToItem` fallbackuje na snapshot columns. Rozszerzając economy — zawsze setuj template_id (użyj `itemTemplateToRowValues`).
- **Trzy osobne regen timestampy**: stamina = `last_tick_at`, HP = `last_hp_tick_at`, MP = `last_mp_tick_at` (migracja 0009). Nie dotykaj ręcznie — zawsze przez `applyStaminaRegen` / `applyHpRegen` / `applyMpRegen`, advance'ują timestamp tylko consumed ticks.
- **Shop refresh time**: purchases keyowane przez `isoDateUTC()` (shared z quests + daily). Midnight w PL ≠ midnight UTC; polski gracz kupujący 23:00 CET widzi „refresh" w 1h, 00:00 UTC = 01:00 CET. Intentional — aligns all daily timers.
- **Per-mob kill limit breaks farming loops**: tier-1 mobs cap 25/day + 30s cooldowns. Budując idle-flavored feature'y — gracze nie grindują jednego goblina forever; rotują roster lub czekają UTC rollover.
- **Client mirrors of server formulas**: `previewReduce` + `PLAYER_*_SCALE/FLAT` (CombatView), stat-delta math (ScreenChar, ScreenShop), regen interval constants (ScreenDungeon), `DODGE_CAP_BY_CLASS` (ScreenChar — unik preview), mount `speedPct` cap 80 (ScreenQuests) — wszystko duplikuje server math dla UI previews. Zmieniasz `reduce()` / damage constants / heavy miss / key/track regen intervals / dodge caps / mount speed cap → grep mirrors i update in lockstep.
- **Persistent modal animation — `modal-fade-in`, NIE `boss-intro-fade`**: `boss-intro-fade` keyframes 0→1→1→0 (boss intro auto-chowa się po 1.5s). Na persistującym modalu (AchievementUnlockModal, OfflineSummaryModal) daje blink po 0.3s. `modal-fade-in` (from 0 to 1, in-only) w `styles/global.css` rozwiązuje czysto.
- **Offline summary — ref na object-identity**: `App.tsx` musi gatować `seenOfflineSummaryRef` po identity `meQuery.data.offlineSummary`, nie po truthiness lokalnego state. Inaczej zamknięcie modala re-otwiera go z cached query result.
- **Achievement unlock collectors vs fire-and-forget**: wszystkie routery używają `await collectBump(unlocks, db, char, id)` i zwracają `unlockedAchievements: AchievementUnlockPayload[]` w response. Klient w onSuccess pusha do `useUnlockQueue` → modal. Nowy hook? → `collectBump` + extend response. Nie fire-and-forget.
- **Seed.ts runs every boot** (gate usunięty). Każdy INSERT ma `onConflictDoNothing()`. Idempotentny top-up z TS arrays. Cost ~1s conflict-check na start. Nie trzeba bespoke data-migracji dla nowych questów/shop/companions.
- **`tier: 1|2|3|4|5|6`** — tier 5 z Chapterem 2, tier 6 z Chapterem 3 (Bagna). `MobTier` type, `MOB_LOOT_POOLS[6]`, `RARITY_WEIGHTS[6]`, `TIER_DEF[6]`, `TIER_COOLDOWN[6]`, `TIER_DAILY_LIMIT[6]`. Dodając tier 7 → widen w registry.ts + combat.ts + seed.ts naraz.
- **Chapters `akt-1..akt-5`** — akt-5 (Bagna) dodany z Chapterem 3. Zmiany: `chapterIdSchema` (shared/schemas), `Quest.chapter` union (shared/quest), `CHAPTERS` array (server/game/chapters.ts), admin validator `questTemplateInputSchema.chapter`, `QuestTemplatesEditor.CHAPTERS` (web/admin), oraz ścieżki używające `'akt-1' | 'akt-2' | ...` union inline (leveling.ts, tavern.ts). Dodając akt-6 → grep `'akt-4' | 'akt-5'` i extend.

## Where things live (krótka mapa)

| Obszar | Core file |
|---|---|
| DB schema | `apps/server/src/db/schema.ts` |
| Shared API schemas (Zod) | `packages/shared/src/schemas.ts` |
| Shared TS types | `packages/shared/src/{character,quest,appearance,icons}.ts` |
| Content registry (in-memory, load on boot + admin.reload) | `apps/server/src/content/registry.ts` |
| Content seed (TS → DB hydrate) | `apps/server/src/content/seed.ts` |
| Admin reload endpoint | `apps/server/src/routers/admin.ts` |
| Progression math | `apps/server/src/game/leveling.ts` |
| Chapters / akty | `apps/server/src/game/chapters.ts` |
| Trener cost curve | `apps/server/src/game/trainer.ts` |
| Daily (isoDateUTC, streak math) | `apps/server/src/game/daily.ts` |
| Tavern (companions, healer, rumors) | `apps/server/src/game/tavern.ts` |
| Web state machine + router wiring | `apps/web/src/App.tsx` |
| Auth store | `apps/web/src/api/auth-store.ts` |
| Admin token store | `apps/web/src/api/admin-store.ts` |
| Combat prefs store | `apps/web/src/api/combat-prefs-store.ts` |
| Unlock queue store (achievement modal) | `apps/web/src/api/unlock-queue-store.ts` |
| Toast queue store (NOWY TROP itp.) | `apps/web/src/api/toast-queue-store.ts` |
| tRPC provider | `apps/web/src/api/TrpcProvider.tsx` |
| Reusable UI (HelpIcon, LevelUpModal, QuestRewardModal, AchievementUnlockModal, OfflineSummaryModal, ToastContainer, TabBar, TopBar) | `apps/web/src/components/ui-common/` |
| Screens | `apps/web/src/screens/{town,character,quests,dungeon,world,shop,tavern,stables,trainer,daily,gem-shop,achievements,chronicle,creator,settings,arena,guild,auth}/` |

Specyficzne subsystemy — patrz [docs/](docs/).

## Smoke-test pattern for server changes

Przy zmianie server route pair z curl scriptem:

1. Guest account przez `POST /trpc/auth.guest` (response: `result.data.json.accessToken`).
2. Character przez `POST /trpc/me.createCharacter` (payload musi mieć pełny `appearance` + `bonus`).
3. Manipuluj DB state bezpośrednio: `docker exec grodno-postgres psql -U grodno -d grodno -c "UPDATE ..."` żeby wymusić test preconditions (bumping `lvl`, setting `xp` blisko threshold).
4. Call new route, inspectuj response z `python3 -m json.tool`.

Tak weryfikowane każde migrated feature w server-authoritative rewrite.

## Status / what's not done

### Guild — Phase 1-5 DONE (migracje 0036-0042)

5-fazowy rollout ukończony. Decyzje kluczowe:
- **Buffy gildii** tylko PvP + rajdy (arena, guild-wars, raids) — NIE w PvE. Zachowuje balance aktów 1-5.
- **Wojny**: S&F gauntlet z carryover HP. 15 vs 15, lider ustawia kolejność, scheduled+24h → cron resolve.
- **Rajdy**: continuous — boss pada, natychmiast spawnuje następny (tier+1). 3 hity/dzień/członek.
- **Member cap**: 10 → 30 przez Fortecę (L1+5, L2+10, L3+15, L4+20).

**Faza 1 — MVP** (migracje `0036_guilds`, `0037_guild_achievements`):
- Schema: `guilds`, `guild_members`, `guild_chat_messages`, `guild_invites` + `characters.guildId/Rank` denorm.
- Enum `guildRankEnum`: `leader | officer | member | recruit`.
- Router `routers/guild.ts` — 22 endpointy (create, browse, invite/apply/accept/decline/approve/reject, kick/promote/demote/transferLeader, chatList/chatSend/chatDelete, updateMotto/Emblem/Openness, myInvites, pendingApplications, searchCharacter).
- `game/guild-permissions.ts` — `PERMISSIONS` matrix + `assertCan` + `getMembershipOrNull` + `getTargetMembership`.
- Chronicle: `guild_founded`, `guild_joined`.
- Achievementy: `guild_first_create`, `guild_first_join`, `guild_officer_rank`, `guild_leader_rank`, `guild_chat_chatty_100`.
- `me.get` zwraca `guild: { id, name, tag, rank } | null`.
- Client: `apps/web/src/screens/guild/` — `ScreenGuild` shell z 6 tabami, `GuildNoneView`, `GuildTab*` (Members/Chat/Treasury/Buildings/Wars/Raids), modals w `components/` (Create/Invite/Deposit/Withdraw/DeclareWar/Lineup/WarResult/RaidHit).

**Faza 2 — Treasury + budynki + buffy** (migracja `0038_guild_buildings`):
- 3 tabele: `guild_building_templates` (katalog), `guild_buildings` (per-guild level), `guild_treasury_logs` (immutable audit).
- Routery: `guildTreasury` (deposit/withdraw/log), `guildBuildings` (list/upgrade).
- 3 budynki: `fortress` (member cap +5..+20), `altar` (arena/wojen/rajdów buff +2..+10% atk/mag/def), `vault` (daily withdraw cap +10..+40% ponad bazowe 20%).
- Helper `game/guilds.ts::loadGuildWarBuffs` + `applyGuildWarBuffs` — integrowane w `arena.fight`, `guildWars` (commit snapshot), `guildRaids.hit`.
- Content: `game/guild-buildings.ts` seeded via `content/seed.ts`.

**Faza 3 — Wojny S&F gauntlet** (migracje `0039_guild_wars` + `0040_guild_war_achievements`):
- Tabele: `guild_wars` (status scheduled/resolving/resolved/cancelled, scheduledAt, scores, log jsonb), `guild_war_participants` (side + orderIndex + snapshot).
- `guilds.lastWarDeclaredDate` — 1 wojna/dzień cooldown.
- `game/arena.ts::simulateDuelWithHp` — extension z custom startHp + returns winnerHpRemaining (carryover S&F).
- `game/guild-wars.ts::resolveGauntlet` — pure function, sortuje po orderIndex, carryover HP, loser odpada, last standing wygrywa.
- `game/guild-wars-scheduler.ts` — `setInterval(60s)` + initial tick at boot. Claim atomic (scheduled→resolving), resolve, persist log + winner + glory + treasury transfer + chronicle + achievements.
- Router `guildWars` — 7 endpointów (declare officer+, commit, cancelCommit, reorder officer+, browse matchmaking ±10 avg LVL, list, get).
- Chronicle: `guild_war_won`.
- Achievementy: `guild_war_declared`, `guild_war_first_win`, `guild_war_wins_10`.

**Faza 4 — Rajdy continuous S&F** (migracje `0041_guild_raids` + `0042_guild_raid_achievements`):
- Tabele: `guild_raid_boss_templates` (5-elementowa pula), `guild_raid_bosses` (per-guild active+history), `guild_raid_hits` (audit).
- `guild_members.raid_hits_today + last_raid_hit_date` — 3 hity/dzień UTC reset.
- Content `game/guild-raids.ts`: 5 bossów (Szczur Wielki → Kucharz z Kanałów → Wojewoda Goblinów → Topielec Starszy → Lich Podgrodzia), rotation `(tier-1) mod 5`, HP `baseHp * (1 + (tier-1)*0.3)`.
- Damage formula `rollRaidDamage`: `(atk+mag)/2 * (1 + tier*0.05) * (0.8..1.2) - tier*5`. Floor 10. Cap na hpCurrent.
- Reward: `500*tier + 200` gold + `floor(tier/2)` gems do skarbca.
- Router `guildRaids` (current/hit/history). Continuous loop: po killu → status=killed, natychmiast insert next tier row + reward + chronicle + achievement dla wszystkich członków.
- Chronicle: `guild_raid_killed`. Achievementy: `guild_raid_first_hit`, `guild_raid_killblow`, `guild_raid_kills_5`, `guild_raid_kills_25`.

**Faza 5 — Polish**:
- `game/guild-maintenance.ts` — `setInterval(1h)`. Leader >14d nieaktywny + są officerowie → auto-transfer na najstarszego active'go. Brak active members + leader >30d → soft-disband (`disbandedAt` set, members nullified, guild_members wipe).
- Chat moderation: `guild.chatDelete` (autor zawsze, leader/officer dowolną). Delete btn w GuildTabChat.
- Dashboard banner: `ScreenTown` pokazuje pending invites count jeśli `char.guild === null`.
- Pending applications: `guild.pendingApplications` endpoint + prawdziwy modal w GuildTabMembers.

**Smoke verified E2E** (all phases): create → invite → accept → chat → promote → wars gauntlet resolve → raid boss kill → spawn next tier → reward split → auto-maintenance path. 120 testów ✓.

### Nieplanowane / future polish
- **Rename gildii** — brak endpointu (low priority).
- **Admin panel dla building/boss templates** — user edytuje w DataGrip + serwer restart (nie ma `admin.reload` dla guild templates — czytamy TS arrays bezpośrednio).
- **Dedicated guild docs** — `docs/guild.md` do napisania (przydatne dla onboardingu kontrybutorów).

### Inne
- **Gem shop IAP**: needs Google Play Billing w Capacitorze (M4).
- **Capacitor/Android packaging — DONE (scaffold)**:
  - `apps/web/capacitor.config.ts` — appId `pl.szczurogrod.app`, appName `Szczurogród`, webDir `dist`.
  - `apps/web/android/` — wygenerowany przez `npx cap add android`. Commit'ujemy (Capacitor `.gitignore` per platforma wyklucza build artifacts).
  - Pluginy: `@capacitor/app` (back button), `@capacitor/status-bar` (dark + #2a1a3a), `@capacitor/splash-screen` (800ms hide po init).
  - Init w `apps/web/src/native/capacitor-init.ts`, wołane z `main.tsx` — runtime-conditional (web = no-op).
  - Build: `VITE_API_URL=https://api.example.com pnpm --filter @grodno/web mobile:build` → kopiuje `dist/` do `android/app/src/main/assets/public`. Bez `VITE_API_URL` natywny build trafia na `https://localhost:4000` (śmierć). Console.error w TrpcProvider ostrzega.
  - Otwarcie w Android Studio: `pnpm --filter @grodno/web cap:open:android`. Wymaga `ANDROID_HOME` (typowo `~/Library/Android/sdk` na macOS) + JDK 17+.
  - Brakuje przed publishem: ikony app/launcher (`android/app/src/main/res/mipmap-*`), splash image (`drawable/splash.png`), keystore do release (`gradle signingConfig`), signing config + Google Play Console setup.
- **Content powyżej L50**: Chapter 4+ nie zaprojektowany. Level system uncapped (level_100 achievement już jest), ale po Strzydze to tylko idle grind.
- **Long-term** (nothing planned): enchantments/sockets/runes, item sets (N-piece bonuses), crafting (combine commons → rare).
- **Tests**: 120 testów na pure game functions (`leveling`, `stamina`, `daily`, `trainer`, `combat`, `chronicle`, `mounts`, `guild-wars`, `guild-raids`). Uncovered: DB-backed integration paths, combat session machine, router-level happy/error flows. Potrzeba test DB fixture albo dependency-injected registry.
