---
type: Change
title: Monorepo scaffold
description: pnpm workspace with apps/api, apps/web, packages/shared and shared contract types.
tags: [bootstrap, monorepo, shared]
status: stable
generated: { by: coding_agent/composer, at: 2026-08-22T08:21:00Z }
sources:
  - id: workspace
    resource: pnpm-workspace.yaml
    title: packages apps/* and packages/*
  - id: root-pkg
    resource: package.json
    title: scripts dev/test/typecheck
  - id: shared
    resource: packages/shared/src/index.ts
    title: @coliseum/shared
---

# What landed

pnpm monorepo (`pnpm-workspace.yaml`: `apps/*`, `packages/*`). Packages `@coliseum/api`, `@coliseum/web`, `@coliseum/shared`. Root scripts: `dev`, `dev:api`, `dev:web`, `typecheck` (shared+api), `test` (api), `infra:*` shortcuts.

`packages/shared` exports room/session/media types, roles, `apiPaths`, limits, WS events, `errorCodes`. API and web depend via `workspace:*`.

# Files

- `pnpm-workspace.yaml`, `package.json`, `pnpm-lock.yaml`
- `packages/shared/package.json`, `tsconfig.json`, `src/{index,types,events,roles,errors,paths}.ts`
- `apps/api/package.json`, `apps/web/package.json`
- `README.md` (monorepo map)

# Why

A single TypeScript contract avoids drift between Hono and Vite. The plan cited exactly this `apps/` + `packages/shared` tree.

# Links

- [Vision](/product/vision/vision.md)
- [Shared types in packages/shared](/rules/shared-types-in-packages-shared.md)
- [API contract frozen](/rules/api-contract-frozen.md)

[^workspace]: packages apps/* and packages/*
[^root-pkg]: scripts dev/test/typecheck
[^shared]: @coliseum/shared
