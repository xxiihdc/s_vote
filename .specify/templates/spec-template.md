# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?

  - Race Conditions: If multiple votes are submitted simultaneously by the same user, the system utilizes Postgres Transactions and Unique Constraints to ensure only one vote is recorded per User ID.

  - Poll Expiration: If a submission occurs exactly as a poll closes, the system validates against the database server-time rather than client-time to reject any late entries.

  - Input Overflow: When input data (e.g., ballot comments) hits maximum character limits or contains complex characters, Zod schemas at the Edge Runtime layer intercept the request to prevent database write errors.

  - Password Brute-force: If a poll is password-protected, the system must implement a rate limit (e.g., max 5 attempts per minute) to prevent brute-force attacks.

  - Session Persistence: For Public/Password votes, determine if a user needs to re-enter the password if they refresh the browser or return later.

- How does system handle [error scenario]?

  - Network Instability: The system implements a retry logic (via React Query or Supabase JS) to automatically recover from transient network interruptions during submission.

  - Database Throttling: If Supabase rate limits are triggered during peak traffic, the system provides a "System Busy" message with a 30-second cooldown period instead of a generic crash.

  - Optimistic UI Failure: If the UI optimistically confirms a vote but the server eventually rejects it, the system automatically rolls back the UI state and notifies the user that the vote was not saved.

- How does system prevent unauthorized access or privilege escalation for this feature?

  - Row Level Security (RLS): Strict Postgres RLS policies ensure users can only INSERT votes linked to their own auth.uid() and are strictly forbidden from UPDATE or DELETE operations on others' data.

  - Server-side Validation: All requests must pass Supabase JWT authentication; critical payloads are re-validated through Zod schemas to prevent injection attacks or manual payload tampering.

- What is the fallback behavior when dependent Supabase resources are unavailable?

  - Service Downtime: In the event of a Supabase outage, the application renders a "Maintenance Mode" status page to maintain a professional user experience instead of showing runtime errors.

  - Stale-While-Revalidate: For public poll results, the system serves cached data (via Static Generation or LocalStorage) so users can still view previous results while the database recovers.

- How does system prevent unauthorized access?

  - Access Token for Password Polls: When a user enters the correct password, the system should issue a temporary signed token (or cookie) to allow them to submit the vote, preventing users from bypassing the password UI via direct API calls.

  - RLS for Public Data: Ensure that even for Public polls, RLS still prevents any unauthorized modification of the poll's settings (only the creator can edit).

## Requirements *(mandatory)*

- **Dynamic Authentication:** The system must conditionally prompt for login or password based on the specific poll's configuration.
- **Atomic Voting:** Ensure each user can only cast one valid vote per poll using database constraints.
- **Real-time Results:** Instant visual feedback for vote totals using Supabase Realtime or SWR.
- **Data Validation:** Strict schema validation using Zod for all incoming API payloads.
- **Security:** Enforcement of Row Level Security (RLS) to protect data integrity at the database level.
- **Performance:** Optimized Edge functions or queries to maintain sub-300ms response times.
- **Responsive UI:** Mobile-first interface that remains functional under high concurrent load.
- **Flexible Access Control:** Support for three poll visibility levels:
  - Private: Requires mandatory Supabase Auth login.
  - Public: Allows voting without an account (using IP/Browser fingerprinting to prevent spam).
  - Password-Protected: Access to the poll is granted only after entering a correct pre-defined password.

### Functional Requirements

- **FR-001**: System MUST [specific capability, e.g., "allow users to create accounts"]
- **FR-002**: System MUST [specific capability, e.g., "validate email addresses"]  
- **FR-003**: Users MUST be able to [key interaction, e.g., "reset their password"]
- **FR-004**: System MUST [data requirement, e.g., "persist user preferences"]
- **FR-005**: System MUST [behavior, e.g., "log all security events"]

*Example of marking unclear requirements:*

- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

## Constitution Alignment *(mandatory)*

### TypeScript and Contract Impact

- List affected shared types/schemas and where they are enforced.
- Define how frontend, backend, and database payload contracts remain synchronized.

### Security and Data Access Impact

- Identify Supabase tables/policies affected by this feature.
- Describe required RLS and role-scope changes (or explicitly state no change).
- Confirm service-role usage boundaries for privileged operations.

### Observability and Runtime Signals

- Define required logs, correlation IDs, and health/alert signals for this feature.
- Identify any sensitive fields that MUST be redacted from logs.
- If deadline-constrained, explicitly mark deferred health/alert signals with owner and due date
  via Deadline Waiver.

### Docker and Deployment Impact

- State whether Dockerfile/compose changes are required.
- Specify how this feature is validated in a containerized environment.
- If container validation is deferred for deadline reasons, include waiver scope, owner, and due date.

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria *(mandatory)*

- **Functional Completeness**: 100% of the defined mandatory requirements are implemented and accessible via the UI/API.
- **Type Safety**: The project compiles with zero TypeScript errors in strict mode, and all external data (API/Database) is validated at the boundary.
- **Performance Benchmark**: Core user interactions (e.g., data submission, page transitions) achieve a $p95$ latency under the defined threshold (e.g., 300ms).
  - If deadline-constrained, this criterion MAY be marked as deferred with Deadline Waiver details.
- **Security Compliance**: No sensitive credentials (API Keys, Secrets) are exposed in the client-side bundle, and Row Level Security (RLS) is verified for all protected tables.
- **Test Coverage**: Critical business logic and edge cases are covered by automated tests (Unit or Integration) with a passing rate of 100%.
- **Build & Deployment**: The application successfully builds in a CI/CD environment and runs without environment-related crashes on the target platform.
  - If full Docker/runtime validation is deferred, document fallback checks and waiver due date.
- **Error Resilience**: The system handles failed requests gracefully with user-friendly error messages and maintains state integrity during partial outages.

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]
