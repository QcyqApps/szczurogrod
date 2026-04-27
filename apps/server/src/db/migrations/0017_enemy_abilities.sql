-- Umiejętności mobów: jsonb tablica obiektów opisujących procowe mechaniki
-- walki. Każdy obiekt ma `kind` i kind-specyficzne pola (patrz `EnemyAbility`
-- union w game/combat.ts). Domyślnie `[]` — zwykłe moby walczą dalej jak
-- dotąd. Seed poniżej flavour'uje roster: casterzy rzucają magię ignorującą
-- połowę DEF gracza, insekty/demony zatruwają DOT'em, bossowie zawsze
-- przebijają pancerz. Pattern jak 0008/0013/0016 — UPDATE po slug'ach.
ALTER TABLE "enemy_templates" ADD COLUMN "abilities" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint

-- Casterzy: magic attack, 40% chance per swing, ignoruje 50% DEF gracza.
UPDATE "enemy_templates"
SET "abilities" = '[{"kind":"magic","chance":0.40}]'::jsonb
WHERE slug IN ('goblin-shaman', 'wraith');--> statement-breakpoint

-- Insekty/demony: poison proc, 30% per hit, DOT 4 dmg/turę przez 3 tury.
-- Re-proc odświeża licznik (nie stackuje).
UPDATE "enemy_templates"
SET "abilities" = '[{"kind":"poison","chance":0.30,"dmgPerTurn":4,"turns":3}]'::jsonb
WHERE slug IN ('cave-spider', 'demon-imp');--> statement-breakpoint

-- Bossowie: armor pierce zawsze aktywny (chance=1). Sens: boss rangi "big
-- bad" robi dmg niezależnie od ekwipunku tanka. 50% redukcji DEF — ten sam
-- stosunek co player magic vs mob DEF, symetryczny balans.
UPDATE "enemy_templates"
SET "abilities" = '[{"kind":"armor_pierce","chance":1.0}]'::jsonb
WHERE slug IN ('hobgoblin-king', 'bone-dragon', 'void-horror');
