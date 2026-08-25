---
type: Change
title: Explicit join errors and invite gate
description: GET returns existing private rooms. Join uses not_found vs invalid_password. Home and JoinGate show the matching screen and copy. Room code input is not uppercased.
generated: { by: coding_agent/composer, at: 2026-08-25T18:40:00Z }
sources:
  - id: rooms
    resource: apps/api/src/rooms.ts
    title: getVisible and join
  - id: tests
    resource: apps/api/tests/join-errors.test.ts
    title: Join error tests
---

# What landed

`GET /api/rooms/:id` returns a preview for any existing room (including private / password-protected) without the member list unless the viewer already has a membership. Missing ids stay 404 `not_found`.

`POST /api/rooms/:id/join` returns `not_found` when the room does not exist (no lockout strike) and `invalid_password` for a wrong or missing password on both public and private rooms. Empty password does not increment lockout.

The SPA invite route uses that GET so a password room opens JoinGate instead of the infinite-grid “room does not exist” page. Home looks up the room before joining, so a typo is “room not found”, not “password does not match”. Display name is required and shown as its own error. The room-code field keeps mixed case (no CSS uppercase; autocapitalize off).

# Why

Invite links to default (private) rooms were 404 for anyone who was not already a member. Home mapped `cannot_join` to a password error, including for ids that did not exist. Room ids are case-sensitive.

# Related

- [Join errors are explicit](/rules/join-errors-are-explicit.md)
- [API contract frozen](/rules/api-contract-frozen.md)
