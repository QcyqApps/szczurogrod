// Hard-coded PL/EN dictionary for the survivor app. Keys are namespaced
// dot-paths. Extend instead of overloading existing keys; a missing
// translation falls back to the key itself (visible in QA).

import type { Lang } from './store';

interface Entry {
  pl: string;
  en: string;
}

export const DICT = {
  // Auth / login
  'login.title': { pl: 'SZCZUROGRÓD', en: 'RATBURG' },
  'login.subtitle': { pl: 'OKRUCHY', en: 'CRUMBS' },
  'login.flavor': {
    pl: 'Stań na bramie. Strzelaj okruchami. Zostań ostatnim szczurem do upadku murów.',
    en: 'Hold the gate. Shoot crumbs. Be the last rat standing.',
  },
  'login.guest': { pl: 'GRAJ JAKO GOŚĆ', en: 'PLAY AS GUEST' },
  'login.wait': { pl: 'CZEKAJ…', en: 'WAIT…' },
  'login.scaffold.note': {
    pl: 'Auth współdzielony ze Szczurogrodem.',
    en: 'Auth shared with Ratburg main game.',
  },

  // Hub
  'hub.title': { pl: 'OKRUCHY', en: 'CRUMBS' },
  'hub.flavor': {
    pl: 'Wybierz front. Strzelaj okruchami. Zabij bossa, odblokuj kolejny.',
    en: 'Pick a front. Shoot crumbs. Kill the boss, unlock the next.',
  },
  'hub.stat.okruchy': { pl: 'Okruchy', en: 'Crumbs' },
  'hub.stat.runs': { pl: 'Runy', en: 'Runs' },
  'hub.stat.kills': { pl: 'Łącznie kill', en: 'Total kills' },
  'hub.tab.stages': { pl: 'ETAPY', en: 'STAGES' },
  'hub.stage.play': { pl: 'GRAJ', en: 'PLAY' },
  'hub.stage.locked': { pl: 'ZABLOKOWANY', en: 'LOCKED' },
  'hub.stage.cleared': {
    pl: 'Pokonany — replay 50% okruchów',
    en: 'Cleared — replay pays 50% crumbs',
  },
  'hub.sister.title': { pl: 'ZAGRAJ TEŻ W SZCZUROGRÓD', en: 'PLAY RATBURG TOO' },
  'hub.sister.flavor': {
    pl: 'Idle RPG. Ten sam świat, mniej strzelania.',
    en: 'Idle RPG. Same world, less shooting.',
  },
  'hub.logout.guest': { pl: 'Wyloguj gościa', en: 'Sign out (guest)' },
  'hub.logout.user': { pl: 'Wyloguj', en: 'Sign out' },
  'hub.idleXp.title': { pl: 'POSTĘP DO XP IDLE', en: 'IDLE XP PROGRESS' },
  'hub.idleXp.noChar': {
    pl: 'Stwórz postać w Szczurogrodzie aby zbierać XP z runów.',
    en: 'Create a character in Ratburg to collect XP from runs.',
  },
  'hub.idleXp.pending': {
    pl: '{count} paczek z {xp} XP czeka w idle. Wróć do Szczurogrodu i odbierz!',
    en: '{count} packages with {xp} XP waiting in idle. Return to Ratburg to claim!',
  },

  // Skill tree
  'skill.title': { pl: 'DRZEWKO', en: 'SKILL TREE' },
  'skill.max': { pl: 'MAX', en: 'MAX' },
  'skill.cost.suffix': { pl: 'OK', en: 'CR' },
  'skill.busy': { pl: '…', en: '…' },

  // Run HUD
  'run.loading': { pl: 'Ładowanie runu…', en: 'Loading run…' },
  'run.error': { pl: 'Błąd', en: 'Error' },
  'run.unknownStage': { pl: 'Nieznany stage.', en: 'Unknown stage.' },
  'run.boss.in': { pl: 'Boss za', en: 'Boss in' },
  'run.boss.now': { pl: 'BOSS!', en: 'BOSS!' },
  'run.boss.warning': { pl: 'BOSS NADCHODZI', en: 'BOSS INCOMING' },
  'run.kills': { pl: 'kill', en: 'kills' },
  'run.banner.won': { pl: 'BOSS PADŁ', en: 'BOSS DOWN' },
  'run.banner.lost': { pl: 'KONIEC', en: 'WIPED' },
  'run.banner.won.flavor': { pl: 'Sztandar stoi.', en: 'The banner stands.' },
  'run.banner.lost.flavor': { pl: 'Spróbuj jeszcze raz.', en: 'Try again.' },
  'run.banner.sending': { pl: 'Wysyłanie raportu…', en: 'Sending report…' },
  'run.banner.tap': { pl: 'dotknij aby kontynuować', en: 'tap to continue' },
  'run.abandon': { pl: 'WYJDŹ', en: 'QUIT' },
  'run.abandon.confirm': { pl: 'PORZUĆ?', en: 'FORFEIT?' },

  // End screen
  'end.title.won': { pl: 'BOSS PADŁ', en: 'BOSS DOWN' },
  'end.title.lost': { pl: 'KONIEC RUN’A', en: 'RUN OVER' },
  'end.flavor.won': { pl: 'Mury stoją. Tym razem.', en: 'Walls hold. For now.' },
  'end.flavor.lost': { pl: 'Bywa. Spróbuj jeszcze raz.', en: 'Happens. Go again.' },
  'end.row.stage': { pl: 'Stage', en: 'Stage' },
  'end.row.kills': { pl: 'Killów', en: 'Kills' },
  'end.row.time': { pl: 'Czas', en: 'Time' },
  'end.row.boss': { pl: 'Boss', en: 'Boss' },
  'end.row.boss.yes': { pl: 'TAK', en: 'YES' },
  'end.row.boss.no': { pl: 'nie', en: 'no' },
  'end.row.okruchy': { pl: 'Twoje okruchy', en: 'Your crumbs' },
  'end.row.maxStage': { pl: 'Najwyższy stage', en: 'Highest stage' },
  'end.back': { pl: 'WRACAJ DO HUBA', en: 'BACK TO HUB' },

  // Stage names — translated copies for hub display.
  'stage.1.name': { pl: 'Bramy Szczurogrodu', en: 'Gates of Ratburg' },
  'stage.1.flavor': {
    pl: 'Pierwsza fala. Strażnik śpi.',
    en: 'First wave. Guard is asleep.',
  },
  'stage.2.name': { pl: 'Kanały', en: 'Sewers' },
  'stage.2.flavor': {
    pl: 'Pachnie tym, czym pachnie.',
    en: 'Smells like what it smells like.',
  },
  'stage.3.name': { pl: 'Podgrodzie', en: 'Outskirts' },
  'stage.3.flavor': {
    pl: 'Stare ulice, świeże kości.',
    en: 'Old streets, fresh bones.',
  },

  // Skill node names + descriptions.
  'skill.hp_max.name': { pl: 'Wytrzymałość', en: 'Toughness' },
  'skill.hp_max.desc': {
    pl: 'Skóra grubsza. +20 max HP za poziom.',
    en: 'Thicker hide. +20 max HP per level.',
  },
  'skill.dmg.name': { pl: 'Ostry pazur', en: 'Sharp Claw' },
  'skill.dmg.desc': {
    pl: 'Pociski boleśniejsze. +22% obrażeń za poziom.',
    en: 'Sharper crumbs. +22% damage per level.',
  },
  'skill.fire_rate.name': { pl: 'Szybka łapa', en: 'Quick Paw' },
  'skill.fire_rate.desc': {
    pl: 'Krótszy czas castu. -0.2s za poziom (min 0.4s).',
    en: 'Shorter cast time. -0.2s per level (min 0.4s).',
  },
  'skill.splash.name': { pl: 'Wybuchowe okruchy', en: 'Boom Crumbs' },
  'skill.splash.desc': {
    pl: 'Większa eksplozja. +22 px promienia za poziom.',
    en: 'Larger blast. +22 px radius per level.',
  },
  'skill.proj_speed.name': { pl: 'Lekki ładunek', en: 'Light Charge' },
  'skill.proj_speed.desc': {
    pl: 'Pocisk leci szybciej. +25% prędkości za poziom.',
    en: 'Projectile flies faster. +25% speed per level.',
  },
  'skill.slow.name': { pl: 'Lepkie błoto', en: 'Sticky Mud' },
  'skill.slow.desc': {
    pl: 'Trafiony wróg zwalnia o 25% na 1s.',
    en: 'Hit enemies slowed by 25% for 1s.',
  },
  'skill.crit.name': { pl: 'Celne oko', en: 'Sharp Eye' },
  'skill.crit.desc': {
    pl: 'Szansa na podwójne obrażenia. +10% za poziom.',
    en: 'Chance to deal double damage. +10% per level.',
  },
  'skill.density.name': { pl: 'Wabik', en: 'Lure' },
  'skill.density.desc': {
    pl: 'Więcej szczurów = więcej okruchów. +5 max enemies.',
    en: 'More rats = more crumbs. +5 max enemies.',
  },
  'skill.lifesteal.name': { pl: 'Krwawe okruchy', en: 'Bloody Crumbs' },
  'skill.lifesteal.desc': {
    pl: 'Trafienie wroga przywraca 1 HP za poziom (subtelnie).',
    en: 'Each enemy hit restores 1 HP per level (subtle).',
  },
  'skill.shard_chance.name': { pl: 'Rozprysk', en: 'Shrapnel' },
  'skill.shard_chance.desc': {
    pl: 'Eksplozja wystrzeli odłamek w innego wroga. +15% szansy za poziom.',
    en: 'Explosion launches a shard at another enemy. +15% chance per level.',
  },
  'skill.shard_max.name': { pl: 'Roztrzaskanie', en: 'Shattering' },
  'skill.shard_max.desc': {
    pl: 'Dodatkowe odłamki: +1, +2, +3. Wymaga „Rozprysku”.',
    en: 'Extra shards: +1, +2, +3. Requires Shrapnel.',
  },
  'skill.knockback.name': { pl: 'Odrzut', en: 'Knockback' },
  'skill.knockback.desc': {
    pl: 'Szansa, że trafiony wróg zostanie odepchnięty. +12% za poziom. Bossowie się nie ruszą.',
    en: 'Chance to push hit enemies back. +12% per level. Bosses unaffected.',
  },

  // Help popup w hub
  'hub.help.title': { pl: 'JAK TO DZIAŁA?', en: 'HOW IT WORKS' },
  'hub.help.body.goal.title': { pl: 'Cel', en: 'Goal' },
  'hub.help.body.goal.text': {
    pl: 'Wybierz etap, przetrwaj falę szczurów i zabij bossa. Im dłużej żyjesz, tym więcej okruchów.',
    en: 'Pick a stage, survive the rats, kill the boss. The longer you live, the more crumbs.',
  },
  'hub.help.body.controls.title': { pl: 'Sterowanie', en: 'Controls' },
  'hub.help.body.controls.text': {
    pl: 'Mysz / palec ustawia celownik. Strzelasz automatycznie, gdy ktoś jest na ekranie. HP traci się od kontaktu i powolnego draina — nie stój.',
    en: 'Mouse/finger aims the crosshair. Auto-fires when enemies are present. HP drops on contact and from slow drain — keep moving.',
  },
  'hub.help.body.economy.title': { pl: 'Okruchy', en: 'Crumbs' },
  'hub.help.body.economy.text': {
    pl: 'Za zabite szczury dostajesz okruchy. Wydajesz je w drzewku po prawej. Skille są permanentne — bonusy zostają na zawsze.',
    en: 'Killed rats drop crumbs. Spend them in the right-side tree. Skills are permanent — bonuses stick across runs.',
  },
  'hub.help.body.idle.title': { pl: 'Pasek XP do Szczurogrodu', en: 'XP bar to Ratburg' },
  'hub.help.body.idle.text': {
    pl: 'Jeśli grasz tym samym kontem co w głównym Szczurogrodzie, każdy run zapełnia pasek. Pełny pasek = paczka XP do odebrania w idle game.',
    en: 'If you share an account with main Ratburg, every run fills a bar. Full bar = XP package to claim back in the idle game.',
  },
  'hub.help.body.tip.title': { pl: 'Wskazówka', en: 'Tip' },
  'hub.help.body.tip.text': {
    pl: 'Szybka łapa + Wybuchowe okruchy to najprostszy starter. Później dorzuć Rozprysk i Odrzut, żeby kontrolować tłum.',
    en: 'Quick Paw + Boom Crumbs is the easiest starter. Later add Shrapnel and Knockback to manage the crowd.',
  },

  // Lang picker
  'lang.pl': { pl: 'PL', en: 'PL' },
  'lang.en': { pl: 'EN', en: 'EN' },

  // Leaderboard
  'leaderboard.title': { pl: 'NAJSZYBSI', en: 'FASTEST' },
  'leaderboard.loading': { pl: 'Ładowanie…', en: 'Loading…' },
  'leaderboard.empty': {
    pl: 'Nikt jeszcze nie pokonał tego bossa. Bądź pierwszy.',
    en: 'No one has cleared this boss yet. Be first.',
  },
  'leaderboard.col.rank': { pl: '#', en: '#' },
  'leaderboard.col.name': { pl: 'Gracz', en: 'Player' },
  'leaderboard.col.time': { pl: 'Czas', en: 'Time' },
  'leaderboard.col.kills': { pl: 'Kill', en: 'Kills' },
} satisfies Record<string, Entry>;

export type DictKey = keyof typeof DICT;

export function tStatic(key: DictKey, lang: Lang): string {
  return DICT[key][lang];
}
