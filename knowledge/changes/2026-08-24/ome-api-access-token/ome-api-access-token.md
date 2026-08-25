---
type: Change
title: Pass OME REST token into the OME container
description: Server.xml reads OME_API_ACCESS_TOKEN from the environment; deploy Compose injects that variable so the app poller is not rejected with 401.
tags: [ome, deploy]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-25T01:15:00Z }
sources:
  - id: xml
    resource: deploy/ome/origin_conf/Server.xml
    title: AccessToken env interpolation
  - id: compose
    resource: deploy/docker-compose.yml
    title: ome environment
---

# What landed

- `<AccessToken>` in `deploy/ome/origin_conf/Server.xml` is `${env:OME_API_ACCESS_TOKEN:change-me}`.
- The `ome` service in `deploy/docker-compose.yml` and `deploy/docker-compose.traefik.yml` now receives `OME_API_ACCESS_TOKEN` from `.env`, same value the app already used for REST Basic auth.

# Why

OBS ingest does not use the REST token. The API poll of `GET /v1/.../streams/{streamKey}` does. If `.env` had a real token and OME still used the XML default `change-me`, the poller got 401, `ome.live` stayed false, and the stage never received playback URLs.

# Related

- [OME broadcast](/product/ome-broadcast/ome-broadcast.md)
