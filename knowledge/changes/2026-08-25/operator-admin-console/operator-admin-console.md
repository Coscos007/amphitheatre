---
type: Change
title: Operator admin console
description: Separate-port operator SPA (Mantine 9) and /api/admin on the same Bun process, with occupancy peaks, LiveKit /metrics scrape, and OME REST samples. Guest theater contract unchanged.
generated: { by: coding_agent/composer, at: 2026-08-25T19:50:00Z }
sources:
  - id: admin-spa
    resource: apps/admin/src/main.tsx
    title: Operator Vite SPA
  - id: admin-app
    resource: apps/api/src/admin-app.ts
    title: Admin Hono app
  - id: sampler
    resource: apps/api/src/metrics-sampler.ts
    title: LiveKit and OME sampler
  - id: docs
    resource: docs/operator-admin.md
    title: Operator admin guide
---

# What landed

Same Bun process now opens two listens: theater + guest `/api` on `PORT` (3001), operator `/api/admin/*` plus the built admin SPA on `ADMIN_PORT` (3002, default bind `127.0.0.1`). Guest JWT and admin JWT (`aud: admin`, cookie `ct_admin`) do not cross ports.

Bootstrap creates the first operator and an instance API key (printed once, `data/admin-bootstrap.txt`). Login requires username, password, and API key, then only the session cookie. Operators can be created, disabled, and have passwords set; the API key can be rotated (shown once). Login uses the same 3-strike / 5-minute lockout pattern with error `invalid_credentials`.

Every SQLite room is listed (including empty and private) without `password_hash`. `peak_members` updates on create/join. A 15s sampler scrapes LiveKit Prometheus text and OME REST, stores snapshots, and serves overview/metrics with selectable ranges (default 24h). LiveKit bytes are node-level; per-room fan-out is labeled estimate. OME down or LiveKit metrics unreachable stay HTTP 200 with flags.

`apps/admin` is a Mantine 9 console (Overview, Rooms, room detail, Operators) with Titan Cockpit tokens, Tabler icons, and i18n `en` / `pt-BR` / `es`. Production image copies `apps/admin/dist` to `public-admin` and sets `ADMIN_BIND=0.0.0.0`; Compose publishes `127.0.0.1:3002:3002`.

Guest paths in `docs/api.md` are unchanged.

# Why

Self-hosters needed a cockpit for occupancy and media traffic without mixing it into the theater SPA, without a Prometheus/Grafana requirement, and without exposing admin on the public theater port.

# Related

- [Operator admin](/product/operator-admin/operator-admin.md)
- [Operator admin console](/rules/operator-admin-console.md)
- [API contract frozen](/rules/api-contract-frozen.md)
- [OME independent of WebRTC](/rules/ome-independent-of-webrtc.md)
- [No recording](/rules/no-recording.md)
