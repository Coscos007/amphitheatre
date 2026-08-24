---
type: Change
title: Pins LiveKit 1.13.5, OME 0.21, Valkey 9.1.1, Caddy 2.11.4
description: Compose on the latest stable tags. Redis Ltd. replaced with Valkey. Server.xml on the OME v0.21 schema.
tags: [infra, docker, livekit, ome, valkey]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-23T07:15:00Z }
sources:
  - id: compose
    resource: docker-compose.yml
    title: Pinned images
  - id: ome-xml
    resource: infra/ome/origin_conf/Server.xml
    title: IceCandidates v0.21
  - id: valkey-conf
    resource: infra/redis/redis.conf
    title: Config mounted into Valkey
  - id: smoke
    resource: infra/scripts/smoke.sh
    title: valkey-cli on coliseum-valkey
---

# What landed

- LiveKit `v1.9` -> `livekit/livekit-server:v1.13.5`.
- OME `v0.20.5` -> `ovenmedialabs/ovenmediaengine:v0.21.0`. `IceCandidates` back to the new schema (`TcpRelayForce`, ICE TCP `:10000/tcp`, `TcpIceWorkerCount`).
- Redis Ltd. `redis:7.4-alpine` -> `valkey/valkey:9.1.1-alpine`. Container `coliseum-valkey`. Compose service still named `redis` (`redis:6379` in LiveKit). New volume `coliseum-valkey-data` (Redis v12 RDB does not load in Valkey).
- Caddy `2.9-alpine` -> `caddy:2.11.4-alpine`. Commented coturn `4.6` -> `coturn/coturn:4.17.2-alpine`.
- Smoke: `valkey-cli` on `coliseum-valkey`; LiveKit via `wget` **inside** the container (`GET /` = `OK`).

# Why

Request to update images and to pick RESP (Valkey vs Redis) with fewer commercial restrictions. Valkey is BSD-3-Clause; Redis 8+ is not OSI-only.

# Related

- [Valkey for LiveKit](/rules/valkey-for-livekit.md)
- [Pin Compose images](/rules/pin-compose-images.md)
- [LiveKit media](/product/livekit-media/livekit-media.md)
- [OME broadcast](/product/ome-broadcast/ome-broadcast.md)
