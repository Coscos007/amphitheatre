---
type: Product
title: Out of scope
description: Recording does not exist. The product is not a Netflix client and does not assume legality of retransmitting a commercial catalog.
tags: [scope, legal, recording]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: rule-rec
    resource: /rules/no-recording.md
    title: No recording
  - id: plan
    resource: /references/plano-watchparty-miniDiscord.md
    title: Plan (mentions Netflix and ToS)
  - id: load
    resource: docs/load-testing.md
    title: Load tests forbid recording
---

# Recording

Out of scope. No LiveKit Egress, no OME File/DVR, no Record button. See [no-recording](/rules/no-recording.md).[^rule-rec][^load]

# Netflix / ToS

OME is a **generic** ingest/playback server. The original plan describes capturing a Netflix window via OBS; that is **not** a code requirement nor a claim that the use is allowed.

Retransmitting a commercial catalog to third parties may violate the provider’s terms. Amphitheatre does not implement DRM bypass, does not present itself as a Netflix client, and does not include Netflix branding or APIs.

Agents must not add a “Netflix mode”, third-party streaming login, or copy that promises legality of that use.

# Other conscious cuts

- Custom reconnection protocol ([rule](/rules/reconnect-last-priority.md))
- Email accounts / identity provider
- Redis as the source of truth for rooms
- Multi-instance Hono with pub/sub

# Related

- [Vision](/product/vision/vision.md)
- [OME broadcast](/product/ome-broadcast/ome-broadcast.md)

[^plan]: Plan (mentions Netflix and ToS)
