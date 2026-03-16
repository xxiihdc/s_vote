# Tasks: Share Voting Link After Create

**Input**: Design documents from `/specs/006-share-vote-link/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`

**Tests**: Tests are MANDATORY for constitution compliance. Every user story includes automated validation tasks.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared contracts and test scaffolding for create-vote link sharing.

- [x] T001 Align redirect search-param contract in `src/types/contracts.ts` from `specs/006-share-vote-link/contracts/create-vote-redirect.schema.ts`
- [x] T002 Create integration test scaffold for create-page share-link rendering in `tests/integration/vote-create-page.integration.test.tsx`
- [x] T003 Create quickstart verification placeholders for this feature in `specs/006-share-vote-link/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core behavior required before implementing any user-story-specific UI outcomes.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T004 Add canonical voting URL builder using `APP_URL` in `src/lib/vote/token.ts`
- [x] T005 [P] Add create-outcome completeness helper and validation wiring in `src/types/contracts.ts`
- [x] T006 [P] Refactor `createVoteAction` to generate `voteUrl` via canonical URL helper in `app/votes/create/actions.ts`
- [x] T007 Implement incomplete-metadata detection branch for create success state in `app/votes/create/page.tsx`
- [x] T008 Add generic share-link error rendering path for incomplete metadata in `app/votes/create/page.tsx`

**Checkpoint**: Foundation complete — user story implementation can proceed.

---

## Phase 3: User Story 1 - Copy voting link after creation (Priority: P1) 🎯 MVP

**Goal**: Creator gets an immediate absolute voting link that can be opened/copied for sharing.

**Independent Test**: Submit create-vote form and verify redirect metadata includes absolute `voteUrl`; success view allows open/copy for voting link.

### Tests for User Story 1 (MANDATORY)

- [x] T009 [P] [US1] Update redirect contract integration test for absolute `voteUrl` in `tests/integration/vote-create.integration.test.ts`
- [x] T010 [P] [US1] Add/extend canonical voting URL unit tests with `APP_URL` origin cases in `tests/unit/vote-token-url.test.ts`

### Implementation for User Story 1

- [x] T011 [US1] Implement absolute voting URL generation (`/votes/{voteId}`) from canonical origin in `src/lib/vote/token.ts`
- [x] T012 [US1] Use canonical voting URL helper when building redirect params in `app/votes/create/actions.ts`
- [x] T013 [US1] Render voting URL input and open action in success panel in `app/votes/create/page.tsx`
- [x] T014 [US1] Support voting-link copy label behavior in `app/votes/create/copy-result-url-button.tsx`
- [x] T015 [US1] [Security] Verify voting URL contains vote identifier only (no result token leakage) in `tests/integration/vote-create.integration.test.ts`

**Checkpoint**: US1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Keep results link available (Priority: P2)

**Goal**: Creator sees both voting and result links with distinct labels and independent actions.

**Independent Test**: With complete create metadata, page renders two labeled links and both open/copy flows work.

### Tests for User Story 2 (MANDATORY)

- [x] T016 [P] [US2] Add integration test for dual-link success rendering in `tests/integration/vote-create-page.integration.test.tsx`
- [x] T017 [P] [US2] Add integration test for both open-link href targets in `tests/integration/vote-create-page.integration.test.tsx`

### Implementation for User Story 2

- [x] T018 [US2] Ensure success panel shows both link fields with distinct labels in `app/votes/create/page.tsx`
- [x] T019 [US2] Ensure open actions route to voting and results destinations in `app/votes/create/page.tsx`
- [x] T020 [US2] Ensure copy actions for both links are available and labeled correctly in `app/votes/create/page.tsx`
- [x] T021 [US2] Preserve backward compatibility of result-link display behavior in `app/votes/create/page.tsx`

**Checkpoint**: US2 is independently functional with dual-link sharing UX.

---

## Phase 5: User Story 3 - Prevent confusing success state (Priority: P3)

**Goal**: When required link metadata is incomplete, success panel is hidden and a generic share-link error appears.

**Independent Test**: Render page with `created=1` but missing `voteUrl` or `resultUrl`; verify success panel hidden and generic error shown.

### Tests for User Story 3 (MANDATORY)

- [x] T022 [P] [US3] Add integration test for incomplete-metadata generic error behavior in `tests/integration/vote-create-page.integration.test.tsx`
- [x] T023 [P] [US3] Add integration test ensuring invalid-input error behavior remains unchanged in `tests/integration/vote-create-page.integration.test.tsx`

### Implementation for User Story 3

- [x] T024 [US3] Implement generic share-link error message for incomplete create metadata in `app/votes/create/page.tsx`
- [x] T025 [US3] Suppress success panel when `created` state lacks required links in `app/votes/create/page.tsx`
- [x] T026 [US3] Preserve existing create-input error rendering path alongside new incomplete-link error in `app/votes/create/page.tsx`
- [x] T027 [US3] [Observability] Add non-sensitive warning log for incomplete share-link metadata path in `app/votes/create/page.tsx`

**Checkpoint**: US3 is independently functional with deterministic fallback UX.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency, quality checks, and release readiness for this feature.

- [ ] T028 [P] Sync and document redirect contract mapping between runtime and design docs in `specs/006-share-vote-link/contracts/create-vote-success-ui-contract.md`
- [x] T029 [P] Add regression assertions for new create-page scenarios in `tests/integration/vote-create-page.integration.test.tsx`
- [ ] T030 [P] Validate and document quickstart execution outcomes in `specs/006-share-vote-link/quickstart.md`
- [ ] T031 [Security] Re-check create-flow logs and redirect metadata for secret leakage in `app/votes/create/actions.ts`
- [ ] T032 [Docker] Run container quality gate and record outcome in `scripts/ci-check.sh` and `specs/006-share-vote-link/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1 and BLOCKS all user stories.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 2; can proceed independently of US1 implementation details.
- **Phase 5 (US3)**: Depends on Phase 2; validates fallback behavior independently.
- **Phase 6 (Polish)**: Depends on completion of desired user stories.

### User Story Dependencies

- **US1 (P1)**: MVP slice and first shippable increment.
- **US2 (P2)**: Depends on foundational link contract but remains independently testable.
- **US3 (P3)**: Depends on foundational metadata validation branch and remains independently testable.

### Within Each User Story

- Tests first and verify they fail.
- Implement core behavior.
- Validate security/observability tags before marking story done.

---

## Parallel Opportunities

- **Setup**: T002 can run in parallel with T003 after T001 starts contract alignment.
- **Foundational**: T005 and T006 can run in parallel after T004.
- **US1 tests**: T009 and T010 can run in parallel.
- **US2 tests**: T016 and T017 can run in parallel.
- **US3 tests**: T022 and T023 can run in parallel.
- **Polish**: T028, T029, and T030 can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Launch US1 tests in parallel
Task: "T009 [US1] redirect contract integration test"
Task: "T010 [US1] canonical voting URL unit test"

# Implement behavior in parallel streams
Task: "T011 [US1] canonical voting URL builder"
Task: "T014 [US1] copy button label support"
```

## Parallel Example: User Story 2

```bash
# Validate dual-link behavior in parallel
Task: "T016 [US2] success panel dual-link rendering test"
Task: "T017 [US2] open-link href target test"

# Implement rendering/actions in parallel
Task: "T018 [US2] labeled link fields"
Task: "T020 [US2] copy actions"
```

## Parallel Example: User Story 3

```bash
# Validate fallback behavior in parallel
Task: "T022 [US3] incomplete metadata error test"
Task: "T023 [US3] invalid-input regression test"

# Implement fallback behavior in parallel
Task: "T024 [US3] generic share-link error message"
Task: "T025 [US3] suppress success panel on incomplete metadata"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 + Phase 2.
2. Complete US1 (Phase 3).
3. Validate redirect and success-path share flow.
4. Demo/release MVP.

### Incremental Delivery

1. Add US2 for dual-link display and actions.
2. Add US3 for incomplete-metadata fallback behavior.
3. Execute Polish phase checks.

### Parallel Team Strategy

1. One stream handles server-action + URL generation (`app/votes/create/actions.ts`, `src/lib/vote/token.ts`).
2. One stream handles create-page rendering and copy actions (`app/votes/create/page.tsx`, `app/votes/create/copy-result-url-button.tsx`).
3. One stream handles integration/unit tests (`tests/integration/*`, `tests/unit/*`).

---

## Notes

- `[P]` tasks are safe to run concurrently when they touch different files and have no incomplete dependencies.
- `[US1]`, `[US2]`, `[US3]` provide strict traceability to user stories.
- Each task includes concrete file paths and is directly executable by an implementation agent.
