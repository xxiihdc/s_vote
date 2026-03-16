# Feature Specification: Share Voting Link After Create

**Feature Branch**: `006-share-vote-link`  
**Created**: 2026-03-16  
**Status**: Draft  
**Input**: User description: "Lấy/tạo link sau khi tạo vote để chia sẻ cho người khác"

## Clarifications

### Session 2026-03-16

- Q: Voting URL nên là URL tuyệt đối hay path tương đối? → A: Voting URL MUST là URL tuyệt đối.
- Q: Khi thiếu link bắt buộc sau create thì hiển thị gì? → A: Ẩn success state và hiển thị thông báo lỗi chung.
- Q: Voting URL tuyệt đối lấy origin từ đâu? → A: Luôn dùng APP_URL làm canonical origin.

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

### User Story 1 - Copy voting link after creation (Priority: P1)

As a poll creator, I want to receive a shareable voting URL immediately after creating a vote so I can send it to voters without searching elsewhere.

**Why this priority**: This is the core delivery value of vote creation. Without a shareable voting link, creators cannot invite participants.

**Independent Test**: Create a vote with valid data and verify a voting URL appears in the success area, can be copied, and opens the voting page.

**Acceptance Scenarios**:

1. **Given** a user submits a valid create-vote form, **When** the vote is created, **Then** the success state shows a voting URL suitable for sharing.
2. **Given** the success state displays a voting URL, **When** the user copies it, **Then** the copied value exactly matches the displayed URL.
3. **Given** the success state displays a voting URL, **When** the user opens it, **Then** the destination is the voting page for that created vote.

---

### User Story 2 - Keep results link available (Priority: P2)

As a poll creator, I want to keep seeing the results URL together with the voting URL so I can share one link with voters and keep one link for tracking outcomes.

**Why this priority**: Creators need both links for normal workflow (distribution and monitoring). Losing either link causes friction and support overhead.

**Independent Test**: Create a vote and verify both voting URL and results URL are presented in the same success state and each can be opened/copied independently.

**Acceptance Scenarios**:

1. **Given** a vote is created successfully, **When** the success state is rendered, **Then** it includes both voting URL and results URL with distinct labels.
2. **Given** both links are displayed, **When** the user opens each one, **Then** each link routes to its intended destination.

---

### User Story 3 - Prevent confusing success state (Priority: P3)

As a poll creator, I want the success state to appear only when the required sharing links are available so I am not shown partial or misleading creation results.

**Why this priority**: Clear and trustworthy post-create feedback reduces user confusion and repeated submissions.

**Independent Test**: Simulate a create result that lacks one required link and verify the success panel is not shown.

**Acceptance Scenarios**:

1. **Given** creation metadata is incomplete, **When** the page loads, **Then** the success state is hidden.
2. **Given** creation metadata is incomplete, **When** the page loads, **Then** a generic error message indicates share links are unavailable.
3. **Given** creation metadata is complete, **When** the page loads, **Then** the success state is shown exactly once with all required link fields.

---

### Edge Cases
- If vote creation succeeds but one link value is missing, the success state must be hidden and a generic error message must be shown.
- If users refresh the create page after success, both links must remain derivable from the returned creation context.
- If users copy links multiple times quickly, each copy action must preserve exact URL content without truncation.
- If the base application URL includes a trailing slash, generated share URLs must remain valid and not contain duplicated slashes.
- If vote IDs contain URL-safe special characters, generated voting links must still resolve to the intended vote page.

## Assumptions

- The feature continues using the existing create-vote flow and success feedback pattern.
- A created vote always has a canonical vote identifier that can be used to construct a voting URL.
- Canonical origin for generated share links is `APP_URL`.
- The existing results URL behavior remains unchanged and must stay backward compatible.
- Sharing is done via direct URL copy/open actions in the create confirmation state.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST provide a shareable absolute voting URL immediately after successful vote creation.
- **FR-002**: System MUST display the voting URL with a user-facing label that clearly indicates it is for voters.
- **FR-003**: System MUST preserve and display the existing results URL in the same success state.
- **FR-004**: System MUST allow users to copy the voting URL directly from the success state.
- **FR-005**: System MUST allow users to copy the results URL directly from the success state.
- **FR-006**: System MUST provide direct open actions for both voting and results URLs.
- **FR-007**: System MUST ensure the voting URL targets the created vote and is derived from that vote’s identifier.
- **FR-008**: System MUST suppress the success state and display a generic share-link error message when required link data is missing or invalid.
- **FR-009**: System MUST keep current vote-creation validation and failure messaging behavior unchanged.
- **FR-010**: System MUST generate absolute voting URL using `APP_URL` as canonical origin.

## Constitution Alignment *(mandatory)*

### TypeScript and Contract Impact

- Creation result contract includes both link intents (voting URL and results URL) in post-create user flow expectations.
- Frontend success-state query expectations must stay synchronized with server action redirect parameters.
- Existing vote creation payload contract remains unchanged for input fields.

### Security and Data Access Impact

- No new database tables or RLS policy changes are required for this feature.
- No new privileged data-access scope is introduced.
- Link exposure remains limited to post-create response context already available to the vote creator.

### Observability and Runtime Signals

- Existing create-vote request correlation and success/failure logging remains in place.
- Logging MUST avoid exposing sensitive secret material in plain text.
- No additional health signal is required for this UI-level enhancement.

### Docker and Deployment Impact

- No Dockerfile or compose changes are required.
- Validation can be done through current automated tests plus standard build pipeline checks.

### Key Entities *(include if feature involves data)*

- **Vote Creation Outcome**: Post-create result shown to creator, containing the created vote identity and both share links.
- **Voting URL**: Shareable link intended for participants to submit responses to one specific vote.
- **Results URL**: Shareable link intended for viewing aggregated results for one specific vote.

## Success Criteria *(mandatory)*

- **Functional Completeness**: Voting URL and results URL are both available in post-create success flow.
- **Usability**: Creators can copy or open both links from a single confirmation view without extra navigation.
- **Behavior Stability**: Create-vote failure and validation behavior remains unchanged.
- **Quality Gate**: Automated tests for create-vote post-success flow remain passing.

### Measurable Outcomes

- **SC-001**: 100% of successful vote creations display both a voting URL and a results URL.
- **SC-002**: 95% of creators can complete "create then copy voting URL" in under 20 seconds during usability testing.
- **SC-003**: 100% of sampled voting URLs open the matching vote page for the created vote.
- **SC-004**: 0 regression in create-vote integration tests related to success redirect and link presentation.
