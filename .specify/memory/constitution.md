<!--
Sync Impact Report
- Version change: template-placeholder -> 1.0.0
- Modified principles:
  - template-placeholder-1 -> I. TypeScript End-to-End Contracts
  - template-placeholder-2 -> II. Supabase Security by Default
  - template-placeholder-3 -> III. Test Gates Are Mandatory
  - template-placeholder-4 -> IV. Observability and Operational Readiness
  - template-placeholder-5 -> V. Reproducible Docker Delivery
- Added sections:
	- Stack and Security Constraints
	- Delivery Workflow and Quality Gates
- Removed sections:
	- None
- Templates requiring updates:
	- ✅ updated: .specify/templates/plan-template.md
	- ✅ updated: .specify/templates/spec-template.md
	- ✅ updated: .specify/templates/tasks-template.md
	- ⚠ pending (path not present): .specify/templates/commands/*.md
- Deferred TODOs:
	- TODO(RATIFICATION_DATE): Original adoption date is unknown in repository history.
-->

# S Vote Constitution

## Core Principles

### I. TypeScript End-to-End Contracts
All frontend and backend code MUST be implemented in TypeScript and share explicit contracts
for API payloads, validation schemas, and domain models. Any contract change MUST be
reflected in shared types and checked in CI with strict type checking (`tsc --noEmit`) before
merge.
Rationale: A single typed contract surface prevents silent data drift between Next.js routes,
UI clients, and Supabase interactions.

### II. Supabase Security by Default
Every data access path MUST enforce Supabase Row Level Security (RLS), least-privilege role
usage, and server-only handling of service-role credentials. Client-side code MUST NOT bypass
authorization logic; all privileged operations MUST execute in trusted server contexts.
Rationale: Online voting requires strict protection against unauthorized reads, writes, and
privilege escalation.

### III. Test Gates Are Mandatory
Each feature MUST include automated tests for critical behavior: unit tests for domain logic,
integration tests for Next.js API routes and Supabase interactions, and regression tests for vote
integrity rules. Pull requests MUST fail when test suites fail; no exceptions for feature merges.
Rationale: Voting workflows are correctness-sensitive and require deterministic verification.

### IV. Observability and Operational Readiness
Production paths MUST emit structured logs with request correlation identifiers and actionable
error context without exposing secrets or personal data. Health checks and runbook-relevant
signals MUST exist for API and background operations before release.
Rationale: Fast incident triage is required to maintain trust and availability during voting events.

### V. Reproducible Docker Delivery
Local, CI, and deployment environments MUST use Docker-based workflows with pinned base
images and explicit environment configuration. A change is not release-ready unless it can build
and start via the project Docker configuration and pass defined health checks.
Rationale: Reproducible containers reduce environment drift and deployment-time failures.

## Stack and Security Constraints

- The application platform MUST remain Next.js with TypeScript for both frontend and backend
	concerns inside the same codebase.
- Supabase is the canonical data and auth backend; schema changes MUST be versioned through
	migrations and reviewed for RLS impact.
- Secrets MUST be managed through environment variables and deployment secret stores; no
	hard-coded credentials in source, tests, or container images.
- Dockerfiles and compose definitions MUST avoid floating major tags when stable tags can be
	pinned.

## Delivery Workflow and Quality Gates

All pull requests MUST satisfy the following gates:
- Type safety gate: strict TypeScript check passes.
- Security gate: Supabase RLS and role usage impact documented for schema/API changes.
- Quality gate: unit and integration tests pass in CI.
- Runtime gate: Docker build and container startup validation pass.
- Review gate: at least one reviewer confirms constitution compliance checklist items.

Release readiness reviews MUST include rollback instructions and a short verification checklist
for vote submission and vote counting paths.

## Governance

This constitution overrides conflicting team conventions for this repository.

Amendment procedure:
1. Propose the change in a pull request that includes rationale, affected principles, and required
	 template updates.
2. Obtain approval from maintainers responsible for application and platform/security concerns.
3. Update version according to semantic governance versioning:
	 - MAJOR: Removing or redefining a principle in a backward-incompatible way.
	 - MINOR: Adding a new principle/section or materially expanding mandatory guidance.
	 - PATCH: Clarifications, wording improvements, and non-semantic edits.

Compliance review expectations:
- Every feature plan MUST include a Constitution Check section mapped to these principles.
- Every task list MUST include explicit tasks for tests, security controls, and Docker validation.
- Periodic audits MAY sample merged work for compliance; repeated violations MUST trigger
	corrective actions before new feature merges.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date not found | **Last Amended**: 2026-03-11
