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

PORT="${FOCUSORANGE_SYNC_PORT:-33687}"
HOST="${FOCUSORANGE_SYNC_HOST:-127.0.0.1}"
ORIGIN_URL="http://${HOST}:${PORT}"

echo "Starting Cloudflare Quick Tunnel for ${ORIGIN_URL}"
echo "Keep this terminal open. Copy the generated https://*.trycloudflare.com URL into FocusOrange Mac API URL on iPhone."

cloudflared tunnel --url "${ORIGIN_URL}"
