# Tasks: Create Vote Without Login

**Input**: Design documents from `/specs/002-feature-create-vote/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY for constitution compliance. Every user story includes automated validation tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (`US1`, `US2`, `US3`, `US4`)
- Use constitution tags where applicable: `[Security]`, `[Observability]`, `[Docker]`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared scaffolding for the vote domain.

- [X] T001 Create vote feature folders `app/votes/`, `app/api/votes/`, and `src/lib/vote/`
- [X] T002 [P] Add shared vote schemas/types in `src/types/contracts.ts` from `contracts/vote.schema.ts`
- [X] T003 [P] Add/confirm test file stubs for vote flows in `tests/unit/`, `tests/integration/`, and `tests/contract/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required before any user story work.

**⚠️ CRITICAL**: No user story implementation starts until this phase is complete.

- [X] T004 Create migration for `votes` and `vote_responses` in `supabase/migrations/20260312_create_vote_tables.sql`
- [X] T005 [P] [Security] Implement RLS policies for vote read/submit access in `supabase/migrations/20260312_create_vote_tables.sql`
- [X] T006 [P] Implement vote validation utilities in `src/lib/vote/validate.ts`
- [X] T007 [P] Implement timing rules (open/close/expiry) in `src/lib/vote/timing.ts`
- [X] T008 [P] Implement password hashing/verification helpers in `src/lib/vote/password.ts`
- [X] T009 [P] Implement voter fingerprint utility in `src/lib/vote/fingerprint.ts`
- [X] T010 [Observability] Add vote-domain logging helpers with correlation support in `src/lib/logger.ts` and `src/lib/vote/logging.ts`
- [X] T011 [Security] Add server-side Supabase client helper for privileged vote operations in `src/lib/supabase/server.ts`

**Checkpoint**: Foundation ready — user stories can proceed.

---

## Phase 3: User Story 1 - Create a Basic Vote (Priority: P1) 🎯 MVP

**Goal**: Allow anonymous users to create a vote with question + options and receive a shareable URL.

**Independent Test**: User can create a vote without login and gets a valid URL; invalid inputs are rejected.

### Tests for User Story 1 (MANDATORY)

- [X] T012 [P] [US1] Contract test for `POST /api/votes` in `tests/contract/vote-create.contract.test.ts`
- [X] T013 [P] [US1] Integration test for create-vote journey in `tests/integration/vote-create.integration.test.ts`

### Implementation for User Story 1

- [X] T014 [US1] Implement `POST /api/votes` in `app/api/votes/route.ts` (validate input, create vote, return share URL)
- [X] T015 [US1] Implement vote create page UI in `app/votes/create/page.tsx`
- [X] T016 [US1] Implement create vote server action in `app/votes/create/actions.ts`
- [X] T017 [US1] Implement vote detail fetch endpoint in `app/api/votes/[voteId]/route.ts`
- [X] T018 [US1] Implement vote view page in `app/votes/[voteId]/page.tsx`
- [X] T019 [US1] [Observability] Add structured logs for vote creation/request lifecycle in `app/api/votes/route.ts`
- [X] T020 [US1] [Security] Verify no sensitive fields are returned from create/get vote endpoints
- [ ] T021 [US1] [Docker] Validate US1 flow in container using `scripts/ci-check.sh`

**Checkpoint**: US1 is independently usable as MVP.

---

## Phase 4: User Story 2 - Configure Vote Settings (Priority: P1)

**Goal**: Support open/close times, password protection, and single/multiple selection behavior.

**Independent Test**: Settings are persisted and enforced server-side during vote access/submission.

### Tests for User Story 2 (MANDATORY)

- [ ] T022 [P] [US2] Contract test for verify/respond endpoints in `tests/contract/vote-settings.contract.test.ts`
- [ ] T023 [P] [US2] Integration test for timing/password/multi-select flow in `tests/integration/vote-settings.integration.test.ts`

### Implementation for User Story 2

- [ ] T024 [US2] Add settings fields/validation in create form (`openTime`, `closeTime`, `requiresPassword`, `allowMultiple`) in `app/votes/create/page.tsx`
- [ ] T025 [US2] Enforce server-side time-gating and selection rules in `app/api/votes/[voteId]/respond/route.ts`
- [ ] T026 [US2] Implement password verification endpoint in `app/api/votes/[voteId]/verify-password/route.ts`
- [ ] T027 [US2] Implement password prompt component in `app/votes/components/PasswordPrompt.tsx`
- [ ] T028 [US2] Add password session handling (HTTP-only cookie) in `app/api/votes/[voteId]/verify-password/route.ts`
- [ ] T029 [US2] [Security] Add rate limit checks for password attempts in `app/api/votes/[voteId]/verify-password/route.ts`
- [ ] T030 [US2] [Observability] Log timing/password rejection reasons (redacted) in API handlers
- [ ] T031 [US2] [Docker] Validate password + close-time behavior in containerized test run `tests/integration/password-protected-votes.test.ts`

**Checkpoint**: US2 settings behavior is fully enforced and testable.

---

## Phase 5: User Story 3 - View Vote Results (Priority: P2)

**Goal**: Show real-time vote counts and percentages for a vote.

**Independent Test**: Creator can view results and see updates when new responses are submitted.

### Tests for User Story 3 (MANDATORY)

- [ ] T032 [P] [US3] Contract test for `GET /api/votes/{id}/results` in `tests/contract/vote-results.contract.test.ts`
- [ ] T033 [P] [US3] Integration test for results updates in `tests/integration/vote-results.integration.test.ts`

### Implementation for User Story 3

- [ ] T034 [US3] Implement results endpoint in `app/api/votes/[voteId]/results/route.ts`
- [ ] T035 [US3] Implement results page in `app/votes/[voteId]/results/page.tsx`
- [ ] T036 [US3] Implement results chart component in `app/votes/components/ResultsChart.tsx`
- [ ] T037 [US3] Add Supabase Realtime subscription for result refresh in `app/votes/[voteId]/results/page.tsx`
- [ ] T038 [US3] [Observability] Add result query timing/error logs in results route
- [ ] T039 [US3] [Security] Verify results response excludes sensitive metadata

**Checkpoint**: US3 provides accurate and live-updating results.

---

## Phase 6: User Story 4 - Share and Distribute Vote Link (Priority: P2)

**Goal**: Make link sharing easy with copy-link and direct access behavior.

**Independent Test**: User can copy link from create/vote pages and another user can open the same vote directly.

### Tests for User Story 4 (MANDATORY)

- [ ] T040 [P] [US4] Integration test for copy-link and open-link flow in `tests/integration/vote-link-sharing.integration.test.ts`
- [ ] T041 [P] [US4] UI/unit test for clipboard behavior in `tests/unit/vote-link-copy.test.ts`

### Implementation for User Story 4

- [ ] T042 [US4] Implement copy-link action/button on create success screen in `app/votes/create/page.tsx`
- [ ] T043 [US4] Implement copy-link action/button on vote page in `app/votes/[voteId]/page.tsx`
- [ ] T044 [US4] Ensure share URL generation/access consistency in `app/api/votes/route.ts` and `app/api/votes/[voteId]/route.ts`
- [ ] T045 [US4] [Observability] Add logs for share-link generation failures

**Checkpoint**: US4 sharing flow is independently complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening across stories.

- [ ] T046 [P] Add vote-domain unit tests for regressions in `tests/unit/vote-validation.test.ts` and `tests/unit/vote-timing.test.ts`
- [ ] T047 [P] Add concurrency integration test for duplicate prevention in `tests/integration/concurrent-submissions.test.ts`
- [ ] T048 [Security] Re-verify RLS and role scopes against all vote data paths (`votes`, `vote_responses`)
- [ ] T049 [Observability] Confirm correlation IDs and redaction in all new vote logs
- [ ] T050 [Docker] Run full Docker validation (`docker compose up --build` + `scripts/ci-check.sh`)
- [ ] T051 Run quickstart verification from `specs/002-feature-create-vote/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies
- **Phase 2 (Foundational)**: depends on Phase 1 and blocks all user stories
- **Phases 3–6 (User Stories)**: start after Phase 2
  - Can run in parallel by team capacity
  - Recommended order: US1 → US2 → US3/US4
- **Phase 7 (Polish)**: runs after targeted stories complete

### User Story Dependencies

- **US1 (P1)**: independent after Phase 2
- **US2 (P1)**: depends on US1 endpoints/pages being available
- **US3 (P2)**: depends on response submission from US2
- **US4 (P2)**: depends on share URL generation in US1

### Within Each User Story

- Tests first; ensure failing state before implementation
- API/logic before UI wiring where possible
- Security/observability tasks completed before story sign-off

---

## Parallel Opportunities

- Phase 1: `T002`, `T003` parallel
- Phase 2: `T005`–`T009` parallel after `T004`
- US1 tests: `T012`, `T013` parallel
- US2 tests: `T022`, `T023` parallel
- US3 tests: `T032`, `T033` parallel
- US4 tests: `T040`, `T041` parallel
- Polish: `T046`, `T047` parallel

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and 2
2. Complete US1 (Phase 3)
3. Validate independently and demo

### Incremental Delivery

1. Deliver US1 (MVP)
2. Add US2 for full settings enforcement
3. Add US3 results view
4. Add US4 sharing polish
5. Run Phase 7 hardening before release

---

## Notes

- `[P]` means different files/no direct dependency
- Keep tasks atomic and file-specific
- Maintain strict TypeScript + contract consistency per constitution
- Do not ship without test/security/docker gates passing
