---
type: Rule
title: CHANGELOG and release process
description: Every feature/fix adds a bullet to CHANGELOG.md's Unreleased section (English, Keep a Changelog). Releases are a manual git tag that triggers GitHub Release + multi-arch Docker Hub publish.
tags: [process, docs, ci, docker, release]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-24T09:00:00Z }
sources:
  - id: changelog
    resource: CHANGELOG.md
    title: Keep a Changelog
  - id: agents
    resource: AGENTS.md
    title: How to record a change / Releases
  - id: workflow
    resource: .github/workflows/release.yml
    title: Release workflow
  - id: script
    resource: scripts/extract-changelog.sh
    title: Changelog section extractor
---

# Rule

Every feature or fix gets a bullet under `## [Unreleased]` in the root `CHANGELOG.md`, in English, using [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) categories (`Added` / `Changed` / `Fixed` / `Removed`). This is in **addition** to the OKF change bundle in `knowledge/changes/`, not instead of it — the OKF bundle is the detailed record, `CHANGELOG.md` is the macro one a human skims before upgrading.

Releasing a new version is a **manual** flow, never automatic on merge to `main`:

1. Move `[Unreleased]`'s content into a new `## [X.Y.Z] - YYYY-MM-DD` section; leave `[Unreleased]` empty above it.
2. Bump `version` in the root `package.json` to match.
3. `git tag vX.Y.Z && git push --tags`.
4. `.github/workflows/release.yml` extracts that version's section (`scripts/extract-changelog.sh`) to create the GitHub Release (always English), then builds and pushes a multi-arch (`linux/amd64` + `linux/arm64`) image to Docker Hub as `simstosh/amphitheatre:vX.Y.Z`, `:X.Y`, and `:latest`.

Do not tag, release, or push to Docker Hub without the user explicitly asking in that message — this is a variant of the "no upstream PRs / no unrequested releases" discipline already in `AGENTS.md`.

# Related

- [Public docs in English](public-docs-english.md)
- [Pin Compose images](pin-compose-images.md)
