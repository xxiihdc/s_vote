# Feature Specification: Create Vote Without Login

**Feature Branch**: `002-feature-create-vote`  
**Created**: March 12, 2026  
**Status**: Draft  
**Input**: User description: "Add functionality where a user can create 1 vote (no login needed yet), with 1 input being the question, voting options, add some settings for the vote such as open time, close time, whether password is needed to enter, whether multiple selections are allowed, this is the main feature of the web"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Basic Vote (Priority: P1)

A user wants to quickly create a poll without any authentication. They enter a poll question and provide multiple voting options, then immediately share the voting link with others.

**Why this priority**: This is the core feature of the application. Without the ability to create a vote, the product has no value. This single story demonstrates the MVP.

**Independent Test**: Can be fully tested by: User navigates to vote creation form → enters question → adds voting options → creates poll → receives shareable link. Delivers a complete, testable voting experience.

**Acceptance Scenarios**:

1. **Given** the user is on the vote creation page, **When** they enter a question and at least 2 voting options, **Then** the system allows them to create the vote immediately without login
2. **Given** a vote is successfully created, **When** the user is shown the confirmation screen, **Then** they receive a unique URL to share the vote
3. **Given** the user accesses the shared vote link, **When** they have not entered a password (if configured), **Then** they can immediately see and vote on the poll
4. **Given** invalid input (e.g., empty question or fewer than 2 options), **When** the user attempts to create a vote, **Then** the system displays validation errors and prevents submission

---

### User Story 2 - Configure Vote Settings (Priority: P1)

A user wants to configure when the vote opens and closes, add password protection, and control whether multiple selections are allowed.

**Why this priority**: Equally critical to P1. The vote creation workflow is incomplete without these settings. Users need to control their poll's behavior and access rules.

**Independent Test**: Can be fully tested by: User sets open/close times → enables password → allows multiple selections → creates vote → verifies settings are enforced. Each setting can be toggled independently.

**Acceptance Scenarios**:

1. **Given** the user is configuring vote settings, **When** they set an open time in the future, **Then** the vote remains inaccessible until that time arrives
2. **Given** the vote open time has passed and close time is in the future, **When** visitors access the vote link, **Then** they can submit their votes
3. **Given** the vote close time has arrived, **When** a user tries to submit a vote, **Then** the system rejects it and displays a "Voting has ended" message
4. **Given** the user enables password protection, **When** a visitor accesses the vote without entering the password, **Then** they are prompted for a password before accessing the poll
5. **Given** the user enables "Allow Multiple Selections", **When** a voter accesses the poll, **Then** they can select multiple options (if checkboxes are used)
6. **Given** the user disables "Allow Multiple Selections", **When** a voter accesses the poll, **Then** only one option can be selected at a time (radio buttons enforced)

---

### User Story 3 - View Vote Results (Priority: P2)

A user wants to see real-time results of their vote as responses come in.

**Why this priority**: Important for user engagement but not blocking core functionality. A vote without results is useful, but results add significant value for monitoring responses.

**Independent Test**: Can be fully tested by: User creates vote → shares link → voters submit responses → results update in real-time for vote creator. No breaking required for other P1 items.

**Acceptance Scenarios**:

1. **Given** a vote is created and open for responses, **When** the vote creator accesses the results page, **Then** they see current vote counts and percentages
2. **Given** a new response is submitted to an open vote, **When** the vote creator has the results page open, **Then** the counts update without requiring a page refresh
3. **Given** the vote has received multiple responses, **When** the vote creator views results, **Then** results are clearly displayed with visual indicators (bar charts, percentages)

---

### User Story 4 - Share and Distribute Vote Link (Priority: P2)

A user wants to easily share the voting link with others via multiple channels.

**Why this priority**: Valuable for usability but can be deferred. Core voting mechanism works without this; it's an enhancement.

**Acceptance Scenarios**:

1. **Given** a vote is created, **When** the user is shown the confirmation screen, **Then** a "Copy Link" button is available and copies the URL to clipboard
2. **Given** the vote link is copied, **When** the user pastes or visits this link, **Then** they access the exact vote without any additional navigation

---

### Edge Cases

- **Concurrent Vote Submissions**: If two voters submit simultaneously before the vote closes, both votes are recorded (no race condition; database handles concurrent writes).

- **Password-Protected Close Time**: If a vote closes exactly when a user with correct password is on the submission form, the system checks server-side close time and rejects the submission, not relying on client-side validation.

- **Multiple Selections with Timing**: If "Allow Multiple" is enabled and the vote closes exactly when a user is selecting options, any submission after close time is rejected regardless of how many options were selected.

- **Password Entry Limits**: If a vote is password-protected, the system implements rate limiting (e.g., max 5 incorrect attempts per minute) to prevent brute-force attacks.

- **Time Zone Handling**: When a user sets open/close times, the system stores times in UTC and displays them in the user's local timezone. Comparisons for vote availability use server time (UTC) to prevent timezone-related vulnerabilities.

- **Input Boundary Conditions**: 
  - Maximum question length: 1000 characters; system truncates or prevents overflow
  - Maximum number of options: 50 options per vote
  - Maximum password length: 255 characters
  - Minimum question length: 3 characters
  - Minimum options: 2 options required

- **Browser Refresh During Submission**: If a user refreshes the browser while a vote submission is in progress, the system uses optimistic UI updates and can recover the submission state or clearly inform the user of the result.

- **Vote Link Expiration**: Vote links expire after a maximum of 30 days from creation. Vote creators can set a custom expiration time shorter than 30 days if desired.

- **Access Without Password for Protected Votes**: If a user bookmarks the vote URL and returns later, do they need to re-enter the password each time, or is there a session-based mechanism?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create a vote without requiring authentication/login
- **FR-002**: System MUST accept a question (text input) and at least 2 voting options as required inputs
- **FR-003**: System MUST store vote creation settings including open time, close time, password protection flag, and multiple-selection flag
- **FR-004**: System MUST prevent vote access before the open time
- **FR-005**: System MUST prevent vote submission after the close time
- **FR-006**: System MUST require password entry before vote access if password protection is enabled
- **FR-007**: System MUST enforce single-selection voting when "Allow Multiple Selections" is disabled (radio button behavior)
- **FR-008**: System MUST enforce multiple-selection voting when "Allow Multiple Selections" is enabled (checkbox behavior)
- **FR-009**: System MUST generate a unique, shareable URL for each created vote
- **FR-010**: System MUST validate all vote creation inputs and display error messages for invalid entries
- **FR-011**: System MUST store all votes and responses with timestamp metadata

## Constitution Alignment *(mandatory)*

### TypeScript and Contract Impact

- **Shared Types**: 
  - `Vote` interface with fields: `id`, `question`, `options`, `openTime`, `closeTime`, `requiresPassword`, `allowMultiple`, `createdAt`, `updatedAt`
  - `VoteOption` interface with fields: `id`, `text`, `voteCount`
  - `VoteResponse` interface with fields: `id`, `voteId`, `selectedOptionIds[]`, `submittedAt`
  
- **API Contracts**:
  - POST `/api/votes` - Create a new vote (request body: question, options, settings; response: vote object with shareable URL)
  - GET `/api/votes/:id` - Retrieve vote details for public access (question, options; excludes password hash)
  - POST `/api/votes/:id/verify-password` - Verify password for protected votes
  - POST `/api/votes/:id/respond` - Submit a vote response
  - GET `/api/votes/:id/results` - Retrieve vote results/counts

- **Location**: These types should be defined in `src/types/contracts.ts` and used across frontend (`app/`), backend Edge Functions (`supabase/functions/`), and API handlers

### Security and Data Access Impact

- **Supabase Tables Required**:
  - `votes` table: stores vote metadata (question, options, settings, timestamps)
  - `vote_responses` table: stores individual responses with voter identifiers
  
- **Row Level Security (RLS)**:
  - Anonymous users can INSERT responses into `vote_responses` if vote is open and password-verified (if required)
  - Vote creators cannot be identified from responses in public queries (privacy by design)
  - Password hash must never be exposed to frontend; verification happens server-side only

- **No Changes Required**: User authentication/authorization mechanisms remain unchanged; this feature explicitly supports anonymous voting

### Observability and Runtime Signals

- **Logging**:
  - Log all vote creation attempts with correlation ID
  - Log vote access attempts (successful entry, password failures)
  - Log all vote submissions with timestamp and response count
  - Redact passwords from logs
  - Log timing violations (attempts after close time)

- **Monitoring**: Track vote creation rate, password-protected vote percentage, average response count per vote

### Docker and Deployment Impact

- No Dockerfile/compose changes required; feature uses existing Supabase infrastructure and Next.js app
- Edge Functions for vote creation/response must be deployed for production use

### Key Entities

- **Vote**: Represents a single poll/survey. Attributes: question (string), options (array), openTime (timestamp), closeTime (timestamp), requiresPassword (boolean), allowMultiple (boolean), passwordHash (string, optional), createdAt (timestamp), updatedAt (timestamp), uniqueShareUrl (string)

- **VoteOption**: Represents a single answer choice within a vote. Attributes: id (uuid), text (string, max 500 chars), order (integer for display)

- **VoteResponse**: Represents a single voter's submission. Attributes: id (uuid), voteId (uuid reference), selectedOptionIds (array of UUIDs), submittedAt (timestamp), voterIdentifier (IP or browser fingerprint, optional for anonymity)

---

## Success Criteria *(mandatory)*

- **Functional Completeness**: 100% of P1 and P2 requirements are implemented and fully functional through the UI (vote creation, settings configuration, results viewing, link sharing)
- **Type Safety**: All vote-related data (creation, responses, results) is validated with TypeScript types; Zod schemas enforce shapes at API boundaries
- **Performance**: Vote creation form submits and returns a shareable URL within 300ms; results update in real-time or within 2-second polling interval
- **Security Compliance**: 
  - Passwords are never sent to client or exposed in browser storage
  - Password verification happens server-side only (Edge Function)
  - Row-level security prevents unauthorized vote response access
  - No sensitive data in API responses to unauthenticated users
- **Test Coverage**: Vote creation, time-gated access, password verification, and response submission are covered by automated tests with 100% passing rate
- **Build & Deployment**: Application builds successfully; vote feature is deployable to staging/production without errors
- **Error Resilience**: 
  - Invalid vote creation input displays user-friendly error messages
  - Submission after deadline fails gracefully with "Voting has ended" message
  - Network failures during response submission show retry options and state is preserved

### Measurable Outcomes

- **SC-001**: Authenticated or unauthenticated users can create a vote in under 2 minutes (from landing to shareable link)
- **SC-002**: Vote submission responds to user action (click submit) within 500ms
- **SC-003**: 95% of vote creation attempts succeed without requiring user retry
- **SC-004**: Vote time-gating enforced server-side prevents voting outside open window 100% of the time
- **SC-005**: System supports minimum 1000 concurrent votes open simultaneously without degradation
- **SC-006**: Vote response data persists correctly; no data loss during network interruptions (verified by tests)

---

## Assumptions

- **Time Handling**: All vote times (open, close) are stored in UTC. Client-side display converts to user's local timezone for clarity, but server-side validation uses UTC to prevent manipulation.
- **Anonymous Voting**: Votes are anonymous unless explicitly tracked (future feature). Current implementation uses IP or browser fingerprinting to prevent duplicate votes from same user, but voter identity is not logged.
- **Vote Immutability**: Once created, vote question and options cannot be edited. Vote settings (time, password) are fixed at creation.
- **Default Settings**: If user doesn't specify open time, voting opens immediately. If user doesn't specify close time, voting remains open indefinitely. Password protection is off by default. Multiple selections are disabled by default (single choice).
- **UI/UX**: Vote creation form includes a preview that shows how the vote will appear to voters. Share link includes automatic URL copy-to-clipboard functionality.
- **Data Retention**: Vote data is retained indefinitely. Results are always visible to vote creator, even after the vote has closed or expired.
