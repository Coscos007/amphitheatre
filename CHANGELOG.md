# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/). Entries here are the macro history, always in English. Full technical detail for each change lives in the OKF catalog under [`knowledge/changes/`](knowledge/changes/).

## [Unreleased]

## [1.0.0] - 2026-08-24

### Added

- Initial monorepo bootstrap: `apps/api` (Hono/Bun), `apps/web` (Vite/React), `packages/shared`, and the Docker Compose infra (LiveKit, Valkey, optional OvenMediaEngine).
- Guest JWT identity (no accounts); persistent room roles (`owner` > `admin` > `moderator` > `member`); immutable room ownership.
- Real-time text chat, voice, camera, and screen share via LiveKit; speaking/transmitting/connection-quality indicators.
- Optional shared broadcast stage (OvenMediaEngine, Twitch, YouTube, Kick, or a custom URL), off by default.
- Moderation: kick, mute, ban/unban; password lockout (3 failures / 5 minutes); chat flood soft-ban.
- Desktop and mobile layouts (mobile is a separate, first-class layout, not a shrunk desktop).
- UI locales `en`, `pt-BR`, `es`; light/dark design tokens.
- AGPL-3.0-only license with an Individual Contributor License Agreement (ICLA).
- OKF v0.2 knowledge catalog under `knowledge/` (product, rules, changes).
- `Dockerfile` building a single production image (API + built web app) served on one port, published to Docker Hub as `simstosh/amphitheatre`.
- `deploy/` folder: a self-contained Docker Compose stack (app, LiveKit, Valkey, optional OvenMediaEngine) that does not require cloning the rest of the repository.
- `PUBLIC_APP_HOSTNAME`, `PUBLIC_LIVEKIT_HOSTNAME`, and `PUBLIC_OME_HOSTNAME` environment variables, which derive `CORS_ORIGIN`, `LIVEKIT_URL`, and the OME playback/ingest URLs automatically for self-hosting with a real domain.
- Traefik example (`deploy/docker-compose.traefik.yml`) alongside the existing Caddy profile, documenting which ports must stay published on the host (raw WebRTC/RTMP media) versus which are only reachable through the reverse proxy.
- [Self-hosting guide](docs/self-hosting.md), written for non-developers running their own instance.
- `.github/workflows/release.yml`: pushing a `vX.Y.Z` tag creates a GitHub Release from this file and publishes a multi-arch (`amd64`/`arm64`) image to Docker Hub.
- This `CHANGELOG.md`, following Keep a Changelog, as the macro-history counterpart to the OKF catalog.

### Changed

- `README.md` rewritten in plain language, answering directly whether you need to clone the repo, use only a Compose file, or a single `docker run` (short answer: it depends on whether you want to use the app or develop it — see the guide).

[Unreleased]: https://github.com/simstm/amphitheatre/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/simstm/amphitheatre/releases/tag/v1.0.0
