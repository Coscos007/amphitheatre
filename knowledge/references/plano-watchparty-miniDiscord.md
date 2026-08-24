---
type: Reference
title: Original Watch Party + Mini-Discord plan
description: Historical implementation plan. Several decisions were superseded by the code (SQLite, guest JWT, optional OME). Do not use as the contract.
tags: [historical, plan, watchparty]
status: deprecated
generated: { by: human:lucas, at: 2026-08-22T08:21:00Z }
---

# Implementation plan — Watch Party + Mini-Discord

**Deprecated.** This is a historical implementation plan, not the current product contract. Several decisions were superseded by the code: **SQLite** instead of Redis for rooms, **guest JWT** without an email account, and **optional OME**. See `AGENTS.md` and the OKF product/rules catalog for what is implemented.

Final stack in this draft: **OvenMediaEngine** (Netflix-style broadcast, low latency) + **LiveKit** (voice/video/screen share) + **Redis** (room state, pub/sub) + **Bun + Hono** (backend) + **Vite/React SPA** (frontend).

---

## Phase 1 — Install OvenMediaEngine on the dedicated server

### 1.1 Prerequisites
- [ ] Confirm Docker + Docker Compose are installed on the dedicated server
- [ ] Open ports on the firewall/security group:
  - `1935/tcp` — RTMP ingest (OBS sends the stream here)
  - `3333/tcp` — WebRTC signalling
  - `3478/tcp` — STUN/TURN (ICE)
  - `10000-10010/udp` — WebRTC media (adjustable)
  - `8080/tcp` — LLHLS/API (or whichever port you configure)
- [ ] Have a domain or subdomain pointing at the server (e.g. `stream.seudominio.com`) — needed for TLS, which is mandatory for WebRTC in production (browsers require a secure context)

### 1.2 Run OvenMediaEngine via Docker
- [ ] Create a working directory (`/opt/ome/`)
- [ ] Create `docker-compose.yml` with the `airensoft/ovenmediaengine` container (or `ovenmedialabs/ovenmediaengine`; confirm the latest tag)
- [ ] Mount a volume for `Server.xml` (main config file)
- [ ] Start the container and check logs (`docker compose up -d && docker compose logs -f`)

### 1.3 Configure `Server.xml`
- [ ] Define the ingest `Application` (name, e.g. `app`)
- [ ] Configure input providers: `RTMP` (what OBS will use)
- [ ] Configure output publishers: `WebRTC` (low latency) and `LLHLS` (fallback/compatibility)
- [ ] Set the public Host/IP (or `*` if applicable) in the XML `<IP>` sections
- [ ] Configure TLS (certificate — Let's Encrypt via Traefik in front, or a certificate directly on OME)

### 1.4 Validate TLS/domain
- [ ] If using Traefik as reverse proxy (you already have experience with that on infleux-lab), configure HTTPS routing to OME
- [ ] Test that `https://stream.seudominio.com` responds (OME API/health endpoint)

### 1.5 Ingest and playback test
- [ ] Run a simple test via `ffmpeg` or OBS sending a test video over RTMP to OME
- [ ] Validate playback using the demo **OvenPlayer** (JS the project itself ships) pointed at the stream
- [ ] Confirm observed latency (should be sub-second via WebRTC, or 1-3s via LLHLS)

**Decision point:** validate here whether real latency matches expectations before continuing — if the server network has awkward NAT, you may need to set `CandidateIP`/UDP ports manually in `Server.xml`. This is the step most prone to troubleshooting.

---

## Phase 2 — Configure OBS pointing at the server

### 2.1 Output settings (Settings → Output)
- [ ] Mode: **Advanced**
- [ ] Encoder: choose according to available hardware
  - If NVIDIA GPU: `NVENC H.264` (lower CPU use)
  - No dedicated GPU: `x264` (software) — needed anyway for DRM content, as we discussed
- [ ] Bitrate: initial recommendation 6000-8000 Kbps for 1080p60 (adjust to available upload)
- [ ] Keyframe Interval: **1-2 seconds** (important — a small GOP reduces the latency OME can deliver)
- [ ] Rate Control: CBR (more predictable for live streaming)

### 2.2 Video settings (Settings → Video)
- [ ] Output resolution: 1920x1080 (or the maximum software decode can sustain without dropping frames)
- [ ] FPS: 60 (validate that the machine can handle screen capture + software decode + encode at once without stutter)

### 2.3 Source capture
- [ ] Add a "Window Capture" (or "Display Capture") source pointed at the Netflix browser/app
- [ ] **Important:** confirm the browser's video decode is in software mode (disable hardware acceleration in the browser used for Netflix), since GPU decoding will yield a black screen because of content protection, as we discussed

### 2.4 Stream settings (Settings → Stream)
- [ ] Service: **Custom**
- [ ] Server: `rtmp://stream.seudominio.com:1935/app` (adjust to the Application name configured in OME)
- [ ] Stream Key: set a key (OME treats this as the stream identifier inside the Application)

### 2.5 Real test
- [ ] Start a real broadcast with Netflix running
- [ ] Validate in the player: image quality, no black/green frames, audio sync
- [ ] Measure CPU on the OBS machine (software decode + encode at once is heavy — watch that it does not lock up)

---

## Phase 3 — "mini-Discord" project

### 3.1 Overall architecture

```
monorepo/
├── apps/
│   ├── api/          → Bun + Hono (backend)
│   └── web/          → Vite + React (SPA)
├── packages/
│   └── shared/       → shared TS types (Room, User, events)
```

- **Backend:** Bun + Hono, exposes REST (create room, authentication) + WebSocket (chat, room events, presence)
- **Frontend:** Vite/React SPA, consumes REST + WS, embeds the OvenPlayer (Netflix) and LiveKit SDK components (voice/video/screen)
- **Redis:** room state (keys with TTL), pub/sub of events between backend instances (relevant if you ever scale horizontally), and possibly a light queue if needed

### 3.2 Data model in Redis

Yes, **Redis made full sense for this case** in this draft — no relational database needed here. Reasons:
- Rooms are ephemeral (destroyed when they empty) → no long-term persistence needed
- Access is mostly simple read/write by key (room ID) → no complex relational queries needed
- Native Pub/Sub notifies events across WebSocket connections without extra infra
- Native TTL is a good safety net to expire abandoned rooms automatically

Suggested structure:

```
room:{roomId}                    → Hash: { name, maxUsers, hasPassword, voiceEnabled,
                                            videoEnabled, screenShareEnabled, streamUrl,
                                            adminUserId, createdAt }
room:{roomId}:users               → Set: userIds currently connected
room:{roomId}:messages            → List (capped, e.g. last 200) OR Redis Stream
user:{userId}                     → Hash: { username, avatarUrl, isAnonymous, passwordHash? }
user:{userId}:socket               → String: id of the active WS connection (to invalidate old connections)
```

- [ ] Decide: **Redis Streams** (more robust, allows replay) vs **simple List** (simpler) for room chat history — given it is discarded when the room closes, a simple List with `LTRIM` already works well
- [ ] Use `EXPIRE`/TTL as an extra safety net on `room:{roomId}` (e.g. 12h), even with "delete when empty" logic — avoids ghost rooms from disconnect bugs

### 3.3 Authentication and profile

- [ ] Initial screen: choose "Join anonymous" (generates a temporary `userId` + lets you pick a name + random avatar) or "Create account" (unique user, email, password)
- [ ] Simple signup: password hash with `bcrypt`/`argon2` (Bun has native support for both via `Bun.password`)
- [ ] Session: short JWT or signed session cookie — given the expected low volume, a simple httpOnly cookie session is enough, without a complex refresh token
- [ ] Random avatar: generate via an avatar library (e.g. DiceBear, which has an API/lib that generates deterministic SVG from a seed) — avoids hosting image uploads in a v1

### 3.4 Room creation flow

- [ ] Form: room name, capacity (2-50), password, toggles (voice / video / screen share)
- [ ] Backend generates `roomId` (short and memorable — e.g. 6-8 alphanumeric characters, not a full UUID, to make verbal sharing easier)
- [ ] Password stored hashed in Redis (even if simple, not plaintext)
- [ ] On create, the creator automatically becomes `adminUserId` of the room

### 3.5 Room join flow

- [ ] Field to enter `roomId` + password
- [ ] Backend validates capacity (rejects if `SCARD room:{roomId}:users` >= `maxUsers`)
- [ ] On join: add to the user Set, publish an event via Redis Pub/Sub (`room:{roomId}:events`) to notify the others connected to that room via WebSocket
- [ ] Generate a LiveKit access token (JWT signed by the LiveKit Server SDK) scoped to that specific room

### 3.6 Netflix/OME player sync among participants

- [ ] Room admin pastes the OME stream URL (WebRTC or LLHLS) in the control panel
- [ ] Backend propagates that URL via WebSocket to everyone connected (`stream:started` event with the URL)
- [ ] Frontend: all clients mount the player (OvenPlayer or hls.js, as decided earlier) pointed at the same URL at the same time
- [ ] **On "perfect sync":** because each client consumes WebRTC/LLHLS from OME directly (it is not a central player sending a timestamp), natural sync is already close among them (same live source) — no need to replicate Teleparty-style "seek to the same timestamp" logic for VOD. Small variation between clients (fractions of a second) is acceptable and inherent to live streaming

### 3.7 Voice, video, and screen share via LiveKit

- [ ] Deploy LiveKit server (Docker, same dedicated server) — consider running with its own Redis or a shared one (LiveKit uses Redis internally for multi-node coordination; validate whether sharing the same Redis instance as the app is safe or whether to isolate by namespace/DB index)
- [ ] Backend mints a LiveKit access token per user/room using the Server SDK, honoring room toggles (`voiceEnabled`, `videoEnabled`, `screenShareEnabled` become token permissions — e.g. `canPublish: false` if video is disabled)
- [ ] Frontend integrates `livekit-client` (official JS SDK) + ready-made components (`@livekit/components-react`) to render video/screen tiles and mic/camera/share controls
- [ ] Apply default simulcast (already enabled by default in the SDK, as we validated earlier)

### 3.8 Text chat

- [ ] Dedicated WebSocket (can be the same channel used for room events, with `type: "chat"` on messages)
- [ ] Persistence: write to the Redis List (`room:{roomId}:messages`) only for reconnect/recent history — does not need to outlive the room
- [ ] Broadcast via Redis Pub/Sub to all backend workers/instances connected to that room (relevant if you ever run multiple Hono instances behind a load balancer)

### 3.9 "Empty room = room deleted" logic

- [ ] On disconnect (WS close), remove the user from the Set (`SREM room:{roomId}:users userId`)
- [ ] Check `SCARD room:{roomId}:users` after removal — if `0`, trigger cleanup: delete `room:{roomId}`, `room:{roomId}:users`, `room:{roomId}:messages`
- [ ] **Watch the edge case:** abrupt disconnects (tab close, network drop) do not always fire a clean "leave" — use a small delay/grace period (e.g. 10-15s) before treating the user as really gone, so a fast reconnect (wifi switch, page refresh) does not destroy the room

### 3.10 Deploy

- [ ] Single reverse proxy (Traefik, given your history) routing: `app.seudominio.com` → static frontend, `api.seudominio.com` → Hono, `stream.seudominio.com` → OME, `livekit.seudominio.com` → LiveKit
- [ ] TLS via Let's Encrypt centralized on Traefik for all subdomains
- [ ] Per-service environment variables (LiveKit keys, Redis connection string, etc.)

---

## Important points still to decide

Things worth deciding before or during implementation that were not in the initial scope you described:

1. **Basic moderation:** should the room admin be able to kick or mute someone? Without that, a 50-person room with a leaked password has no abuse control.
2. **Session reconnect:** if someone drops and comes back, should they automatically rejoin the same room (using some saved local token) without typing the password again?
3. **Concurrent room cap / rate limiting:** worth a cap on how many rooms a user can create, and a rate limit on room creation/password attempts, to avoid abuse (room-password brute force, or creation spam).
4. **Room password validation:** brute force is a real risk on short passwords — rate-limit by IP/user on join attempts, not only hash the password.
5. **"Who is sharing screen" indicator:** with multiple people allowed to share (if permitted), the UI needs to make clear who is on screen at the moment, and whether more than one person at a time is allowed.
6. **Absent admin:** what happens if the room admin leaves but people remain? Should someone inherit admin, or does the stream URL stay locked with nobody able to change it?
7. **Visible adaptive quality:** worth a simple "connection quality" indicator so the user understands they are seeing reduced quality on a weak network, avoiding confusion like "why is it blurry?".
8. **Mobile:** should the app work in a mobile browser? That strongly affects how video/screen-share tiles and controls are laid out.
9. **Recording:** do you want to record sessions (LiveKit has native Egress for that)? Worth deciding up front, since it changes the permissions/storage architecture.
10. **Load tests before the real event:** worth simulating a full room (9+ people with video/voice at once) before the real event day, to prove the server holds in practice and not only on paper.
11. **Fallback if OME dies:** if the Netflix stream drops mid-event, the rest of the experience (voice, chat) should keep working — worth ensuring the player treats a stream error in isolation, without breaking the rest of the UI.
12. **Legal/ToS:** worth keeping in mind (not a technical blocker, but context) that retransmitting Netflix content to third parties off the original screen may conflict with Netflix terms of service, regardless of the tool — it is private use among friends, but it is good to be clear about that.

---

## Suggested execution order

1. Phase 1 complete (OME running and validated on its own)
2. Phase 2 complete (OBS broadcasting successfully, quality validated)
3. Phase 3.1 to 3.5 (app skeleton: auth, profile, room create/join — no media yet)
4. Phase 3.6 (integrate the OME stream player in the room)
5. Phase 3.7 (integrate LiveKit — voice first, then video/screen)
6. Phase 3.8 and 3.9 (chat + room cleanup logic)
7. Phase 3.10 (final deploy and load tests with the group before the event)
