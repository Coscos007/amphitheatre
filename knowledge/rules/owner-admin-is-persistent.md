---
type: Rule
title: Owner admin is persistent
description: ownerId is immutable. The creator stays owner after leave; nobody inherits owner.
tags: [roles, persistence, sqlite]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: rooms
    resource: apps/api/src/rooms.ts
    title: create/join/assignRole
  - id: roles
    resource: packages/shared/src/roles.ts
    title: canModerateTarget
  - id: test
    resource: apps/api/tests/owner-persistence.test.ts
    title: persistence after leave/rejoin and a new process
  - id: product
    resource: /product/identity-and-roles/identity-and-roles.md
    title: Identity and roles
---

# Rule

`rooms.owner_id` is written at creation and **does not change**. Membership `role = owner` is restored on join if `userId === ownerId`, even after `leave`.[^rooms]

- Do not promote anyone to `owner` in `POST /api/rooms/:id/roles` (only `admin` | `moderator` | `member`).
- `canModerateTarget` rejects any action whose target is `owner`.[^roles]
- Admin granted by an admin **persists** in SQLite after leave/rejoin and after a process restart (same `DATABASE_PATH`).[^test]
- Owner re-enters **without a password** (`skipPassword` if `owner_id === userId`).

Do not implement “the next person in the list becomes admin if the owner leaves”. The room may have no owner **present**; the owner remains the owner.

State lives in SQLite, not Valkey/Redis. Valkey is only LiveKit DB 1 (RESP).

# Related

- [Identity and roles](/product/identity-and-roles/identity-and-roles.md)
- [Moderation](/product/moderation/moderation.md)

[^rooms]: create/join/assignRole
[^roles]: canModerateTarget
[^test]: persistence after leave/rejoin and a new process
