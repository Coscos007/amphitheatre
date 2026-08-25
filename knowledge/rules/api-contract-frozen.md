---
type: Rule
title: API contract frozen
description: Paths, JSON, and WS events are the contract in packages/shared and docs/api.md. Do not change them without updating all three.
tags: [api, contract, shared]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: paths
    resource: packages/shared/src/paths.ts
    title: apiPaths
  - id: api-docs
    resource: docs/api.md
    title: HTTP / WebSocket API
  - id: routes
    resource: apps/api/src/routes.ts
    title: Hono routes
  - id: k6
    resource: infra/loadtest/k6/api-rooms.js
    title: k6 still outdated vs /api
  - id: admin
    resource: docs/operator-admin.md
    title: Operator /api/admin namespace
---

# Schema

Base `/api`, JSON. Cookie `ct_session` + Bearer `token`. WS: `GET /api/rooms/:id/ws?token=`.

| Method | Path |
|---|---|
| POST | `/api/session` |
| GET | `/api/session` |
| POST | `/api/rooms` |
| GET | `/api/rooms` |
| GET | `/api/rooms/:id` |
| POST | `/api/rooms/:id/join` |
| POST | `/api/rooms/:id/leave` |
| POST | `/api/rooms/:id/kick` |
| POST | `/api/rooms/:id/mute` |
| POST | `/api/rooms/:id/ban` |
| POST | `/api/rooms/:id/unban` |
| POST | `/api/rooms/:id/roles` |
| GET | `/api/rooms/:id/livekit-token` |
| GET | `/api/rooms/:id/media` |
| PATCH | `/api/rooms/:id/stream` |
| PATCH | `/api/rooms/:id/chat` |
| GET | `/api/rooms/:id/ws` |
| GET | `/health` |
| POST | `/webhooks/livekit` |

Create body: `{ name, password?, memberLimit?, isPublic? }` — **not** `maxUsers` / media toggles in the current JSON.

Failed join of a missing room: `not_found` (404). Wrong or missing password: `invalid_password` (public or private). Lockout: `locked_out` + `retryAfterMs`. Room full: `room_full` (409). The code `cannot_join` remains in `errorCodes` but is not emitted for missing rooms or wrong passwords.

Events to the client: `chat`, `presence`, `speaking`, `transmitting`, `quality`, `ome`, `broadcast`, `moderation`, `system`. From the client: `chat.send`, `presence.update`.

`GET /api/rooms/:id/media` → `ome.reachable?` (optional): `false` if the OME process did not respond; the SPA does not show a broadcast banner just because env has a URL. The `broadcast` field describes whether the shared stage is on and which provider (`ome` | `twitch` | `youtube` | `kick` | `custom`).

`PATCH /api/rooms/:id/stream` (owner/admin): turns the stage on/off. OME stream key is `{roomId}-{secret}`, never the public id alone.

`PATCH /api/rooms/:id/chat` (owner/admin): `{ floodBanSec: 60 | 120 }` — duration of the flood soft-ban. Chat: 1–1024 chars. A burst of 6 messages / 8 s fires `system` `chat_slow` with `retryAfterMs`.

`Room.chatFloodBanSec` is included in the room JSON.

# Rule

Any change to a path, field, or event requires, in the **same** change:

1. `packages/shared`
2. `docs/api.md`
3. `apps/api` and `apps/web`
4. this concept + an OKF change

`infra/loadtest/k6/api-rooms.js` still calls `POST /rooms` and `maxUsers`. That is a **known gap**, not the contract. When touching load tests, align k6 **to** shared, not shared to k6.[^k6]

There is no `POST /webhooks/ome/admission` in the routes. Do not document it as implemented.

`/api/admin/*` is a **new** namespace on `ADMIN_PORT` (cookie `ct_admin`). Do not change guest paths when adding operator routes. Document admin in [docs/operator-admin.md](../../docs/operator-admin.md) and `packages/shared` (`adminPaths`). Guest `docs/api.md` stays the theater contract.

Vite theater proxies only `/api` (including WS) to `:3001`. Operator Vite proxies `/api` to `:3002`. LiveKit webhooks hit `:3001` directly (`host.docker.internal`).

# Related

- [Shared types](/rules/shared-types-in-packages-shared.md)
- [API rooms + moderation](/changes/2026-08-22/api-rooms-moderation/api-rooms-moderation.md)

[^paths]: apiPaths
[^api-docs]: HTTP / WebSocket API
[^routes]: Hono routes
[^k6]: k6 still outdated vs /api
