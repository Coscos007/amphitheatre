---
type: Rule
title: Design tokens light dark
description: Colors and radii come from CSS tokens in index.css. Theme via data-theme=light|dark. No loose hex in components.
tags: [design, theme, css]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: css
    resource: apps/web/src/index.css
    title: @theme and :root / [data-theme=dark]
  - id: ui
    resource: apps/web/src/stores/ui-store.ts
    title: theme persistence
  - id: product
    resource: /product/clients/clients.md
    title: Clients
---

# Rule

Tokens in `apps/web/src/index.css`: surfaces (`surface-page`, `surface-raised`, `surface-sunken`), ink (`ink`, `ink-muted`, `ink-subtle`, `ink-on-accent`), accent, border, danger/success/warning/info, overlay, radii (`radius-control`, `radius-panel`, `radius-pill`).[^css]

Theme: `document.documentElement.dataset.theme = "light" | "dark"`. The user choice lives in Zustand persist `coliseum.ui` (`theme`); locale **does not** enter that persist (it lives in `coliseum.locale` only after an explicit choice).[^ui] Tailwind variant: `@custom-variant dark (&:where([data-theme="dark"], ...))`.

In component JSX/CSS use theme utilities (`bg-surface-page`, `text-ink`, `border-border`, `bg-accent`). Do not invent a parallel palette. Narrow exception: video player `bg-black` on the stage (content, not chrome).

Fonts: Hanken Grotesk (display), Raleway (sans), and Quicksand (label), already imported. Aligned with the prototype `knowledge/references/prototypes/home.html`.

Do not add DaisyUI/shadcn “as the house default” if the theater already has this system — this repo **does not** use the Next/shadcn stack; it is Vite + its own tokens.

# Related

- [Clients](/product/clients/clients.md)
- [No emoji in UI or docs](/rules/no-emoji-in-ui-or-docs.md)

[^css]: @theme and :root / [data-theme=dark]
[^ui]: theme persistence
