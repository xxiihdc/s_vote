# Feature Specification: Protect Voting Page When Password-Protected

**Feature Branch**: `010-protect-voting-page-when-have-password`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: User description: "hiện tại ở voting page chưa có bảo vệ khi tạo vote có mật khẩu, hãy thêm chức năng đó"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Password prompt on password-protected vote (Priority: P1)

As a poll creator with a password-protected vote, I want voters to see a password input form first so that only people who know the password can access protected vote details and the voting form.

**Why this priority**: This is the core security feature that protects the vote from unauthorized access.

**Independent Test**: Create a password-protected vote, share the vote URL with a new user/incognito session, verify the protected vote path shows a password prompt instead of the voting form, and verify entering the correct password grants access to voting in the current page flow.

**Acceptance Scenarios**:

1. **Given** a password-protected vote URL is opened, **When** the page loads, **Then** the password input form is displayed (not the voting form).
2. **Given** the password form is displayed, **When** user enters an incorrect password and submits, **Then** the system shows a clear error message and remains on the password form.
3. **Given** the password form is displayed, **When** user enters the correct password and submits, **Then** the voting form becomes visible and the user can submit their vote.
4. **Given** a password-protected vote is requested through the API without prior verification, **When** the request reaches the protected vote read path, **Then** the API rejects access to protected vote details.

---

### User Story 2 - Skip password for non-protected votes (Priority: P1)

As a poll creator with a public vote, I want voters to see the voting form immediately so the password check doesn't interfere with normal voting flow.

**Why this priority**: This ensures the password protection feature doesn't impact non-protected votes.

**Independent Test**: Create a public (non-password-protected) vote, open it in a new session, and verify the voting form is shown immediately without any password prompt.

**Acceptance Scenarios**:

1. **Given** a public vote URL is opened, **When** the page loads, **Then** the voting form is displayed (no password form).
2. **Given** a public vote is displayed, **When** user submits a vote, **Then** the vote is recorded and success message appears.

---

### User Story 3 - Re-enter password on refresh or reopened link (Priority: P2)

As a poll creator, I want voters to re-enter the password whenever they refresh or reopen a protected vote link so access stays tightly scoped to the current page flow.

**Why this priority**: This keeps the access model simple and reduces the chance of protected polls remaining unlocked longer than intended.

**Independent Test**: Open a password-protected vote, enter password correctly, refresh the page or reopen the same vote URL, and verify the password prompt is shown again before protected vote content is accessible.

**Acceptance Scenarios**:

1. **Given** a user has entered the correct password for a vote, **When** they refresh the page, **Then** the password prompt is shown again before protected vote content is accessible.
2. **Given** a user has entered the correct password and closes the browser tab, **When** they reopen the same vote URL, **Then** they must enter the password again before voting.

---

### Edge Cases

- **Multiple password attempts**: If a voter enters an incorrect password repeatedly, the system should have rate limiting to prevent brute-force attacks (max 5 attempts per minute).
- **Private vs Password-Protected**: A private vote (requires auth) and password-protected vote are separate access controls; a password-protected public vote should not require login.
- **Protected read path**: Requesting protected vote details without password verification must fail before any protected vote payload is exposed.
- **Results access**: Protecting results URLs with the same password flow is deferred and not part of this feature release.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a password input form when opening a vote with `requiresPassword = true` instead of the voting form.
- **FR-002**: System MUST validate the entered password against the stored `passwordHash` using bcrypt comparison.
- **FR-003**: System MUST show a clear error message when an incorrect password is entered (e.g., "Incorrect password. Please try again.").
- **FR-004**: System MUST allow access to the voting form after successful password validation.
- **FR-005**: System MUST apply rate limiting to prevent brute-force attacks (max 5 password attempts per minute per IP/session).
- **FR-006**: System MUST skip password protection for votes with `requiresPassword = false`.
- **FR-007**: System MUST protect `GET /api/votes/[voteId]` so password-protected vote details are not returned before password verification.
- **FR-008**: System MUST require password re-entry whenever a voter refreshes or reopens a password-protected vote URL.
- **FR-009**: System MUST keep any unlock state limited to the current page flow and MUST NOT persist password authentication across refreshes or reopened links.

### Non-Functional Requirements

- **NFR-001**: Password validation must complete within 500ms (bcrypt hash comparison time).
- **NFR-002**: Invalid password attempts must not expose information about password length or structure (constant-time comparison).

## Constitution Alignment *(mandatory)*

### TypeScript and Contract Impact

- The `VoteDetail` contract (returned by GET /api/votes/[voteId]) already includes `requiresPassword` boolean field.
- A new authentication response contract is needed to indicate password validation status:
  - Frontend needs to track whether the current page flow has been unlocked after successful verification.
  - API endpoint required: `POST /api/votes/[voteId]/verify-password` to validate password attempt.

### Security and Data Access Impact

- **API-first Protection**: Protected vote reads and vote submissions are enforced in trusted API routes for this feature.
  - Without successful password verification: `GET /api/votes/[voteId]` returns a protected access error if `requiresPassword = true`.
  - After successful password verification in the current page flow: allow protected vote data retrieval and vote submission.
  - RLS hardening for protected vote access is deferred as a follow-up defense-in-depth task.
- **No database changes needed**: `requiresPassword` and `passwordHash` are already in the Vote schema (feature 002).
- **API Layer Protection**: Backend must validate the protected access state in all voting-related endpoints, including `GET /api/votes/[voteId]` and `POST /api/votes/[voteId]/responses`.

### Observability and Runtime Signals

- **Log password validation attempts**: Track successful/failed password attempts with correlation ID for security auditing.
- **Rate limit tracking**: Monitor rate limit breaches per IP/session for alert purposes.
- **Redaction**: Never log the plaintext password or password attempt value in logs.

### Docker and Deployment Impact

- No Dockerfile/compose changes required.
- Supabase Edge Function (if used for password validation) must have bcrypt library available.
- Password validation can be handled by main Next.js API routes or Edge Functions; bcryptjs is already in npm ecosystem.

## Key Entities *(include if feature involves data)*

- **Vote**: Existing entity with `requiresPassword` (boolean) and `passwordHash` (text) fields already present.
- **ProtectedVoteUnlockState**: Short-lived server-trusted state representing whether the current page flow has passed password verification for a specific vote.
  - Attributes: `voteId`, `authenticated` (boolean), `issuedAt`, `expiresAt`
  - Storage: In-memory, scoped to the current page lifecycle only

## Success Criteria *(mandatory)*

- **Functional Completeness**: 100% of functional requirements (FR-001 to FR-009) are implemented and testable via the voting page UI.
- **Type Safety**: All new/modified types compile without TypeScript errors; password-related contracts are enforced at API boundary via Zod schemas.
- **Performance Benchmark**: Password validation completess within 500ms p95 latency; password-protected voting UX matches non-protected voting latency within ±10%.
- **Security Compliance**:
  - Password protection is enforced on protected vote read and submit API paths.
  - Any unlock state is not persisted across refreshes or reopened links.
  - No plaintext passwords in logs, browser dev tools, or network traffic.
  - Bcrypt comparison is constant-time to prevent timing attacks.
- **Test Coverage**: Password validation, rate limiting, protected read rejection, re-prompt behavior, and edge cases covered by unit + integration tests with 100% pass rate.
- **Rate Limiting**: System successfully blocks attempts after 5 failures per minute and shows appropriate user feedback.

### Measurable Outcomes

- **SO-001**: Voters can access password-protected votes by entering the correct password in under 30 seconds (UX metric).
- **SO-002**: System correctly rejects incorrect passwords 100% of the time and allows correct passwords 100% of the time.
- **SO-003**: Refreshing or reopening a password-protected vote URL always requires password re-entry before protected content is accessible.
- **SO-004**: Rate limiting prevents more than 5 password attempts per minute per user session.

## Assumptions

- The database already has `requiresPassword` (BOOLEAN) and `passwordHash` (TEXT) fields in the votes table via feature 002.
- Bcryptjs library is available for password hashing/comparison.
- Vote creator manually sets the password when creating a password-protected vote (UI not part of this feature).
- Protected vote unlock state can be implemented in trusted server runtime without introducing persistent browser session storage.

## Dependencies

- **Feature 002**: Create Vote — provides database schema with `requiresPassword` and `passwordHash` fields.
- **Bcryptjs library**: Must be available for password validation (already typically in npm ecosystem for Node.js projects).

## Out of Scope

- Creating/editing passwords when voting is created (creator sets password in a separate feature).
- Password reset or recovery mechanisms.
- Admin-level password management or audit logs (beyond basic logging).
- Integration with multi-factor authentication (MFA) as additional security layer.
- Changing password after vote creation.
- Protecting results URLs with the same password flow.
