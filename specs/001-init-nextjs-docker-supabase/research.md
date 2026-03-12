# Phase 0 Research: Initialize Next.js + Supabase + Vercel

## Decision 1: Bootstrap with Next.js App Router and TypeScript strict mode
- Decision: Initialize using `create-next-app` with App Router and enforce TypeScript strict mode in `tsconfig.json`.
- Rationale: This gives the fastest standards-aligned bootstrap and enforces contract safety from day one.
- Alternatives considered: Manual bootstrap (more setup drift), T3 stack preset (prematurely opinionated for initialization scope).

## Decision 2: Browser Client only for frontend access
- Decision: Use only Supabase Browser Client in frontend; all admin-privileged actions are handled inside Supabase Edge Functions using `service_role`.
- Rationale: This keeps frontend simple, avoids custom backend maintenance, and maintains strict privilege separation.
- Alternatives considered: Next.js route handlers for privileged actions (adds backend surface), direct service-role use in frontend (security violation).

## Decision 3: Validate environment with Zod at startup
- Decision: Define a single typed environment schema and fail fast when required vars are missing or invalid.
- Rationale: Immediate feedback avoids runtime misconfiguration and supports strict TypeScript contracts.
- Alternatives considered: Raw `process.env` checks (weak typing), env.example only (no runtime guarantees), envalid (less flexible for future schema composition).

## Decision 4: Remove Docker and deploy via Vercel
- Decision: Do not use Docker; deploy frontend directly on Vercel with CI/CD from GitHub.
- Rationale: Faster iteration and native preview deployment workflow for frontend-only architecture.
- Alternatives considered: Docker-based deployment (higher operational overhead), self-hosted Node runtime (unnecessary for current scope).

## Decision 5: Baseline tests with unit/smoke + Supabase integration
- Decision: Add startup smoke tests, Browser Client integration tests, and Edge Function invocation tests as mandatory baseline gates.
- Rationale: This verifies frontend bootstrap and Supabase service readiness before feature development.
- Alternatives considered: E2E-only testing (slower feedback), no tests (violates constitution).

## Decision 6: Structured logs with correlation identifiers
- Decision: Emit structured JSON logs and include a request correlation ID for frontend-to-Edge-Function operations.
- Rationale: Improves diagnosability and production incident triage.
- Alternatives considered: Plain console logging (poor queryability), full APM at bootstrap stage (premature complexity).

## Decision 7: Supabase CLI for migrations and Edge Functions deployment
- Decision: Use Supabase CLI from local machine to manage database migrations and deploy Edge Functions.
- Rationale: Single source of truth for schema/function lifecycle with explicit versioned changes.
- Alternatives considered: Dashboard-only manual updates (hard to audit), custom scripts without Supabase CLI (less standardized).
