---
type: Rule
title: No emoji in UI or docs
description: Zero emoji in UI, i18n strings, repo markdown, and OKF files. Tabler icons are allowed.
tags: [ui, writing, a11y]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: locales
    resource: apps/web/src/locales/en.ts
    title: i18n copy without emoji
  - id: tabler
    resource: apps/web/package.json
    title: @tabler/icons-react
  - id: clients
    resource: /product/clients/clients.md
    title: Clients
---

# Rule

Do not use emoji (including variants in strings, README, AGENTS.md, knowledge/, new code comments, toasts, labels).

Allowed: SVG icons via `@tabler/icons-react`, with `aria-hidden="true"` when adjacent text already describes the state.

Do not use emoji as the only speaking/live/quality indicator.

Product copy goes through i18n (`en` / `pt-BR` / `es`).

# Related

- [i18n en pt es](/rules/i18n-en-pt-es.md)
- [Presence indicators required](/rules/presence-indicators-required.md)

[^locales]: i18n copy without emoji
