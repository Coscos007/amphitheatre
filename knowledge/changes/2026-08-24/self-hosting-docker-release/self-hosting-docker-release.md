---
type: Change
title: Self-hosting guide, single Docker image, hostname env vars, and release automation
description: Human-readable README and self-hosting guide, deploy/ standalone Compose stack (Caddy or Traefik), single production Docker image (API + web), PUBLIC_*_HOSTNAME env vars, CHANGELOG.md, and a tag-triggered GitHub Actions release publishing multi-arch images to Docker Hub.
tags: [docker, ci, docs, deploy, release]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T09:00:00Z }
sources:
  - id: dockerfile
    resource: Dockerfile
    title: Single production image
  - id: deploy
    resource: deploy/docker-compose.yml
    title: Standalone self-hosting stack
  - id: traefik
    resource: deploy/docker-compose.traefik.yml
    title: Traefik example
  - id: selfhosting
    resource: docs/self-hosting.md
    title: Self-hosting guide
  - id: readme
    resource: README.md
    title: Human-readable README
  - id: env
    resource: apps/api/src/env.ts
    title: PUBLIC_*_HOSTNAME derivation
  - id: app
    resource: apps/api/src/app.ts
    title: Serves the built web app
  - id: changelog
    resource: CHANGELOG.md
    title: Keep a Changelog
  - id: workflow
    resource: .github/workflows/release.yml
    title: Release workflow
  - id: rule
    resource: /rules/changelog-and-release-process.md
    title: CHANGELOG and release process
---

# What landed

- `Dockerfile`: multi-stage build producing a single production image (`apps/api` + the built `apps/web` SPA) that runs as one container on one port. Uses `pnpm deploy --legacy` to produce a self-contained, production-only `@coliseum/api` directory, then a slim `oven/bun` runtime stage. Verified locally with `docker build` + `docker run` (health check, static SPA serving, and the `/api/*` JSON 404 contract all confirmed working).
- `apps/api/src/app.ts`: serves `apps/api/public` (the built SPA) when present, with an SPA fallback to `index.html` for unknown non-API paths, while `/api`, `/webhooks`, and `/health` keep returning JSON 404 for unmatched routes. No-op in local dev (`apps/api/public` does not exist; Vite serves the SPA instead).
- `apps/api/src/env.ts`: new optional `PUBLIC_APP_HOSTNAME` / `PUBLIC_LIVEKIT_HOSTNAME` / `PUBLIC_OME_HOSTNAME` variables. When set, they derive `CORS_ORIGIN`, `LIVEKIT_URL`, `OME_RTMP_URL`, `OME_PLAYBACK_URL`, and `OME_LLHLS_PLAYBACK_BASE`. Any explicit variable still wins over the derived value — fully backward compatible.
- `deploy/`: a self-contained Docker Compose stack (`docker-compose.yml`, `livekit.yaml`, `env.example`, `ome/origin_conf/`, `reverse-proxy/Caddyfile`) that pulls the published `simstosh/amphitheatre` image — no repo clone or build required to self-host. `deploy/docker-compose.traefik.yml` is a second, standalone compose file for people who run Traefik instead of Caddy: HTTP-only ports (app 3001, LiveKit 7880, OME 3333/3334) are not published on the host in that file, only reachable through Traefik's internal Docker network; raw WebRTC/RTMP media ports stay published directly, since no HTTP reverse proxy can carry that traffic.
- `docs/self-hosting.md`: plain-language guide for non-developers (what the three services are for, DNS, `.env`, Caddy vs Traefik, ports table, updating, backups, building your own image).
- `README.md` rewritten in accessible language, directly answering whether you need to clone the repo, a single Compose file, or `docker run` (short version: `deploy/` + Docker Hub image for using it; full clone + `pnpm`/`Bun` only for developing it).
- `CHANGELOG.md` (new, root): [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format, English, with a `[0.1.0]` baseline entry summarizing the pre-existing bootstrap and an `[Unreleased]` section for this change.
- `.github/workflows/release.yml`: pushing a `vX.Y.Z` tag creates the GitHub Release (body extracted from `CHANGELOG.md` via `scripts/extract-changelog.sh`, always English) and builds/pushes a multi-arch (`linux/amd64` + `linux/arm64`) image to Docker Hub (`simstosh/amphitheatre`) tagged `vX.Y.Z`, `X.Y`, and `latest`. Needs `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` repository secrets (not configured by this change).
- `AGENTS.md`: "How to record a change" now also requires a `CHANGELOG.md` bullet; new "Releases" section documents the manual tag flow.
- New rule [CHANGELOG and release process](/rules/changelog-and-release-process.md).
- `docs/configuration.md`, `docs/getting-started.md`, `infra/README.md`, root `docker-compose.yml`, `.env.example`, and `apps/api/.env.example` updated to mention `deploy/`, `docs/self-hosting.md`, and the new `PUBLIC_*_HOSTNAME` variables.

## Follow-up: promote command and multi-arch build fix (same day)

- `scripts/extract-changelog.sh promote <version> [date] [file]`: renames `## [Unreleased]` into a dated `## [X.Y.Z] - YYYY-MM-DD` section, leaves a fresh empty `[Unreleased]` above it, and refreshes the `[Unreleased]`/`[X.Y.Z]` compare/release links at the bottom of the file. `AGENTS.md` and the `changelog-and-release-process` rule now reference this command for release step 1.
- `Dockerfile`: the first real `v1.0.0` release attempt failed in CI — `pnpm install` crashed with `qemu: uncaught target signal 4 (Illegal instruction)` while cross-building `linux/arm64` on the `amd64` GitHub Actions runner. Fixed by pinning the `deps`/`build` stages to `--platform=$BUILDPLATFORM` (they only produce architecture-neutral JS/CSS output); only the final `oven/bun` runtime stage stays on the real target platform. Verified locally with a `linux/amd64` + `linux/arm64` `docker buildx build` (both platforms share a single native `deps`/`build` execution, no emulation).
- `CHANGELOG.md`'s `[Unreleased]` was promoted to `[1.0.0] - 2026-08-24` (via the new `promote` command) and `package.json`'s version bumped to `1.0.0` to cut the project's first tagged release.

# Why

The user asked to make the project easier to run for people who are not developers (clear README, no forced repo clone, Traefik example, hostname-driven config), to ship official Docker Hub images automatically on release, and to adopt a Keep a Changelog + tag-triggered release process (matching the pattern used in `nixartz/yaoe-flow`'s `AGENTS.md`).

# Deferred / not done in this change

- No GitHub secrets (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`) were configured — that has to happen in the repository's GitHub settings.
- No tag was pushed and no release was created; this change only wires the mechanism.
- No general CI (typecheck/test on every PR) was added — out of scope for this request.

# Related

- [CHANGELOG and release process](/rules/changelog-and-release-process.md)
- [Pin Compose images](/rules/pin-compose-images.md)
- [OME independent of WebRTC](/rules/ome-independent-of-webrtc.md)
- [API contract frozen](/rules/api-contract-frozen.md)
