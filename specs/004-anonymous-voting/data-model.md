# Data Model: Anonymous User Voting

**Phase**: 1 (Design and Contracts)
**Date**: 2026-03-16
**Purpose**: Define entity changes, relationships, and validation rules for anonymous vote submission
with IP-based deduplication.

---

## Summary of Changes

This feature adds **no new database tables** and **no new DB migrations**. All required columns
and constraints already exist in the `vote_responses` table from migration
`20260312_create_vote_tables.sql`. The changes are:

1. A new server-side module `src/lib/vote/ip.ts` — IP extraction and SHA256 hashing
2. A new API route `app/api/votes/[voteId]/responses/route.ts` — vote submission endpoint
3. Promotion of `SUPABASE_SERVICE_ROLE_KEY` from optional to required
4. Updated `getVoteResultsByToken` to use service-role for `vote_responses` SELECT (bug fix)
5. Default `RESULT_TOKEN_REFRESH_INTERVAL_MS` reduced from 15 000 ms to 5 000 ms

---

## Existing Entities (relevant to this feature)

### 1. Vote (unchanged)

**Table**: `public.votes`

Already models:
- `id` (UUID PK), `question`, `options` (JSONB), `open_time`, `close_time`, `expires_at`, `status`
- `status` enum: `active | closed | expired | archived | deleted`
- Open/close state validation via existing `getVoteTimingState()` in `src/lib/vote/timing.ts`

**No schema changes required.**

---

### 2. VoteResponse (key entity for this feature)

**Table**: `public.vote_responses`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Unique response identifier |
| `vote_id` | UUID | NOT NULL, FK → `votes.id` ON DELETE CASCADE | Poll this response belongs to |
| `selected_option_ids` | UUID[] | NOT NULL, cardinality ≥ 1 | Option IDs chosen by the voter |
| `submitted_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Submission time; overwritten on UPSERT (change) |
| `voter_fingerprint` | TEXT | NOT NULL | SHA256 hex digest of the voter's IP address |

**Constraint already in place**:
```sql
CONSTRAINT vote_responses_unique_voter UNIQUE (vote_id, voter_fingerprint)
```
This constraint is the deduplication anchor. UPSERT `ON CONFLICT (vote_id, voter_fingerprint) DO UPDATE`
atomically handles both the first-vote and vote-change cases.

**No column additions required.**

#### Voter Fingerprint Derivation

The `voter_fingerprint` value stored in this column is **NOT** the composite fingerprint from
`src/lib/vote/fingerprint.ts` (which combines IP + UserAgent + AcceptLanguage). It is an
**IP-only SHA256 hash** computed by the new `src/lib/vote/ip.ts` module:

```
voter_fingerprint = SHA256(first_ip_from_x_forwarded_for_header)
```

- Input: raw IP string extracted from `x-forwarded-for` (first hop) or `x-real-ip` header
- Algorithm: Node.js `crypto.createHash('sha256').update(ip).digest('hex')`  
- Output: 64-character lowercase hex string
- The raw IP is discarded immediately after hashing; it is never stored or logged

**Known trade-off** (per spec clarification): SHA256 of IPv4 is brute-forceable (~4B addresses).
Accepted at current scale. Upgrade path: HMAC-SHA256 with `SUPABASE_SERVICE_ROLE_KEY` as secret.

#### RLS Policy Coverage

| Operation | Role | Policy | Notes |
|-----------|------|--------|-------|
| INSERT | anon | `vote_responses_insert_open_vote` (existing) | Checks vote is active + open |
| INSERT/UPSERT | service-role | Bypasses RLS | Used by vote submission API route |
| SELECT | service-role | Bypasses RLS | Used by result computation + prior-vote lookup |
| SELECT | anon | **None** (intentional) | Prevents anon client from reading `voter_fingerprint` |
| UPDATE | anon | **None** | All updates go through service-role UPSERT server-side |

---

### 3. VoteOption (unchanged)

Stored as JSONB array in `votes.options`. No changes required.

---

### 4. VoteResult (derived, unchanged)

Aggregated view derived in application code (`getVoteResultsByToken`) by counting
`selected_option_ids` from `vote_responses`. No view or materialized table exists.
The SELECT query switches to service-role client in this feature (bug fix — previously used
anon client which returned empty due to no SELECT RLS policy for anon).

---

## New Application-Layer Entities

### VoteSubmission (request payload)

Represents the client-facing request body for submitting a vote. Validated by `VoteSubmissionSchema`
(Zod) at the API boundary.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `selectedOptionIds` | string[] | min 1 item, each a valid UUID | Option(s) selected by the voter |

No IP field — IP is extracted server-side from request headers. No vote ID field — derived from route parameter.

---

### VoteSubmissionResponse (response payload)

Returned by `POST /api/votes/[voteId]/responses`.

| Field | Type | Description |
|-------|------|-------------|
| `action` | `"created" \| "updated" \| "unchanged"` | What the server did with the submission |
| `voteId` | string (UUID) | The poll ID |
| `selectedOptionIds` | string[] | The option IDs now recorded |

No IP-derived values are present in the response.

---

## Validation Rules

### At API Boundary (Zod schema)

- `selectedOptionIds`: must be an array with at least 1 element; each element must be a valid UUID
- `voteId` (route param): must be a valid UUID

### At Service Layer (business logic)

1. Vote must exist and be in `active` status
2. `open_time <= now()` (poll has started)
3. `close_time IS NULL OR close_time > now()` (poll has not closed)
4. `expires_at > now()` (poll has not expired)
5. All `selectedOptionIds` must belong to the target vote's `options` array (cross-reference by option ID)
6. If vote's `allow_multiple = false`: `selectedOptionIds.length` must equal 1

### At Database Layer (existing constraints)

- `cardinality(selected_option_ids) >= 1` — at least one option selected
- `UNIQUE(vote_id, voter_fingerprint)` — one vote record per IP per poll (UPSERT replaces on conflict)
- FK `vote_id → votes.id ON DELETE CASCADE` — responses are garbage-collected when vote is deleted

---

## State Transitions

### Vote Submission State Machine

```
IP has no prior vote for this poll
          │
          ▼
    POST /responses
          │
    ┌─────┴──────────────────┐
    │                        │
    │  Poll active+open?     │
    │  YES                   │  NO → 422 Unprocessable
    │                        │       "voting has ended"
    ▼                        │
  Prior record               │
  for this (vote+IP)?        │
    │          │             │
   YES        NO             │
    │          │             │
    ▼          ▼             │
  Same     Insert new        │
  options? record → 201      │
    │          │             │
   YES        NO             │
    │          │             │
    ▼          ▼
"unchanged" Update record
  200         → 200 "updated"
```

---

## Relationships (unchanged from prior features)

```
Vote 1:N VoteResponse
  │
  └── voter_fingerprint = SHA256(client_ip)   [per this feature]
  └── UNIQUE(vote_id, voter_fingerprint)       [dedup constraint]

VoteResult ← derived from Vote + VoteResponse aggregation
```
