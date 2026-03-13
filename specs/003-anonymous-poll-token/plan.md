# Implementation Plan: Anonymous Vote With Token Result URL

**Branch**: `003-anonymous-poll-token` | **Date**: March 12, 2026 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-anonymous-poll-token/spec.md`

## Summary

Deliver anonymous vote creation and token-based results access. A user can create a vote without login, receive a URL with unguessable token, and anyone with that token can view vote results while the token is valid.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Next.js App Router  
**Primary Dependencies**: Next.js, React, Supabase JS, Zod  
**Storage**: Supabase Postgres (RLS-enabled)  
**Testing**: Vitest + integration/contract tests  
**Target Platform**: Dockerized Linux + cloud runtime  
**Project Type**: Next.js full-stack web app  
**Performance Goals**: create vote p95 < 5s, token result read p95 < 2s  
**Constraints**: token must be unguessable; read-only token access; no secret leakage  
**Scale/Scope**: supports high read fan-out on result URLs and moderate write throughput

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Gate Review

- ✅ **TypeScript Contract Gate**: Shared vote creation/result contracts are planned and synchronized via schema validation at boundaries.
- ✅ **Supabase Security Gate**: Token-result path is read-only; write paths remain server controlled with RLS boundaries.
- ✅ **Test Gate**: Unit + integration + contract tests planned for create, token resolution, invalid/expired token behavior.
- ✅ **Observability Gate**: Correlation IDs, success/failure logs, and health checks are required for token-resolution paths.
- ✅ **Docker Reproducibility Gate**: Existing Docker workflow remains and is required for release validation.

## Project Structure

### Documentation (this feature)

```text
specs/003-anonymous-poll-token/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── token-results.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── votes/
│   └── create/
│       └── page.tsx
├── results/
│   └── [token]/page.tsx
└── api/
    └── votes/
        ├── route.ts
        └── results/
            └── [token]/route.ts

src/
├── types/
│   └── contracts.ts
└── lib/
    ├── env.ts
    ├── logger.ts
    ├── correlation.ts
    └── supabase/
        └── browser.ts

supabase/
└── migrations/

tests/
├── unit/
├── integration/
└── contract/
```

**Structure Decision**: Keep single Next.js codebase with API routes for vote create and token-result retrieval, shared contracts in `src/types/contracts.ts`, and Supabase-backed persistence.

## Phase 0: Research Output

Research completed in [research.md](./research.md) with decisions on:
- unguessable token URL model,
- token hash storage,
- read-only token scope,
- server-side expiry checks,
- resilient result refresh strategy.

All clarifications resolved.

## Phase 1: Design & Contracts Output

Design artifacts completed:
- Data model: [data-model.md](./data-model.md)
- API contract: [token-results.openapi.yaml](./contracts/token-results.openapi.yaml)
- Developer flow: [quickstart.md](./quickstart.md)

### Post-Design Constitution Re-Check

- ✅ **TypeScript Contract Gate**: API and domain payloads are explicitly modeled and contract-driven.
- ✅ **Supabase Security Gate**: Token path constrained to read-only output; no admin capability on token URL.
- ✅ **Test Gate**: Quickstart mandates unit/integration/contract checks for core behavior.
- ✅ **Observability Gate**: Logging + correlation + health checks explicitly required in design docs.
- ✅ **Docker Reproducibility Gate**: Docker validation remains an explicit release gate.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
