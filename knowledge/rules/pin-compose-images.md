---
type: Rule
title: Pin Compose images
description: Docker images pinned to a semver tag. Do not use latest. When updating, align XML/YAML to that version's schema.
tags: [infra, docker, compose]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-23T07:15:00Z }
sources:
  - id: compose
    resource: docker-compose.yml
    title: Pinned tags
  - id: infra-readme
    resource: infra/README.md
    title: Image list
---

# Rule

Every image in `docker-compose.yml` (including commented services) uses an **explicit tag** (`v1.13.5`, `9.1.1-alpine`). `:latest` and a bare major (`v1.9`, `caddy:2.9-alpine`) are forbidden when a known patch exists.

Current pins (Aug 2026):

| Image | Tag |
|---|---|
| LiveKit | `livekit/livekit-server:v1.13.5` |
| OvenMediaEngine | `ovenmedialabs/ovenmediaengine:v0.21.0` |
| Valkey | `valkey/valkey:9.1.1-alpine` |
| Caddy | `caddy:2.11.4-alpine` |
| coturn (commented) | `coturn/coturn:4.17.2-alpine` |

When bumping OME, `Server.xml` **must** match the image schema (v0.21+ uses `TcpRelayForce` / `TcpIceWorkerCount` / ICE TCP). When bumping down, do not leave new-schema tags on an old image.

Update `infra/README.md` (pinned images section), `AGENTS.md` (toolchain), and the OKF change in the same change set.

# Related

- [Valkey for LiveKit](/rules/valkey-for-livekit.md)
- [OME independent of WebRTC](/rules/ome-independent-of-webrtc.md)
