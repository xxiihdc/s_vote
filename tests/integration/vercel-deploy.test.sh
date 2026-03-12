#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${VERCEL_PREVIEW_URL:-}" && -z "${VERCEL_URL:-}" ]]; then
  echo "VERCEL_PREVIEW_URL or VERCEL_URL must be set"
  exit 1
fi

TARGET_URL="${VERCEL_PREVIEW_URL:-${VERCEL_URL}}"

# Basic deploy reachability check
curl -fsSL "https://${TARGET_URL}" >/dev/null
