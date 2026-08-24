---
type: Change
title: WebRTC on the default OME playlist, not /llhls
description: OvenPlayer points WebRTC at ws://HOST/app/{roomId} (H.264+Opus). /llhls stays LL-HLS only (AAC). OME needs a recreate after Server.xml.
tags: [ome, ovenplayer, webrtc, llhls]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-23T21:10:00Z }
sources:
  - id: xml
    resource: infra/ome/origin_conf/Server.xml
    title: HLS AAC playlist; CreateDefaultPlaylist; PartHoldBack
  - id: playback
    resource: apps/web/src/lib/ome-playback.ts
    title: webrtcAbrUrl without /llhls suffix
  - id: hook
    resource: apps/web/src/hooks/use-ome-player.ts
    title: timeoutMaxRetry 2 for ICE
  - id: rule
    resource: /rules/ome-webrtc-first-abr.md
    title: Correct WebRTC URL
---

# What landed

- OvenPlayer WebRTC uses `playbackUrl` **without** `/llhls`. OME's `llhls` playlist is AAC (HLS); WebRTC needs Opus on the default playlist `ws://HOST:3333/app/{stream}`.
- `Server.xml`: HLS playlist AAC only; named Opus; `CreateDefaultPlaylist` false on LL-HLS (ABR wins over `llhls_default`); `PartHoldBack` 0.6 s; `CreateDefaultPlaylist` true on WebRTC.
- `timeoutMaxRetry` 2 / `connectionTimeout` 5000 so ICE does not give up in 3 s.
- OME **does not reload XML at runtime**. A process that came up at 07:13 still served 10 s HLS and a single rendition. Recreating the container and republishing in OBS are required.

# Why

Playback stuck on LL-HLS (~20 s delay, Quality only 1080p at 275 kbps) because the player tried WebRTC on `/llhls` (AAC) and `autoFallback` dropped to HLS from the old process.

# Related

- [OME WebRTC first ABR](/rules/ome-webrtc-first-abr.md)
- [OME broadcast](/product/ome-broadcast/ome-broadcast.md)
- [OBS ingest](/product/obs-ingest/obs-ingest.md)

[^xml]: HLS AAC playlist
[^playback]: webrtcAbrUrl without suffix
[^hook]: timeoutMaxRetry 2
[^rule]: Correct WebRTC URL
