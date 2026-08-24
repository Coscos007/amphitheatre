---
type: Change
title: English README, split docs, AGENTS/CONTRIBUTING in English
description: Lean OME-style README (logo, shields, What is, Quick Start); contract/config/OBS extracted to docs/; operational root in English.
tags: [docs, readme, i18n]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T08:00:00Z }
sources:
  - id: readme
    resource: README.md
    title: README
  - id: api-docs
    resource: docs/api.md
    title: HTTP / WebSocket API
  - id: agents
    resource: AGENTS.md
    title: AGENTS.md
  - id: contributing
    resource: CONTRIBUTING.md
    title: CONTRIBUTING.md
  - id: rule-en
    resource: /rules/public-docs-english.md
    title: Public docs in English
  - id: rule-api
    resource: /rules/api-contract-frozen.md
    title: API contract frozen
---

# What landed

- `README.md` in English, in the spirit of the OvenMediaEngine README: centered horizontal wordmark (`docs/images/amphitheatre-wordmark.webp`), shields (AGPL, LiveKit v1.13.5, OME v0.21.0, Bun, Valkey), short summary, What is, Features, Quick Start, Documentation, Contribute, License.
- Smaller guides in `docs/`: getting-started, configuration, api (HTTP/WS contract), identity, broadcast, architecture, license, load-testing.
- `AGENTS.md`, `CONTRIBUTING.md`, `apps/web/README.md`, and `infra/README.md` in English. CLA Assistant comment in English only. `CLA.md` and `LICENSE` were already English.
- Frozen contract points to `docs/api.md` (no longer a README section). OME stream key in `infra/README.md` aligned to `{roomId}-{secret}`.
- Rule [public-docs-english](/rules/public-docs-english.md): root + docs/ + infra/README in English. At the time of this change `knowledge/` was still PT-BR; the catalog language was later set to English in the same rule.

# Why

Request for a simpler README, centered logo/shields, OME style, and important root documents in English.

# Related

- [Public docs in English](/rules/public-docs-english.md)
- [API contract frozen](/rules/api-contract-frozen.md)
- [AGPLv3 and CLA](/rules/agplv3-and-cla.md)

[^readme]: README
[^api-docs]: HTTP / WebSocket API
[^agents]: AGENTS.md
[^contributing]: CONTRIBUTING.md
[^rule-en]: Public docs in English
[^rule-api]: API contract frozen
