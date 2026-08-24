---
type: Change
title: OKF catalog in English
description: Entire knowledge/ OKF bundle translated to English. Catalog prose is English; UI i18n stays en/pt-BR/es.
tags: [docs, okf, i18n]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T08:45:00Z }
sources:
  - id: catalog
    resource: knowledge/index.md
    title: OKF catalog root
  - id: rule
    resource: /rules/public-docs-english.md
    title: Public docs in English
  - id: self-aware
    resource: /rules/self-aware-knowledge.md
    title: Self-aware knowledge
---

# What landed

- All OKF files under `knowledge/` (product, rules, changes, references, log, indexes) are English.
- [public-docs-english](/rules/public-docs-english.md) now includes `knowledge/`.
- [self-aware-knowledge](/rules/self-aware-knowledge.md): prose in English; YAML keys in English.
- Historical plan remains `status: deprecated`, translated, with a note that SQLite, guest JWT, and optional OME superseded the draft.
- OBS ingest product doc: stream key aligned to `{roomId}-{secret}`.

# Why

User request: OKF catalog must be English, like README/CONTRIBUTING/AGENTS.

# Related

- [Public docs in English](/rules/public-docs-english.md)
- [i18n en pt es](/rules/i18n-en-pt-es.md)

[^catalog]: OKF catalog root
[^rule]: Public docs in English
[^self-aware]: Self-aware knowledge
