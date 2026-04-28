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

## Architektura — short

- `apps/web/` — Vite + React 18 + TS, Capacitor wrapper dla Androida
- `apps/server/` — Fastify + tRPC + Drizzle + Postgres, server-authoritative
- `packages/shared/` — Zod schemas + types współdzielone przez web+server

Reszta — patrz [`CLAUDE.md`](CLAUDE.md) i [`docs/`](docs/).
