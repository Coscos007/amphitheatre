# License and CLA

Amphitheatre is free software under the [GNU Affero General Public License v3.0](../LICENSE) (SPDX: `AGPL-3.0-only`), copyright [SIMSDEV](https://sims.dev.br).

## Why AGPL

We chose AGPL — not MIT/Apache — because Amphitheatre is a **network service**. AGPL closes the “SaaS loophole”: anyone who modifies this code and offers the modified version as a service on the internet must make the corresponding source available under the same license. That stops a company from taking the community theater, closing the source, and selling a proprietary Discord/watch-party on top of the public work.

In practice:

- You may use, study, modify, and **self-host** Amphitheatre.
- If you **offer** a modified version over the network, that version's source must be AGPL-3.0-only.
- Forks of the public repository stay AGPL. LiveKit, OvenMediaEngine, Valkey, and other dependencies keep their own licenses.

AGPL does **not** forbid hosting Amphitheatre. It requires that hosted modifications offer source.

## Why an ICLA

SIMSDEV (the project steward) wants to offer a **paid hosted edition** (managed infrastructure) later without being blocked by inbound copyleft on third-party contributions. Therefore:

1. The public repository **stays AGPL-3.0-only** — that is the community edition.
2. Every pull request needs the [ICLA](../CLA.md) (Individual Contributor License Agreement). The English term grants SIMSDEV a copyright license with **relicensing** rights, including commercial/proprietary, plus the AGPL license to the public.
3. You **keep copyright** in your contributions. The ICLA is a license, not an assignment.

When you open a PR, the [CLA Assistant](../.github/workflows/cla.yml) bot asks you to sign. Read [CLA.md](../CLA.md) and reply with **exactly**:

```
I have read the CLA Document and I hereby sign the CLA
```

Without that signature the PR is not accepted. If you contribute on behalf of an employer, do not sign the ICLA for that work until the entity signs a CCLA. See [CONTRIBUTING.md](../CONTRIBUTING.md) and section 10 of the ICLA.

Third-party dependencies (LiveKit, OME, Valkey, npm libraries) are **not** relicensed by the ICLA; each keeps its original license.
