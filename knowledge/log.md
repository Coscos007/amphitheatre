# Directory update log

## 2026-08-24

* **Fix**: Remote LiveKit microphone and screen-share audio now attach and unlock autoplay; screen share can include tab or system audio in Chromium. Rule [livekit-remote-audio-must-play](/rules/livekit-remote-audio-must-play.md). Change: [livekit-audio-playback](/changes/2026-08-24/livekit-audio-playback/livekit-audio-playback.md).

* **Fix**: Deploy Compose injects `OME_API_ACCESS_TOKEN` into OvenMediaEngine; Server.xml interpolates that env var so REST stream status is not 401. Change: [ome-api-access-token](/changes/2026-08-24/ome-api-access-token/ome-api-access-token.md).

* **Creation**: `deploy/` standalone self-hosting stack (Compose + Caddy/Traefik examples), single production `Dockerfile` (API serves the built web app), `PUBLIC_APP_HOSTNAME`/`PUBLIC_LIVEKIT_HOSTNAME`/`PUBLIC_OME_HOSTNAME` env vars, `docs/self-hosting.md`, human-readable `README.md`, root `CHANGELOG.md`, and a tag-triggered `.github/workflows/release.yml` publishing multi-arch images to Docker Hub (`simstosh/amphitheatre`). Rule [changelog-and-release-process](/rules/changelog-and-release-process.md). Change: [self-hosting-docker-release](/changes/2026-08-24/self-hosting-docker-release/self-hosting-docker-release.md).

* **Update**: `scripts/extract-changelog.sh promote <version>` command to move `[Unreleased]` into a dated version section automatically; fixed the `Dockerfile` multi-arch release build (`--platform=$BUILDPLATFORM` on the JS build stages) after it crashed under QEMU emulation cross-building `linux/arm64`; cut the `v1.0.0` release. Change: [self-hosting-docker-release](/changes/2026-08-24/self-hosting-docker-release/self-hosting-docker-release.md).

* **Update**: Entire OKF catalog in `knowledge/` translated to English. Rules [public-docs-english](/rules/public-docs-english.md) and [self-aware-knowledge](/rules/self-aware-knowledge.md). Change: [okf-english](/changes/2026-08-24/okf-english/okf-english.md).

* **Update**: OKF catalog in `knowledge/` translated to English (changes/2026-08-24, catalog root, log, references, historical plan). Rule [public-docs-english](/rules/public-docs-english.md).

* **Update**: English README (centered logo + shields, OME style); guides in `docs/` (including load-testing); AGENTS, CONTRIBUTING, and infra/README in English. HTTP contract in `docs/api.md`. Rules [public-docs-english](/rules/public-docs-english.md) and [api-contract-frozen](/rules/api-contract-frozen.md). Change: [readme-en-docs-split](/changes/2026-08-24/readme-en-docs-split/readme-en-docs-split.md).

* **Update**: Settings modal with Stage, Devices, and About (About last); About with AGPLv3, version, and licensed stack; xl dialog without double-scroll; Reload next to the pin. Change: [theater-settings-about-chrome](/changes/2026-08-24/theater-settings-about-chrome/theater-settings-about-chrome.md).

* **Update**: Public edition AGPL-3.0-only; SIMSDEV ICLA; CLA Assistant; restructured README and CONTRIBUTING. Rule [agplv3-and-cla](/rules/agplv3-and-cla.md). Change: [agpl-cla-docs](/changes/2026-08-24/agpl-cla-docs/agpl-cla-docs.md).

* **Update**: Stage fills the frame height (no `pb-24` from the old dock; `auto-rows-fr` grid). Home horizontal wordmark on the room header and the About tab. Change: [theater-stage-fill-wordmark](/changes/2026-08-24/theater-stage-fill-wordmark/theater-stage-fill-wordmark.md).

* **Update**: Leave modal on the logo and SPA navigation; page/room 404 with InfiniteGrid3D; OvenPlayer and embeds remount after layout, with Reload. Rules [leave-room-must-confirm](/rules/leave-room-must-confirm.md) and [not-found-infinite-grid](/rules/not-found-infinite-grid.md). Change: [theater-nav-404-player](/changes/2026-08-24/theater-nav-404-player/theater-nav-404-player.md).

* **Update**: Room QOL — dock in the header, vertical tabs, Discord-style Devices, About, chat 1024 + wrap + soft-ban, tile chrome at the top, logos and metatags. Rules [theater-header-chrome](/rules/theater-header-chrome.md) and [chat-flood-soft-ban](/rules/chat-flood-soft-ban.md). Change: [theater-qol-header-chat](/changes/2026-08-24/theater-qol-header-chat/theater-qol-header-chat.md).

* **Update**: React room aligned with `room.html` / `room-chat.html`. Stage as auto-grid with pins. Role/moderation modal and settings modal (devices + stream). Broadcast opt-in; OME stream key `{roomId}-{secret}`; Twitch/YouTube/Kick/https embeds. `PATCH /api/rooms/:id/stream` and WS event `broadcast`. Rules [broadcast-opt-in](/rules/broadcast-opt-in.md), [room-follows-html-prototype](/rules/room-follows-html-prototype.md), [stage-pin-grid](/rules/stage-pin-grid.md). Change: [theater-room-rework](/changes/2026-08-24/theater-room-rework/theater-room-rework.md).

* **Update**: SPA icons from Lucide to `@tabler/icons-react`. Initial locale from the browser; `coliseum.locale` only after a choice. Theme in `coliseum.ui`. Rules [no-emoji-in-ui-or-docs](/rules/no-emoji-in-ui-or-docs.md) and [i18n-en-pt-es](/rules/i18n-en-pt-es.md). Change: [tabler-icons-and-locale-detect](/changes/2026-08-24/tabler-icons-and-locale-detect/tabler-icons-and-locale-detect.md).

* **Update**: Home background is `InfiniteGrid3D` (CSS 3D infinite grid, size/color/angle props). `prefers-reduced-motion` pauses the loop. Rule [home-follows-html-prototype](/rules/home-follows-html-prototype.md). Change: [home-infinite-grid-3d](/changes/2026-08-24/home-infinite-grid-3d/home-infinite-grid-3d.md).

## 2026-08-23

* **Update**: Visible product name **Amphitheatre** (UI, docs, knowledge). Packages `@coliseum/*` unchanged. Rule [app-name-amphitheatre](/rules/app-name-amphitheatre.md). Change: [rename-amphitheatre](/changes/2026-08-23/rename-amphitheatre/rename-amphitheatre.md).

* **Update**: Home mood chips smaller, icon + tooltip only; hover not clipped (no overflow on the rail).

* **Update**: React Home aligned with the `home.html` prototype (layout, glow, decorative cards). Theme/locale in the center pill. Crash `export { initials }` fixed. Rule [home-follows-html-prototype](/rules/home-follows-html-prototype.md). Change: [home-html-fidelity](/changes/2026-08-23/home-html-fidelity/home-html-fidelity.md).

* **Fix**: OvenPlayer WebRTC on the default playlist (`ws://HOST/app/{roomId}`), not `/llhls` (AAC). Change: [ome-webrtc-default-playlist](/changes/2026-08-23/ome-webrtc-default-playlist/ome-webrtc-default-playlist.md).
* **Update**: OME stage with OvenPlayer (WebRTC first, LL-HLS fallback) and `abr_stream` in Server.xml. Change: [ome-abr-ovenplayer](/changes/2026-08-23/ome-abr-ovenplayer/ome-abr-ovenplayer.md). Rule: [ome-webrtc-first-abr](/rules/ome-webrtc-first-abr.md).
* **Creation**: Concept [OBS ingest](/product/obs-ingest/obs-ingest.md) — Windows/macOS encoders, CBR/ABR/VBR/CRF, presets, bypass vs transcode (ingest URL does not choose a profile).
* **Fix**: OME stage plays LL-HLS instead of `ws://` on `<video>`; SegmentDuration 10s for the OBS GOP. Change: [ome-llhls-player](/changes/2026-08-23/ome-llhls-player/ome-llhls-player.md).
* **Update**: Pinned Compose images — LiveKit v1.13.5, OME v0.21.0, Valkey 9.1.1-alpine (instead of Redis Ltd.), Caddy 2.11.4. `Server.xml` on the v0.21 schema. Rules [valkey-for-livekit](/rules/valkey-for-livekit.md) and [pin-compose-images](/rules/pin-compose-images.md). Change: [infra-image-pins](/changes/2026-08-23/infra-image-pins/infra-image-pins.md).
* **Fix**: OME IceCandidates v0.20.5 (`TcpForce`); `ome.reachable`; LiveKit stage clears dead tiles; broadcast banner only if REST responded. Change: [ome-livekit-stage-fixes](/changes/2026-08-23/ome-livekit-stage-fixes/ome-livekit-stage-fixes.md).

## 2026-08-22

* **Initialization**: OKF v0.2 catalog in `knowledge/` (product, rules, changes, references) and `AGENTS.md` at the monorepo root.
* **Creation**: Bootstrap changes in [2026-08-22](/changes/2026-08-22/) — monorepo, LiveKit/OME infra, room/moderation API, theater SPA, load-testing docs.
* **Creation**: Product docs (vision, identity, chat, LiveKit, OME, moderation, safety, clients, out-of-scope) and architecture/process rules.
* **Update**: OKF frontmatter on the [original plan](/references/plano-watchparty-miniDiscord.md) (`status: deprecated`); body preserved at the time (later translated to English).
