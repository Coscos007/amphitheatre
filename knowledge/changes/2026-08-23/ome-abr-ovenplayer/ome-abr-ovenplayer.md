---
type: Change
title: OME ABR + OvenPlayer on the stage
description: Enables abr_stream (1080 bypass + 720/480), low-latency LL-HLS, and WebRTC-first OvenPlayer with LL-HLS fallback.
tags: [ome, ovenplayer, abr, spa]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-23T20:15:00Z }
sources:
  - id: xml
    resource: infra/ome/origin_conf/Server.xml
    title: abr_stream enabled; ChunkDuration 0.2; SegmentDuration 2
  - id: playback
    resource: apps/web/src/lib/ome-playback.ts
    title: omePlayerSources WebRTC + LL-HLS
  - id: hook
    resource: apps/web/src/hooks/use-ome-player.ts
    title: OvenPlayer create/remove
  - id: stage
    resource: apps/web/src/components/theater/stage.tsx
    title: OvenPlayer container
---

# What landed

- OME `OutputProfile` **`abr_stream`**: 1080 video in bypass, H.264 transcode 720p and 480p (`Preset` superfast, `BFrames` 0), AAC for LL-HLS, Opus for WebRTC. Playlist `FileName` `llhls` with `WebRtcAutoAbr`.
- LL-HLS: `ChunkDuration` 0.2 s, `SegmentDuration` 2 s, `SegmentCount` 5. Requires OBS GOP 1–2 s.
- SPA: **OvenPlayer** on the stage. Source 1 WebRTC (`playbackUrl` + `/llhls`), source 2 LL-HLS. `autoFallback`, `currentProtocolOnly` false, `playoutDelayHint` 0.05 (0 is ignored), HLS low-latency.
- HTTP contract unchanged (`playbackUrl` / `llhlsUrl`). The `/llhls` suffix on WebRTC ABR is client-only.

# Why

Minimum delay on the viewer and ABR for phones, without changing ingest (`rtmp://HOST:1935/app` + `{roomId}`).

# Related

- [OME WebRTC first ABR](/rules/ome-webrtc-first-abr.md)
- [OME broadcast](/product/ome-broadcast/ome-broadcast.md)
- [OBS ingest](/product/obs-ingest/obs-ingest.md)

[^xml]: abr_stream enabled
[^playback]: omePlayerSources
[^hook]: OvenPlayer create/remove
[^stage]: OvenPlayer container
