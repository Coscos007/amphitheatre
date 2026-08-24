---
type: Rule
title: Reconnect last priority
description: Reconnect is the last priority. Use LiveKit SDK defaults and WS grace; do not invent a protocol.
tags: [priority, livekit, websocket]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: hub
    resource: apps/api/src/hub.ts
    title: WS_GRACE_MS scheduleLeave
  - id: livekit-client
    resource: apps/web/src/hooks/use-livekit.ts
    title: SDK room.connect
  - id: product
    resource: /product/livekit-media/livekit-media.md
    title: LiveKit media
---

# Rule

Do not design a custom reconnect protocol (resume tokens, extra state sync, “automatic rejoin” beyond what already exists).

What already covers the basic case:

- Session JWT (`ct_session` / Bearer) survives a page refresh
- Owner re-enters without a password; other members with membership use the existing join flow
- Hub WS: `WS_GRACE_MS` (default 15000) before `markLeft` after a socket drop[^hub]
- LiveKit: default reconnect of `livekit-client` in `room.connect`[^livekit-client]
- LiveKit server: `departure_timeout: 20`, congestion control / TCP fallback in the YAML

If reconnect fails in a bug report, record it and fix the existing path. Do not open a “reconnect protocol” workstream unless the user asks **explicitly** and this rule is updated.

# Related

- [Owner admin is persistent](/rules/owner-admin-is-persistent.md)
- [LiveKit media](/product/livekit-media/livekit-media.md)

[^hub]: WS_GRACE_MS scheduleLeave
[^livekit-client]: SDK room.connect
