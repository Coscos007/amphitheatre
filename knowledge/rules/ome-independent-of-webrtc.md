---
type: Rule
title: OME independent of WebRTC
description: OvenMediaEngine is optional. Voice, text, camera, and screenshare never require a healthy OME.
tags: [architecture, ome, livekit]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: compose
    resource: docker-compose.yml
    title: Compose profiles (isolated ome)
  - id: ome-client
    resource: apps/api/src/ome.ts
    title: OME client with timeout and fallback
  - id: product
    resource: /product/ome-broadcast/ome-broadcast.md
    title: Optional broadcast product
---

# Rule

The `ome` service in Compose has `profiles: ["ome"]` and **does not** enter LiveKit or Valkey `depends_on`. `docker compose up` / `make up` **does not** start OME.[^compose]

Chat, voice, camera, and screenshare use Hono + LiveKit. If OME is stopped, times out, 401, or 404:

- the API stays up
- `GET /api/rooms/:id/media` responds **HTTP 200** with `ome.live=false` (not 5xx)[^ome-client]
- connection refused / timeout: `ome.reachable=false` (OME **is not running** — expected without `make ome-up`)
- REST returned 5xx/401: `ome.reachable=true` and `ome.healthy=false` (OME is up but broken)
- the SPA player **does not** show “Broadcast is offline” just because env has `OME_API_URL`. Banner only if `reachable && !healthy`

Do not couple API startup, join, LiveKit token mint, or the room WebSocket to `ome.healthy`.

`make ome-down` must leave LiveKit/Valkey healthy. Independence test: `make smoke` and [load testing docs](/changes/2026-08-22/load-testing-docs/load-testing-docs.md).

Do not treat a down OME as a “dead room”.

# Related

- [OME broadcast](/product/ome-broadcast/ome-broadcast.md)
- [LiveKit media](/product/livekit-media/livekit-media.md)
- [No recording](/rules/no-recording.md)

[^compose]: Compose profiles (isolated ome)
[^ome-client]: OME client with timeout and fallback
