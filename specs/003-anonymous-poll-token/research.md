# Research: Anonymous Vote With Token Result URL

## Decisions

### Decision: Use unguessable URL token for result access
- **Rationale**: Matches product requirement: anyone with token URL can view results without login while avoiding direct exposure of internal identifiers.
- **Alternatives considered**:
  - Numeric vote IDs in URL (rejected: enumerable/guessable)
  - Signed short-lived URL only (rejected: harms simple shareability)

### Decision: Store token hash, not raw token
- **Rationale**: Limits blast radius if database rows are leaked; raw token only exists client-side at creation and in URL.
- **Alternatives considered**:
  - Store raw token in DB (rejected: weaker security)
  - Encrypt token reversible at runtime (rejected: extra key management complexity)

### Decision: Read-only result scope on token path
- **Rationale**: Keeps token URL as view-only, reducing privilege and abuse risk.
- **Alternatives considered**:
  - Token also allows admin/update operations (rejected: excessive privilege)

### Decision: Real-time-ish updates with bounded refresh interval
- **Rationale**: Requirement expects timely results; polling/Supabase Realtime hybrid is resilient.
- **Alternatives considered**:
  - Manual refresh only (rejected: poor UX)
  - Realtime-only dependency (rejected: less resilient in transient outages)

### Decision: Token lifecycle policy with expiry check server-side
- **Rationale**: Spec requires explicit invalid/expired behavior.
- **Alternatives considered**:
  - No expiry at all (rejected: operational/security risk)
  - Client-side expiry checks (rejected: bypassable)

## Best Practices

### Validation and Contracts
- Validate create payload and token lookup payload at API boundary with shared Zod schemas.
- Keep response contracts minimal for token read path (no creator/private metadata).

### Security
- Enforce RLS/role boundaries so token path cannot write.
- Apply rate limiting for token resolution endpoint to reduce abuse.
- Redact token and sensitive request details in logs.

### Observability
- Emit correlation ID for create and token-result read paths.
- Track success/failure counters and latency for create and token-resolution endpoints.

## Integration Patterns

### Vote creation path
1. Anonymous client submits question + options.
2. Server validates payload.
3. Server generates random token and stores hash + metadata.
4. Server returns canonical URL containing raw token.

### Result view path
1. Client opens URL with token.
2. Server hashes token and resolves vote by token hash + active status/expiry.
3. Server returns read-only aggregate results.
4. Client auto-refreshes by polling fallback or realtime subscription.

## Outcome
All previously open technical choices for this feature are resolved and no `NEEDS CLARIFICATION` markers remain.