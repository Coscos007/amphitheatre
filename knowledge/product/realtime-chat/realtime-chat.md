---
type: Product
title: Realtime chat
description: Text chat over the room WebSocket, with a short in-memory history in the API process.
tags: [chat, websocket]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: hub
    resource: apps/api/src/hub.ts
    title: RoomHub chat.send
  - id: events
    resource: packages/shared/src/events.ts
    title: ClientEvent / ServerEvent
  - id: panel
    resource: apps/web/src/components/theater/chat-panel.tsx
    title: ChatPanel
  - id: limits
    resource: packages/shared/src/paths.ts
    title: limits.chatText / chatHistory
---

# Implemented

Same room WS: `GET /api/rooms/:id/ws` (cookie or `?token=`). Client sends `{ type: "chat.send", text }` (1–1024 chars). Server fans out `{ type: "chat", payload: ChatMessage }`.[^events][^hub]

When the Chat tab is not visible (Audience selected on desktop, or the mobile drawer closed / on Audience), new messages from others increment an unread badge on Chat and prefix the document title with `(n)`. Opening Chat clears the count. Own messages and the history replayed on join do not count.

History: up to `CHAT_HISTORY_LIMIT` (default 200) **in memory in the hub**. Replay on `onOpen`. It is not in SQLite or Redis. Restarting the API wipes the history.

Chat rate limit: 20 messages / 10 s / `userId`. A burst of 6 messages in 8 s (or the 20/10s cap) applies a **soft-ban** of 60 or 120 s (admin configures this in `PATCH /api/rooms/:id/chat`). The sender receives `system` `chat_slow` with `retryAfterMs` — it is not a silent drop.

System ping every 25s (`system` / `ping`).

# Intended, not implemented

Redis List/Stream and pub/sub across Hono instances. Today **one process**; horizontal chat scaling does not exist.

# Related

- [Presence indicators required](/rules/presence-indicators-required.md) (same channel)
- [API contract frozen](/rules/api-contract-frozen.md)

[^hub]: RoomHub chat.send
[^events]: ClientEvent / ServerEvent
[^panel]: ChatPanel
[^limits]: limits.chatText / chatHistory
