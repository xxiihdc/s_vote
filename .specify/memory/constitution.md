<!--
Sync Impact Report
- Version change: 1.0.0 -> 2.0.0
- Modified principles:
  - IV. Observability and Operational Readiness -> IV. Pragmatic Observability and Operational Readiness
  - V. Reproducible Docker Delivery -> V. Pragmatic Docker Delivery
- Added sections:
	- Deadline Waiver Process
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

### IV. Pragmatic Observability and Operational Readiness
Production paths MUST emit structured logs with request correlation identifiers and actionable
error context without exposing secrets or personal data. Health checks and runbook-relevant
signals SHOULD exist for API and background operations before release and MAY be deferred when
deadline pressure is documented through the Deadline Waiver Process.
Rationale: Fast incident triage is important, but deadline-constrained delivery may prioritize
core functionality while tracking operational hardening as explicit follow-up work.

### V. Pragmatic Docker Delivery
Local, CI, and deployment environments MUST use Docker-based workflows with pinned base
images and explicit environment configuration. Docker build/start validation SHOULD run before
release and MAY be deferred under deadline pressure when a documented waiver includes owner and
due date.
Rationale: Reproducible containers reduce environment drift, while controlled deferral supports
time-critical releases.

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

All pull requests MUST satisfy the following core gates:
- Type safety gate: strict TypeScript check passes.
- Security gate: Supabase RLS and role usage impact documented for schema/API changes.
- Quality gate: unit and integration tests pass in CI.
- Review gate: at least one reviewer confirms constitution compliance checklist items.

The following non-functional gates are RECOMMENDED and MAY be deferred through the Deadline
Waiver Process:
- Runtime observability gate: health/readiness signals for new runtime paths.
- Docker reproducibility gate: Docker build/start validation.
- Performance gate: explicit benchmark validation against target SLOs.

Release readiness reviews MUST include rollback instructions and a short verification checklist
for vote submission and vote counting paths, including any approved deferrals.

## Deadline Waiver Process

When deadline pressure requires reduced non-functional scope, teams MAY defer the recommended
non-functional gates only if all items below are documented in the feature plan/tasks:
- Waiver scope: exact deferred requirement(s) and affected files/routes.
- Risk statement: expected impact and fallback/rollback notes.
- Owner: single accountable engineer.
- Due date: remediation deadline in ISO format.
- Tracking link: task/issue reference for follow-up completion.

Security, type safety, and automated test core gates MUST NOT be waived.

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
- Every task list MUST include explicit tasks for tests and security controls; non-functional
	observability and Docker tasks SHOULD exist unless deferred via Deadline Waiver Process.
- Periodic audits MAY sample merged work for compliance; repeated violations MUST trigger
	corrective actions before new feature merges.
- Any approved waiver MUST be closed by its due date or escalated in the next planning cycle.

**Version**: 2.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date not found | **Last Amended**: 2026-03-13
