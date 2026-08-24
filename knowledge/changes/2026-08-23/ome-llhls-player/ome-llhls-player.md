---
type: Change
title: OME stage uses LL-HLS, not ws on video
description: Player stops putting the WebRTC playbackUrl on the video element. LL-HLS SegmentDuration 10s for the default OBS GOP.
tags: [ome, spa, obs]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-23T07:12:00Z }
sources:
  - id: player
    resource: apps/web/src/lib/ome-playback.ts
    title: pickOmePlayerUrl
  - id: hook
    resource: apps/web/src/hooks/use-ome-player.ts
    title: Rejects ws:// on video
  - id: xml
    resource: infra/ome/origin_conf/Server.xml
    title: SegmentDuration 10
---

# What landed

- Stage now plays **LL-HLS** (`llhlsUrl`). `playbackUrl` `ws://` is not assigned to `<video>` (the browser fails immediately and the “Broadcast offline” banner appeared even with OBS live).
- `LLHLS.SegmentDuration` 10 s: default OBS GOP (~250 frames / ~8 s) does not cut a segment mid-GOP.
- Ingest hint: 2s keyframe, B-frames 0.

# Why

OBS published `#default#app/{roomId}` (REST 200, `.m3u8` playlist 200). The stage preferred `ws://localhost:3333/app/{roomId}` on `<video src>`. HLS still complained about missing a keyframe every 2 s.

# Related

- [OME broadcast](/product/ome-broadcast/ome-broadcast.md)
- [OME independent of WebRTC](/rules/ome-independent-of-webrtc.md)
