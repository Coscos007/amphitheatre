# Operator admin console

Host-facing monitoring for rooms, occupancy, LiveKit SFU traffic, and optional OvenMediaEngine broadcast. This is **not** the theater: guests never use it.

The guest HTTP/WebSocket contract in [api.md](api.md) is unchanged. Types and paths live in `packages/shared` (`adminPaths`, `ADMIN_COOKIE`).

## What it is

| Piece | Where |
|---|---|
| Operator SPA | `apps/admin` (Vite + React + Mantine 9, Titan Cockpit tokens) |
| Admin API | Same Bun process as the theater API, **second listen** |
| Theater | `PORT` / `API_PORT` (default **3001**) — public `/api`, WebSocket, `/health`, `/webhooks` |
| Operator | `ADMIN_PORT` (default **3002**) — `/api/admin/*` only, plus the built admin SPA in production |

The public Hono app does **not** mount `/api/admin`. A guest JWT (`ct_session`) is rejected on the admin port. An admin JWT (`aud: "admin"`, cookie `ct_admin`) is rejected on the theater port.

## Run locally (from source)

```bash
pnpm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
make up
pnpm dev:api
pnpm dev:admin
```

- Admin API: `http://127.0.0.1:3002`
- Admin Vite: `http://localhost:5174` (proxies `/api` to `:3002`, `credentials: include`)

Theater stays `pnpm dev:web` on **5173** → `:3001`. Prefer three terminals (`dev:api`, `dev:web`, `dev:admin`) rather than folding the operator UI into `pnpm dev`.

First boot prints the initial operator username, password, and instance API key **once**, and writes `data/admin-bootstrap.txt` next to the SQLite file (not for `:memory:` tests). Sign in with all three. Later requests send only the `ct_admin` cookie.

## Bind and Docker

| Context | `ADMIN_BIND` | Publish |
|---|---|---|
| `pnpm dev:api` on the host | default `127.0.0.1` | listen locally only |
| Production image | `0.0.0.0` (set in the Dockerfile) | Compose maps `127.0.0.1:3002:3002` |

The process inside the container must listen on `0.0.0.0` or the published port never reaches it. Mapping `127.0.0.1:3002` on the host keeps the console off the public internet. Reach it with an SSH tunnel if you administer a remote VM:

```bash
ssh -L 3002:127.0.0.1:3002 user@your-server
```

Then open `http://127.0.0.1:3002`.

Set `ADMIN_ENABLED=false` to skip the second listen (theater-only).

## Auth

- Login: `POST /api/admin/login` `{ username, password, apiKey }` → `{ id, username, token }` plus httpOnly `ct_admin`.
- Session: `GET /api/admin/session`. Logout: `POST /api/admin/logout`.
- Rate limit + 3-strike / 5-minute lockout (same knobs as room passwords: `LOCKOUT_MAX_FAILURES`, `LOCKOUT_DURATION_MS`). Error `invalid_credentials` (not `invalid_password`).
- Operators: `GET/POST /api/admin/users`, `PATCH /api/admin/users/:id` (password, disabled). You cannot disable the last active operator.
- `POST /api/admin/api-key/rotate` returns the new plaintext key **once**.
- `POST /api/admin/factory-reset` `{ phrase }` wipes rooms, memberships, bans, guest lockouts, and metric samples. Operator accounts and the instance API key stay. The phrase must match `reset permanently`, `resetar permanentemente`, or `restablecer permanentemente` (trim, case-insensitive). The Operators page requires the phrase shown in the active locale before Confirm.

## Rooms and occupancy

`GET /api/admin/rooms` lists **every** SQLite room (public, private, empty). Optional `hideEmpty=true`. Never includes `password_hash`. `streamKey` is admin-only.

Each row: id, name, isPublic, hasPassword, memberLimit, present, uniqueEver, peak, createdAt, broadcast, plus LiveKit/OME snapshots when available.

`peak` is `rooms.peak_members`, updated on create and join as `max(peak, present)`. It does **not** fall when people leave.

**Present / people now / occupied rooms** are theater occupancy (`memberships.left_at IS NULL`) after reconciling with the live WebSocket hub. On API boot, leftover present rows are marked left (no sockets survive a restart). The sampler and admin occupancy GETs also drop rows that are past `WS_GRACE_MS` with no live socket and no pending leave timer. **Unique ever** is every membership row. LiveKit microphone/camera/screen numbers are **published tracks on the SFU now**, not the roster.

`GET /api/admin/rooms/:id` adds members and current LiveKit/OME snapshots. Private rooms are not disguised as 404.

## Metrics (no Prometheus server)

A sampler (default every 15 s, `METRICS_INTERVAL_MS`) scrapes existing endpoints and stores snapshots in SQLite. Retention: `METRICS_RETENTION_DAYS` (default 30). Range query `?range=` is `1h` | `6h` | `24h` | `7d` | `30d` (default **24h**).

| Source | How | What you get |
|---|---|---|
| LiveKit | `GET LIVEKIT_METRICS_URL` Prometheus **text** (default `http://127.0.0.1:6789/metrics` on the host; `http://livekit:6789/metrics` in Compose) | Node bytes and quality. Packet bytes have **no** `room` label. |
| LiveKit RoomService | `ListRooms` / `ListParticipants` | Occupancy, track source, announced layer bitrate. Fan-out = announced bitrate times subscribers — labeled **estimate**, never measured bytes. |
| OME | REST list + stream stats (same client as theater) | Bytes/throughput and WebRTC vs LL-HLS connections **per stream**, joined to `room.id` via `stream_key`. |

If OME is down or LiveKit `/metrics` is unreachable, admin GETs stay **HTTP 200** with `healthy` / `metricsReachable` flags and empty or null numbers.

## Admin routes

All except login/logout require `ct_admin` (or `Authorization: Bearer` with an admin JWT).

| Method | Path |
|---|---|
| POST | `/api/admin/login` |
| POST | `/api/admin/logout` |
| GET | `/api/admin/session` |
| GET | `/api/admin/overview` |
| GET | `/api/admin/rooms` |
| GET | `/api/admin/rooms/:id` |
| GET | `/api/admin/rooms/:id/metrics` |
| GET | `/api/admin/metrics/livekit` |
| GET | `/api/admin/metrics/ome` |
| GET | `/api/admin/users` |
| POST | `/api/admin/users` |
| PATCH | `/api/admin/users/:id` |
| POST | `/api/admin/api-key/rotate` |
| POST | `/api/admin/factory-reset` |

## Environment

| Variable | Default | Use |
|---|---|---|
| `ADMIN_PORT` | `3002` | Operator listen port |
| `ADMIN_BIND` | `127.0.0.1` | Operator bind. Use `0.0.0.0` in Docker. |
| `ADMIN_ENABLED` | `true` | Second `Bun.serve` |
| `LIVEKIT_METRICS_URL` | `http://127.0.0.1:6789/metrics` | Prometheus text scrape |
| `METRICS_INTERVAL_MS` | `15000` | Sampler period |
| `METRICS_RETENTION_DAYS` | `30` | Prune samples older than this |
| `CORS_ORIGIN` | includes `http://localhost:5174` in dev defaults | Admin Vite origin when not same-origin |

Dev Compose already publishes LiveKit metrics on `127.0.0.1:6789`. The API on the host uses that default URL. Inside the production Compose network, set `LIVEKIT_METRICS_URL=http://livekit:6789/metrics`.
