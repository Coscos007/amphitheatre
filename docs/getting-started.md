# Getting started

Run Amphitheatre locally **from source**, for development. If you just want to run your own copy on a server (no coding involved), see [Self-hosting](self-hosting.md) instead — you do not need to clone this repository for that.

For Compose ports, profiles, and UDP/TLS, see [infra/README.md](../infra/README.md). For env vars, see [Configuration](configuration.md).

## Prerequisites

- [Bun](https://bun.com) 1.2+
- [pnpm](https://pnpm.io) 10+ (`packageManager`: pnpm@11.22.0)
- Docker Compose v2 (LiveKit + Valkey; OvenMediaEngine is optional)

## Install

From the repository root:

```bash
pnpm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

Do not invent secrets and do not commit `.env`. Values in the example files are development placeholders.

## Voice, camera, and chat (no OME)

```bash
make up
# equivalent: docker compose up -d
pnpm dev
```

`make up` starts **LiveKit + Valkey**. Voice, camera, screen share, and chat work **without** OME.

- API: `http://localhost:3001` (Bun `--hot`)
- Web: `http://localhost:5173` (Vite proxies `/api`, including WebSocket, to `:3001`)

You can start the apps separately: `pnpm dev:api` and `pnpm dev:web`.

## Optional: OBS / OvenMediaEngine

```bash
make ome-up
# equivalent: docker compose --profile ome up -d
```

Start OME only when you have OBS ingest or an ffmpeg fixture. Stop OME alone with `make ome-down`. Stop everything with `make down`.

The API starts even when OME is down. Chat, voice, camera, and screen share **never** require `ome.healthy`.

Broadcast and OBS details: [Broadcast and OBS](broadcast.md).

## Checks

- `GET http://localhost:3001/health` → `{ "ok": true }`
- `make smoke` — infrastructure health; missing OME is not a LiveKit failure
- SPA: `http://localhost:5173`

## Tests

```bash
pnpm test        # bun test in apps/api
pnpm typecheck   # @coliseum/shared + @coliseum/api + @coliseum/web
```

Load and stress: [load-testing.md](load-testing.md).
