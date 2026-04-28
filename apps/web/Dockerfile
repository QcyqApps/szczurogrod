# =====================================================
# Szczurogród web — production Docker image.
#
# Build context musi być repo root (workspace pnpm + shared package).
#   docker build -f apps/web/Dockerfile -t grodno-web .
# Albo via docker-compose (build.context: ., build.dockerfile: apps/web/Dockerfile).
#
# Strategia: dwustopniowy build. Stage 1 robi `vite build` i daje gotowy SPA
# w `dist/`. Stage 2 to nginx:alpine który serwuje to jako pliki statyczne
# z try_files fallback'iem dla SPA routingu.
#
# WAŻNE: VITE_API_URL musi być znane w czasie build'u (Vite inline'uje
# import.meta.env.* w bundlu, runtime env vars NIE działają). Default'em
# wskazuje na produkcyjny backend `https://tidle.ovh/grodno` — override przez
# `--build-arg VITE_API_URL=...` jeśli stagingowi/innemu env potrzeba czegoś
# innego.
# =====================================================

# ---- Stage 1: vite build ----
FROM node:22-bookworm AS builder
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

# Layer cache: lockfile + manifesty zmieniają się rzadko.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile

# Source.
COPY packages/shared packages/shared
COPY apps/web apps/web
# Server jest potrzebny tylko dla type re-exportu (`AppRouter`). Kopiujemy żeby
# tsc nie sypał na brakującym package — node_modules ma już symlink z install'a.
COPY apps/server/src apps/server/src
COPY apps/server/tsconfig*.json apps/server/

# VITE_API_URL — bake'owany w bundle. Domyślnie produkcyjny backend.
ARG VITE_API_URL=https://tidle.ovh/grodno
ENV VITE_API_URL=${VITE_API_URL}

RUN pnpm --filter @grodno/web build

# ---- Stage 2: nginx static serve ----
FROM nginx:1.27-alpine AS runtime

# Default nginx config wywalamy — zastępujemy własnym z try_files dla SPA.
RUN rm /etc/nginx/conf.d/default.conf
COPY apps/web/nginx.conf /etc/nginx/conf.d/grodno-web.conf

COPY --from=builder /repo/apps/web/dist /usr/share/nginx/html

EXPOSE 80

# nginx:alpine domyślnie startuje nginx -g "daemon off;" — zostawiamy.
