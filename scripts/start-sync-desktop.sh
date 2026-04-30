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

if [[ -z "${FOCUSORANGE_SYNC_TOKEN:-}" ]]; then
  echo "FOCUSORANGE_SYNC_TOKEN is required. Copy .env.example to .env.local and set a long random token." >&2
  exit 1
fi

if [[ -z "${FOCUSORANGE_SYNC_ALLOWED_ORIGIN:-}" ]]; then
  echo "FOCUSORANGE_SYNC_ALLOWED_ORIGIN is required, for example https://focusorange.pages.dev." >&2
  exit 1
fi

cd "${ROOT_DIR}"
npm run desktop
