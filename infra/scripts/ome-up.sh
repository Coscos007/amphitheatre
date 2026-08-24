#!/usr/bin/env bash
# Start OME in addition to the default stack (Valkey + LiveKit).
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_lib.sh"

compose --profile ome up -d
echo
echo "RTMP ingest:   rtmp://localhost:1935/app/{roomId}"
echo "WebRTC play:   ws://localhost:3333/app/{roomId}"
echo "LLHLS play:    http://localhost:3333/app/{roomId}/llhls.m3u8"
echo "OME REST:      http://localhost:8081  (Basic token from .env)"
