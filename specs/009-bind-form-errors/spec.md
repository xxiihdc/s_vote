# Feature Specification: Bind Create Vote Form Errors

**Feature Branch**: `009-bind-form-errors`  
**Created**: 2026-03-17  
**Status**: Draft  
**Input**: User description: "Hãy thêm chức năng hiển thị lỗi cụ thể trên form create vote"

## Clarifications

### Session 2026-03-17

- Q: Lỗi cần hiển thị theo kiểu nào? -> A: Hiển thị lỗi ngay cạnh từng field và có thêm thông báo tổng quát ở đầu form khi submit không hợp lệ.
- Q: Sau khi submit lỗi có cần giữ lại dữ liệu người dùng vừa nhập không? -> A: Giữ lại toàn bộ dữ liệu đã nhập, trừ giá trị password vì lý do an toàn.
- Q: Khi lỗi là do backend nội bộ thay vì validation input thì xử lý thế nào? -> A: Hiển thị thông báo lỗi tổng quát, không gắn nhầm vào field cụ thể.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Show field-level validation messages (Priority: P1)

As a poll creator, I want to see which input field is invalid after submitting the create-vote form so I can correct the exact problem without guessing.

**Why this priority**: The current generic error state forces the user to inspect the whole form manually and increases failed retries.

**Independent Test**: Submit invalid form payloads and verify the page renders field-specific messages next to the affected inputs.

**Acceptance Scenarios**:

1. **Given** the question is shorter than the minimum length, **When** the form is submitted, **Then** the question field shows a validation message explaining the minimum requirement.
2. **Given** fewer than two options are provided, **When** the form is submitted, **Then** the options field shows a validation message explaining that at least two options are required.
3. **Given** close time is before open time, **When** the form is submitted, **Then** the close-time field shows the corresponding validation message.

---

### User Story 2 - Preserve submitted values on validation failure (Priority: P2)

As a poll creator, I want the form to keep my submitted values after a validation error so I do not need to retype the entire poll.

**Why this priority**: Preserving state reduces friction for long forms, especially multi-line vote options.

**Independent Test**: Submit invalid payloads and verify all non-sensitive fields retain their values while the password field is cleared.

**Acceptance Scenarios**:

1. **Given** the submitted form has a validation error, **When** the page re-renders, **Then** question, options, time fields, expiration days, and checkbox selections keep their submitted values.
2. **Given** the submitted form has a validation error, **When** the page re-renders, **Then** the password field is blank even if the user submitted a value.

---

### User Story 3 - Keep generic failure behavior for non-validation errors (Priority: P3)

As a poll creator, I want unexpected backend failures to remain clearly distinguishable from field validation problems so I know whether retrying input changes will help.

**Why this priority**: Validation and system failures require different user actions and should not be conflated.

**Independent Test**: Simulate a non-validation error in the create action and verify a generic form-level error is shown without field-level validation messages.

**Acceptance Scenarios**:

1. **Given** vote creation fails for a non-validation reason, **When** the action returns to the form, **Then** a generic error banner is shown.
2. **Given** vote creation fails for a non-validation reason, **When** the form is rendered, **Then** no field is incorrectly marked with a validation message.

## Edge Cases

- Empty lines in the options textarea must continue to be ignored before validation, and the resulting validation error must still point to the options field.
- If `requiresPassword` is unchecked, an empty password field must not show an error.
- If `requiresPassword` is checked and password is blank, the password field must show the refine-message from the schema.
- If `expirationDays` is outside the supported range, the numeric input must show the schema-derived validation message.
- If multiple fields are invalid, all affected fields must show their messages in the same response.

## Assumptions

- The existing create-vote success redirect flow remains unchanged.
- Validation source of truth remains `CreateVoteRequestSchema`.
- The create form can move into a client component as long as the page-level success state remains server-rendered.
- Error rendering can reuse the current card-based UI language without introducing a new design system.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST show field-specific validation messages for invalid create-vote submissions.
- **FR-002**: System MUST keep a form-level error summary when submission fails validation.
- **FR-003**: System MUST preserve submitted values for non-sensitive fields after validation failure.
- **FR-004**: System MUST clear the password field after validation failure, even if it was submitted.
- **FR-005**: System MUST keep the existing redirect-based success behavior unchanged for valid submissions.
- **FR-006**: System MUST keep a generic form-level error message for unexpected non-validation failures.
- **FR-007**: System MUST support showing multiple field errors in a single failed submission.
- **FR-008**: System MUST map schema validation paths to the corresponding form controls used on `/votes/create`.

## Constitution Alignment *(mandatory)*

### TypeScript and Contract Impact

- The server action result contract changes from redirect-only error handling to a serializable action state for validation failures.
- Form field names in the UI must stay aligned with `CreateVoteRequestSchema` validation paths.
- Existing success redirect query parameters remain unchanged.

### Security and Data Access Impact

- No database schema or RLS changes are required.
- Password input must not be echoed back into rendered HTML after a failed submission.
- Logging must continue to avoid leaking raw sensitive form values.

### Observability and Runtime Signals

- Existing error logging in the server action remains the main runtime signal.
- Validation failures are expected user input outcomes and should not be logged as unexpected internal failures.

### Docker and Deployment Impact

- No container or deployment configuration changes are required.
- Validation is covered by TypeScript, lint, and integration tests in the current CI flow.

## Success Criteria *(mandatory)*

- **Functional Completeness**: Invalid create-vote submissions show actionable, field-level feedback.
- **Usability**: Users can correct invalid submissions without re-entering the entire form.
- **Security**: Password values are not preserved in re-rendered HTML after validation failure.
- **Quality Gate**: Automated tests cover validation-state rendering and non-validation failure fallback.

### Measurable Outcomes

- **SC-001**: 100% of invalid create-vote test submissions surface at least one specific validation message.
- **SC-002**: 100% of tested non-password fields retain their submitted values after validation failure.
- **SC-003**: 0 password values are present in rendered form state after validation failure.
- **SC-004**: Existing successful create-vote redirect tests continue to pass unchanged.