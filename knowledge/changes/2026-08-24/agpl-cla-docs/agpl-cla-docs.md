---
type: Change
title: AGPLv3, ICLA, and project README
description: Public AGPL-3.0-only license, SIMSDEV ICLA, CLA Assistant, README in the style of other SIMSDEV projects, and CONTRIBUTING.
tags: [docs, license, cla]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T07:22:00Z }
sources:
  - id: license
    resource: LICENSE
    title: GNU AGPL v3
  - id: readme
    resource: README.md
    title: Monorepo README
  - id: contributing
    resource: CONTRIBUTING.md
    title: CONTRIBUTING
  - id: cla
    resource: CLA.md
    title: ICLA
  - id: workflow
    resource: .github/workflows/cla.yml
    title: CLA Assistant
  - id: rule
    resource: /rules/agplv3-and-cla.md
    title: AGPLv3 and CLA
---

# What landed

- `LICENSE` with the SPDX AGPL-3.0-only text. Root `package.json`, `@coliseum/api`, `@coliseum/web`, and `@coliseum/shared` with `"license": "AGPL-3.0-only"` (the root previously said MIT).
- `README.md` restructured (header, what it is, how it works, features, quickstart, HTTP contract, license/CLA), in the spirit of the yaoe-flow and lazy-nevis READMEs, with no emoji. The HTTP/WS contract section was kept and gained `POST /webhooks/livekit`.
- `CONTRIBUTING.md` with setup, rules, PR flow, and the CLA Assistant process.
- `CLA.md` — ICLA in English: inbound license to SIMSDEV with relicensing (commercial SaaS); public outbound AGPL-3.0-only; the contributor retains copyright.
- `.github/workflows/cla.yml` (`contributor-assistant/github-action@v2.6.1`) asking for the canonical signature phrase.
- Rule [AGPLv3 and CLA](/rules/agplv3-and-cla.md).

# Why

Request for GitHub documentation and licensing: AGPLv3 to block closed SaaS of the community edition, with an ICLA so SIMSDEV can offer paid infrastructure later.

# Related

- [AGPLv3 and CLA](/rules/agplv3-and-cla.md)
- [API contract frozen](/rules/api-contract-frozen.md)
- [App name is Amphitheatre](/rules/app-name-amphitheatre.md)

[^license]: GNU AGPL v3
[^readme]: Monorepo README
[^contributing]: CONTRIBUTING
[^cla]: ICLA
[^workflow]: CLA Assistant
[^rule]: AGPLv3 and CLA
