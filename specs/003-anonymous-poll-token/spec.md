# Feature Specification: Anonymous Vote With Token Result URL

**Feature Branch**: `003-anonymous-poll-token`  
**Created**: March 12, 2026  
**Status**: Draft  
**Input**: User description: "không đăng nhập cũng có thể tạo được vote, hệ thống sẽ trả về 1 url có token, chỉ cần vào token đó là có thể xem được kết quả vote"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Vote Without Login (Priority: P1)

A visitor can create a vote without signing in by entering a question and options.

**Why this priority**: This is the core value of the product and the required MVP entry point.

**Independent Test**: Open create-vote screen as anonymous user, submit valid vote data, and receive a tokenized URL.

**Acceptance Scenarios**:

1. **Given** a user has not logged in, **When** they submit a valid vote question and options, **Then** the vote is created successfully.
2. **Given** a vote is created, **When** creation succeeds, **Then** the system returns a unique URL containing a token.
3. **Given** invalid vote input, **When** user submits, **Then** the system blocks creation and shows validation errors.

---

### User Story 2 - View Results With Token URL (Priority: P1)

Anyone with the token URL can open it and see vote results directly.

**Why this priority**: This is the primary distribution and consumption model required by the request.

**Independent Test**: Open the returned token URL in a new browser/incognito and verify results are displayed.

**Acceptance Scenarios**:

1. **Given** a valid token URL, **When** user opens it, **Then** the system displays the vote results.
2. **Given** an invalid or expired token, **When** user opens it, **Then** the system shows a clear not-available message.
3. **Given** vote receives new responses, **When** results page is open, **Then** results refresh within expected delay.

---

### User Story 3 - Shareable and Stable Access (Priority: P2)

The creator can copy and share the token URL, and recipients can use it consistently.

**Why this priority**: Supports usability and adoption while preserving simple anonymous flow.

**Independent Test**: Copy token URL and open it from multiple devices/browsers to confirm consistent result access.

**Acceptance Scenarios**:

1. **Given** a created vote, **When** creator copies the token URL and shares it, **Then** recipients can open and view results.
2. **Given** the same token URL is reopened later, **When** token is still valid, **Then** results remain accessible.

---

### Edge Cases

- Token URL is malformed, missing token, or token has unsupported characters.
- Token exists but references a deleted or archived vote.
- Token is valid but vote has zero responses; system still shows empty-state results.
- Vote receives many responses in short time; result view still remains responsive.
- Simultaneous result reads from many users do not produce inconsistent counts.
- User refreshes results page repeatedly; system avoids duplicate/incorrect rendering.
- Vote expires while results page is open; system updates to unavailable state gracefully.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow anonymous users to create a vote without login.
- **FR-002**: System MUST require at least one question and at least two options to create a vote.
- **FR-003**: System MUST generate a unique token URL for every successfully created vote.
- **FR-004**: System MUST allow users who possess a valid token URL to view vote results.
- **FR-005**: System MUST reject invalid, unknown, or expired tokens and show a clear user-facing message.
- **FR-006**: System MUST persist vote and result data so token URL access remains consistent while valid.
- **FR-007**: System MUST provide a direct copy/share action for the generated token URL.
- **FR-008**: System MUST record key events for vote creation and token-result access.

## Constitution Alignment *(mandatory)*

### TypeScript and Contract Impact

- Vote creation and token-result payload shapes are defined in shared TypeScript contracts.
- Frontend and backend use the same contract definitions to avoid payload drift.
- Contract validation is required at request boundaries for vote creation and token lookup.

### Security and Data Access Impact

- Token lookup only exposes allowed result fields and never internal sensitive metadata.
- Data access policies prevent unauthorized write operations from token-read paths.
- Privileged database access remains in server-side contexts only.

### Observability and Runtime Signals

- Log vote creation success/failure with correlation IDs.
- Log token-result access success/failure without sensitive data.
- Include health/runtime checks for token-resolution and result-fetch paths.

### Docker and Deployment Impact

- No mandatory Dockerfile change is required for this feature.
- Feature must pass existing containerized build/start checks before release.

### Key Entities *(include if feature involves data)*

- **Vote**: Represents one voting object with question, options, and lifecycle status.
- **VoteResult**: Aggregated counts/percentages per option for display.
- **ResultAccessToken**: Unique token that maps to one vote’s result view capability.

## Success Criteria *(mandatory)*

- **Functional Completeness**: Anonymous users can create vote and receive token URL end-to-end.
- **Type Safety**: Vote creation and token-result contracts pass strict TypeScript checks.
- **Performance Benchmark**: Vote create and token-result read complete within target response budget.
- **Security Compliance**: Token reads expose only permitted data; no secret leakage in client or logs.
- **Test Coverage**: Core flows and edge cases have automated tests that pass consistently.
- **Build & Deployment**: Feature builds and runs in CI/container flow without environment issues.
- **Error Resilience**: Invalid/expired token states are handled with stable user-facing behavior.

### Measurable Outcomes

- **SC-001**: 95% of valid anonymous vote creations complete in under 5 seconds.
- **SC-002**: 99% of valid token URLs return result view in under 2 seconds.
- **SC-003**: 100% of invalid/expired token requests return explicit unavailable messaging.
- **SC-004**: 90% of first-time users can create and share a vote URL without assistance.

## Assumptions

- Token URLs are unguessable and unique per vote.
- Token validity follows platform retention/lifecycle policy; expired tokens become unavailable.
- Result page is read-only via token URL.
- Authentication for vote creation is intentionally deferred and out of scope for this feature.
