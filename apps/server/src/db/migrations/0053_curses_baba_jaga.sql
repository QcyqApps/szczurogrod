-- Dodajemy is_curse do character_buffs żeby móc mieć jednocześnie pozytywny
-- buff i negatywną klątwę na tej samej statystyce (np. +8 ATK blessing +
-- -5 ATK klątwa). Poszerzamy PK o is_curse, inaczej ON CONFLICT by nadpisywał.
-- Kolejność: 1) dodaj kolumnę (default false, więc istniejące wiersze dostają
-- false), 2) wymień PK. Inaczej swap PK odwołuje się do nieistniejącej kolumny.

ALTER TABLE "character_buffs" ADD COLUMN "is_curse" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "character_buffs" DROP CONSTRAINT "character_buffs_character_id_kind_pk";--> statement-breakpoint
ALTER TABLE "character_buffs" ADD CONSTRAINT "character_buffs_character_id_kind_is_curse_pk" PRIMARY KEY("character_id","kind","is_curse");
