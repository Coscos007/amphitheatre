#!/usr/bin/env bash
# Health smoke: Valkey + LiveKit always; OME only if the container is running.
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_lib.sh"

need_env
# shellcheck disable=SC1091
set -a
source "$ROOT/.env"
set +a

fail=0
ok() { printf '  OK  %s\n' "$1"; }
bad() { printf '  FAIL %s\n' "$1"; fail=1; }

echo "== Valkey"
if docker exec coliseum-valkey valkey-cli ping 2>/dev/null | grep -q PONG; then
  ok "valkey PING"
else
  bad "valkey PING (is the stack up? make up)"
fi

echo "== LiveKit"
if docker exec coliseum-livekit wget -qO- http://127.0.0.1:7880/ 2>/dev/null | grep -q OK; then
  ok "LiveKit GET / (inside container)"
else
  bad "LiveKit HTTP on :7880 (is the stack up? make up)"
fi

echo "== OME (optional)"
if docker inspect -f '{{.State.Running}}' coliseum-ome 2>/dev/null | grep -q true; then
  token="${OME_API_ACCESS_TOKEN:-coliseum-dev-ome-token-change-me}"
  auth="$(printf '%s' "$token" | base64 | tr -d '\n')"
  if curl -sf -o /dev/null -H "Authorization: Basic ${auth}" "http://127.0.0.1:8081/v1/vhosts"; then
    ok "OME REST GET /v1/vhosts"
  else
    bad "OME REST on :8081 (check AccessToken vs Server.xml)"
  fi
  if curl -sf -o /dev/null "http://127.0.0.1:3333/"; then
    ok "OME HTTP :3333 (signalling/LLHLS bind)"
  else
    # OME may return 404 on / with a body; treat HTTP as up if we got a response.
    code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3333/" || true)"
    if [[ "$code" =~ ^[0-9]{3}$ ]]; then
      ok "OME HTTP :3333 (status ${code})"
    else
      bad "OME HTTP :3333 not reachable"
    fi
  fi
else
  echo "  skip OME container not running (expected without --profile ome)"
fi

echo "== Independence"
if docker inspect -f '{{.State.Running}}' coliseum-livekit 2>/dev/null | grep -q true; then
  ome_state="$(docker inspect -f '{{.State.Running}}' coliseum-ome 2>/dev/null || echo false)"
  ok "LiveKit running (OME running=${ome_state})"
else
  bad "LiveKit must run even when OME is absent"
fi

if [[ "$fail" -ne 0 ]]; then
  echo "Smoke failed."
  exit 1
fi
echo "Smoke passed."
