---
type: Rule
title: Site editorial pages
description: /what-is and /about are full-bleed editorial pages with large plain-language copy, not a centered glass card. What-is names no competing products.
tags: [web, copy, home]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-25T19:30:00Z }
sources:
  - id: what-is
    resource: apps/web/src/components/site/what-is-page.tsx
    title: WhatIsPage
  - id: about
    resource: apps/web/src/components/site/about-page.tsx
    title: AboutPage
  - id: locales
    resource: apps/web/src/locales/en.ts
    title: pages.* copy
  - id: clients
    resource: /product/clients/clients.md
    title: Clients
---

# Rule

`/what-is` and `/about` share Home chrome (InfiniteGrid3D, wordmark header, footer nav) but **not** the Home 480px dashboard card.

Layout:

- `/what-is` is a readable document: `max-w-5xl`, body `max-w-prose`, title about `text-3xl`, short paragraphs. Not a glass card.
- `/about` follows [Not found infinite grid](/rules/not-found-infinite-grid.md): `InfiniteGrid3D`, content **centered** in the viewport. Copy says it is open source: self-host, study, contribute. Buy me a coffee is the **primary** button; GitHub is outline. There is no “open a room” CTA. The four shipped open-source tools (OvenMediaEngine, OvenPlayer, LiveKit, Valkey) appear as a named grid with a short human description each. Desktop should still fit a typical viewport; compact chrome may scroll. Overlay footer. Settings → About stays the compact `AboutPanel` in the modal.

Copy:

- Plain language. Say what a room is for and how it was thought (small gathering, no account, no recording), not stack jargon (SFU, RTMP, ingest, RESP).
- **`/what-is` must not name competing products or catalogs** (no Netflix, no Discord, no other watch-party brands). Credits for the software we ship live on `/about` and in Settings → About, with human descriptions.

Icons: Tabler only. No emoji.

# Related

- [Not found infinite grid](/rules/not-found-infinite-grid.md)
- [i18n en pt es](/rules/i18n-en-pt-es.md)
- [No emoji in UI or docs](/rules/no-emoji-in-ui-or-docs.md)
- [Design tokens light dark](/rules/design-tokens-light-dark.md)
- [Clients](/product/clients/clients.md)
