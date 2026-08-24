---
type: Change
title: Tabler Icons and browser locale
description: SPA switches from lucide-react to @tabler/icons-react. Initial language follows the browser; locale and theme persist only after the user chooses.
tags: [web, i18n, theme, ui]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T04:20:00Z }
sources:
  - id: i18n
    resource: apps/web/src/lib/i18n.ts
    title: resolveLocale / detectBrowserLocale
  - id: ui
    resource: apps/web/src/stores/ui-store.ts
    title: Theme persistence
  - id: pkg
    resource: apps/web/package.json
    title: @tabler/icons-react
  - id: i18n-rule
    resource: /rules/i18n-en-pt-es.md
    title: i18n en pt es
  - id: emoji-rule
    resource: /rules/no-emoji-in-ui-or-docs.md
    title: No emoji
---

# What landed

- All SPA icons use `@tabler/icons-react` (`Icon*`). `lucide-react` removed.
- First visit: language from `navigator.languages` (`pt*` -> `pt-BR`, `es*` -> `es`, `en*` -> `en`; fallback `en`).
- `coliseum.locale` is written only in `setLocale` (selector). Theme stays in `coliseum.ui` (`theme` only).
- Migration: old locale in `coliseum.ui.state.locale` becomes `coliseum.locale` if the new key does not exist yet.

# Why

Request for Tabler instead of Lucide, automatic language from the browser, and persist language/theme when the user chooses.

# Related

- [i18n en pt es](/rules/i18n-en-pt-es.md)
- [Design tokens light dark](/rules/design-tokens-light-dark.md)
- [No emoji in UI or docs](/rules/no-emoji-in-ui-or-docs.md)
- [Clients](/product/clients/clients.md)
