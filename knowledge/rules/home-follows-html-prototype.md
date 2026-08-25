---
type: Rule
title: Home follows HTML prototype
description: The React Home replicates knowledge/references/prototypes/home.html in layout, type, color, and hover. Mood cards and Discover/Library/Create nav are not product.
tags: [web, home, design]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-23T22:00:00Z }
sources:
  - id: prototype
    resource: knowledge/references/prototypes/home.html
    title: Amphitheatre prototype
  - id: home
    resource: apps/web/src/components/home/home-screen.tsx
    title: HomeScreen
  - id: home-header
    resource: apps/web/src/components/home/home-header.tsx
    title: HomeHeader
  - id: infinite-grid
    resource: apps/web/src/components/home/infinite-grid-3d.tsx
    title: InfiniteGrid3D
  - id: clients
    resource: /product/clients/clients.md
    title: Clients
---

# Rule

The `/` screen must stay visually close to `knowledge/references/prototypes/home.html` (floating header in 3 zones, ~64px hero with a line break, 480px panel with `p-1`/`p-8`, compact inputs).[^prototype][^home]

Create and join are **tabs** in the Home panel (same pattern as Audience/Chat in the room): **Join first**, Create second. Display name stays above the tablist. Do not stack both forms with an “or” divider.

On compact chrome (`useCompactChrome`: coarse pointer or `max-width: 767px`):

- Hero column (title, lead, mood chips) is **centered** (`items-center` / `text-center`). Desktop (`xl`) stays left-aligned.
- Header is wordmark + hamburger only. The guest avatar lives **inside** the appearance sheet, not beside the hamburger.
- The hamburger opens a **fullscreen** appearance dialog (close button in the sheet). If the session is not already a standalone PWA, the sheet includes **Install as app**. Compact Home also shows an install banner until installed (dismiss lasts for the tab session). See [pwa-and-native-share](/rules/pwa-and-native-share.md).

Desktop keeps the center pill with theme and locale, and the avatar chip on the right. Reduce horizontal padding so the form is not clipped.

The Home background is **not** the solid radial from the HTML: it is the `InfiniteGrid3D` component (CSS 3D infinite grid effect, CodePen ZOjXBp). Props (`cellSize`, `cellWidth`, `cellHeight`, `lineColor`, `angle`, `perspective`, `horizon`, `duration`, `opacity`) customize the plane. `cellWidth`/`cellHeight` set the aspect (square on the plane = rectangle on screen because of `rotateX`; increase `cellHeight` to compensate). Default colors come from tokens (`--accent`, `--home-page`). `prefers-reduced-motion` pauses the loop; the floor stays static. No WebGL/Three.js.

Do not copy the HTML as product:

- DISCOVER / LIBRARY / CREATE are not routes. The middle pill in React is theme + locale.
- Gaming / Study / Development cards are decorative chips: ~64px, icon only (Tabler filling the card with padding), label only in tooltip/`aria-label`. They do not open a room. The rail does not use `overflow-x-auto` (it clips the `translateY` hover).
- Visible wordmark is **Amphitheatre** (product name; see [app-name-amphitheatre](/rules/app-name-amphitheatre.md)).
- Caps labels via CSS; i18n keys in sentence case (`en`, `pt-BR`, `es`).
- HTML is dark-only; the SPA keeps light and dark via tokens.
- No emoji. Tabler icons in place of Material Symbols.
- On mobile the form must not be clipped (`min-h-dvh` + scroll; `overflow: hidden` only at xl).

Real actions on Home: create a room and join with a code/link (via the panel tabs). Centered **footer nav**: What is Amphitheatre (`/what-is`) and About (`/about`). Those routes are **editorial pages** (full width, large type, no Home dashboard card) — see [site-editorial-pages](/rules/site-editorial-pages.md). They are not the HTML prototype’s fake Discover/Library/Create. Nothing else.

# Related

- [Clients](/product/clients/clients.md)
- [App name is Amphitheatre](/rules/app-name-amphitheatre.md)
- [Design tokens light dark](/rules/design-tokens-light-dark.md)
- [i18n en pt es](/rules/i18n-en-pt-es.md)
- [Site editorial pages](/rules/site-editorial-pages.md)
- [No emoji in UI or docs](/rules/no-emoji-in-ui-or-docs.md)

[^prototype]: knowledge/references/prototypes/home.html
[^home]: HomeScreen
