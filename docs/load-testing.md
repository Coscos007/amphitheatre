# Load and stress testing — Amphitheatre

Operator document to validate a full room **before** an event. Infra (LiveKit + Valkey + optional OME) comes up with `make up` / `make ome-up`. The Hono API (`:3001`) and SPA (`:5173`) are part of this plan; scripts in `infra/loadtest/` still assume **old** HTTP paths in places (see §14).

**Out of scope (do not implement, do not measure, do not “use the test to record”):**

- LiveKit Egress / room composite / track egress
- OME File publisher, DVR, dump, rewind
- Any MP4/HLS write to disk “to analyze later”
- A custom reconnect protocol (LiveKit SDK defaults only)

If a scenario needs “VOD of what just happened”, the test is wrong — the product does not record.

---

## 1. Hypothesis and target capacity

Product: ephemeral rooms, **2–50** people, one (rarely a few) OME transmissions per room, several LiveKit publications (mic + optional camera + screen share).

**Reference capacity for the event** (adjust the table in §12 after the first rehearsal):

| Resource | “Watch-party night” rehearsal target | Stress ceiling (abort if it degrades) |
| --- | --- | --- |
| Concurrent rooms | 10 | 30 |
| Members / room | 20 | 50 (product cap and `livekit.yaml`) |
| Active audio publishers / room | 1–3 actually speaking; up to 20 mics published | 50 mics (terrible UX, useful to find the limit) |
| Camera publishers / room | 4 | 12 |
| LiveKit screen shares / room | 1 | 3 |
| OME RTMP ingest / process | 1 per room that is “on the film” | 4 ingests on the same host (Opus transcoder CPU) |
| OME WebRTC viewers / stream | = room members | 50 |
| OME LL-HLS viewers / stream | fallback | 50 |

The dedicated host needs enough **upload**:
`members × (audio ~50 kbps + simulcast cameras + 1 screen ~2–6 Mbps) + 1 RTMP at 6–8 Mbps`.
If home uplink is 20 Mbps, **20 webcams will not fit**. Load testing from a laptop on the same Wi-Fi **lies** — use a cloud VM for the generator (official `lk load-test` recommendation).

---

## 2. Environment and tools

| Tool | Role |
| --- | --- |
| `docker stats` | CPU/RAM/NET I/O per container (`coliseum-livekit`, `coliseum-ome`, `coliseum-valkey`) |
| `curl` + `make smoke` | Health before/after; OME independence |
| [k6](https://k6.io) | API HTTP: create room, join, brute-force, rate limit |
| [LiveKit CLI `lk`](https://github.com/livekit/livekit-cli) | `lk load-test` (simulcast publishers/subscribers) |
| `ffmpeg` / `infra/scripts/ffmpeg-ome-fixture.sh` | Repeatable RTMP ingest without OBS |
| OBS | “Real” fixture (NVENC/x264, GOP 1 s) — 1 process per ingest |
| Prometheus `http://127.0.0.1:6789/metrics` | LiveKit metrics (published on localhost only) |
| DevTools / Safari Web Inspector | Phone: ICE, freeze, background |
| `tc` / Network Link Conditioner | Loss, jitter, bandwidth (do not rely on “bad Wi-Fi” alone) |

Quick install:

```bash
# k6: https://grafana.com/docs/k6/latest/set-up/install-k6/
# lk:
brew install livekit-cli   # or the official binary
export LIVEKIT_URL=ws://localhost:7880
export LIVEKIT_API_KEY=devkey
export LIVEKIT_API_SECRET=coliseum-dev-livekit-secret-change-me
```

**Do not** run the media generator (dozens of publishers) on the same machine as the SFU if the goal is to find the **server** limit. Run the SFU on the dedicated host and `lk load-test` on a VM.

---

## 3. Metrics to collect (always)

Log in a spreadsheet (timestamp, git SHA, `docker compose images`):

**Host / Docker**

- `docker stats --no-stream` every 15 s: `%CPU`, `Mem`, `Net I/O`, `Block I/O` (OME/LiveKit Block I/O **climbing without stop** = someone turned on dump/recording — abort)
- Load average, `ss -s` / UDP connections
- Temperature / thermal throttle (laptop)

**LiveKit (`:6789/metrics` + `lk load-test` report)**

- Aggregate bitrate in/out
- Packet latency / nack
- Tracks subscribed vs expected
- `% dropped` in the load-tester report
- Announced quality (`connectionQuality`) sampled in the SPA (excellent/good/poor)

**OME REST** (`Authorization: Basic …`)

- `GET /v1/stats/current/vhosts/default/apps/app/streams/{streamKey}`
  `totalConnections`, `connections.webrtc`, `connections.llhls`, `lastThroughputIn/Out`
- `GET /v1/vhosts/default/apps/app/streams` — live list (must not “leak” old test streams)

**Hono API**

- `http_req_duration` p50/p95/p99 (k6)
- Rate of `429` (rate limit) vs `locked_out` / `invalid_password` / `cannot_join` vs `401`
- 5xx errors (= abort)

**Client**

- Time to first OME frame (WebRTC vs LL-HLS)
- Apparent drift between two browsers on the same stream (target: fractions of a second, live)
- ICE connected time (LiveKit and OME)
- Battery % / 10 min on iOS Safari and Chrome Android

---

## 4. Global success criteria

A rehearsal **passes** if, on the plateau (not the ramp):

1. No container restarts (`docker compose ps` healthy).
2. LiveKit: dropped frames **&lt; 2%** on `lk load-test`; media latency p95 **&lt; 250 ms** on LAN.
3. OME WebRTC: viewers = members; ingest `lastRecvTime` updates; subjective latency **&lt; 1 s**.
4. OME LL-HLS: subjective latency **1–3 s**; playlist `llhls.m3u8` 200.
5. API: HTTP p95 **&lt; 500 ms**; 5xx **&lt; 0.1%**.
6. Brute-force: 4th wrong password is **not** a normal `invalid_password` — it is `locked_out` with `retryAfterMs` (~5 minutes).
7. Independence: with `make ome-down`, join + LiveKit mic + chat **continue**; only the OME player fails in isolation.
8. Cap 50: the 51st join is refused by the **API** (`room_full`, 409); LiveKit `max_participants: 50` is a safety net.
9. Zero new recording files in Docker volumes.

**Immediate abort (stop the ramp):**

- LiveKit or OME CPU **&gt; 90%** for 60 s
- Valkey `maxmemory` / `OOM` errors (policy `noeviction` — writes fail)
- API 5xx **&gt; 2%** in a 30 s window
- LiveKit dropped packets **&gt; 10%**
- OME stops updating `lastRecvTime` while ingest is still up
- Any container `unhealthy` / restart loop
- Evidence of dump/DVR writes

---

## 5. Ramp profiles (use these names in logs)

| Profile | Duration | What |
| --- | --- | --- |
| `smoke` | 2 min | 1 room, 2 users, 1 mic, no OME — `make smoke` + manual join |
| `ramp-s` | 10 min | 0→5 rooms, 5 members each, audio only |
| `ramp-m` | 20 min | 0→10 rooms, 15 members, 4 cams + 1 screen / room |
| `event` | 45 min plateau | 10×20 (or the real event N) + 1 OME ingest on the “main” room |
| `soak` | 3 h | `event` at 50% load — memory leak / Valkey |
| `spike` | 2 min | Double subscribers at once (mass join) |
| `break` | until abort | Raise video publishers until the abort criterion |

Typical k6 API ramp: `30s → 10 VUs`, `1m → 25`, `30s → 0`. Do not mix a media `break` with an HTTP `break` in the same minute — you will not know the cause.

---

## 6. Hono API (`:3001`) — k6 scenarios

Script: `infra/loadtest/k6/api-rooms.js`.

```bash
k6 run -e API_BASE=http://localhost:3001 infra/loadtest/k6/api-rooms.js
```

**Known gap:** the script still calls old paths (`POST /rooms`, `maxUsers`). The frozen contract is `/api/...` with `memberLimit` — [docs/api.md](api.md). Align k6 **to** the contract when you touch load tests. `apps/api/src/env.ts` already defines `LOCKOUT_MAX_FAILURES=3` and `LOCKOUT_DURATION_MS=300000`.

### 6.1 Create room

- Payload (contract): `name`, `password?`, `memberLimit?` (2–50), `isPublic?`
- Expected: `2xx`, short `roomId` (8 chars), creator is owner
- Stress: 25 VUs creating rooms — should hit the **create rate limit** (`429` + `retryAfterMs`) before SQLite fills with junk rooms
- Concurrent-room cap: API env (`MAX_CONCURRENT_ROOMS`). Above that: `429`, not 5xx

### 6.2 Join

- Happy path: correct password → LiveKit token + media payload (OME URLs empty if broadcast is off)
- Room full: `room_full` **409** — must **not** enter LiveKit
- Parallel join (spike): 40 clients on the same `roomId` with `memberLimit=20` — exactly 20 `2xx`, the rest rejected

Private failed join: `cannot_join` (does not distinguish missing room vs wrong password). Public wrong password: `invalid_password`.

### 6.3 Password brute-force (required)

Product rule: **3 failures → 5 min lockout** (IP and/or `userId`).

Procedure:

1. Create a room with a known password.
2. From the same IP, 3× `POST /api/rooms/:id/join` with the wrong password → `invalid_password` / `cannot_join`.
3. 4th attempt (right or wrong) → `locked_out` with `retryAfterMs` ≈ 300000.
4. From **another** IP, the correct password still joins (lockout is not global).
5. After 5 min, the locked IP can try again.

The k6 `passwordBruteForce` scenario covers 1–3 if the script is aligned to `/api`. Steps 4–5 are manual or a second scenario with `http.debug`.

**Do not** use 4-digit passwords at a real event; the test exists because the risk is real.

### 6.4 Rate limits (API, not infra)

Separate scenarios (one aggressive VU):

| Endpoint | Suggested dev ceiling | Expected |
| --- | --- | --- |
| `POST /api/rooms` | 5/min/IP | `429` |
| `POST /api/rooms/:id/join` | 20/min/IP besides password lockout | `429` |
| WS chat messages | flood: 6 / 8 s → soft-ban 60 or 120 s | `system` `chat_slow` |
| LiveKit token mint | 30/min/user | `429` (avoids flooding peer connections) |

Check that 429 happens **before** LiveKit opens dozens of ghost rooms (`auto_create: true` on the SFU — the API should create the room explicitly or live with that).

### 6.5 Concurrent rooms and members

- 10 VUs × create + 10 joins each (`ramp-m` HTTP-only, no media) — SQLite, not Valkey DB 0
- Isolation: room A chat must not appear in B
- Empty room: last leave + WS grace (`WS_GRACE_MS`, default 15 s). LiveKit `departure_timeout: 20` is aligned with that. Rooms are **not** auto-deleted from SQLite today.

---

## 7. LiveKit — publishers, subscribers, speaking, quality

Prep: `make up`, `LIVEKIT_*` in the shell.

### 7.1 Video publishers (simulcast)

```bash
lk load-test \
  --url ws://localhost:7880 \
  --api-key "$LIVEKIT_API_KEY" \
  --api-secret "$LIVEKIT_API_SECRET" \
  --room coliseum-load \
  --video-publishers 8 \
  --duration 2m
```

The tester publishes simulcast 720p/360p/180p. That is the proxy for “N cameras”.

Criterion: report with tracks `N/N`, dropped ~0 on LAN.

### 7.2 Audio / speaking indicators

```bash
lk load-test --room coliseum-load --audio-publishers 5 --duration 1m
```

Then open a real client (`lk token create --join --room coliseum-load --identity observer --open meet` or the SPA) and confirm **active speakers** changing. The server uses `audio.update_interval` default 500 ms (`livekit.yaml`).

UX scenario: 20 mics published, 1 person speaking — the indicator must not mark all 20.

### 7.3 Screen share

`lk load-test` does not replace a real share. Manual:

1. 1 screen publisher 1080p30 + 15 subscribers in the SPA
2. Two more concurrent shares — CPU and uplink spike
3. Stop share: subscribers drop the track without killing the room

### 7.4 Mix N publishers × M subscribers (event)

```bash
lk load-test \
  --room coliseum-event \
  --video-publishers 5 \
  --subscribers 20 \
  --duration 5m
```

Scale `subscribers` on the `break` profile (50, 100) **from a VM**. On `event`, 5×20 is already heavier than many watch parties (film on OME, LiveKit voice only).

### 7.5 Packet loss and connection quality

On the generator or a client:

```bash
# Linux (example 5% loss, 50ms delay) — do NOT run this on the SFU, run it on the client
sudo tc qdisc add dev eth0 root netem delay 80ms 20ms loss 5%
```

macOS: Network Link Conditioner (“3G” / “Lossy” profile).

In the SPA, `connectionQuality` should drop to `poor` and simulcast should drop a layer. When you remove netem, it should return to `good`/`excellent` without a forced reconnect (SDK reconnect only if the WS drops).

### 7.6 Reconnect (low priority — sanity only)

- Airplane mode 3 s on a phone: should reconnect to the **same** room without a new password prompt if the API session is still valid
- Do not write a new protocol; if it fails, log it and move on. Abort only if the whole room dies

---

## 8. OvenMediaEngine

Prep: `make ome-up`, correct `OME_HOST_IP` (LAN if a phone is involved).

### 8.1 Concurrent RTMP ingest

```bash
infra/scripts/ffmpeg-ome-fixture.sh sala01 &
infra/scripts/ffmpeg-ome-fixture.sh sala02 &
infra/scripts/ffmpeg-ome-fixture.sh sala03 &
```

Confirm:

```bash
TOKEN=$(printf '%s' "$OME_API_ACCESS_TOKEN" | base64 | tr -d '\n')
curl -s -H "Authorization: Basic $TOKEN" \
  http://localhost:8081/v1/vhosts/default/apps/app/streams
```

Expected: `["sala01","sala02","sala03"]`. A fourth ingest on the **same** stream name should fail (`BlockDuplicateStreamName`).

CPU: ABR (`abr_stream`: bypass 1080 + transcode 720/480) + Opus. This test is CPU-bound on the OME host — measure before the event.

Real OBS: 1 machine, 1080p60 CBR 6000, keyframe 1 s, pointing at `rtmp://HOST:1935/app/{streamKey}`. Compare **OBS workstation** CPU (software DRM decode) with **OME server** CPU.

### 8.2 Concurrent WebRTC viewers

N browsers / OvenPlayer on `ws://HOST:3333/app/{streamKey}/webrtc`.
REST: `connections.webrtc` ≈ N.
Latency: clap on the source and watch the player (sub-second target).

### 8.3 Concurrent LL-HLS viewers

`http://HOST:3333/app/{streamKey}/llhls.m3u8` (native Safari; Chrome + hls.js).
`connections.llhls` ≈ N. Latency 1–3 s. CORS `*` in dev.

Mix 10 WebRTC + 10 LL-HLS on the same ingest — ingest is still one.

### 8.4 Independence test (required)

Script:

1. `make up && make ome-up` — room with chat + mic + OME player on the fixture
2. `make ome-down` **without** taking LiveKit down
3. `make smoke` — LiveKit OK, OME skip
4. Mic, speaking indicator, and chat **keep going**
5. OME player shows an isolated error; it must not unmount the room
6. `make ome-up` + republish ffmpeg — player returns; LiveKit **must not** require a re-login

If compose `depends_on` ties LiveKit to OME, this test fails at the cause (do not “handle it in the UI”).

### 8.5 OME down mid `event` plateau

During `lk load-test` + chat: kill OME. The LiveKit metric series **must not** collapse. Only OME `connections.*` go to zero.

---

## 9. Mobile Safari / Chrome

Do this **after** desktop LAN passes. `OME_HOST_IP` and LiveKit `node_ip` = LAN IP, not `127.0.0.1`. Mac firewall: allow UDP 7882 and 10000–10003.

| Case | How | Success | Typical failure (cause) |
| --- | --- | --- | --- |
| iOS Safari Wi-Fi | 1 OME WebRTC viewer + 1 LiveKit mic | Two-way audio, OME video &lt; 1 s | ICE `failed`: announced IP is the Docker bridge |
| Chrome Android Wi-Fi | same | same | Battery saver killing UDP |
| Safari 4G/5G | LiveKit voice only + OME LL-HLS (WebRTC may fail) | LL-HLS plays; voice via TCP `7881` or TURN | UDP blocked — open TURN 3479 / OME 3478 on the firewall |
| Background tab Safari | 30 s in background, return | LiveKit reconnects or pauses; OME may need `play()` again | Must not kill the SQLite membership |
| Portrait/landscape rotate | SPA | Tiles do not freeze; OME player resizes | Layout only — not an infra bug |
| Battery | 10 min 1080p OME + 4 tiles | Documented drain (e.g. &lt; 15% / 10 min on a recent iPhone) | 1080p60 + 4 cams is abuse; use LL-HLS or a low layer |
| ICE failure inject | Block UDP on the router | TCP/TURN fallback &lt; 8 s | No TURN and no 7881 on NAT — cause, not “retry in the UI” |

iOS **does not** play WebRTC over HTTP (except localhost). On LAN use an IP or HTTPS (profile `caddy` + cert).

---

## 10. Valkey and leftovers

- LiveKit uses Valkey **DB 1** only. The API uses **SQLite** (`DATABASE_PATH`). Do not treat Valkey as room state.
- `INFO memory` during soak: used memory should stabilize
- Do not `FLUSHALL` (wipes every DB). `FLUSHDB` only with `SELECT 1` during maintenance
- `maxmemory-policy noeviction`: if Valkey refuses writes, the load test **exceeded the ceiling** — abort, do not switch on LRU

---

## 11. Observability during the rehearsal

```bash
docker stats coliseum-livekit coliseum-ome coliseum-valkey
curl -s http://127.0.0.1:6789/metrics | head
make logs ARGS=livekit
```

Correlation: a CPU spike on OME with a stable `lk load-test` = ingest/transcode, not the SFU. The reverse is also true.

---

## 12. Result table (fill in during the rehearsal)

| ID | Scenario | Profile | N / M | Pass? | p95 / drop / CPU | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| A1 | smoke stack | smoke | — | | | `make smoke` |
| A2 | create+join k6 | ramp-s | | | | |
| A3 | brute-force 3+lockout | — | 1 room | | | 4th = `locked_out` |
| A4 | cap 50 members | spike | 51st | | | API refuse |
| L1 | 8 video publishers | ramp-s | 8 / 0 | | | `lk load-test` |
| L2 | 5 audio + speakers | ramp-s | 5 / 1 observer | | | |
| L3 | 5 cam + 20 sub | event | 5 / 20 | | | |
| L4 | netem 5% loss | — | 2 / 2 | | | quality poor→good |
| L5 | 1 screen 1080 + 15 sub | event | 1 / 15 | | | manual SPA |
| O1 | 3 ingest ffmpeg | ramp-s | 3 streams | | | REST list |
| O2 | 20 WebRTC viewers | event | 1 / 20 | | | |
| O3 | 20 LL-HLS viewers | event | 1 / 20 | | | |
| O4 | ome-down mid-call | event | — | | | independence |
| M1 | iOS Safari Wi-Fi | — | 1 | | | ICE |
| M2 | iOS 4G | — | 1 | | | TURN/TCP |
| M3 | background + rotate | — | 1 | | | |
| S1 | soak 3 h 50% | soak | | | | Valkey/SFU mem |
| X1 | record session | — | — | **DO NOT RUN** | | out of scope |

---

## 13. Recommended weekend rehearsal order

1. `make down && make up && make smoke`
2. A2–A4 (API)
3. L1 → L3 → L4
4. `make ome-up` → O1 → O2 → O3 → O4
5. L3 **in parallel** with O2 (film + voice) — this is the event rehearsal
6. Mobile M1–M3
7. Soak if the event is long
8. Never turn on egress “just to have a replay”

---

## 14. Known gaps (infra vs app)

- k6 against `:3001` still uses old paths (`POST /rooms`, `maxUsers`) in `infra/loadtest/k6/api-rooms.js`. Frozen contract: [docs/api.md](api.md). Align the script when you touch load tests.
- 5 min lockout, rate limit, and room caps are **API** (SQLite + in-memory). Infra only offers LiveKit `max_participants: 50` and Valkey without eviction for LiveKit DB 1.
- `lk load-test` does not exercise DRM/OBS screen share; keep 1 human OBS fixture
- Adaptive quality in the UI depends on the frontend reading `connectionQuality` (implemented) and OME ABR in `Server.xml` (implemented)
