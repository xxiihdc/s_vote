# Research Findings: Create Vote Without Login

**Phase**: 0 (Planning and Research)  
**Date**: March 12, 2026  
**Purpose**: Resolve technical unknowns and validate design approach for anonymous vote creation feature

---

## Technology Stack Validation

### TypeScript/Next.js with Server Actions

**Decision**: Use Next.js Server Actions for vote creation form submission, API Routes for external integrations

**Rationale**: 
- Server Actions provide type-safe client-server communication without manual API wiring
- Built-in CSRF protection aligns with SDD principles
- Form field validation can happen server-side without exposing business logic to client
- Maintains existing Next.js 15 pattern already established in project

**Alternatives Considered**:
- Pure API Routes: More explicit, but adds redundant network layer for internal form submission
- tRPC: Overkill for single feature; adds complexity without proportional benefit
- GraphQL: Unnecessary query complexity for simple create/read/respond operations

**References**: Next.js Docs - Server Actions, existing project patterns in `app/` directory

---

### Anonymous Authentication via IP/Browser Fingerprint

**Decision**: Use combination of IP address + browser fingerprint to prevent duplicate voting from same user (per-response tracking), not voter identification

**Rationale**:
- IP-based tracking prevents most duplicate submissions from same network
- Browser fingerprint (user-agent + screen resolution + timezone) catches same-device attempts across network resets
- No personal data collected; purely behavioral tracking
- Voter anonymity preserved; results never link back to individual identity
- Supabase server-side processing via Edge Function ensures fingerprinting logic isn't bypassed from client

**Alternatives Considered**:
- UUID per browser: Requires localStorage (fragile, can be cleared); doesn't prevent network sharing
- Email verification: Violates anonymous-first principle; adds friction to MVP
- IP only: Fragile in NAT/VPN environments; catches unrelated users on same network
- Biometric/device ID: Overkill complexity, privacy concerns, not supported in all browsers

**References**: 
- OWASP Authentication Cheat Sheet (rate limiting for password attempts)
- Supabase RLS patterns for anonymous access
- Edge Function capabilities for server-side validation

---

### Password Protection Implementation

**Decision**: Store password hash (bcrypt) server-side. Verification via Edge Function. Session token (JWT) issued after successful verification, stored in HTTP-only cookie for 24 hour session.

**Rationale**:
- Passwords never transmitted/stored on client (no XSS attack surface)
- Edge Function isolates password verification from main application code
- JWT session token allows users to re-access password-protected votes without re-entering password
- HTTP-only cookies prevent JavaScript access; automatic cleanup after 24 hours

**Alternatives Considered**:
- Query parameter approach: Insecure; passwords in URL history/logs
- localStorage token: Vulnerable to XSS; user must re-enter password on browser restart
- No session persistence: Poor UX; users re-enter password every vote access
- Server-side session store: Would require additional persistence layer; cookies simpler

**References**: 
- OWASP Session Management Guidelines
- Supabase Edge Functions documentation
- Secure cookie best practices

---

### Time-Gating Implementation

**Decision**: All timestamp comparisons happen server-side using database server time (UTC). Client displays formatted times in user timezone for UX, but validation uses server time only.

**Rationale**:
- Prevents clock manipulation attacks (users setting device time forward to vote after close)
- Database transactions ensure atomic vote+timestamp recording
- Server time is source of truth; no client-side validation logic has authority

**Alternatives Considered**:
- Client-side validation only: User can manipulate device clock to bypass time gates
- Mixed validation: Complex, creates edge cases; client and server must agree
- Timestamps at submission time: Loses vote creator's intent (close time set on creation)

**References**: 
- Supabase Postgres NOW() function (server time)
- PostgreSQL transaction isolation levels
- Election/voting security best practices

---

### Real-time Results Updates

**Decision**: Implement Supabase Realtime subscriptions for vote result counts. Results table triggers increment vote count atomically. Frontend subscribes to `vote_responses` insert events and recomputes local totals.

**Rationale**:
- Supabase Realtime is already integrated in project (part of Supabase ecosystem)
- Triggers ensure vote count is always consistent with response count
- Subscription model reduces polling overhead vs. regular fetch intervals
- Vote creator can see results update live without manual refresh

**Alternatives Considered**:
- 2-second polling interval: Less responsive UX; higher bandwidth
- Server-sent Events (SSE): Adds complexity for single-page app; Realtime simpler
- WebSocket custom layer: Duplicates Supabase functionality; not needed
- Static count with manual refresh: Poor UX; requires button click to update

**References**: 
- Supabase Realtime documentation
- Database trigger patterns in PostgreSQL
- Subscription-based state management in React

---

### Vote Expiration and Cleanup

**Decision**: Store `expiresAt` timestamp on votes table. Vote visibility governed by client-side check; cleanup job (via pg_cron or scheduled Edge Function) runs daily to soft-delete expired votes.

**Rationale**:
- Client-side expiration check provides immediate UX feedback
- Soft delete preserves historical data (vote data retained indefinitely per spec)
- Daily cleanup job is low-cost; doesn't require immediate action
- Vote creator can manually extend a vote by creating a new vote with same content

**Alternatives Considered**:
- Hard delete on expiration: Loses historical data; violates data retention requirement
- No cleanup: Vote table grows unbounded; potential performance issue
- RLS policy based on expiration: Works but requires TTL extension complexity

**References**: 
- PostgreSQL pg_cron extension for scheduled jobs
- Supabase Database Functions documentation

---

## Data Model Validation

### Vote Entity Schema

**Decision**: 
```typescript
type Vote = {
  id: string;                    // UUID
  question: string;              // 3-1000 chars
  options: VoteOption[];         // 2-50 options
  openTime: Date;                // UTC
  closeTime: Date;               // UTC, optional (null = always open)
  requiresPassword: boolean;
  passwordHash?: string;         // bcrypt, null if no password
  allowMultiple: boolean;        // true = checkboxes, false = radio
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;              // 30 days from creation (configurable)
  shareUrl: string;             // unique URL token
  creatorUserId?: string;       // null for anonymous, UUID for authenticated users
}

type VoteOption = {
  id: string;                   // UUID
  voteId: string;               // FK to votes
  text: string;                 // 1-500 chars
  order: number;                // display order
}

type VoteResponse = {
  id: string;                   // UUID
  voteId: string;               // FK to votes
  selectedOptionIds: string[];  // Array of option IDs
  submittedAt: Date;
  voterFingerprint: string;     // Hash of IP + browser fingerprint
}
```

**Rationale**: 
- Normalized schema (Vote, VoteOption separate) allows efficient queries
- Fingerprint-based duplicate prevention without storing personally identifiable info
- Optional `creatorUserId` allows future authenticated vote ownership without schema change
- `shareUrl` token enables short, shareable URLs without exposing internal IDs

**Alternatives Considered**:
- Denormalized options array: Simpler queries but inflexible for large option counts
- Hash vote question instead of storing full text: Reduces storage but loses UX context

---

## API Contract Validation

### Vote Creation Endpoint

**Decision**: 
```
POST /api/votes
Content-Type: application/json

Request Body:
{
  question: string,              // 3-1000 chars
  options: string[],             // 2-50 strings, each 1-500 chars
  openTime?: ISO8601 string,     // Optional; defaults to now
  closeTime?: ISO8601 string,    // Optional; null = always open
  requiresPassword?: boolean,    // Optional; defaults to false
  password?: string,             // Required if requiresPassword true
  allowMultiple?: boolean,       // Optional; defaults to false
  expirationDays?: number,       // Optional; defaults to 30, max 30
}

Response: 201 Created
{
  id: string,
  question: string,
  options: {id, text, order}[],
  shareUrl: string,             // Path component for public vote page
  createdAt: string,
  openTime: string,
  closeTime: string | null
}

Error: 400 Bad Request
{
  error: "validation_error",
  details: {
    question: ["Too short"],
    options: ["At least 2 options required"],
    password: ["Required when requiresPassword enabled"]
  }
}
```

**Rationale**:
- Optional fields allow clients to specify only needed settings
- Server defaults align with spec (immediate open, no close time, no password)
- Zod validation on backend ensures type safety
- Response includes only non-sensitive fields

---

## Security Validation

### RLS Policy Design

**Decision**: 
- Anonymous users can SELECT votes where `closedTime` is null or in future
- Anonymous users can INSERT responses for any open vote or password-verified vote
- Users cannot UPDATE/DELETE votes or responses (immutable after creation)
- Vote creators can only be identified if they authenticated (userId != null)

**Rationale**:
- Immutability prevents vote tampering
- RLS at database level ensures authorization even if server code compromised
- Anonymous voting maintains privacy; no user identification possible

**Alternatives Considered**:
- Application-layer authorization only: Risky; database-level authorization backup needed
- Vote creator can edit vote after creation: Violates integrity; prevents auditing

---

## Testing Strategy Validation

### Critical Test Paths

**Decision**:
1. **Unit**: Vote creation validation (Zod schemas for all inputs)
2. **Unit**: Password hashing and verification (bcrypt)
3. **Integration**: Full vote creation flow (form → server action → database)
4. **Integration**: Time-gating (vote accessible during open window, blocked after close)
5. **Integration**: Concurrent response submissions (race condition prevention)
6. **Integration**: Password-protected vote flow (verification → session token → voting)
7. **Contract**: Vote count accuracy after concurrent submissions
8. **Contract**: Fingerprint deduplication prevents duplicate votes from same user

**Rationale**: 
- Covers all P1 requirements and edge cases
- Tests validate correctness-critical behavior (timing, concurrency, deduplication)

---

## Implementation Approach Summary

| Concern | Approach | Risk | Mitigation |
|---------|----------|------|----------|
| **Duplicate Voting** | IP + fingerprint tracking, RLS enforced uniqueness | Users on same network counted as one | Document in UI; accept trade-off for MVP |
| **Password Security** | bcrypt hashing, Edge Function verification | Brute force attacks | Implement rate limiting (5 attempts per min) |
| **Time Gating** | Server UTC time, database-level validation | Clock skew issues | Use database NOW() function exclusively |
| **Concurrent Submissions** | PostgreSQL transactions, unique constraints | Race conditions | Connection pooling, test coverage for concurrency |
| **Vote Expiration** | Daily cleanup job, soft delete | Stale data in cache | Implement cache invalidation on cleanup |

---

## Recommendations for Phase 1

1. **Data Model**: Proceed with normalized Vote/VoteOption schema. Start with basic integer vote_count column for performance; add incremental counter if needed.
2. **API**: Implement Server Actions for form submission; use API routes only for external integrations.
3. **Security**: Edge Function for password verification only; core logic stays in Next.js for testability.
4. **Testing**: Implement full integration test suite before feature branch merge; contract tests for concurrency guarantees.
5. **Documentation**: Create runbook for vote cleanup job and password rate-limiting monitoring.
