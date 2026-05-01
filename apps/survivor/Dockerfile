# =====================================================
# Szczurogród: Okruchy — production Docker image.
#
# Mirrors apps/web/Dockerfile. Jeden Fastify backend obsługuje oba frontendy
# (router `survivor.*` mounted w tym samym appRouter), więc to jest tylko
# osobny static bundle z osobną domeną. VITE_API_URL bake'owany w czasie
# build'u tak samo jak w apps/web.
#
# Build:
#   docker build -f apps/survivor/Dockerfile -t grodno-survivor .
#   (build context = repo root)
# =====================================================

# ---- Stage 1: vite build ----
FROM node:22-bookworm AS builder
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY apps/survivor/package.json apps/survivor/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/survivor apps/survivor
# Server tylko po typy `AppRouter` — survivor importuje przez tRPC inference.
COPY apps/server/src apps/server/src
COPY apps/server/tsconfig*.json apps/server/

ARG VITE_API_URL=https://tidle.ovh/grodno
ENV VITE_API_URL=${VITE_API_URL}

RUN pnpm --filter @grodno/survivor build

# ---- Stage 2: nginx static serve ----
FROM nginx:1.27-alpine AS runtime

RUN rm /etc/nginx/conf.d/default.conf
COPY apps/survivor/nginx.conf /etc/nginx/conf.d/grodno-survivor.conf

COPY --from=builder /repo/apps/survivor/dist /usr/share/nginx/html

EXPOSE 80
