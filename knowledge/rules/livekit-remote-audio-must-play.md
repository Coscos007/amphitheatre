---
type: Rule
title: LiveKit remote audio must play
description: Remote microphone and screen-share audio must be attached and unlocked for playback. Speaking indicators are not a substitute for audible output.
tags: [livekit, web, audio]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T22:00:00Z }
sources:
  - id: hook
    resource: apps/web/src/hooks/use-livekit.ts
    title: useLivekitRoom
  - id: media
    resource: apps/web/src/lib/livekit-media.ts
    title: attachRemoteAudio and screen-share capture options
  - id: product
    resource: /product/livekit-media/livekit-media.md
    title: LiveKit media
---

# Rule

The SPA uses `livekit-client` directly (not `@livekit/components-react`). Remote **audio is a separate track** from camera and screen video.

1. On `TrackSubscribed` for `Track.Kind.Audio`, **attach** the remote track (microphone and `SCREEN_SHARE_AUDIO`) and keep it attached until `TrackUnsubscribed`. Do not attach local audio (echo).
2. Call `room.startAudio()` after connect and on user gestures (dock controls, pointerdown). If `canPlaybackAudio` is false, show an i18n prompt to enable audio. Speaking / `audioLevel` coming from the SFU does **not** mean the browser is playing sound.
3. Screen share must request display audio: `getDisplayMedia` with `audio` plus Chromium `systemAudio: "include"` so a **tab** or **entire screen** can include sound. If the browser rejects the audio constraint, fall back to video-only share. User cancel of the picker is not an error toast.

`webAudioMix` stays on so output volume / sink selection keep working. Do not treat open UDP/TCP media ports as sufficient for voice when video already works.

# Related

- [LiveKit media](/product/livekit-media/livekit-media.md)
- [Presence indicators required](/rules/presence-indicators-required.md)
- [i18n en pt es](/rules/i18n-en-pt-es.md)
