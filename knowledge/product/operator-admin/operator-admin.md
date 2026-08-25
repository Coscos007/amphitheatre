---
type: Product
title: Operator admin console
description: Host-facing monitoring of rooms, occupancy, LiveKit SFU traffic, and optional OME broadcast — separate port from the theater.
tags: [admin, observability, self-host]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-25T19:45:00Z }
sources:
  - id: rule
    resource: /rules/operator-admin-console.md
    title: Operator admin console rule
  - id: admin-app
    resource: apps/admin/src/main.tsx
    title: Operator SPA
  - id: admin-api
    resource: apps/api/src/admin-app.ts
    title: Admin Hono on ADMIN_PORT
  - id: design
    resource: apps/web/DESIGN.md
    title: Titan Cockpit
---

# Implemented

Self-hosters get a monitoring cockpit so the media stack is not a black box: rooms (including empty and private, without passwords), people (current / unique / peak), LiveKit voice+camera+screenshare consumption at the **node**, and OME ingest/playback consumption **per stream/room**.

**Client:** `apps/admin` — Vite + React + Mantine 9, Titan Cockpit tokens. Not Next.js; not inside `@coliseum/web`.

**Listen:** dedicated `ADMIN_PORT` / `ADMIN_BIND` (default localhost). Theater stays on the public port.

**Identity:** bootstrap admin user + instance API key in SQLite; session cookie `ct_admin` after login. API key is not sent after login.

**Data:** SQLite occupancy + `peak_members` after reconciling stale `left_at IS NULL` rows with the live theater WebSocket hub (ghosts from a crashed tab or API restart are cleared). LiveKit microphone/camera/screen counts are published SFU tracks right now. KPI cards include help tooltips. Operators can factory-reset theater rooms/metrics (typed confirmation phrase) without deleting operator accounts. Scrape LiveKit Prometheus text without running Prometheus; OME REST stats per stream. Time range selectable (default 24h). LiveKit per-room fan-out is an **estimate**.

# Related

- [Rule](/rules/operator-admin-console.md)
- [Change](/changes/2026-08-25/operator-admin-console/operator-admin-console.md)
- [LiveKit media](/product/livekit-media/livekit-media.md)
- [OME broadcast](/product/ome-broadcast/ome-broadcast.md)
- [Safety limits](/product/safety-limits/safety-limits.md)
- [Out of scope](/product/out-of-scope/out-of-scope.md)
