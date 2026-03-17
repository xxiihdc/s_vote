# Tasks: Bind Create Vote Form Errors

## Phase 1: Core validation state

- [ ] Add a serializable create-form action-state type for errors, values, and message.
- [ ] Update `app/votes/create/actions.ts` to return validation state for Zod errors and redirect on success.
- [ ] Sanitize returned values so password is never preserved after failure.

## Phase 2: Form UI binding

- [ ] Extract the create form markup into a client component using `useActionState`.
- [ ] Render field-level error messages for `question`, `options`, `closeTime`, `password`, and `expirationDays` when present.
- [ ] Preserve non-sensitive field values with `defaultValue` and `defaultChecked` after failed submissions.
- [ ] Keep current success state and generic share-link error rendering unchanged in `page.tsx`.

## Phase 3: Regression coverage

- [ ] Extend integration tests for validation-error rendering and field value retention.
- [ ] Extend action tests for validation failure state and unexpected failure fallback.
- [ ] Run targeted tests plus type/lint checks for modified files.