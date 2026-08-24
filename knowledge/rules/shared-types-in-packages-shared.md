---
type: Rule
title: Shared types in packages/shared
description: Domain types, paths, events, roles, and errors live in @coliseum/shared. API and web import; they do not duplicate.
tags: [typescript, contract, monorepo]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: pkg
    resource: packages/shared/src/index.ts
    title: Barrel @coliseum/shared
  - id: web-ui
    resource: apps/web/src/shared-types.ts
    title: UI-only types (Locale, ThemeMode)
  - id: contract
    resource: /rules/api-contract-frozen.md
    title: Frozen HTTP contract
---

# Rule

Everything that crosses API and client goes in `packages/shared`:

- `Room`, `RoomMember`, `SessionUser`, `OmeInfo`, `MediaStatus`, `PresenceState`, `ChatMessage`
- `Role`, `AssignableRole`, helpers `canKick` / `canModerateTarget` / ...
- `apiPaths`, `limits`, `SESSION_COOKIE`
- `ClientEvent` / `ServerEvent`
- `errorCodes` / `ApiErrorBody`

API (`apps/api`) and web (`apps/web`) depend on `workspace:*`. Do not copy those interfaces into `apps/web/src/lib/` or redefine paths.

Allowed exception: **UI-only** types in `apps/web/src/shared-types.ts` (`Locale`, `ThemeMode`, `ParticipantMedia`), re-exporting the rest from `@coliseum/shared`.[^web-ui]

New endpoint = new path/type in shared **in the same change**.

# Related

- [API contract frozen](/rules/api-contract-frozen.md)
- [Monorepo scaffold](/changes/2026-08-22/monorepo-scaffold/monorepo-scaffold.md)

[^pkg]: Barrel @coliseum/shared
[^web-ui]: UI-only types (Locale, ThemeMode)
