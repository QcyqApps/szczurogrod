# =====================================================
# Szczurogród server — production Docker image.
#
# Build context musi być repo root (workspace pnpm + shared package).
#   docker build -f apps/server/Dockerfile -t grodno-server .
# Albo via docker-compose (build.context: ., build.dockerfile: apps/server/Dockerfile).
#
# Strategia: tsx w runtime (server importuje raw .ts z @grodno/shared, więc
# nie ma sensu kompilować dist'em który by tego nie rozwiązał). tsx jest w
# prod deps, używamy go zamiast `node dist/`.
# =====================================================

# ---- Stage 1: install + typecheck ----
# Pełny obraz (nie -slim) bo argon2 ma native bindings które potrzebują
# python+make jeśli precompile binary nie pasuje do platformy.
FROM node:22-bookworm AS builder
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

# Layer cache: lockfile + manifesty zmieniają się rzadko.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile

# Source — typecheck gwarantuje że obraz nie ruszy z broken kodem.
COPY packages/shared packages/shared
COPY apps/server apps/server

RUN pnpm --filter @grodno/server typecheck

# ---- Stage 2: production runtime ----
# -slim ~80MB mniejszy. Argon2 native już skompilowany w stage 1, kopiujemy
# binarki z node_modules.
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Tini = minimalny init, sygnały SIGTERM/SIGINT propagują się czysto do
# Node'a. Bez tego docker stop wysyła SIGKILL po 10s (graceful shutdown
# nie zdąży).
RUN apt-get update && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*

# Non-root user dla security baseline.
RUN groupadd -r app && useradd -r -g app app

COPY --from=builder --chown=app:app /repo/node_modules /app/node_modules
COPY --from=builder --chown=app:app /repo/apps/server /app/apps/server
COPY --from=builder --chown=app:app /repo/apps/server/node_modules /app/apps/server/node_modules
COPY --from=builder --chown=app:app /repo/packages/shared /app/packages/shared
COPY --from=builder --chown=app:app /repo/package.json /repo/pnpm-workspace.yaml /repo/pnpm-lock.yaml /app/

USER app
WORKDIR /app/apps/server

EXPOSE 4000

# Entrypoint przez tini (PID 1). Migracje + start serwera. Pnpm nie jest w
# runtime image — wołamy tsx bezpośrednio z node_modules/.bin (pnpm workspace
# stawia tam symlinki per-package).
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "-c", "node_modules/.bin/tsx src/db/migrate.ts && node_modules/.bin/tsx src/index.ts"]
