#!/usr/bin/env bash
# Stop the default stack. OME/Caddy (other profiles) are also stopped if running.
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_lib.sh"

compose --profile ome --profile caddy down "$@"
