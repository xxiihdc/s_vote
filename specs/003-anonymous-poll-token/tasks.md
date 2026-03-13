# Tasks: Anonymous Vote With Token Result URL

**Input**: Design documents from `/specs/003-anonymous-poll-token/`
**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `research.md`, `data-model.md`, `contracts/`

**Tests**: Tests are required by spec/constitution for every user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared contracts and test scaffolding for token-result feature.

- [ ] T001 Align token-result API contract types in `src/types/contracts.ts` from `specs/003-anonymous-poll-token/contracts/token-results.openapi.yaml`
- [ ] T002 [P] Add token route/page placeholders in `app/api/votes/results/[token]/route.ts` and `app/results/[token]/page.tsx`
- [ ] T003 [P] Create/adjust feature test stubs in `tests/contract/token-results.contract.test.ts` and `tests/integration/token-results.integration.test.ts`
- [ ] T004 [P] Add token lifecycle env declarations in `src/lib/env.ts` for expiry and refresh interval settings

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement core token security and persistence prerequisites used by all stories.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

- [ ] T005 Create migration for token hash + expiry fields and indexes in `supabase/migrations/20260313_add_result_token_to_votes.sql`
- [ ] T006 [P] [Security] Add/adjust RLS policies for read-only token result access in `supabase/migrations/20260313_add_result_token_to_votes.sql`
- [ ] T007 [P] Implement token generation/hash/compare helpers in `src/lib/vote/token.ts`
- [ ] T008 [P] Implement token status checks (active/expired/archived/deleted) in `src/lib/vote/token-access.ts`
- [ ] T009 [P] Add result aggregation query helper for token path in `src/lib/vote/service.ts`
- [ ] T010 [Observability] Add token-create and token-read log helpers in `src/lib/vote/logging.ts`
- [ ] T011 [P] Add token-safe error mapping utilities in `src/lib/vote/validate.ts` for 404/410/not-available responses

**Checkpoint**: Foundation ready; user story implementation can proceed.

---

## Phase 3: User Story 1 - Create Vote Without Login (Priority: P1) 🎯 MVP

**Goal**: Anonymous user creates a vote and receives a unique tokenized result URL.

**Independent Test**: Submit valid vote without login and receive `resultUrl`; invalid inputs are rejected with validation errors.

### Tests for User Story 1

- [ ] T012 [P] [US1] Add contract test for `POST /api/votes` tokenized response in `tests/contract/token-results.contract.test.ts`
- [ ] T013 [P] [US1] Add integration test for anonymous create-to-resultUrl flow in `tests/integration/token-results.integration.test.ts`
- [ ] T014 [P] [US1] Add unit tests for token helper behavior in `tests/unit/vote-token.test.ts`

### Implementation for User Story 1

- [ ] T015 [US1] Update create vote API to generate token, store token hash, and return `resultUrl` in `app/api/votes/route.ts`
- [ ] T016 [US1] Add token expiry persistence and validation at create-time in `src/lib/vote/service.ts`
- [ ] T017 [US1] Update create form success state to expose/copy token URL in `app/votes/create/page.tsx`
- [ ] T018 [US1] [Observability] Add correlation-aware create success/failure logs in `app/api/votes/route.ts`
- [ ] T019 [US1] [Security] Ensure create response excludes raw token internals and secret fields in `app/api/votes/route.ts`

**Checkpoint**: US1 is independently functional and can be demoed as MVP.

---

## Phase 4: User Story 2 - View Results With Token URL (Priority: P1)

**Goal**: Anyone with a valid token URL can view vote results without login.

**Independent Test**: Open token URL in incognito/new browser and confirm results load; invalid/expired token returns explicit unavailable message.

### Tests for User Story 2

- [ ] T020 [P] [US2] Extend contract test for `GET /api/votes/results/{token}` success and `404/410` cases in `tests/contract/token-results.contract.test.ts`
- [ ] T021 [P] [US2] Add integration test for token results page rendering and invalid-token behavior in `tests/integration/token-results.integration.test.ts`
- [ ] T022 [P] [US2] Add unit tests for token state transitions in `tests/unit/vote-token-access.test.ts`

### Implementation for User Story 2

- [ ] T023 [US2] Implement token results API route resolving token hash and returning aggregate payload in `app/api/votes/results/[token]/route.ts`
- [ ] T024 [US2] Implement token results page loader and error states in `app/results/[token]/page.tsx`
- [ ] T025 [US2] Add empty-results state UI for zero-response vote in `app/results/[token]/page.tsx`
- [ ] T026 [US2] Add malformed-token guard and normalization in `app/api/votes/results/[token]/route.ts`
- [ ] T027 [US2] [Security] Enforce read-only token path and redact token values in logs in `app/api/votes/results/[token]/route.ts`
- [ ] T028 [US2] [Observability] Add latency + outcome logs for token resolution in `app/api/votes/results/[token]/route.ts`

**Checkpoint**: US2 is independently testable and stable for valid/invalid/expired tokens.

---

## Phase 5: User Story 3 - Shareable and Stable Access (Priority: P2)

**Goal**: Creator can share token URL; recipients can reliably access consistent results across clients over time.

**Independent Test**: Copy/share token URL and open from multiple browsers/devices; observe consistent access while token remains valid.

### Tests for User Story 3

- [ ] T029 [P] [US3] Add integration test for share-url copy/open across sessions in `tests/integration/token-sharing.integration.test.ts`
- [ ] T030 [P] [US3] Add integration test for results refresh after new votes in `tests/integration/token-results-refresh.integration.test.ts`
- [ ] T031 [P] [US3] Add unit test for token URL generation consistency in `tests/unit/vote-token-url.test.ts`

### Implementation for User Story 3

- [ ] T032 [US3] Implement reusable copy-token-url action/component in `app/votes/create/page.tsx`
- [ ] T033 [US3] Implement bounded auto-refresh/revalidation for token results page in `app/results/[token]/page.tsx`
- [ ] T034 [US3] Add stale-to-unavailable transition handling when token expires during viewing in `app/results/[token]/page.tsx`
- [ ] T035 [US3] [Observability] Add refresh/expiration transition logs in `app/results/[token]/page.tsx`
- [ ] T036 [US3] [Docker] Validate token-share flow via CI checks in `scripts/ci-check.sh` and `tests/integration/vercel-build.test.sh`

**Checkpoint**: US3 sharing and stable read behavior works independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening across all stories.

- [ ] T037 [P] Update quickstart validation steps for token flow in `specs/003-anonymous-poll-token/quickstart.md`
- [ ] T038 [P] Add regression assertions for create validation + token lookup in `tests/unit/vote-validation.test.ts`
- [ ] T039 [Security] Re-verify token path does not expose internal metadata in `app/api/votes/results/[token]/route.ts` and `src/lib/vote/service.ts`
- [ ] T040 [Observability] Validate correlation IDs and redaction coverage in `src/lib/logger.ts` and `src/lib/vote/logging.ts`
- [ ] T041 [Docker] Run full containerized quality gate script in `scripts/ci-check.sh`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 2 and output from US1 create response contract.
- **Phase 5 (US3)**: Depends on Phase 4 token result path.
- **Phase 6 (Polish)**: Depends on completed target stories.

### User Story Dependencies

- **US1 (P1)**: First shippable MVP increment.
- **US2 (P1)**: Builds on US1 token URL contract; independently testable once token endpoint exists.
- **US3 (P2)**: Builds on US2 page/API and adds sharing + stability behavior.

### Within Each User Story

- Write tests first and confirm initial failures.
- Implement service/endpoint logic before UI refinements.
- Complete security + observability tasks before story sign-off.

---

## Parallel Opportunities

- Setup parallel: `T002`, `T003`, `T004`
- Foundation parallel after migration baseline: `T006`–`T011`
- US1 tests parallel: `T012`, `T013`, `T014`
- US2 tests parallel: `T020`, `T021`, `T022`
- US3 tests parallel: `T029`, `T030`, `T031`
- Polish parallel: `T037`, `T038`

---

## Parallel Example: User Story 2

```bash
# Run contract + integration token-read tests together
Task: "T020 [US2] contract token-read responses"
Task: "T021 [US2] integration token-page behavior"

# Implement API and page in parallel streams, then integrate
Task: "T023 [US2] API token resolution route"
Task: "T024 [US2] results page loader and states"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2.
2. Complete US1 (Phase 3).
3. Validate anonymous create + token URL generation end-to-end.
4. Demo/release MVP.

### Incremental Delivery

1. Add US2 token result access and explicit invalid/expired handling.
2. Add US3 shareability + stable refresh behavior.
3. Finish polish/security/observability/docker gates.

### Parallel Team Strategy

1. Team completes Setup + Foundation.
2. Then split by streams:
   - Stream A: API token resolution + security hardening.
   - Stream B: results page UX + refresh behavior.
   - Stream C: contract/integration automation and CI gates.

---

## Notes

- `[P]` means task is parallelizable (different files, no blocking dependency).
- `[US1]`, `[US2]`, `[US3]` labels map tasks directly to feature user stories.
- Every task includes a concrete file path and is written for immediate execution.
