---
type: Change
title: YouTube embed Referer (Error 153)
description: Hono no longer sends Referrer-Policy no-referrer; the YouTube iframe declares strict-origin-when-cross-origin so the player receives HTTP Referer.
generated: { by: coding_agent/composer, at: 2026-08-25T07:45:00Z }
sources:
  - id: headers
    resource: apps/api/src/app.ts
    title: secureHeaders referrerPolicy
  - id: pane
    resource: apps/web/src/components/theater/broadcast-pane.tsx
    title: BroadcastEmbed iframe
  - id: html
    resource: apps/web/index.html
    title: referrer meta
---

# What landed

YouTube embeds on the stage were failing with Error 153 (player configuration / HTTP Referer). Hono `secureHeaders()` defaults to `Referrer-Policy: no-referrer`, which strips the header YouTube requires on the iframe navigation. A leftover `origin=` query param (IFrame Player API only) was also appended to the plain iframe URL.

The API now sets `Referrer-Policy: strict-origin-when-cross-origin`. The embed iframe sets the same `referrerpolicy` and no longer adds `origin=`. `index.html` has a matching `<meta name="referrer">` so Vite (which does not go through Hono) still sends origin. The privacy-enhanced `youtube-nocookie.com` embed URL is unchanged.

# Why

YouTube’s embedded player terms require a usable HTTP Referer. `no-referrer` and `same-origin` both suppress it on the cross-origin player request.

# Related

- [Broadcast opt-in](/rules/broadcast-opt-in.md)
- [OME broadcast](/product/ome-broadcast/ome-broadcast.md)
