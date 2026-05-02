-- Patch log i18n: rename existing title/body → *_pl, add *_en columns,
-- backfill istniejący wpis 0.10.0 z tłumaczeniem EN, set NOT NULL.

ALTER TABLE "patches" RENAME COLUMN "title" TO "title_pl";
ALTER TABLE "patches" RENAME COLUMN "body" TO "body_pl";

ALTER TABLE "patches" ADD COLUMN "title_en" varchar(255);
ALTER TABLE "patches" ADD COLUMN "body_en" text;

UPDATE "patches"
SET "title_en" = 'The Awakened, Discord, and the persistence potion.',
    "body_en" = E'Four changes in one bundle.\n\n**World boss.** A server-wide boss — all players hit it together. 3 attacks per day per character. Each hit triggers FURY: 4 seconds to tap the rat as fast as possible, more taps means more damage. Drop: Echoes, spend them in the boss shop. Matching class to boss phase: +50% damage. The killing blow takes a killer bonus.\n\n**Discord — remember where we hang out.** New Discord achievement (200 gold, 5💎). Open the link, click „claim", honor system.\n\n**Ratburg+.** Subscription for 200💎 → +30 days of +20% XP on every action (quests, combat, daily, work, Oracle, Season, Crumbs). Buy in Settings. Stacks up to 90 days from today.\n\n**Patch log.** What you''re reading. The game now knows when there''s a new version and politely asks you to refresh.'
WHERE "version" = '0.10.0';

ALTER TABLE "patches" ALTER COLUMN "title_en" SET NOT NULL;
ALTER TABLE "patches" ALTER COLUMN "body_en" SET NOT NULL;
