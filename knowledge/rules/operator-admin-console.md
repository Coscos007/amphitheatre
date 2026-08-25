---
type: Rule
title: Operator admin console
description: Host monitoring UI on a separate bind/port, distinct admin identity, scraped LiveKit /metrics plus OME REST stats, no Prometheus server required.
tags: [admin, observability, livekit, ome, security]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-25T19:00:00Z }
sources:
  - id: livekit-yaml
    resource: infra/livekit/livekit.yaml
    title: prometheus.port 6789
  - id: ome-client
    resource: apps/api/src/ome.ts
    title: OME REST poll
  - id: load
    resource: docs/load-testing.md
    title: LiveKit /metrics and OME stats URLs
  - id: design
    resource: apps/web/DESIGN.md
    title: Titan Cockpit tokens
  - id: clients
    resource: /product/clients/clients.md
    title: Theater is not Next.js
---

# Rule

The operator console is a **separate Vite SPA** (`apps/admin`, Mantine 9, Titan Cockpit tokens from `apps/web/DESIGN.md`). It is **not** Next.js, **not** mixed into `@coliseum/web`, and **not** served on the theater port.

## Bind

Same Bun process, **second listen**:

- Theater + public `/api` + `/webhooks` + `/health` on `PORT` (default 3001).
- Admin UI + `/api/admin/*` only on `ADMIN_PORT` (default 3002), bind `ADMIN_BIND` (default `127.0.0.1`).

Public app **must not** mount admin routes. Admin app **must not** accept guest JWT (`ct_session`) or theater paths. Docker publishes the admin port on localhost unless the operator explicitly maps it.

## Auth

Distinct identity from room guests.

- First boot: generate initial username + password + **instance API key**; store **hashes** in SQLite; print plaintext **once**.
- Login: username + password + API key. After that, httpOnly cookie `ct_admin` and an admin JWT (`typ`/`aud` admin — guest tokens never work).
- Every `/api/admin/*` method requires a valid admin session. API key is **not** sent on later requests.
- Operators are CRUD in SQLite. Rate-limit and lock out admin login.

## Rooms list

List **all** SQLite rooms (public, private, empty). Never return `password_hash` or the room password. `stream_key` is admin-only. Default view includes empty rooms; UI filter can hide them.

Per room, persist and show at least: current present members, unique members ever, **peak concurrent** (column updated on join), LiveKit track breakdown, OME live flag.

**Present / people now / occupied rooms** mean theater occupancy: `memberships.left_at IS NULL` after reconciling with the live WebSocket hub. A crashed tab or API restart must not keep ghosts forever. Reconcile on boot (mark all present as left — there are no sockets yet), on the metrics sampler, and on admin occupancy GETs. Skip rows that still have a live socket, a pending `WS_GRACE_MS` leave timer, or that joined inside that grace window (HTTP join to WS attach). **Unique ever** is every membership row. **Peak** is historical `rooms.peak_members` and does not fall when people leave.

LiveKit microphone/camera/screen counts are **published tracks on the SFU right now**, not the theater roster. The console KPI cards explain each number with a help tooltip.

Operators may factory-reset theater state (`POST /api/admin/factory-reset`) after typing a confirmation phrase accepted in any locale: `reset permanently`, `resetar permanentemente`, or `restablecer permanentemente` (trim, case-insensitive). That wipe deletes rooms, memberships, bans, guest lockouts, and metric samples. It keeps `admin_users` and the instance API key. In-memory chat is cleared. Guest paths stay unchanged.

## Metrics (v1, no Prometheus server)

Do **not** add a Prometheus/Grafana container as a requirement. The API **scrapes** existing endpoints and stores snapshots in SQLite (user-selectable range, **default 24h**, options at least 1h / 6h / 24h / 7d / 30d).

**LiveKit:** `GET {LIVEKIT_METRICS_URL}` (Prometheus **text** on `:6789/metrics`, already enabled). Parse counters/gauges/histograms we care about; compute rates from counter deltas (handle process restart). This is **node-level** for bytes (`livekit_packet_bytes` labels are `direction`, `transmission`, `country` — **no room**). Quality metrics (`packet_loss`, `rtt`, `jitter`) **do** label `source` + `type` (microphone / camera / screen_share, audio / video). Per-room LiveKit **bytes** are not in `/metrics`; complement with RoomService `ListRooms` / `ListParticipants` (occupancy, track source, announced layer bitrate). Label any fan-out figure as **estimate**, never as measured bytes.

**OME:** no native `/metrics`. Use REST already documented: list streams + `/v1/stats/current/...` (per vhost, app, stream). Join `stream_key` to `room.id`. OME down must not take the console down.

Do not invent per-room LiveKit Mbps by silently splitting node bytes. Do not use LiveKit Egress or OME File/DVR to “measure”.

## Contract

`/api/admin/*` is a new namespace. Do not change guest paths. Types live in `packages/shared`. i18n `en` / `pt-BR` / `es`. No emoji.

# Related

- [Operator admin (product)](/product/operator-admin/operator-admin.md)
- [OME independent of WebRTC](/rules/ome-independent-of-webrtc.md)
- [No recording](/rules/no-recording.md)
- [API contract frozen](/rules/api-contract-frozen.md)
- [Clients](/product/clients/clients.md)
