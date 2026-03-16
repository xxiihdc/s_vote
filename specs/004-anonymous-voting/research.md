# Research: Anonymous User Voting

**Phase**: 0 (Outline & Research)
**Date**: 2026-03-16
**Feature**: [spec.md](./spec.md)

## Objective

Resolve all technical unknowns identified in the Technical Context before Phase 1 design. Each section
records the decision, rationale, and alternatives considered.

---

## R-001: UPSERT Strategy — Service-Role vs Anon + UPDATE RLS Policy

**Question**: How should the server perform an UPSERT on `vote_responses` when the anon role
has no UPDATE RLS policy?

**Decision**: Use service-role Supabase client on the server side for all `vote_responses` operations
(INSERT, UPDATE/UPSERT, SELECT).

**Rationale**:
- Service-role bypasses RLS entirely, meaning no new RLS policies are needed for UPDATE.
- The `voter_fingerprint` column must not be readable by the anon client role. If an UPDATE policy
  were added for anon, a direct Supabase REST call from a browser could read `voter_fingerprint`
  values (RLS controls row access, not column access). Service-role keeps all fingerprint operations
  server-side only.
- The existing `SUPABASE_SERVICE_ROLE_KEY` is already in the env schema (currently optional);
  it will be promoted to required.
- Existing `getVoteResultsByToken` also queries `vote_responses` using the anon client — which
  currently returns empty rows because there is no SELECT RLS policy for anon on `vote_responses`.
  Switching to service-role for this query fixes an existing silent bug.

**Supabase JS UPSERT pattern** (server-side, service-role client):
```typescript
const { error } = await serviceRoleClient
  .from('vote_responses')
  .upsert(
    {
      vote_id: voteId,
      selected_option_ids: selectedOptionIds,
      voter_fingerprint: ipHash,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: 'vote_id,voter_fingerprint' }
  )
```

**Alternatives considered**:

| Alternative | Why rejected |
|-------------|-------------|
| Add UPDATE RLS policy for anon | Would expose `voter_fingerprint` to anon clients via direct REST SELECT |
| Two endpoints: POST (insert) + PUT (update) | Requires client-side knowledge of prior state; creates race condition window |
| Trigger-based UPSERT (Postgres function) | Unnecessary complexity; same result achievable with service-role upsert |

---

## R-002: IP Extraction in Next.js App Router

**Question**: How do we reliably extract the client IP from a Next.js `NextRequest`?

**Decision**: Read `x-forwarded-for` header first; fall back to `x-real-ip`; fall back to `'unknown'`.
Never trust client-supplied IP. All extraction and hashing happens in a new server-side module
`src/lib/vote/ip.ts`.

**Rationale**:
- The existing `src/lib/vote/fingerprint.ts` already demonstrates this pattern using `ipHeader`.
- `x-forwarded-for` contains a comma-separated list of IPs; take the first one (the original client IP).
- In Vercel/Docker deployments, the real client IP is reliably in `x-forwarded-for`.
- If IP is `'unknown'`, deduplication still works but all unknown-IP votes share the same bucket — an
  acceptable edge case for VPN/unusual proxy scenarios.

**Extracted function signatures**:
```typescript
// src/lib/vote/ip.ts
export function extractClientIp(request: NextRequest): string
export function hashClientIp(ip: string): string  // SHA256 hex digest
```

**Why separate from `fingerprint.ts`**:
- `fingerprint.ts` uses IP + UserAgent + AcceptLanguage (composite fingerprint per-device).
- This feature requires IP-only deduplication per spec FR-002: one vote per IP, not per device.
  A user on the same IP with a different browser must be blocked from voting again.
- Keeping them separate prevents accidental composite fingerprint usage in vote submission paths.

**Alternatives considered**:

| Alternative | Why rejected |
|-------------|-------------|
| Reuse `buildVoterFingerprint` composite hash | Composite includes UA + language → different browsers same IP bypass dedup |
| HMAC-SHA256 with server secret | More secure, but spec clarification accepted SHA256 plain as sufficient trade-off |
| Read IP from `request.ip` (Next.js) | Deprecated / not reliably available in all deployment targets |

---

## R-003: Results Refresh Interval — ≤ 5 Seconds Compliance

**Question**: Does the existing results refresh mechanism meet the ≤ 5 second spec requirement?

**Finding**: The existing `TokenResultsClient` uses `setInterval` polling to `/api/votes/results/[token]`.
The interval is controlled by `RESULT_TOKEN_REFRESH_INTERVAL_MS` (env var, default: **15 000 ms = 15 s**).
The current default **violates** the spec requirement of ≤ 5 s.

**Decision**: Change the default value of `RESULT_TOKEN_REFRESH_INTERVAL_MS` in `src/lib/env.ts`
from `15000` to `5000`. This is a non-breaking change (operators may override via env var).

**Rationale**:
- No Supabase Realtime integration is needed — existing polling mechanism is sufficient.
- 5 s polling is lightweight for small-to-medium scale; Supabase Realtime adds significant complexity
  (subscription management, reconnect logic) for no additional benefit at this scale.
- The `refreshIntervalMs` prop is already threaded through to `TokenResultsClient` from the page;
  only the default in env.ts needs changing.

**Alternatives considered**:

| Alternative | Why rejected |
|-------------|-------------|
| Supabase Realtime subscriptions | Unnecessary complexity for the scale; spec allows ≤5s polling |
| Keep 15 s default, document operator override | Violates spec SC-003; unacceptable |
| 1 s polling | Excessive server load for minimal UX gain |

---

## R-004: `SUPABASE_SERVICE_ROLE_KEY` — Optional → Required

**Question**: Should `SUPABASE_SERVICE_ROLE_KEY` remain optional in env.ts?

**Decision**: Promote to required. Without it, vote submission and result computation via service-role
both fail at runtime.

**Rationale**:
- The current optional status was acceptable when no server-side privileged operations existed.
- This feature adds two server-side operations requiring service-role: vote UPSERT and `vote_responses`
  SELECT for results.
- Making it required at app startup provides an early, clear error rather than a silent runtime failure.
- The key is already present in `docker-compose.yml` and `.env.example` references.

**Impact**: `env.ts` schema change: `z.string().optional()` → `z.string().min(1, '...')`.

---

## R-005: Vote Response Submission — Response Shape

**Question**: What should the HTTP response for a vote submission look like for new, change, and unchanged cases?

**Decision**: Single `POST /api/votes/[voteId]/responses` endpoint. Response always HTTP 200/201:

| Case | HTTP Status | `action` field |
|------|-------------|---------------|
| No prior vote from this IP → new insert | 201 Created | `"created"` |
| Prior vote exists, selection CHANGED | 200 OK | `"updated"` |
| Prior vote exists, selection SAME | 200 OK | `"unchanged"` |
| Poll closed/expired | 422 Unprocessable | error body |
| Invalid options | 400 Bad Request | error body |

**Rationale**:
- The `action` field lets the UI display contextual confirmation ("Your vote was recorded" vs "Your vote
  was updated" vs "Your selection is already recorded").
- Distinguishing `"created"` vs `"updated"` vs `"unchanged"` requires a server-side pre-query before
  the UPSERT (to determine intent) OR inspecting `rowsAffected` after upsert.
- Simplest approach: pre-query the existing row, compare selections, then UPSERT. The pre-query also
  serves FR-005 (return the existing selection to the UI on page load).
- No 409 Conflict is used — the spec's "rejection" language describes UI behavior (pre-filled form),
  not an HTTP error.

---

## R-006: Prior Vote Lookup for FR-005 (Pre-fill UI)

**Question**: How does the server expose a user's prior vote selection when they revisit the vote page?

**Decision**: Add a server-side function `getExistingVoteResponse(voteId, ipHash)` to `service.ts`
that queries `vote_responses` using service-role. The vote detail page (`app/votes/[voteId]/page.tsx`)
calls this with the server-computed IP hash and passes the result to the form component as a prop.
The raw IP hash is never sent to the client; only `selectedOptionIds: string[]` is passed.

**Rationale**:
- The vote detail page is a Next.js Server Component — it can safely compute the IP hash and query
  the DB before rendering.
- The client form receives only `previouslySelectedOptionIds: string[] | null` (safe, no IP data).
- This is a single additional DB read on page load; acceptable performance cost.

---

## R-007: No DB Migration Required

**Question**: Does this feature require a new Supabase migration?

**Finding**: **No new migration is required.**

The `vote_responses` table already has:
- `voter_fingerprint text NOT NULL` — stores SHA256 hash ✓
- `UNIQUE(vote_id, voter_fingerprint)` constraint — enforces 1-vote-per-IP-per-poll ✓
- RLS enabled ✓
- `selected_option_ids uuid[]` — stores selections ✓
- INSERT RLS policy for anon (can remain; harmless for direct API calls) ✓

The only change that could be considered a "migration" is `RESULT_TOKEN_REFRESH_INTERVAL_MS` default,
but that is an application configuration change (env.ts), not a DB schema change.

**Note**: The `SUPABASE_SERVICE_ROLE_KEY` promotion from optional to required is an application
configuration change only.
