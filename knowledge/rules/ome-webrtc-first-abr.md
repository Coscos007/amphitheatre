---
type: Rule
title: OME WebRTC first ABR
description: OME stage uses OvenPlayer with WebRTC first, LL-HLS as fallback, and ABR on the server. Prioritize minimum delay.
tags: [ome, ovenplayer, webrtc, abr, latency]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-23T20:15:00Z }
sources:
  - id: xml
    resource: infra/ome/origin_conf/Server.xml
    title: OutputProfile abr_stream
  - id: player
    resource: apps/web/src/hooks/use-ome-player.ts
    title: OvenPlayer WebRTC + LL-HLS
  - id: product
    resource: /product/ome-broadcast/ome-broadcast.md
    title: OME broadcast
---

# Rule

The OME broadcast stage **must** use OvenPlayer.

The player is **only** created when the container already has real width and height (`ResizeObserver`). Navigating Home -> room remounts React with the stage still at 0x0; creating OvenPlayer at that instant leaves the stream dead until a refresh. `OvenPlayer.create` receives a **child host** inside the React wrapper: `remove()` destroys the player node, not the React container (Strict Mode and Reload depend on this). On error, recreate automatically (few retries) and offer **Reload stream**.

Playback order:

1. WebRTC (`ws://HOST:3333/app/{roomId}/webrtc`) — H.264 + Opus playlist; lowest delay
2. LL-HLS (`http://HOST:3333/app/{roomId}/llhls.m3u8`) — AAC fallback (`autoFallback`)

Do not point WebRTC at `/llhls`. That playlist is HLS-only (AAC); OvenPlayer falls back to LL-HLS and the UI returns Source = LL-HLS.

Do not put `ws://` in `<video src>`. Do not use hls.js alone on the stage; OvenPlayer uses it underneath for HLS fallback.

On OME, the active OutputProfile is **`abr_stream`**: bypass 1080 + transcode 720/480. HLS playlist `FileName` `llhls` (AAC). WebRTC uses the publisher default playlist (`CreateDefaultPlaylist` true) with Opus. LL-HLS has `CreateDefaultPlaylist` false so the ABR playlist wins over `llhls_default`. OME **does not reload** `Server.xml` in an already-running process — `docker compose up -d --force-recreate ome` after changing the XML, and OBS must republish.

Delay config (do not undo without a reason):

- WebRTC publisher: `JitterBuffer` false; OvenPlayer `playoutDelayHint` 0.05 (0 is ignored by the player)
- OvenPlayer: `currentProtocolOnly` false so LL-HLS fallback works; `timeoutMaxRetry` 2 / `connectionTimeout` 5000 so ICE can complete
- LL-HLS: `ChunkDuration` 0.2 s, `PartHoldBack` 0.6 s, `SegmentDuration` 2 s, `SegmentCount` 5
- OBS: keyframe **1 s** (2 s at most), B-frames 0. A GOP larger than `SegmentDuration` breaks LL-HLS. 1080p60 + CBR 7 Mbps is heavy for software transcode on Docker Desktop; if 720/480 never appear, it is CPU.

Room voice, camera, and screenshare stay on LiveKit and **never** require OME ([OME independent of WebRTC](/rules/ome-independent-of-webrtc.md)). No recording ([no recording](/rules/no-recording.md)).

# Related

- [OME broadcast](/product/ome-broadcast/ome-broadcast.md)
- [OBS ingest](/product/obs-ingest/obs-ingest.md)

[^xml]: OutputProfile abr_stream
[^player]: OvenPlayer WebRTC + LL-HLS
[^product]: OME broadcast
