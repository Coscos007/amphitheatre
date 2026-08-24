---
type: Rule
title: AGPLv3 and CLA
description: Public edition AGPL-3.0-only; PRs require an ICLA (CLA Assistant) so SIMSDEV can relicense, including commercial SaaS.
tags: [license, cla, process, legal]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T07:22:00Z }
sources:
  - id: license
    resource: LICENSE
    title: GNU AGPL v3
  - id: cla
    resource: CLA.md
    title: Individual Contributor License Agreement
  - id: contributing
    resource: CONTRIBUTING.md
    title: Contribution guide
  - id: workflow
    resource: .github/workflows/cla.yml
    title: CLA Assistant GitHub Action
  - id: license-docs
    resource: docs/license.md
    title: License and CLA
---

# Rule

The public Amphitheatre tree is **AGPL-3.0-only** (`LICENSE` file, `license` field in `package.json`). Do not revert to MIT/Apache without an explicit request from the steward. Do not add clauses that weaken network copyleft (AGPL exists to close proprietary SaaS built on community code).

Third-party contributions require the **ICLA** in `CLA.md` (English). The inbound license grants **SIMSDEV** the right to relicense (including a paid hosted edition). The outbound license of the public edition remains AGPL-3.0-only. Forks of the public tree remain AGPL.

Every Pull Request must pass the [CLA Assistant](.github/workflows/cla.yml) workflow. The signature phrase is exactly:

`I have read the CLA Document and I hereby sign the CLA`

Do not create `signatures/version1/cla.json` by hand. Do not accept a merge of a human PR without a signed ICLA. Bots on the workflow allowlist do not sign.

Agents **must not**:

- relicense the repo (change SPDX, delete LICENSE, swap AGPL for MIT) unless the user asks
- invent a CCLA or alter the ICLA without a request
- document the OME admission webhook as implemented
- claim that AGPL “forbids” hosting Amphitheatre — hosting is allowed if the modified source is offered under AGPL

Dependencies (LiveKit, OME, Valkey, npm) keep their own licenses. The ICLA does not relicense them.

# Related

- [API contract frozen](/rules/api-contract-frozen.md) (contract in docs/api.md)
- [Public docs in English](/rules/public-docs-english.md)
- [Self-aware knowledge](/rules/self-aware-knowledge.md)
- [No recording](/rules/no-recording.md)

[^license]: GNU AGPL v3
[^cla]: Individual Contributor License Agreement
[^contributing]: Contribution guide
[^workflow]: CLA Assistant GitHub Action
[^license-docs]: License and CLA
