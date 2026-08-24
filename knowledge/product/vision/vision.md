---
type: Product
title: Vision / theater rooms
description: Amphitheatre is an open-source mini-Discord-style theater, with an optional broadcast stage.
tags: [product, rooms, vision]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: readme
    resource: README.md
    title: Monorepo README
  - id: plan
    resource: /references/plano-watchparty-miniDiscord.md
    title: Historical plan (partially superseded)
  - id: change
    resource: /changes/2026-08-22/monorepo-scaffold/monorepo-scaffold.md
    title: Monorepo scaffold
---

# What it is

A theater room for a small group (2–50 people): talk over **text and voice**, turn on **camera**, **share screen**, and optionally watch **the same live stream** (OBS -> OvenMediaEngine).

It is open-source. It is not a full Discord (no persistent servers, no email accounts, no bots). It is not a Netflix client.

# Implemented

- Create room (`name`, optional password, `memberLimit` 2–50, `isPublic`)
- Short **8**-character id (alphabet without ambiguous characters)
- Join by code/link `/rooms/$roomId`
- Stage: OME player if live; otherwise LiveKit tiles (screen + camera)
- Member list with roles and indicators
- Side chat (desktop) or tab (mobile)

# Intended in the plan, **not** implemented

- Email/password accounts and DiceBear avatars
- Redis as the room store (today SQLite)
- Per-room toggles `voiceEnabled` / `videoEnabled` / `screenShareEnabled` in the create body
- Production-ready Traefik (there is a Caddy profile and Traefik comments)
- Automatic room deletion when empty (membership `left_at`; rooms remain in SQLite)

# Related

- [Identity and roles](/product/identity-and-roles/identity-and-roles.md)
- [OME broadcast](/product/ome-broadcast/ome-broadcast.md)
- [Out of scope](/product/out-of-scope/out-of-scope.md)
- [Clients](/product/clients/clients.md)

[^readme]: Monorepo README
[^plan]: Historical plan (partially superseded)
