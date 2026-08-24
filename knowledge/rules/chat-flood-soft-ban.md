---
type: Rule
title: Chat flood soft-ban
description: Message at most 1024 chars; flood (6/8s) pauses chat for 1 or 2 minutes, configurable by admin.
tags: [chat, safety]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T06:20:00Z }
sources:
  - id: hub
    resource: apps/api/src/hub.ts
    title: RoomHub chat.send
  - id: limits
    resource: packages/shared/src/paths.ts
    title: limits.chatText / chatBurst / chatFloodBanSec
---

# Rule

`limits.chatText.max` is **1024**. The composer is a growing textarea; the send button sits **inside** the field. Long text wraps with `overflow-wrap: anywhere`.

Flood: 6 messages in 8 s (or the 20/10 s cap) applies a soft-ban of **60 or 120 s**. Owner/admin chooses in `PATCH /api/rooms/:id/chat`. The user receives `system` `chat_slow` with `retryAfterMs` and a toast — no silent drop.

# Related

- [Realtime chat](/product/realtime-chat/realtime-chat.md)
- [Safety limits](/product/safety-limits/safety-limits.md)
- [API contract frozen](/rules/api-contract-frozen.md)
