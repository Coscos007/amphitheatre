# Amphitheatre — single image with the API (Hono/Bun) and the built web app.
#
# The API serves the compiled SPA directly (apps/api/src/app.ts), so the
# whole product runs as ONE container on ONE port. LiveKit and (optionally)
# OvenMediaEngine still run as separate containers/services — see
# docs/self-hosting.md and deploy/docker-compose.yml.
#
# Build:  docker build -t amphitheatre .
# Run:    docker run -p 3001:3001 -v amphitheatre-data:/app/data amphitheatre

# ---- deps: install the full pnpm workspace (needed to build the web app) ----
#
# --platform=$BUILDPLATFORM pins these JS-only build stages to the runner's
# native architecture even when cross-building for another target (e.g.
# building linux/arm64 on an amd64 GitHub Actions runner). Node/pnpm running
# under QEMU user-mode emulation can crash ("illegal instruction") during
# install/build; nothing here produces architecture-specific output, so
# there is no correctness downside. Only the final `runtime` stage below
# stays pinned to the real $TARGETPLATFORM.
FROM --platform=$BUILDPLATFORM node:22-alpine AS deps
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

# ---- build: compile the SPA and produce a self-contained API package ----
FROM deps AS build
COPY . .
RUN pnpm --filter @coliseum/web build
RUN pnpm --filter @coliseum/api deploy --prod --legacy /out/api

# ---- runtime: Bun only, no Node/pnpm, no dev dependencies ----
FROM oven/bun:1.2-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out/api ./
COPY --from=build /repo/apps/web/dist ./public
EXPOSE 3001
VOLUME ["/app/data"]
CMD ["bun", "run", "src/index.ts"]
