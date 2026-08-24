---
type: Change
title: Load testing docs
description: Operational load-testing guide in docs/load-testing.md and a k6 stub. The k6 script still does not hit the /api contract.
tags: [bootstrap, load-test, docs]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: docs
    resource: docs/load-testing.md
    title: Smoke-to-break scenarios
  - id: k6
    resource: infra/loadtest/k6/api-rooms.js
    title: k6 create/join/brute-force (old paths)
  - id: smoke
    resource: infra/scripts/smoke.sh
    title: make smoke
---

# What landed

Document `docs/load-testing.md`: capacity hypothesis (2–50 members), tools (`k6`, `lk load-test`, ffmpeg, Prometheus :6789), success criteria, abort, profiles (`smoke` … `break`), API/LiveKit/OME/mobile scenarios, recording prohibition, OME independence.

`infra/loadtest/k6/api-rooms.js` exists, but it calls `POST /rooms` and `maxUsers` / toggles — **not** the current contract (`POST /api/session`, `POST /api/rooms` with `memberLimit`). Treat k6 as a **scaffold to align**, not as the source of truth.

`make smoke` validates Redis/LiveKit; missing OME does not fail LiveKit.

Parts of the markdown still say “when the API exists”; the API **already exists**. When updating the doc, fix that stale wording.

# Files

- `docs/load-testing.md`
- `infra/loadtest/k6/api-rooms.js`
- `infra/scripts/smoke.sh`, `infra/scripts/ffmpeg-ome-fixture.sh`

# Why

Full-room rehearsal before the event, without turning the test into a recorder.

# Links

- [Safety limits](/product/safety-limits/safety-limits.md)
- [No recording](/rules/no-recording.md)
- [OME independent of WebRTC](/rules/ome-independent-of-webrtc.md)
- [API contract frozen](/rules/api-contract-frozen.md)
- [Reconnect last priority](/rules/reconnect-last-priority.md)

[^docs]: Smoke-to-break scenarios
[^k6]: k6 create/join/brute-force (old paths)
[^smoke]: make smoke
