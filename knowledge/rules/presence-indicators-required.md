---
type: Rule
title: Presence indicators required
description: UI and events must show who is speaking, who is transmitting camera/screen, and connection quality.
tags: [ux, livekit, presence]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: events
    resource: packages/shared/src/events.ts
    title: speaking, transmitting, quality, presence
  - id: member-row
    resource: apps/web/src/components/theater/member-row.tsx
    title: Badges and ConnectionIndicator
  - id: livekit-hook
    resource: apps/web/src/hooks/use-livekit.ts
    title: connectionQuality and tracks
  - id: product
    resource: /product/livekit-media/livekit-media.md
    title: LiveKit media
---

# Rule

Every member list / media tile must make visible:

1. **Speaking** — who is talking (active speaker / `presence.update` / `speaking` event)
2. **Transmitting** — camera on and/or screen share (`transmitting`, LiveKit webhook `track_published` / `track_unpublished`)
3. **Quality** — `excellent` | `good` | `poor` | `lost` from `participant.connectionQuality` (`quality` event)
4. **Adaptive** — when the transport allows it (LiveKit simulcast; OME ABR only if enabled in XML). Expose in the UI if the layer dropped (`ParticipantMedia.adaptive` on the client)

Do not hide quality behind an icon with no accessible text. `ConnectionIndicator` uses a Tabler icon + i18n string.[^member-row]

Server events frozen in shared: `speaking`, `transmitting`, `quality`, `presence`.[^events][^livekit-hook]

# Related

- [LiveKit media](/product/livekit-media/livekit-media.md)
- [Realtime chat](/product/realtime-chat/realtime-chat.md) (same WS)

[^events]: speaking, transmitting, quality, presence
[^member-row]: Badges and ConnectionIndicator
[^livekit-hook]: connectionQuality and tracks
