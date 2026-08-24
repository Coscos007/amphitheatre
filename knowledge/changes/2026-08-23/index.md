# Changes — 2026-08-23

* [Rename Amphitheatre](rename-amphitheatre/rename-amphitheatre.md) - visible name Coliseum Theater -> Amphitheatre
* [Home HTML fidelity](home-html-fidelity/home-html-fidelity.md) - Home aligned with home.html; header crash; decorative cards

* [WebRTC on the default playlist](ome-webrtc-default-playlist/ome-webrtc-default-playlist.md) - OvenPlayer does not use `/llhls` for WebRTC; OME recreate required after XML
* [OME ABR + OvenPlayer](ome-abr-ovenplayer/ome-abr-ovenplayer.md) - abr_stream, WebRTC-first, low-latency LL-HLS fallback
* [OME LL-HLS stage](ome-llhls-player/ome-llhls-player.md) - player does not use ws:// on video; SegmentDuration 10s (later superseded by ABR + OvenPlayer)
* [Image pins + Valkey](infra-image-pins/infra-image-pins.md) - LiveKit 1.13.5, OME 0.21.0, Valkey 9.1.1, Caddy 2.11.4
* [OME + LiveKit stage](ome-livekit-stage-fixes/ome-livekit-stage-fixes.md) - XML v0.20.5 (later superseded by the 0.21 pin), `ome.reachable`, tiles and broadcast banner
