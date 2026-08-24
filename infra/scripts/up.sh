#!/usr/bin/env bash
# Start Valkey + LiveKit (no OME). Chat/voice/camera/screenshare work without OME.
set -euo pipefail
# shellcheck source=_lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_lib.sh"

compose up -d "$@"
echo
echo "LiveKit HTTP/WS:  http://localhost:7880  (ws://localhost:7880)"
echo "Valkey:           localhost:6379  (RESP; LiveKit DB 1; API is SQLite)"
echo "OME is off. Watch-party ingest: make ome-up"
echo "Smoke:            make smoke"
