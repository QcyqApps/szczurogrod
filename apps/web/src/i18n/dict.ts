// Słownik tłumaczeń UI. Klucze hierarchiczne — kropka jako separator.
// Konwencja: kategorie wielką literą sprawdzają się słabo (jsx readability),
// więc wszystkie klucze lowercase: `auth.login.title`, `tabs.town` itp.
//
// Dodawanie języka: rozszerz typ `Lang` w store.ts, dodaj odpowiedni klucz
// w każdym wpisie dict'a. TypeScript wymusi kompletność.

import type { Lang } from './store';

export type DictKey = keyof typeof dict;
export type Dict = Record<string, Record<Lang, string>>;

export const dict = {
  // ===== Brand =====
  'app.title.full': {
    pl: 'SZCZUROGRÓD',
    en: 'RATBURG',
  },
  'app.tagline': {
    pl: 'Walka, pierogi, szczury. W tej kolejności.',
    en: 'Combat, dumplings, rats. In that order.',
  },
  'app.subtitle': {
    pl: 'idle RPG',
    en: 'idle RPG',
  },
  'app.frame.footer': {
    pl: 'Ramka dla klimatu. Gra — prawdziwa.',
    en: 'The frame is decorative. The game is real.',
  },

  // ===== Desktop landing side panels =====
  'landing.leaderboard.title': {
    pl: 'KSIĘGA CHWAŁY',
    en: 'HALL OF FAME',
  },
  'landing.leaderboard.subtitle': {
    pl: 'Najwyższe poziomy w Szczurogrodzie',
    en: 'Highest levels in Ratburg',
  },
  'landing.leaderboard.empty': {
    pl: 'Pusto. Bohaterowie jeszcze śpią.',
    en: 'Empty. The heroes are still asleep.',
  },
  'landing.leaderboard.colPos': {
    pl: '#',
    en: '#',
  },
  'landing.leaderboard.colName': {
    pl: 'BOHATER',
    en: 'HERO',
  },
  'landing.leaderboard.colLvl': {
    pl: 'LVL',
    en: 'LVL',
  },
  'landing.chronicle.title': {
    pl: 'KRONIKA SZCZUROGRODU',
    en: 'RATBURG CHRONICLE',
  },
  'landing.chronicle.subtitle': {
    pl: 'Z karczemnych plotek i miejskich ksiąg',
    en: 'From tavern gossip and town ledgers',
  },
  'landing.chronicle.empty': {
    pl: 'Strona pusta. Skryba zaspał.',
    en: 'A blank page. The scribe overslept.',
  },
  'landing.stats.title': {
    pl: 'SZYBKIE LICZBY',
    en: 'QUICK STATS',
  },
  'landing.stats.online': {
    pl: 'W mieście teraz',
    en: 'In town right now',
  },
  'landing.stats.totalChars': {
    pl: 'Bohaterów łącznie',
    en: 'Heroes in total',
  },
  'landing.stats.totalGuilds': {
    pl: 'Aktywnych gildii',
    en: 'Active guilds',
  },
  'landing.myrank.title': {
    pl: 'TWOJE MIEJSCE',
    en: 'YOUR RANK',
  },
  'landing.myrank.level': {
    pl: 'Po poziomie',
    en: 'By level',
  },
  'landing.myrank.arena': {
    pl: 'Po arenie',
    en: 'By arena',
  },
  'landing.myrank.signedOut': {
    pl: 'Zaloguj się żeby zobaczyć swoje miejsce w Księdze.',
    en: 'Sign in to see your standing in the Book.',
  },
  'landing.cta.googlePlay.kicker': {
    pl: 'POBIERZ NA',
    en: 'GET IT ON',
  },
  'landing.cta.googlePlay.label': {
    pl: 'Google Play',
    en: 'Google Play',
  },
  'landing.cta.googlePlay.soon': {
    pl: 'Wkrótce',
    en: 'Coming soon',
  },
  'landing.cta.googlePlay.note': {
    pl: 'Wersja mobilna w drodze. Pieczęć schnie.',
    en: 'Mobile version on the way. Seal is drying.',
  },

  // ===== Splash =====
  'splash.tap': {
    pl: 'Stuknij żeby kontynuować',
    en: 'Tap to continue',
  },
  'splash.flavor': {
    pl: 'Idle RPG. Klikasz, czekasz, znajdujesz coś rdzawego.',
    en: 'Idle RPG. You click, you wait, you come back with something rusty.',
  },

  // ===== Language picker =====
  'lang.label': {
    pl: 'Język',
    en: 'Language',
  },
  'lang.pl': {
    pl: 'Polski',
    en: 'Polish',
  },
  'lang.en': {
    pl: 'Angielski',
    en: 'English',
  },

  // ===== Auth — login =====
  'auth.login.title': {
    pl: 'WITAJ',
    en: 'WELCOME',
  },
  'auth.login.subtitle': {
    pl: 'Wybierz jak grasz.',
    en: 'Choose how you play.',
  },
  'auth.login.tab.login': {
    pl: 'LOGOWANIE',
    en: 'LOG IN',
  },
  'auth.login.tab.register': {
    pl: 'REJESTRACJA',
    en: 'SIGN UP',
  },
  'auth.login.tab.guest': {
    pl: 'GOŚĆ',
    en: 'GUEST',
  },
  'auth.login.email': {
    pl: 'Email',
    en: 'Email',
  },
  'auth.login.password': {
    pl: 'Hasło',
    en: 'Password',
  },
  'auth.login.password.confirm': {
    pl: 'Powtórz hasło',
    en: 'Confirm password',
  },
  'auth.login.submit.login': {
    pl: 'ZALOGUJ',
    en: 'LOG IN',
  },
  'auth.login.submit.register': {
    pl: 'ZAREJESTRUJ',
    en: 'SIGN UP',
  },
  'auth.login.submit.guest': {
    pl: 'GRAJ JAKO GOŚĆ',
    en: 'PLAY AS GUEST',
  },
  'auth.login.guest.warning': {
    pl: 'Konto-gość znika razem z pamięcią przeglądarki. Bez emaila — bez backupu.',
    en: 'Guest account disappears with browser storage. No email — no backup.',
  },
  'auth.login.error.passwordMismatch': {
    pl: 'Hasła się różnią.',
    en: 'Passwords do not match.',
  },
  'auth.login.error.passwordTooShort': {
    pl: 'Hasło min. 5 znaków.',
    en: 'Password min 5 characters.',
  },
  'auth.login.error.emailInvalid': {
    pl: 'Nieprawidłowy email.',
    en: 'Invalid email.',
  },
  'auth.login.error.generic': {
    pl: 'Coś poszło nie tak.',
    en: 'Something went wrong.',
  },
  'auth.login.busy': {
    pl: 'CHWILA…',
    en: 'WAIT…',
  },
  'auth.login.remember': {
    pl: 'ZAPAMIĘTAJ MNIE',
    en: 'REMEMBER ME',
  },
  'auth.login.remember.tooltip': {
    pl: 'Email i hasło zostaną zapisane w tej przeglądarce, żeby wrócić prosto do inputów.',
    en: 'Email and password will be saved in this browser to skip retyping them.',
  },
  'auth.login.forgot': {
    pl: 'Zapomniałeś hasła?',
    en: 'Forgot password?',
  },
  'auth.login.or': {
    pl: 'LUB',
    en: 'OR',
  },
  'auth.register.terms': {
    pl: 'Rejestrując się akceptujesz Regulamin i Politykę Prywatności',
    en: 'By signing up you accept the Terms and Privacy Policy',
  },
  'auth.register.terms.prefix': {
    pl: 'Rejestrując się akceptujesz',
    en: 'By signing up you accept the',
  },
  'auth.register.terms.and': {
    pl: 'i',
    en: 'and',
  },

  // ===== Legal links (footer + login screen) =====
  'legal.terms': {
    pl: 'Regulamin',
    en: 'Terms',
  },
  'legal.privacy': {
    pl: 'Polityka Prywatności',
    en: 'Privacy Policy',
  },
  'legal.refunds': {
    pl: 'Zwroty',
    en: 'Refunds',
  },
  'legal.pricing': {
    pl: 'Cennik',
    en: 'Pricing',
  },

  // ===== Community =====
  'community.discord': {
    pl: 'Discord',
    en: 'Discord',
  },
  'community.discord.subtitle': {
    pl: 'Społeczność Szczurogrodu',
    en: 'Ratburg community',
  },
  'community.discord.cta': {
    pl: 'DOŁĄCZ NA DISCORD',
    en: 'JOIN DISCORD',
  },
  'community.discord.kicker': {
    pl: 'SPOŁECZNOŚĆ',
    en: 'COMMUNITY',
  },
  'community.discord.note': {
    pl: 'Pogadaj z graczami. Zgłoś bug. Donieś plotkę.',
    en: 'Chat with players. Report a bug. Bring rumors.',
  },

  // ===== Sister game cross-link =====
  'survivor.crosslink.label': {
    pl: 'Szczurogród: Okruchy',
    en: 'Ratburg: Crumbs',
  },
  'survivor.crosslink.kicker': {
    pl: 'NOWA GRA',
    en: 'NEW GAME',
  },
  'survivor.crosslink.note': {
    pl: 'Strzelaj okruchami. Stań na bramie.',
    en: 'Shoot crumbs. Hold the gate.',
  },
  'settings.section.othergames': {
    pl: 'INNE GRY',
    en: 'OTHER GAMES',
  },
  'settings.btn.survivor': {
    pl: 'Szczurogród: Okruchy — wersja survival',
    en: 'Ratburg: Crumbs — survival version',
  },
  'settings.section.community': {
    pl: 'SPOŁECZNOŚĆ',
    en: 'COMMUNITY',
  },
  'settings.btn.discord': {
    pl: 'Discord — pogadaj z graczami',
    en: 'Discord — chat with players',
  },

  // ===== Create character =====
  'create.title': {
    pl: 'NOWA POSTAĆ',
    en: 'NEW CHARACTER',
  },
  'create.step.name': {
    pl: 'IMIĘ',
    en: 'NAME',
  },
  'create.step.class': {
    pl: 'KLASA',
    en: 'CLASS',
  },
  'create.step.appearance': {
    pl: 'WYGLĄD',
    en: 'APPEARANCE',
  },
  'create.step.bonus': {
    pl: 'BONUS',
    en: 'BONUS',
  },
  'create.name.placeholder': {
    pl: 'Wpisz imię (max 20 znaków)',
    en: 'Type a name (max 20 chars)',
  },
  'create.name.error.tooShort': {
    pl: 'Imię min. 1 znak.',
    en: 'Name min 1 character.',
  },
  'create.class.warrior.name': {
    pl: 'Wojownik',
    en: 'Warrior',
  },
  'create.class.warrior.desc': {
    pl: 'HP+, ATK+. Bije mocno, dostaje też mocno.',
    en: 'HP+, ATK+. Hits hard, gets hit hard.',
  },
  'create.class.mage.name': {
    pl: 'Mag',
    en: 'Mage',
  },
  'create.class.mage.desc': {
    pl: 'MP+, MAG+. Czaruje. Czasem trafia.',
    en: 'MP+, MAG+. Casts. Sometimes hits.',
  },
  'create.class.rogue.name': {
    pl: 'Łotrzyk',
    en: 'Rogue',
  },
  'create.class.rogue.desc': {
    pl: 'Unik+, krit+. Nie wchodzi przez drzwi.',
    en: 'Dodge+, crit+. Never uses the door.',
  },
  'create.bonus.gold.name': {
    pl: '500 złota',
    en: '500 gold',
  },
  'create.bonus.gold.desc': {
    pl: 'Na start, do sklepu, na piwo.',
    en: 'For the start, the shop, the beer.',
  },
  'create.bonus.gems.name': {
    pl: '100 gemów',
    en: '100 gems',
  },
  'create.bonus.gems.desc': {
    pl: 'Premium waluta. Trzymaj na coś ważnego.',
    en: 'Premium currency. Save it for something important.',
  },
  'create.bonus.potion.name': {
    pl: 'Mikstura zdrowia',
    en: 'Health potion',
  },
  'create.bonus.potion.desc': {
    pl: 'Jedna. Lecz mądrze.',
    en: 'Just one. Heal wisely.',
  },
  'create.bonus.scroll.name': {
    pl: 'Zwój doświadczenia',
    en: 'XP scroll',
  },
  'create.bonus.scroll.desc': {
    pl: 'Skok startowy. Czasem warto.',
    en: 'Head start. Sometimes worth it.',
  },
  'create.next': {
    pl: 'DALEJ',
    en: 'NEXT',
  },
  'create.back': {
    pl: 'WSTECZ',
    en: 'BACK',
  },
  'create.confirm': {
    pl: 'STWÓRZ',
    en: 'CREATE',
  },
  'create.busy': {
    pl: 'TWORZĘ…',
    en: 'CREATING…',
  },

  // ===== Tutorial =====
  'tutorial.skip': {
    pl: 'POMIŃ',
    en: 'SKIP',
  },
  'tutorial.next': {
    pl: 'DALEJ',
    en: 'NEXT',
  },
  'tutorial.start': {
    pl: 'ZACZNIJ',
    en: 'START',
  },

  // ===== Tabs =====
  'tabs.town': {
    pl: 'Miasto',
    en: 'Town',
  },
  'tabs.char': {
    pl: 'Postać',
    en: 'Hero',
  },
  'tabs.quest': {
    pl: 'Questy',
    en: 'Quests',
  },
  'tabs.arena': {
    pl: 'Arena',
    en: 'Arena',
  },
  'tabs.dungeons': {
    pl: 'Lochy',
    en: 'Dungeons',
  },
  'tabs.guild': {
    pl: 'Gildia',
    en: 'Guild',
  },

  // ===== Common buttons =====
  'btn.ok': { pl: 'OK', en: 'OK' },
  'btn.cancel': { pl: 'ANULUJ', en: 'CANCEL' },
  'btn.confirm': { pl: 'POTWIERDŹ', en: 'CONFIRM' },
  'btn.close': { pl: 'ZAMKNIJ', en: 'CLOSE' },
  'btn.back': { pl: '← Wróć', en: '← Back' },
  'btn.buy': { pl: 'KUP', en: 'BUY' },
  'btn.sell': { pl: 'SPRZEDAJ', en: 'SELL' },
  'btn.equip': { pl: 'ZAŁÓŻ', en: 'EQUIP' },
  'btn.unequip': { pl: 'ZDEJMIJ', en: 'UNEQUIP' },
  'btn.start': { pl: 'WYRUSZ', en: 'GO' },
  'btn.collect': { pl: 'ODBIERZ', en: 'COLLECT' },
  'btn.skip': { pl: 'POMIŃ', en: 'SKIP' },
  'btn.fight': { pl: 'WALCZ', en: 'FIGHT' },
  'btn.flee': { pl: 'UCIEKAJ', en: 'FLEE' },
  'btn.heal': { pl: 'LECZ', en: 'HEAL' },

  // ===== Common stats / labels =====
  'stat.hp': { pl: 'HP', en: 'HP' },
  'stat.mp': { pl: 'MP', en: 'MP' },
  'stat.atk': { pl: 'ATK', en: 'ATK' },
  'stat.def': { pl: 'OBR', en: 'DEF' },
  'stat.mag': { pl: 'MAG', en: 'MAG' },
  'stat.lvl': { pl: 'LVL', en: 'LVL' },
  'stat.xp': { pl: 'XP', en: 'XP' },
  'stat.gold': { pl: 'Złoto', en: 'Gold' },
  'stat.gems': { pl: 'Gemy', en: 'Gems' },
  'stat.stamina': { pl: 'Wytrzymałość', en: 'Stamina' },

  // ===== Modals =====
  'modal.levelUp.title': {
    pl: 'AWANS!',
    en: 'LEVEL UP!',
  },
  'modal.levelUp.gainedLevel': {
    pl: 'Nowy poziom: ',
    en: 'New level: ',
  },
  'modal.levelUp.gainedHpMp': {
    pl: 'HP/MP zregenerowane.',
    en: 'HP/MP restored.',
  },
  'modal.achievement.title': {
    pl: 'OSIĄGNIĘCIE',
    en: 'ACHIEVEMENT',
  },
  'modal.offline.title': {
    pl: 'WITAJ Z POWROTEM',
    en: 'WELCOME BACK',
  },
  'modal.offline.away': {
    pl: 'Byłeś poza',
    en: 'You were away for',
  },
  'modal.offline.gained': {
    pl: 'W międzyczasie:',
    en: 'In the meantime:',
  },
  'modal.offline.hpGained': {
    pl: 'HP zregenerowane',
    en: 'HP restored',
  },
  'modal.offline.mpGained': {
    pl: 'MP zregenerowane',
    en: 'MP restored',
  },
  'modal.offline.staminaGained': {
    pl: 'Wytrzymałość',
    en: 'Stamina',
  },
  'modal.offline.keysGained': {
    pl: 'Klucze do lochów',
    en: 'Dungeon keys',
  },
  'modal.offline.tracksRolled': {
    pl: 'Nowe tropy',
    en: 'New tracks',
  },
  'modal.offline.healerReady': {
    pl: 'Uzdrowiciel gotowy',
    en: 'Healer ready',
  },

  // ===== Quest reward =====
  'reward.title': {
    pl: 'NAGRODA',
    en: 'REWARD',
  },
  'reward.gold': {
    pl: 'Złoto',
    en: 'Gold',
  },
  'reward.xp': {
    pl: 'XP',
    en: 'XP',
  },
  'reward.items': {
    pl: 'Przedmioty',
    en: 'Items',
  },

  // ===== Errors / generic =====
  'err.generic': {
    pl: 'Coś poszło nie tak.',
    en: 'Something went wrong.',
  },
  'err.network': {
    pl: 'Brak połączenia.',
    en: 'No connection.',
  },
  'err.try.again': {
    pl: 'Spróbuj ponownie.',
    en: 'Try again.',
  },

  // ===== Time units =====
  'time.seconds.short': { pl: 's', en: 's' },
  'time.minutes.short': { pl: 'min', en: 'min' },
  'time.hours.short': { pl: 'h', en: 'h' },
  'time.days.short': { pl: 'd', en: 'd' },

  // ===== TopBar =====
  'topbar.settings': { pl: 'Ustawienia', en: 'Settings' },

  // ===== Level up modal =====
  'modal.levelUp.heading': { pl: 'LEVEL UP!', en: 'LEVEL UP!' },
  'modal.levelUp.times': { pl: 'razy!', en: 'times!' },
  'modal.levelUp.newChapter': { pl: '✨ NOWY ROZDZIAŁ ✨', en: '✨ NEW CHAPTER ✨' },
  'modal.levelUp.maxHp': { pl: 'Maks. HP', en: 'Max HP' },
  'modal.levelUp.maxMp': { pl: 'Maks. MP', en: 'Max MP' },
  'modal.levelUp.maxStamina': { pl: 'Maks. wytrzymałość', en: 'Max stamina' },
  'modal.levelUp.flavor': {
    pl: 'Staty rosną tylko u Trenera. HP i MP zostało uzupełnione.',
    en: 'Stats only grow at the Trainer. HP and MP refilled.',
  },
  'modal.levelUp.next': { pl: 'DALEJ!', en: 'ONWARD!' },

  // ===== Achievement modal =====
  'modal.achievement.heading': { pl: 'OSIĄGNIĘCIE ODBLOKOWANE', en: 'ACHIEVEMENT UNLOCKED' },
  'modal.achievement.tier.bronze': { pl: 'BRĄZ', en: 'BRONZE' },
  'modal.achievement.tier.silver': { pl: 'SREBRO', en: 'SILVER' },
  'modal.achievement.tier.gold': { pl: 'ZŁOTO', en: 'GOLD' },
  'modal.achievement.tier.legendary': { pl: 'LEGENDA', en: 'LEGEND' },
  'modal.achievement.flavor.bronze': { pl: 'Drobiazg, ale zaliczony.', en: 'A small thing, but it counts.' },
  'modal.achievement.flavor.silver': { pl: 'Dobrze to wyszło.', en: 'Came out alright.' },
  'modal.achievement.flavor.gold': { pl: 'Kronikarz pisze. Karczma milczy.', en: 'The chronicler writes. The tavern goes quiet.' },
  'modal.achievement.flavor.legendary': { pl: 'Będą cię długo pamiętać.', en: 'They will remember you for a long time.' },
  'modal.achievement.reward': { pl: 'NAGRODA', en: 'REWARD' },
  'modal.achievement.next': { pl: 'DALEJ', en: 'ONWARD' },

  // ===== Offline summary =====
  'modal.offline.heading': { pl: 'WITAJ SPOWROTEM', en: 'WELCOME BACK' },
  'modal.offline.flavor': {
    pl: 'Miasto nie czekało. Miasto nigdy nie czeka.',
    en: 'The town did not wait. The town never waits.',
  },
  'modal.offline.absence': { pl: 'Nieobecność', en: 'Away' },
  'modal.offline.dungeonKeys': { pl: 'Kluczy do lochu', en: 'Dungeon keys' },
  'modal.offline.staminaShort': { pl: 'Wytrzymałości', en: 'Stamina' },
  'modal.offline.hpRecovered': { pl: 'HP odzyskane', en: 'HP recovered' },
  'modal.offline.mpRecovered': { pl: 'MP odzyskane', en: 'MP recovered' },
  'modal.offline.tracksNew': { pl: 'Nowych tropów', en: 'New tracks' },
  'modal.offline.healer': { pl: 'Uzdrowicielka', en: 'Healer' },
  'modal.offline.healerBack': { pl: 'Znów w izbie', en: 'Back in the room' },
  'modal.offline.empty': {
    pl: 'Nic się nie wydarzyło. Nawet szczury w piwnicy spały.',
    en: 'Nothing happened. Even the rats in the cellar were asleep.',
  },
  'modal.offline.cta': { pl: 'DO ROBOTY', en: 'TO WORK' },

  // ===== Quest reward modal =====
  'modal.questReward.heading': { pl: 'QUEST UKOŃCZONY!', en: 'QUEST COMPLETE!' },
  'modal.questReward.label': { pl: 'NAGRODY:', en: 'REWARDS:' },
  'modal.questReward.gold': { pl: 'Złoto', en: 'Gold' },
  'modal.questReward.xp': { pl: 'Doświadczenie', en: 'Experience' },
  'modal.questReward.keys': { pl: 'Klucze do lochu', en: 'Dungeon keys' },
  'modal.questReward.collect': { pl: 'ODBIERZ!', en: 'COLLECT!' },

  // ===== Rarity labels =====
  'rarity.common': { pl: 'ZWYKŁY', en: 'COMMON' },
  'rarity.rare': { pl: 'RZADKI', en: 'RARE' },
  'rarity.epic': { pl: 'EPICKI', en: 'EPIC' },
  'rarity.legendary': { pl: 'LEGENDARNY', en: 'LEGENDARY' },
  'rarity.legendary.short': { pl: 'LEGEND.', en: 'LEGEND.' },

  // ===== Town =====
  'town.welcome': { pl: 'WITAJ W SZCZUROGRODZIE!', en: 'WELCOME TO RATBURG!' },
  'town.banner.guildInvites.title': { pl: 'ZAPROSZENIA GILDYJNE', en: 'GUILD INVITES' },
  'town.banner.guildInvites.body': {
    pl: 'Masz {count} — ktoś chce cię w swoim sztandarze.',
    en: 'You have {count} — someone wants you under their banner.',
  },
  'town.banner.seasonPass.title': { pl: 'PRZEPUSTKA SEZONOWA', en: 'SEASON PASS' },
  'town.banner.seasonPass.tier': { pl: 'tier do odebrania', en: 'tier to claim' },
  'town.banner.seasonPass.tiers': { pl: 'tierów do odebrania', en: 'tiers to claim' },
  'town.banner.daily.title': { pl: 'NAGRODA DZIENNA', en: 'DAILY REWARD' },
  'town.banner.daily.body': { pl: 'Czeka na odebranie — szkoda zostawiać.', en: 'Waiting for you — would be a shame to leave it.' },
  'town.banner.survivor.title': { pl: 'PACZKA Z OKRUCHÓW', en: 'CRUMBS PACKAGE' },
  'town.banner.survivor.claiming': { pl: 'Odbieranie…', en: 'Claiming…' },
  'town.banner.survivor.package': { pl: 'paczka', en: 'package' },
  'town.banner.survivor.packages': { pl: 'paczek', en: 'packages' },
  'town.tile.quests': { pl: 'QUESTY', en: 'QUESTS' },
  'town.tile.quests.sub': { pl: '{done}/{total} gotowe', en: '{done}/{total} done' },
  'town.tile.quests.loading': { pl: 'Ładowanie…', en: 'Loading…' },
  'town.tile.dungeons': { pl: 'LOCHY', en: 'DUNGEONS' },
  'town.tile.dungeons.sub': { pl: '{count} przeciwników', en: '{count} enemies' },
  'town.tile.dungeons.none': { pl: 'Brak dostępnych', en: 'None available' },
  'town.tile.arena': { pl: 'ARENA', en: 'ARENA' },
  'town.tile.arena.sub': { pl: '#247 ranking', en: '#247 ranking' },
  'town.tile.shop': { pl: 'SKLEP', en: 'SHOP' },
  'town.tile.shop.sub': { pl: '{count} ofert', en: '{count} offers' },
  'town.tile.shop.closed': { pl: 'Zamknięte', en: 'Closed' },
  'town.tile.tavern': { pl: 'TAWERNA', en: 'TAVERN' },
  'town.tile.tavern.sub': { pl: 'Rekrutacja', en: 'Recruitment' },
  'town.tile.stables': { pl: 'STAJNIE', en: 'STABLES' },
  'town.tile.stables.sub.speed': { pl: '−{pct}% czasu', en: '−{pct}% time' },
  'town.tile.stables.sub.fast': { pl: 'Szybsze questy', en: 'Faster quests' },
  'town.tile.blacksmith': { pl: 'KOWAL', en: 'SMITH' },
  'town.tile.blacksmith.sub': { pl: 'Ulepsz · rozpruj', en: 'Upgrade · scrap' },
  'town.tile.tower': { pl: 'WIEŻA', en: 'TOWER' },
  'town.tile.tower.sub': { pl: 'Nieskończona', en: 'Endless' },
  'town.tile.fame': { pl: 'SŁAWA', en: 'FAME' },
  'town.tile.fame.sub': { pl: 'Top 10', en: 'Top 10' },
  'town.tile.work': { pl: 'PRACA', en: 'WORK' },
  'town.tile.work.sub': { pl: 'Idź na zmianę', en: 'Take a shift' },
  'town.tile.survivor': { pl: 'OKRUCHY', en: 'CRUMBS' },
  'town.tile.survivor.sub': { pl: 'Inny tryb · XP', en: 'Side mode · XP' },
  'town.modal.survivor.title': {
    pl: 'SZCZUROGRÓD: OKRUCHY',
    en: 'RATBURG: CRUMBS',
  },
  'town.modal.survivor.intro': {
    pl: 'Zupełnie inny tryb gry. Survivor-shooter w landscape — strzelasz w fale szczurów, omijasz kontakt, walisz bossa.',
    en: 'A completely different game mode. A landscape survivor-shooter — shoot waves of rats, dodge contact, kill the boss.',
  },
  'town.modal.survivor.economy': {
    pl: 'Każdy run kończy się okruchami — wydajesz je tam na drzewku skilli (osobne od Szczurogrodu).',
    en: 'Every run ends with crumbs — spend them in the side game’s skill tree (separate from Ratburg).',
  },
  'town.modal.survivor.xp': {
    pl: 'Dodatkowo każdy run zapełnia pasek XP. Pełny pasek = paczka doświadczenia do odebrania tutaj, w mieście.',
    en: 'Each run also fills an XP bar. A full bar = an XP package to claim back here in town.',
  },
  'town.modal.survivor.note': {
    pl: 'Otwiera się w nowej karcie. Konto wspólne — nie musisz logować się ponownie.',
    en: 'Opens in a new tab. Shared account — no need to sign in again.',
  },
  'town.modal.survivor.confirm': { pl: 'ZAGRAJ', en: 'PLAY' },
  'town.modal.survivor.cancel': { pl: 'ANULUJ', en: 'CANCEL' },
  'work.title': { pl: 'PRACA', en: 'WORK' },
  'work.flavor': {
    pl: 'Bez bohaterstwa. Płacą za godziny.',
    en: 'No heroics. They pay by the hour.',
  },
  'work.loading': { pl: 'Ładuję zlecenia...', en: 'Loading jobs...' },
  'work.toast.started': { pl: 'Idziesz do pracy.', en: 'Off to work.' },
  'work.toast.failed': {
    pl: 'Coś poszło nie tak. Spróbuj jeszcze raz.',
    en: 'Something went wrong. Try again.',
  },
  'work.toast.claimed': {
    pl: 'Zapłata: {gold} złota, {xp} XP.',
    en: 'Wages: {gold} gold, {xp} XP.',
  },
  'work.toast.cancelled': {
    pl: 'Wyszedłeś wcześniej. Częściowa zapłata: {gold} złota, {xp} XP.',
    en: 'Left early. Partial wages: {gold} gold, {xp} XP.',
  },
  'work.picker.kindHeading': { pl: 'WYBIERZ ZLECENIE', en: 'PICK A JOB' },
  'work.picker.durationHeading': { pl: 'NA ILE GODZIN', en: 'HOW MANY HOURS' },
  'work.picker.pickFirst': {
    pl: 'Najpierw wybierz zlecenie.',
    en: 'Pick a job first.',
  },
  'work.picker.profileHint': {
    pl: 'Każde zlecenie płaci inaczej — gold vs XP.',
    en: 'Each job pays differently — gold vs XP.',
  },
  'work.active.ready': { pl: 'GOTOWE', en: 'READY' },
  'work.active.claim': { pl: 'ODBIERZ ZAPŁATĘ', en: 'COLLECT WAGES' },
  'work.active.waiting': { pl: 'JESZCZE PRACUJESZ', en: 'STILL WORKING' },
  'work.active.cancel': { pl: 'WYJDŹ WCZEŚNIEJ', en: 'LEAVE EARLY' },
  'work.active.cancelHint': {
    pl: 'Teraz dostaniesz: {gold} złota, {xp} XP.',
    en: 'Right now you would get: {gold} gold, {xp} XP.',
  },
  'work.active.confirmCancel': {
    pl: 'Wyjść z pracy teraz? Dostaniesz {gold} złota i {xp} XP.',
    en: 'Leave work now? You will get {gold} gold and {xp} XP.',
  },
  'work.active.blocksCombat': {
    pl: 'Pracujesz — walka, lochy, arena i gildia są zablokowane do końca zmiany.',
    en: 'Working — combat, dungeons, arena and guild fights are locked until shift ends.',
  },
  'town.chronicle.title': { pl: 'KRONIKI SZCZUROGRODU', en: 'RATBURG CHRONICLE' },
  'town.chronicle.empty': { pl: 'Kronikarz pisze. Wróć za chwilę.', en: 'The chronicler is writing. Come back in a moment.' },
  'town.chronicle.more': { pl: 'WIĘCEJ · {count} wpisów', en: 'MORE · {count} entries' },
  'town.flavor.warrior': { pl: 'Jeszcze jeden smok i wracam na piwo.', en: 'One more dragon and I’m off for a beer.' },
  'town.flavor.mage': { pl: 'Czy wszyscy widzą tę fioletową mgłę, czy tylko ja?', en: 'Does everyone see the purple mist, or just me?' },
  'town.flavor.rogue': { pl: 'Nie ukradłem. Przesunąłem do swojej kieszeni.', en: 'I didn’t steal it. I moved it to my pocket.' },

  // ===== ScreenChar — slots =====
  'char.slot.head': { pl: 'HEŁM', en: 'HELM' },
  'char.slot.neck': { pl: 'SZYJA', en: 'NECK' },
  'char.slot.chest': { pl: 'ZBROJA', en: 'ARMOR' },
  'char.slot.weapon': { pl: 'BROŃ', en: 'WEAPON' },
  'char.slot.off': { pl: 'TARCZA', en: 'SHIELD' },
  'char.slot.hands': { pl: 'RĘCE', en: 'HANDS' },
  'char.slot.ring': { pl: 'PIER.', en: 'RING' },
  'char.slot.feet': { pl: 'STOPY', en: 'FEET' },
  'char.slot.empty': { pl: 'PUSTY SLOT', en: 'EMPTY SLOT' },

  'char.class.title.warrior': { pl: 'Wojownik Bramy Wschodniej', en: 'Warrior of the East Gate' },
  'char.class.title.mage': { pl: 'Arcymag Katedry Ksiąg', en: 'Archmage of the Cathedral of Books' },
  'char.class.title.rogue': { pl: 'Łotrzyk Zaułków', en: 'Rogue of the Alleys' },

  'char.editAppearance': { pl: 'ZMIEŃ WYGLĄD', en: 'CHANGE LOOK' },
  'char.regen.hp.title': {
    pl: 'Regeneracja HP. Tempo skaluje się z poziomem — pełny pasek zawsze w 60 min. Działa też offline.',
    en: 'HP regen. Pace scales with level — full bar always in 60 min. Works offline too.',
  },
  'char.regen.mp.title': {
    pl: 'Regeneracja MP. Pełny pasek w 45 min. Działa też offline.',
    en: 'MP regen. Full bar in 45 min. Works offline too.',
  },
  'char.regen.tick': { pl: '+1 co {time}', en: '+1 every {time}' },
  'char.stats.heading': { pl: 'STATY', en: 'STATS' },
  'char.stats.help.title': { pl: 'Co robią statystyki?', en: 'What do the stats do?' },
  'char.stats.help.label': { pl: 'Co to robi?', en: 'What does it do?' },
  'char.stats.help.atk.l': { pl: 'ATK', en: 'ATK' },
  'char.stats.help.atk.body': {
    pl: ' — obrażenia zwykłym atakiem i MOCNYM cięciem. Pompujesz jeśli walisz bronią.',
    en: ' — damage on basic attack and HEAVY strike. Pump it if you swing a weapon.',
  },
  'char.stats.help.def.l': { pl: 'DEF', en: 'DEF' },
  'char.stats.help.def.body': {
    pl: ' — zmniejsza każdy cios wroga. Magia i armor pierce bossów ignorują połowę, więc świętego mura nie zbudujesz.',
    en: ' — reduces every enemy hit. Magic and boss armor pierce halve it, so no holy wall.',
  },
  'char.stats.help.mag.l': { pl: 'MAG', en: 'MAG' },
  'char.stats.help.mag.body': {
    pl: ' — obrażenia od czarów. Zaklęcia przebijają pół pancerza przeciwnika — jedyna pewna droga do opancerzonego bossa.',
    en: ' — spell damage. Spells pierce half of enemy armor — the only sure path to an armored boss.',
  },
  'char.stats.help.spd.l': { pl: 'SPD', en: 'SPD' },
  'char.stats.help.spd.body': {
    pl: ' — szansa na unik (1% za punkt) i celność MOCNEGO. Sufit uniku jest klasowy: ',
    en: ' — dodge chance (1% per point) and HEAVY accuracy. Dodge cap is class-based: ',
  },
  'char.stats.help.spd.warrior': { pl: 'wojownik 25%', en: 'warrior 25%' },
  'char.stats.help.spd.mage': { pl: 'mag 40%', en: 'mage 40%' },
  'char.stats.help.spd.rogue': { pl: 'rogue 40%', en: 'rogue 40%' },
  'char.stats.help.spd.tail': {
    pl: '. Pod kafelkiem widzisz ile faktycznie masz; przy cap-ie kolejne punkty dalej pchają celność, ale nie unik.',
    en: '. The tile shows your actual; at cap, more points still raise accuracy but not dodge.',
  },
  'char.stats.dodge.label': { pl: 'unik', en: 'dodge' },
  'char.stats.dodge.max': { pl: ' (max)', en: ' (max)' },
  'char.stats.dodge.title.capped': {
    pl: 'Unik osiąga cap dla klasy ({pct}%). Więcej SPD nie zwiększy szansy — ale nadal poprawia celność MOCNEGO.',
    en: 'Dodge hits class cap ({pct}%). More SPD won’t raise it — but still improves HEAVY accuracy.',
  },
  'char.stats.dodge.title.normal': {
    pl: 'Unik = SPD × 1%, max {pct}% dla tej klasy.',
    en: 'Dodge = SPD × 1%, max {pct}% for this class.',
  },

  // ===== Char nav =====
  'char.nav.trainer': { pl: 'TRENER', en: 'TRAINER' },
  'char.nav.achievements': { pl: 'OSIĄGN.', en: 'ACHIEV.' },
  'char.nav.scrapbook': { pl: 'KOLEKCJA', en: 'COLLECT.' },
  'char.nav.daily': { pl: 'DZIENNA', en: 'DAILY' },
  'char.nav.season': { pl: 'SEZON', en: 'SEASON' },

  // ===== Equipment / inventory =====
  'char.equipped.heading': { pl: 'EKWIPUNEK NA POSTACI', en: 'EQUIPPED' },
  'char.bag.heading': { pl: 'PLECAK ({n}/24)', en: 'BAG ({n}/24)' },
  'char.compare.vs': { pl: 'vs', en: 'vs' },
  'char.compare.noDiff': { pl: 'Bez różnicy w statsach.', en: 'No stat difference.' },
  'char.compare.total': { pl: 'SUMA', en: 'TOTAL' },
  'char.item.slot.potion': { pl: 'Do wypicia', en: 'Drinkable' },
  'char.item.slot.any': { pl: 'Losowy', en: 'Any slot' },
  'char.item.slot.label': { pl: 'Slot: {slot}', en: 'Slot: {slot}' },
  'char.item.btn.equip': { pl: 'ZAŁÓŻ NA POSTAĆ', en: 'EQUIP' },
  'char.item.btn.unequip': { pl: 'ZDEJMIJ DO PLECAKA', en: 'UNEQUIP TO BAG' },
  'char.item.btn.use': { pl: 'UŻYJ', en: 'USE' },
  'char.item.btn.sell': { pl: 'SPRZEDAJ ({g} g)', en: 'SELL ({g} g)' },
  'char.item.btn.drop': { pl: 'WYRZUĆ', en: 'DROP' },
  'char.item.btn.close': { pl: 'ZAMKNIJ', en: 'CLOSE' },

  // ===== Quests =====
  'quests.stamina.label': { pl: 'WYTRZYMAŁOŚĆ', en: 'STAMINA' },
  'quests.stamina.full': { pl: 'pełna', en: 'full' },
  'quests.stamina.regen': { pl: '+1 za 0:15', en: '+1 in 0:15' },
  'quests.stamina.regen.title': {
    pl: 'Regeneracja wytrzymałości. Każdy quest kosztuje 1 punkt.',
    en: 'Stamina regen. Each quest costs 1 point.',
  },
  'quests.stamina.refill': { pl: '+10 WYTRZ.', en: '+10 STAM.' },
  'quests.stamina.refill.reason': {
    pl: 'Natychmiastowy refill staminy.',
    en: 'Instant stamina refill.',
  },
  'quests.help.title': { pl: 'Jak działają questy?', en: 'How do quests work?' },
  'quests.help.label': { pl: 'Jak to działa?', en: 'How does it work?' },
  'quests.help.p1.a': { pl: 'Zadanie w tle. Klikasz ', en: 'Background task. Tap ' },
  'quests.help.p1.b': { pl: 'WYRUSZ', en: 'GO' },
  'quests.help.p1.c': {
    pl: ', idziesz zaparzyć herbatę, wracasz po odbiór złota, XP i czasem łupu. ',
    en: ', go make tea, come back for gold, XP and sometimes loot. ',
  },
  'quests.help.p1.d': { pl: 'Walki tu nie ma', en: 'No combat here' },
  'quests.help.p1.e': { pl: ' — od bicia masz lochy.', en: ' — for fighting there are dungeons.' },
  'quests.help.p2.a': { pl: 'Badge przy nazwie (', en: 'Badge by the name (' },
  'quests.help.p2.b': { pl: 'Łatwe', en: 'Easy' },
  'quests.help.p2.c': { pl: ', ', en: ', ' },
  'quests.help.p2.d': { pl: 'Średnie', en: 'Medium' },
  'quests.help.p2.e': { pl: 'Trudne', en: 'Hard' },
  'quests.help.p2.f': { pl: 'Ekstr.', en: 'Extr.' },
  'quests.help.p2.g': { pl: 'Boss', en: 'Boss' },
  'quests.help.p2.h': {
    pl: ') mówi, jak długo quest trwa i jak obfity łup. Im wyżej — tym dłużej stoi herbata i tym rzadsze przedmioty wpadają.',
    en: ') tells how long it takes and how rich the loot is. Higher — longer wait, rarer items.',
  },
  'quests.help.p3.a': {
    pl: ' to finał rozdziału. Dziesięć minut cierpliwości — i gwarantowany unikalny przedmiot dla twojej klasy. Bez większych niespodzianek.',
    en: ' is the chapter finale. Ten minutes of patience — and a guaranteed unique class item. No big surprises.',
  },
  'quests.back': { pl: '← Miasto', en: '← Town' },
  'quests.moreAt': { pl: 'Więcej questów po osiągnięciu LVL {lvl}', en: 'More quests at LVL {lvl}' },
  'quests.diff.easy': { pl: 'Łatwe', en: 'Easy' },
  'quests.diff.medium': { pl: 'Średnie', en: 'Medium' },
  'quests.diff.hard': { pl: 'Trudne', en: 'Hard' },
  'quests.diff.extreme': { pl: 'Ekstr.', en: 'Extr.' },
  'quests.diff.boss': { pl: 'Boss', en: 'Boss' },
  'quests.diff.hint.easy': {
    pl: 'Krótkie zadanie w tle (kilkadziesiąt sekund). Niewielka szansa na łup, zwykła jakość.',
    en: 'Short background task (under a minute). Low loot chance, common quality.',
  },
  'quests.diff.hint.medium': {
    pl: 'Dłuższe zadanie (ok. 1–2 min). Przeciętna szansa na łup, zwykłe lub rzadkie przedmioty.',
    en: 'Longer task (~1–2 min). Average loot chance, common or rare items.',
  },
  'quests.diff.hint.hard': {
    pl: 'Poważne zlecenie (kilka minut). Spora szansa na łup, w tym epickie przedmioty.',
    en: 'Serious job (a few minutes). Solid loot chance, epics included.',
  },
  'quests.diff.hint.extreme': {
    pl: 'Ekstremalne zlecenie (5+ min). Wysoka szansa na łup, w tym rzeczy epickie i legendarne.',
    en: 'Extreme job (5+ min). High loot chance, epics and legendaries.',
  },
  'quests.diff.hint.boss': {
    pl: 'Zlecenie-finał rozdziału (10 min). Gwarantowany unikalny przedmiot dla twojej klasy.',
    en: 'Chapter-finale job (10 min). Guaranteed unique class item.',
  },
  'quests.locked': { pl: 'ODBLOKOWANE OD LVL {lvl}', en: 'UNLOCKS AT LVL {lvl}' },
  'quests.start.btn': { pl: 'WYRUSZ · {min} MIN', en: 'GO · {min} MIN' },
  'quests.mount.title': { pl: 'Wierzchowiec skraca quest o {pct}%', en: 'Mount cuts quest time by {pct}%' },
  'quests.active.travel': { pl: 'W drodze...', en: 'En route...' },
  'quests.skip.full': { pl: 'ZAKOŃCZ TERAZ · ', en: 'FINISH NOW · ' },
  'quests.skip.half': { pl: 'SKRÓĆ O 50%', en: 'CUT BY 50%' },
  'quests.skip.half.reason': {
    pl: 'Zmniejsza pozostały czas questa o połowę.',
    en: 'Halves remaining quest time.',
  },
  'quests.collect.btn': { pl: 'ODBIERZ NAGRODĘ!', en: 'CLAIM REWARD!' },
  'quests.done.today': { pl: 'Ukończono dzisiaj', en: 'Done today' },
  'quests.done.refreshIn': { pl: 'Dostępne ponownie za ', en: 'Available again in ' },

  // ===== Common nav =====
  'common.backToTown': { pl: '← Miasto', en: '← Town' },

  // ===== World map =====
  'world.title': { pl: 'MAPA ŚWIATA', en: 'WORLD MAP' },
  'world.flavor': {
    pl: 'Idziesz, walczysz, wracasz. Tak to się kręci.',
    en: 'You go, you fight, you return. That’s how it spins.',
  },
  'world.empty': { pl: 'Brak regionów. Wróć później.', en: 'No regions. Come back later.' },
  'world.help.title': { pl: 'Jak działa mapa?', en: 'How does the map work?' },
  'world.help.label': { pl: 'Jak to działa?', en: 'How does it work?' },
  'world.help.p1': {
    pl: 'Każdy region to osobna mapa. Strzałkami pod mapą przeskakujesz między regionami. Każdy loch na mapie to jeden węzeł.',
    en: 'Each region is a separate map. Use the arrows below the map to switch regions. Each dungeon is one node.',
  },
  'world.help.p2.green': { pl: 'Zielone', en: 'Green' },
  'world.help.p2.greenBody': {
    pl: ' — ukończone (bossa już pokonałeś, moby nadal farmisz).',
    en: ' — cleared (boss is down, mobs still farmable).',
  },
  'world.help.p2.yellow': { pl: 'Żółte', en: 'Yellow' },
  'world.help.p2.yellowBody': { pl: ' — otwarte, idź i walcz. ', en: ' — open, go fight. ' },
  'world.help.p2.gray': { pl: 'Szare', en: 'Gray' },
  'world.help.p2.grayBody': {
    pl: ' — zamknięte; najedź, żeby zobaczyć czego brakuje.',
    en: ' — locked; tap and hold to see what is missing.',
  },
  'world.help.p3': {
    pl: 'Każdy boss raz na dobę. Potem czekasz do 00:00 UTC.',
    en: 'Each boss once per day. Then wait until 00:00 UTC.',
  },
  'world.region.label': {
    pl: 'Region {n} / {total} · {cleared}/{dt} ukończone',
    en: 'Region {n} / {total} · {cleared}/{dt} cleared',
  },
  'world.region.prev.aria': { pl: 'Poprzedni region', en: 'Previous region' },
  'world.region.next.aria': { pl: 'Następny region', en: 'Next region' },
  'world.dungeon.cleared': { pl: 'UKOŃCZONY', en: 'CLEARED' },
  'world.dungeon.unlocked': { pl: 'OTWARTY', en: 'OPEN' },
  'world.dungeon.lockBadge': { pl: 'LVL {lvl}+', en: 'LVL {lvl}+' },
  'world.dungeon.boss': { pl: 'Boss: {name} · LVL {lvl}', en: 'Boss: {name} · LVL {lvl}' },
  'world.dungeon.lowChance': {
    pl: 'Twój LVL {lvl} — niska szansa',
    en: 'Your LVL {lvl} — low odds',
  },

  // ===== Common toast =====
  'toast.failed': { pl: 'Nie udało się.', en: 'Failed.' },
  'toast.staminaRefilled': { pl: '+10 wytrzymałości.', en: '+10 stamina.' },
  'toast.renamed': { pl: 'Nowe imię: {name}.', en: 'New name: {name}.' },
  'toast.shopRefreshed': { pl: 'Oferta odświeżona.', en: 'Shop refreshed.' },
  'toast.healInstant': { pl: 'HP/MP przywrócone.', en: 'HP/MP restored.' },
  'toast.devGrant.gems': { pl: '+{n} gemów', en: '+{n} gems' },
  'toast.devGrant.gold': { pl: '+{n}g', en: '+{n}g' },
  'toast.devGrant.empty': { pl: 'Przyznano.', en: 'Granted.' },
  'toast.devGrant.failed': { pl: 'Nie udało się przyznać: {msg}', en: 'Grant failed: {msg}' },
  'toast.gemShop.verifyFailed': {
    pl: 'Weryfikacja zakupu nie powiodła się: {reason}',
    en: 'Purchase verification failed: {reason}',
  },
  'toast.gemShop.nativeFailed': {
    pl: 'Zakup przerwany: {code}',
    en: 'Purchase cancelled: {code}',
  },
  'toast.gemShop.webNotSupported': {
    pl: 'Klejnoty kupisz w aplikacji Android.',
    en: 'Gems are sold in the Android app.',
  },
  'toast.gemShop.unknownPack': {
    pl: 'Nieznany pakiet.',
    en: 'Unknown pack.',
  },
  'toast.gemShop.emptyPack': {
    pl: 'Ten zakup niczego nie przyznaje.',
    en: 'This purchase grants nothing.',
  },
  'gemShop.web.banner.title': {
    pl: 'KUP W APLIKACJI',
    en: 'BUY IN THE APP',
  },
  'gemShop.web.banner.body': {
    pl: 'Klejnoty można kupić tylko w aplikacji Android. W przeglądarce zobaczysz je natychmiast — to samo konto, ten sam stan.',
    en: 'Gems are sold in the Android app only. You’ll see them in the browser instantly — same account, same state.',
  },
  'gemShop.modal.heading': {
    pl: 'KUP W APLIKACJI',
    en: 'BUY IN THE APP',
  },
  'gemShop.modal.title': {
    pl: 'Płatności tylko z Google Play',
    en: 'Payments only via Google Play',
  },
  'gemShop.modal.body': {
    pl: '„{product}" — i każdy inny zakup — kupisz wyłącznie w aplikacji Szczurogród zainstalowanej z Google Play.',
    en: '"{product}" — and every other purchase — is available only in the Ratburg app installed from Google Play.',
  },
  'gemShop.modal.note': {
    pl: 'Konto pozostaje to samo. Klejnoty kupione w aplikacji pojawią się w przeglądarce natychmiast.',
    en: 'Same account, same progress. Gems bought in the app appear in the browser instantly.',
  },
  'gemShop.modal.ok': {
    pl: 'ROZUMIEM',
    en: 'GOT IT',
  },

  // ===== Active buffs bar =====
  'buff.title': {
    pl: '{label} {value}{curse} — jeszcze {ttl}',
    en: '{label} {value}{curse} — {ttl} left',
  },
  'buff.curse.suffix': { pl: ' (klątwa)', en: ' (curse)' },

  // ===== Gem sink button =====
  'gemSink.pending': { pl: 'Chwila...', en: 'One moment...' },
  'gemSink.lack': {
    pl: 'Brak gemów (potrzeba {cost}, masz {have}).',
    en: 'Not enough gems (need {cost}, have {have}).',
  },
  'gemSink.cost': { pl: 'Koszt: {cost} gemów.', en: 'Cost: {cost} gems.' },

  // ===== App boot fallbacks =====
  'app.boot.connError': { pl: 'Błąd połączenia z serwerem.', en: 'Server connection failed.' },
  'app.boot.logout': { pl: 'Wyloguj', en: 'Log out' },
  'app.boot.loading': { pl: 'Ładowanie postaci...', en: 'Loading character...' },

  // ===== Dungeon =====
  'dungeon.fallback.name': { pl: 'Loch Zapomnienia', en: 'Forgotten Dungeon' },
  'dungeon.fallback.desc': { pl: 'Wybierz przeciwnika', en: 'Pick an enemy' },
  'dungeon.toast.keyBought': { pl: 'Dokupiono klucz.', en: 'Extra key bought.' },
  'dungeon.toast.dailyReset': { pl: 'Liczniki dzienne wyzerowane.', en: 'Daily counters reset.' },
  'dungeon.toast.cooldownSkipped': { pl: 'Cooldown zdjęty.', en: 'Cooldown skipped.' },
  'dungeon.keys.label': { pl: 'KLUCZE DO LOCHU: {n}/{max}', en: 'DUNGEON KEYS: {n}/{max}' },
  'dungeon.keys.full': { pl: 'Pełna pula. Idź i siej zamęt.', en: 'Pool is full. Go cause some chaos.' },
  'dungeon.keys.next': { pl: '+1 za {time}', en: '+1 in {time}' },
  'dungeon.keys.buy': { pl: 'KUP', en: 'BUY' },
  'dungeon.keys.buy.reason': { pl: 'Dokup klucz (bypass cap).', en: 'Buy a key (bypasses cap).' },
  'dungeon.dailyMaxed.title': { pl: 'KILKA MOBÓW ZA CAPEM', en: 'SOME MOBS AT CAP' },
  'dungeon.dailyMaxed.body': {
    pl: 'Nie chcesz czekać do północy? Wyzeruj wszystkie liczniki dzienne.',
    en: 'Don’t want to wait until midnight? Reset all daily counters.',
  },
  'dungeon.dailyMaxed.reset': { pl: 'RESET', en: 'RESET' },
  'dungeon.dailyMaxed.reset.reason': {
    pl: 'Wyzeruj kills_today wszystkich mobów dla dziś UTC.',
    en: 'Reset kills_today for all mobs for today UTC.',
  },
  'dungeon.tracks.title': { pl: 'TROPY · bonusy ×2 gold/XP + 1.5× łup', en: 'TRACKS · ×2 gold/XP + 1.5× loot' },
  'dungeon.tracks.empty': { pl: 'pusty slot', en: 'empty slot' },
  'dungeon.tracks.reroll.title': { pl: 'Reroll za {n} gemów', en: 'Reroll for {n} gems' },
  'dungeon.tracks.fillIn': { pl: 'Pusty slot sam się zapełni ', en: 'Empty slot fills automatically ' },
  'dungeon.tracks.in': { pl: 'za', en: 'in' },
  'dungeon.tracks.fillIn.reroll': { pl: '. Nie chcesz czekać — wymień za ', en: '. Don’t want to wait — reroll for ' },
  'dungeon.tracks.fillIn.suffix': { pl: '.', en: '.' },
  'dungeon.lowHp': {
    pl: 'Za mało HP aby ruszyć w bój (min. 20). Odpocznij chwilę lub odwiedź uzdrowicielkę w karczmie.',
    en: 'Not enough HP to engage (min 20). Rest a bit or visit the healer at the tavern.',
  },
  'dungeon.lock.chain': { pl: 'Zablokowany — pokonaj poprzednika.', en: 'Locked — beat the previous one.' },
  'dungeon.lock.lvl': { pl: 'Wymagany LVL {lvl}', en: 'Requires LVL {lvl}' },
  'dungeon.lock.hp': { pl: 'Za mało HP — wylecz się.', en: 'Low HP — heal up.' },
  'dungeon.cooldown.title': { pl: 'Potwór odpoczywa. Wróć za {time}.', en: 'Monster is resting. Back in {time}.' },
  'dungeon.daily.title': { pl: 'Dzienny limit osiągnięty. Reset o północy UTC.', en: 'Daily limit reached. Resets at midnight UTC.' },
  'dungeon.tracked.title': { pl: 'Wytropiony! ×2 gold, ×2 XP, 1.5× szansa na łup.', en: 'Tracked! ×2 gold, ×2 XP, 1.5× loot chance.' },
  'dungeon.track.tag': { pl: 'TROP ×2', en: 'TRACK ×2' },
  'dungeon.daily.body': {
    pl: 'Dzienny limit ubitych: {n}. Reset o północy UTC.',
    en: 'Daily kill limit: {n}. Resets at midnight UTC.',
  },
  'dungeon.daily.kills': { pl: '{cur}/{max} dzisiaj', en: '{cur}/{max} today' },
  'dungeon.skip.noGems': { pl: 'Brak gemów ({n}).', en: 'Not enough gems ({n}).' },
  'dungeon.skip.title': { pl: 'Pomiń cooldown za gemy.', en: 'Skip cooldown with gems.' },
  'dungeon.tag.elite': { pl: 'ELITE', en: 'ELITE' },
  'dungeon.tag.boss': { pl: 'BOSS', en: 'BOSS' },
  'dungeon.tag.byOrder': { pl: 'PO KOLEI', en: 'IN ORDER' },
  'dungeon.tag.lvl': { pl: 'LVL {lvl}', en: 'LVL {lvl}' },
  'dungeon.statline': { pl: 'Lvl {lvl} · HP {hp} · ATK {atk}', en: 'Lvl {lvl} · HP {hp} · ATK {atk}' },
  'dungeon.help.title': { pl: 'Klucze, tropy, cooldowny', en: 'Keys, tracks, cooldowns' },
  'dungeon.help.label': { pl: 'Jak to działa?', en: 'How does it work?' },
  'dungeon.serial.label': {
    pl: 'Walki w serii (bossy 1×):',
    en: 'Fight in series (bosses 1×):',
  },
  'dungeon.serial.toast.stopped': {
    pl: 'Seria przerwana — brak klucza, limit lub odpoczynek.',
    en: 'Series stopped — no key, daily limit or cooldown.',
  },
  'combat.serial.badge': {
    pl: 'WALKA {n}/{total}',
    en: 'FIGHT {n}/{total}',
  },
  'dungeon.help.p1.a': { pl: 'Każda walka kosztuje ', en: 'Each fight costs ' },
  'dungeon.help.p1.b': { pl: 'jeden klucz do lochu', en: 'one dungeon key' },
  'dungeon.help.p1.c': { pl: '. Nosisz ich maks. ', en: '. You carry up to ' },
  'dungeon.help.p1.d': { pl: '15', en: '15' },
  'dungeon.help.p1.e': { pl: ', a jeden dopisuje się ', en: ', and one ticks in ' },
  'dungeon.help.p1.f': { pl: 'co 15 minut', en: 'every 15 minutes' },
  'dungeon.help.p1.g': {
    pl: ' — też gdy gra jest zamknięta. Bez klucza stróż nie wpuści.',
    en: ' — even with the app closed. No key, no entry.',
  },
  'dungeon.help.p2.a': { pl: 'Tropy', en: 'Tracks' },
  'dungeon.help.p2.b': { pl: ' to trzy aktywne leady na konkretne moby. Zabicie wytropionego = ', en: ' are three active leads on specific mobs. Killing a tracked one = ' },
  'dungeon.help.p2.c': { pl: '×2 gold, ×2 XP, 1.5× szansa na łup', en: '×2 gold, ×2 XP, 1.5× loot chance' },
  'dungeon.help.p2.d': { pl: '. Trop wygasa po 2h; pusty slot odnawia się co godzinę. Słaby trop? Za ', en: '. Tracks expire after 2h; an empty slot refills every hour. Weak track? For ' },
  'dungeon.help.p2.e': { pl: '10 gemów', en: '10 gems' },
  'dungeon.help.p2.f': { pl: ' rerollujesz go (przycisk odśwież w rogu kafelka).', en: ' you can reroll it (refresh button in the tile corner).' },
  'dungeon.help.p3.a': { pl: 'Dodatkowe klucze wpadają z ', en: 'Extra keys come from ' },
  'dungeon.help.p3.b': { pl: 'codziennej skrzyni', en: 'the daily chest' },
  'dungeon.help.p3.c': { pl: ' (dzień 3 = +2) i z ', en: ' (day 3 = +2) and from ' },
  'dungeon.help.p3.d': { pl: 'boss-questów', en: 'boss quests' },
  'dungeon.help.p3.e': { pl: ' (q5, q10, q15 — po 5 kluczy). Jeśli pula jest pełna, nadmiar przepada.', en: ' (q5, q10, q15 — 5 keys each). If the pool is full, the rest is lost.' },
  'dungeon.help.p4.a': { pl: 'Każdy potwór po ubiciu ', en: 'Every monster, after dying, ' },
  'dungeon.help.p4.b': { pl: 'odpoczywa', en: 'rests' },
  'dungeon.help.p4.c': { pl: ' — goblin pół minuty, boss 20. A do tego ma ', en: ' — goblin for half a minute, boss for 20. Plus a ' },
  'dungeon.help.p4.d': { pl: 'dzienny limit', en: 'daily limit' },
  'dungeon.help.p4.e': { pl: ': goblinów 25, widm 6, kościanych smoków 2 (chowają się w skałach). Liczniki resetują się o ', en: ': goblins 25, wraiths 6, bone dragons 2 (they hide in the rocks). Counters reset at ' },
  'dungeon.help.p4.f': { pl: '00:00 UTC', en: '00:00 UTC' },
  'dungeon.help.p4.g': { pl: '.', en: '.' },
  'dungeon.help.p5': { pl: 'Tak, można przespać cały refill. Tak, to idle RPG.', en: 'Yes, you can sleep through the whole refill. Yes, it’s an idle RPG.' },
  'dungeon.back.world': { pl: '← Mapa świata', en: '← World map' },
  'dungeon.ability.magic': { pl: 'MAG', en: 'MAG' },
  'dungeon.ability.poison': { pl: 'JAD', en: 'POISON' },
  'dungeon.ability.armor_pierce': { pl: 'PIERCE', en: 'PIERCE' },
  'dungeon.ability.tooltip.magic': {
    pl: '{pct}% szans na atak ignorujący połowę DEF.',
    en: '{pct}% chance of an attack ignoring half of DEF.',
  },
  'dungeon.ability.tooltip.poison': {
    pl: '{pct}% szans na trucizny {dmg}/turę przez {turns} tury.',
    en: '{pct}% chance of poison {dmg}/turn for {turns} turns.',
  },
  'dungeon.ability.tooltip.armor_pierce': {
    pl: 'Każde uderzenie przebija połowę DEF ({pct}%).',
    en: 'Each hit pierces half of DEF ({pct}%).',
  },

  // ===== Enemy flavor (fight-intro line per slug) =====
  'dungeon.enemy.flavor.goblin-scav': { pl: 'Twoje buty śmierdzą!', en: 'Your boots stink!' },
  'dungeon.enemy.flavor.rat-giant': { pl: '*piszczy*', en: '*squeaks*' },
  'dungeon.enemy.flavor.slime-green': { pl: 'splosh.', en: 'splosh.' },
  'dungeon.enemy.flavor.kobold-thief': {
    pl: 'Twoje złoto będzie moje!',
    en: 'Your gold is mine!',
  },
  'dungeon.enemy.flavor.goblin-warrior': { pl: 'Za króla!', en: 'For the king!' },
  'dungeon.enemy.flavor.cave-spider': { pl: '*syczy*', en: '*hisses*' },
  'dungeon.enemy.flavor.skeleton-soldier': { pl: '*klekocze*', en: '*rattles*' },
  'dungeon.enemy.flavor.bat-dire': { pl: 'skrzyyy!', en: 'screeeech!' },
  'dungeon.enemy.flavor.troll-cave': { pl: 'GRRRR!', en: 'GRRRR!' },
  'dungeon.enemy.flavor.demon-imp': { pl: 'hihihi~', en: 'hihihi~' },
  'dungeon.enemy.flavor.ogre-brute': { pl: 'OGR SMASH!', en: 'OGRE SMASH!' },
  'dungeon.enemy.flavor.skeleton-captain': { pl: '*za życia!*', en: '*back when alive!*' },
  'dungeon.enemy.flavor.goblin-shaman': { pl: 'Mana płonie!', en: 'Mana burns!' },
  'dungeon.enemy.flavor.minotaur': { pl: 'MUUUUU!', en: 'MUUUUU!' },
  'dungeon.enemy.flavor.slime-shadow': { pl: 'spluurk...', en: 'spluurk...' },
  'dungeon.enemy.flavor.wraith': { pl: 'uuuuuuu...', en: 'uuuuuuu...' },
  'dungeon.enemy.flavor.hobgoblin-king': { pl: 'KLĘCZEĆ!', en: 'KNEEL!' },
  'dungeon.enemy.flavor.bone-dragon': { pl: 'RRRRR-klekklek', en: 'RRRRR-rattlerattle' },
  'dungeon.enemy.flavor.void-horror': { pl: '...gyyyrrr...', en: '...gyyyrrr...' },

  // ===== Combat =====
  'combat.dmg.miss': { pl: 'PUDŁO', en: 'MISS' },
  'combat.dmg.dodge': { pl: 'UNIK', en: 'DODGE' },
  'combat.log.met': { pl: 'Spotkałeś: {name}! {flavor}', en: 'You met: {name}! {flavor}' },
  'combat.log.dodged': { pl: '{name} uniknął ciosu!', en: '{name} dodged the hit!' },
  'combat.log.enemyHit': { pl: '{enemy} ciął za {dmg}', en: '{enemy} hits for {dmg}' },
  'combat.log.poisonTick': { pl: 'Trucizna tnie za {dmg}!', en: 'Poison ticks for {dmg}!' },
  'combat.log.miss': { pl: '{name} spudłował!', en: '{name} missed!' },
  'combat.log.hit': { pl: '{name} trafił za {dmg}', en: '{name} hits for {dmg}' },
  'combat.log.crit.suffix': { pl: ' (KRYT!)', en: ' (CRIT!)' },
  'combat.log.loot': { pl: 'Zdobyto: {name}!', en: 'Got: {name}!' },
  'combat.log.drank': { pl: 'Wypił {name}', en: 'Drank {name}' },
  'combat.ability.magic': { pl: '{name} rzuca klątwę — pancerz nie pomaga!', en: '{name} casts a curse — armor won’t help!' },
  'combat.ability.poison': { pl: '{name} zatruwa na {turns} tury!', en: '{name} poisons for {turns} turns!' },
  'combat.ability.armor_pierce': { pl: '{name} przebija pancerz!', en: '{name} pierces armor!' },
  'combat.status.poison': { pl: 'TRUCIZNA {dmg}/turę · {turns}×', en: 'POISON {dmg}/turn · {turns}×' },
  'combat.status.title': {
    pl: 'Status effect aktywny — tyka na początku każdej twojej tury.',
    en: 'Active status effect — ticks at the start of each of your turns.',
  },
  'combat.tracked.title': { pl: 'Wytropiony mob — nagrody ×2, większa szansa na łup.', en: 'Tracked mob — ×2 rewards, higher loot chance.' },
  'combat.tracked.tag': { pl: 'TROP ×2', en: 'TRACK ×2' },
  'combat.decision': { pl: 'Decyzja…', en: 'Decision…' },
  'combat.sim.toggleStop': { pl: 'STOP — wracam do sterów', en: 'STOP — back to controls' },
  'combat.sim.toggleStart': { pl: 'SYMULUJ WALKĘ', en: 'SIMULATE FIGHT' },
  'combat.sim.toggleStop.title': { pl: 'Klik zatrzymuje symulację. Ty znów decydujesz.', en: 'Tap stops the simulation. You decide again.' },
  'combat.sim.toggleStart.title': {
    pl: 'Auto-pilot. Klepie akcje wg ustawień poniżej. Ręcznie nadal możesz odpalać MOCNY/MAGIA/LECZ.',
    en: 'Auto-pilot. Acts per settings below. You can still trigger HEAVY/MAGIC/HEAL manually.',
  },
  'combat.sim.autoHeal': { pl: 'Auto-lecz', en: 'Auto-heal' },
  'combat.sim.autoHeal.sub': { pl: 'gdy HP < 40%', en: 'when HP < 40%' },
  'combat.sim.autoHeal.title': {
    pl: 'Gdy HP spadnie poniżej 40% max i masz miksturę HP w plecaku — sim ją wypije. Tura i tak stracona.',
    en: 'When HP drops below 40% max and you have an HP potion — sim drinks it. Turn is spent either way.',
  },
  'combat.sim.heavy': { pl: 'Mocny', en: 'Heavy' },
  'combat.sim.heavy.sub': { pl: 'gdy gotowy', en: 'when ready' },
  'combat.sim.heavy.title': { pl: 'Sim wbija MOCNY gdy zdjęty z cooldownu. Wyższe dmg kosztem ryzyka pudła.', en: 'Sim uses HEAVY off cooldown. Higher dmg, miss risk.' },
  'combat.sim.magic': { pl: 'Magia', en: 'Magic' },
  'combat.sim.magic.sub': { pl: 'gdy MP ≥ 10', en: 'when MP ≥ 10' },
  'combat.sim.magic.title': { pl: 'Sim rzuca MAGIA gdy ma MP. Przebija 50% DEF — wygra z opancerzonym, jeśli wyłączysz, MP zostaje na twoje ręczne czary.', en: 'Sim casts MAGIC when it has MP. Pierces 50% DEF — wins vs armored. Off = MP saved for manual casts.' },
  'combat.btn.atk': { pl: 'ATAK', en: 'ATTACK' },
  'combat.btn.atk.title': { pl: 'Pewny atak. Brak ryzyka, brak kosztu.', en: 'Safe attack. No risk, no cost.' },
  'combat.btn.heavy': { pl: 'MOCNY', en: 'HEAVY' },
  'combat.btn.heavy.cooldown': { pl: 'na chłodzeniu', en: 'cooling down' },
  'combat.btn.heavy.preview': { pl: '{lo}–{hi} · {pct}% pudło', en: '{lo}–{hi} · {pct}% miss' },
  'combat.btn.heavy.lockedTitle': { pl: 'MOCNY gotowy za {n} rund', en: 'HEAVY ready in {n} rounds' },
  'combat.btn.heavy.title': { pl: 'Duży cios. Ryzyko pudła {pct}%. Cooldown 3 rundy.', en: 'Big hit. {pct}% miss risk. 3-round cooldown.' },
  'combat.btn.magic': { pl: 'MAGIA', en: 'MAGIC' },
  'combat.btn.magic.title': { pl: 'Magia: ignoruje 50% pancerza celu. Koszt −10 MP.', en: 'Magic: ignores 50% of target armor. Cost −10 MP.' },
  'combat.btn.heal': { pl: 'LECZ', en: 'HEAL' },
  'combat.btn.heal.none': { pl: 'BRAK MIKSTUR', en: 'NO POTIONS' },
  'combat.btn.heal.count': { pl: '{n} w plecaku', en: '{n} in bag' },
  'combat.btn.heal.title.empty': { pl: 'Brak mikstur w plecaku.', en: 'No potions in bag.' },
  'combat.btn.heal.title': { pl: 'Wybierz miksturę. Zużywa turę — przeciwnik kontratakuje.', en: 'Pick a potion. Costs a turn — enemy hits back.' },
  'combat.flee': { pl: 'UCIEKAJ — porzuć walkę', en: 'FLEE — leave the fight' },
  'combat.flee.title': { pl: 'Klucz już spalony — walka się nie liczy, ale HP/MP zostają jak teraz. Bez łupu, bez XP.', en: 'Key already spent — fight doesn’t count, HP/MP stay as is. No loot, no XP.' },
  'combat.picker.heading': { pl: 'WYBIERZ MIKSTURĘ', en: 'PICK A POTION' },
  'combat.picker.empty': { pl: 'Plecak pusty. Kup u piekarza albo w sklepie.', en: 'Bag is empty. Buy from the baker or shop.' },
  'combat.picker.close.aria': { pl: 'Zamknij', en: 'Close' },
  'combat.victory': { pl: 'ZWYCIĘSTWO!', en: 'VICTORY!' },
  'combat.victory.lootLabel': { pl: 'ŁUP · ', en: 'LOOT · ' },
  'combat.victory.next': { pl: 'DALEJ!', en: 'ONWARD!' },
  'combat.defeat': { pl: 'PORAŻKA!', en: 'DEFEAT!' },
  'combat.defeat.body': { pl: 'Zostajesz z 1 HP. Wylecz się i wracaj.', en: 'You drop to 1 HP. Heal up and come back.' },
  'combat.defeat.retreat': { pl: 'WYCOFAJ SIĘ', en: 'RETREAT' },
  'combat.boss.warning': { pl: 'OSTRZEŻENIE', en: 'WARNING' },
  'combat.boss.label': { pl: 'BOSS', en: 'BOSS' },
  'combat.tower.victory.milestone': { pl: 'MILESTONE!', en: 'MILESTONE!' },
  'combat.tower.victory.up': { pl: 'WYŻEJ!', en: 'HIGHER!' },
  'combat.tower.victory.completed': { pl: 'Ukończone piętro {n}. Schody skrzypią dalej.', en: 'Completed floor {n}. The stairs creak on.' },
  'combat.tower.victory.next': { pl: 'DALEJ', en: 'ONWARD' },
  'combat.tower.defeat.body': { pl: 'Padłeś. Wieża nie wybacza.', en: 'You fell. The tower doesn’t forgive.' },
  'combat.tower.defeat.rest': { pl: 'Odpoczynek: {time}', en: 'Rest: {time}' },
  'combat.tower.defeat.tail': { pl: 'Wróć do wieży — tam możesz wskrzesić się za gemy albo poczekać.', en: 'Back to the tower — revive for gems or wait.' },

  // ===== Settings =====
  'settings.heading': { pl: 'USTAWIENIA', en: 'SETTINGS' },
  'settings.flavor': { pl: 'Pokręcisz, poskrobiesz, wyjdziesz.', en: 'Tweak it, scratch it, leave.' },
  'settings.section.account': { pl: 'KONTO', en: 'ACCOUNT' },
  'settings.section.game': { pl: 'GRA', en: 'GAME' },
  'settings.section.lang': { pl: 'JĘZYK', en: 'LANGUAGE' },
  'settings.section.legal': { pl: 'ZASADY', en: 'LEGAL' },
  'settings.section.danger': { pl: 'STREFA ZAGROŻENIA', en: 'DANGER ZONE' },
  'settings.section.about': { pl: 'O GRZE', en: 'ABOUT' },
  'settings.guest.label': { pl: 'Gość bez nazwiska', en: 'Anonymous guest' },
  'settings.email': { pl: 'Email', en: 'Email' },
  'settings.character': { pl: 'Twoja postać', en: 'Your character' },
  'settings.rename.btn': { pl: 'ZMIEŃ IMIĘ', en: 'RENAME' },
  'settings.rename.title.notEnough': { pl: 'Potrzeba {n} gemów.', en: 'Need {n} gems.' },
  'settings.rename.title': { pl: 'Zmień imię postaci. 30-dniowy cooldown.', en: 'Change character name. 30-day cooldown.' },
  'settings.rename.heading': { pl: 'NOWE IMIĘ', en: 'NEW NAME' },
  'settings.rename.cost': { pl: 'Koszt: ', en: 'Cost: ' },
  'settings.rename.cooldown': { pl: ' · cooldown 30 dni', en: ' · 30-day cooldown' },
  'settings.btn.cancel': { pl: 'ANULUJ', en: 'CANCEL' },
  'settings.btn.change': { pl: 'ZMIEŃ', en: 'CHANGE' },
  'settings.guest.warning': {
    pl: 'konto bez emaila znika razem z pamięcią przeglądarki. Zarejestruj się aby nie stracić postępu.',
    en: 'account without email disappears with browser storage. Sign up to keep progress.',
  },
  'settings.guest.warningPrefix': { pl: 'Uwaga gościu:', en: 'Heads up, guest:' },
  'settings.logout': { pl: 'WYLOGUJ', en: 'LOG OUT' },
  'settings.btn.editAppearance': { pl: 'ZMIEŃ WYGLĄD', en: 'CHANGE LOOK' },
  'settings.btn.replayTutorial': { pl: 'POWTÓRZ TUTORIAL', en: 'REPLAY TUTORIAL' },
  'settings.btn.privacy': { pl: 'POLITYKA PRYWATNOŚCI', en: 'PRIVACY POLICY' },
  'settings.btn.terms': { pl: 'REGULAMIN', en: 'TERMS OF SERVICE' },
  'settings.danger.body.before': { pl: 'Usunięcie konta jest ', en: 'Deleting your account is ' },
  'settings.danger.body.bold': { pl: 'nieodwracalne', en: 'irreversible' },
  'settings.danger.body.after': {
    pl: '. Postać, ekwipunek, gildia, historia — wszystko znika. Gemy też.',
    en: '. Character, equipment, guild, history — all gone. Gems too.',
  },
  'settings.deleteAccount': { pl: 'USUŃ KONTO', en: 'DELETE ACCOUNT' },
  'settings.about.version': { pl: 'Wersja', en: 'Version' },
  'settings.about.engine': { pl: 'Silnik', en: 'Engine' },
  'settings.about.flavor': { pl: 'Zrobiono z miłości i sera.', en: 'Made with love and cheese.' },
  'settings.back': { pl: '← Wróć', en: '← Back' },
  'settings.admin.title': { pl: 'ADMIN — RELOAD CONTENT', en: 'ADMIN — RELOAD CONTENT' },
  'settings.admin.body': {
    pl: '(z .env serwera). Przeładowuje REGISTRY po edycjach w DataGrip bez restartu.',
    en: '(from server .env). Reloads REGISTRY after DataGrip edits without restart.',
  },
  'settings.admin.body.prefix': { pl: 'Wpisz ', en: 'Enter ' },
  'settings.admin.save': { pl: 'ZAPISZ', en: 'SAVE' },
  'settings.admin.forget': { pl: 'zapomnij', en: 'forget' },
  'settings.admin.loading': { pl: 'ŁADUJĘ…', en: 'LOADING…' },
  'settings.admin.reload': { pl: 'RELOAD CONTENT', en: 'RELOAD CONTENT' },
  'settings.admin.err': { pl: 'BŁĄD · ', en: 'ERROR · ' },
  'settings.legal.close': { pl: 'ZAMKNIJ', en: 'CLOSE' },
  'settings.delete.heading': { pl: 'USUWASZ KONTO', en: 'DELETING ACCOUNT' },
  'settings.delete.warning': {
    pl: 'Postać, ekwipunek, gemy, gildia, historia walk — znikną. Nie da się tego cofnąć. Jeśli prowadzisz gildię, najpierw przekaż przywództwo.',
    en: 'Character, equipment, gems, guild, fight history — gone. Can’t be undone. If you lead a guild, transfer leadership first.',
  },
  'settings.delete.password': { pl: 'Hasło:', en: 'Password:' },
  'settings.delete.confirmAsk': { pl: 'Wpisz ', en: 'Type ' },
  'settings.delete.confirmAsk.suffix': { pl: ' żeby potwierdzić:', en: ' to confirm:' },
  'settings.delete.confirmKeyword': { pl: 'USUŃ', en: 'DELETE' },
  'settings.delete.deleting': { pl: 'KASUJĘ…', en: 'DELETING…' },
  'settings.delete.errFallback': { pl: 'Coś poszło nie tak. Spróbuj ponownie.', en: 'Something went wrong. Try again.' },
  'settings.lang.heading': { pl: 'Język interfejsu', en: 'Interface language' },
  'settings.legal.privacy': {
    pl: `POLITYKA PRYWATNOŚCI · Szczurogród

OSTATNIA AKTUALIZACJA: kwiecień 2026

1. KTO PRZETWARZA TWOJE DANE
Administratorem danych jest deweloper gry Szczurogród. Kontakt: support@szczurogrod.pl (placeholder — uzupełnij przed launchem).

2. JAKIE DANE ZBIERAMY
• Konto z emailem: adres email + hash hasła (argon2id, hasła nie da się odwrócić).
• Konto-gość: tylko anonimowe ID. Bez emaila.
• Stan gry: postać, ekwipunek, postępy, statystyki walk, członkostwo w gildii, czat gildii.
• Logi techniczne: czas zapytań, błędy. Bez adresu IP w logach aplikacji.

3. PO CO TO ZBIERAMY
• Identyfikacja konta i logowanie (podstawa: wykonanie umowy, art. 6 ust. 1 lit. b RODO).
• Działanie mechanik gry server-authoritative — bez tego serwer nie wie kim jesteś.
• Anty-cheat: weryfikacja, że klient nie zmienia stanu samowolnie.

4. KOMU UDOSTĘPNIAMY
Nie sprzedajemy ani nie udostępniamy danych firmom trzecim do celów marketingowych. Hosting bazy: VPS UE (placeholder — wpisz konkretną lokalizację). Dane nie wychodzą poza EOG.

5. JAK DŁUGO TRZYMAMY
Konto aktywne — bezterminowo. Po usunięciu konta przez Ciebie (Ustawienia → STREFA ZAGROŻENIA → USUŃ KONTO) Twoje dane są kasowane natychmiast z bazy produkcyjnej. Backupy są nadpisywane w cyklu 30 dni.

6. TWOJE PRAWA (RODO)
• Prawo dostępu do danych — napisz na support, wyślemy export.
• Prawo do sprostowania — możesz zmienić email/hasło/imię postaci w grze.
• Prawo do usunięcia („prawo do bycia zapomnianym") — Ustawienia → USUŃ KONTO. Realizowane natychmiastowo, bez kosztu.
• Prawo do ograniczenia / sprzeciwu — napisz na support.
• Prawo do skargi do Prezesa UODO (uodo.gov.pl).

7. CIASTECZKA / LOCALSTORAGE
Używamy localStorage do przechowywania tokenów sesji (access + refresh JWT). Bez tego musiałbyś logować się przy każdym otwarciu. Brak ciasteczek śledzących.

8. DZIECI
Gra nie jest skierowana do osób poniżej 13 roku życia (COPPA). Nie zbieramy świadomie ich danych.

9. ZMIANY
Gdy zmienimy tę politykę, zobaczysz nowy banner przy logowaniu. Stara wersja zostaje w archiwum (link na żądanie).
`,
    en: `PRIVACY POLICY · Ratburg

LAST UPDATED: April 2026

1. WHO PROCESSES YOUR DATA
The data controller is the Ratburg developer. Contact: support@ratburg.app (placeholder — fill in before launch).

2. WHAT DATA WE COLLECT
• Email account: email address + password hash (argon2id, irreversible).
• Guest account: anonymous ID only. No email.
• Game state: character, equipment, progress, fight stats, guild membership, guild chat.
• Technical logs: query timing, errors. No IP addresses in app logs.

3. WHY WE COLLECT IT
• Account identification and login (basis: contract performance, GDPR art. 6(1)(b)).
• Server-authoritative game mechanics — without this the server doesn’t know who you are.
• Anti-cheat: verifying the client doesn’t change state on its own.

4. WHO WE SHARE IT WITH
We do not sell or share data with third parties for marketing. Database hosting: EU VPS (placeholder — fill in exact location). Data does not leave the EEA.

5. HOW LONG WE KEEP IT
Active account — indefinitely. After you delete the account (Settings → DANGER ZONE → DELETE ACCOUNT) your data is wiped from the production database immediately. Backups roll over every 30 days.

6. YOUR RIGHTS (GDPR)
• Right of access — write to support, we’ll send an export.
• Right to rectification — you can change email/password/character name in-game.
• Right to erasure ("right to be forgotten") — Settings → DELETE ACCOUNT. Immediate, free.
• Right to restriction / objection — write to support.
• Right to lodge a complaint with the supervisory authority.

7. COOKIES / LOCALSTORAGE
We use localStorage to store session tokens (access + refresh JWT). Without this, you’d have to log in on every launch. No tracking cookies.

8. CHILDREN
The game is not directed at users under 13 (COPPA). We do not knowingly collect their data.

9. CHANGES
If we change this policy, you’ll see a new banner at login. The old version stays in the archive (link on request).
`,
  },
  // ===== Oracle =====
  'oracle.title': { pl: 'WRÓŻKA HANUSIA', en: 'FORTUNE TELLER HANUSIA' },
  'oracle.flavor': {
    pl: 'Trzy karty. Wybierasz jedną. Hanusia udaje że jej wybór zmienia wynik.',
    en: 'Three cards. Pick one. Hanusia pretends your choice matters.',
  },
  'oracle.shuffling': { pl: 'Hanusia miesza talię…', en: 'Hanusia is shuffling the deck…' },
  'oracle.declined': { pl: 'Wróżka odmówiła.', en: 'The fortune teller refused.' },
  'oracle.cost.noGems': { pl: 'Brak gemów ({n}).', en: 'Not enough gems ({n}).' },
  'oracle.cost.confirm': {
    pl: 'Kosztuje {n}💎 — kliknij kartę ponownie żeby potwierdzić.',
    en: 'Costs {n}💎 — tap the card again to confirm.',
  },
  'oracle.next': { pl: 'DALEJ', en: 'NEXT' },
  'oracle.lootTable': { pl: 'CO MOŻE WYPAŚĆ', en: 'POSSIBLE LOOT' },
  'oracle.loot.gold': { pl: 'Gold — skaluje się z LVL (do 1000)', en: 'Gold — scales with LVL (up to 1000)' },
  'oracle.loot.xp': { pl: 'Doświadczenie — krótkie natchnienie', en: 'XP — a brief flash of insight' },
  'oracle.loot.potion': { pl: 'Mikstura (common)', en: 'Potion (common)' },
  'oracle.loot.common': { pl: 'Zwykły przedmiot', en: 'Common item' },
  'oracle.loot.rare': { pl: 'Rzadki przedmiot', en: 'Rare item' },
  'oracle.loot.always': { pl: 'Coś zawsze wypadnie. Hanusia nie znosi pustych rąk.', en: 'Something always drops. Hanusia hates empty hands.' },
  'oracle.back': { pl: '← WRÓĆ', en: '← BACK' },
  'oracle.banner.free': { pl: 'DARMOWY · KLIKNIJ KARTĘ', en: 'FREE · TAP A CARD' },
  'oracle.banner.noGems': { pl: 'Brak gemów ({n} potrzebne, masz {have})', en: 'Not enough gems ({n} needed, you have {have})' },
  'oracle.banner.confirm': { pl: 'POTWIERDŹ — KLIKNIJ KARTĘ', en: 'CONFIRM — TAP A CARD' },
  'oracle.banner.cost': { pl: 'KOSZT', en: 'COST' },
  'oracle.next.free': { pl: 'Darmowy za ', en: 'Free in ' },
  'oracle.gold.label': { pl: 'gold', en: 'gold' },
  'oracle.xp.label': { pl: 'doświadczenia', en: 'experience' },
  'oracle.headline.gold': { pl: 'ZŁOTO +{n}', en: 'GOLD +{n}' },
  'oracle.headline.xp': { pl: 'DOŚWIADCZENIE +{n}', en: 'EXPERIENCE +{n}' },
  'oracle.headline.potion': { pl: 'MIKSTURA', en: 'POTION' },
  'oracle.headline.item': { pl: 'PRZEDMIOT', en: 'ITEM' },
  'oracle.headline.rare': { pl: 'RZADKI ŁUP', en: 'RARE LOOT' },

  // ===== Create char =====
  'cc.heading': { pl: 'TWÓJ BOHATER', en: 'YOUR HERO' },
  'cc.step': { pl: 'Krok {n} z 3', en: 'Step {n} of 3' },
  'cc.backLogin': { pl: '← LOGOWANIE', en: '← LOG IN' },
  'cc.s1.heading': { pl: 'WYBIERZ KLASĘ', en: 'PICK A CLASS' },
  'cc.s1.flavor': { pl: 'Klasa zostaje na zawsze. Jak tatuaż po piwie.', en: 'Class is forever. Like a beer-tattoo.' },
  'cc.s2.heading': { pl: 'TWARZ I IMIĘ', en: 'FACE AND NAME' },
  'cc.s2.flavor': { pl: 'Tak wyglądasz na plakatach „Poszukiwany".', en: 'This is how you look on the wanted poster.' },
  'cc.s2.nameLabel': { pl: 'IMIĘ BOHATERA', en: 'HERO NAME' },
  'cc.s2.namePlaceholder': { pl: 'np. Gretka z Rzepnicy', en: 'e.g. Gretka of Turnipville' },
  'cc.s3.heading': { pl: 'BONUS STARTOWY', en: 'STARTER BONUS' },
  'cc.s3.flavor': { pl: 'Wybierz jeden. Tak. Tylko jeden. Nie pytaj.', en: 'Pick one. Yes. Just one. Don’t ask.' },
  'cc.back': { pl: '← WSTECZ', en: '← BACK' },
  'cc.next': { pl: 'DALEJ →', en: 'NEXT →' },
  'cc.finish': { pl: 'ZACZNIJ PRZYGODĘ!', en: 'BEGIN THE ADVENTURE!' },
  'cc.unnamed': { pl: 'Bezimienny', en: 'Nameless' },
  'cc.class.warrior.name': { pl: 'WOJOWNIK', en: 'WARRIOR' },
  'cc.class.warrior.desc': { pl: 'Tank z toporem. Rozwiązuje problemy siłą.', en: 'Tank with an axe. Solves problems by force.' },
  'cc.class.mage.name': { pl: 'MAG', en: 'MAGE' },
  'cc.class.mage.desc': { pl: 'Rzuca ogniem, czyta księgi, robi herbatę.', en: 'Throws fire, reads books, makes tea.' },
  'cc.class.rogue.name': { pl: 'ŁOTRZYK', en: 'ROGUE' },
  'cc.class.rogue.desc': { pl: 'Szybki, sprytny. Kieszonkowiec z klasą.', en: 'Fast, clever. A pickpocket with style.' },
  'cc.bonus.gold.name': { pl: 'Sakwa Kupca', en: 'Merchant’s Purse' },
  'cc.bonus.gold.desc': { pl: '+500 złota na start', en: '+500 gold to start' },
  'cc.bonus.gems.name': { pl: 'Garść Szafirów', en: 'Handful of Sapphires' },
  'cc.bonus.gems.desc': { pl: '+100 gemów na start', en: '+100 gems to start' },
  'cc.bonus.potion.name': { pl: 'Zestaw Alchemika', en: 'Alchemist’s Kit' },
  'cc.bonus.potion.desc': { pl: '5× mikstura HP', en: '5× HP potion' },
  'cc.bonus.scroll.name': { pl: 'Pergamin Questu', en: 'Quest Scroll' },
  'cc.bonus.scroll.desc': { pl: 'Natychmiastowy quest', en: 'Instant quest' },
  'cc.appearance.randomize': { pl: 'LOSUJ!', en: 'RANDOMIZE!' },
  'cc.row.skin': { pl: 'SKÓRA', en: 'SKIN' },
  'cc.row.hair': { pl: 'FRYZURA', en: 'HAIR' },
  'cc.row.hairColor': { pl: 'KOLOR WŁOSÓW', en: 'HAIR COLOR' },
  'cc.row.beard': { pl: 'ZAROST', en: 'BEARD' },
  'cc.row.eyes': { pl: 'OCZY', en: 'EYES' },
  'cc.row.eyeColor': { pl: 'KOLOR OCZU', en: 'EYE COLOR' },
  'cc.row.mouth': { pl: 'USTA', en: 'MOUTH' },
  'cc.row.detail': { pl: 'DETAL', en: 'DETAIL' },
  'cc.row.headwear': { pl: 'NAKRYCIE GŁOWY', en: 'HEADWEAR' },
  'cc.row.accent': { pl: 'AKCENT', en: 'ACCENT' },
  'cc.skin.pale': { pl: 'Jasna', en: 'Pale' },
  'cc.skin.medium': { pl: 'Śr.', en: 'Med.' },
  'cc.skin.tan': { pl: 'Opal.', en: 'Tan' },
  'cc.skin.dark': { pl: 'Ciemna', en: 'Dark' },
  'cc.skin.green': { pl: 'Ork!', en: 'Orc!' },
  'cc.hair.bald': { pl: 'Łysy', en: 'Bald' },
  'cc.hair.short': { pl: 'Krótka', en: 'Short' },
  'cc.hair.messy': { pl: 'Nieład', en: 'Messy' },
  'cc.hair.long': { pl: 'Długa', en: 'Long' },
  'cc.hair.mohawk': { pl: 'Mohawk', en: 'Mohawk' },
  'cc.hair.ponytail': { pl: 'Kucyk', en: 'Ponytail' },
  'cc.hairColor.black': { pl: 'Czar.', en: 'Black' },
  'cc.hairColor.brown': { pl: 'Brąz', en: 'Brown' },
  'cc.hairColor.blond': { pl: 'Blond', en: 'Blond' },
  'cc.hairColor.red': { pl: 'Rudy', en: 'Red' },
  'cc.hairColor.white': { pl: 'Siwy', en: 'White' },
  'cc.hairColor.purple': { pl: 'Fiol.', en: 'Purple' },
  'cc.beard.none': { pl: 'Brak', en: 'None' },
  'cc.beard.stubble': { pl: 'Zarost', en: 'Stubble' },
  'cc.beard.full': { pl: 'Pełna', en: 'Full' },
  'cc.beard.goatee': { pl: 'Bródka', en: 'Goatee' },
  'cc.eyes.normal': { pl: 'Norm.', en: 'Norm.' },
  'cc.eyes.angry': { pl: 'Wkurz.', en: 'Angry' },
  'cc.eyes.sleepy': { pl: 'Senne', en: 'Sleepy' },
  'cc.eyes.glow': { pl: 'Świec.', en: 'Glow' },
  'cc.eyeColor.brown': { pl: 'Brąz', en: 'Brown' },
  'cc.eyeColor.blue': { pl: 'Nieb.', en: 'Blue' },
  'cc.eyeColor.green': { pl: 'Ziel.', en: 'Green' },
  'cc.eyeColor.yellow': { pl: 'Żółty', en: 'Yellow' },
  'cc.eyeColor.red': { pl: 'Czer.', en: 'Red' },
  'cc.mouth.neutral': { pl: 'Norm.', en: 'Norm.' },
  'cc.mouth.smirk': { pl: 'Uśm.', en: 'Smirk' },
  'cc.mouth.grin': { pl: 'Szczer.', en: 'Grin' },
  'cc.mouth.grim': { pl: 'Gniew.', en: 'Grim' },
  'cc.acc.none': { pl: 'Brak', en: 'None' },
  'cc.acc.scar': { pl: 'Blizna', en: 'Scar' },
  'cc.acc.eyepatch': { pl: 'Opaska', en: 'Eyepatch' },
  'cc.acc.monocle': { pl: 'Monokl', en: 'Monocle' },
  'cc.acc.mask': { pl: 'Maska', en: 'Mask' },
  'cc.hw.auto': { pl: 'Auto', en: 'Auto' },
  'cc.hw.none': { pl: 'Brak', en: 'None' },
  'cc.hw.helmet': { pl: 'Hełm', en: 'Helm' },
  'cc.hw.wizardHat': { pl: 'Kapelusz', en: 'Wiz. hat' },
  'cc.hw.hood': { pl: 'Kaptur', en: 'Hood' },
  'cc.hw.crown': { pl: 'Korona', en: 'Crown' },
  'cc.hw.bandana': { pl: 'Banda.', en: 'Banda.' },
  'cc.hw.dragonHelm': { pl: 'Smok', en: 'Dragon' },
  'cc.hw.lichCrown': { pl: 'Lich', en: 'Lich' },
  'cc.hw.valkyrieHelm': { pl: 'Walkiria', en: 'Valkyrie' },
  'cc.hw.archmageHat': { pl: 'Arcymag', en: 'Archmage' },
  'cc.hw.shadowVeil': { pl: 'Welon', en: 'Veil' },
  'cc.hw.goldenLaurel': { pl: 'Laur', en: 'Laurel' },
  'cc.hw.hornedHelm': { pl: 'Rogi', en: 'Horns' },

  'settings.legal.terms': {
    pl: `REGULAMIN · Szczurogród

OSTATNIA AKTUALIZACJA: kwiecień 2026

1. POSTANOWIENIA OGÓLNE
Gra Szczurogród (dalej: „gra") jest dostarczana „tak jak jest". Korzystając z niej akceptujesz ten regulamin.

2. KONTO
• Możesz założyć konto z emailem albo grać jako gość.
• Konto-gość znika razem z pamięcią przeglądarki — żadnej gwarancji odzyskania postępu.
• Jedno konto = jedna postać.
• Zakaz udostępniania konta osobom trzecim.

3. ZASADY GRY
• Zabronione: cheaty, exploity, modyfikowanie klienta, automatyzacja (boty, makra, skrypty).
• Zabronione: kupowanie/sprzedawanie kont, gemów, przedmiotów za prawdziwą walutę poza oficjalnymi kanałami.
• Zabronione w czacie gildii: spam, mowa nienawiści, doxing, treści nielegalne.

4. SANKCJE
Naruszenie zasad = ban czasowy lub permanentny. W skrajnych przypadkach (cheating, oszustwa płatnicze) konto kasowane bez zwrotu wpłat.

5. PŁATNOŚCI (gemy / season pass)
• Gemy są walutą wirtualną. Nie podlegają zwrotowi po wydaniu w grze.
• Premium Season Pass jest sezonowy — kupujesz dostęp do drugiego tracka nagród. Po sezonie premium-only nagrody przepadają (free tier zostaje).
• Płatności obsługuje Google Play (kanał mobilny) lub Stripe (web — placeholder).
• Reklamacje: support@szczurogrod.pl w ciągu 14 dni od transakcji.

6. ODPOWIEDZIALNOŚĆ
Gra jest udostępniana bezpłatnie. Nie odpowiadamy za:
• Przerwy w działaniu serwera (planowane lub awaryjne).
• Utratę progresu konta-gościa po wyczyszczeniu pamięci przeglądarki.
• Decyzje gracza (sprzedaż uniqua, brak healera przed bossem).

7. WŁASNOŚĆ INTELEKTUALNA
Wszystkie grafiki, teksty, kod, mechaniki gry są chronione prawem autorskim. Zakazane: kopiowanie assetów do innych projektów.

8. ZAKOŃCZENIE USŁUGI
Możemy zakończyć działanie gry z 30-dniowym wyprzedzeniem (banner w grze). Po wygaszeniu serwerów konta przestają działać; dane są kasowane.

9. ROZSTRZYGANIE SPORÓW
Prawo polskie. Sąd właściwy: miejsce siedziby konsumenta. Pierwsza droga: support@szczurogrod.pl.

10. KONTAKT
support@szczurogrod.pl (placeholder — uzupełnij przed launchem)
`,
    en: `TERMS OF SERVICE · Ratburg

LAST UPDATED: April 2026

1. GENERAL TERMS
The game Ratburg (the "game") is provided "as is". By using it you accept these terms.

2. ACCOUNT
• You may register with an email or play as a guest.
• Guest accounts disappear with browser storage — no guarantee of progress recovery.
• One account = one character.
• Sharing your account with third parties is forbidden.

3. GAME RULES
• Forbidden: cheats, exploits, client modifications, automation (bots, macros, scripts).
• Forbidden: buying/selling accounts, gems, items for real currency outside official channels.
• Forbidden in guild chat: spam, hate speech, doxing, illegal content.

4. SANCTIONS
Violations = temporary or permanent ban. In extreme cases (cheating, payment fraud) account deletion without refund.

5. PAYMENTS (gems / season pass)
• Gems are virtual currency. No refunds after spending in-game.
• Premium Season Pass is seasonal — you buy access to a second reward track. Premium-only rewards expire after the season (free tier remains).
• Payments handled by Google Play (mobile) or Stripe (web — placeholder).
• Complaints: support@ratburg.app within 14 days of transaction.

6. LIABILITY
The game is provided free of charge. We are not liable for:
• Server outages (planned or unplanned).
• Loss of guest progress when browser storage is cleared.
• Player decisions (selling a unique, fighting a boss without a healer).

7. INTELLECTUAL PROPERTY
All graphics, texts, code and game mechanics are copyrighted. Copying assets to other projects is forbidden.

8. SERVICE TERMINATION
We may shut down the game with 30 days' notice (in-game banner). After server shutdown, accounts stop working; data is deleted.

9. DISPUTE RESOLUTION
Polish law. Competent court: consumer’s place of residence. First step: support@ratburg.app.

10. CONTACT
support@ratburg.app (placeholder — fill in before launch)
`,
  },

  // Tavern
  'tavern.heading': { pl: 'POD ZŁOTYM PIEROGIEM', en: 'AT THE GOLDEN PIEROGI' },
  'tavern.flavor': { pl: 'Gwarno, tłusto, tanio.', en: 'Loud, greasy, cheap.' },
  'tavern.barman': { pl: 'Barman szepcze: „{r}"', en: 'The barman whispers: "{r}"' },
  'tavern.companion.active': { pl: 'AKTYWNY TOWARZYSZ', en: 'ACTIVE COMPANION' },
  'tavern.companion.dismiss': { pl: 'ZWOLNIJ', en: 'DISMISS' },
  'tavern.healer.title': { pl: 'UZDROWICIELKA W IZBIE', en: 'HEALER ON SITE' },
  'tavern.healer.body': {
    pl: 'Pełne HP i MP. Delikatne dłonie, twarde zasady — jeden kurant na godzinę.',
    en: 'Full HP and MP. Gentle hands, firm rules — one chime per hour.',
  },
  'tavern.healer.full': { pl: 'Masz już pełne HP i MP.', en: 'You already have full HP and MP.' },
  'tavern.healer.cooldown': {
    pl: 'Uzdrowicielka odpoczywa jeszcze {n}.',
    en: 'The healer rests for another {n}.',
  },
  'tavern.healer.tooPoor': { pl: 'Za mało złota.', en: 'Not enough gold.' },
  'tavern.healer.help': {
    pl: 'Pełna regeneracja za złoto. Cooldown 1h.',
    en: 'Full regeneration for gold. 1h cooldown.',
  },
  'tavern.healer.now': { pl: 'TERAZ', en: 'NOW' },
  'tavern.healer.now.help': {
    pl: 'Heal natychmiast, bypass cooldown.',
    en: 'Heal immediately, bypass cooldown.',
  },
  'tavern.dice.title': { pl: 'KARCIARZ FRANEK', en: 'FRANEK THE GAMBLER' },
  'tavern.dice.free': {
    pl: 'Darmowy rzut czeka. Kości są proste.',
    en: 'Free roll waits. Dice are simple.',
  },
  'tavern.dice.taken': {
    pl: 'Darmowy już wzięty. Za gemy jak chcesz jeszcze.',
    en: 'Free roll taken. Pay gems for more.',
  },
  'tavern.oracle.title': { pl: 'WRÓŻKA HANUSIA', en: 'HANUSIA THE FORTUNE-TELLER' },
  'tavern.oracle.free': {
    pl: 'Trzy karty czekają. Jedna jest twoja.',
    en: 'Three cards wait. One is yours.',
  },
  'tavern.oracle.taken': {
    pl: 'Dzisiaj już wróżyła. Jutro nowa talia.',
    en: 'She has read for today. Tomorrow, fresh deck.',
  },
  'tavern.blessing.title': { pl: 'MNICH PANTELEON', en: 'BROTHER PANTELEON' },
  'tavern.blessing.busy': { pl: 'Medytuje. Wróć później.', en: 'Meditating. Come back later.' },
  'tavern.blessing.ready': {
    pl: 'Błogosławieństwa na godzinę. Niedrogo.',
    en: 'Hour-long blessings. Cheap.',
  },
  'tavern.witch.title': { pl: 'BABA JAGA', en: 'BABA YAGA' },
  'tavern.witch.cursed': {
    pl: 'Masz {n} {curseWord}. Baba wie co z tym zrobić.',
    en: 'You carry {n} {curseWord}. Baba knows what to do.',
  },
  'tavern.witch.curseWord.one': { pl: 'klątwę', en: 'curse' },
  'tavern.witch.curseWord.many': { pl: 'klątwy', en: 'curses' },
  'tavern.witch.clean': {
    pl: 'Zdejmuje klątwy. Jeśli masz, to wiesz.',
    en: 'Removes curses. If you have any, you know.',
  },
  'tavern.companions.heading': { pl: 'NAJMIJ TOWARZYSZA', en: 'HIRE A COMPANION' },
  'tavern.companions.refresh': { pl: 'ODŚWIEŻ', en: 'REFRESH' },
  'tavern.companions.refresh.help': {
    pl: 'Wymusza nową listę kompanów.',
    en: 'Forces a fresh companion list.',
  },
  'tavern.back': { pl: '← Miasto', en: '← Town' },
  'tavern.countdown.ready': { pl: 'gotowy', en: 'ready' },
  'class.warrior.title': { pl: 'Wojownik', en: 'Warrior' },
  'class.mage.title': { pl: 'Mag', en: 'Mage' },
  'class.rogue.title': { pl: 'Łotrzyk', en: 'Rogue' },

  // Creator (post-creation editor)
  'creator.heading': { pl: 'KREATOR POSTACI', en: 'CHARACTER CREATOR' },
  'creator.randomize': { pl: 'LOSUJ WYGLĄD', en: 'RANDOMIZE' },
  'creator.row.skin': { pl: 'SKÓRA', en: 'SKIN' },
  'creator.row.hair': { pl: 'FRYZURA', en: 'HAIR' },
  'creator.row.hairColor': { pl: 'KOLOR WŁOSÓW', en: 'HAIR COLOR' },
  'creator.row.beard': { pl: 'BRODA', en: 'BEARD' },
  'creator.row.eyes': { pl: 'OCZY', en: 'EYES' },
  'creator.row.eyeColor': { pl: 'KOLOR OCZU', en: 'EYE COLOR' },
  'creator.row.mouth': { pl: 'USTA', en: 'MOUTH' },
  'creator.row.detail': { pl: 'DETAL', en: 'DETAIL' },
  'creator.row.headwear': { pl: 'NAKRYCIE GŁOWY', en: 'HEADWEAR' },
  'creator.row.armor': { pl: 'ZBROJA', en: 'ARMOR' },
  'creator.row.accent': { pl: 'KOLOR AKCENTU', en: 'ACCENT COLOR' },
  'creator.cancel': { pl: 'ANULUJ', en: 'CANCEL' },
  'creator.save': { pl: 'ZAPISZ WYGLĄD', en: 'SAVE LOOK' },
  'creator.beard.goatee': { pl: 'Kozia', en: 'Goatee' },
  'creator.mouth.neutral': { pl: 'Neutr.', en: 'Neutr.' },
  'creator.mouth.smirk': { pl: 'Uśmieszek', en: 'Smirk' },
  'creator.mouth.grin': { pl: 'Zęby', en: 'Grin' },
  'creator.mouth.grim': { pl: 'Ponury', en: 'Grim' },
  'creator.acc.none': { pl: 'Brak', en: 'None' },
  'creator.acc.scar': { pl: 'Blizna', en: 'Scar' },
  'creator.acc.eyepatch': { pl: 'Opaska', en: 'Eyepatch' },
  'creator.acc.monocle': { pl: 'Monokl', en: 'Monocle' },
  'creator.acc.mask': { pl: 'Maska', en: 'Mask' },
  'creator.hw.bandana': { pl: 'Bandana', en: 'Bandana' },
  'creator.hw.dragonHelm': { pl: 'Smoczy hełm', en: 'Dragon helm' },
  'creator.hw.lichCrown': { pl: 'Korona licha', en: 'Lich crown' },
  'creator.hw.valkyrieHelm': { pl: 'Hełm walkirii', en: 'Valkyrie helm' },
  'creator.hw.archmageHat': { pl: 'Kapelusz arcymaga', en: 'Archmage hat' },
  'creator.hw.shadowVeil': { pl: 'Welon cienia', en: 'Shadow veil' },
  'creator.hw.goldenLaurel': { pl: 'Laur', en: 'Laurel' },
  'creator.hw.hornedHelm': { pl: 'Rogi', en: 'Horns' },
  'creator.armor.plain': { pl: 'Tunika', en: 'Tunic' },
  'creator.armor.plate': { pl: 'Pełna płyta', en: 'Full plate' },
  'creator.armor.scale': { pl: 'Łuski', en: 'Scale' },
  'creator.armor.arcane': { pl: 'Szata maga', en: 'Arcane robe' },
  'creator.armor.bone': { pl: 'Kości', en: 'Bone' },
  'creator.armor.dragon': { pl: 'Smocza', en: 'Dragon' },
  'creator.unlock.heading': { pl: 'ODBLOKUJ KOSMETYK', en: 'UNLOCK COSMETIC' },
  'creator.unlock.body': {
    pl: 'Tak będziesz wyglądać. Odblokowanie jest jednorazowe — później zmieniasz dowolnie.',
    en: 'This is how you will look. Unlock is one-time — change freely afterwards.',
  },
  'creator.unlock.confirm': { pl: 'ODBLOKUJ', en: 'UNLOCK' },
  'creator.unlock.title.confirm': { pl: 'Odblokuj', en: 'Unlock' },
  'creator.unlock.title.tooPoor': { pl: 'Brak gemów ({n}).', en: 'Not enough gems ({n}).' },

  // Shop
  'shop.heading': { pl: 'U JACKA KUPCA', en: 'AT JACEK THE MERCHANT' },
  'shop.flavor': { pl: 'Dobre ceny, lepsze plotki.', en: 'Good prices, better gossip.' },
  'shop.refreshHint': {
    pl: 'Oferta odświeża się codziennie o północy UTC.',
    en: 'Offer refreshes daily at midnight UTC.',
  },
  'shop.refresh.now': { pl: 'ODŚWIEŻ TERAZ', en: 'REFRESH NOW' },
  'shop.refresh.help': {
    pl: 'Wymień w tej chwili, bez czekania na północ.',
    en: 'Swap now, without waiting for midnight.',
  },
  'shop.refresh.todayCount': { pl: 'dziś {n}×', en: 'today {n}×' },
  'shop.refresh.todayTitle': {
    pl: 'Licznik resetuje się o 00:00 UTC. Każde kolejne odświeżenie dziś jest droższe (10 → 20 → 40 → 80 → 160).',
    en: 'Counter resets at 00:00 UTC. Each subsequent refresh today costs more (10 → 20 → 40 → 80 → 160).',
  },
  'shop.cmp.has': {
    pl: 'Masz założone: {name} (ATK {atk} · DEF {def} · MAG {mag})',
    en: 'You have equipped: {name} (ATK {atk} · DEF {def} · MAG {mag})',
  },
  'shop.cmp.empty': {
    pl: 'Nic nie masz założone w tym slocie — sama korzyść.',
    en: 'Nothing equipped in this slot — pure upgrade.',
  },
  'shop.cmp.emptyShort': { pl: 'pusty slot · +{n}', en: 'empty slot · +{n}' },
  'shop.soldOut': { pl: 'KUPIONO', en: 'SOLD' },
  'shop.soldOutBtn': { pl: 'WYPRZEDANE', en: 'SOLD OUT' },
  'shop.soldOutTitle': {
    pl: 'Już kupione dzisiaj. Oferta odświeży się o północy UTC.',
    en: 'Already bought today. Offer refreshes at midnight UTC.',
  },
  'shop.back': { pl: '← Miasto', en: '← Town' },
  'shop.rarity.common': { pl: 'Zwykłe', en: 'Common' },
  'shop.rarity.rare': { pl: 'Rzadkie', en: 'Rare' },
  'shop.rarity.epic': { pl: 'Epickie', en: 'Epic' },
  'shop.rarity.legendary': { pl: 'Legend.', en: 'Legend.' },

  // ===== Daily =====
  'daily.title': { pl: 'CODZIENNA NAGRODA', en: 'DAILY REWARD' },
  'daily.dayOf': { pl: 'Dzień {n} z 28', en: 'Day {n} of 28' },
  'daily.burst': { pl: 'OH MY!', en: 'OH MY!' },
  'daily.youWon': { pl: 'WYGRAŁEŚ:', en: 'YOU WON:' },
  'daily.keysTitle': {
    pl: 'Klucze do lochu. Każda walka kosztuje jeden.',
    en: 'Dungeon keys. Each fight costs one.',
  },
  'daily.back.bang': { pl: 'WRACAM!', en: 'BACK!' },
  'daily.alreadyClaimed': {
    pl: 'Już odebrałeś. Wróć jutro!',
    en: 'Already claimed. Come back tomorrow!',
  },
  'daily.ok': { pl: 'OK', en: 'OK' },
  'daily.opening': { pl: 'OTWIERANIE...', en: 'OPENING...' },
  'daily.clickChest': { pl: 'KLIKNIJ SKRZYNIĘ!', en: 'CLICK THE CHEST!' },
  'daily.streak': { pl: 'SERIA LOGOWAŃ', en: 'LOGIN STREAK' },
  'daily.legend': {
    pl: 'Ramka czerwona = milestone. Dzień 28 — legendarny finisz.',
    en: 'Red border = milestone. Day 28 — legendary finish.',
  },
  'daily.back': { pl: '← Wróć', en: '← Back' },
  'daily.rarity.common': { pl: 'ZWYKŁY', en: 'COMMON' },
  'daily.rarity.rare': { pl: 'RZADKI', en: 'RARE' },
  'daily.rarity.epic': { pl: 'EPICKI', en: 'EPIC' },
  'daily.rarity.legendary': { pl: 'LEGEND.', en: 'LEGEND.' },

  // ===== Witch =====
  'witch.title': { pl: 'BABA JAGA', en: 'BABA YAGA' },
  'witch.flavor': {
    pl: '„Nie pytaj kto Cię przeklął. Pytaj czy Cię stać żebym to zdjęła."',
    en: '"Don\'t ask who cursed you. Ask if you can afford the removal."',
  },
  'witch.loading': {
    pl: 'Baba Jaga szuka okularów…',
    en: 'Baba Yaga is hunting for her glasses…',
  },
  'witch.clean.title': { pl: 'CZYSTA DUSZA', en: 'CLEAN SOUL' },
  'witch.clean.desc': {
    pl: 'Nie masz żadnej klątwy. Baba Jaga niezadowolona — zarobku brak.',
    en: 'No curses. Baba Yaga is unhappy — no income.',
  },
  'witch.removeAll.flavor': {
    pl: 'Spieszysz się? Baba Jaga zdejmuje wszystko naraz. Jest droższa, ale szybsza.',
    en: 'In a hurry? Baba Yaga lifts them all at once. Costs more. Faster.',
  },
  'witch.removeAll.label': {
    pl: 'ZDEJMIJ WSZYSTKIE ({n})',
    en: 'REMOVE ALL ({n})',
  },
  'witch.removeAll.disabledReason': {
    pl: 'Zdjęcie wszystkich klątw naraz.',
    en: 'Remove all curses at once.',
  },
  'witch.help.title': {
    pl: 'Skąd się biorą klątwy?',
    en: 'Where do curses come from?',
  },
  'witch.help.label': { pl: 'Jak to działa?', en: 'How does it work?' },
  'witch.help.body': {
    pl: 'Po przegranej walce z bossem (tier 3+) jest 25% szans że wróg zostawi Ci klątwę na 24h. Klątwa obniża jedną ze statystyk i siedzi razem z pozytywnymi buffami w pasku u góry ekranu (czerwony). Możesz ją przeczekać albo zapłacić Babie Jadze.',
    en: 'After losing a boss fight (tier 3+) there is a 25% chance the foe leaves a curse for 24h. It debuffs one stat and sits next to your buffs in the top bar (red). Wait it out — or pay Baba Yaga.',
  },
  'witch.back': { pl: '← WRÓĆ', en: '← BACK' },
  'witch.toast.curseRemoved': { pl: 'Klątwa zdjęta.', en: 'Curse removed.' },
  'witch.toast.allRemoved': {
    pl: 'Zdjęto {n} klątw. Baba Jaga liczy gemy.',
    en: 'Removed {n} curses. Baba Yaga is counting gems.',
  },
  'witch.toast.refused': { pl: 'Baba Jaga odmówiła.', en: 'Baba Yaga refused.' },
  'witch.toast.noGold': {
    pl: 'Brak gold\'a ({n}).',
    en: 'Not enough gold ({n}).',
  },

  // ===== Stables =====
  'stables.countdown.expired': { pl: 'wygasł', en: 'expired' },
  'stables.title': { pl: 'STAJNIE', en: 'STABLES' },
  'stables.flavor': {
    pl: 'Koń ci skróci drogę. Portfel — też.',
    en: 'A horse shortens the road. Your wallet too.',
  },
  'stables.help.title': {
    pl: 'Jak działa wierzchowiec?',
    en: 'How does a mount work?',
  },
  'stables.help.label': { pl: 'Jak to działa?', en: 'How does it work?' },
  'stables.help.p1': {
    pl: 'Wynajmujesz wierzchowca na 24 godziny. Każdy nowo wystartowany quest kończy się szybciej o procent zależny od zwierzaka. Im droższy — tym większy skok.',
    en: 'You rent a mount for 24 hours. Every newly started quest finishes faster by a percentage tied to the beast. Pricier mount, bigger jump.',
  },
  'stables.help.p2': {
    pl: 'Liczy się od kliknięcia WYRUSZ. Questy rozpoczęte przed najmem biegną w swoim tempie — koń ich nie goni.',
    en: 'Counted from when you press DEPART. Quests started before renting run at their own pace — the horse will not chase them.',
  },
  'stables.help.p3': {
    pl: 'Jeden wierzchowiec na raz. Po wygaśnięciu najmu wolna stajnia — bierzesz następnego. Bez zwrotów, bez negocjacji.',
    en: 'One mount at a time. Stable opens up once the rental expires — pick another. No refunds, no haggling.',
  },
  'stables.active.label': { pl: 'TWÓJ WIERZCHOWIEC', en: 'YOUR MOUNT' },
  'stables.active.shortens': {
    pl: 'Skraca quest o {n}%',
    en: 'Shortens quests by {n}%',
  },
  'stables.active.expiresIn': { pl: 'wygasa za {n}', en: 'expires in {n}' },
  'stables.rent.heading': {
    pl: 'WYNAJMIJ WIERZCHOWCA',
    en: 'RENT A MOUNT',
  },
  'stables.title.hasMount': {
    pl: 'Masz już wierzchowca — wróć po wygaśnięciu najmu.',
    en: 'You already have a mount — come back when the rental ends.',
  },
  'stables.title.lvlLocked': {
    pl: 'Dostępny od LVL {n}.',
    en: 'Available from LVL {n}.',
  },
  'stables.title.poor': { pl: 'Za mało złota.', en: 'Not enough gold.' },
  'stables.title.ok': {
    pl: 'Skraca questy o {p}% przez {h}h.',
    en: 'Shortens quests by {p}% for {h}h.',
  },
  'stables.card.speed': {
    pl: '−{p}% czasu · {h}h',
    en: '−{p}% time · {h}h',
  },
  'stables.empty': {
    pl: 'Stajnia zamknięta na klucz. Wróć później.',
    en: 'Stables locked. Come back later.',
  },
  'stables.nextUnlock': {
    pl: 'Kolejny wierzchowiec po osiągnięciu LVL {n}',
    en: 'Next mount unlocks at LVL {n}',
  },
  'stables.back': { pl: '← Miasto', en: '← Town' },

  // ===== Blessing =====
  'blessing.title': { pl: 'MNICH PANTELEON', en: 'BROTHER PANTELEON' },
  'blessing.flavor': {
    pl: 'Medytuje pół godziny, błogosławi minutę, liczy złoto szybko.',
    en: 'Meditates for half an hour, blesses for a minute, counts gold quickly.',
  },
  'blessing.cooldown.text': {
    pl: 'Panteleon medytuje —',
    en: 'Panteleon is meditating —',
  },
  'blessing.loading': {
    pl: 'Panteleon szuka okularów…',
    en: 'Panteleon is hunting for his glasses…',
  },
  'blessing.help.title': {
    pl: 'Jak działają błogosławieństwa?',
    en: 'How do blessings work?',
  },
  'blessing.help.label': { pl: 'Jak to działa?', en: 'How does it work?' },
  'blessing.help.body': {
    pl: 'Każde błogosławieństwo trwa 1 godzinę. Po kupnie Panteleon medytuje 30 minut, zanim pobłogosławi ponownie. Buffy dzielą sloty z elixirami ze sklepu — jeśli masz już silniejszy aktywny buff danej kategorii, Panteleon go nie ruszy.',
    en: 'Each blessing lasts 1 hour. After a purchase Panteleon meditates 30 minutes before he can bless again. Buffs share slots with shop elixirs — if a stronger buff of the same kind is active, Panteleon will not touch it.',
  },
  'blessing.back': { pl: '← WRÓĆ', en: '← BACK' },
  'blessing.toast.success': {
    pl: 'Panteleon błogosławi. +{n}{u} na godzinę.',
    en: 'Panteleon blesses. +{n}{u} for an hour.',
  },
  'blessing.toast.successFallback': {
    pl: 'Panteleon błogosławi.',
    en: 'Panteleon blesses.',
  },
  'blessing.toast.refused': {
    pl: 'Panteleon odmówił.',
    en: 'Panteleon refused.',
  },
  'blessing.toast.noGold': {
    pl: 'Brak gold\'a ({n}).',
    en: 'Not enough gold ({n}).',
  },

  // ===== Dice =====
  'dice.title': { pl: 'KARCIARZ FRANEK', en: 'FRANEK THE GAMBLER' },
  'dice.flavor': {
    pl: 'Kości są proste. Matematyka też, tylko Franek udaje że nie.',
    en: 'The dice are simple. So is the math, Franek just pretends otherwise.',
  },
  'dice.toast.refused': { pl: 'Franek odmówił.', en: 'Franek refused.' },
  'dice.shuffling': { pl: 'Franek tasuje kości…', en: 'Franek is shuffling the dice…' },
  'dice.freeAvailable': { pl: 'Darmowy rzut dostępny.', en: 'Free roll available.' },
  'dice.freeUsed': {
    pl: 'Darmowy zużyty — wróć jutro albo płać gemami.',
    en: 'Free roll spent — come back tomorrow or pay in gems.',
  },
  'dice.btn.rolling': { pl: 'RZUCAM...', en: 'ROLLING...' },
  'dice.btn.rollFree': { pl: 'RZUĆ ZA DARMO', en: 'ROLL FREE' },
  'dice.btn.rollGems': { pl: 'RZUĆ ZA GEMY', en: 'ROLL FOR GEMS' },
  'dice.btn.rollGems.disabled': {
    pl: 'Drugi rzut i kolejne.',
    en: 'Second roll and beyond.',
  },
  'dice.payouts.title': { pl: 'TABELA WYGRANYCH', en: 'PAYOUT TABLE' },
  'dice.payouts.glass': { pl: 'Szkło', en: 'Glass' },
  'dice.payouts.gold500': { pl: '500 gold\'a', en: '500 gold' },
  'dice.payouts.gold1500': { pl: '1500 gold\'a', en: '1500 gold' },
  'dice.payouts.jackpot': {
    pl: 'Jackpot — rare item lub 20 gemów',
    en: 'Jackpot — rare item or 20 gems',
  },
  'dice.payouts.flavor': {
    pl: 'Franek nie pamięta co dał Ci wczoraj. Ale pamięta co mu jesteś winien.',
    en: 'Franek does not remember what he gave you yesterday. He remembers what you owe him.',
  },
  'dice.back': { pl: '← WRÓĆ', en: '← BACK' },
  'dice.result.miss': { pl: 'PUDŁO.', en: 'MISS.' },
  'dice.result.gold': { pl: 'ZŁOTO!', en: 'GOLD!' },
  'dice.result.gems': { pl: 'GEMY!', en: 'GEMS!' },
  'dice.result.jackpot': { pl: 'JACKPOT!', en: 'JACKPOT!' },
  'dice.result.rollLabel': { pl: 'RZUT:', en: 'ROLL:' },
  'dice.result.continue': { pl: 'DALEJ', en: 'NEXT' },
  'dice.countdown.next': { pl: 'Darmowy za', en: 'Free in' },

  // ===== Tower =====
  'tower.toast.failed': { pl: 'Nie udało się.', en: 'Failed.' },
  'tower.toast.resurrected': { pl: 'Wskrzeszony. Do boju.', en: 'Resurrected. Back to it.' },
  'tower.title': { pl: 'WIEŻA BEZDENNA', en: 'BOTTOMLESS TOWER' },
  'tower.flavor': { pl: 'Nie ma dna. Jest tylko wyżej.', en: 'No bottom. Only higher.' },
  'tower.bestThisWeek': { pl: 'Najlepsze w tym tygodniu:', en: 'Best this week:' },
  'tower.floorLabel': { pl: 'PIĘTRO {n}', en: 'FLOOR {n}' },
  'tower.tab.climb': { pl: 'WSPINACZKA', en: 'CLIMB' },
  'tower.tab.leaderboard': { pl: 'RANKING TYGODNIA', en: 'WEEKLY RANKING' },
  'tower.back': { pl: '← Wróć', en: '← Back' },
  'tower.bossFlavor': {
    pl: 'Piętro {n}. Ktoś tu zawsze czeka.',
    en: 'Floor {n}. Someone is always waiting.',
  },
  'tower.floor': { pl: 'PIĘTRO', en: 'FLOOR' },
  'tower.btn.entering': { pl: 'WCHODZĘ...', en: 'CLIMBING...' },
  'tower.btn.climb': { pl: 'NA GÓRĘ', en: 'CLIMB UP' },
  'tower.resurrect.btn': { pl: 'WSKRZEŚ', en: 'RESURRECT' },
  'tower.resurrect.disabled': { pl: 'Pomiń cooldown.', en: 'Skip the cooldown.' },
  'tower.milestone.hit': { pl: 'Piętro {n}: milestone!', en: 'Floor {n}: milestone!' },
  'tower.milestone.next': {
    pl: 'Za {n} pięter: milestone ({g}g + {x} gemów)',
    en: 'In {n} floors: milestone ({g}g + {x} gems)',
  },
  'tower.loading': { pl: 'Ładuję...', en: 'Loading...' },
  'tower.empty': {
    pl: 'Nikt jeszcze nie wspiął się w tym tygodniu. Bądź pierwszy.',
    en: 'No one has climbed this week. Be the first.',
  },
  'tower.cls.warrior': { pl: 'Wojownik', en: 'Warrior' },
  'tower.cls.mage': { pl: 'Mag', en: 'Mage' },
  'tower.cls.rogue': { pl: 'Łotrzyk', en: 'Rogue' },
  'tower.entry.floor': { pl: 'piętro', en: 'floor' },
  'tower.reset.soon': { pl: 'reset za chwilę', en: 'reset any moment' },
  'tower.reset.in': { pl: 'reset za', en: 'reset in' },
  'tower.cooldown.label': { pl: 'Odpoczynek:', en: 'Resting:' },

  // ===== GemShop =====
  'gemShop.title': { pl: 'MAGICZNY BAZAR', en: 'MAGIC BAZAAR' },
  'gemShop.flavor': { pl: 'Błyszczące kamyki. Niezbędne.', en: 'Shiny pebbles. Essential.' },
  'gemShop.yours': { pl: 'Twoje', en: 'Yours' },
  'gemShop.special.subTime': {
    pl: 'Kończy się za 2h 47min',
    en: 'Ends in 2h 47min',
  },
  'gemShop.special.name': { pl: 'KRÓLEWSKA OFERTA', en: 'ROYAL OFFER' },
  'gemShop.special.cta': { pl: 'CHWYTAJ OKAZJĘ!', en: 'GRAB IT!' },
  'gemShop.packs.heading': { pl: 'PAKIETY GEMÓW', en: 'GEM PACKS' },
  'gemShop.bundles.heading': { pl: 'ZESTAWY SPECJALNE', en: 'SPECIAL BUNDLES' },
  'gemShop.bundles.cta': { pl: 'KUP ZESTAW', en: 'BUY BUNDLE' },
  'gemShop.currency': { pl: 'zł', en: 'PLN' },
  'gemShop.pack.p1': { pl: 'Garstka', en: 'Handful' },
  'gemShop.pack.p2': { pl: 'Sakiewka', en: 'Pouch' },
  'gemShop.pack.p3': { pl: 'Skrzynka', en: 'Crate' },
  'gemShop.pack.p4': { pl: 'Kufer', en: 'Coffer' },
  'gemShop.pack.p5': { pl: 'Smoczy Skarb', en: 'Dragon Hoard' },
  'gemShop.pack.tag.popular': { pl: 'POPULARNY', en: 'POPULAR' },
  'gemShop.pack.tag.best': { pl: 'NAJLEPSZE', en: 'BEST' },
  'gemShop.pack.tag.mega': { pl: 'MEGA WARTOŚĆ', en: 'MEGA VALUE' },
  'gemShop.bundle.b1.name': { pl: 'Pakiet Startowy', en: 'Starter Pack' },
  'gemShop.bundle.b1.tag': { pl: 'TYLKO RAZ', en: 'ONCE ONLY' },
  'gemShop.bundle.b2.name': { pl: 'Zestaw Maga', en: 'Mage Bundle' },
  'gemShop.bundle.b2.tag': { pl: '-60%', en: '-60%' },
  'gemShop.item.swordZarliwy': { pl: 'Miecz Żarliwy', en: 'Fervent Sword' },
  'gemShop.item.kosturChaosu': { pl: 'Kostur Chaosu', en: 'Staff of Chaos' },
  'gemShop.item.eliksirManyX5': { pl: 'Eliksir Many ×5', en: 'Mana Potion ×5' },
  'gemShop.vip.name': { pl: 'SZCZUROGRÓD+ SUBSKRYPCJA', en: 'RATBURG+ SUBSCRIPTION' },
  'gemShop.vip.sub': { pl: '30 dni premium', en: '30 days premium' },
  'gemShop.vip.price': { pl: '19,99/mies.', en: '19.99/mo' },
  'gemShop.vip.perk1': { pl: '100 gemów dziennie', en: '100 gems daily' },
  'gemShop.vip.perk2': { pl: '+50% złota z questów', en: '+50% gold from quests' },
  'gemShop.vip.perk4': { pl: 'Ekskluzywna korona', en: 'Exclusive crown' },
  'gemShop.disclaimer': {
    pl: 'Ceny zawierają VAT. Zakupy wspierają rozwój gry. Miłej zabawy!',
    en: 'Prices include VAT. Purchases support development. Have fun!',
  },
  'gemShop.back': { pl: '← Wróć', en: '← Back' },
  'gemShop.confirm.title': { pl: 'POTWIERDŹ ZAKUP', en: 'CONFIRM PURCHASE' },
  'gemShop.confirm.cancel': { pl: 'ANULUJ', en: 'CANCEL' },
  'gemShop.confirm.buy': { pl: 'KUP', en: 'BUY' },
  'gemShop.confirm.demo': {
    pl: 'Demo: brak rzeczywistej opłaty',
    en: 'Demo: no real charge',
  },

  // ===== SeasonPass =====
  'seasonPass.title': { pl: 'PRZEPUSTKA SEZONOWA', en: 'SEASON PASS' },
  'seasonPass.season.line': {
    pl: 'Sezon {n} — 30 poziomów, 60 nagród.',
    en: 'Season {n} — 30 levels, 60 rewards.',
  },
  'seasonPass.premium.heading': { pl: 'WYKUP PREMIUM', en: 'BUY PREMIUM' },
  'seasonPass.premium.desc': {
    pl: 'Drugie nagrody z każdego tiera. Legendarny pierścień na 30. Odbierzesz także wszystkie już zdobyte premium tiery wstecz.',
    en: 'A second reward from every tier. Legendary ring at 30. Past premium tiers are claimed retroactively.',
  },
  'seasonPass.premium.cta': { pl: 'WYKUP PREMIUM', en: 'BUY PREMIUM' },
  'seasonPass.premium.disabledReason': {
    pl: 'Odblokowuje premium track.',
    en: 'Unlocks the premium track.',
  },
  'seasonPass.loading': { pl: 'Ładuję sezon…', en: 'Loading season…' },
  'seasonPass.tier.free': { pl: 'DARMOWE', en: 'FREE' },
  'seasonPass.tier.premium': { pl: 'PREMIUM', en: 'PREMIUM' },
  'seasonPass.tier.requirePremium': { pl: 'Wymaga premium.', en: 'Requires premium.' },
  'seasonPass.tier.notEnoughXp': { pl: 'Za mało XP.', en: 'Not enough XP.' },
  'seasonPass.tier.notYet': { pl: 'Jeszcze nie.', en: 'Not yet.' },
  'seasonPass.tier.claimed': { pl: 'ODEBRANE', en: 'CLAIMED' },
  'seasonPass.tier.claim': { pl: 'ODBIERZ', en: 'CLAIM' },
  'seasonPass.howTo.heading': { pl: 'JAK ZDOBYWAĆ XP', en: 'HOW TO EARN XP' },
  'seasonPass.howTo.body': {
    pl: '+1 XP za wygraną walkę w lochu • +5 XP za ukończony quest. Tier N wymaga 10 × N XP łącznie. Sezon trwa miesiąc — 1-go każdego miesiąca UTC zaczyna się nowy.',
    en: '+1 XP per dungeon win • +5 XP per completed quest. Tier N needs 10 × N XP total. Season lasts a month — a new one starts on the 1st each UTC month.',
  },
  'seasonPass.back': { pl: '← WRÓĆ', en: '← BACK' },
  'seasonPass.toast.claimed': { pl: 'Nagroda odebrana.', en: 'Reward claimed.' },
  'seasonPass.toast.claimFailed': { pl: 'Claim nie wyszedł.', en: 'Claim failed.' },
  'seasonPass.toast.premiumActive': {
    pl: 'Premium aktywny. Wszystko odblokowane.',
    en: 'Premium active. Everything unlocked.',
  },
  'seasonPass.toast.premiumFailed': {
    pl: 'Nie udało się wykupić premium.',
    en: 'Could not buy premium.',
  },
  'seasonPass.bar.tierLine': { pl: 'TIER', en: 'TIER' },

  // ===== Arena =====
  'arena.title': { pl: 'ARENA', en: 'ARENA' },
  'arena.stats.rank': { pl: 'RANKING', en: 'RANK' },
  'arena.stats.points': { pl: 'PUNKTY', en: 'POINTS' },
  'arena.stats.fights': { pl: 'WALKI', en: 'FIGHTS' },
  'arena.stats.record': {
    pl: 'Wygrane: {wins} · Porażki: {losses}',
    en: 'Wins: {wins} · Losses: {losses}',
  },
  'arena.buyExtraFight': { pl: 'DOKUP WALKĘ', en: 'BUY EXTRA FIGHT' },
  'arena.toast.bought': { pl: 'Wykupiono walkę.', en: 'Extra fight bought.' },
  'arena.toast.buyFailed': { pl: 'Nie udało się.', en: 'Failed.' },
  'arena.top': { pl: 'TOP', en: 'TOP' },
  'arena.ladder.empty': { pl: 'Drabinka jeszcze pusta.', en: 'Ladder is empty.' },
  'arena.rivals.heading': { pl: 'RYWALE W TWOJEJ LIDZE', en: 'RIVALS IN YOUR LEAGUE' },
  'arena.rivals.loading': { pl: 'Szukam rywali...', en: 'Finding rivals...' },
  'arena.rivals.npc': { pl: '(NPC)', en: '(NPC)' },
  'arena.rivals.fight': { pl: 'WALCZ', en: 'FIGHT' },
  'arena.rivals.points': { pl: 'pkt', en: 'pts' },
  'arena.noFights': { pl: 'Dziś już wystarczy. Wróć jutro.', en: "Enough for today. Come back tomorrow." },
  'arena.history.loading': { pl: 'Ładuję historię...', en: 'Loading history...' },
  'arena.history.heading': { pl: 'OSTATNIE WALKI', en: 'RECENT FIGHTS' },
  'arena.history.vs': { pl: 'vs', en: 'vs' },
  'arena.history.from': { pl: 'od', en: 'from' },
  'arena.history.won': { pl: 'WYGRANA', en: 'WIN' },
  'arena.history.lost': { pl: 'PORAŻKA', en: 'LOSS' },
  'arena.back': { pl: '← Miasto', en: '← Town' },
  'arena.modal.duel.title': { pl: 'POJEDYNEK!', en: 'DUEL!' },
  'arena.modal.assessing': { pl: 'Oceniam rywala...', en: 'Sizing up rival...' },
  'arena.modal.cancel': { pl: 'ANULUJ', en: 'CANCEL' },
  'arena.modal.fighting': { pl: 'WALKA...', en: 'FIGHTING...' },
  'arena.modal.toBattle': { pl: 'DO BOJU!', en: 'TO BATTLE!' },
  'arena.modal.victory': { pl: 'ZWYCIĘSTWO', en: 'VICTORY' },
  'arena.modal.defeat': { pl: 'PORAŻKA', en: 'DEFEAT' },
  'arena.modal.duel': { pl: 'POJEDYNEK', en: 'DUEL' },
  'arena.modal.pts': { pl: 'PKT', en: 'PTS' },
  'arena.modal.gold': { pl: 'ZŁOTO', en: 'GOLD' },
  'arena.modal.streak': { pl: 'PASSA', en: 'STREAK' },
  'arena.modal.miss': { pl: 'chybia', en: 'misses' },
  'arena.modal.crit': { pl: 'KRYT', en: 'CRIT' },
  'arena.modal.skip': { pl: 'POMIŃ', en: 'SKIP' },
  'arena.modal.close': { pl: 'ZAMKNIJ', en: 'CLOSE' },

  // ===== Leaderboards =====
  'leaderboards.title': { pl: 'KRONIKI CHWAŁY', en: 'GLORY CHRONICLES' },
  'leaderboards.flavor': {
    pl: 'Top dziesięciu. Bez nagród. Tylko dla ego.',
    en: 'Top ten. No rewards. Just ego.',
  },
  'leaderboards.tab.level': { pl: 'POZIOM', en: 'LEVEL' },
  'leaderboards.tab.achievements': { pl: 'ODZNAKI', en: 'BADGES' },
  'leaderboards.tab.arena': { pl: 'ARENA', en: 'ARENA' },
  'leaderboards.tab.guilds': { pl: 'GILDIE', en: 'GUILDS' },
  'leaderboards.value.level': { pl: 'lvl', en: 'lvl' },
  'leaderboards.value.achievements': { pl: 'razem', en: 'total' },
  'leaderboards.value.arena': { pl: 'pkt', en: 'pts' },
  'leaderboards.value.guilds': { pl: 'glory', en: 'glory' },
  'leaderboards.cls.warrior': { pl: 'Wojownik', en: 'Warrior' },
  'leaderboards.cls.mage': { pl: 'Mag', en: 'Mage' },
  'leaderboards.cls.rogue': { pl: 'Łotrzyk', en: 'Rogue' },
  'leaderboards.loading': { pl: 'Ładuję ranking...', en: 'Loading ranking...' },
  'leaderboards.error': {
    pl: 'Nie udało się pobrać. Spróbuj wrócić za chwilę.',
    en: 'Could not fetch. Try again in a moment.',
  },
  'leaderboards.empty.chars': {
    pl: 'Pusto. Ktoś musi być pierwszy.',
    en: 'Empty. Someone has to be first.',
  },
  'leaderboards.empty.guilds': {
    pl: 'Żadna gildia jeszcze nie zgromadziła chwały.',
    en: 'No guild has earned glory yet.',
  },
  'leaderboards.member.one': { pl: 'członek', en: 'member' },
  'leaderboards.member.many': { pl: 'członków', en: 'members' },
  'leaderboards.glory': { pl: 'glory', en: 'glory' },
  'leaderboards.back': { pl: '← Wróć', en: '← Back' },

  // ===== Blacksmith =====
  'blacksmith.title': { pl: 'KOWAL ZYGMUNT', en: 'ZYGMUNT THE SMITH' },
  'blacksmith.flavor': {
    pl: 'Wali, rozpruwa, ulepsza. Za przyzwoitą cenę.',
    en: 'Hammers, rips, upgrades. For a fair price.',
  },
  'blacksmith.scrap': { pl: 'złomu', en: 'scrap' },
  'blacksmith.tab.upgrade': { pl: 'ULEPSZ', en: 'UPGRADE' },
  'blacksmith.tab.dismantle': { pl: 'ROZPRUJ', en: 'DISMANTLE' },
  'blacksmith.back': { pl: '← Wróć', en: '← Back' },
  'blacksmith.toast.upgradeOk': { pl: 'Ulepszone do +{n}!', en: 'Upgraded to +{n}!' },
  'blacksmith.toast.upgradeFail': {
    pl: 'Nieudane. Koszt pobrany, poziom został.',
    en: 'Failed. Cost taken, level stayed.',
  },
  'blacksmith.toast.error': { pl: 'Nie udało się.', en: 'Could not.' },
  'blacksmith.toast.dismantled': {
    pl: '+{g} złomu (razem: {t}).',
    en: '+{g} scrap (total: {t}).',
  },
  'blacksmith.cost': { pl: 'Koszt:', en: 'Cost:' },
  'blacksmith.successRate': {
    pl: 'Szansa sukcesu: {n}%. Przy porażce koszt przepada, poziom zostaje.',
    en: 'Success chance: {n}%. On failure cost is lost, level stays.',
  },
  'blacksmith.btn.upgrade': { pl: 'ULEPSZ', en: 'UPGRADE' },
  'blacksmith.btn.upgradeGuarantee.title': {
    pl: 'Gwarantowane powodzenie za gemy',
    en: 'Guaranteed success for gems',
  },
  'blacksmith.maxLevel': {
    pl: 'Maksymalny poziom. Dalej się nie da.',
    en: 'Maximum level. No further.',
  },
  'blacksmith.dismantle.gainPre': { pl: 'Dostaniesz ', en: 'You will get ' },
  'blacksmith.dismantle.gainAmount': { pl: '{n} złomu', en: '{n} scrap' },
  'blacksmith.dismantle.gainPost': {
    pl: '. Przedmiot zniknie.',
    en: '. The item is gone.',
  },
  'blacksmith.dismantle.equipped': {
    pl: 'Zdejmij z postaci zanim rozpruwasz.',
    en: 'Unequip before you dismantle.',
  },
  'blacksmith.btn.dismantle': { pl: 'ROZPRUJ', en: 'DISMANTLE' },
  'blacksmith.empty': {
    pl: 'Nie masz czego ulepszyć ani rozpruć.',
    en: 'Nothing to upgrade or dismantle.',
  },
  'blacksmith.equippedBadge': { pl: 'W EQ', en: 'EQ' },

  // ===== Trainer =====
  'trainer.title': { pl: 'PLAC TRENINGOWY', en: 'TRAINING GROUND' },
  'trainer.flavor': { pl: 'Złoto w pot, pot w staty.', en: 'Gold to sweat, sweat to stats.' },
  'trainer.wallet': { pl: 'TWÓJ PORTFEL', en: 'YOUR WALLET' },
  'trainer.note': {
    pl: 'Trening drożeje kwadratowo. Po L35 sprzęt zwykle taniej.',
    en: 'Training scales quadratic. Past L35 gear is usually cheaper.',
  },
  'trainer.footer': {
    pl: 'Każdy kolejny punkt drożej. Trener też musi z czegoś żyć.',
    en: 'Every next point costs more. The trainer has to eat too.',
  },
  'trainer.back': { pl: '← Wróć', en: '← Back' },
  'trainer.stat.atk.label': { pl: 'ATAK', en: 'ATTACK' },
  'trainer.stat.atk.desc': { pl: 'Bijesz mocniej.', en: 'You hit harder.' },
  'trainer.stat.def.label': { pl: 'OBRONA', en: 'DEFENSE' },
  'trainer.stat.def.desc': { pl: 'Dostajesz mniej.', en: 'You take less.' },
  'trainer.stat.mag.label': { pl: 'MAGIA', en: 'MAGIC' },
  'trainer.stat.mag.desc': {
    pl: 'Ogniem, lodem, czymkolwiek.',
    en: 'Fire, ice, whatever.',
  },
  'trainer.stat.spd.label': { pl: 'SZYBKOŚĆ', en: 'SPEED' },
  'trainer.stat.spd.desc': {
    pl: 'Unikasz ciosów. MOCNY celuje.',
    en: 'You dodge hits. HEAVY aims.',
  },

  // ===== Tutorial (steps) =====
  'tutorial.startBig': { pl: 'ZACZYNAMY!', en: 'BEGIN!' },
  'tutorial.step1.title': { pl: 'WITAJ, {name}!', en: 'WELCOME, {name}!' },
  'tutorial.step1.body': {
    pl: 'Szczurogród to spokojne miasto. Znaczy... było. Zanim pojawiły się szczury, smoki i magowie eksperymentujący z serem.',
    en: 'Ratburg is a quiet town. Was, anyway. Before the rats, dragons, and mages experimenting with cheese.',
  },
  'tutorial.step2.title': { pl: 'WYRUSZAJ NA QUESTY', en: 'GO ON QUESTS' },
  'tutorial.step2.body': {
    pl: 'Pasek STAMINY regeneruje się sam. Wyruszaj, czekaj na timer, odbieraj nagrody. Nawet gdy jesteś offline, postęp się liczy.',
    en: 'The STAMINA bar regenerates on its own. Go, wait the timer, collect rewards. Progress counts even offline.',
  },
  'tutorial.step3.title': { pl: 'ZBIERAJ EKWIPUNEK', en: 'COLLECT GEAR' },
  'tutorial.step3.body': {
    pl: 'Każdy item ma rzadkość — od zwykłych po legendarne. Wyposażaj w ekranie Postaci. Przeciągnij do slotu.',
    en: 'Every item has a rarity — common to legendary. Equip on the Character screen. Drag to a slot.',
  },
  'tutorial.step4.title': { pl: 'ROZWIJAJ SIĘ DALEJ', en: 'KEEP GROWING' },
  'tutorial.step4.body': {
    pl: 'Sklep, Lochy, Arena, Gildia, Tawerna, Daily Rewards — wszystko do twoich usług. Reszta już sama, bohaterze.',
    en: 'Shop, Dungeons, Arena, Guild, Tavern, Daily Rewards — all yours. The rest is on you, hero.',
  },

  // ===== Guild =====
  'guild.tab.members': { pl: 'CZŁONKOWIE', en: 'MEMBERS' },
  'guild.tab.chat': { pl: 'CZAT', en: 'CHAT' },
  'guild.tab.treasury': { pl: 'SKARBIEC', en: 'TREASURY' },
  'guild.tab.buildings': { pl: 'BUDYNKI', en: 'BUILDINGS' },
  'guild.tab.wars': { pl: 'WOJNY', en: 'WARS' },
  'guild.tab.raids': { pl: 'RAJDY', en: 'RAIDS' },
  'guild.toast.leaveFailed': { pl: 'Nie udało się wyjść.', en: 'Could not leave.' },
  'guild.toast.disbandFailed': { pl: 'Nie udało się rozwiązać.', en: 'Could not disband.' },
  'guild.loading': { pl: 'Ładuję gildię...', en: 'Loading guild...' },
  'guild.level': { pl: 'Poziom gildii: {n}', en: 'Guild level: {n}' },
  'guild.stats.members': { pl: 'CZŁONKOWIE', en: 'MEMBERS' },
  'guild.stats.glory': { pl: 'CHWAŁA', en: 'GLORY' },
  'guild.stats.treasury': { pl: 'SKARBIEC', en: 'TREASURY' },
  'guild.btn.disband': { pl: 'ROZWIĄŻ GILDIĘ', en: 'DISBAND GUILD' },
  'guild.btn.leave': { pl: 'OPUŚĆ GILDIĘ', en: 'LEAVE GUILD' },
  'guild.confirm.disband.title': { pl: 'ROZWIĄZAĆ GILDIĘ?', en: 'DISBAND GUILD?' },
  'guild.confirm.leave.title': { pl: 'OPUŚCIĆ GILDIĘ?', en: 'LEAVE GUILD?' },
  'guild.confirm.disband.body': {
    pl: 'Skarbiec przepadnie. Członkowie znów wolni. Nie ma powrotu.',
    en: 'Treasury gone. Members free again. No way back.',
  },
  'guild.confirm.leave.body': {
    pl: 'Bez fanfar, bez pożegnania. Po prostu wyjdziesz.',
    en: 'No fanfare, no farewell. You just walk out.',
  },
  'guild.confirm.cancel': { pl: 'ANULUJ', en: 'CANCEL' },
  'guild.confirm.disband.btn': { pl: 'ROZWIĄŻ', en: 'DISBAND' },
  'guild.confirm.leave.btn': { pl: 'WYJDŹ', en: 'LEAVE' },

  // Guild — none view
  'guild.none.toast.applied': {
    pl: 'Podanie złożone. Gildia zdecyduje.',
    en: 'Application sent. The guild will decide.',
  },
  'guild.none.toast.applyFailed': { pl: 'Nie udało się.', en: 'Could not submit.' },
  'guild.none.toast.acceptFailed': { pl: 'Nie udało się przyjąć.', en: 'Could not accept.' },
  'guild.none.banner.title': { pl: 'BRAK GILDII', en: 'NO GUILD' },
  'guild.none.banner.flavor': {
    pl: 'Wolny strzelec. Brzmi dumnie. Smakuje jak samotność.',
    en: 'Lone wolf. Sounds proud. Tastes like solitude.',
  },
  'guild.none.create.title': { pl: 'ZAŁÓŻ GILDIĘ', en: 'FOUND A GUILD' },
  'guild.none.create.cost': {
    pl: 'Koszt: {gold} · Wymaga LVL {lvl}',
    en: 'Cost: {gold} · Requires LVL {lvl}',
  },
  'guild.none.create.needLvl': { pl: 'POTRZEBNY LVL {n}', en: 'NEEDS LVL {n}' },
  'guild.none.create.needGold': { pl: 'BRAK ZŁOTA ({n})', en: 'NOT ENOUGH GOLD ({n})' },
  'guild.none.create.btn': { pl: 'UTWÓRZ GILDIĘ', en: 'CREATE GUILD' },
  'guild.none.invites.title': { pl: 'ZAPROSZENIA', en: 'INVITES' },
  'guild.none.invites.accept': { pl: 'PRZYJMIJ', en: 'ACCEPT' },
  'guild.none.invites.decline': { pl: 'ODRZUĆ', en: 'DECLINE' },
  'guild.none.apps.title': { pl: 'OCZEKUJĄCE PODANIA', en: 'PENDING APPLICATIONS' },
  'guild.none.apps.waiting': { pl: '— czeka na decyzję.', en: '— awaiting decision.' },
  'guild.none.browse.title': { pl: 'OTWARTE GILDIE', en: 'OPEN GUILDS' },
  'guild.none.browse.loading': { pl: 'Ładuję...', en: 'Loading...' },
  'guild.none.browse.empty': {
    pl: 'Pusto. Może czas założyć własną.',
    en: 'Empty. Maybe time to found your own.',
  },
  'guild.none.browse.row.meta': {
    pl: 'LVL {lvl} · {count}/{cap} · wymaga LVL {req}',
    en: 'LVL {lvl} · {count}/{cap} · requires LVL {req}',
  },
  'guild.none.browse.btn.sent': { pl: 'WYSŁANE', en: 'SENT' },
  'guild.none.browse.btn.full': { pl: 'PEŁNA', en: 'FULL' },
  'guild.none.browse.btn.lowLvl': { pl: 'ZA MAŁO LVL', en: 'LVL TOO LOW' },
  'guild.none.browse.btn.apply': { pl: 'APLIKUJ', en: 'APPLY' },
  'guild.none.page.prev': { pl: 'POPRZEDNIA', en: 'PREVIOUS' },
  'guild.none.page.next': { pl: 'NASTĘPNA', en: 'NEXT' },

  // ===== Guild Tabs =====
  // -- GuildTabMembers --
  'guildMembers.invite': { pl: 'ZAPROŚ GRACZA', en: 'INVITE PLAYER' },
  'guildMembers.applications': { pl: 'PODANIA', en: 'APPLICATIONS' },
  'guildMembers.title': { pl: 'CZŁONKOWIE ({count}/{cap})', en: 'MEMBERS ({count}/{cap})' },
  'guildMembers.empty': {
    pl: 'Pusto jak w kasie podatkowej po audycie.',
    en: 'Empty like the tax office after an audit.',
  },
  'guildMembers.you': { pl: ' (Ty)', en: ' (You)' },
  'guildMembers.contributedGold': { pl: 'wpłata: {n}g', en: 'donated: {n}g' },
  'guildMembers.leaderTitle': { pl: 'Mistrz gildii', en: 'Guild Master' },
  'guildMembers.actionsAria': { pl: 'Akcje', en: 'Actions' },
  'guildMembers.action.promote': { pl: 'Promuj', en: 'Promote' },
  'guildMembers.action.demote': { pl: 'Degraduj', en: 'Demote' },
  'guildMembers.action.transfer': { pl: 'Przekaż przywództwo', en: 'Transfer leadership' },
  'guildMembers.action.kick': { pl: 'Wykop', en: 'Kick' },
  'guildMembers.toast.failed': { pl: 'Nie udało się.', en: 'Failed.' },
  'guildMembers.toast.accepted': { pl: 'Przyjęty.', en: 'Accepted.' },
  'guildMembers.apps.title': { pl: 'PODANIA ({count})', en: 'APPLICATIONS ({count})' },
  'guildMembers.apps.loading': { pl: 'Ładuję...', en: 'Loading...' },
  'guildMembers.apps.empty': {
    pl: 'Nikt nie aplikował. Cisza.',
    en: 'No applicants. Silence.',
  },
  'guildMembers.apps.accept': { pl: 'PRZYJMIJ', en: 'ACCEPT' },
  'guildMembers.apps.close': { pl: 'ZAMKNIJ', en: 'CLOSE' },
  'guildMembers.transfer.title': { pl: 'PRZEKAZAĆ ROLĘ?', en: 'TRANSFER ROLE?' },
  'guildMembers.transfer.body': {
    pl: 'Po zmianie {name} zostaje Mistrzem. Ty spadasz na Oficera. Decyzja nieodwracalna.',
    en: 'After the change {name} becomes Master. You drop to Officer. Decision is final.',
  },
  'guildMembers.transfer.cancel': { pl: 'ANULUJ', en: 'CANCEL' },
  'guildMembers.transfer.confirm': { pl: 'PRZEKAŻ', en: 'TRANSFER' },
  'guildMembers.rank.leader': { pl: 'Mistrz', en: 'Master' },
  'guildMembers.rank.officer': { pl: 'Oficer', en: 'Officer' },
  'guildMembers.rank.member': { pl: 'Członek', en: 'Member' },
  'guildMembers.rank.recruit': { pl: 'Rekrut', en: 'Recruit' },
  'guildMembers.time.justNow': { pl: 'przed chwilą', en: 'just now' },
  'guildMembers.time.minAgo': { pl: '{n} min temu', en: '{n} min ago' },
  'guildMembers.time.hAgo': { pl: '{n}h temu', en: '{n}h ago' },
  'guildMembers.time.dAgo': { pl: '{n}d temu', en: '{n}d ago' },

  // -- GuildTabChat --
  'guildChat.toast.deleteFailed': {
    pl: 'Nie udało się usunąć.',
    en: 'Could not delete.',
  },
  'guildChat.toast.sendFailed': {
    pl: 'Nie udało się wysłać.',
    en: 'Could not send.',
  },
  'guildChat.empty': {
    pl: 'Cisza jak u faktora po deadlinie.',
    en: 'Silent like a clerk past deadline.',
  },
  'guildChat.placeholder': { pl: 'Napisz...', en: 'Type...' },
  'guildChat.send': { pl: 'WYŚLIJ', en: 'SEND' },
  'guildChat.cooldown': { pl: '{n}s', en: '{n}s' },
  'guildChat.deleteAria': { pl: 'Usuń', en: 'Delete' },
  'guildChat.time.now': { pl: 'teraz', en: 'now' },
  'guildChat.time.m': { pl: '{n}m', en: '{n}m' },
  'guildChat.time.h': { pl: '{n}h', en: '{n}h' },
  'guildChat.time.d': { pl: '{n}d', en: '{n}d' },

  // -- GuildTabTreasury --
  'guildTreasury.title': { pl: 'SKARBIEC', en: 'TREASURY' },
  'guildTreasury.gold': { pl: 'ZŁOTO', en: 'GOLD' },
  'guildTreasury.gems': { pl: 'GEMY', en: 'GEMS' },
  'guildTreasury.deposit': { pl: 'WPŁAĆ', en: 'DEPOSIT' },
  'guildTreasury.withdraw': { pl: 'WYPŁAĆ', en: 'WITHDRAW' },
  'guildTreasury.dailyLimit': {
    pl: 'Dzienny limit wypłaty:',
    en: 'Daily withdrawal limit:',
  },
  'guildTreasury.history': { pl: 'HISTORIA', en: 'HISTORY' },
  'guildTreasury.loading': { pl: 'Ładuję log...', en: 'Loading log...' },
  'guildTreasury.empty': {
    pl: 'Pusto. Nikt niczego nie ruszył.',
    en: 'Empty. Nobody touched a thing.',
  },
  'guildTreasury.kind.deposit': { pl: 'wpłata', en: 'deposit' },
  'guildTreasury.kind.withdraw': { pl: 'wypłata', en: 'withdrawal' },
  'guildTreasury.kind.building_upgrade': { pl: 'upgrade', en: 'upgrade' },
  'guildTreasury.kind.war_reward': { pl: 'wojna', en: 'war' },
  'guildTreasury.kind.raid_reward': { pl: 'rajd', en: 'raid' },
  'guildTreasury.topContributors': { pl: 'NAJHOJNIEJSI', en: 'TOP CONTRIBUTORS' },
  'guildTreasury.time.justNow': { pl: 'przed chwilą', en: 'just now' },
  'guildTreasury.time.minAgo': { pl: '{n} min temu', en: '{n} min ago' },
  'guildTreasury.time.hAgo': { pl: '{n}h temu', en: '{n}h ago' },
  'guildTreasury.time.dAgo': { pl: '{n}d temu', en: '{n}d ago' },

  // -- GuildTabBuildings --
  'guildBuildings.loading': { pl: 'Ładuję budynki...', en: 'Loading buildings...' },
  'guildBuildings.flavor': {
    pl: 'Buffy Ołtarza działają w arenie i rajdach. Nie w PvE.',
    en: 'Altar buffs work in arena and raids. Not in PvE.',
  },
  'guildBuildings.toast.upgraded': { pl: '{name} L{lvl}.', en: '{name} L{lvl}.' },
  'guildBuildings.toast.refused': { pl: 'Upgrade odmówiony.', en: 'Upgrade refused.' },
  'guildBuildings.atMax': {
    pl: 'Maksymalnie. Dalej już nie rośnie.',
    en: 'Maxed out. No further growth.',
  },
  'guildBuildings.nextLevel': { pl: 'Następny poziom (L{n}):', en: 'Next level (L{n}):' },
  'guildBuildings.requiresGuildLvl': {
    pl: '· wymaga gildii LVL {n}',
    en: '· requires guild LVL {n}',
  },
  'guildBuildings.tooYoung': { pl: 'Gildia zbyt młoda.', en: 'Guild too young.' },
  'guildBuildings.notEnoughGold': {
    pl: 'Skarbiec nie uciągnie.',
    en: 'Treasury cannot afford it.',
  },
  'guildBuildings.notEnoughGems': {
    pl: 'Za mało gemów w skarbcu.',
    en: 'Not enough gems in treasury.',
  },
  'guildBuildings.upgrade': { pl: 'ULEPSZ', en: 'UPGRADE' },
  'guildBuildings.officersOnly': {
    pl: 'Tylko oficerowie i lider.',
    en: 'Officers and leader only.',
  },
  'guildBuildings.fortress.current': {
    pl: '+{n} członków',
    en: '+{n} members',
  },
  'guildBuildings.fortress.next': { pl: '→ +{n}', en: '→ +{n}' },
  'guildBuildings.altar.current': {
    pl: 'ATK +{atk} · MAG +{mag} · DEF +{def}',
    en: 'ATK +{atk} · MAG +{mag} · DEF +{def}',
  },
  'guildBuildings.altar.next': {
    pl: '→ ATK +{atk} · MAG +{mag} · DEF +{def}',
    en: '→ ATK +{atk} · MAG +{mag} · DEF +{def}',
  },
  'guildBuildings.vault.current': {
    pl: 'limit wypłaty: {pct}/dzień',
    en: 'withdrawal limit: {pct}/day',
  },
  'guildBuildings.vault.next': { pl: '→ {pct}/dzień', en: '→ {pct}/day' },

  // ===== Guild Wars =====
  'guildWars.noActive': { pl: 'BRAK AKTYWNEJ WOJNY', en: 'NO ACTIVE WAR' },
  'guildWars.noActive.flavor': { pl: 'Spokój? Tymczasowo.', en: 'Quiet? For now.' },
  'guildWars.declare': { pl: 'WYPOWIEDZ WOJNĘ', en: 'DECLARE WAR' },
  'guildWars.officerOnly': { pl: 'Tylko oficer lub lider.', en: 'Officer or leader only.' },
  'guildWars.recent': { pl: 'OSTATNIE WOJNY', en: 'RECENT WARS' },
  'guildWars.title.vs': { pl: 'WOJNA: „{a}" vs „{b}"', en: 'WAR: "{a}" vs "{b}"' },
  'guildWars.row.vs': { pl: '„{a}" vs „{b}"', en: '"{a}" vs "{b}"' },
  'guildWars.resolving': { pl: 'ROZSTRZYGANIE', en: 'RESOLVING' },
  'guildWars.cancelled': { pl: 'anulowano', en: 'cancelled' },
  'guildWars.scoreWinner': { pl: '{score} · zwycięzca: {winner}', en: '{score} · winner: {winner}' },
  'guildWars.startsNow': { pl: 'startuje', en: 'starting' },
  'guildWars.side.ours.attack': { pl: 'NASI (ATAK)', en: 'OURS (ATTACK)' },
  'guildWars.side.ours.defense': { pl: 'NASI (OBRONA)', en: 'OURS (DEFENSE)' },
  'guildWars.side.enemy.attack': { pl: 'WRÓG (ATAK)', en: 'ENEMY (ATTACK)' },
  'guildWars.side.enemy.defense': { pl: 'WRÓG (OBRONA)', en: 'ENEMY (DEFENSE)' },
  'guildWars.commit': { pl: 'ZGŁOŚ SIĘ', en: 'JOIN' },
  'guildWars.cancelCommit': { pl: 'WYCOFAJ', en: 'WITHDRAW' },
  'guildWars.lineup': { pl: 'SZYK ({n})', en: 'LINEUP ({n})' },
  'guildWars.myPosition': { pl: 'Twoja pozycja: ', en: 'Your position: ' },
  'guildWars.toast.committed': { pl: 'Zgłoszony do walki.', en: 'Joined the fight.' },
  'guildWars.toast.commitFail': { pl: 'Nie udało się zgłosić.', en: 'Could not join.' },
  'guildWars.toast.cancelled': { pl: 'Wycofano zgłoszenie.', en: 'Withdrawal recorded.' },
  'guildWars.toast.cancelFail': { pl: 'Nie udało się.', en: 'Failed.' },
  // Declare modal
  'guildWars.declareTitle': { pl: 'WYPOWIEDZ WOJNĘ', en: 'DECLARE WAR' },
  'guildWars.declare.myAvg': { pl: 'Twój średni LVL: ', en: 'Your avg LVL: ' },
  'guildWars.declare.band': { pl: ' · band ±10', en: ' · band ±10' },
  'guildWars.declare.searching': { pl: 'Szukam...', en: 'Searching...' },
  'guildWars.declare.empty': {
    pl: 'Nikogo z twojej ligi. Poczekaj aż ktoś dorośnie.',
    en: 'No one in your bracket. Wait for someone to grow up.',
  },
  'guildWars.declare.target.line': {
    pl: 'avg LVL {avg} · {n} członków · chwała {glory}',
    en: 'avg LVL {avg} · {n} members · glory {glory}',
  },
  'guildWars.declare.btn': { pl: 'WYPOWIEDZ', en: 'DECLARE' },
  'guildWars.declare.cancel': { pl: 'ANULUJ', en: 'CANCEL' },
  'guildWars.declare.toast.success': {
    pl: 'Wojna wypowiedziana. Start za 24h.',
    en: 'War declared. Starts in 24h.',
  },
  'guildWars.declare.toast.fail': {
    pl: 'Nie udało się wypowiedzieć.',
    en: 'Could not declare.',
  },
  // Lineup editor
  'guildWars.lineup.title': { pl: 'USTAW SZYK', en: 'SET LINEUP' },
  'guildWars.lineup.flavor': {
    pl: 'Pierwszy walczy z pierwszym przeciwnika. Zwycięzca zostaje z resztką HP.',
    en: 'First fights first. Winner keeps their leftover HP.',
  },
  'guildWars.lineup.empty': {
    pl: 'Nikt nie zgłoszony. Najpierw członkowie, potem szyk.',
    en: 'No one signed up. Members first, then the lineup.',
  },
  'guildWars.lineup.up': { pl: 'W górę', en: 'Up' },
  'guildWars.lineup.down': { pl: 'W dół', en: 'Down' },
  'guildWars.lineup.cancel': { pl: 'ANULUJ', en: 'CANCEL' },
  'guildWars.lineup.save': { pl: 'ZAPISZ', en: 'SAVE' },
  'guildWars.lineup.toast.saved': { pl: 'Szyk ustawiony.', en: 'Lineup set.' },
  'guildWars.lineup.toast.fail': { pl: 'Nie udało się.', en: 'Failed.' },
  // Result modal
  'guildWars.result.victory': { pl: 'ZWYCIĘSTWO', en: 'VICTORY' },
  'guildWars.result.defeat': { pl: 'PORAŻKA', en: 'DEFEAT' },
  'guildWars.result.war': { pl: 'WOJNA', en: 'WAR' },
  'guildWars.result.summary.attacker': {
    pl: '„{w}" wygrała {score} z „{l}".',
    en: '"{w}" won {score} against "{l}".',
  },
  'guildWars.result.summary.defender': {
    pl: '„{w}" obroniła {score} z „{l}".',
    en: '"{w}" defended {score} against "{l}".',
  },
  'guildWars.result.toTreasury': {
    pl: '+{n} do skarbca zwycięzcy',
    en: '+{n} to winner treasury',
  },
  'guildWars.result.rounds': { pl: 'PRZEBIEG', en: 'ROUNDS' },
  'guildWars.result.forfeit': {
    pl: 'Forfeit — jedna strona nie stawiła się.',
    en: 'Forfeit — one side did not show.',
  },
  'guildWars.result.round': { pl: 'runda {n}', en: 'round {n}' },
  'guildWars.result.attack': { pl: 'ATAK', en: 'ATTACK' },
  'guildWars.result.defense': { pl: 'OBRONA', en: 'DEFENSE' },
  'guildWars.result.duelLine': {
    pl: 'zwycięzca zostaje z {hp} HP · tur: {turns}',
    en: 'winner finishes with {hp} HP · turns: {turns}',
  },
  'guildWars.result.close': { pl: 'ZAMKNIJ', en: 'CLOSE' },

  // ===== Guild Raids =====
  'guildRaids.loading': { pl: 'Ładuję raid...', en: 'Loading raid...' },
  'guildRaids.tier': { pl: 'TIER {n}', en: 'TIER {n}' },
  'guildRaids.hits.line': {
    pl: 'Twoje uderzenia: ',
    en: 'Your hits: ',
  },
  'guildRaids.hits.reset': { pl: ' · reset 00:00 UTC', en: ' · resets 00:00 UTC' },
  'guildRaids.btn.pending': { pl: '...', en: '...' },
  'guildRaids.btn.none': { pl: 'BRAK UDERZEŃ DZIŚ', en: 'NO HITS LEFT TODAY' },
  'guildRaids.btn.hit': { pl: 'UDERZ ({n} zostało)', en: 'STRIKE ({n} left)' },
  'guildRaids.btn.buy': { pl: 'DOKUP', en: 'BUY MORE' },
  'guildRaids.toast.bought': { pl: 'Wykupiono uderzenie.', en: 'Extra hit purchased.' },
  'guildRaids.toast.fail': { pl: 'Nie udało się.', en: 'Failed.' },
  'guildRaids.toast.hitFail': { pl: 'Nie udało się uderzyć.', en: 'Strike failed.' },
  'guildRaids.top': { pl: 'TOP BICIE (ten boss)', en: 'TOP STRIKES (this boss)' },
  'guildRaids.top.line': { pl: '{dmg} dmg · {n}×', en: '{dmg} dmg · {n}×' },
  'guildRaids.trophies': { pl: 'TROFEA', en: 'TROPHIES' },
  'guildRaids.trophy.kb': { pl: 'cios kończący: {name}', en: 'killing blow: {name}' },
  // Raid hit result modal
  'guildRaids.result.bossDown': { pl: 'BOSS PADŁ!', en: 'BOSS DOWN!' },
  'guildRaids.result.bossDown.line': {
    pl: '„{name}" — skończony. Zadałeś {n} dmg ostatnim ciosem.',
    en: '"{name}" — done. You dealt {n} dmg with the final blow.',
  },
  'guildRaids.result.toTreasury': { pl: 'DO SKARBCA:', en: 'TO TREASURY:' },
  'guildRaids.result.next': { pl: 'NASTĘPNY (TIER {n}):', en: 'NEXT (TIER {n}):' },
  'guildRaids.result.hit': { pl: 'UDERZENIE', en: 'STRIKE' },
  'guildRaids.result.dealt': { pl: 'Zadałeś {n} dmg.', en: 'You dealt {n} dmg.' },
  'guildRaids.result.left': { pl: 'Zostało: {n} HP', en: 'Remaining: {n} HP' },
  'guildRaids.result.continue': { pl: 'BIJEMY DALEJ', en: 'KEEP STRIKING' },
  'guildRaids.result.ok': { pl: 'OK', en: 'OK' },

  // ===== Guild Create modal =====
  'guildCreate.title': { pl: 'ZAŁÓŻ GILDIĘ', en: 'FOUND A GUILD' },
  'guildCreate.name.label': { pl: 'NAZWA (3-24)', en: 'NAME (3-24)' },
  'guildCreate.name.placeholder': { pl: 'Rycerze Sofy', en: 'Couch Knights' },
  'guildCreate.tag.label': { pl: 'TAG (2-5)', en: 'TAG (2-5)' },
  'guildCreate.tag.placeholder': { pl: 'SOFA', en: 'COUCH' },
  'guildCreate.emblem.label': { pl: 'EMBLEM', en: 'EMBLEM' },
  'guildCreate.color.label': { pl: 'KOLOR', en: 'COLOR' },
  'guildCreate.motto.label': { pl: 'MOTTO (opcjonalne, do 80)', en: 'MOTTO (optional, up to 80)' },
  'guildCreate.motto.placeholder': { pl: 'Walka i pierogi', en: 'Combat and dumplings' },
  'guildCreate.cost': {
    pl: 'Koszt: {gold}g · Wymaga LVL {lvl}',
    en: 'Cost: {gold}g · Requires LVL {lvl}',
  },
  'guildCreate.tooEarly': {
    pl: 'Za wcześnie. Kapitanowie rodzą się po LVL {lvl}.',
    en: 'Too soon. Captains are forged past LVL {lvl}.',
  },
  'guildCreate.notEnoughGold': {
    pl: 'Kasa nie starczy. Gildia to inwestycja.',
    en: 'Not enough coin. A guild is an investment.',
  },
  'guildCreate.cancel': { pl: 'ANULUJ', en: 'CANCEL' },
  'guildCreate.submit': { pl: 'ZAŁÓŻ', en: 'FOUND' },
  'guildCreate.toast.fail': {
    pl: 'Nie udało się założyć gildii.',
    en: 'Could not found the guild.',
  },

  // ===== Guild Invite modal =====
  'guildInvite.title': { pl: 'ZAPROŚ GRACZA', en: 'INVITE PLAYER' },
  'guildInvite.search.placeholder': {
    pl: 'Szukaj po nazwie (min. 3 znaki)',
    en: 'Search by name (min. 3 chars)',
  },
  'guildInvite.prompt': {
    pl: 'Wpisz kogo szukasz. Miasto duże.',
    en: 'Type who you want. The city is big.',
  },
  'guildInvite.searching': { pl: 'Szukam...', en: 'Searching...' },
  'guildInvite.empty': {
    pl: 'Nikogo takiego w Szczurogrodzie. Albo już gdzieś siedzi.',
    en: 'No one like that in Ratburg. Or already busy somewhere.',
  },
  'guildInvite.line': { pl: '{cls} · LVL {lvl}', en: '{cls} · LVL {lvl}' },
  'guildInvite.btn': { pl: 'ZAPROŚ', en: 'INVITE' },
  'guildInvite.close': { pl: 'ZAMKNIJ', en: 'CLOSE' },
  'guildInvite.toast.success': { pl: 'Zaproszono {name}.', en: 'Invited {name}.' },
  'guildInvite.toast.successFallback': { pl: 'Zaproszono gracza.', en: 'Player invited.' },
  'guildInvite.toast.fail': {
    pl: 'Nie udało się zaprosić.',
    en: 'Could not invite.',
  },

  // ===== Guild Deposit modal =====
  'guildDeposit.title': { pl: 'WPŁAĆ DO SKARBCA', en: 'DEPOSIT TO TREASURY' },
  'guildDeposit.gold': { pl: 'ZŁOTO', en: 'GOLD' },
  'guildDeposit.gems': { pl: 'GEMY', en: 'GEMS' },
  'guildDeposit.have': { pl: 'masz: {n}', en: 'you have: {n}' },
  'guildDeposit.cancel': { pl: 'ANULUJ', en: 'CANCEL' },
  'guildDeposit.submit': { pl: 'WPŁAĆ', en: 'DEPOSIT' },
  'guildDeposit.max': { pl: 'MAX', en: 'MAX' },
  'guildDeposit.toast.success': { pl: 'Wpłata zaksięgowana.', en: 'Deposit recorded.' },
  'guildDeposit.toast.fail': { pl: 'Nie udało się wpłacić.', en: 'Deposit failed.' },

  // ===== Guild Withdraw modal =====
  'guildWithdraw.title': { pl: 'WYPŁAĆ ZE SKARBCA', en: 'WITHDRAW FROM TREASURY' },
  'guildWithdraw.gold': { pl: 'ZŁOTO', en: 'GOLD' },
  'guildWithdraw.gems': { pl: 'GEMY (tylko Mistrz)', en: 'GEMS (Leader only)' },
  'guildWithdraw.todayLeft': { pl: 'Dziś jeszcze: {n}g', en: 'Today left: {n}g' },
  'guildWithdraw.inTreasury': { pl: 'W skarbcu: {n}', en: 'In treasury: {n}' },
  'guildWithdraw.noRank': {
    pl: 'Twoja ranga nie sięga skarbca.',
    en: 'Your rank does not reach the treasury.',
  },
  'guildWithdraw.cancel': { pl: 'ANULUJ', en: 'CANCEL' },
  'guildWithdraw.submit': { pl: 'WYPŁAĆ', en: 'WITHDRAW' },
  'guildWithdraw.max': { pl: 'MAX', en: 'MAX' },
  'guildWithdraw.toast.success': { pl: 'Wypłata zaksięgowana.', en: 'Withdrawal recorded.' },
  'guildWithdraw.toast.fail': { pl: 'Nie udało się wypłacić.', en: 'Withdrawal failed.' },

  // ===== Achievements =====
  'achievements.title': { pl: 'OSIĄGNIĘCIA', en: 'ACHIEVEMENTS' },
  'achievements.flavor': {
    pl: 'Robisz i tak. Czasem ktoś to liczy.',
    en: 'You do it anyway. Sometimes someone counts.',
  },
  'achievements.progress': { pl: '{a} / {b} odblokowanych', en: '{a} / {b} unlocked' },
  'achievements.cat.combat': { pl: 'WALKA', en: 'COMBAT' },
  'achievements.cat.loot': { pl: 'ŁUP', en: 'LOOT' },
  'achievements.cat.progression': { pl: 'POSTĘP', en: 'PROGRESS' },
  'achievements.cat.economy': { pl: 'GOSPODARKA', en: 'ECONOMY' },
  'achievements.tier.bronze': { pl: 'BRĄZ', en: 'BRONZE' },
  'achievements.tier.silver': { pl: 'SREBRO', en: 'SILVER' },
  'achievements.tier.gold': { pl: 'ZŁOTO', en: 'GOLD' },
  'achievements.tier.legendary': { pl: 'LEGENDA', en: 'LEGENDARY' },
  'achievements.loading': { pl: 'Ładowanie…', en: 'Loading…' },
  'achievements.empty': {
    pl: 'Brak osiągnięć w tej kategorii.',
    en: 'No achievements in this category.',
  },

  // ===== Chronicle =====
  'chronicle.title': { pl: 'KRONIKI SZCZUROGRODU', en: 'CHRONICLES OF RATBURG' },
  'chronicle.flavor': {
    pl: 'Co miasto widziało. Co karczmarz słyszał.',
    en: 'What the town saw. What the innkeeper heard.',
  },
  'chronicle.loading': { pl: 'Ładowanie kroniki…', en: 'Loading chronicles…' },
  'chronicle.empty': {
    pl: 'Kronikarz pisze. Wróć za chwilę.',
    en: 'The chronicler is writing. Come back soon.',
  },
  'chronicle.source.event': { pl: 'Prawdziwy event gracza', en: 'Real player event' },
  'chronicle.source.rumor': { pl: 'Plotka z miasta', en: 'Town rumor' },
  'chronicle.ago.justNow': { pl: 'przed chwilą', en: 'just now' },
  'chronicle.ago.minutes': { pl: '{n} min temu', en: '{n} min ago' },
  'chronicle.ago.hours': { pl: '{n} h temu', en: '{n} h ago' },
  'chronicle.ago.days': { pl: '{n} dni temu', en: '{n} days ago' },

  // ===== Scrapbook =====
  'scrapbook.title': { pl: 'KOLEKCJA SZCZUROGRODA', en: 'RATBURG COLLECTION' },
  'scrapbook.flavor': {
    pl: 'Kto raz był w bagu, ten w księdze zostaje.',
    en: 'Once in the bag, forever in the book.',
  },
  'scrapbook.loading': { pl: 'Ładuję kolekcję...', en: 'Loading collection...' },
  'scrapbook.buffsNote': {
    pl: 'Buffy działają w arenie i rajdach. PvE bez zmian.',
    en: 'Buffs apply in arena and raids. PvE unaffected.',
  },
  'scrapbook.filter.all': { pl: 'WSZYSTKO', en: 'ALL' },
  'scrapbook.filter.common': { pl: 'POSPOLITE', en: 'COMMON' },
  'scrapbook.filter.rare': { pl: 'RZADKIE', en: 'RARE' },
  'scrapbook.filter.epic': { pl: 'EPICKIE', en: 'EPIC' },
  'scrapbook.filter.legendary': { pl: 'LEGENDARNE', en: 'LEGENDARY' },
  'scrapbook.cell.unknown': { pl: 'Nieznany przedmiot', en: 'Unknown item' },
  'scrapbook.buff.xp': { pl: '+XP', en: '+XP' },
  'scrapbook.buff.gold': { pl: '+ZŁOTO', en: '+GOLD' },
  'scrapbook.buff.dmg': { pl: '+DMG', en: '+DMG' },
  'scrapbook.buff.drop': { pl: '+DROP', en: '+DROP' },
  'scrapbook.buff.unlocked': {
    pl: '{label}: +{val}% (odblokowane przy {th}%)',
    en: '{label}: +{val}% (unlocked at {th}%)',
  },
  'scrapbook.modal.slot': { pl: 'Slot', en: 'Slot' },
  'scrapbook.modal.foundAt': { pl: 'Znaleziono', en: 'Found at' },
  'scrapbook.modal.notFound': {
    pl: 'Jeszcze nie odkryty. Wciąż gdzieś tam czeka.',
    en: 'Not yet discovered. Still out there.',
  },
  'scrapbook.slot.head': { pl: 'głowa', en: 'head' },
  'scrapbook.slot.chest': { pl: 'tors', en: 'chest' },
  'scrapbook.slot.legs': { pl: 'nogi', en: 'legs' },
  'scrapbook.slot.boots': { pl: 'buty', en: 'boots' },
  'scrapbook.slot.weapon': { pl: 'broń', en: 'weapon' },
  'scrapbook.slot.shield': { pl: 'tarcza', en: 'shield' },
  'scrapbook.slot.trinket': { pl: 'amulet', en: 'trinket' },
  'scrapbook.slot.potion': { pl: 'mikstura', en: 'potion' },
  'scrapbook.slot.any': { pl: 'inne', en: 'misc' },
  'scrapbook.buff.locked': {
    pl: '{label}: zablokowane. Wymaga {th}% kolekcji.',
    en: '{label}: locked. Requires {th}% collection.',
  },
} as const satisfies Dict;
