# Tasks: Protect Voting Page When Password-Protected

**Input**: Design documents from `/specs/010-protect-voting-page-when-have-password/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/password-verify.contract.ts, quickstart.md

**Tests**: Tests are mandatory for constitution compliance. Each user story includes automated validation tasks.

**Organization**: Tasks are grouped by user story to keep each delivery slice independently testable.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared contracts and configuration for API-first password-protected vote access.

- [x] T001 Add server-side protected vote token configuration in src/lib/env.ts
- [x] T002 [P] Extend password verification request/response contracts in src/types/contracts.ts
- [x] T003 [P] Add password verification payload parsing and protected vote response helpers in src/lib/vote/validate.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared security primitives required before any user story implementation.

**⚠️ CRITICAL**: No user story work should start until these tasks are complete.

- [x] T004 [P] Create short-lived protected vote unlock token helpers in src/lib/vote/password-access.ts
- [x] T005 [P] Create in-memory password attempt rate limiter in src/lib/vote/password-rate-limit.ts
- [x] T006 [P] Add password verification and rate-limit logging helpers in src/lib/vote/logging.ts
- [x] T007 [P] Extend password hashing and verification utilities for runtime auth checks in src/lib/vote/password.ts
- [x] T008 [Security] Update protected vote lookup and auth guard helpers in src/lib/vote/service.ts

**Checkpoint**: Shared unlock-token, rate-limit, validation, and logging primitives are ready for story work.

---

## Phase 3: User Story 1 - Password prompt on password-protected vote (Priority: P1) 🎯 MVP

**Goal**: Voters must enter the correct password before they can read protected vote details or submit the voting form for a protected poll.

**Independent Test**: Open a password-protected vote in a fresh session, verify the protected vote route does not expose the voting form, submit a wrong password to get an inline error, submit the correct password, and confirm the voting form becomes available and can submit successfully in the current page flow.

### Tests for User Story 1 (MANDATORY)

- [x] T009 [P] [US1] Add contract coverage for POST /api/votes/[voteId]/verify-password in tests/contract/password-verify.contract.test.ts
- [x] T010 [P] [US1] Add integration coverage for protected vote read blocking and wrong/correct password flow in tests/integration/password-protected-vote-page.integration.test.tsx

### Implementation for User Story 1

- [x] T011 [US1] [Security] Implement protected GET /api/votes/[voteId] behavior in app/api/votes/[voteId]/route.ts
- [x] T012 [US1] Implement POST /api/votes/[voteId]/verify-password route in app/api/votes/[voteId]/verify-password/route.ts
- [x] T013 [P] [US1] Create password prompt client component in app/votes/[voteId]/password-form.tsx
- [x] T014 [US1] Update protected vote page gating and conditional rendering in app/votes/[voteId]/page.tsx
- [x] T015 [US1] [Security] Enforce protected-vote auth before accepting submissions in app/api/votes/[voteId]/responses/route.ts
- [x] T016 [US1] [Observability] Wire password verify, protected-read reject, and protected-submit reject logs in app/api/votes/[voteId]/verify-password/route.ts and app/api/votes/[voteId]/responses/route.ts

**Checkpoint**: Password-protected votes are inaccessible without a correct password and can be voted on after successful verification in the current page flow.

---

## Phase 4: User Story 2 - Skip password for non-protected votes (Priority: P1)

**Goal**: Public votes must continue to render and submit immediately without any password challenge.

**Independent Test**: Open a public vote in a fresh session and verify the voting form renders immediately, submission succeeds, and no password prompt or protected-vote error is shown.

### Tests for User Story 2 (MANDATORY)

- [x] T017 [P] [US2] Add contract coverage for public vote access behavior in tests/contract/public-vote-access.contract.test.ts
- [x] T018 [P] [US2] Add integration coverage for public vote page bypass and submit flow in tests/integration/public-vote-access.integration.test.tsx

### Implementation for User Story 2

- [x] T019 [US2] Update vote detail API behavior to keep non-protected vote payloads public in app/api/votes/[voteId]/route.ts
- [x] T020 [US2] Update vote page rendering to bypass password UI when requiresPassword is false in app/votes/[voteId]/page.tsx
- [x] T021 [US2] Update vote form error handling for protected-submit rejection without impacting public flow in app/votes/[voteId]/vote-form.tsx

**Checkpoint**: Public votes keep the current fast path and are not regressed by password-protection logic.

---

## Phase 5: User Story 3 - Re-enter password on refresh or reopened link (Priority: P2)

**Goal**: After a correct password entry, a refresh or reopened vote URL must require the voter to enter the password again.

**Independent Test**: Verify a protected vote password once, refresh the page or reopen the same vote URL, and confirm the password prompt is shown again before protected vote content becomes available.

### Tests for User Story 3 (MANDATORY)

- [x] T022 [P] [US3] Add unit coverage for short-lived unlock token invalidation on reload/revisit boundaries in tests/unit/password-access.test.ts
- [x] T023 [P] [US3] Add integration coverage for refresh and reopened-link re-prompt behavior in tests/integration/password-vote-reprompt.integration.test.tsx

### Implementation for User Story 3

- [x] T024 [US3] Invalidate protected vote unlock state after refresh/revisit boundaries in app/api/votes/[voteId]/verify-password/route.ts and src/lib/vote/password-access.ts
- [x] T025 [US3] Restore password prompt on refresh and reopened links in app/votes/[voteId]/page.tsx
- [x] T026 [US3] [Security] Reject expired, reused, or missing protected-vote unlock tokens in app/api/votes/[voteId]/responses/route.ts

**Checkpoint**: Protected vote access works after verification in-page, but refreshing or reopening the link reliably requires password re-entry.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, regression coverage, and end-to-end validation across stories.

- [x] T027 [P] Add regression coverage for password log redaction and rate-limit reset behavior in tests/unit/password-rate-limit.test.ts
- [x] T028 [P] Run feature validation through scripts/ci-check.sh and targeted vote test suites in scripts/ci-check.sh
- [x] T029 [Waiver] Document deferred follow-up for RLS hardening and low-priority protected results access in specs/010-protect-voting-page-when-have-password/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup**: Starts immediately.
- **Phase 2: Foundational**: Depends on Phase 1 and blocks all user story work.
- **Phase 3: User Story 1**: Depends on Phase 2.
- **Phase 4: User Story 2**: Depends on Phase 2; can run alongside User Story 1 with coordination around shared files.
- **Phase 5: User Story 3**: Depends on Phase 3 because re-prompt behavior extends the protected-vote auth flow.
- **Phase 6: Polish**: Depends on the user stories targeted for release.

### User Story Dependencies

- **US1**: No dependency on other user stories after foundational work.
- **US2**: No dependency on other user stories after foundational work.
- **US3**: Depends on US1 because password verification and unlock-token flow must already exist.

### Within Each User Story

- Tests fail first before implementation starts.
- Shared helpers and contracts precede route and UI integration.
- API enforcement lands before relying on frontend behavior.
- Story validation completes before moving to downstream polish.

---

## Parallel Opportunities

- **Setup**: T002 and T003 can run in parallel after T001.
- **Foundational**: T004, T005, T006, and T007 can run in parallel, then T008 integrates them.
- **US1**: T009 and T010 can run in parallel; T011 and T012 can also proceed in parallel once the tests are in place.
- **US2**: T017 and T018 can run in parallel.
- **US3**: T022 and T023 can run in parallel.
- **Polish**: T027 and T028 can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Run User Story 1 validation tasks together
Task: "Add contract coverage for POST /api/votes/[voteId]/verify-password in tests/contract/password-verify.contract.test.ts"
Task: "Add integration coverage for protected vote read blocking and wrong/correct password flow in tests/integration/password-protected-vote-page.integration.test.tsx"

# After tests exist, build route and UI in parallel
Task: "Implement protected GET /api/votes/[voteId] behavior in app/api/votes/[voteId]/route.ts"
Task: "Implement POST /api/votes/[voteId]/verify-password route in app/api/votes/[voteId]/verify-password/route.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Validate protected read guard, verify-password route, and protected submission end-to-end.

### Incremental Delivery

1. Deliver US1 as the security MVP for protected polls.
2. Deliver US2 to confirm public polls remain unaffected.
3. Deliver US3 to enforce re-prompt behavior on refresh and reopened links.

### Parallel Team Strategy

1. One developer handles shared auth helpers in Phase 2.
2. One developer handles protected vote route/UI for US1.
3. One developer handles public-flow regression coverage for US2 after foundational work.
4. Re-prompt behavior work for US3 starts after US1 route/unlock flow is stable.

---

## Notes

- `[P]` tasks touch different files and can run in parallel.
- `[US1]`, `[US2]`, and `[US3]` labels map tasks directly to spec user stories.
- Every task includes an exact target file path for execution.
- Tests are mandatory for every story per constitution requirements.