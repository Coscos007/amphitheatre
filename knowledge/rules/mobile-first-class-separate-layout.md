---
type: Rule
title: Mobile first-class separate layout
description: Phone and narrow viewport use MobileTheaterLayout, not desktop with breakpoints.
tags: [mobile, layout, a11y]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
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

`useTheaterLayout` chooses `"mobile"` if `pointer: coarse` **or** `max-width: 767px`.[^hook]

- Mobile: stage on top, Chat / People tabs, sticky control bar at the bottom.[^mobile]
- Desktop: stage + chat and member side panels.[^desktop]

Do not implement the mobile theater as “the same three columns with `hidden lg:flex`”. Touch targets (`size="touch"`) and tabs with `role="tab"` are required on the mobile layout.

Infra: UDP may fail on 4G; LiveKit already publishes ICE/TCP `7881`. Do not assume UDP on the mobile client. Tests: `docs/load-testing.md` section 9.

# Related

- [Clients](/product/clients/clients.md)
- [Reconnect last priority](/rules/reconnect-last-priority.md) (iOS background tab)

[^hook]: useTheaterLayout
[^mobile]: MobileTheaterLayout
[^desktop]: DesktopTheaterLayout
