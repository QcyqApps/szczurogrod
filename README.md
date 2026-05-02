# Szczurogród

Polski idle-RPG, server-authoritative. Web + Android (Capacitor).

## TL;DR

### Dev (lokalnie)

```bash
pnpm install
pnpm db:up           # postgres :5434
pnpm db:migrate      # raz przy fresh DB
pnpm dev             # web :5173 + server :4000 równolegle
```

### Test na fizycznym Androidzie

```bash
# 1. server musi chodzić (`pnpm dev:server`)
# 2. telefon na tej samej WiFi co Mac, USB debugging włączony, kabel z transmisją danych
pnpm android        # auto-wykrywa LAN IP, build, sync, deploy na podpięte urządzenie
```

DevTools z urządzenia: Chrome na Mac'u → `chrome://inspect/#devices`.

### Production stack (server + postgres w Dockerze)

```bash
cp .env.example .env  # wypełnij JWT_SECRET (32+ znaków), CORS_ORIGIN
pnpm stack:up         # builduje image + odpala oba kontenery
pnpm stack:logs       # follow loga
pnpm stack:down       # stop
```

Server wystawiony w sieci `shared-proxy` jako `grodno-server:4000` — nginx siedzący w tej samej sieci proxy'uje.

### Deploy webu (Vite SPA → kontener `grodno-web`)

`vite build` na słabym CPU serwera trwa ~8 minut. Zamiast tego budujemy image
**lokalnie**, transferujemy przez ssh (`docker save | docker load`), serwer tylko
restartuje kontener. Zero buildu na serwerze.

**Wymagania na serwerze (jednorazowo):**

- Repo sklonowane w `$DEPLOY_REMOTE_PATH` (default `/home/ubuntu/szczurogrod`).
- `.env` w katalogu repo — patrz `.env.example`. Dla webu wystarczy że
  `VITE_PAYPAL_CLIENT_ID` ma jakąś wartość (choćby pustą — compose
  parsuje plik nim sprawdzi czy buduje, więc var musi istnieć).
- Reszta stacka uruchomiona (`pnpm stack:up` raz).

**Lokalnie, przed pierwszym deployem:**

```bash
export VITE_PAYPAL_CLIENT_ID=...   # ten sam co w .env serwera, dopisz do ~/.zshrc
```

Defaulty (override przez env, jeśli inny serwer):
- `DEPLOY_SSH_HOST=ovh-tidle` — alias z `~/.ssh/config`.
- `DEPLOY_REMOTE_PATH=/home/ubuntu/szczurogrod` — ścieżka repo na serwerze.
- `VITE_API_URL=https://tidle.ovh/grodno`.

**Każdy deploy:**

```bash
scripts/deploy-web.sh   # ssh poprosi o passphrase, jeśli klucz zaszyfrowany
```

Co robi (4 kroki):

1. `docker compose --profile app build web` — lokalny build Vite + nginx alpine.
2. `docker save szczurogrod-web:latest | gzip` → `~/tmp/grodno-web-XXX.tar.gz`.
3. `ssh ... "gunzip | docker load"` — stream przez ssh, bez tarballa na serwerze.
4. `ssh ... "docker compose up -d --no-build web"` — recreate kontenera z nowym image'em.

Rozmiar tarballa: ~50 MB skompresowany, transfer 30–60 s na typowym łączu.

**Rollback** — `docker images | grep szczurogrod-web` na serwerze pokazuje
poprzednie image'y (compose nie czyści starych). `docker tag <stary-id>
szczurogrod-web:latest && docker compose --profile app up -d --no-build web`
wraca do poprzedniej wersji.

### Build AAB do Google Play

```bash
# raz, na zawsze: wygeneruj signing keystore (BACKUP DO PASS MANAGERA NATYCHMIAST)
pnpm android:keystore

# każdy release:
VITE_API_URL=https://tidle.ovh/grodno pnpm android:release
```

Output:
- AAB do Play Console: `apps/web/android/app/build/outputs/bundle/release/app-release.aab`
- APK do sideload: `apps/web/android/app/build/outputs/apk/release/app-release.apk`

Przed kolejnym release'em bumpuj `versionCode` w `apps/web/android/app/build.gradle:10` (Play odrzuca duplikat).

## Skrypty

| Komenda | Co robi |
|---|---|
| `pnpm dev` | web + server równolegle |
| `pnpm dev:web` / `pnpm dev:server` | jeden workspace |
| `pnpm typecheck` / `pnpm lint` / `pnpm test` | sanity |
| `pnpm db:up` / `db:down` / `db:migrate` / `db:generate` | postgres + migracje |
| `pnpm android` | dev build + deploy na fizyczny telefon |
| `pnpm android:open` | otwórz projekt w Android Studio |
| `pnpm android:keystore` | generuj signing keystore (raz) |
| `pnpm android:release` | signed AAB + APK |
| `pnpm stack:up` / `stack:down` / `stack:logs` | full prod stack w Dockerze |
| `scripts/deploy-web.sh` | build webu lokalnie + transfer ssh + restart na serwerze (omija wolny CPU) |

## Architektura — short

- `apps/web/` — Vite + React 18 + TS, Capacitor wrapper dla Androida
- `apps/server/` — Fastify + tRPC + Drizzle + Postgres, server-authoritative
- `packages/shared/` — Zod schemas + types współdzielone przez web+server

Reszta — patrz [`CLAUDE.md`](CLAUDE.md) i [`docs/`](docs/).
