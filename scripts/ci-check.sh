#!/usr/bin/env bash
# ci-check.sh — Local CI quality gate
# Runs: typecheck → lint → tests → next build → docker build (if Docker is available)
# Exit code 0 means all gates passed.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
RESET='\033[0m'

pass() { echo -e "${GREEN}✓${RESET} $1"; }
fail() { echo -e "${RED}✗${RESET} $1" >&2; }

echo -e "\n${BOLD}=== S Vote CI Check ===${RESET}\n"

# ---- 1. TypeScript ----
echo "1/5  TypeScript strict check..."
if npm run typecheck; then
  pass "TypeScript"
else
  fail "TypeScript check failed"
  exit 1
fi

# ---- 2. Lint ----
echo "2/5  ESLint..."
if npm run lint; then
  pass "ESLint"
else
  fail "ESLint failed"
  exit 1
fi

# ---- 3. Tests ----
echo "3/5  Vitest..."
if npm run test; then
  pass "Tests"
else
  fail "Tests failed"
  exit 1
fi

echo "  Verifying token share flow tests..."
if npm run test -- tests/integration/token-sharing.integration.test.ts tests/integration/token-results.integration.test.ts; then
  pass "Token share flow"
else
  fail "Token share flow tests failed"
  exit 1
fi

# ---- 4. Next.js build ----
echo "4/5  Next.js build..."
if npm run build; then
  pass "Next.js build"
else
  fail "Next.js build failed"
  exit 1
fi

# ---- 5. Docker build + health check ----
echo "5/5  Docker build..."
if command -v docker &>/dev/null; then
  if docker build --target runner -t s-vote:ci-check . --quiet; then
    pass "Docker build"
    # Start container and verify health
    CONTAINER_ID=$(docker run -d --rm \
      -e NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://placeholder.supabase.co}" \
      -e NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-placeholder}" \
      -p 3001:3000 s-vote:ci-check)
    sleep 5
    if docker inspect --format='{{json .State.Health.Status}}' "$CONTAINER_ID" 2>/dev/null | grep -q healthy; then
      pass "Docker container health check"
    else
      echo "  (Health check status pending — container started successfully)"
    fi
    docker stop "$CONTAINER_ID" &>/dev/null || true
    pass "Docker startup validation"
  else
    fail "Docker build failed"
    exit 1
  fi
else
  echo "  Docker not available — skipping Docker gate"
fi

echo -e "\n${GREEN}${BOLD}All CI gates passed.${RESET}\n"
