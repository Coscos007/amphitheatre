# HTTP / WebSocket API

This is the frozen contract. Types and paths: `packages/shared`. Do not change paths or payloads without updating `packages/shared`, this file, `apps/api`, `apps/web`, and [api-contract-frozen](../knowledge/rules/api-contract-frozen.md) in the same change.

Base `/api`, JSON. Cookie `ct_session` + Bearer `token`.

Vite proxies only `/api` (including WebSocket). The LiveKit webhook hits `:3001` directly (`host.docker.internal`).

## Routes

- `POST /api/session` `{ displayName }` → `{ userId, displayName, token }`
- `GET /api/session`
- `POST /api/rooms` `{ name, password?, memberLimit?, isPublic? }`
- `GET /api/rooms` (public rooms only)
- `GET /api/rooms/:id`
- `POST /api/rooms/:id/join` `{ password? }`
- `POST /api/rooms/:id/leave`
- `POST /api/rooms/:id/kick|mute|ban|unban|roles`
- `GET /api/rooms/:id/livekit-token`
- `GET /api/rooms/:id/media` (includes `broadcast`)
- `PATCH /api/rooms/:id/stream` `{ enabled, provider?, embed?, rotateKey? }` (owner/admin)
- `PATCH /api/rooms/:id/chat` `{ floodBanSec: 60 | 120 }` (owner/admin)
- `GET /health`
- WebSocket `GET /api/rooms/:id/ws?token=`
- Webhook `POST /webhooks/livekit` (HMAC of the LiveKit keys; not proxied by Vite)

Create body is `{ name, password?, memberLimit?, isPublic? }` — not `maxUsers` or media toggles.

## Events

To the client: `chat`, `presence`, `speaking`, `transmitting`, `quality`, `ome`, `broadcast`, `moderation`, `system`.

From the client: `chat.send`, `presence.update`.

## Errors and media

- Failed private join: `cannot_join` (does not distinguish “missing room” from “wrong password”).
- Wrong password on a public room: `invalid_password`.
- Lockout: `locked_out` + `retryAfterMs`.
- Room full: `room_full` (409).
- Rate limit: `429` + `retryAfterMs`.

`GET /api/rooms/:id/media` returns `ome.reachable=false` when the OME process did not respond. The SPA must not show a broadcast banner only because env has a URL. The `broadcast` field describes whether the shared stage is on and which provider (`ome` | `twitch` | `youtube` | `kick` | `custom`).

`PATCH /api/rooms/:id/stream` (owner/admin) enables or disables the stage. The OME stream key is `{roomId}-{secret}`, never the public room id alone.

`PATCH /api/rooms/:id/chat` (owner/admin): `{ floodBanSec: 60 | 120 }` — duration of the flood soft-ban. Chat: 1–1024 characters. A burst of 6 messages / 8 s emits `system` `chat_slow` with `retryAfterMs`. `Room.chatFloodBanSec` is part of the room JSON.

There is no `POST /webhooks/ome/admission` route. Do not document it as implemented.

The k6 script in `infra/loadtest/k6/api-rooms.js` still calls `POST /rooms` and `maxUsers`. That is a known gap, not the contract. When you touch load tests, align k6 **to** this contract — not the other way around.
