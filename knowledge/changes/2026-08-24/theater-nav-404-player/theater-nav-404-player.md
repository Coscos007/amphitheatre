---
type: Change
title: Room navigation, 404, and player reload
description: Leave modal on the logo and history; 404 with InfiniteGrid; broadcast player remounts after layout and has reload.
generated: { by: coding_agent/composer, at: 2026-08-24T06:40:00Z }
sources:
  - id: theater
    resource: apps/web/src/components/theater/theater-screen.tsx
    title: blocker and 404
  - id: player
    resource: apps/web/src/hooks/use-ome-player.ts
    title: OvenPlayer after real box
  - id: pane
    resource: apps/web/src/components/theater/broadcast-pane.tsx
    title: embed remount and reload
---

# What landed

- Any exit from the room (logo, Leave, SPA navigation) opens the Leave modal; only then does leave + Home run.
- Room `GET` 404/400 and unknown routes use `NotFoundScreen` with InfiniteGrid3D, copy, and a button to Home.
- OvenPlayer and embed iframes wait for the container to have size, recreate after error/pageshow, and expose Reload stream. YouTube gets `origin` and does not use sandbox (sandbox + SPA remount produced the bot screen).

# Why

Going back from Home to the room left the stage blank until a full refresh. The logo went to `/` with no warning. A missing room code fell through to JoinGate.

# Related

- [Leave room must confirm](/rules/leave-room-must-confirm.md)
- [Not found infinite grid](/rules/not-found-infinite-grid.md)
- [OME WebRTC first ABR](/rules/ome-webrtc-first-abr.md)
- [Broadcast opt-in](/rules/broadcast-opt-in.md)
