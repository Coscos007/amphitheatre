# AGENTS.md — Amphitheatre

Instructions for any coding agent in this repository. Prose in **English**. Commands, paths, env names, and API identifiers stay **exact**.

Public/root docs (README, CONTRIBUTING, CLA, LICENSE, AGENTS, `docs/*.md` guides, `infra/README.md`) are English. The OKF catalog in `knowledge/` is English. UI copy stays i18n (`en` / `pt-BR` / `es`).

Before implementing: read [knowledge/index.md](knowledge/index.md), then `knowledge/product/` and `knowledge/rules/`. The historical plan in [knowledge/references/plano-watchparty-miniDiscord.md](knowledge/references/plano-watchparty-miniDiscord.md) is **not** the source of truth — several decisions there were superseded by the code (SQLite instead of Redis for rooms, guest JWT without an email account, optional OME). Distinguish **implemented** (code + tests) from **intended** (plan or docs). Do not invent features.

## Product

Amphitheatre is an open-source mini-Discord-style theater: ephemeral rooms with **text chat**, **voice**, **camera**, and **screenshare** (LiveKit), plus an optional **broadcast** stage (OvenMediaEngine + OBS) so everyone watches the same live stream.

It is not a Netflix clone. OME is a generic ingest/playback server. Retransmitting a third-party commercial catalog may conflict with their ToS; the product does not assume that use as a legal or technical requirement.

Session recording is **out of scope**. Sophisticated reconnection is the **last priority**. Mobile layout is **first-class** and **separate** from desktop.

## Monorepo map

```
apps/api          Bun + Hono — REST, WebSocket, JWT, SQLite, LiveKit mint, OME poll
apps/web          Vite + React SPA — desktop theater + its own mobile layout
packages/shared   TS contract: types, roles, paths, events, errors, limits
infra/            Docker Compose (LiveKit, Valkey, OME, Caddy), scripts, k6
docs/             Getting started, configuration, API, identity, broadcast, license, load testing
knowledge/        OKF v0.2 catalog (product, rules, changes) + references/
AGENTS.md         This file
```

pnpm workspace: `pnpm-workspace.yaml` (`apps/*`, `packages/*`). Packages: `@coliseum/api`, `@coliseum/web`, `@coliseum/shared`.

Room, member, role, ban, and lockout state: **SQLite** (`DATABASE_PATH`). Valkey in Compose is **only** for LiveKit (DB 1, hostname `redis`). The API **does not** need it to persist owner/admin.

## How to run

At the repo root:

```bash
pnpm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
make up
# equivalent: docker compose up -d
```

`make up` starts **LiveKit + Valkey**. Voice, camera, screenshare, and chat work **without** OME.

```bash
make ome-up
# equivalent: docker compose --profile ome up -d
```

OME only when there is OBS ingest / an ffmpeg fixture.

```bash
pnpm dev:api    # API on :3001 (Bun --hot)
pnpm dev:web    # Vite on :5173 (proxy /api -> :3001, including WS)
pnpm dev        # both in parallel
```

Checks:

- `GET http://localhost:3001/health` -> `{ "ok": true }`
- `make smoke` — infra health; missing OME is not a LiveKit failure
- SPA: `http://localhost:5173`

The API starts even with OME stopped. Chat, voice, camera, and screenshare **never** require `ome.healthy`.

Stop OME only: `make ome-down`. Stop everything: `make down`.

Human walkthrough: [docs/getting-started.md](docs/getting-started.md).

## Toolchain

| Tool | Use |
|---|---|
| pnpm 10+ (`packageManager`: pnpm@11.22.0) | workspace, Vite |
| Bun 1.2+ | API runtime, `bun test`, native SQLite |
| Node >= 20 | only if Vite/pnpm needs it on the host; the API does not run on Node |
| Docker Compose v2 | LiveKit, Valkey, OME (profile), Caddy (profile) |
| LiveKit server v1.13.5 | voice/camera/screen SFU (`livekit/livekit-server:v1.13.5`) |
| OvenMediaEngine v0.21.0 | RTMP ingest + WebRTC/LL-HLS playback (optional) |
| Valkey 9.1.1 | RESP for LiveKit DB 1 (`valkey/valkey:9.1.1-alpine`; Compose service `redis`) |
| SQLite | source of truth for rooms/roles (Bun `bun:sqlite`) |

Do not add Postgres, Redis/Valkey-as-room-state, LiveKit Egress, or OME File publisher.

## Environment variables

See [docs/configuration.md](docs/configuration.md). Copy `.env.example` (root) and `apps/api/.env.example`. **Do not invent secrets** and **do not commit** `.env`.

The API loads the monorepo root `.env` first, then `apps/api/.env` (`apps/api/src/env.ts`).

LiveKit: `LIVEKIT_API_SECRET` >= 32 chars and **no** `:`. Compose mounts `LIVEKIT_KEYS` as `"key: secret"`.

UDP/TLS ports: `infra/livekit/livekit.yaml`, `infra/ome/origin_conf/Server.xml`, `infra/README.md`.

## Architecture (mandatory)

See [docs/architecture.md](docs/architecture.md) for the diagram and monorepo notes.

**OME is optional and independent.** There is no LiveKit/Valkey `depends_on` for OME. Voice, text, camera, and screenshare **never** require OME. `GET /api/rooms/:id/media` stays HTTP 200 with `ome.healthy=false` if OME is down.

**Broadcast is opt-in** (off by default). Owner/admin enables it via `PATCH /api/rooms/:id/stream` and chooses `ome` | `twitch` | `youtube` | `kick` | `custom`.

Chat: 1–1024 chars. Flood (6 msgs / 8 s) applies a 60 or 120 s soft-ban via `PATCH /api/rooms/:id/chat`. The sender gets `system` `chat_slow`.

**OME stream key = `{roomId}-{secret}`** (not the public room id alone). URLs and OBS: [docs/broadcast.md](docs/broadcast.md).

**Implemented** webhook: `POST /webhooks/livekit` (HMAC of the LiveKit keys; `infra/livekit/livekit.yaml` points at `http://host.docker.internal:3001/webhooks/livekit`). `track_published` / `track_unpublished` update transmitting in the hub.

OME admission webhook (`POST /webhooks/ome/admission`) is **not** in the routes; the block in `Server.xml` stays commented. Do not invent the handler without a request.

HTTP/WS contract: [docs/api.md](docs/api.md) + `packages/shared` (`apiPaths`, types, events). Do not change paths/payloads without updating shared, `docs/api.md`, and [api-contract-frozen](knowledge/rules/api-contract-frozen.md).

## Identity, roles, moderation

See [docs/identity.md](docs/identity.md).

- Guest: `POST /api/session` `{ displayName }` -> `{ userId, displayName, token }`. httpOnly cookie `ct_session` + Bearer `token` in JSON (Vite).
- `userId` is persistent in the JWT. Rejoining the same room with the same `userId` **keeps the role**.
- Room `ownerId` is **immutable**. The creator stays owner (and therefore de-facto admin) after leaving. Nobody is promoted to owner. Owner rejoins without a password.
- Hierarchy: `owner` > `admin` > `moderator` > `member`.
  - moderator: kick and mute (SQLite flag + LiveKit without publishing microphone)
  - admin: kick, mute, ban/unban, grant/revoke `admin` and `moderator` (never touches owner)
  - owner: all of that; does not lose the role
- Ban: cannot rejoin until unban. Separate from password lockout.
- Private rooms: failed join uses `cannot_join` (does not distinguish “does not exist” from “wrong password”). Public rooms appear in `GET /api/rooms`. Public room, wrong password: `invalid_password`.

Details: [identity-and-roles](knowledge/product/identity-and-roles/identity-and-roles.md), [moderation](knowledge/product/moderation/moderation.md), [owner-admin-is-persistent](knowledge/rules/owner-admin-is-persistent.md).

## Rate limit and lockout

Password lockout: **3 failures** (keys `ip:{ip}:{roomId}` and, if a session exists, `user:{userId}:{roomId}`) -> **5 minutes**. Response `locked_out` with `retryAfterMs`. Config: `LOCKOUT_MAX_FAILURES`, `LOCKOUT_DURATION_MS`.

**In-memory** rate limits (per API process): create room, join, chat, token mint, role change. `429` + `retryAfterMs`. Extra caps: rooms per creator/IP (24h window), members per room, concurrent occupied rooms.

Rule: [password-lockout-3-strikes-5-min](knowledge/rules/password-lockout-3-strikes-5-min.md). Product: [safety-limits](knowledge/product/safety-limits/safety-limits.md).

## Out of scope and priorities

- **Recording:** do not implement LiveKit Egress, OME File/DVR/dump, or “record to analyze later”. [no-recording](knowledge/rules/no-recording.md).
- **Reconnect:** LiveKit SDK defaults and WS grace (`WS_GRACE_MS`, default 15s). Do not invent a custom protocol. [reconnect-last-priority](knowledge/rules/reconnect-last-priority.md).
- **Mobile:** `MobileTheaterLayout` separate from `DesktopTheaterLayout` (`useTheaterLayout`). Do not “shrink the desktop”. [mobile-first-class-separate-layout](knowledge/rules/mobile-first-class-separate-layout.md).
- Required indicators: speaking, transmitting (camera/screen), connection quality; adaptive when the transport allows. [presence-indicators-required](knowledge/rules/presence-indicators-required.md).
- UI and docs in this repo: **zero emoji**. Tabler icons (`@tabler/icons-react`) are allowed. [no-emoji-in-ui-or-docs](knowledge/rules/no-emoji-in-ui-or-docs.md).
- i18n: `en`, `pt-BR`, `es`. [i18n-en-pt-es](knowledge/rules/i18n-en-pt-es.md).
- Theme: light/dark CSS tokens (`data-theme`). [design-tokens-light-dark](knowledge/rules/design-tokens-light-dark.md).
- Domain types: `packages/shared`, do not duplicate in api/web. [shared-types-in-packages-shared](knowledge/rules/shared-types-in-packages-shared.md).
- Public docs language: English. [public-docs-english](knowledge/rules/public-docs-english.md).
- License: AGPL-3.0-only + ICLA. [agplv3-and-cla](knowledge/rules/agplv3-and-cla.md).

## OKF catalog (`knowledge/`)

OKF bundle **0.2**. Root: `knowledge/index.md` (`okf_version: "0.2"`). Prose in that tree is English; YAML keys in English.

| Folder | Contents |
|---|---|
| `knowledge/product/` | product vision (macro) |
| `knowledge/rules/` | code/process rules the agent **must** apply |
| `knowledge/changes/` | what actually landed, by date |
| `knowledge/references/` | external/historical material (original plan) |

Every `.md` that is not `index.md` or `log.md` needs YAML frontmatter with non-empty `type`. Links between concepts: **bundle-relative** paths with `/` (example: `[rule](/rules/no-recording.md)`).

**Agents MUST read product + rules before coding.**

When the user states a durable preference, process, or “this feature must work as X”, the agent **MUST** create or update a file in `knowledge/rules/` (or edit the existing one). Never leave that only in chat. See [self-aware-knowledge](knowledge/rules/self-aware-knowledge.md).

### How to record a change

1. Create `knowledge/changes/<yyyy-MM-dd>/<feature>/<feature>.md` with frontmatter `type: Change`, `title`, `description`, `generated`, `sources` pointing at code, and a body: what landed, files, why, links to product + rules.
2. Update `knowledge/changes/<yyyy-MM-dd>/index.md`.
3. If the date is new, update `knowledge/changes/index.md`.
4. Add an entry in `knowledge/log.md` (newest first, heading `YYYY-MM-DD`).
5. If a new product/rule concept is born, create it and point to it from the corresponding `index.md`.

Bootstrap change date: **2026-08-22**.

## Git and PRs

- **Do not commit** unless the user asks.
- **Do not open PRs** unless the user asks. This repo is not a fork of an official upstream; the same discipline applies: PR only when asked.
- Third-party PRs require an ICLA via CLA Assistant (`CLA.md`, `.github/workflows/cla.yml`). The public tree is AGPL-3.0-only (`LICENSE`). See [agplv3-and-cla](knowledge/rules/agplv3-and-cla.md).
- Do not change git config, do not `--force` on main, do not skip hooks.

## Tests

```bash
pnpm test         # bun test in apps/api (lockout, roles, owner-persistence, ome)
pnpm typecheck    # @coliseum/shared + @coliseum/api + @coliseum/web
```

Load and stress: [docs/load-testing.md](docs/load-testing.md). The k6 script in `infra/loadtest/k6/api-rooms.js` still uses old paths (`POST /rooms`); the real contract is `/api/...` in `packages/shared` and [docs/api.md](docs/api.md). When touching load tests, align the script to the frozen contract — not the other way around.

API tests cover: 3 failures -> 5 min lockout; roles; owner/admin persistence after leave/rejoin (including a “new process” on the same SQLite); OME down without taking the API down.
