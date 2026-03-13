# Tasks: Initialize Next.js + Supabase + Vercel Project

**Input**: Design documents from `/specs/001-init-nextjs-docker-supabase/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/bootstrap-openapi.yaml, quickstart.md

**Tests**: Tests are mandatory per constitution and feature requirements.

**Organization**: Tasks are grouped by user story for independent implementation and verification.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize repository-level tooling and base structure.

- [X] T001 Initialize Next.js TypeScript app scaffold and scripts in package.json
- [X] T002 Create base App Router files in app/page.tsx and app/layout.tsx
- [X] T003 [P] Configure TypeScript strict settings in tsconfig.json
- [X] T004 [P] Add lint/format configs in eslint.config.mjs and .prettierrc
- [X] T005 [P] Create baseline directories and placeholders in src/lib/.gitkeep, src/types/.gitkeep, tests/unit/.gitkeep, tests/integration/.gitkeep, supabase/migrations/.gitkeep, supabase/functions/.gitkeep
- [X] T040 Add Dockerfile for Next.js production build with pinned base image in Dockerfile
- [X] T041 [P] Add Docker Compose configuration for local dev environment in docker-compose.yml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core shared modules required by all stories.

**CRITICAL**: No user story implementation starts until this phase is complete.

- [X] T006 Implement environment schema and parser in src/lib/env.ts
- [X] T042 Initialize Supabase project with CLI to generate supabase/config.toml
- [X] T007 [P] Define shared health/config contracts in src/types/contracts.ts
- [X] T008 [P] Implement structured logger utilities in src/lib/logger.ts
- [X] T009 [P] Create Supabase Browser Client factory in src/lib/supabase/browser.ts
- [X] T010 Add request correlation-id helper in src/lib/correlation.ts
- [X] T011 Configure test runner and test scripts in vitest.config.ts and package.json
- [X] T012 Add CI quality gate script for typecheck/lint/test/vercel-build in scripts/ci-check.sh

**Checkpoint**: Foundation ready; user stories can proceed.

---

## Phase 3: User Story 1 - Create Runnable Base App (Priority: P1) 🎯 MVP

**Goal**: Run app locally and initialize Supabase Browser Client safely.

**Independent Test**: App runs with `npm run dev`; frontend initializes Browser Client and tests pass.

### Tests for User Story 1 (MANDATORY)

- [X] T013 [P] [US1] Add frontend Supabase client contract test in tests/contract/supabase-client.contract.test.ts
- [X] T014 [P] [US1] Add frontend initialization integration test in tests/integration/frontend-bootstrap.test.ts
- [X] T015 [P] [US1] Add startup config unit test in tests/unit/env.test.ts

### Implementation for User Story 1

- [X] T016 [US1] Implement Browser Client bootstrap in src/lib/supabase/browser.ts and app/page.tsx
- [X] T017 [US1] Wire frontend supabase contract typing in src/types/contracts.ts and src/lib/supabase/browser.ts
- [X] T018 [US1] Add startup checks in src/lib/bootstrap.ts and import in app/layout.tsx
- [X] T019 [US1] [Observability] Emit structured startup logs in src/lib/logger.ts and app/page.tsx
- [X] T020 [US1] Update developer run instructions in README.md

**Checkpoint**: US1 can be demonstrated independently.

---

## Phase 4: User Story 2 - Vercel Deployment Baseline (Priority: P2)

**Goal**: Deploy frontend app through Vercel CI/CD from GitHub.

**Independent Test**: Vercel build and deployment succeed; preview URL is reachable.

### Tests for User Story 2 (MANDATORY)

- [X] T021 [P] [US2] Add Vercel build smoke test script in tests/integration/vercel-build.test.sh
- [X] T022 [P] [US2] Add deployment URL verification script in tests/integration/vercel-deploy.test.sh

### Implementation for User Story 2

- [X] T023 [US2] Configure Vercel project and build settings in vercel.json and package.json
- [X] T024 [US2] Add GitHub-to-Vercel deployment configuration docs in README.md
- [X] T025 [US2] [Observability] Ensure deployment/build logs remain structured in scripts/ci-check.sh and README.md
- [X] T026 [US2] Add Vercel environment variable mapping docs in specs/001-init-nextjs-docker-supabase/quickstart.md
- [X] T027 [US2] Validate preview and production deployment workflow in specs/001-init-nextjs-docker-supabase/quickstart.md

**Checkpoint**: US2 can be demonstrated independently.

---

## Phase 5: User Story 3 - Frontend Supabase + Edge Functions Baseline (Priority: P3)

**Goal**: Use Browser Client for frontend access and Edge Functions for admin operations.

**Independent Test**: Frontend calls Supabase with anon key; admin path executes only through Edge Function.

### Tests for User Story 3 (MANDATORY)

- [X] T028 [P] [US3] Add Supabase env validation unit tests in tests/unit/supabase-env.test.ts
- [X] T029 [P] [US3] Add Edge Function invocation tests in tests/unit/supabase-edge-function.test.ts
- [X] T030 [P] [US3] Add admin-operation integration test through Edge Function in tests/integration/admin-edge-function.test.ts

### Implementation for User Story 3

- [X] T031 [US3] Implement frontend data access wrapper using Browser Client in src/lib/supabase/browser.ts
- [X] T032 [US3] Implement Supabase Edge Function admin-task in supabase/functions/admin-task/index.ts
- [X] T033 [US3] [Security] Enforce service-role usage only inside Edge Function and document boundary in supabase/functions/admin-task/index.ts and README.md
- [X] T034 [US3] [Security] Add env example and secret handling guidance in .env.example and README.md
- [X] T035 [US3] [Observability] Add correlation-id propagation for frontend-to-edge-function calls in src/lib/correlation.ts and src/lib/supabase/browser.ts

**Checkpoint**: US3 can be demonstrated independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening across stories.

- [X] T036 [P] Add final regression test bundle command in package.json
- [X] T037 Run quickstart validation and align docs in specs/001-init-nextjs-docker-supabase/quickstart.md and README.md
- [X] T038 [P] Add CI pipeline example for typecheck/lint/test/vercel build in .github/workflows/ci.yml
- [X] T039 [Security] Add Supabase CLI operational checklist for migrations/functions in specs/001-init-nextjs-docker-supabase/quickstart.md
- [X] T043 Add Docker build and container startup health-check validation to scripts/ci-check.sh and .github/workflows/ci.yml
- [ ] T044 [P] Validate Supabase CLI migration apply locally with supabase db reset
- [ ] T045 [P] Validate Supabase CLI Edge Function deploy locally with supabase functions deploy admin-task

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) has no dependency.
- Foundational (Phase 2) depends on Setup (T040/T041 directories must exist for T042 supabase init) and blocks all user stories.
- User Stories (Phase 3-5) depend on Foundational completion.
- Polish (Phase 6) depends on all selected user stories completion; T043 Docker validation requires T040/T041; T044/T045 Supabase CLI validation requires T042.

### User Story Dependencies

- US1 (P1): starts after Phase 2; no dependency on US2/US3.
- US2 (P2): starts after Phase 2; depends on US1 artifacts for deployable frontend baseline.
- US3 (P3): starts after Phase 2; integrates with US1 browser client foundation.

### Within Each User Story

- Tests first and failing before implementation.
- Core implementation before observability/security hardening.
- Story docs updates before checkpoint sign-off.

### Parallel Opportunities

- Phase 1: T003, T004, T005, T041 can run in parallel; T040 (Dockerfile) can run in parallel with T041.
- Phase 2: T042 (supabase init) runs after T001/T005; T007, T008, T009 can run in parallel after T006.
- US1: T013, T014, T015 parallel.
- US2: T021, T022 parallel.
- US3: T028, T029, T030 parallel.
- Polish: T036 and T038 parallel; T044 and T045 parallel.

---

## Parallel Example: User Story 1

```bash
# Run US1 tests in parallel workstreams:
Task: "T013 [US1] frontend Supabase client contract test"
Task: "T014 [US1] frontend bootstrap integration test"
Task: "T015 [US1] startup config unit test"

# Then implement in parallel where possible:
Task: "T016 [US1] implement browser client bootstrap"
Task: "T018 [US1] startup bootstrap wiring"
```

## Parallel Example: User Story 2

```bash
Task: "T021 [US2] vercel build smoke test"
Task: "T022 [US2] vercel deploy verification"
```

## Parallel Example: User Story 3

```bash
Task: "T028 [US3] Supabase env validation tests"
Task: "T029 [US3] edge function invocation tests"
Task: "T030 [US3] admin edge function integration test"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete US1 tasks (T013-T020).
3. Validate local run + Browser Client bootstrap + tests.
4. Demo MVP baseline app.

### Incremental Delivery

1. Deliver US1 (runnable app + Browser Client bootstrap).
2. Deliver US2 (Vercel deployment baseline).
3. Deliver US3 (Supabase secure browser + Edge Functions baseline).
4. Finish polish tasks for CI and hardening.

### Parallel Team Strategy

1. Team collaborates on Phase 1-2.
2. After Phase 2:
   - Engineer A: US1
   - Engineer B: US2
   - Engineer C: US3
3. Merge after each story passes independent tests.
