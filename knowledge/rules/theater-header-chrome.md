---
type: Rule
title: Theater header chrome
description: Desktop dock in the header; mobile dock as a bottom bar; settings, theme, and locale; tile hover; Discord-style devices with mic test loopback.
tags: [web, theater, ux]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T22:00:00Z }
sources:
  - id: header
    resource: apps/web/src/components/theater/theater-header.tsx
    title: TheaterHeader
  - id: tile
    resource: apps/web/src/components/theater/stage-tile.tsx
    title: StageTileChrome
  - id: dock
    resource: apps/web/src/components/theater/control-bar.tsx
    title: ControlBar
  - id: devices
    resource: apps/web/src/components/theater/media-settings-panel.tsx
    title: MediaSettingsPanel
  - id: appearance
    resource: apps/web/src/components/chrome/appearance-menu.tsx
    title: AppearanceMenu
  - id: about
    resource: apps/web/src/components/theater/about-panel.tsx
    title: AboutPanel
---

# Rule

**Desktop:** the dock (mic, camera, screen, invite, leave) sits in the **middle of the header**, not over the stage. The right side is **Settings only**. Theme and locale live in Settings, tab **General** (first). General also has **Allow microphone** and **Allow camera** so Safari/mobile can show a permission prompt on tap — see [media-permissions-need-a-user-gesture](/rules/media-permissions-need-a-user-gesture.md). Tabs after that: Stage (admin), Devices, About last. Invite uses the device share sheet (`navigator.share`) with localized title + text that includes the room URL; clipboard is the fallback. General also offers **Install as app** while the session is not already a standalone PWA. See [pwa-and-native-share](/rules/pwa-and-native-share.md).

**Mobile** (`useTheaterLayout === "mobile"`): the dock is a **full-width floating bar in the footer** (app-style). Icons are vertically centered with no reserved caption gap. Header chrome is the wordmark and Settings. Settings opens a **fullscreen** dialog (same pattern as the Home hamburger). There is no appearance hamburger in the room. Room title sits on a second header row, **left**; the broadcast badge sits on the **right** of that row. Audience/Chat are one **glass-panel** card above the dock (same `--radius-panel` as the stage and dock, not a pill): closed by default (tabs only); tap a tab to expand the panel upward inside the same card; tap the selected tab again to collapse. The stage grows to fill the leftover height when the drawer is closed. See [mobile-first-class-separate-layout](/rules/mobile-first-class-separate-layout.md).

The mark in the room header and on the About tab is the **horizontal wordmark** (`amphitheatre-logo-full-1000.webp`), the same as on Home. Do not duplicate the text “Amphitheatre” next to it. The logo in the header **does not** navigate silently: it opens the Leave modal ([leave-room-must-confirm](/rules/leave-room-must-confirm.md)).

The stage fills the height available below the header. Do not reserve `pb-24` (that was the dock over the stage). The grid uses `auto-rows-fr` so the stream tile fills the frame. When the stage is empty (no camera, screen, or live broadcast), the empty copy is centered in the frame.

Name and pin of each tile sit at the **top**. They appear on hover/focus and disappear 3 seconds after the pointer leaves, so they do not cover the player. On the broadcast tile, Reload sits to the left of the pin, in the same chrome (same hover).

Settings modal: on desktop, fixed height (`min(40rem, 100dvh - 2rem)`); on mobile it is **fullscreen**. **Fixed vertical tabs** on desktop (General first, Stage if admin, then Devices, About always last); on mobile the same tabs are a horizontal equal-width row. Only the tab panel scrolls. Dialog title uses `font-sans` (Raleway), vertically aligned with Close. About shows the product version from the **root** `package.json` (same semver as the GitHub Release / git tag `vX.Y.Z`), injected at Vite build — do not hardcode it. About CTAs sit as a pair: **Source on GitHub** is an outline (`secondary`) button to the repo; **Buy me a coffee** is the filled (`primary`) button so support stays the visual ask. The author line links “Lucas Sims (SIMSDEV)” to `https://sims.dev.br`. Do not add a Portfolio button, and do not style both CTAs as primary.

Devices in Discord style on desktop: **two columns** (microphone select + input volume | speaker select + output volume); mic test + level meter span both columns; camera stays a full-width block below. Device prefs in `localStorage` (`coliseum.devices`), including input volume.

**Microphone test:** starting the test mutes the LiveKit room microphone if it was unmuted (and the member is not moderator-muted), plays a self-listen loopback, and shows a visible level meter. Stopping the test (or leaving Devices / closing the modal) ends loopback and turns the room mic back on **only if it was on before the test**.

# Related

- [Room follows HTML prototype](/rules/room-follows-html-prototype.md)
- [Stage pin grid](/rules/stage-pin-grid.md)
- [AGPLv3 and CLA](/rules/agplv3-and-cla.md)
- [Mobile first-class separate layout](/rules/mobile-first-class-separate-layout.md)
- [PWA and native share](/rules/pwa-and-native-share.md)
