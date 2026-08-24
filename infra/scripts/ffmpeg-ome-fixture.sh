#!/usr/bin/env bash
# Push a test pattern to OME via RTMP (no OBS required).
# Usage: ffmpeg-ome-fixture.sh [roomId]
# Play: ws://localhost:3333/app/{roomId}  or  http://localhost:3333/app/{roomId}/llhls.m3u8
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_lib.sh"

ROOM="${1:-smoketest}"
URL="rtmp://127.0.0.1:1935/app/${ROOM}"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found. Install it (e.g. brew install ffmpeg) or use OBS — see infra/README.md" >&2
  exit 1
fi

echo "Publishing testsrc → ${URL}"
echo "Stop with Ctrl+C. Recording is not used."
exec ffmpeg -hide_banner -re \
  -f lavfi -i "testsrc=size=1280x720:rate=30" \
  -f lavfi -i "sine=frequency=1000:sample_rate=48000" \
  -c:v libx264 -preset veryfast -tune zerolatency \
  -profile:v baseline -pix_fmt yuv420p \
  -g 30 -keyint_min 30 -sc_threshold 0 \
  -b:v 2500k -maxrate 2500k -bufsize 2500k \
  -c:a aac -b:a 128k -ar 48000 -ac 2 \
  -f flv "$URL"
