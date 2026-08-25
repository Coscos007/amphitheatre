---
type: Change
title: Play LiveKit remote audio and capture screen-share sound
description: Attach remote audio tracks and unlock autoplay so voice is audible; screen share requests tab or system audio in Chromium.
tags: [web, livekit, audio]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T22:00:00Z }
sources:
  - id: hook
    resource: apps/web/src/hooks/use-livekit.ts
    title: useLivekitRoom
  - id: media
    resource: apps/web/src/lib/livekit-media.ts
    title: attachRemoteAudio, SCREEN_SHARE_CAPTURE_OPTIONS
  - id: tiles
    resource: apps/web/src/components/theater/livekit-tiles.tsx
    title: video-only attach (unchanged)
---

# What landed

- Remote LiveKit audio (microphone and screen-share audio) is attached into hidden media elements and mixed with `webAudioMix`.
- `room.startAudio()` runs after connect and on dock / pointer gestures. If the browser still blocks playback, a toast asks the user to enable audio.
- Screen share calls `setScreenShareEnabled(true, { audio, systemAudio: "include" })`. Cancel in the picker is ignored; audio-constraint failure falls back to video-only share.

# Why

Speaking indicators lit up for everyone because the SFU forwarded the mic track, but the SPA only called `track.attach()` on video tiles. `livekit-client` 2.22 defaults `webAudioMix` to false and does not auto-play unattached audio. Screen share used video-only `getDisplayMedia`.

# Related

- [LiveKit remote audio must play](/rules/livekit-remote-audio-must-play.md)
- [LiveKit media](/product/livekit-media/livekit-media.md)
