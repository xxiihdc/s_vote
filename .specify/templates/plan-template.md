# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: Next.js, React, Supabase JS, Zod  
**Storage**: Supabase Postgres with RLS, object storage  
**Testing**: Vitest/Jest  
**Target Platform**: Dockerized Linux containers on cloud runtime  
**Project Type**: Next.js full-stack web app  
**Performance Goals**: vote submission p95 < 300ms (or mark as deferred with Deadline Waiver)  
**Constraints**: RLS enforced on all vote tables, zero secret leakage  
**Scale/Scope**: peak concurrent voters and election size

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- TypeScript Contract Gate (MANDATORY): Shared types/schemas identified for frontend, backend, and data access.
- Supabase Security Gate (MANDATORY): RLS impact and role boundaries documented for all data changes.
- Test Gate (MANDATORY): Required unit/integration/regression coverage listed for vote-critical behavior.
- Observability Gate (RECOMMENDED): Logging/correlation IDs required; health signals may be deferred with Deadline Waiver.
- Docker Reproducibility Gate (RECOMMENDED): Build/start validation may be deferred with Deadline Waiver.
- Performance Gate (RECOMMENDED): Benchmark validation against target SLOs may be deferred with Deadline Waiver.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified, including any Deadline Waiver**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
