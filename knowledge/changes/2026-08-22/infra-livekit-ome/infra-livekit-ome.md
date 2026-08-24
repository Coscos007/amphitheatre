---
type: Change
title: Infra LiveKit + OME
description: Local-first Compose. Default Redis+LiveKit. OME on a profile. Stream key = roomId.
tags: [bootstrap, docker, livekit, ome]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: compose
    resource: docker-compose.yml
    title: services redis, livekit, ome, caddy
  - id: makefile
    resource: Makefile
    title: make up / ome-up / smoke
  - id: livekit
    resource: infra/livekit/livekit.yaml
    title: SFU + webhook
  - id: ome-xml
    resource: infra/ome/origin_conf/Server.xml
    title: OME Server.xml
  - id: env
    resource: .env.example
    title: Dev placeholders
---

# What landed

`docker-compose.yml` named `coliseum`:

- Always: `redis:7.4-alpine` (6379), `livekit/livekit-server:v1.9` (7880/7881/7882, metrics 127.0.0.1:6789)
- Profile `ome`: `ovenmedialabs/ovenmediaengine:v0.20.5` (RTMP 1935, signalling 3333/3334, TURN 3478, ICE UDP 10000-10003, REST 8081). **No** `depends_on` for LiveKit.
- Profile `caddy`: TLS HTTP/WS only
- Overlay `infra/compose/livekit-hostnet.yml` for Linux VMs

Makefile: `up`, `down`, `ome-up`, `ome-down`, `ome-only`, `smoke`, `ffmpeg-ome`, `logs`, `ps`.

OME stream name = `{roomId}`. LiveKit webhook enabled for `http://host.docker.internal:3001/webhooks/livekit`. OME admission remains commented out.

Recording/egress **not** deployed.

# Files

- `docker-compose.yml`, `Makefile`, `.env.example`
- `infra/README.md`, `infra/livekit/livekit.yaml`, `infra/ome/origin_conf/{Server,Logger}.xml`
- `infra/caddy/Caddyfile`, `infra/redis/redis.conf`
- `infra/scripts/{up,down,ome-up,ome-down,smoke,ffmpeg-ome-fixture,_lib,logs}.sh`

# Why

Voice day-to-day without paying the OME cost. The same id for room, LiveKit room, and OBS ingest avoids three namespaces.

# Links

- [OME broadcast](/product/ome-broadcast/ome-broadcast.md)
- [LiveKit media](/product/livekit-media/livekit-media.md)
- [OME independent of WebRTC](/rules/ome-independent-of-webrtc.md)
- [No recording](/rules/no-recording.md)

[^compose]: services redis, livekit, ome, caddy
[^makefile]: make up / ome-up / smoke
[^livekit]: SFU + webhook
[^ome-xml]: OME Server.xml
[^env]: Dev placeholders
