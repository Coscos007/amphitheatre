---
type: Rule
title: i18n en, pt-BR, es
description: Every user-visible string in the SPA exists in en, pt-BR, and es. Fallback en.
tags: [i18n, web]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T08:38:00Z }
sources:
  - id: i18n
    resource: apps/web/src/lib/i18n.ts
    title: i18next init
  - id: en
    resource: apps/web/src/locales/en.ts
    title: en catalog
  - id: pt
    resource: apps/web/src/locales/pt-BR.ts
    title: pt-BR catalog
  - id: es
    resource: apps/web/src/locales/es.ts
    title: es catalog
---

# Rule

SPA locales: `en`, `pt-BR`, `es`. With no user choice, the language comes from the browser (`navigator.languages`: `pt*` -> `pt-BR`, `es*` -> `es`, `en*` -> `en`; otherwise `en`). Only write `localStorage` key `coliseum.locale` when the user changes the selector. `document.documentElement.lang` follows.[^i18n]

Every new key in `locales/en.ts` must be added in `pt-BR.ts` and `es.ts` **in the same change**. Do not leave a key in English only “for later”.

Do not concatenate sentences in the component (`t("foo") + " " + name`) if word order would break in another language — use i18next interpolation.

UI copy stays `en`, `pt-BR`, `es`. Repo docs and `knowledge/` are English. See [public-docs-english](/rules/public-docs-english.md).

The API may return `message` in pt-BR (current `HttpError` state). Do not mix that with SPA i18n keys: the client maps `error` code -> translated string when one exists.

# Related

- [Clients](/product/clients/clients.md)
- [No emoji in UI or docs](/rules/no-emoji-in-ui-or-docs.md)
- [Public docs in English](/rules/public-docs-english.md)

[^i18n]: i18next init
[^en]: en catalog
[^pt]: pt-BR catalog
[^es]: es catalog
