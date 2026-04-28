// English translations for DB-backed content. Imported once at module load
// (see ./index.ts) — populates CONTENT_EN maps from `./content`. Server stays
// PL-only; useContentT() helpers consult these maps when lang === 'en'.
//
// Adding a new content row in TS arrays / DataGrip:
//   1. After seeding, copy the PL name/desc here as the lookup key.
//   2. Provide the EN translation as the value.
//   3. If a PL key is missing here, the UI quietly falls back to PL.

import { CONTENT_EN } from './content';

// ===== Regions =====
Object.assign(CONTENT_EN.regions, {
  'okolice-szczurogrodu': { name: 'Outskirts of Ratburg' },
  'puszcza-cien': { name: 'Shadowwood' },
  'bagna-czarnej-strzygi': { name: 'Marshes of the Black Strzyga' },
  'granie-strzelistych': { name: 'Spires of the Soaring Peaks' },
});

// ===== Dungeons =====
Object.assign(CONTENT_EN.dungeons, {
  'piwnice-miasta': {
    name: 'City Cellars',
    desc: 'It stinks under the city. Something is moving down there. Someone has to check.',
  },
  'stare-katakumby': {
    name: 'Old Catacombs',
    desc: 'They remember the days before Ratburg. The dead remember longest.',
  },
  'mroczna-gran': {
    name: 'Dark Ridge',
    desc: 'Where the stone starts whispering. Come find out.',
  },
  'szlaki-lesne': {
    name: 'Forest Trails',
    desc: 'Paths winding between the trees. The forest knows who walks them.',
  },
  'kurhany-starych-bogow': {
    name: 'Barrows of the Old Gods',
    desc: 'Old stones. Older bones. Even older promises.',
  },
  'serce-puszczy': {
    name: 'Heart of the Forest',
    desc: 'Here the forest does not end. Here the forest begins.',
  },
  'mielizny-topielcow': {
    name: 'Drowned-Man Shoals',
    desc: 'Water reaches your knees. Then higher. Something grabs your ankle.',
  },
  'gaszcz-bolesny': {
    name: 'Aching Thicket',
    desc: 'Dead trees, but they grow. They say someone was chopping wood here.',
  },
  'czarna-obrzednica': {
    name: 'Black Ritualist',
    desc: 'An island with a gazebo. A gazebo with an altar. An altar made of something that remembers.',
  },
  'lodowa-jaskinia': {
    name: 'Ice Cavern',
    desc: 'Narrow entry, wide echo. Marmots out-shriek the mountain wind.',
  },
  'otchlan-skarbnika': {
    name: "Treasurer's Abyss",
    desc: 'Old shafts beneath the peak. The miner lamp still burns. By itself.',
  },
});

// ===== Enemies =====
Object.assign(CONTENT_EN.enemies, {
  'goblin-scav': { name: 'Goblin Scavenger' },
  'rat-giant': { name: 'Giant Rat' },
  'slime-green': { name: 'Green Slime' },
  'kobold-thief': { name: 'Kobold Thief' },
  'goblin-warrior': { name: 'Goblin Warrior' },
  'cave-spider': { name: 'Cave Spider' },
  'skeleton-soldier': { name: 'Skeleton Soldier' },
  'bat-dire': { name: 'Dire Bat' },
  'troll-cave': { name: 'Cave Troll' },
  'demon-imp': { name: 'Imp' },
  'ogre-brute': { name: 'Ogre Brute' },
  'skeleton-captain': { name: 'Skeleton Captain' },
  'goblin-shaman': { name: 'Goblin Shaman' },
  'minotaur': { name: 'Minotaur' },
  'slime-shadow': { name: 'Shadow Slime' },
  'wraith': { name: 'Wraith' },
  'hobgoblin-king': { name: 'Hobgoblin King' },
  'bone-dragon': { name: 'Bone Dragon' },
  'void-horror': { name: 'Void Horror' },
  'rat-king-baltazar': { name: 'Rat King Balthazar' },
  'kosciej-elder': { name: 'Elder Bone-Wight' },
  'lord-of-the-peaks': { name: 'Lord of the Peaks' },
  'forest-bandit': { name: 'Forest Bandit' },
  'boar-tusk': { name: 'Tusker Boar' },
  'goblin-scout': { name: 'Goblin Scout' },
  'wolf-pack': { name: 'Pack Wolf' },
  'treant-young': { name: 'Young Treant' },
  'ghoul-risen': { name: 'Risen Ghoul' },
  'skeleton-priest': { name: 'Skeleton Priest' },
  'bone-golem': { name: 'Bone Golem' },
  'wraith-howler': { name: 'Howling Wraith' },
  'lich-acolyte': { name: 'Lich Acolyte' },
  'dryad-matron': { name: 'Dryad Matron' },
  'treant-elder': { name: 'Ancient Treant' },
  'corrupted-deer': { name: 'Corrupted Deer' },
  'mist-wraith': { name: 'Mist Wraith' },
  'shadow-beast': { name: 'Shadow Beast' },
  'wilkolak-matecznika': { name: 'Den-Mother Werewolf' },
  'strzygon-dziadowski': { name: 'Old Strzygoń' },
  'panna-leszczyna': { name: 'Maiden Hazelwood' },
  // Bagna Czarnej Strzygi (DB-only — migration 0030)
  'topielec-maly': { name: 'Lesser Drowned' },
  'blotna-pijawka': { name: 'Mire Leech' },
  'zabnik-dwukrotny': { name: 'Two-time Frogman' },
  'larwa-trzcinowa': { name: 'Reed Larva' },
  'mgielny-duch': { name: 'Mist Spirit' },
  'cierniak-pelzajacy': { name: 'Crawling Thorn' },
  'dziadek-z-trzciny': { name: 'Reed Grandfather' },
  'kikut-chodzacy': { name: 'Walking Stump' },
  'ropuch-straznik': { name: 'Sentinel Toad' },
  'zelazny-komar': { name: 'Iron Mosquito' },
  'sluga-strzygi': { name: 'Strzyga Servant' },
  'nietoperz-upiora': { name: 'Wraith Bat' },
  'slepy-oracz': { name: 'Blind Plowman' },
  'kocica-obrzedowa': { name: 'Ritual She-cat' },
  'pan-ogrodow': { name: 'Lord of the Withering Gardens' },
  'zasmucony-topielec-starszy': { name: 'Saddened Elder Drowned' },
  'upior-drwala': { name: "Lumberjack's Wraith" },
  'czarna-strzyga': { name: 'Black Strzyga' },
  // Granie Strzelistych Iglic
  'swiszcz-hardy': { name: 'Sturdy Marmot' },
  'straznik-granii': { name: 'Ridge Sentinel' },
  'lodowy-tropiciel': { name: 'Ice Tracker' },
  'mrozny-upior': { name: 'Frost Wraith' },
  'ognista-pani': { name: 'Lady of Flame' },
  'skarbnik-otchlani': { name: 'Treasurer of the Abyss' },
});

// ===== Quests =====
Object.assign(CONTENT_EN.quests, {
  q1: {
    title: 'Gather mushrooms for the witch',
    desc: 'The old woman is hungry. And angry. She is starving.',
  },
  q2: {
    title: 'Chase martens out of the mill',
    desc: 'Three burghers and one mayor have already been bitten.',
  },
  q3: {
    title: 'Talk to the rat',
    desc: 'They say it talks. Check. If it talks — defeat it.',
  },
  q4: {
    title: 'Raid on the cake shop',
    desc: 'Thieves are stealing cheesecakes. Unacceptable.',
  },
  q5: {
    title: "The goblin chief's rooster",
    desc: "The chief stole the mayor's rooster. Reclaim the rooster, calm the chief.",
  },
  q6: {
    title: 'Spider sabbath',
    desc: 'Spiders are dancing in a circle. No one knows why. End the sabbath.',
  },
  q7: {
    title: 'Mist over the pond',
    desc: 'Purple mist. The fish speak French. Report discreetly.',
  },
  q8: {
    title: "The smith's wife's cat",
    desc: 'A tabby went missing. The smith’s wife stopped working. The smith is drinking. Action!',
  },
  q9: {
    title: 'Cheese contraband',
    desc: 'Someone is smuggling oscypek out of town. It is just cheese — but the scale.',
  },
  q10: {
    title: 'Troll under the bridge',
    desc: 'Charges a toll no one can pay. Pay or fight. Better fight.',
  },
  q11: {
    title: 'Seal in the cellar',
    desc: 'Someone broke into the cathedral cellar. A cellar without beer. Suspicious.',
  },
  q12: {
    title: 'The priest did not return',
    desc: 'Father Tadeusz was supposed to bless the cheeses. Three days — silence.',
  },
  q13: {
    title: 'A demon calls by name',
    desc: 'Yours. Specifically yours. Ask what for.',
  },
  q14: {
    title: 'Void in the mirror',
    desc: 'The mirror shows something else, not you. Something that also looks back.',
  },
  q15: {
    title: "Hobgoblin King's throne",
    desc: 'End of Act I. Take the throne, the crown, and close the chapter.',
  },
  q16: {
    title: 'Tracks on the path',
    desc: 'A bandit left a footprint. The smith wants to test what he is worth.',
  },
  q17: {
    title: "The butcher's boar",
    desc: 'Snorts heavily under the fence. Gold for the meat.',
  },
  q18: {
    title: 'Goblin with a spyglass',
    desc: 'A scout was seen three villages away. The scout must come back deaf.',
  },
  q19: {
    title: 'Pack near the village',
    desc: 'Wolves ate the sheep. The shepherd gave up. The mayor — did not.',
  },
  q20: {
    title: 'Den-Mother Werewolf',
    desc: 'Boss of the Trails. Kill it — or explain it to the neighbors at dawn.',
  },
  q22: {
    title: 'Bone shepherd',
    desc: 'Footsteps in the barrows. Footsteps without legs. So far.',
  },
  q24: {
    title: 'A psalm for the dead',
    desc: 'A skeleton-priest is performing the wrong ritual. Interrupt.',
  },
  q25: {
    title: 'Old Strzygoń',
    desc: 'Boss of the Barrows. An old matter. Older than your grandmother.',
  },
  q27: {
    title: 'Treant in the heart',
    desc: 'Not living. Not dead. Standing. Something has to be done.',
  },
  q29: {
    title: 'A mist that remembers',
    desc: 'A mist-spectre is searching for someone. It must not find you.',
  },
  q30: {
    title: 'Maiden Hazelwood',
    desc: 'Heart of the Forest. The forest decides who returns. Decide faster.',
  },
  q31: {
    title: "Drowned-granny's handkerchief",
    desc: 'She lost it. As usual. This time in the reeds. You know where to look.',
  },
  q32: {
    title: 'Reeds for thatching',
    desc: 'The inn leaks. Reeds are soft. The toads are unpleasant.',
  },
  q33: {
    title: 'Thorn salve',
    desc: 'The herbalist needs sap from Thornlings. Crawling. Living.',
  },
  q34: {
    title: 'Altar water',
    desc: 'From the black pool by the altar. Do not drink. Do not look.',
  },
  q35: {
    title: 'Saddened Elder Drowned',
    desc: 'Boss of the Shoals. Once a person, now wetness with grievances.',
  },
  q40: {
    title: "Lumberjack's Wraith",
    desc: 'Boss of the Thicket. Was chopping, still chopping, will not stop. Persuade him.',
  },
  q45: {
    title: 'Black Strzyga',
    desc: 'Finale. Gazebo. Altar. Strzyga. One of them does not return.',
  },
  q46: {
    title: 'Mountain wind over the marshes',
    desc: 'The wind brought someone down from the peaks. Or something. Ask Marmot.',
  },
  q47: {
    title: 'Sentinel on the Spire',
    desc: 'Shepherds talk of a stone that walks. Hard to tell if they are joking.',
  },
  q48: {
    title: 'Lady of Flame',
    desc: 'Mid-boss. Heard the mountains were cold. Decided to fix that. Object.',
  },
  q49: {
    title: 'Tracks in the Ice',
    desc: 'Something has tracked you for three days. Stop it before it catches up.',
  },
  q50: {
    title: 'Treasurer of the Abyss',
    desc: 'Final. Mineshaft. Miner lamp. Treasurer counting bones. Yours too.',
  },
});

// ===== Items (keyed by PL name; covers shop catalog + quest loot + boss drops) =====
Object.assign(CONTENT_EN.itemsByName, {
  // Shop catalog
  'Paracetamol+': { name: 'Paracetamol+', desc: 'Heals 30 HP. Strawberry flavour.' },
  'Mikstura Buraka': { name: 'Beetroot Brew', desc: 'Heals 80 HP. A bit salty.' },
  'Stary Hełm': { name: 'Old Helm', desc: '+3 DEF. Smells of beer.' },
  'Rdzawy Miecz': { name: 'Rusty Sword', desc: '+5 ATK. Rust included in the price.' },
  'Różdżka Ucznia': { name: "Apprentice's Wand", desc: '+6 MAG. Wooden, but trying.' },
  'Hełm Myśliwego': { name: "Hunter's Helm", desc: '+14 DEF, +3 SPD.' },
  'Buty 7-Milowe': { name: 'Seven-League Boots', desc: '+8 SPD. Six leagues? Discounted!' },
  'Skórzany Napierśnik': { name: 'Leather Cuirass', desc: '+12 DEF. Rustles a bit.' },
  'Mikstura Wojownika': { name: "Warrior's Brew", desc: 'Heals 180 HP. Strengthens in battle.' },
  'Miecz Świtu': { name: 'Sword of Dawn', desc: '+22 ATK. Sunrise sheathed.' },
  'Orb Świtu': { name: 'Orb of Dawn', desc: '+25 MAG. Warm in the morning.' },
  'Pierścień Lotu': { name: 'Ring of Flight', desc: '+5 SPD, +5 MAG. Light as thought.' },
  'Amulet Katakumb': { name: 'Amulet of Catacombs', desc: '+10 MAG. Echo from the depths.' },
  'Topór Bezgłowy': { name: 'Headless Axe', desc: '+24 ATK. No head, no problem.' },
  'Kostur Bezgłowy': { name: 'Headless Staff', desc: '+28 MAG. Sometimes mutters to itself.' },
  'Peleryna Cienia': { name: 'Cloak of Shadow', desc: '+15 DEF, +4 SPD. Blink and it is gone.' },
  'Kostur Chaosu': { name: 'Staff of Chaos', desc: '+35 MAG. Emits bad vibes.' },
  'Korona Nieumarłych': { name: 'Crown of the Undead', desc: '+18 DEF, +10 MAG. The crown is inherited.' },
  'Ostrze Tronu': { name: 'Throne Blade', desc: '+40 ATK. For the worthy. And the rich.' },
  'Berło Tronu': { name: 'Throne Sceptre', desc: '+48 MAG. Renders verdicts before you think them.' },
  'Mikstura Puszczańska': { name: 'Forest Brew', desc: 'Heals 320 HP. Smells of moss.' },
  'Rękawice Strażnika': { name: "Guard's Gloves", desc: '+14 DEF, +3 SPD. Grey, functional.' },
  'Buty Borowe': { name: 'Forest Boots', desc: '+16 DEF, +6 SPD. Quieter than a doe.' },
  'Miecz Borowy': { name: 'Forest Sword', desc: '+32 ATK. A wood-rune wakes the blade itself.' },
  'Kostur Runowy': { name: 'Runic Staff', desc: '+38 MAG. Remembers every superstition.' },
  'Pierścień Starych Bogów': { name: 'Ring of the Old Gods', desc: '+12 MAG, +6 DEF. It lives. It breathes.' },
  'Kolczuga Watahy': { name: 'Pack Mail', desc: '+28 DEF, +6 ATK. Links forged on antlers.' },
  'Sztylet Mgły': { name: 'Mist Dagger', desc: '+58 ATK. Vanishes when you need it.' },
  'Kostur Starszej': {
    name: "Crone's Staff",
    desc: '+68 MAG. Speaks with the voice of the unmentionable grandmother.',
  },
  'Mikstura Bagienna': { name: 'Marsh Brew', desc: 'Heals 420 HP. Mud-thickened — intent counts.' },
  'Kiścień Łowcy': { name: "Hunter's Flail", desc: '+52 ATK. Short haft, long memory.' },
  'Fujarka Pasterza': {
    name: "Shepherd's Pipe",
    desc: '+58 MAG. The shepherd died, the sheep wandered off.',
  },
  'Pancerz Trzcinowy': { name: 'Reed Cuirass', desc: '+32 DEF. It rustles. A lot.' },
  'Rękawice Błotne': { name: 'Mud Gloves', desc: '+22 DEF, +4 ATK. Sticky on a handshake.' },
  'Amulet Grzybiarki': {
    name: "Mushroom-picker's Amulet",
    desc: '+18 MAG, +8 DEF. Known for good harvests.',
  },
  'Buty Smolne': { name: 'Tar Boots', desc: '+26 DEF, +4 SPD. They drip in the doorway. Stay barefoot.' },
  'Wielka Mikstura Czarna': {
    name: 'Great Black Brew',
    desc: 'Heals 900 HP + 240 MP. Do not ask what is in it.',
  },
  'Eliksir Wysokogórski': {
    name: 'High-Mountain Elixir',
    desc: 'Heals 1200 HP + 320 MP. Tastes only of mountain wind.',
  },
  'Buty Halnego': {
    name: 'Mountain-Wind Boots',
    desc: '+34 DEF, +6 SPD. Holds on ice. The shepherd apologised.',
  },
  'Rękawice Pasterza': {
    name: "Shepherd's Gloves",
    desc: '+30 DEF, +12 ATK. Wool from the sheep that vanished.',
  },
  'Eliksir Borowy': { name: 'Forest Elixir', desc: 'Heals 300 HP + 80 MP. Smells of resin.' },
  'Wywar Końca Puszczy': {
    name: "Forest's End Decoction",
    desc: 'Heals 500 HP. Made from whatever was left.',
  },
  'Eliksir Żył Grubych': {
    name: 'Thick-Veined Elixir',
    desc: '+25% max HP for 12 hours. A surge of vigour.',
  },
  'Eliksir Krwi Smoka': {
    name: "Dragon's Blood Elixir",
    desc: '+50% max HP for 12 hours. The dragon never showed up.',
  },
  'Wywar Trzewi Strzygi': {
    name: "Strzyga's Entrails Brew",
    desc: '+100% max HP for 6 hours. Negligible aftertaste.',
  },
  'Mikstura Głębokiej Many': {
    name: 'Deep-Mana Brew',
    desc: '+25% max MP for 12 hours. Smells of pickles.',
  },
  'Eliksir Magii Starszej': {
    name: 'Elder Magic Elixir',
    desc: '+50% max MP for 12 hours. Give the bottle to grandmother.',
  },
  'Olej Bojowy': { name: 'Battle Oil', desc: '+15 ATK for 6 hours. Muscle grease.' },
  'Żar Bitewny': { name: 'Battle Embers', desc: '+30 ATK for 6 hours. Hellfire in the veins.' },
  'Tarczowy Smar': { name: 'Shield Grease', desc: '+12 DEF for 12 hours. Sticky — as intended.' },
  'Mur Żelazny': { name: 'Iron Wall', desc: '+25 DEF for 12 hours. Movement gets harder.' },
  'Eliksir Płomienia': { name: 'Flame Elixir', desc: '+18 MAG for 6 hours. Warms the gut.' },
  'Wywar Prędki': { name: 'Swift Decoction', desc: '+8 SPD for 12 hours. The legs carry themselves.' },

  // Quest loot — Łatwe
  'Mikstura HP': { name: 'HP Potion', desc: 'Heals a bit of HP.' },
  'Stary Sztylet': { name: 'Old Dagger', desc: 'Blunt, but yours.' },
  'Szmaciany Kapelusz': { name: 'Rag Hat', desc: 'Better than nothing.' },
  'Zgrzebne Rękawice': { name: 'Coarse Gloves', desc: 'A bit scratchy.' },
  'Kamyk Szczęścia': { name: 'Lucky Pebble', desc: 'Carry it. Maybe it works.' },

  // Quest loot — Średnie
  'Żelazny Miecz': { name: 'Iron Sword', desc: 'Solid work.' },
  'Różdżka Świtu': { name: 'Wand of Dawn', desc: 'Sparkles at sunrise.' },
  'Mikstura Dużego HP': { name: 'Greater HP Potion', desc: 'Heals a lot of HP.' },
  'Obrączka Leśnika': { name: "Forester's Band", desc: 'You hear animals better.' },
  'Hełm Stróża': { name: "Watchman's Helm", desc: 'Sobriety guaranteed.' },

  // Quest loot — Trudne
  'Topór Łowcy Szczurów': { name: 'Rat-Hunter Axe', desc: 'The rats are afraid.' },
  'Kostur Echa': { name: 'Echo Staff', desc: 'Never replies right away.' },
  'Amulet Gryzonia': { name: 'Rodent Amulet', desc: 'Rustles at night.' },
  'Pierścień Wymowy': { name: 'Ring of Eloquence', desc: 'Adds charisma.' },
  'Buty Kowalowej': { name: "Smith's Wife's Boots", desc: 'Warm, comfortable, magical.' },
  'Naramiennik Mgły': { name: 'Mist Pauldron', desc: 'Dissolves in the rain.' },

  // Quest loot — Ekstr.
  'Miecz Serniczarza': { name: 'Cheesecake-Wright Sword', desc: 'Smells of cheese.' },
  'Kostur z Pustki': {
    name: 'Staff from the Void',
    desc: 'Holds itself up. Whispers your name.',
  },
  'Korona Ciastkowa': { name: 'Pastry Crown', desc: 'Crispy.' },
  'Pierścień Ojca Tadeusza': {
    name: 'Father Tadeusz’s Ring',
    desc: 'Holy. A bit greasy.',
  },

  // Quest loot — Boss
  'Korona Goblina': { name: 'Goblin Crown', desc: 'Reeks. But it shines.' },
  'Łańcuch Koronny': { name: 'Crown Chain', desc: "From the Hobgoblin King's throne." },

  // Boss unique drops — q5/q10/q15
  'Łup Wodza': { name: "Chief's Plunder", desc: 'With a rooster sheathed in.' },
  'Sztylet Wodza': { name: "Chief's Dagger", desc: 'Quieter than the rooster.' },
  'Kostur Wodza': { name: "Chief's Staff", desc: 'Whispers “cock-a-doodle-doo”.' },
  'Maczuga Trolla': { name: 'Troll Club', desc: 'Smells of bridge. And of troll.' },
  'Sztylet Mglisty': {
    name: 'Misty Dagger',
    desc: 'The blade fades when no one is looking.',
  },
  'Kosa Trolla': { name: "Troll's Scythe", desc: 'Gathers mist from the pond.' },
  'Dwa Sztylety Króla': {
    name: "King's Twin Daggers",
    desc: 'One for the heart, one for the crown.',
  },
  'Berło Hobgoblina': {
    name: 'Hobgoblin Sceptre',
    desc: 'Speaks with the voice of the fallen king.',
  },

  // q20/q25/q30
  'Kieł Matecznika': {
    name: 'Den-Mother Fang',
    desc: 'A wolf fang in the hilt. Bites mid-stride.',
  },
  'Szpony Księżyca': {
    name: 'Moon Claws',
    desc: 'Bright at full moon. Hungry at new moon.',
  },
  'Kostur Watahy': {
    name: 'Pack Staff',
    desc: 'Howls at the moon. No matter the hour.',
  },
  'Gnat Strzygonia': {
    name: 'Strzygoń Femur',
    desc: "Thigh-bone of a father he never met.",
  },
  'Sztylet Kurhanny': {
    name: 'Barrow Dagger',
    desc: 'Cuts without asking questions.',
  },
  'Czaszka Lisza': {
    name: 'Lich Skull',
    desc: 'Whispers names you do not know. Yet.',
  },
  'Topór Leszczynny': {
    name: 'Hazelwood Axe',
    desc: 'Wood grows back. The blade does not.',
  },
  'Szpony Liści': {
    name: 'Leaf Claws',
    desc: 'They rustle before the strike. Not after.',
  },
  'Berło Puszczy': {
    name: 'Forest Sceptre',
    desc: "Speaks with the Crone's voice. When it pleases.",
  },

  // q35/q40/q45
  'Kiścień Topielca': {
    name: 'Drowned Flail',
    desc: 'A head on a chain. It splashes quietly.',
  },
  'Nóż Rybaka': {
    name: "Fisherman's Knife",
    desc: 'Fish scale in the hilt. Catch and do not look.',
  },
  'Laska Drifująca': {
    name: 'Drifting Cane',
    desc: 'The twigs hang loose. They tangle on their own.',
  },
  'Topór Nawiedzony': {
    name: 'Haunted Axe',
    desc: 'Chops on its own. Sometimes at midnight.',
  },
  'Siekierka Cieśli': {
    name: "Carpenter's Hatchet",
    desc: 'It once had an owner. It still does.',
  },
  'Kostur Sękaty': {
    name: 'Knotted Staff',
    desc: 'Forked like the road to hell.',
  },
  'Szabla Strzygi': {
    name: "Strzyga's Sabre",
    desc: 'Cuts shadow. Cuts silence. Cuts everything.',
  },
  'Szpony Strzygi': {
    name: "Strzyga's Claws",
    desc: 'Four blades. Four sins. Choose.',
  },
  'Ossuarium Strzygi': {
    name: "Strzyga's Ossuary",
    desc: 'The skull speaks names. You hear yours.',
  },

  // q48/q50
  'Topór Płomienny': {
    name: 'Flame Axe',
    desc: 'It asks for measure. It measures itself.',
  },
  'Sztylety Płomienne': {
    name: 'Flame Daggers',
    desc: 'Two cuts. The first carves, the second finishes.',
  },
  'Berło Pani Ognia': {
    name: 'Sceptre of the Lady of Flame',
    desc: 'Remembers every spark. Returns each one.',
  },
  'Topór Halnego Wodza': {
    name: 'Mountain-Lord Axe',
    desc: 'It cuts the wind. The wind cuts you back.',
  },
  'Łuk Mroźnej Iglicy': {
    name: 'Frost-Spire Bow',
    desc: 'Fires only once. A second time is unnecessary.',
  },
  'Berło Skarbnika': {
    name: "Treasurer's Sceptre",
    desc: 'Counts bones. Yours too. Patiently.',
  },

  // ===== Dungeon-boss drops, Chapter 1 (Baltazar / Kosciej / Peaks) =====
  'Kirys Szczurołapa': {
    name: 'Rat-Catcher Cuirass',
    desc: 'Thick hide. Bites are inevitable.',
  },
  'Szata Kanalarza': {
    name: "Sewerman's Robe",
    desc: 'Absorbs damp and curses.',
  },
  'Płaszcz z Futer': {
    name: 'Pelt Cloak',
    desc: 'Chewed up. Warm. Watchful.',
  },
  'Zęby Koscieja': {
    name: "Bone-Wight's Teeth",
    desc: 'Still bite. Nervously.',
  },
  'Czaszka Maga': {
    name: 'Mage Skull',
    desc: 'Mutters in its sleep. Quietly advises.',
  },
  'Kość Palca': {
    name: 'Finger Bone',
    desc: 'Still points the way. Downward.',
  },
  'Tarcza z Grani': {
    name: 'Ridge Shield',
    desc: 'Weighs as much as a mountain. Stops as much.',
  },
  'Orb Pustkowia': {
    name: 'Orb of the Wastes',
    desc: 'Answers questions you never asked.',
  },
  'Drugi Sztylet': {
    name: 'Second Dagger',
    desc: 'Needed when the first one loses its edge.',
  },

  // ===== Dungeon-boss drops, Chapter 2 (Wolf / Strzygon / Leszczyna) =====
  'Łapy Matecznika': {
    name: 'Den-Mother Paws',
    desc: 'The claws grow into bone. Yours.',
  },
  // (Szpony Księżyca already present from quest loot — skip)
  'Pazury Watahy': {
    name: 'Pack Claws',
    desc: 'Dull only after striking bone. Not skin.',
  },
  'Pierścień Grobowy': {
    name: 'Grave Ring',
    desc: 'Takes warmth. Gives strength.',
  },
  'Sygnet Upiora': {
    name: 'Wraith Signet',
    desc: 'Whispers to summon the previous owner.',
  },
  'Obrączka Cienia': {
    name: 'Shadow Band',
    desc: 'Not there when you look at it directly.',
  },
  'Hełm Puszczy': {
    name: 'Forest Helm',
    desc: 'The antler sticks out. You get used to it.',
  },
  'Wieniec Starszej': {
    name: "Crone's Wreath",
    desc: 'Living leaves. They bow at dawn.',
  },
  'Maska Liści': {
    name: 'Leaf Mask',
    desc: 'Hides the face. Hides the intent.',
  },

  // ===== Chapter 3 (Bagna) — DB-only mob/shop drops =====
  'Żelazny Hufnal': {
    name: 'Iron Spike Nail',
    desc: 'Someone pulled it out of someone. Better not ask.',
  },
  'Trzcinowa Fujarka': {
    name: 'Reed Pipe',
    desc: 'Off-key on purpose. Mosquitoes hate it.',
  },
  'Pancerz z Sieci Bagiennej': {
    name: 'Marsh-Web Cuirass',
    desc: 'Wet after the rain — and without it.',
  },
  'Rękawice Topielca': {
    name: "Drowned-Man's Gloves",
    desc: 'Sticky. You get used to it.',
  },
  'Pierścień Mglistych Przysiąg': {
    name: 'Ring of Misty Vows',
    desc: 'You know it’s a mistake. You wear it anyway.',
  },
  'Mikstura Czarnego Zaufania': {
    name: 'Black-Trust Brew',
    desc: 'Tastes of pond scum. Does the job.',
  },
  'Głownia Upiora': {
    name: 'Wraith Blade',
    desc: 'Cuts the shadow before the body.',
  },
  'Runoryt Czarnej Wody': {
    name: 'Black-Water Runestone',
    desc: 'Reads runes from the mud. Some you can decipher.',
  },
  'Amulet Strzygoński': {
    name: 'Strzyga Amulet',
    desc: 'It hangs. It does not sleep.',
  },

  // Bagna boss drops — boots
  'Buciory Topielca': {
    name: 'Drowned Boots',
    desc: 'They squelch sentimentally.',
  },
  'Kalosze Kąpielowe': {
    name: 'Bathing Galoshes',
    desc: "Don't leak — the water is already inside.",
  },
  'Lekkie Brodzaki': {
    name: 'Light Wading Boots',
    desc: 'Quieter than memory. Drier than not.',
  },
  'Onuce Drwala': {
    name: "Lumberjack's Footwraps",
    desc: 'Smell of resin. And of something else.',
  },
  'Mokasyny Pniaka': {
    name: 'Stump Moccasins',
    desc: 'Roots into the ground. Your knee gives.',
  },
  'Chodaki Kikutowe': {
    name: 'Stumpfoot Clogs',
    desc: 'Step separately. Not always together.',
  },
  'Okucia Strzygi': {
    name: 'Strzyga Greaves',
    desc: 'Metal heavier than memory. Never lost.',
  },
  'Sandały Obrzędu': {
    name: 'Ritual Sandals',
    desc: 'Ash beneath the feet. You do this on purpose.',
  },
  'Mokradła Nocne': {
    name: 'Nightmire Boots',
    desc: 'Leave no trace. Leave a story.',
  },

  // ===== Chapter 4 (Granie) — DB-only items =====
  'Mróźny Topór Halnego': {
    name: 'Frostwind Axe',
    desc: 'It cuts the wind. The wind notices.',
  },
  'Berło Iglicy Skalnej': {
    name: 'Stone-Spire Sceptre',
    desc: 'Carved from a soaring spire. Still cold.',
  },
  'Płaszcz z Pumy Halnej': {
    name: "Mountain Puma's Cloak",
    desc: 'The puma vanished into the wind. The cloak stayed.',
  },
  'Hełm Skarbnika': {
    name: "Treasurer's Helm",
    desc: 'The miner-lamp still smoulders. Quietly.',
  },
  'Pierścień Mroźnej Iglicy': {
    name: 'Frost-Spire Ring',
    desc: 'The finger freezes. The spells — not necessarily.',
  },
  'Eliksir Halnego Wiatru': {
    name: 'Mountain-Wind Elixir',
    desc: 'Tastes sour. The effect is surprising.',
  },
  'Berło Ognistej Pani': {
    name: 'Sceptre of the Lady of Flame',
    desc: 'Burns even in the high wind. Ungrateful.',
  },
  'Sztylet Łowczyni Granii': {
    name: "Ridge-Huntress' Dagger",
    desc: 'One cut. A second is unnecessary.',
  },
  'Amulet Smoka Halnego': {
    name: 'Mountain-Dragon Amulet',
    desc: 'The dragon is long gone. The amulet does not know.',
  },

  // Final stragglers — DB-only items not yet covered above
  'Szczurzy Ząb': {
    name: 'Rat Tooth',
    desc: 'Little collectible value. Magic — surprising.',
  },
  'Ostra Drzazga': {
    name: 'Sharp Splinter',
    desc: 'Pointy. That has to be enough.',
  },
  'Mikstura Pierwsza Lepsza': {
    name: 'First-Best Potion',
    desc: 'Heals a little. Or not at all.',
  },
  'Mikstura Mocna HP': {
    name: 'Strong HP Potion',
    desc: 'Puts you back on your feet. Literally.',
  },
  'Mikstura Średniego HP': {
    name: 'Medium HP Potion',
    desc: 'Works. Taste — negligible.',
  },
  'Płócienne Rękawice': {
    name: 'Linen Gloves',
    desc: 'More for warmth than defence.',
  },
  'Obszarpana Czapka': {
    name: 'Tattered Cap',
    desc: 'Once woollen. Once.',
  },
  'Sztylet Imp-a': {
    name: 'Imp Dagger',
    desc: 'Bites with fire.',
  },
  'Sztylet Mrocznego Slime-a': {
    name: 'Dark Slime Dagger',
    desc: 'Sticky and effective.',
  },
  'Sztylet Smoczy': {
    name: 'Dragon Dagger',
    desc: 'From the scale. From the maw. From the collection.',
  },
  'Topór Minotaura': {
    name: 'Minotaur Axe',
    desc: 'Heavy. But so are you.',
  },
  'Miecz Ducha': {
    name: 'Spectre Sword',
    desc: 'It glimmers faintly through.',
  },
  'Goblinka Tarcza': {
    name: 'Goblin Shield',
    desc: 'Painted with a little rooster.',
  },
  'Kolczuga Kowalowej': {
    name: "Smith's Wife Hauberk",
    desc: 'The smith made it. His wife refined it.',
  },
  'Buty Pająka': {
    name: 'Spider Boots',
    desc: 'You walk on walls. Briefly.',
  },
  'Buty Kurhanne': {
    name: 'Barrow Boots',
    desc: 'They tread quieter than mist.',
  },
  'Peleryna Kata': {
    name: "Hangman's Cloak",
    desc: 'It swirls theatrically.',
  },
  'Płaszcz Cienia': {
    name: 'Shadow Cloak',
    desc: 'Quiet as a thought.',
  },
  'Pierścień Hobgoblin Kinga': {
    name: 'Hobgoblin King Ring',
    desc: 'The King wears it. And you, today.',
  },
  'Pierścień Puszczański': {
    name: 'Wildwood Ring',
    desc: 'A green flicker inside. Alive.',
  },
  'Pierścień Szeptu': {
    name: 'Whisper Ring',
    desc: 'You always know what others are saying.',
  },
  'Pierścień Widma': {
    name: 'Spectre Ring',
    desc: 'Your finger glimmers through.',
  },
  'Amulet Szamana': {
    name: 'Shaman Amulet',
    desc: 'It knows which hand to greet with.',
  },
  'Różdżka Pączka': {
    name: 'Doughnut Wand',
    desc: 'Smells of pastry. Works.',
  },
  'Różdżka Szamana': {
    name: 'Shaman Wand',
    desc: 'Glows in the evening.',
  },
  'Kostur Szpiega': {
    name: 'Spy Staff',
    desc: 'Whispers what others are thinking.',
  },
  'Kostur Mrocznego Sabatu': {
    name: 'Dark Sabbath Staff',
    desc: 'Hums under a full moon.',
  },
  'Orb Impowej Igraszki': {
    name: 'Impish Trinket Orb',
    desc: 'Plays dice with itself.',
  },
  'Berło Pustki': {
    name: 'Sceptre of the Void',
    desc: 'It drinks the light around it.',
  },
  'Obsydianowa Korona': {
    name: 'Obsidian Crown',
    desc: 'Heavy as duty.',
  },
  'Diadem Tronowy': {
    name: 'Throne Diadem',
    desc: 'Centre jewel — eye of the Void. Looks back.',
  },
  'Kostur Tronowy': {
    name: 'Throne Staff',
    desc: 'It pronounces sentences for you.',
  },
  'Topór Tronowy': {
    name: 'Throne Axe',
    desc: 'It recognises crowned heads.',
  },
  // Daily-chest contents (generic flavor)
  'Eliksir Średniotygodniowy': {
    name: 'Mid-Week Elixir',
    desc: 'From the daily chest. Have fun.',
  },
  'Eliksir Trzeciotygodniowy': {
    name: 'Third-Week Elixir',
    desc: 'From the daily chest. Have fun.',
  },
  'Mikstura Czwartotygodniowa': {
    name: 'Fourth-Week Potion',
    desc: 'From the daily chest. Have fun.',
  },
  'Mikstura Zielona': {
    name: 'Green Potion',
    desc: 'From the daily chest. Have fun.',
  },
  'Korona Tygodnia': {
    name: 'Crown of the Week',
    desc: 'From the daily chest. Have fun.',
  },
  'Korona Miesiąca': {
    name: 'Crown of the Month',
    desc: 'From the daily chest. Have fun.',
  },
  'Pakiet Niespodzianka': {
    name: 'Surprise Bundle',
    desc: 'From the daily chest. Have fun.',
  },
});

// ===== Companions =====
Object.assign(CONTENT_EN.companions, {
  zofia: { name: 'Bearded Zofia', trait: '+5 ATK in dungeons' },
  cichobieg: { name: 'Quietfoot', trait: '+12% rare-loot chance' },
  olaf: { name: 'Old Olaf', trait: '+8 MAG, potions heal +20%' },
  'gretka-rzepnica': { name: 'Gretka of Rzepnica', trait: '+9 ATK, +4% rare loot' },
  'mnich-blazej': { name: 'Brother Blaise', trait: 'Potions heal +40%, +4 MAG' },
  'wilk-balwan': { name: 'Wolf the Snowman', trait: '+20% rare loot, +5 ATK' },
  'matka-zosia': { name: 'Mother Zosia', trait: '+14 MAG, potions heal +50%' },
  'klemens-topor': { name: 'Clement Axe', trait: '+12 ATK, +5% rare loot' },
  'sieroszka-bezimienna': { name: 'Nameless Orphan', trait: '+25% rare loot, +8 ATK' },
  'eustachy-mnich': { name: 'Eustace the Drunken Monk', trait: '+18 MAG, potions heal +55%' },
  'hetman-wojciech': { name: 'Hetman Wojciech', trait: '+22 ATK, +8% rare loot' },
  'halina-cichodusza': { name: 'Halina Quietsoul', trait: '+30% rare loot, +13 ATK' },
  'wiedzma-praska': { name: 'Old Witch of Praga', trait: '+27 MAG, potions heal +65%' },
  'tytus-niezlomny': { name: 'Titus the Unbroken', trait: '+33 ATK, +12% rare loot' },
});

// ===== Mounts =====
Object.assign(CONTENT_EN.mounts, {
  'mount-kucyk': {
    name: 'Bogdan the Pony',
    desc: 'Old, but goes steady. Never asks where to.',
  },
  'mount-szkapa': {
    name: 'Casimir the Nag',
    desc: 'Nervous. Fast. Has an opinion on every topic.',
  },
  'mount-ogier': { name: 'War Stallion', desc: 'Bites. Kicks. Delivers.' },
  'mount-marchewka': {
    name: 'Carrot the Mare',
    desc: 'Likes carrots. And other things. Once ate a smith — his fault.',
  },
  'mount-diabelska': {
    name: 'Devil Mare',
    desc: 'Red eyes. Cold muzzle. Does not ask where — she knows.',
  },
  'mount-mara': {
    name: 'Winged Nightmare',
    desc: 'No wings, actually. The name stuck. Still gets there fastest.',
  },
});

// ===== Raid bosses =====
Object.assign(CONTENT_EN.raidBosses, {
  'szczur-wielki': {
    name: 'Greater Rat',
    flavor: 'Grew up. Has ambitions. Bites for a long time.',
  },
  'kucharz-z-kanalow': {
    name: 'Sewer Cook',
    flavor: 'Cooks. Dumplings. Out of someone.',
  },
  'wojewoda-goblinow': {
    name: 'Goblin Voivode',
    flavor: 'Has a plan. Always has a plan.',
  },
  'topielec-starszy': { name: 'Elder Drowned', flavor: 'Green. Wet. Hungry.' },
  'lich-podgrodzia': {
    name: 'Lich of the Lower Town',
    flavor: 'Bone-bound opportunist. Prefers summer to winter.',
  },
});

// ===== Guild buildings =====
Object.assign(CONTENT_EN.guildBuildings, {
  fortress: { name: 'Fortress' },
  altar: { name: 'Altar' },
  vault: { name: 'Vault' },
});

// ===== Blessings (Brother Pantaleon offers) =====
Object.assign(CONTENT_EN.blessings, {
  'b-hp': {
    name: 'Blessing of Vitality',
    desc: '+10% max HP for 1 hour.',
  },
  'b-mp': {
    name: 'Blessing of Mana',
    desc: '+10% max MP for 1 hour.',
  },
  'b-atk': {
    name: 'Blessing of the Blade',
    desc: '+8 ATK for 1 hour.',
  },
  'b-def': {
    name: 'Blessing of the Shield',
    desc: '+8 DEF for 1 hour.',
  },
  'b-mag': {
    name: 'Blessing of the Spark',
    desc: '+10 MAG for 1 hour.',
  },
  'b-spd': {
    name: 'Blessing of Swiftness',
    desc: '+5 SPD for 1 hour.',
  },
});

// ===== Curses (witch lifts these) =====
Object.assign(CONTENT_EN.curses, {
  'curse-weakness': {
    name: 'Curse of Weakness',
    desc: 'Your sword feels twice as heavy. -5 ATK.',
  },
  'curse-fragility': {
    name: 'Curse of Fragility',
    desc: 'Your armour holds together on word of honour. -5 DEF.',
  },
  'curse-impotence': {
    name: 'Curse of Impotence',
    desc: 'Spells just won’t hold. -6 MAG.',
  },
  'curse-sluggish': {
    name: 'Curse of Sluggishness',
    desc: 'Your legs turn to lead. -3 SPD.',
  },
  'curse-anguish': {
    name: 'Curse of Anguish',
    desc: 'Wounds refuse to heal properly. -10% max HP.',
  },
  'curse-empty-head': {
    name: 'Curse of an Empty Head',
    desc: 'Memory like a sieve. -15% max MP.',
  },
});

// ===== Achievements =====
Object.assign(CONTENT_EN.achievements, {
  // Combat
  first_blood: { name: 'First Blood', desc: 'Defeat your first monster. No pressure.' },
  slayer_10: { name: 'Warm Blades', desc: 'Defeat 10 monsters.' },
  slayer_100: { name: 'Slayer', desc: 'Defeat 100 monsters. Morning after morning.' },
  slayer_1000: { name: 'Butcher', desc: '1000 monsters. Nobody is counting. Except you.' },
  slayer_5000: { name: 'Depopulator', desc: '5000 monsters. Someone had to.' },
  slayer_10000: { name: 'Mass Depopulator', desc: '10,000 monsters. Anyone still counting?' },
  first_boss: { name: 'Eyes Bigger Than Stomach', desc: 'Defeat your first boss.' },
  boss_trio: { name: 'Slayer of Kings', desc: 'Defeat all three bosses of the region.' },
  boss_trio_forest: { name: 'Forest Cleansed', desc: 'Defeat all three bosses of the Shadow Wood.' },
  boss_trio_swamp: { name: 'Swamps Cleared', desc: 'Defeat all three bosses of the Black Strzyga Marshes.' },
  boss_duo_mountains: { name: 'Crags Conquered', desc: 'Defeat both bosses of the Soaring Spire Crags.' },
  arena_first_win: { name: 'First Blood (Arena)', desc: 'Win your first duel. The crowd reacted with silence.' },
  arena_wins_10: { name: 'Duellist', desc: 'Win 10 duels.' },
  arena_wins_50: { name: 'Master of Duels', desc: 'Win 50 duels in the arena.' },
  arena_wins_200: { name: 'Lord of the Arena', desc: 'Win 200 duels. Nobody even congratulated you.' },
  arena_streak_5: { name: 'Five in a Row', desc: '5 wins in a row. Without catching breath.' },
  arena_streak_10: { name: 'Ten in a Row', desc: '10 wins in a row. Bed empty for a third week.' },
  arena_top_100: { name: 'First Hundred', desc: 'Break into the arena’s TOP 100.' },
  guild_war_declared: { name: 'Paper Warrior', desc: 'Declare your first guild war. Hand on the shield.' },
  guild_war_first_win: { name: 'First War Won', desc: 'Win your first guild war. The banner stays.' },
  guild_war_wins_10: { name: 'War Regular', desc: 'Win 10 guild wars. The chronicler signs off.' },
  guild_raid_first_hit: { name: 'First Strike', desc: 'Hit a raid boss. Someone wrote it in a diary.' },
  guild_raid_killblow: { name: 'Boss Slayer', desc: 'Land the killing blow on a raid boss. The chronicler records it.' },
  guild_raid_kills_5: { name: 'Spectre Hunter', desc: '5 raid bosses fell to your guild. They don’t count, but they know.' },
  guild_raid_kills_25: { name: 'Spectre Plague', desc: '25 raid bosses down. Rewards keep growing.' },
  // Loot
  first_rare: { name: 'Trinket', desc: 'Find your first rare item.' },
  first_epic: { name: 'Epic Finder', desc: 'Find your first epic item.' },
  first_legendary: { name: 'Legend', desc: 'Find your first legendary item.' },
  legendary_collector: { name: 'Collector', desc: 'Gather 5 legendary items.' },
  legendary_collector_25: { name: 'Legendary Treasurer', desc: 'Gather 25 legendary items. The pack tightens.' },
  // Progression
  level_5: { name: 'Recruit', desc: 'Reach LVL 5.' },
  level_10: { name: 'Veteran', desc: 'Reach LVL 10.' },
  level_15: { name: 'Hero', desc: 'Reach LVL 15.' },
  level_25: { name: 'Guild Legend', desc: 'Reach LVL 25.' },
  level_50: { name: 'Guild Master', desc: 'Reach LVL 50.' },
  level_75: { name: 'Statue in the Square', desc: 'Reach LVL 75.' },
  level_100: { name: 'The Hundred', desc: 'Reach LVL 100. The elders say: "We knew someone like that once."' },
  level_125: { name: 'Borderlander', desc: 'Reach LVL 125. The crags look down. You look up.' },
  chapter_1: { name: 'Cellars Cleared', desc: 'Defeat Baltazar the Rat King.' },
  chapter_2: { name: 'Catacombs Cleared', desc: 'Defeat Kościej the Elder.' },
  chapter_3: { name: 'Lord of the Crags', desc: 'Defeat the Lord of the Peaks.' },
  chapter_4: { name: 'Wolf’s Sleep', desc: 'Defeat the Werewolf of the Den. The moon went about its business.' },
  chapter_5: { name: 'Barrow Sealed', desc: 'Defeat Strzygoń of the Old Folk. Grandfather isn’t coming back.' },
  chapter_6: { name: 'The Forest Breathes', desc: 'Defeat Lady Hazel. The wood finally blinks.' },
  chapter_7: { name: 'Drowners Quieted', desc: 'Defeat the Sorrowful Drowner Elder. The waters fall silent again.' },
  chapter_8: { name: 'Woodsman Calmed', desc: 'Defeat the Woodsman Wraith. The axe lies still.' },
  chapter_9: { name: 'No Strzyga Returns', desc: 'Defeat the Black Strzyga. But you’ll be back — with mud on your boots.' },
  chapter_10: { name: 'Lady Silenced', desc: 'Defeat the Fire Lady. The mountain wind has hushed.' },
  chapter_11: { name: 'The Treasurer Counts On', desc: 'Defeat the Treasurer of the Abyss. The shaft remembers. So do you.' },
  all_dungeons: { name: 'Full Map', desc: 'Clear all 9 dungeons. Nothing left to see, sir.' },
  // Economy
  first_quest: { name: 'First Step', desc: 'Complete your first quest.' },
  quest_50: { name: 'Crown Courier', desc: 'Complete 50 quests.' },
  quest_100: { name: 'Regular Courier', desc: 'Complete 100 quests. The innkeep knows your order.' },
  quest_250: { name: 'Legendary Postman', desc: 'Complete 250 quests. Nobody remembers how it started.' },
  first_shop_buy: { name: 'Jacek’s Customer', desc: 'Buy something at the shop.' },
  shop_buy_50: { name: 'Regular', desc: 'Buy 50 items at the shop.' },
  trainer_10: { name: 'Patient Pupil', desc: 'Buy 10 stat points from the Trainer.' },
  trainer_50: { name: 'Diligent Pupil', desc: 'Buy 50 stat points from the Trainer. The Trainer knows how many.' },
  first_mount: { name: 'Third on the Road', desc: 'Rent your first mount.' },
  daily_7: { name: 'A Week of Discipline', desc: 'Maintain a 7-day daily streak.' },
  daily_30: { name: 'A Month of Discipline', desc: 'Maintain a 30-day daily streak.' },
  guild_first_create: { name: 'Founder', desc: 'Found a guild. The seal is set.' },
  guild_first_join: { name: 'First Guild', desc: 'Join a guild. A hopeful recruit.' },
  guild_officer_rank: { name: 'Officer’s Sash', desc: 'Become a guild officer. Find some recruits.' },
  guild_leader_rank: { name: 'Guild Chieftain', desc: 'Become a guild leader. Someone has to give the orders.' },
  guild_chat_chatty_100: { name: 'Chatterbox', desc: '100 messages in guild chat. The folk had a good talk.' },
});
