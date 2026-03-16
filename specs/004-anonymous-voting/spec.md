# Feature Specification: Anonymous User Voting

**Feature Branch**: `004-anonymous-voting`  
**Created**: March 16, 2026  
**Status**: Draft  
**Input**: User description: "cho phép user không cần đăng nhập có thể vote được, có thể thay đổi, mỗi ip chỉ vote một lần"

## Clarifications

### Session 2026-03-16

- Q: How does the system distinguish a "vote change" request from a duplicate new submission? → A: Server-side automatic detection — if a prior vote exists for this hashed-IP + poll, treat as UPSERT (change); otherwise treat as new insert. No client-side flag required.
- Q: What hashing strategy should be used to derive the IP identifier stored alongside each vote? → A: Plain SHA256 of the IP address. (Note: this is reversible via brute force against the IPv4 space; accepted as a known trade-off for this project's scale.)
- Q: Does this feature need to comply with any privacy regulation (e.g., GDPR) regarding storage of the IP-derived identifier? → A: No formal compliance requirement — treat as best-effort privacy.
- Q: What is the concrete result refresh window for vote results after a vote is submitted or changed? → A: ≤ 5 seconds (realtime push or short-poll refresh).
- Q: Should there be a rate limit on vote submissions per IP to prevent API abuse? → A: No explicit application-level rate limit — rely on Supabase platform throttling and DB deduplication as sufficient protection.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cast a Vote Without Login (Priority: P1)

A visitor opens a vote URL and selects an option to participate in the poll — no account or login required.

**Why this priority**: This is the core value of the feature. Without the ability to vote anonymously, the entire feature has no purpose. Every other story builds on this.

**Independent Test**: Open an active vote URL without any login session → select one option → submit → verify the vote count for that option increases and the page confirms the vote was recorded.

**Acceptance Scenarios**:

1. **Given** an anonymous user opens an active vote URL, **When** they select a valid option and submit, **Then** the system records the vote and shows a confirmation that their vote was received.
2. **Given** an anonymous user submits a vote, **When** the vote is recorded, **Then** the updated results are reflected within ≤ 5 seconds.
3. **Given** a vote that allows multiple selections, **When** an anonymous user selects multiple options and submits, **Then** all selected options are recorded as a single vote submission.
4. **Given** an anonymous user does not select any option, **When** they attempt to submit, **Then** the system blocks the submission and shows a clear validation message.
5. **Given** the vote is closed or expired, **When** an anonymous user attempts to submit, **Then** the system rejects the submission with a clear "voting has ended" message.

---

### User Story 2 - Change a Previously Submitted Vote (Priority: P1)

An anonymous user who has already voted wants to revise their selection and submit a new choice for the same poll.

**Why this priority**: Equal priority to casting a vote — because users make mistakes or change their mind, and preventing any change would create frustration without a meaningful benefit.

**Independent Test**: Submit a vote as anonymous user → return to the same vote URL → observe the previously selected option is highlighted → change the selection → re-submit → verify the original vote is replaced by the new selection.

**Acceptance Scenarios**:

1. **Given** an anonymous user has already voted on a poll, **When** they revisit the same vote URL from the same IP, **Then** the system shows their previously selected option(s) as already-chosen.
2. **Given** an anonymous user is viewing their previously submitted vote, **When** they select a different option and re-submit, **Then** the old vote is removed and the new vote is recorded in its place.
3. **Given** an anonymous user re-submits the same option as before, **When** the system receives the request, **Then** the vote state remains unchanged and the system confirms it without duplicating the count.
4. **Given** an anonymous user voted previously, **When** they attempt to change their vote after the poll has closed, **Then** the system rejects the change with a clear "voting has ended" message.

---

### User Story 3 - IP-Based Deduplication Enforcement (Priority: P1)

The system prevents the same IP address from submitting more than one vote per poll, while still allowing vote changes.

**Why this priority**: Without this constraint, a single person could inflate results artificially. Deduplication is a prerequisite for meaningful poll data.

**Independent Test**: Vote once from an IP address → attempt to submit a second different vote from the same IP without going through the "change" flow → verify the second submission is rejected with a clear "already voted" message.

**Acceptance Scenarios**:

1. **Given** an IP address has already submitted a vote, **When** a new vote submission arrives from the same IP for the same poll, **Then** the system rejects it as a duplicate and informs the user they already voted.
2. **Given** an IP address has already submitted a vote, **When** the user explicitly changes their vote via the proper change flow, **Then** the system replaces the existing vote (not rejected as duplicate).
3. **Given** two different IP addresses submit votes for the same poll, **When** each submits independently, **Then** both votes are accepted and counted independently.
4. **Given** a new vote submission arrives with no prior vote from that IP, **When** processed, **Then** it is accepted normally as a first-time vote.

---

### Edge Cases

- **Shared IP (NAT/proxy)**: Users behind a corporate network or shared router share a single public IP. Only the first voter from that IP can vote; subsequent users will see an "already voted from this IP" state. This is a known limitation and acceptable trade-off for anonymous deduplication without accounts.

- **Concurrent Submissions**: If two requests from the same IP arrive simultaneously, the system must ensure only one vote is recorded (not two). Database-level uniqueness on IP + poll prevents double-counting.

- **Vote Change Race Condition**: If a user submits a change while another request from the same IP is in-flight, only one final state should persist — the last successfully committed write wins.

- **IP Privacy**: IP addresses are sensitive personal data. The system must not expose IP values in API responses, log files, or client-readable payloads.

- **Vote Closed During Change**: If the poll closes between the user loading the page and submitting a vote change, the system rejects the change with a clear expiry message rather than silently failing.

- **No Previous Vote Found**: If the user tries to view or change a previously recorded vote but the IP has no existing record (e.g., first visit), the system presents the normal vote form without pre-selection.

- **Empty Selection on Change**: If the user removes all selections and submits while changing their vote, the system blocks the submission (at least one option must be selected).

- **System Unavailable at Submission**: If the backend is unreachable when a vote is submitted, the system informs the user of a temporary failure and does not silently drop the vote or create a corrupted state.

- **API Abuse / Rapid Requests**: No application-level rate limit is implemented on the vote submission endpoint. Protection against rapid-fire requests relies on Supabase platform-level throttling and the database's uniqueness constraint (which rejects duplicate submissions after the first). This is an accepted trade-off; revisit if abuse patterns emerge.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow any user who has not logged in to submit a vote on an active poll by selecting at least one option.
- **FR-002**: System MUST derive a unique identifier from the submitter's IP address using SHA256 and store it alongside each vote response to enforce one-vote-per-IP-per-poll. Raw IP addresses must never be stored. Known trade-off: SHA256 of IPv4 addresses is reversible via brute force; this is accepted at the current scale.
- **FR-003**: System MUST use server-side detection to distinguish new votes from changes: if a prior vote record already exists for the same hashed-IP + poll, the submission is treated as a vote change (UPSERT); if no prior record exists, it is treated as a new vote. No client-side flag or separate endpoint is used.
- **FR-004**: System MUST allow a user from the same IP to change their vote by atomically replacing the previously recorded selection with the new one (UPSERT semantics — single record per hashed-IP per poll).
- **FR-005**: System MUST display the user's previously selected option(s) when they revisit a vote URL from the same IP and have already voted.
- **FR-006**: System MUST reject any vote submission (new or change) on a poll that is closed or expired, and return a clear user-facing message.
- **FR-007**: System MUST validate that the submitted option(s) belong to the target poll before recording the vote.
- **FR-008**: System MUST NOT expose raw IP address values in any client-visible response, log output, or public API surface.
- **FR-009**: System MUST record a log event for each vote submission and vote change with a correlation ID, excluding sensitive fields.
- **FR-010**: System MUST reflect vote submissions and changes in poll results within ≤ 5 seconds, via realtime push or short-poll refresh.

## Constitution Alignment *(mandatory)*

### TypeScript and Contract Impact

- A new `VoteSubmission` contract shape is required representing the anonymous vote payload (selected option IDs, poll ID). No "isChange" flag or intent signal is included — change detection is fully server-side.
- The `VoteResponse` entity contract must evolve to include a hashed IP field used only server-side, never surfaced to the client.
- The single vote submission endpoint handles both new votes and changes transparently (UPSERT). Frontend sends the same payload shape regardless of whether a prior vote exists.
- Frontend and backend must share the validated contract for vote submission. No raw IP handling on the client side.
- Existing `VoteResult` view contract remains unaffected; it continues to serve aggregated counts by option.

### Security and Data Access Impact

- A new Supabase table (or updated RLS policy on `vote_responses`) must enforce uniqueness per SHA256-hashed-IP per poll.
- The SHA256 hash is computed server-side at request time from the raw IP; the raw IP is never persisted.
- Insert policy: allow anonymous inserts when no existing row matches the SHA256-hashed-IP + vote_id combination.
- Update/replace policy: allow anonymous UPSERT on an existing row matching the SHA256-hashed-IP + vote_id combination.
- The hashed IP column must never be readable by the client role; only service role has SELECT on that field.
- Known limitation: SHA256 without a salt is reversible via brute force against the IPv4 space (~4B addresses). This is accepted as a trade-off at the current project scale. If threat model changes, upgrade to HMAC-SHA256 with a server-side secret.
- No formal privacy regulation (e.g., GDPR) applies to this feature. Best-effort privacy practices apply: no raw IP stored, hashed IP not client-readable, hashed IP excluded from logs.
- All vote submission paths must validate poll open/close state server-side, not relying on client-enforced checks.

### Observability and Runtime Signals

- Log event on every vote submission: correlation ID, poll ID, submission outcome (success/duplicate/poll-closed), timestamp.
- Log event on every vote change: correlation ID, poll ID, change outcome, timestamp.
- Raw IP address and hashed IP must be excluded from all log entries.
- Health signal: track vote submission failure rate as a runtime metric.

### Docker and Deployment Impact

- No Dockerfile changes required.
- Feature must pass the existing containerized build and startup checks.
- A database migration is required to add the IP deduplication column to the relevant table.

### Key Entities *(include if feature involves data)*

- **Vote**: Existing entity representing one poll. No structural change required; open/close state is already modeled.
- **VoteOption**: Existing entity. No change required.
- **VoteResponse**: Existing entity tracking individual vote submissions. Requires a new field to store the hashed IP identifier for deduplication. This field must be accessible only by privileged server-side operations.
- **VoteResult**: Existing derived view. No change required; deduplication is enforced at write time.

## Success Criteria *(mandatory)*

- **Functional Completeness**: All ten functional requirements (FR-001 through FR-010) are implemented and exercised through the UI and/or API.
- **Type Safety**: The project compiles with zero TypeScript errors in strict mode. All vote submission payloads are validated at system boundaries.
- **Deduplication Correctness**: When 100 vote submissions arrive from the same IP for one poll, only 1 vote is recorded in the final count. Vote changes replace — not duplicate — the prior record.
- **Security Compliance**: No raw IP address appears in any log, API response, or client-visible state. RLS policies are verified to block unauthorized reads of the IP-derived field.
- **Test Coverage**: IP deduplication logic, vote change flow, and poll-closure rejection are each covered by automated tests with a 100% pass rate.
- **Build & Deployment**: Feature builds and runs in CI/container environment without environment-related failures. Migration applies cleanly on a clean database.
- **Error Resilience**: Duplicate vote attempts, closed-poll submissions, and missing-option errors each produce user-friendly messages without corrupting existing vote data.

### Measurable Outcomes

- **SC-001**: An anonymous user can complete a vote submission in under 30 seconds from opening the poll page to seeing confirmation.
- **SC-002**: A second vote attempt from the same IP is rejected with a clear message within the same response time budget as a normal submission.
- **SC-003**: A vote change completes and the updated selection is reflected in results within ≤ 5 seconds.
- **SC-004**: Zero duplicate vote counts appear in results under concurrent load testing with multiple same-IP submissions.
