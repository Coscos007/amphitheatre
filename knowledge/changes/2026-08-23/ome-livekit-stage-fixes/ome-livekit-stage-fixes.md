---
type: Change
title: OME v0.20.5 XML, poll logs, LiveKit stage
description: TcpForce in Server.xml; ome.reachable; dead tiles leave the stage; broadcast banner only if REST responded.
tags: [ome, livekit, spa, api]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-23T06:50:00Z }
sources:
  - id: xml
    resource: infra/ome/origin_conf/Server.xml
    title: IceCandidates v0.20.5
  - id: ome
    resource: apps/api/src/ome.ts
    title: reachable + log with message
  - id: livekit
    resource: apps/web/src/hooks/use-livekit.ts
    title: unpublished/muted/ended
  - id: stage
    resource: apps/web/src/components/theater/stage.tsx
    title: banner only reachable && !healthy
---

# What landed

- `Server.xml` aligned with the **OvenMediaEngine v0.20.5** schema (`TcpForce`, no `TcpRelayForce` / `TcpIceWorkerCount` / extra ICE TCP). The container would fail to start with “Unknown item”.
- OME poll: log `name` + `message` (not just `Error`), at most one warn per minute when the process is absent.
- Optional field `ome.reachable`. SPA does not show “Broadcast is offline” when OME is simply not in Compose.
- LiveKit stage: listens to `TrackUnpublished` / `TrackMuted` / `ParticipantDisconnected` / `ended` on MediaStreamTrack; ignores muted, unsubscribed, or ended tracks. `presence.update` for camera/screen to the hub.

# Why

Real test: OME crash-loop, `ome_status_failed` spam, false banner, ghost tile after stopping share.

# Related

- [OME independent of WebRTC](/rules/ome-independent-of-webrtc.md)
- [OME broadcast](/product/ome-broadcast/ome-broadcast.md)
- [API contract frozen](/rules/api-contract-frozen.md)
