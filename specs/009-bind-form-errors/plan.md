# Implementation Plan: Bind Create Vote Form Errors

**Branch**: `009-bind-form-errors` | **Date**: 2026-03-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-bind-form-errors/spec.md`

## Summary

Replace the current redirect-only invalid-input handling in the create-vote flow with a validation-aware form action state.
Successful submissions continue to redirect exactly as today, while invalid submissions return serializable field errors
and submitted values to a client form component that renders inline feedback and preserves non-sensitive input.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19, Next.js App Router 15.5  
**Primary Dependencies**: Next.js server actions, React `useActionState`, Zod 3.x, Testing Library, Vitest  
**Storage**: Supabase Postgres, unchanged  
**Testing**: Vitest integration tests for page rendering and server action behavior  
**Target Platform**: Dockerized Linux local/CI, Vercel-compatible runtime  
**Project Type**: Next.js full-stack app with server actions and App Router  
**Constraints**:
- Keep success redirect contract unchanged
- Keep validation source of truth in `CreateVoteRequestSchema`
- Preserve user input after validation failure except password
- Avoid turning expected validation failures into noisy server errors

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| TypeScript Contract Gate | PASS | Introduce explicit action-state types for validation errors and submitted values. |
| Supabase Security Gate | PASS | No DB or access change; password remains non-persistent in UI state. |
| Test Gate | PASS | Add/adjust integration tests for field errors, value retention, and generic failure fallback. |
| Observability Gate | PASS | Internal errors remain logged; validation failures are handled as expected control flow. |
| Docker Reproducibility Gate | PASS | No environment or container changes required. |

## Project Structure

```text
app/
└── votes/
    └── create/
        ├── actions.ts              # server action returns action-state on validation failure
        ├── create-vote-form.tsx    # client component using useActionState
        └── page.tsx                # server page renders success state and mounts form component

src/
└── lib/
    └── vote/
        └── validate.ts             # expose validation-error mapping reusable by server action

tests/
└── integration/
    ├── vote-create-page.integration.test.tsx
    └── vote-create.integration.test.ts
```

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Use `useActionState` in a client form component | Enables server-side validation feedback without replacing the successful redirect pattern. |
| Return `{ errors, values, message }` on validation failure | Keeps UI state serializable and aligned with field-level rendering needs. |
| Keep `page.tsx` as server component | Preserves current success-state rendering from search params. |
| Clear password from returned values | Prevents sensitive data from being written back into DOM after a failed submit. |

## Phased Implementation

### Phase 1: Core validation state

- Define create-form action-state types and initial state.
- Update `createVoteAction` to distinguish Zod validation failures from generic failures.
- Return field errors and sanitized submitted values on validation failure.

### Phase 2: Form UI binding

- Extract the create form into a client component.
- Bind inputs to returned values using uncontrolled defaults.
- Render form-level banner plus inline messages with accessible field associations.

### Phase 3: Regression coverage

- Update server-action tests for validation-state returns and generic fallback behavior.
- Update page rendering tests for inline field messages and preserved values.
- Run targeted tests and type/lint validation for touched files.