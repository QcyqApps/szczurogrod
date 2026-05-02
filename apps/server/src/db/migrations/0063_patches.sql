-- Patch log — lista wersji/changelog'ów wystawiana graczom.
--
-- Polling co kilka minut z klienta wykrywa nowy wpis (porównanie najwyższego
-- ID z localStorage `lastSeenPatchId`) i pokazuje banner „Pojawiła się
-- aktualizacja — odśwież". Pisanie do tabeli: skrypt `scripts/add-patch.ts`
-- z lokalnego shellu (PROD_DATABASE_URL env). Brak edycji w UI gry.

CREATE TABLE patches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version varchar(64) NOT NULL,
  title varchar(255) NOT NULL,
  body text NOT NULL,
  released_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX patches_released_idx ON patches (released_at DESC);
