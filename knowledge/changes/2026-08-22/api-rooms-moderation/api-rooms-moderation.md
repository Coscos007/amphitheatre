---
type: Change
title: API rooms + moderation
description: Hono on Bun with SQLite, guest JWT, lockout, persistent roles, WS, and LiveKit webhook.
tags: [bootstrap, api, hono, sqlite]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: routes
    resource: apps/api/src/routes.ts
    title: HTTP and WS routes
  - id: db
    resource: apps/api/src/db.ts
    title: SQLite schema
  - id: rooms
    resource: apps/api/src/rooms.ts
    title: RoomService
  - id: tests
    resource: apps/api/tests/owner-persistence.test.ts
    title: Persistence tests
---

# What landed

`apps/api` (`bun run --hot src/index.ts`, port 3001):

- JWT session + `ct_session` cookie
- SQLite WAL: `rooms`, `memberships`, `bans`, `lockouts`
- Room CRUD, join/leave, kick/mute/ban/unban/roles
- LiveKit mint, `GET /api/rooms/:id/media` (never 5xx when OME is down)
- WS hub: chat, presence, speaking, transmitting, quality, ome, moderation, system
- `POST /webhooks/livekit`
- In-memory rate limit; 3/5 min lockout persisted
- `stream_key = roomId`; immutable owner; 15s WS grace

Bun tests: `lockout.test.ts`, `roles.test.ts`, `owner-persistence.test.ts` (including a new process on the same file), `ome.test.ts`.

# Files

- `apps/api/src/{index,app,routes,env,db,rooms,session,lockout,rate-limit,hub,livekit,ome,schemas,http-error,ids,ip,logger,clock}.ts`
- `apps/api/tests/{helpers,lockout,roles,owner-persistence,ome}.test.ts`
- `apps/api/.env.example`

# Why

The plan assumed Redis as state; the implemented decision is SQLite so **admin stays admin** after restart. OME is decoupled on the REST client.

# Links

- [Identity and roles](/product/identity-and-roles/identity-and-roles.md)
- [Moderation](/product/moderation/moderation.md)
- [Safety limits](/product/safety-limits/safety-limits.md)
- [Owner admin is persistent](/rules/owner-admin-is-persistent.md)
- [Password lockout 3 strikes 5 min](/rules/password-lockout-3-strikes-5-min.md)
- [API contract frozen](/rules/api-contract-frozen.md)

[^routes]: HTTP and WS routes
[^db]: SQLite schema
[^rooms]: RoomService
[^tests]: Persistence tests
