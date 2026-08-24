# Configuration

Copy `.env.example` (repo root) and `apps/api/.env.example`. Do not invent secrets and do not commit `.env`. Values in those files are development placeholders.

The API loads the monorepo root `.env` first, then `apps/api/.env` (`apps/api/src/env.ts`).

## Variables

| Variable | Use |
|---|---|
| `API_PORT` / `PORT` | API HTTP port (default **3001**) |
| `CORS_ORIGIN` | Vite origins, comma-separated (cookies) |
| `SESSION_SECRET` | HMAC for the guest JWT (`ct_session`) |
| `DATABASE_PATH` | SQLite file |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_URL` | JWT mint + SDK |
| `LIVEKIT_HTTP_URL` | RoomService / health (default: `LIVEKIT_URL` with `http`) |
| `OME_API_URL` | OME REST (`http://localhost:8081`) |
| `OME_API_ACCESS_TOKEN` | Basic auth; **must match** `infra/ome/origin_conf/Server.xml` |
| `OME_RTMP_URL` | OBS ingest (alias: `OME_RTMP_INGEST_URL`) |
| `OME_PLAYBACK_URL` | WebRTC playback (alias: `OME_WEBRTC_PLAYBACK_BASE`) |
| `OME_LLHLS_PLAYBACK_BASE` | LL-HLS fallback |
| `LOCKOUT_MAX_FAILURES` / `LOCKOUT_DURATION_MS` | Default 3 failures / 300000 ms |
| `MAX_ROOMS_PER_CREATOR` / `MAX_ROOMS_PER_IP` / `MAX_MEMBERS_PER_ROOM` / `MAX_CONCURRENT_ROOMS` | Caps |

LiveKit: `LIVEKIT_API_SECRET` must be at least 32 characters and must **not** contain `:`. Compose mounts `LIVEKIT_KEYS` as `"key: secret"`.

Full comments live in `.env.example` and `apps/api/.env.example`. UDP/TLS ports: `infra/livekit/livekit.yaml`, `infra/ome/origin_conf/Server.xml`, [infra/README.md](../infra/README.md).
