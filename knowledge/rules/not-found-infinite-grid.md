---
type: Rule
title: Not found infinite grid
description: Unknown route or missing room uses the Home InfiniteGrid3D background, with title, copy, and home button centered.
tags: [web, home, ux]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T06:40:00Z }
sources:
  - id: notfound
    resource: apps/web/src/components/not-found-screen.tsx
    title: NotFoundScreen
  - id: theater
    resource: apps/web/src/components/theater/theater-screen.tsx
    title: GET room 404
---

# Rule

Pages that do not exist (`/anything`) and room URLs whose `GET /api/rooms/:id` returns 404 or 400 (invalid id) render `NotFoundScreen`: the same `InfiniteGrid3D` as Home, content **centered** (mark, title, copy, button to `/`). No JoinGate in that case.

A **private** room the visitor has not joined also returns 404 on GET (do not leak existence). The invite enters from Home with the code; the join POST still returns `cannot_join` if the password fails. Do not invent a GET that distinguishes “does not exist” from “private”.

Copy in `en` / `pt-BR` / `es`. No emoji.

# Related

- [Home follows HTML prototype](/rules/home-follows-html-prototype.md)
- [Identity and roles](/product/identity-and-roles/identity-and-roles.md)
- [i18n en pt es](/rules/i18n-en-pt-es.md)
