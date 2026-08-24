---
type: Product
title: Identity and roles
description: Guest with a persistent JWT. Immutable ownerId. admin and moderator persist in SQLite.
tags: [identity, roles, session]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: session
    resource: apps/api/src/session.ts
    title: JWT and ct_session cookie
  - id: rooms
    resource: apps/api/src/rooms.ts
    title: owner_id and role restore
  - id: shared-roles
    resource: packages/shared/src/roles.ts
    title: Role hierarchy
  - id: rule
    resource: /rules/owner-admin-is-persistent.md
    title: Persistent owner rule
---

# Session (implemented)

`POST /api/session` `{ displayName }` (1–32 chars). If a valid cookie already exists, it **reuses** `userId` and only updates the name.

Response: `{ userId, displayName, token }`. httpOnly cookie `ct_session` + Bearer for Vite. HMAC: `SESSION_SECRET`.

There is no signup, email, OAuth, or complex refresh token. `userId` is a UUID.

# Roles (implemented)

`owner` > `admin` > `moderator` > `member`.[^shared-roles]

- The creator becomes `owner`; `rooms.owner_id` does not change.
- Rejoin with the same JWT restores the stored role. If the user is the `owner_id`, the role returns to `owner` even after leave.
- `POST /api/rooms/:id/roles` `{ userId, role }` with `role` in `admin` | `moderator` | `member`. Admin/owner only. Never targets the owner.
- Owner joins without a password.

# Intended, not implemented

Permanent account, generated avatar, “join anonymously vs create an account” from the original plan.

# Related

- [Moderation](/product/moderation/moderation.md)
- [Owner admin is persistent](/rules/owner-admin-is-persistent.md)
- [Safety limits](/product/safety-limits/safety-limits.md)

[^session]: JWT and ct_session cookie
[^rooms]: owner_id and role restore
[^shared-roles]: Role hierarchy
