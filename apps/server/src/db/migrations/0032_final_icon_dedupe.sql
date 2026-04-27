-- Dokończenie dedup'u ikon. Po 0031 zostało 6 kolizji gdzie 2 różne nazwy
-- współdzieliły jedną ikonę tematyczną (np. Szczurzy Ząb i Amulet Gryzonia
-- oba na amulet-rodent). Tutaj rozpinamy każdy przypadek na osobny icon slug.

UPDATE "item_templates" SET "icon" = 'dagger-splinter'  WHERE "name" = 'Ostra Drzazga';
UPDATE "item_templates" SET "icon" = 'sword-rusted'     WHERE "name" = 'Rdzawy Miecz';
UPDATE "item_templates" SET "icon" = 'potion-hp-small'  WHERE "name" = 'Mikstura HP';
UPDATE "item_templates" SET "icon" = 'potion-hp-big'    WHERE "name" = 'Mikstura Dużego HP';
UPDATE "item_templates" SET "icon" = 'dagger-mist-fang' WHERE "name" = 'Sztylet Mglisty';
UPDATE "item_templates" SET "icon" = 'amulet-rat-tooth' WHERE "name" = 'Szczurzy Ząb';
