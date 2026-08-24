# Broadcast and OBS

Broadcast is **opt-in** (off by default). Owner/admin enables it with `PATCH /api/rooms/:id/stream` and chooses `ome` | `twitch` | `youtube` | `kick` | `custom`.

Voice, camera, screen share, and chat **never** require OME. `GET /api/rooms/:id/media` stays HTTP 200 with `ome.healthy=false` / `ome.reachable=false` if OME is down — that is not a room failure.

## Enable OME ingest

1. Start the OME profile: `make ome-up`.
2. In the room, owner/admin **turns the stream on** and selects `ome` (or a Twitch/YouTube/Kick/https embed).
3. The stream key is **not** the public `roomId`. Format: `{roomId}-{secret}`. Knowing the room code is not enough to publish to OBS.
4. OBS: custom stream. Server = `OME_RTMP_URL` (example: `rtmp://localhost:1935/app`). Stream key = `ome.ingest.streamKey` (owner/admin only, and only when provider `ome` is on).
5. Keyframe **1 s** (max 2 s), B-frames 0, CBR. The SPA plays **OvenPlayer** (WebRTC ABR on `playbackUrl` without `/llhls`, LL-HLS fallback).

Ingest credentials are returned only to owner/admin in `ome.ingest`, and only with provider `ome` enabled.

## Stream key and URLs

OME stream key = `{roomId}-{secret}` (`ome.ingest.streamKey`):

- OBS Server: `rtmp://HOST:1935/app`
- OBS Stream key: `{roomId}-{secret}`
- WebRTC playback (OvenPlayer ABR): `ws://HOST:3333/app/{streamKey}/webrtc` (H.264 + Opus; do not use `/llhls` as the default playlist)
- LL-HLS: `http://HOST:3333/app/{streamKey}/llhls.m3u8`
- Status: `GET {OME_API_URL}/v1/vhosts/default/apps/app/streams/{streamKey}`

## What is implemented vs not

**Implemented:** `POST /webhooks/livekit` (HMAC of the LiveKit keys; `infra/livekit/livekit.yaml` points at `http://host.docker.internal:3001/webhooks/livekit`). `track_published` / `track_unpublished` update transmitting in the hub.

**Not implemented:** OME admission webhook (`POST /webhooks/ome/admission`). The block in `Server.xml` stays commented. Do not add the handler without an explicit request.

Recording (LiveKit Egress, OME File/DVR/dump) is out of scope.
