---
type: Product
title: Clients
description: Vite React SPA with separate desktop and mobile layouts, i18n en/pt-BR/es, and light/dark theme via tokens.
tags: [web, i18n, theme, mobile]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: web
    resource: apps/web/package.json
    title: @coliseum/web
  - id: router
    resource: apps/web/src/router.tsx
    title: / and /rooms/$roomId
  - id: theater
    resource: apps/web/src/components/theater/theater-screen.tsx
    title: TheaterScreen
  - id: infinite-grid
    resource: apps/web/src/components/home/infinite-grid-3d.tsx
    title: InfiniteGrid3D
  - id: i18n-rule
    resource: /rules/i18n-en-pt-es.md
    title: i18n
  - id: mobile-rule
    resource: /rules/mobile-first-class-separate-layout.md
    title: Separate mobile
  - id: tokens-rule
    resource: /rules/design-tokens-light-dark.md
    title: Tokens
---

# Implemented

SPA `@coliseum/web`: Vite 8, React 19, TanStack Router + Query, RHF+Zod, Zustand, i18next, livekit-client, OvenPlayer, hls.js, Tailwind 4, Sonner, Tabler Icons.[^web]

Routes: `/` (create/join), `/rooms/$roomId` (theater). Unknown page and room 404: `NotFoundScreen` with the same InfiniteGrid3D as Home.[^router]

Vite proxy: `/api` -> `http://localhost:3001` with `ws: true`. Port **5173**. Preview 4173 with the same proxy.

**Desktop:** `DesktopTheaterLayout` (stage + 340px aside Audience/Chat, faithful to `room.html`). **Mobile:** `MobileTheaterLayout` (stage, tabs, sticky controls). Stage in auto-grid with pins. Member modal and settings modal.[^theater]

Theme `light` | `dark` on `data-theme` (persisted in `coliseum.ui` when the user switches). Locales `en` | `pt-BR` | `es`: first visit follows the browser; an explicit choice goes to `coliseum.locale`. Header with theme and language toggles.

**Home:** visual layout follows `knowledge/references/prototypes/home.html` (64px hero, 480px dashboard, glow). Background: `InfiniteGrid3D` (infinite 3D CSS grid, customizable). Gaming/Study/Dev cards are icon chips (~64px, tooltip, no visible text) — they do not create rooms. The HTML center pill (Discover/Library/Create) does **not** become a route; in React it loads theme and locale. Real actions: create room and join.

The stack is **not** Next.js / shadcn / DaisyUI. Do not force that stack in this repo.

# Intended, not implemented

- Native iOS/Android app (browser only)
- PWA/service worker

# Related

- [Vision](/product/vision/vision.md)
- [No emoji](/rules/no-emoji-in-ui-or-docs.md)
- [App name is Amphitheatre](/rules/app-name-amphitheatre.md)
- [Home follows HTML prototype](/rules/home-follows-html-prototype.md)
- [Web theater SPA](/changes/2026-08-22/web-theater-spa/web-theater-spa.md)

[^web]: @coliseum/web
[^router]: / and /rooms/$roomId
[^theater]: TheaterScreen
