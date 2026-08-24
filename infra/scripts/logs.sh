#!/usr/bin/env bash
# Follow logs. Usage: logs.sh [service...]   e.g. logs.sh livekit
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_lib.sh"

if [[ $# -eq 0 ]]; then
  compose --profile ome --profile caddy logs -f --tail=200
else
  compose --profile ome --profile caddy logs -f --tail=200 "$@"
fi
