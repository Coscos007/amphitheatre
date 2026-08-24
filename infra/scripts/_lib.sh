#!/usr/bin/env bash
# Shared helpers for infra/scripts. Source this file; do not execute it.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose --project-directory "$ROOT" -f "$ROOT/docker-compose.yml")

need_env() {
  if [[ ! -f "$ROOT/.env" ]]; then
    echo "Missing .env — copy .env.example to .env first:" >&2
    echo "  cp .env.example .env" >&2
    exit 1
  fi
}

compose() {
  need_env
  "${COMPOSE[@]}" "$@"
}
