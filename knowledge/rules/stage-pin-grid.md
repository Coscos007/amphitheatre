---
type: Rule
title: Stage pin grid
description: Stage as an auto-grid in Meet/Discord style. Pins become the main area; the rest sits on a side rail.
tags: [web, theater, livekit]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T04:30:00Z }
sources:
  - id: grid
    resource: apps/web/src/components/theater/stage-grid.tsx
    title: StageGrid
  - id: livekit
    resource: /product/livekit-media/livekit-media.md
    title: LiveKit media
---

# Rule

The stage **does not** stack stream + camera + screen in a column without scroll. All sources (OME/embed broadcast, cameras, screenshares) enter an **auto-grid** that resizes.

The user **pins** one or more views:

- 0 pins: equal grid for everyone
- 1+ pins: pins occupy the main area in auto-grid; the rest sits on a rail (right on desktop, strip at the bottom on mobile)

On **mobile** (`compact`), do not use the pin rail. All tiles sit in a Google Meet-style grid: **one column for a single tile, two columns otherwise**. An odd leftover tile spans the full row.

Pin is a local view preference, not room state. Default: if broadcast is on, it starts pinned; otherwise the first screenshare.

# Related

- [Room follows HTML prototype](/rules/room-follows-html-prototype.md)
- [Presence indicators required](/rules/presence-indicators-required.md)
