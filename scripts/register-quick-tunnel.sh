#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -f "${ROOT_DIR}/.env.local" ]]; then
  while IFS='=' read -r key value; do
    [[ -z "${key}" || "${key}" == \#* ]] && continue
    if [[ -z "$(printenv "${key}" || true)" ]]; then
      export "${key}=${value}"
    fi
  done < "${ROOT_DIR}/.env.local"
fi

if [[ -z "${FOCUSORANGE_ROUTER_ADMIN_TOKEN:-}" ]]; then
  echo "FOCUSORANGE_ROUTER_ADMIN_TOKEN is required in .env.local." >&2
  exit 1
fi

if [[ $# -ne 1 ]]; then
  echo "Usage: npm run sync:register-tunnel -- https://your-quick-tunnel.trycloudflare.com" >&2
  exit 1
fi

TUNNEL_URL="${1%/}"
ROUTER_URL="${FOCUSORANGE_ROUTER_URL:-https://focusorange-sync-router.august20050716.workers.dev}"

curl --fail --show-error --silent \
  -X POST "${ROUTER_URL}/router/register" \
  -H "Authorization: Bearer ${FOCUSORANGE_ROUTER_ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{\"tunnelUrl\":\"${TUNNEL_URL}\"}"

printf "\n"
