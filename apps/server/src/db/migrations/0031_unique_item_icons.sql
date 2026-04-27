-- Rozpoznanie duplikatów ikon przedmiotów. Przed tą migracją wiele itemów
-- reusowało generyczne sloty (boots, orb, sword, dagger, ring, potion,
-- chestplate, gloves, necklace) albo dzieliło ikonę tematyczną (crown-throne,
-- ring-flight, ring-wraith, chain-crown, amulet-shaman, amulet-catacombs,
-- dagger-dragon, cuirass-mist, hat-rag, cloak-shadow, orb-dawn, shield-item,
-- helm-hunter).
--
-- Każdy przedmiot dostaje unikalną ikonę. Dopisane w ICON_NAMES + SVG
-- w GameIcon.tsx (~60 nowych ikon).

-- ============ Chapter 3 — T6 pool (swamp items) ============
UPDATE "item_templates" SET "icon" = 'sword-hufnal'     WHERE "name" = 'Żelazny Hufnal';
UPDATE "item_templates" SET "icon" = 'pipe-reed'        WHERE "name" = 'Trzcinowa Fujarka';
UPDATE "item_templates" SET "icon" = 'chestplate-net'   WHERE "name" = 'Pancerz z Sieci Bagiennej';
UPDATE "item_templates" SET "icon" = 'gloves-drowned'   WHERE "name" = 'Rękawice Topielca';
UPDATE "item_templates" SET "icon" = 'ring-mist-oath'   WHERE "name" = 'Pierścień Mglistych Przysiąg';
UPDATE "item_templates" SET "icon" = 'potion-black'     WHERE "name" = 'Mikstura Czarnego Zaufania';
UPDATE "item_templates" SET "icon" = 'blade-wraith'     WHERE "name" = 'Głownia Upiora';
UPDATE "item_templates" SET "icon" = 'staff-runestone'  WHERE "name" = 'Runoryt Czarnej Wody';
UPDATE "item_templates" SET "icon" = 'amulet-strzyga'   WHERE "name" = 'Amulet Strzygoński';

-- ============ Chapter 3 — feet boss drops ============
UPDATE "item_templates" SET "icon" = 'boots-topielec'    WHERE "name" = 'Buciory Topielca';
UPDATE "item_templates" SET "icon" = 'boots-galoshes'    WHERE "name" = 'Kalosze Kąpielowe';
UPDATE "item_templates" SET "icon" = 'boots-waders'      WHERE "name" = 'Lekkie Brodzaki';
UPDATE "item_templates" SET "icon" = 'boots-onuce'       WHERE "name" = 'Onuce Drwala';
UPDATE "item_templates" SET "icon" = 'boots-mossy'       WHERE "name" = 'Mokasyny Pniaka';
UPDATE "item_templates" SET "icon" = 'boots-clogs'       WHERE "name" = 'Chodaki Kikutowe';
UPDATE "item_templates" SET "icon" = 'boots-iron-shod'   WHERE "name" = 'Okucia Strzygi';
UPDATE "item_templates" SET "icon" = 'boots-sandals'     WHERE "name" = 'Sandały Obrzędu';
UPDATE "item_templates" SET "icon" = 'boots-night-marsh' WHERE "name" = 'Mokradła Nocne';

-- ============ R2 (Puszcza) uniques ============
UPDATE "item_templates" SET "icon" = 'sword-bor'        WHERE "name" = 'Miecz Borowy';
UPDATE "item_templates" SET "icon" = 'staff-rune'       WHERE "name" = 'Kostur Runowy';
UPDATE "item_templates" SET "icon" = 'staff-elder'      WHERE "name" = 'Kostur Starszej';
UPDATE "item_templates" SET "icon" = 'staff-pack'       WHERE "name" = 'Kostur Watahy';
UPDATE "item_templates" SET "icon" = 'chestplate-pack'  WHERE "name" = 'Kolczuga Watahy';
UPDATE "item_templates" SET "icon" = 'boots-kurhan'     WHERE "name" = 'Buty Kurhanne';
UPDATE "item_templates" SET "icon" = 'boots-bor'        WHERE "name" = 'Buty Borowe';
UPDATE "item_templates" SET "icon" = 'ring-forest'      WHERE "name" = 'Pierścień Puszczański';
UPDATE "item_templates" SET "icon" = 'dagger-kurhan'    WHERE "name" = 'Sztylet Kurhanny';
UPDATE "item_templates" SET "icon" = 'claws-leaves'     WHERE "name" = 'Szpony Liści';
UPDATE "item_templates" SET "icon" = 'potion-forest'    WHERE "name" = 'Mikstura Puszczańska';
UPDATE "item_templates" SET "icon" = 'sword-fang'       WHERE "name" = 'Kieł Matecznika';
UPDATE "item_templates" SET "icon" = 'sword-bone'       WHERE "name" = 'Gnat Strzygonia';
UPDATE "item_templates" SET "icon" = 'axe-hazel'        WHERE "name" = 'Topór Leszczynny';
UPDATE "item_templates" SET "icon" = 'ring-grave'       WHERE "name" = 'Pierścień Grobowy';
UPDATE "item_templates" SET "icon" = 'ring-old-gods'    WHERE "name" = 'Pierścień Starych Bogów';
UPDATE "item_templates" SET "icon" = 'helm-forest'      WHERE "name" = 'Hełm Puszczy';
UPDATE "item_templates" SET "icon" = 'wreath-elder'     WHERE "name" = 'Wieniec Starszej';
UPDATE "item_templates" SET "icon" = 'mask-leaves'      WHERE "name" = 'Maska Liści';
UPDATE "item_templates" SET "icon" = 'scepter-forest'   WHERE "name" = 'Berło Puszczy';

-- „Szpony Księżyca" pojawia się 2x (jako dagger w T5 pool + jako gloves-rough
-- w dungeon_boss_drops). Rozbijamy po aktualnej ikonie.
UPDATE "item_templates" SET "icon" = 'claws-moon' WHERE "name" = 'Szpony Księżyca' AND "icon" = 'dagger';
UPDATE "item_templates" SET "icon" = 'paw-moon'   WHERE "name" = 'Szpony Księżyca' AND "icon" = 'gloves-rough';

-- ============ R1 / old items ============
UPDATE "item_templates" SET "icon" = 'ring-woodsman'     WHERE "name" = 'Obrączka Leśnika';
UPDATE "item_templates" SET "icon" = 'ring-shadow'       WHERE "name" = 'Obrączka Cienia';
UPDATE "item_templates" SET "icon" = 'ring-signet'       WHERE "name" = 'Sygnet Upiora';
UPDATE "item_templates" SET "icon" = 'shield-peaks'      WHERE "name" = 'Tarcza z Grani';
UPDATE "item_templates" SET "icon" = 'chain-kosciej'     WHERE "name" = 'Zęby Koscieja';
UPDATE "item_templates" SET "icon" = 'bone-finger'       WHERE "name" = 'Kość Palca';
UPDATE "item_templates" SET "icon" = 'skull-mage'        WHERE "name" = 'Czaszka Maga';
UPDATE "item_templates" SET "icon" = 'skull-lich'        WHERE "name" = 'Czaszka Lisza';
UPDATE "item_templates" SET "icon" = 'scepter-hobgoblin' WHERE "name" = 'Berło Hobgoblina';
UPDATE "item_templates" SET "icon" = 'cuirass-rat'       WHERE "name" = 'Kirys Szczurołapa';
UPDATE "item_templates" SET "icon" = 'cloak-sewer'       WHERE "name" = 'Szata Kanalarza';
UPDATE "item_templates" SET "icon" = 'cloak-fur'         WHERE "name" = 'Płaszcz z Futer';
UPDATE "item_templates" SET "icon" = 'orb-waste'         WHERE "name" = 'Orb Pustkowia';
UPDATE "item_templates" SET "icon" = 'dagger-second'     WHERE "name" = 'Drugi Sztylet';
UPDATE "item_templates" SET "icon" = 'gloves-cloth'      WHERE "name" = 'Płócienne Rękawice';
UPDATE "item_templates" SET "icon" = 'gloves-guard'      WHERE "name" = 'Rękawice Strażnika';
UPDATE "item_templates" SET "icon" = 'gloves-matecznik'  WHERE "name" = 'Łapy Matecznika';
UPDATE "item_templates" SET "icon" = 'claws-pack'        WHERE "name" = 'Pazury Watahy';
UPDATE "item_templates" SET "icon" = 'seven-league-boots' WHERE "name" = 'Buty 7-Milowe';
UPDATE "item_templates" SET "icon" = 'chestplate-smith'  WHERE "name" = 'Kolczuga Kowalowej';

-- ============ Reassignments na już-istniejące ikony ============
-- Te itemy miały generyczny slot-icon, ale ICON_NAMES ma już tematyczną —
-- wystarczy wymiana, brak nowych SVG.
UPDATE "item_templates" SET "icon" = 'dagger-old'    WHERE "name" = 'Stary Sztylet';
UPDATE "item_templates" SET "icon" = 'dagger-mist'   WHERE "name" = 'Sztylet Mgły';
UPDATE "item_templates" SET "icon" = 'amulet-rodent' WHERE "name" = 'Szczurzy Ząb';
UPDATE "item_templates" SET "icon" = 'potion-medium' WHERE "name" = 'Mikstura HP';
UPDATE "item_templates" SET "icon" = 'potion-big'    WHERE "name" = 'Mikstura Mocna HP';
UPDATE "item_templates" SET "icon" = 'sword-iron'    WHERE "name" = 'Żelazny Miecz';
