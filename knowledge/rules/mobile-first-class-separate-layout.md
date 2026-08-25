---
type: Rule
title: Mobile first-class separate layout
description: Phone and narrow viewport use MobileTheaterLayout, not desktop with breakpoints.
tags: [mobile, layout, a11y]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T22:00:00Z }
sources:
  - id: hook
    resource: apps/web/src/hooks/use-media.ts
    title: useTheaterLayout
  - id: mobile
    resource: apps/web/src/components/theater/mobile-theater-layout.tsx
    title: MobileTheaterLayout
  - id: desktop
    resource: apps/web/src/components/theater/desktop-theater-layout.tsx
    title: DesktopTheaterLayout
  - id: product
    resource: /product/clients/clients.md
    title: Clients
---

# Rule

`useTheaterLayout` chooses `"mobile"` if `pointer: coarse` **or** `max-width: 767px`.[^hook] `useCompactChrome` is the same predicate for Home and join-gate chrome.

- Mobile: stage on top (fills leftover height), **Audience / Chat as one glass-panel card** just above the dock (same panel radius as the dock; tabs are the bottom of that card, not a separate pill). Closed by default; tap to expand, tap the selected tab to collapse. **Full-width floating dock as the bottom app bar** (icon-only; labels stay `sr-only`). Header is in-flow: wordmark + Settings. Settings is a fullscreen sheet. Room title is left, broadcast badge is right, on the second header row. Camera tiles use a 1–2 column Meet-style grid.[^mobile]
- Desktop: stage + chat and member side panels; dock stays in the header.[^desktop]

Do not implement the mobile theater as “the same three columns with `hidden lg:flex`”. Touch targets (`size="touch"` / `iconTouch`) and tabs with `role="tab"` are required on the mobile layout.

When the shared broadcast is enabled but **not** playing, do not trap the offline/waiting copy inside a video tile. Render a full-width card that sizes to its content; camera and screen tiles stay in the grid.

Infra: UDP may fail on 4G; LiveKit already publishes ICE/TCP `7881`. Do not assume UDP on the mobile client. Tests: `docs/load-testing.md` section 9.

# Related

- [Clients](/product/clients/clients.md)
- [Theater header chrome](/rules/theater-header-chrome.md)
- [Reconnect last priority](/rules/reconnect-last-priority.md) (iOS background tab)

[^hook]: useTheaterLayout
[^mobile]: MobileTheaterLayout
[^desktop]: DesktopTheaterLayout
