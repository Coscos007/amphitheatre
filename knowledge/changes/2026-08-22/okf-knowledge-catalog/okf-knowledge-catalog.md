---
type: Change
title: OKF catalog + AGENTS.md
description: OKF 0.2 bundle in knowledge/ and operational AGENTS.md at the root. Original plan preserved.
tags: [bootstrap, okf, agents]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: spec
    resource: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
    title: OKF SPEC v0.2 canonical
  - id: agents
    resource: AGENTS.md
    title: AGENTS.md
  - id: index
    resource: /index.md
    title: Bundle root
  - id: plan
    resource: /references/plano-watchparty-miniDiscord.md
    title: Historical plan
---

# What landed

- `AGENTS.md` at the root (how to run, map, product rules, how to write changes)
- `knowledge/` bundle with `index.md` (`okf_version: "0.2"`), `log.md`, product, rules, changes/2026-08-22, references
- OKF frontmatter on the original plan (`type: Reference`, `status: deprecated`); body intact
- One line in the README pointing agents to `AGENTS.md` + `knowledge/`

# Files

- `AGENTS.md`
- `knowledge/index.md`, `knowledge/log.md`
- `knowledge/product/**`, `knowledge/rules/**`, `knowledge/changes/2026-08-22/**`
- `knowledge/references/index.md` and frontmatter in `plano-watchparty-miniDiscord.md`
- `README.md` (bridge)

# Why

Agents need a navigable corpus (progressive disclosure via `index.md`) with provenance and types, plus a short runbook outside the bundle.

# Links

- [Self-aware knowledge](/rules/self-aware-knowledge.md)
- [Vision](/product/vision/vision.md)

[^spec]: OKF SPEC v0.2 canonical
[^agents]: AGENTS.md
[^index]: Bundle root
[^plan]: Historical plan
