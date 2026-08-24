<div align="center">

<img src="docs/images/amphitheatre-wordmark.webp" alt="Amphitheatre" width="480">

<br />

[![License](https://img.shields.io/badge/license-AGPL--3.0-orange)](LICENSE)
[![LiveKit](https://img.shields.io/badge/LiveKit-v1.13.5-blue)](https://livekit.io)
[![OME](https://img.shields.io/badge/OME-v0.21.0-orange)](https://github.com/OvenMediaLabs/OvenMediaEngine)
[![Bun](https://img.shields.io/badge/Bun-1.2+-000000)](https://bun.com)
[![Valkey](https://img.shields.io/badge/Valkey-9.1.1-red)](https://valkey.io)

Open-source theater rooms. Chat, voice, camera, and an optional shared live stage. No sign-up.

</div>

## Contents

- [What is Amphitheatre?](#what-is-amphitheatre)
- [Features](#features)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [How to Contribute](#how-to-contribute)
- [License](#license)

## What is Amphitheatre?

Amphitheatre is an open-source theater for small groups (2–50 people). It gives you **text chat**, **voice**, **camera**, and **screen share** in ephemeral rooms — plus an optional stage so everyone watches the **same live broadcast**.

It is not a full Discord (no persistent servers, email accounts, or bots). It is not a Netflix client. [OvenMediaEngine](https://github.com/OvenMediaLabs/OvenMediaEngine) is a generic ingest/playback server; retransmitting a third-party commercial catalog may conflict with that provider's terms. Amphitheatre does not assume or implement that use.

Identity is guest-only (JWT). Room state lives in SQLite. Voice, camera, screen share, and chat **never** require OvenMediaEngine. Session recording is out of scope.

## Features

- Guest JWT identity — no accounts. The same `userId` keeps its role when rejoining a room.
- Real-time text chat (WebSocket, 1–1024 characters, flood soft-ban).
- Voice, camera, and screen share via LiveKit, with speaking, transmitting, and connection-quality indicators.
- Optional shared stage: OvenMediaEngine (OBS), Twitch, YouTube, Kick, or a custom URL — **off by default**.
- OME is independent: chat and WebRTC keep working if OME is down.
- Persistent roles: `owner` > `admin` > `moderator` > `member`. The room `ownerId` is immutable.
- Kick, mute, ban/unban; password lockout (3 failures / 5 minutes).
- First-class desktop and mobile layouts (mobile is not a shrunk desktop).
- UI locales `en`, `pt-BR`, `es`. Light/dark design tokens.

## Quick Start

Requires [Bun](https://bun.com) 1.2+, [pnpm](https://pnpm.io) 10+, and Docker.

```bash
pnpm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
make up      # LiveKit + Valkey; OME off
pnpm dev     # API :3001, web :5173
```

Open [http://localhost:5173](http://localhost:5173). Health: `GET http://localhost:3001/health` should return `{ "ok": true }`.

OBS ingest is optional:

```bash
make ome-up
```

The API starts even when OME is stopped. Full walkthrough: [Getting started](docs/getting-started.md).

## Documentation

| Guide | Covers |
|---|---|
| [Getting started](docs/getting-started.md) | Install, `make up` / `make ome-up`, smoke checks |
| [Configuration](docs/configuration.md) | Environment variables |
| [HTTP / WebSocket API](docs/api.md) | Frozen contract |
| [Identity and moderation](docs/identity.md) | Guests, roles, bans, lockout |
| [Broadcast and OBS](docs/broadcast.md) | Opt-in stage, stream key, OvenPlayer |
| [Architecture](docs/architecture.md) | Monorepo, stores, OME independence |
| [License and CLA](docs/license.md) | Why AGPL, ICLA, dual-license |
| [Infrastructure](infra/README.md) | Compose, UDP/TLS ports |
| [Load testing](docs/load-testing.md) | Capacity; recording is forbidden |
| [AGENTS.md](AGENTS.md) | Instructions for coding agents |
| [Design](apps/web/DESIGN.md) | SPA tokens |

## How to Contribute

Thank you for contributing. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, tests, and the pull-request flow.

Pull requests need the [Individual Contributor License Agreement](CLA.md). The CLA Assistant bot comments on the PR with the signature sentence.

## License

Amphitheatre is licensed under [AGPL-3.0-only](LICENSE), copyright [SIMSDEV](https://sims.dev.br).

The public tree stays AGPL so anyone who hosts a modified version as a network service must offer the corresponding source. SIMSDEV may dual-license contributions (including a future paid hosted offering) through the [ICLA](CLA.md). Details: [License and CLA](docs/license.md).
