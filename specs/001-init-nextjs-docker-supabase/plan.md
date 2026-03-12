# Implementation Plan: Initialize Next.js + Supabase + Vercel Project

**Branch**: `001-init-nextjs-docker-supabase` | **Date**: 2026-03-11 | **Spec**: `/specs/001-init-nextjs-docker-supabase/spec.md`
**Input**: Feature specification from `/specs/001-init-nextjs-docker-supabase/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Initialize a frontend-first project baseline using Next.js (TypeScript strict),
direct Supabase Browser Client usage, and Vercel deployment. Admin-privileged
operations are executed in Supabase Edge Functions using `service_role`, while
migrations/function deployment are handled by Supabase CLI.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: Next.js App Router, React, Supabase JS, Zod, Vitest/Jest, Supabase CLI  
**Storage**: Supabase Postgres with RLS, object storage  
**Testing**: Unit/integration tests for frontend Supabase flows and Edge Function invocation paths  
**Target Platform**: Vercel frontend hosting + Supabase managed services  
**Project Type**: Next.js frontend app with Supabase backend services  
**Performance Goals**: vote submission p95 < 300ms  
**Constraints**: RLS enforced on all vote tables, zero secret leakage, no custom backend service  
**Scale/Scope**: bootstrap scope for one app service with future extension to voting flows

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- TypeScript Contract Gate: Shared types/schemas identified for frontend, Edge Function payloads, and data access.
- Supabase Security Gate: RLS impact and role boundaries documented for all data changes.
- Test Gate: Required unit/integration/regression coverage listed for vote-critical behavior.
- Observability Gate: Logging, correlation IDs, and health signals defined for new runtime paths.
- Deployment Gate: Vercel build/deploy and preview validation approach defined for CI execution.

Pre-Phase-0 status: PASS

Post-Phase-1 design re-check: PASS

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

```text
app/
├── page.tsx

src/
├── lib/
│   ├── env.ts
│   ├── logger.ts
│   └── supabase/
│       └── browser.ts
└── types/
    └── contracts.ts

tests/
├── unit/
│   └── env.test.ts
└── integration/
    └── supabase-browser.test.ts

supabase/
├── config.toml
└── migrations/

supabase/functions/
└── admin-task/

.vercel/
└── project.json
```

**Structure Decision**: Use a single Next.js frontend with Browser Client in `src/lib`,
Supabase CLI-managed `migrations` and `functions`, and Vercel project configuration.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Constitution Note: Docker-specific governance is superseded in this feature by explicit
user-requested Vercel deployment direction. Operational reproducibility is maintained via
GitHub-to-Vercel CI/CD and Supabase CLI command workflows.
