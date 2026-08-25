---
type: Rule
title: Room follows HTML prototype
description: The React room replicates knowledge/references/prototypes/room.html and room-chat.html in layout, type, and panel. Mobile stays a layout of its own.
tags: [web, theater, design]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T04:30:00Z }
sources:
  - id: room
    resource: knowledge/references/prototypes/room.html
    title: Room prototype (audience)
  - id: chat
    resource: knowledge/references/prototypes/room-chat.html
    title: Room prototype (chat)
  - id: theater
    resource: apps/web/src/components/theater/theater-screen.tsx
    title: TheaterScreen
---

# Rule

The `/rooms/$roomId` route on desktop must stay visually close to `room.html` / `room-chat.html`: floating header (mark + Amphitheatre + name + status pill), `rounded-2xl` stage with empty state “the stage is yours” **centered horizontally and vertically** in the stage frame, 340px aside with Audience/Chat tabs.

The media dock sits **in the header, centered** (not over the stage). The right side of the header is Settings only (theme and locale are the General tab inside Settings). Tile title and pin sit at the top and only appear on hover (they disappear 3s after the mouse leaves).

HTML is dark-only; the SPA keeps light and dark via tokens. No emoji. Tabler icons in place of Material Symbols.

Do not copy the HTML as a dead product: the dock has real settings; clicking a member opens the roles/moderation modal; the stage uses a pin grid (not the empty state when there is media).

Mobile stays a [layout of its own](/rules/mobile-first-class-separate-layout.md).

# Related

- [Home follows HTML prototype](/rules/home-follows-html-prototype.md)
- [Leave room must confirm](/rules/leave-room-must-confirm.md)
- [Clients](/product/clients/clients.md)
- [Design tokens light dark](/rules/design-tokens-light-dark.md)
