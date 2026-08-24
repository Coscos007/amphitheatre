---
type: Product
title: Safety limits
description: In-memory rate limits, 3x5min lockout, creation caps, and room capacity.
tags: [safety, rate-limit, lockout]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: env
    resource: apps/api/src/env.ts
    title: caps and RATE_*
  - id: limiter
    resource: apps/api/src/rate-limit.ts
    title: SlidingWindowLimiter
  - id: lockout
    resource: /rules/password-lockout-3-strikes-5-min.md
    title: Lockout rule
---

# Implemented

**Password lockout:** 3 failures -> 5 min. SQLite. See the dedicated rule.[^lockout]

**Rate limits** (in memory, per API process; not shared across replicas):[^limiter][^env]

| Key | Default limit |
|---|---|
| create room / IP | 5 / 10 min |
| join / IP | 30 / 60 s |
| chat / user | 20 / 10 s; burst 6 / 8 s becomes a 1–2 min soft-ban |
| livekit-token / user | 20 / 60 s |
| roles / user+IP | 30 / 60 s |

HTTP 429 + `retryAfterMs` + `Retry-After`. Exceeded chat is a drop on the WS.

**Persisted caps (SQLite, 24h window for creation):**

| Env | Default | Meaning |
|---|---|---|
| `MAX_ROOMS_PER_CREATOR` | 10 | rooms created by ownerId |
| `MAX_ROOMS_PER_IP` | 20 | rooms created by IP |
| `MAX_MEMBERS_PER_ROOM` | 50 | join cap (`room_full` 409) |
| `MAX_CONCURRENT_ROOMS` | 200 | rooms with someone `left_at IS NULL` |

LiveKit `max_participants: 50` is a safety net; the API rejects the 51st.

Join privacy: non-public rooms do not distinguish 404 from a wrong password (`cannot_join`).

# Intended

Shared rate limit (Redis) if there is more than one Hono process — there is **none** today.

# Related

- [Password lockout](/rules/password-lockout-3-strikes-5-min.md)
- [API contract frozen](/rules/api-contract-frozen.md)
- [Load testing docs](/changes/2026-08-22/load-testing-docs/load-testing-docs.md)

[^env]: caps and RATE_*
[^limiter]: SlidingWindowLimiter
