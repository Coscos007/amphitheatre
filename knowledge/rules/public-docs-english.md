---
type: Rule
title: Public docs in English
description: README, CONTRIBUTING, CLA, AGENTS, LICENSE, docs/, infra/README.md, and the OKF catalog in knowledge/ are English. UI copy stays i18n en / pt-BR / es.
tags: [docs, i18n, process]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T08:00:00Z }
sources:
  - id: readme
    resource: README.md
    title: README (English)
  - id: agents
    resource: AGENTS.md
    title: AGENTS.md
  - id: contributing
    resource: CONTRIBUTING.md
    title: CONTRIBUTING.md
  - id: knowledge
    resource: knowledge/index.md
    title: OKF catalog root
---

# Rule

Public and operational documents at the **repo root**, in **`docs/`**, in **`infra/README.md`**, and in the OKF catalog **`knowledge/`** **MUST** be **English**:

- `README.md`
- `CONTRIBUTING.md`
- `CLA.md`
- `AGENTS.md`
- `LICENSE` (GNU text)
- `docs/getting-started.md`, `docs/configuration.md`, `docs/api.md`, `docs/identity.md`, `docs/broadcast.md`, `docs/architecture.md`, `docs/license.md`, `docs/load-testing.md`
- `infra/README.md`
- `knowledge/` (OKF catalog: product, rules, changes, references, log)

Do not switch these files back to Portuguese without an explicit request.

UI copy stays i18n `en` / `pt-BR` / `es`. YAML keys in the catalog stay English.

Agents: when creating a new guide in `docs/`, editing README/CONTRIBUTING/AGENTS, or adding OKF files under `knowledge/`, write in English. Do not mix languages in the same file.

# Related

- [i18n en pt es](/rules/i18n-en-pt-es.md)
- [No emoji in UI or docs](/rules/no-emoji-in-ui-or-docs.md)
- [AGPLv3 and CLA](/rules/agplv3-and-cla.md)
- [API contract frozen](/rules/api-contract-frozen.md)

[^readme]: README (English)
[^agents]: AGENTS.md
[^contributing]: CONTRIBUTING.md
[^knowledge]: OKF catalog root
