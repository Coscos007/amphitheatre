---
type: Change
title: Web theater SPA
description: Vite React SPA with a desktop theater and its own mobile layout, i18n, and LiveKit/OME stage.
tags: [bootstrap, web, vite]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: theater
    resource: apps/web/src/components/theater/theater-screen.tsx
    title: TheaterScreen
  - id: mobile
    resource: apps/web/src/components/theater/mobile-theater-layout.tsx
    title: MobileTheaterLayout
  - id: home
    resource: apps/web/src/components/home/home-screen.tsx
    title: Home create/join
  - id: i18n
    resource: apps/web/src/lib/i18n.ts
    title: i18next
---

# What landed

`apps/web` is a real SPA (not a stub): Vite 8 + React 19, routes `/` and `/rooms/$roomId`, `/api` proxy to `:3001`.

- Home: create a room and join by code
- Join gate (password, visible lockout)
- Stage: isolated OME video/hls.js; LiveKit camera/screen tiles
- Chat, member list, moderation menu, control bar (mic/cam/screen/leave/copy)
- Indicators: speaking, transmitting, quality, role, muted, offline
- Separate mobile layout (chat/people tabs)
- Light/dark theme via tokens; locales `en`, `pt-BR`, `es`
- Zero emoji; Lucide icons

Root `pnpm typecheck` does **not** include the web app; use `pnpm --filter @coliseum/web typecheck`. There is no frontend `pnpm test` in this cut.

# Files

- `apps/web/src/main.tsx`, `router.tsx`, `index.css`
- `apps/web/src/components/theater/*`, `home/*`, `chrome/*`, `ui/*`
- `apps/web/src/hooks/{use-livekit,use-room-socket,use-ome-player,use-media}.ts`
- `apps/web/src/stores/{room,session,ui}-store.ts`
- `apps/web/src/locales/{en,pt-BR,es}.ts`
- `apps/web/vite.config.ts`

# Why

The theater needs two real layouts and i18n from bootstrap, not a “responsive” desktop.

# Links

- [Clients](/product/clients/clients.md)
- [LiveKit media](/product/livekit-media/livekit-media.md)
- [Mobile first-class separate layout](/rules/mobile-first-class-separate-layout.md)
- [i18n en pt es](/rules/i18n-en-pt-es.md)
- [Design tokens light dark](/rules/design-tokens-light-dark.md)
- [Presence indicators required](/rules/presence-indicators-required.md)
- [No emoji in UI or docs](/rules/no-emoji-in-ui-or-docs.md)

[^theater]: TheaterScreen
[^mobile]: MobileTheaterLayout
[^home]: Home create/join
[^i18n]: i18next
