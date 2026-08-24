---
type: Rule
title: Theater header chrome
description: Media dock in the center of the header; settings, theme, and locale on the right with tooltip; tile chrome at the top, only on hover.
tags: [web, theater, ux]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T06:20:00Z }
sources:
  - id: header
    resource: apps/web/src/components/theater/theater-header.tsx
    title: TheaterHeader
  - id: tile
    resource: apps/web/src/components/theater/stage-tile.tsx
    title: StageTileChrome
---

# Rule

In the theater, the dock (mic, camera, screen, invite, leave) sits in the **middle of the header**, not over the stage. Settings sit on the right with theme and locale, each with a tooltip.

The mark in the room header and on the About tab is the **horizontal wordmark** (`amphitheatre-logo-full-1000.webp`), the same as on Home. Do not duplicate the text “Amphitheatre” next to it. The logo in the header **does not** navigate silently: it opens the Leave modal ([leave-room-must-confirm](/rules/leave-room-must-confirm.md)).

The stage fills the height available below the header. Do not reserve `pb-24` (that was the dock over the stage). The grid uses `auto-rows-fr` so the stream tile fills the frame.

Name and pin of each tile sit at the **top**. They appear on hover/focus and disappear 3 seconds after the pointer leaves, so they do not cover the player. On the broadcast tile, Reload sits to the left of the pin, in the same chrome (same hover).

Settings modal: fixed height (`min(40rem, 100dvh - 2rem)`); **fixed vertical tabs** (Stage if admin, then Devices, About always last). Only the tab panel scrolls. Dialog title uses `font-sans` (Raleway), vertically aligned with Close. Devices in Discord style (input+volume / output+volume; mic test right after input). Device prefs in `localStorage` (`coliseum.devices`), including input volume.

# Related

- [Room follows HTML prototype](/rules/room-follows-html-prototype.md)
- [Stage pin grid](/rules/stage-pin-grid.md)
- [AGPLv3 and CLA](/rules/agplv3-and-cla.md)
