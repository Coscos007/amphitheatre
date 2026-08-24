---
type: Rule
title: Password lockout 3 strikes 5 min
description: Three wrong passwords (IP+roomId and userId+roomId) block join for five minutes.
tags: [security, lockout, join]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: lockout
    resource: apps/api/src/lockout.ts
    title: lockoutKeys and recordPasswordFailure
  - id: env
    resource: apps/api/src/env.ts
    title: LOCKOUT_MAX_FAILURES / LOCKOUT_DURATION_MS
  - id: test
    resource: apps/api/tests/lockout.test.ts
    title: Lockout tests
  - id: product
    resource: /product/safety-limits/safety-limits.md
    title: Safety limits
---

# Rule

Defaults: `LOCKOUT_MAX_FAILURES=3`, `LOCKOUT_DURATION_MS=300000`.[^env]

Keys persisted in SQLite (`lockouts`):

- `ip:{ip}:{roomId}`
- `user:{userId}:{roomId}` if a session exists

After 3 failures, join returns error `locked_out` with `retryAfterMs` (and `Retry-After` header in seconds). The 4th attempt is **not** `401`/`cannot_join` — it is lockout, even with the right password, until it expires.[^lockout][^test]

A missing room also counts as a failure (avoids enumeration + brute force). Private rooms: `cannot_join` body on a failed join **before** lockout; do not leak whether the room exists.

Lockout is **not** a member ban. Ban is the `bans` table and only leaves with an admin unban.

A successful join clears that IP/user keys for that room.

Do not replace this with CAPTCHA, client-only delay, or in-memory-only lockout (it must survive restart — that is why SQLite).

# Related

- [Safety limits](/product/safety-limits/safety-limits.md)
- [API contract frozen](/rules/api-contract-frozen.md)

[^lockout]: lockoutKeys and recordPasswordFailure
[^env]: LOCKOUT_MAX_FAILURES / LOCKOUT_DURATION_MS
[^test]: Lockout tests
