-- Przecena elixirów buff'ujących. `seedIfEmpty` używa onConflictDoNothing
-- dla shop_listings, więc TS-owy bump ceny nie propaguje do już zasianej DB.
-- Ta migracja bezpośrednio updateuje wiersze po listing id.
--
-- Stare ceny były kalibrowane „na oko" i okazały się zdecydowanie za niskie
-- vs quest gold income w danym paśmie LVL (250g za +25% HP na 12h ≈ 1 quest
-- przy L6 — auto-buy, brak wyboru ekonomicznego). Nowe ceny ~3-4× questy
-- w danym tier'ze, żeby buff'y były wyborem, nie no-brainerem.

UPDATE "shop_listings" SET price = 800  WHERE id = 's-buff-hp25';
UPDATE "shop_listings" SET price = 6000 WHERE id = 's-buff-hp50';
UPDATE "shop_listings" SET price = 40   WHERE id = 's-buff-hp100';
UPDATE "shop_listings" SET price = 1000 WHERE id = 's-buff-mp25';
UPDATE "shop_listings" SET price = 8000 WHERE id = 's-buff-mp50';
UPDATE "shop_listings" SET price = 700  WHERE id = 's-buff-atk15';
UPDATE "shop_listings" SET price = 4500 WHERE id = 's-buff-atk30';
UPDATE "shop_listings" SET price = 1200 WHERE id = 's-buff-def12';
UPDATE "shop_listings" SET price = 5500 WHERE id = 's-buff-def25';
UPDATE "shop_listings" SET price = 1400 WHERE id = 's-buff-mag18';
UPDATE "shop_listings" SET price = 900  WHERE id = 's-buff-spd8';
