---
type: Rule
title: Self-aware knowledge
description: A durable preference or feature constraint stated by the user must become (or update) a file in knowledge/rules/.
tags: [process, okf, agents]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T08:38:00Z }
sources:
  - id: spec
    resource: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
    title: OKF SPEC v0.2
  - id: agents
    resource: AGENTS.md
    title: Repo AGENTS.md
---

# Rule

When the user states, in this project, any of the following:

- “this feature must work as X”
- a product/process preference that must hold **after this conversation**
- a veto (do not record, do not depend on OME, owner does not drop, etc.)
- API contract, i18n, theme, layout, limits

the agent **MUST** create or update a concept in `knowledge/rules/` (a `.md` file with OKF frontmatter `type: Rule`). If the rule already exists, edit it; do not create a duplicate. Adjust `knowledge/rules/index.md`, `knowledge/index.md`, and `knowledge/log.md`.

**Never** leave the constraint only in the chat history.

If the change is product (what the user sees) and not process-only, also update `knowledge/product/<feature>/`. If code already landed, record `knowledge/changes/<yyyy-MM-dd>/<feature>/`.

Minimum frontmatter: `type`, `title`, `description`, `generated: { by, at }`. Bundle-relative links with `/`. No emoji. Prose in English; YAML keys in English.

Do not use `verified: { by: human:... }` unless the user has actually reviewed the file.

# Related

- [Root catalog](/index.md)
- How to record changes: `AGENTS.md`

[^spec]: OKF SPEC v0.2
[^agents]: Repo AGENTS.md
