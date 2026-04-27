-- Kucyk i Ogier dostają własne ikony (`pony`, `warhorse`), żeby trzy tier'y
-- wyglądały różnie w Stajni. Szkapa zostaje na generycznym `horse`. UPDATE
-- idempotentny — jeśli admin w CMS już zmienił ikonę, nie cofamy.
UPDATE "mount_templates" SET "icon" = 'pony'     WHERE "slug" = 'mount-kucyk' AND "icon" = 'horse';--> statement-breakpoint
UPDATE "mount_templates" SET "icon" = 'warhorse' WHERE "slug" = 'mount-ogier' AND "icon" = 'horse';
