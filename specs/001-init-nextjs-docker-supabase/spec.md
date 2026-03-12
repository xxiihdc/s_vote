# Feature Specification: Initialize Next.js + Supabase + Vercel Project

**Feature Branch**: `001-init-nextjs-docker-supabase`  
**Created**: 2026-03-11  
**Status**: Draft  
**Input**: User description: "khong su dung backend, frontend goi truc tiep supabase; bo docker, deploy vercel; su dung supabase cli"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Runnable Base App (Priority: P1)

As a developer, I can run a Next.js TypeScript application locally with one command so that I can start implementing product features immediately.

**Why this priority**: Without a runnable baseline app, no feature work can proceed.

**Independent Test**: Run the app and verify the landing page loads and Supabase Browser Client initializes successfully.

**Acceptance Scenarios**:

1. **Given** a clean checkout, **When** I install dependencies and start dev server, **Then** the app starts without TypeScript errors.
2. **Given** the app is running, **When** frontend initializes Supabase Browser Client, **Then** it can perform a basic RLS-safe read successfully.

---

### User Story 2 - Vercel Deployment Baseline (Priority: P2)

As a developer, I can deploy the frontend app to Vercel directly from GitHub so that delivery and preview workflows are automatic.

**Why this priority**: Continuous delivery is required to validate user-facing changes quickly.

**Independent Test**: Trigger Vercel deployment from main branch and verify successful production/preview URL.

**Acceptance Scenarios**:

1. **Given** repository is connected to Vercel, **When** a commit is pushed, **Then** Vercel build and deployment complete successfully.
2. **Given** deployment environment variables are configured, **When** app is deployed, **Then** frontend can access Supabase Browser Client without runtime errors.

---

### User Story 3 - Frontend Supabase + Edge Functions Baseline (Priority: P3)

As a developer, I can use Supabase Browser Client directly in frontend and route admin tasks through Supabase Edge Functions so that no custom backend is required.

**Why this priority**: Supabase is a core platform dependency for authentication and persistence.

**Independent Test**: Validate Browser Client operations from frontend and verify admin action path works only via Edge Functions.

**Acceptance Scenarios**:

1. **Given** valid Supabase URL and anon key, **When** app starts, **Then** Browser Client initializes successfully.
2. **Given** an admin operation is requested, **When** Edge Function is invoked, **Then** operation executes with `service_role` on Supabase side and not from frontend credentials.

### Edge Cases

- Missing `.env` values for Supabase URL or keys.
- Vercel build fails due to missing environment variables.
- Edge Function deploy version differs from frontend expectations.
- Supabase temporarily unavailable during startup checks.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST initialize a Next.js project using TypeScript strict mode.
- **FR-002**: System MUST provide a frontend runtime readiness check for Supabase Browser Client initialization.
- **FR-003**: System MUST support Vercel deployment via GitHub integration.
- **FR-004**: System MUST define environment variable contracts for Supabase public and server credentials.
- **FR-005**: System MUST provide Supabase Browser Client initialization in frontend.
- **FR-006**: System MUST route admin-privileged operations through Supabase Edge Functions only.
- **FR-007**: System MUST include baseline tests for core startup and Browser Client behavior.
- **FR-008**: System MUST use Supabase CLI to manage migrations and deploy Edge Functions from local machine.

## Constitution Alignment *(mandatory)*

### TypeScript and Contract Impact

- Shared TypeScript env schema and client-side response types for bootstrap checks.
- Validation boundaries implemented for runtime config input.

### Security and Data Access Impact

- Service-role credentials are never present in frontend code and are used only inside Edge Functions.
- Initial integration enforces anon-key usage in browser and RLS-protected access patterns.

### Observability and Runtime Signals

- Structured startup logs and Edge Function invocation telemetry metadata.
- No secrets printed in logs.

### Deployment Impact

- Deployment target is Vercel with environment-variable based configuration.
- Docker artifacts are intentionally out of scope for this feature revision.

### Key Entities *(include if feature involves data)*

- **EnvironmentConfig**: Validated runtime configuration for app and Supabase keys.
- **VercelDeploymentConfig**: Project-level deployment settings and required env variables.
- **SupabaseConnectionContext**: Browser Client configuration and Edge Function invocation metadata.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new developer can run the app locally in under 10 minutes.
- **SC-002**: Vercel deployment from GitHub succeeds without manual infrastructure steps.
- **SC-003**: Frontend Supabase Browser Client readiness check completes successfully within 300ms p95 on local environment.
- **SC-004**: TypeScript strict build passes with zero type errors.
- **SC-005**: Supabase CLI can apply migrations and deploy Edge Functions from local machine.
