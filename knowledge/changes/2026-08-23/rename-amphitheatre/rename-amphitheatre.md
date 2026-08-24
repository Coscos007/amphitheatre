---
type: Change
title: Product renamed to Amphitheatre
description: Visible name Coliseum Theater -> Amphitheatre in i18n, HTML, README, AGENTS, and knowledge. @coliseum/* packages unchanged.
tags: [web, docs, branding]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-23T23:50:00Z }
sources:
  - id: locales
    resource: apps/web/src/locales/en.ts
    title: app.name
  - id: html
    resource: apps/web/index.html
    title: title
  - id: rule
    resource: /rules/app-name-amphitheatre.md
    title: Name rule
---

# What landed

- `app.name` and Home footer: Amphitheatre (`en`, `pt-BR`, `es`).
- `apps/web/index.html` title/description.
- README, AGENTS.md, Makefile help, docker-compose comment, load-testing docs, and OKF catalog.
- OME `<Name>`: `AmphitheatreOME`.
- npm packages `@coliseum/*` and the repository path **did not** change.

# Why

User request: the app is now called Amphitheatre across the project (product name).

# Related

- [App name is Amphitheatre](/rules/app-name-amphitheatre.md)
- [Vision](/product/vision/vision.md)
