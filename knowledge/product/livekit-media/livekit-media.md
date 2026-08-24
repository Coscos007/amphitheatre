---
type: Product
title: LiveKit media
description: Voice, camera, and screenshare via LiveKit. Speaking, transmitting, and quality indicators.
tags: [livekit, webrtc, media]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: livekit-api
    resource: apps/api/src/livekit.ts
    title: mintToken, mute, webhook
  - id: hook
    resource: apps/web/src/hooks/use-livekit.ts
    title: SDK livekit-client
  - id: yaml
    resource: infra/livekit/livekit.yaml
    title: Local SFU
  - id: rule
    resource: /rules/presence-indicators-required.md
    title: Indicators
---

# Implemented

- LiveKit room **=** Amphitheatre `roomId`. Identity **=** `userId`.
- `GET /api/rooms/:id/livekit-token` and token on join (`livekitToken` / `livekitUrl`).
- Grants: `canPublish` + sources camera, mic, screen. Moderation mute **removes** `MICROPHONE` from `canPublishSources` and calls RoomService `updateParticipant`.[^livekit-api]
- SPA: `livekit-client` (not `@livekit/components-react` in this cut). Custom tiles. SDK default simulcast.[^hook]
- SFU: image `livekit/livekit-server:v1.13.5`, UDP mux `7882`, ICE TCP `7881`, Valkey DB 1 (RESP), `max_participants: 50`, no egress.[^yaml]
- Webhook `POST /webhooks/livekit` updates camera/screen in the hub.
- Client emits `presence.update` (speaking, camera, screen, quality).

# Indicators

Speaking, camera, screen, `connectionQuality` mapped to `excellent|good|poor|lost`. See the presence rule.

# Intended / partial

- Room toggles that disable publish on the token: there are **no** `voiceEnabled` fields on create; mute is per member.
- Built-in LiveKit TURN (port 3479) is **commented out**; OME already uses 3478.
- Reconnection: SDK defaults only.

# Related

- [Valkey for LiveKit](/rules/valkey-for-livekit.md)
- [OME independent of WebRTC](/rules/ome-independent-of-webrtc.md)
- [No recording](/rules/no-recording.md)
- [Reconnect last priority](/rules/reconnect-last-priority.md)

[^livekit-api]: mintToken, mute, webhook
[^hook]: SDK livekit-client
[^yaml]: Local SFU
