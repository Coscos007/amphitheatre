---
type: Change
title: Operator occupancy, metric help, factory reset
description: Reconcile stale theater presence with the WebSocket hub, explain admin KPIs with help tooltips, factory-reset theater SQLite with a typed phrase, and fix the operators password field crash.
generated: { by: coding_agent/composer, at: 2026-08-26T00:15:00Z }
sources:
  - id: presence
    resource: apps/api/src/presence.ts
    title: Stale membership reconcile
  - id: reset
    resource: apps/api/src/admin-routes.ts
    title: POST /api/admin/factory-reset
  - id: operators
    resource: apps/admin/src/pages/OperatorsPage.tsx
    title: Password field and reset UI
  - id: kpis
    resource: apps/admin/src/components/KpiCard.tsx
    title: Help tooltips on KPIs
---

# What landed

Operator occupancy numbers were counting SQLite `left_at IS NULL` (joined, never called leave). Closing a tab without leave, or restarting the API, left those rows as "people now" even when nobody had a WebSocket. The API now reconciles with the theater hub: boot marks leftover present rows as left; the sampler and admin occupancy GETs drop rows past `WS_GRACE_MS` with no live socket and no pending leave timer. Unique-ever and peak stay historical. LiveKit microphone/camera/screen counts on the rooms list and room detail come from RoomService participants (published tracks), not the roster.

KPI cards and occupancy columns gained a help icon with a tooltip (en / pt-BR / es). Operators can factory-reset theater rooms, memberships, bans, guest lockouts, and metric samples after typing the locale confirmation phrase; operator accounts and the instance API key stay. The operators table password field is labeled, wide enough to type, and no longer crashes when `currentTarget` is null.

# Why

The console was honest about SQLite and dishonest about "online". Hosts needed to see who is in a room, understand each metric, wipe a dirty local database, and change an operator password without a crash.

# Related

- [Operator admin](/product/operator-admin/operator-admin.md)
- [Operator admin console](/rules/operator-admin-console.md)
