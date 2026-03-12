#!/usr/bin/env bash
set -euo pipefail

# Smoke test: verify Vercel/Next.js build succeeds
npm run build
