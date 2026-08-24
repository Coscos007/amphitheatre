---
type: Product
title: OME broadcast
description: Optional OBS ingest via OvenMediaEngine. Stream key = {roomId}-{secret}. Independent of LiveKit.
tags: [ome, obs, broadcast]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: ome
    resource: apps/api/src/ome.ts
    title: Poll REST streams/{streamKey}
  - id: rooms
    resource: apps/api/src/rooms.ts
    title: stream_key = {roomId}-{secret}; ingest for owner/admin only
  - id: infra
    resource: infra/README.md
    title: Stream key contract
  - id: player
    resource: apps/web/src/hooks/use-ome-player.ts
    title: OvenPlayer WebRTC + LL-HLS
  - id: rule
    resource: /rules/ome-independent-of-webrtc.md
    title: Independence
  - id: abr
    resource: /rules/ome-webrtc-first-abr.md
    title: WebRTC first ABR
---

# Implemented

Compose profile `ome` (`ovenmedialabs/ovenmediaengine:v0.21.0`). `make ome-up` / `make ome-down`.

Broadcast is **opt-in**: `rooms.broadcast_enabled` starts as `0`. Owner/admin enables it via `PATCH /api/rooms/:id/stream` and chooses `ome` or an embed (Twitch/YouTube/Kick/https).

`rooms.stream_key` **=** `{roomId}-{secret}`. OBS: Server `OME_RTMP_URL` (e.g. `rtmp://localhost:1935/app`), stream key the full value (not the public id alone).[^infra][^rooms]

The API polls `GET {OME_API_URL}/v1/vhosts/{vhost}/apps/{app}/streams/{streamKey}` with timeout `OME_TIMEOUT_MS` (1s). 200 = live; 404 = healthy but not live; network/timeout = `reachable=false` (warn log at most 1/min, with `message`). The hub polls every 15s and emits an `ome` event.[^ome]

Optional field `ome.reachable`: the SPA only alerts “broadcast offline” if REST **responded** and `healthy=false`. OME stopped (no `make ome-up`) is not an alert.

`IceCandidates` in `Server.xml` follows the **v0.21+** schema: `TcpRelayForce`, `TcpIceWorkerCount`, and extra ICE TCP (`:10000/tcp`). The old schema (`TcpForce` only) is the v0.20.5 one.

`ome.ingest` only for role `admin` or `owner` (`canSeeIngest`) and only with provider `ome` enabled. The SPA copies `rtmpUrl/streamKey` in the settings modal.

Player: **OvenPlayer**. Source 1 WebRTC (`playbackUrl` with no suffix, default Opus playlist). Source 2 LL-HLS (`llhlsUrl`). Automatic fallback. `playoutDelayHint` 0.05 (`currentProtocolOnly` false). A player failure does not tear down the room.[^player]

OME `OutputProfile` **`abr_stream`**: 1080 bypass + transcode 720/480. HLS `FileName` `llhls` (AAC). WebRTC on the default playlist (Opus). LL-HLS: `ChunkDuration` 0.2 s, `SegmentDuration` 2 s. OBS: keyframe 1 s (max 2 s), B-frames 0. Presets: [OBS ingest](/product/obs-ingest/obs-ingest.md). After changing `Server.xml`, recreate the OME container and republish in OBS.

# Intended, not implemented

- `POST /webhooks/ome/admission` (XML commented out)
- SignedPolicy RTMP

# Related

- [OBS ingest](/product/obs-ingest/obs-ingest.md)
- [OME WebRTC first ABR](/rules/ome-webrtc-first-abr.md)
- [Pin Compose images](/rules/pin-compose-images.md)
- [OME independent of WebRTC](/rules/ome-independent-of-webrtc.md)
- [Out of scope](/product/out-of-scope/out-of-scope.md)
- [Vision](/product/vision/vision.md)

[^ome]: Poll REST streams/{streamKey}
[^rooms]: stream_key = {roomId}-{secret}; ingest for owner/admin only
[^infra]: Stream key contract
[^player]: OvenPlayer WebRTC + LL-HLS
