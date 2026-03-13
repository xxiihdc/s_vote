#!/usr/bin/env bash
set -euo pipefail

# Smoke test: verify Vercel/Next.js build succeeds
npm run test -- tests/integration/token-results.integration.test.ts tests/integration/token-sharing.integration.test.ts
npm run build
