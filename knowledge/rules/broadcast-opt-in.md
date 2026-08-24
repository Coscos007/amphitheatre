---
type: Rule
title: Broadcast opt-in
description: Shared stage off by default. OME stream key is roomId plus a secret. Twitch/YouTube/Kick/https embeds are owner/admin options.
tags: [broadcast, ome, obs, contract]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T04:30:00Z }
sources:
  - id: rooms
    resource: apps/api/src/rooms.ts
    title: setBroadcast and stream_key
  - id: path
    resource: packages/shared/src/paths.ts
    title: PATCH /api/rooms/:id/stream
  - id: product
    resource: /product/ome-broadcast/ome-broadcast.md
    title: OME broadcast
---

# Rule

The **broadcast** stage (OME or embed) starts **off**. Voice, camera, screen, and chat do not depend on it.

Owner/admin turns it on and chooses the provider in `PATCH /api/rooms/:id/stream`:

- `ome` — OBS ingest on OvenMediaEngine
- `twitch` / `youtube` / `kick` — channel/video embed
- `custom` — https embed URL

The OME stream key is `{roomId}-{secret}`. **Do not** use `roomId` alone (8 public chars). Someone who only has the room code cannot publish from OBS. Ingest (`ome.ingest`) is only for owner/admin and only with `ome` on.

The OME REST poll and the player only run when `broadcast.enabled` and the provider is `ome`. Embeds do not require OME.

Twitch/YouTube/Kick/custom iframes **wait for the stage box** before mounting, remount on persisted `pageshow` (bfcache), and have a reload control. YouTube: page `origin`; no `sandbox` (it breaks the embed on SPA navigation). Custom https may stay more restricted if the code requires it.

# Related

- [OME independent of WebRTC](/rules/ome-independent-of-webrtc.md)
- [OME broadcast](/product/ome-broadcast/ome-broadcast.md)
- [API contract frozen](/rules/api-contract-frozen.md)
