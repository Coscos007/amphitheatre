#!/usr/bin/env bash
# Stop only OvenMediaEngine. LiveKit + Valkey stay up (independence test).
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_lib.sh"

compose stop ome
echo "OME stopped. LiveKit/Valkey should still be healthy — run: make smoke"
