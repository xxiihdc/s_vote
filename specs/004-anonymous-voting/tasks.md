# Tasks: Anonymous User Voting

**Input**: Design documents from `/specs/004-anonymous-voting/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`

**Tests**: Tests are MANDATORY for constitution compliance. Every user story includes automated validation tasks.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared contracts and test scaffolding for anonymous vote submission.

- [x] T001 Align vote-submission shared contracts in `src/types/contracts.ts` from `specs/004-anonymous-voting/contracts/vote-submit.schema.ts`
- [x] T002 [P] Add contract test skeleton for vote submission API in `tests/contract/vote-submit.contract.test.ts`
- [x] T003 [P] Add integration test skeleton for anonymous vote journeys in `tests/integration/vote-submit.integration.test.ts`
- [x] T004 [P] Add unit test skeleton for IP extraction/hash behavior in `tests/unit/vote-ip-hash.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core server-side infrastructure required before any user story implementation.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T005 Promote `SUPABASE_SERVICE_ROLE_KEY` to required env in `src/lib/env.ts`
- [x] T006 [P] Add service-role Supabase client factory in `src/lib/supabase/server.ts`
- [x] T007 [P] Add vote submission payload/route-param validators in `src/lib/vote/validate.ts`
- [x] T008 [P] Add structured vote-submit logging helpers in `src/lib/vote/logging.ts`
- [x] T009 [P] Create IP utility module with `extractClientIp()` and `hashClientIp()` in `src/lib/vote/ip.ts`
- [x] T010 Implement service-layer helpers for vote eligibility and option validation in `src/lib/vote/service.ts`
- [x] T011 Implement service-layer UPSERT operation for `vote_responses` using `onConflict(vote_id,voter_fingerprint)` in `src/lib/vote/service.ts`
- [x] T012 Implement service-layer prior-response lookup by vote + hashed IP in `src/lib/vote/service.ts`
- [x] T013 Fix token-result aggregation query to use service-role client in `src/lib/vote/service.ts`
- [x] T014 Set default `RESULT_TOKEN_REFRESH_INTERVAL_MS` to `5000` in `src/lib/env.ts`
- [x] T015 Create API route handler scaffold for `POST /api/votes/[voteId]/responses` in `app/api/votes/[voteId]/responses/route.ts`

**Checkpoint**: Foundation complete — user story implementation can proceed.

---

## Phase 3: User Story 1 - Cast a Vote Without Login (Priority: P1) 🎯 MVP

**Goal**: Anonymous user can submit a valid vote without login and see confirmation.

**Independent Test**: Open a live poll URL without login, submit valid selection, receive success response, and verify results update within 5 seconds.

### Tests for User Story 1 (MANDATORY)

- [x] T016 [P] [US1] Implement contract test for 201/400/404/422 vote submission responses in `tests/contract/vote-submit.contract.test.ts`
- [x] T017 [P] [US1] Implement integration test for first anonymous vote submission success in `tests/integration/vote-submit.integration.test.ts`
- [x] T018 [P] [US1] Implement unit tests for `extractClientIp()` + `hashClientIp()` in `tests/unit/vote-ip-hash.test.ts`

### Implementation for User Story 1

- [x] T019 [US1] Implement submit-vote API route parsing/validation and correlation-id propagation in `app/api/votes/[voteId]/responses/route.ts`
- [x] T020 [US1] Implement first-vote path returning `201` + `action: "created"` in `app/api/votes/[voteId]/responses/route.ts`
- [x] T021 [US1] Enforce single-select vs multi-select business rules in `src/lib/vote/service.ts`
- [x] T022 [US1] Add vote submission client component in `app/votes/[voteId]/vote-form.tsx`
- [x] T023 [US1] Integrate vote form into poll page render path in `app/votes/[voteId]/page.tsx`
- [x] T024 [US1] [Observability] Emit success/failure submit logs with correlation IDs in `app/api/votes/[voteId]/responses/route.ts`
- [x] T025 [US1] [Security] Ensure API response never includes raw IP or `voter_fingerprint` in `app/api/votes/[voteId]/responses/route.ts`
- [ ] T026 [US1] [Docker] Validate anonymous submit flow in containerized run path via `scripts/ci-check.sh`

**Checkpoint**: US1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Change a Previously Submitted Vote (Priority: P1)

**Goal**: Same anonymous user can revisit the poll, see existing selection, and change it.

**Independent Test**: Submit first vote, revisit from same IP, pre-filled selection is shown, submit different option, response is `action: "updated"` and counts reflect the replacement.

### Tests for User Story 2 (MANDATORY)

- [ ] T027 [P] [US2] Extend contract test for `action: "updated"` and `action: "unchanged"` responses in `tests/contract/vote-submit.contract.test.ts`
- [ ] T028 [P] [US2] Add integration test for same-IP vote change flow in `tests/integration/vote-submit.integration.test.ts`
- [ ] T029 [P] [US2] Add integration test for unchanged re-submit behavior in `tests/integration/vote-submit.integration.test.ts`

### Implementation for User Story 2

- [ ] T030 [US2] Implement server-side prior vote lookup on poll page request in `app/votes/[voteId]/page.tsx`
- [ ] T031 [US2] Pass `previouslySelectedOptionIds` from page to client form in `app/votes/[voteId]/page.tsx`
- [ ] T032 [US2] Render pre-selected options and change-state messaging in `app/votes/[voteId]/vote-form.tsx`
- [ ] T033 [US2] Implement update path returning `200` + `action: "updated"` in `app/api/votes/[voteId]/responses/route.ts`
- [ ] T034 [US2] Implement unchanged path returning `200` + `action: "unchanged"` in `app/api/votes/[voteId]/responses/route.ts`
- [ ] T035 [US2] Enforce closed/expired rejection for change submissions in `src/lib/vote/service.ts`
- [ ] T036 [US2] [Observability] Add explicit submit outcome logs (`created|updated|unchanged`) in `app/api/votes/[voteId]/responses/route.ts`
- [ ] T037 [US2] [Security] Ensure prior-vote lookup returns only option IDs (no fingerprint/IP leakage) in `src/lib/vote/service.ts`

**Checkpoint**: US2 is independently functional with deterministic update semantics.

---

## Phase 5: User Story 3 - IP-Based Deduplication Enforcement (Priority: P1)

**Goal**: One vote record per IP per poll is enforced, while still allowing controlled replacements.

**Independent Test**: From same IP, second "new" submission does not create a second row; from different IP, submission is accepted independently.

### Tests for User Story 3 (MANDATORY)

- [ ] T038 [P] [US3] Add integration test proving one-row-per-IP UPSERT semantics in `tests/integration/vote-submit.integration.test.ts`
- [ ] T039 [P] [US3] Add integration test for different-IP submissions counted independently in `tests/integration/vote-submit.integration.test.ts`
- [ ] T040 [P] [US3] Add unit test for service-level dedup decision branching in `tests/unit/vote-ip-hash.test.ts`

### Implementation for User Story 3

- [ ] T041 [US3] Ensure vote submission route uses `src/lib/vote/ip.ts` (IP-only hash) and not `src/lib/vote/fingerprint.ts` in `app/api/votes/[voteId]/responses/route.ts`
- [ ] T042 [US3] Harden UPSERT conflict target and atomic replace logic in `src/lib/vote/service.ts`
- [ ] T043 [US3] Implement graceful handling for missing/unknown IP header path in `src/lib/vote/ip.ts`
- [ ] T044 [US3] [Security] Verify `vote_responses` access remains server-only via service-role usage boundaries in `src/lib/supabase/server.ts`
- [ ] T045 [US3] [Observability] Add duplicate-attempt outcome logging without sensitive fields in `app/api/votes/[voteId]/responses/route.ts`

**Checkpoint**: US3 deduplication guarantees are independently testable and stable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening across stories and release readiness checks.

- [ ] T046 [P] Update/merge final vote-submission contract definitions into `src/types/contracts.ts` from `specs/004-anonymous-voting/contracts/vote-submit.openapi.yaml`
- [ ] T047 [P] Add regression assertions for vote-close and invalid-option errors in `tests/integration/vote-submit.integration.test.ts`
- [ ] T048 [P] Validate ≤5s results refresh behavior path in `app/results/[token]/results-client.tsx` and `src/lib/env.ts`
- [ ] T049 [Security] Re-check response/log redaction coverage in `app/api/votes/[voteId]/responses/route.ts` and `src/lib/vote/logging.ts`
- [ ] T050 [Observability] Validate correlation-id propagation across submit + token-result paths in `app/api/votes/[voteId]/responses/route.ts` and `app/api/votes/results/[token]/route.ts`
- [ ] T051 [Docker] Run full containerized quality gate script in `scripts/ci-check.sh`
- [ ] T052 Run quickstart validation walkthrough in `specs/004-anonymous-voting/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1 and BLOCKS all user stories.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 2 and reuses US1 submission endpoint behavior.
- **Phase 5 (US3)**: Depends on Phase 2 and hardens dedup semantics used by US1/US2.
- **Phase 6 (Polish)**: Depends on completion of target user stories.

### User Story Dependencies

- **US1 (P1)**: MVP slice — can ship after Phase 3.
- **US2 (P1)**: Depends on base submission API (US1) but is independently testable once implemented.
- **US3 (P1)**: Depends on foundational IP + UPSERT infrastructure; hardens behavior used by US1/US2.

### Within Each User Story

- Write tests first and confirm they fail.
- Implement service and API paths before UI message refinements.
- Complete security + observability tasks before marking story done.

---

## Parallel Opportunities

- **Setup**: `T002`, `T003`, `T004`
- **Foundational**: `T006`, `T007`, `T008`, `T009` can run in parallel after `T005`
- **US1 tests**: `T016`, `T017`, `T018`
- **US2 tests**: `T027`, `T028`, `T029`
- **US3 tests**: `T038`, `T039`, `T040`
- **Polish**: `T046`, `T047`, `T048`

---

## Parallel Example: User Story 1

```bash
# Run US1 tests in parallel
Task: "T016 [US1] contract test for vote-submit statuses"
Task: "T017 [US1] integration test for first anonymous vote"
Task: "T018 [US1] unit test for IP extraction/hash"

# Build API and UI in parallel, then integrate
Task: "T020 [US1] created-path response in route"
Task: "T022 [US1] vote-form client component"
```

## Parallel Example: User Story 2

```bash
# Validate update behavior in parallel
Task: "T028 [US2] integration test for vote change"
Task: "T029 [US2] integration test for unchanged re-submit"

# Implement prefill + update behavior in parallel streams
Task: "T030 [US2] prior vote lookup in page"
Task: "T033 [US2] updated-path response in API"
```

## Parallel Example: User Story 3

```bash
# Dedup enforcement tests in parallel
Task: "T038 [US3] one-row-per-IP integration test"
Task: "T039 [US3] different-IP acceptance integration test"

# Harden dedup + security in parallel
Task: "T042 [US3] upsert conflict hardening"
Task: "T044 [US3] service-role boundary verification"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 + Phase 2.
2. Complete US1 (Phase 3).
3. Validate end-to-end anonymous vote submission.
4. Demo/release MVP.

### Incremental Delivery

1. Add US2 for change-vote behavior and pre-filled state.
2. Add US3 for strict dedup hardening and edge conditions.
3. Execute Polish phase for release readiness.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. Then split:
   - Stream A: API/service logic (`src/lib/vote/*`, `app/api/*`)
   - Stream B: vote UI flow (`app/votes/[voteId]/*`)
   - Stream C: automated tests (`tests/contract`, `tests/integration`, `tests/unit`)

---

## Notes

- `[P]` indicates tasks with no dependency on in-progress tasks and touching different files.
- `[US1]`, `[US2]`, `[US3]` labels provide strict traceability to user stories.
- Each task includes a concrete file path and is executable by an implementation agent immediately.
