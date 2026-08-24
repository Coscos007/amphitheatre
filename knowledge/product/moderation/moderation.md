---
type: Product
title: Moderation
description: Kick, mute, ban/unban, and granting admin/moderator. Owner is untouchable.
tags: [moderation, roles]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: roles
    resource: packages/shared/src/roles.ts
    title: canModerateTarget
  - id: routes
    resource: apps/api/src/routes.ts
    title: kick mute ban unban roles
  - id: tests
    resource: apps/api/tests/roles.test.ts
    title: Role tests
  - id: ui
    resource: apps/web/src/components/theater/moderation-menu.tsx
    title: Moderation menu
---

# Implemented

| Action | Who | Effect |
|---|---|---|
| kick | moderator+ | `left_at`, WS closes, LiveKit `removeParticipant` |
| mute/unmute | moderator+ | SQLite flag + LiveKit without mic |
| ban | admin+ | `bans` table + kick |
| unban | admin+ | removes ban |
| role | admin+ | `admin` / `moderator` / `member` |

A moderator only acts on `member`. Admin/owner act on non-owner. Target `owner` is always denied.[^roles]

WS event `moderation` with `action`, `userId`, `byUserId`.

Ban != password lockout.

UI: `ModerationMenu` on `MemberRow` per `apps/web/src/lib/permissions.ts` (mirrors shared).

# Related

- [Identity and roles](/product/identity-and-roles/identity-and-roles.md)
- [Owner admin is persistent](/rules/owner-admin-is-persistent.md)
- [Safety limits](/product/safety-limits/safety-limits.md)

[^roles]: canModerateTarget
[^routes]: kick mute ban unban roles
[^tests]: Role tests
[^ui]: Moderation menu
