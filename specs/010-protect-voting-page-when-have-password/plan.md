# Implementation Plan: Protect Voting Page When Password-Protected

**Branch**: `010-protect-voting-page-when-have-password` | **Date**: 2026-03-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-protect-voting-page-when-have-password/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add password protection UI and API validation to the voting page. When a vote has `requiresPassword = true`, render a password input form before the voting form and protect both vote reads and vote submissions through trusted server API routes. Use constant-time password verification and a short-lived in-memory unlock flow for the current page lifecycle only; refreshing or reopening the vote URL requires entering the password again. This prevents unauthorized access to password-protected votes while maintaining fast, seamless voting for non-protected votes.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: Next.js 15.x, React 19.x, Supabase JS Client, Zod, bcryptjs  
**Storage**: Supabase Postgres with Row-Level Security (RLS); vote table has `requiresPassword` (boolean) and `passwordHash` (text) fields from feature 002  
**Testing**: Vitest + Integration tests  
**Target Platform**: Dockerized Linux containers on cloud runtime (Next.js with Vercel/similar)  
**Project Type**: Next.js full-stack web app (app router)  
**Performance Goals**: Password validation and voting submission both maintain p95 < 300ms latency  
**Constraints**: 
- Protected vote access is enforced in trusted API routes first; RLS hardening remains a follow-up defense-in-depth step
- Password access must not persist across refreshes or reopened vote links in this feature
- Any unlock state must stay in memory for the current page lifecycle only
- Zero plaintext password exposure in logs, browser tools, or network traffic
- Bcrypt comparison must be constant-time to prevent timing attacks
**Scale/Scope**: Support peak concurrent voters without rate-limit bypass; max 5 password attempts/minute per session/IP

**Current State**:
- Vote page exists at `app/votes/[voteId]/page.tsx` with VoteForm component
- Database already has `requiresPassword` and `passwordHash` fields (feature 002)
- API route exists at `app/api/votes/route.ts` for vote creation
- No password validation currently implemented in voting page
- Voting form renders immediately without checking password protection
- Vote detail route currently returns the vote payload without a protected-read guard

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### MANDATORY Gates

- **TypeScript Contract Gate** ✅ 
  - Contracts to define:  
    - `PasswordVerifyRequest` (POST /api/votes/[voteId]/verify-password): { password: string }
    - `PasswordVerifyResponse`: { authenticated: boolean; message?: string }
    - `VoteDetailWithAuth`: extends VoteDetail with `requiresPassword` boolean (already in VoteDetail)
  - Shared types location: `src/types/contracts.ts` (already exists)
  - API validation: Zod schema for password verify endpoint in `lib/vote/validate`

- **Supabase Security Gate** ✅ 
  - API-first Protection:
    - Current: `vote_responses_insert_open_vote` checks vote is open/active
    - Required now: Protect `GET /api/votes/[voteId]` and `POST /api/votes/[voteId]/responses` in trusted Next.js API routes when `requiresPassword = true`
    - Implementation now: Validate password on the server, issue a short-lived unlock token for the current page lifecycle, and reject protected read/write requests when the token is absent or invalid
    - Follow-up later: Add RLS hardening as defense-in-depth after API-first flow is stable
    - No schema changes needed: `requiresPassword` and `passwordHash` already exist in votes table
  - Password-related fields (passwordHash) must never be exposed to client-side API responses
  - Server-only handling: Password validation must ONLY occur in Next.js API routes or Supabase Edge Functions
  
- **Test Gate** ✅ 
  - Unit tests: 
    - Password validation logic (bcrypt comparison)
    - Rate limiting logic
    - Short-lived unlock token validation and rejection on reload/revisit
    - Secret redaction in logs
  - Integration tests:
    - Full voting flow with password protection
    - Protected vote read API rejects access before password verification
    - Incorrect password rejection
    - Correct password grants access
    - Refresh and reopened links require password re-entry
    - Non-protected votes skip password form
  - Test files: `tests/integration/password-protected-vote-page.integration.test.tsx`, `tests/integration/password-vote-reprompt.integration.test.tsx`, `tests/unit/password-access.test.ts`

### RECOMMENDED Gates

- **Observability Gate** ✅ INCLUDED (not deferred)
  - Log password validation attempts (success/failure) with correlation IDs
  - Log protected-read rejections and protected-submit rejections
  - Log rate limit breaches per session/IP
  - Redact plaintext password and attempt values from logs
  - Existing logging infrastructure: `lib/vote/logging.ts` used for vote operations

- **Docker Reproducibility Gate** ✅ NO CHANGES NEEDED
  - No Dockerfile changes required
  - Token signing configuration may reuse existing server-side secrets; no Docker-specific changes required
  - Bcryptjs already available in npm ecosystem

- **Performance Gate** ✅ INCLUDED (target already defined: p95 < 300ms)
  - Password validation (bcrypt): ~100-200ms on typical hardware
  - In-memory unlock token validation: <5ms
  - Total password flow per request: <300ms p95 (within SLO)

## Project Structure

### Documentation (this feature)

```text
specs/010-protect-voting-page-when-have-password/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── password-verify.contract.ts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── votes/
│   └── [voteId]/
│       ├── page.tsx              # Voting page - will add password check
│       ├── vote-form.tsx          # Existing voting form
│       └── password-form.tsx      # NEW: Password input component
├── api/
│   └── votes/
│       ├── route.ts              # Create vote endpoint (existing)
│       ├── [voteId]/
│       │   └── verify-password/  # NEW: POST password verification
│       │       └── route.ts
│       └── results/
│           └── [token]/
│               └── route.ts
src/
├── lib/
│   ├── vote/
│   │   ├── service.ts            # Vote service (will add protected read/write guards)
│   │   ├── password-access.ts    # NEW: in-memory unlock token helpers
│   │   ├── validate.ts           # Zod schemas (will add PasswordVerifyRequest)
│   │   └── logging.ts            # Existing logging
│   └── env.ts                    # Environment variables
├── types/
│   └── contracts.ts              # Shared types (will extend)

tests/
├── integration/
│   ├── password-protected-vote-page.integration.test.tsx   # NEW: Protected read + verify flow
│   ├── password-vote-reprompt.integration.test.tsx         # NEW: Refresh/revisit requires re-entry
│   └── [existing vote tests]
├── unit/
│   └── password-access.test.ts                     # NEW: Password validation, unlock tokens, rate limiting
└── contract/
    ├── password-verify.contract.test.ts            # NEW: Contract/schema validation
    └── [existing vote contracts]

supabase/
└── migrations/
    └── [feature 002 already has requiresPassword + passwordHash fields]
```

**Structure Decision**: Single Next.js full-stack app (existing structure). This feature extends:
- **Frontend**: Add password-form.tsx component; conditionally render before vote-form.tsx
- **Backend**: Add protected `GET /api/votes/[voteId]`, protected `POST /api/votes/[voteId]/responses`, and new `POST /api/votes/[voteId]/verify-password` for password validation
- **Shared types**: Extend contracts.ts with PasswordVerifyRequest and PasswordVerifyResponse
- **Tests**: Add contract and integration tests for protected reads, reprompt-on-refresh behavior, and password logic

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified, including any Deadline Waiver**

**Status**: ✅ NO VIOLATIONS DETECTED

All mandatory gates pass without waivers:
- TypeScript contracts fully specified
- Security gates documented with API-first enforcement now and RLS hardening deferred as follow-up
- Test coverage planned comprehensively
- No deferred non-functional work required

No Deadline Waiver needed.
