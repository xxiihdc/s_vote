# Implementation Plan: Create Vote Without Login

**Branch**: `002-feature-create-vote` | **Date**: March 12, 2026 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-feature-create-vote/spec.md`

## Summary

Enable anonymous users to create polls/surveys without authentication. Users input a question, provide 2-50 voting options, and configure settings (open/close times, password protection, single/multiple selections). Each vote receives a unique shareable URL with automatic expiration after 30 days (or sooner if configured). The system enforces server-side time-gating and password verification, stores responses in Supabase with row-level security, and provides real-time result viewing for vote creators. This is the MVP core feature enabling the s_vote platform's primary use case.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Next.js 15.x (App Router)  
**Primary Dependencies**: React 19, Next.js 15, Supabase JS client, Zod schema validation  
**Storage**: Supabase Postgres (PostgreSQL 15) with RLS, Edge Functions for server-side logic  
**Testing Framework**: Vitest with React Testing Library (frontend), Supabase test utilities  
**Target Platform**: Docker Linux containers for local development, Vercel/Cloud for production  
**Project Type**: Full-stack Next.js SSR/SSG web app with Edge Functions  
**Performance Goals**: Vote creation/submission completes within 300ms p95; results update within 2 seconds  
**Constraints**: 
  - Row-level security MUST protect all vote/response tables
  - No passwords/secrets exposed in client-side code
  - Vote time-gating MUST use server UTC time, not client time
  - Support 50 concurrent votes minimum with sub-300ms response time
**Scale/Scope**: 
  - Expected: 1000-10000 votes active simultaneously
  - Average: 10-100 responses per vote
  - Peak: 100 concurrent submissions per vote during campaign

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ **TypeScript Contract Gate**: Shared types defined in `src/types/contracts.ts` for Vote, VoteOption, VoteResponse interfaces. API contracts specified in spec for `/api/votes`, `/api/votes/:id`, `/api/votes/:id/respond`, `/api/votes/:id/verify-password`, `/api/votes/:id/results`.
  
- ✅ **Supabase Security Gate**: RLS policies required on `votes` and `vote_responses` tables. Anonymous users can INSERT responses only if vote is open and password-verified (if required). Vote creators cannot be identified from response queries. Password hashing happens server-side only (Edge Function processing).
  
- ✅ **Test Gate**: Required coverage: (1) Vote creation with invalid inputs (unit), (2) Time-gated access enforcement (integration), (3) Password verification flow (integration), (4) Response submission and counting (integration), (5) Race condition handling for concurrent submissions (contract test).
  
- ✅ **Observability Gate**: Structured logs required for: vote creation (with correlation ID), password-based access attempts, vote submission (with status), time-gating rejections. Health signal: `/health` endpoint reports Supabase connectivity for vote queries.
  
- ✅ **Docker Reproducibility Gate**: Feature uses existing Dockerfile (no changes required). Edge Functions deployed via Supabase CLI as part of standard deployment. Build validation: Next.js `npm run build` must complete without errors; test suite must pass in CI before merge.

## Project Structure

### Documentation (this feature)

```text
specs/002-feature-create-vote/
├── plan.md              # This file (implementation plan)
├── spec.md              # Feature specification
├── research.md          # Phase 0 research findings (generated)
├── data-model.md        # Phase 1 data entities (generated)
├── quickstart.md        # Phase 1 developer quickstart (generated)
├── contracts/           # Phase 1 API contracts (generated)
│   ├── vote.openapi.yaml
│   └── vote.schema.json
├── tasks.md             # Phase 2 task breakdown (generated)
└── checklists/          # Quality assurance checklists
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
src/
├── types/
│   └── contracts.ts         # Shared Vote/VoteOption/VoteResponse types
├── lib/
│   ├── vote/                # Vote domain logic
│   │   ├── create.ts        # Vote creation business logic
│   │   ├── validate.ts      # Input validation schemas (Zod)
│   │   └── password.ts      # Password verification utilities
│   └── supabase/
│       ├── browser.ts       # (existing) Client-side Supabase setup
│       └── server.ts        # (new) Server-side admin/service-role context
├── app/
│   ├── votes/
│   │   ├── create/
│   │   │   ├── page.tsx     # Vote creation form
│   │   │   └── actions.ts   # Server actions for form submission
│   │   ├── [voteId]/
│   │   │   ├── page.tsx     # Vote display/voting page
│   │   │   ├── results/
│   │   │   │   └── page.tsx # Results view
│   │   │   └── actions.ts   # Server actions for vote submission
│   │   └── components/
│   │       ├── VoteForm.tsx
│   │       ├── SettingsPanel.tsx
│   │       ├── ResultsChart.tsx
│   │       └── PasswordPrompt.tsx
│   └── api/
│       └── votes/
│           ├── route.ts             # POST /api/votes, GET /api/votes/:id
│           ├── [voteId]/
│           │   ├── verify-password/
│           │   │   └── route.ts     # POST /api/votes/:id/verify-password
│           │   ├── respond/
│           │   │   └── route.ts     # POST /api/votes/:id/respond
│           │   └── results/
│           │       └── route.ts     # GET /api/votes/:id/results
│           └── middleware.ts        # Time-gating and authorization

supabase/
├── migrations/
│   └── 20260312_create_vote_tables.sql  # votes, vote_responses, RLS policies
├── functions/
│   └── verify-vote-password/
│       └── index.ts                      # Password verification Edge Function
└── (existing database schema)

tests/
├── unit/
│   ├── vote-creation.test.ts
│   ├── vote-validation.test.ts
│   └── password-verification.test.ts
├── integration/
│   ├── vote-api-flow.test.ts
│   ├── time-gating.test.ts
│   ├── concurrent-submissions.test.ts
│   └── password-protected-votes.test.ts
└── contract/
    └── vote-contracts.test.ts
```

**Structure Decision**: Single Next.js app with vote domain logic isolated in `src/lib/vote/`. API routes handle external access; Server Actions handle internal form submission. Supabase Edge Functions used only for sensitive operations (password verification). Existing app structure preserved; vote feature integrates cleanly without restructuring.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
