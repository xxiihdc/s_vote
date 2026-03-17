# Research: Password Protection Implementation Strategy

**Phase**: 0 (Research & Clarification)  
**Date**: 2026-03-17  
**Purpose**: Resolve technical decisions and document best practices for implementing password-protected voting

---

## Research Questions and Decisions

### 1. Password Hashing & Validation Strategy

**Question**: What's the recommended approach for secure password hashing and validation in Next.js?

**Decision**: Use **bcryptjs** library
- **Rationale**: 
  - Already available in npm ecosystem for Node.js projects
  - Industry standard for password hashing with built-in salt and work factor
  - Constant-time comparison prevents timing attacks
  - Library supports both Node.js and browser (though we only need server-side)
- **Implementation**: 
  - Server-side only: Hash and compare in Next.js API routes
  - Never expose passwordHash to client
  - Use bcryptjs.compare() for constant-time comparison
  - Authentication status communicated via httpOnly cookies or JWT
- **Alternatives Considered**:
  - Argon2: More modern, but requires native bindings; bcryptjs sufficient for online voting
  - PBKDF2: Simpler but less resistant to GPU-based attacks
  - **Selected**: Bcryptjs (proven, zero-dependency, sufficient security)

**Tasks**:
- [ ] Verify bcryptjs is already in package.json dependencies
- [ ] Review bcryptjs compare() API for constant-time implementation
- [ ] Define work factor (rounds) for bcrypt (typically 10-12)

---

### 2. Session Persistence Strategy (Browser/Cookie Management)

**Question**: How should we persist password authentication state across page refreshes?

**Decision**: Use **httpOnly secure cookies** with server-side session validation
- **Rationale**:
  - HttpOnly cookies prevent XSS attacks from accessing token
  - Secure flag prevents transmission over unencrypted HTTP
  - SameSite flag prevents CSRF attacks
  - Server can validate/refresh token on each request
  - Standard web security best practice
- **Implementation**:
  - On successful password verification: Set httpOnly cookie with signed JWT token
  - On page load: Validate cookie JWT and extract voteId + authenticated flag
  - Cookie expiration: Session duration (typically browser session or 24 hours)
  - Clear cookie: When user clears browser cookies or explicit logout
- **Alternatives Considered**:
  - localStorage/sessionStorage: Vulnerable to XSS attacks; spec explicitly forbids
  - In-memory state: Lost on page refresh; poor UX
  - Database session table: Overkill for voting app; cookies sufficient
  - **Selected**: httpOnly secure cookies (security best practice)

**Tasks**:
- [ ] Check existing Next.js cookie handling in project (lib/bootstrap.ts)
- [ ] Verify secure cookie settings in deployment environment
- [ ] Define JWT signing secret management (use Supabase JWT secret or env var)

---

### 3. Rate Limiting Strategy

**Question**: How should we implement rate limiting to prevent brute-force password attacks?

**Decision**: **In-memory counter per session/IP with reset after timeout**
- **Rationale**:
  - Spec requires: max 5 attempts per minute
  - In-memory counter: Fast, no database overhead
  - Per-session: Use voteId + hashed IP + user session identifier
  - Reset mechanism: Clear counter after 1 minute sliding window
- **Implementation Approach**:
  - Track failed attempts in Next.js API layer (not database RLS)
  - Counter key format: `${voteId}:${hashedIP}` (hash IP for privacy)
  - Increment counter on failed password attempt
  - Return 429 (Too Many Requests) after 5 failed attempts
  - Counter reset after 60 seconds of no attempts
  - Success resets counter to 0
- **Alternatives Considered**:
  - Database-backed rate limiting: Adds DB load; overkill for short-lived voting
  - Redis: Not available in project; in-memory sufficient
  - Simple incrementing counter without timeout: Could be abused across sessions
  - **Selected**: In-memory with timeout reset (fast, simple, sufficient)

**Tasks**:
- [ ] Design in-memory counter storage (Map or simple object)
- [ ] Implement sliding window reset logic
- [ ] Define what "reset after timeout" means: Does 1 successful attempt clear all failed attempts?
  - Decision: Yes, 1 successful password entry resets failed counter to 0

---

### 4. API Contract Design

**Question**: What should the password verification API contract look like?

**Decision**: Minimal response to avoid information leakage
- **Request**: `POST /api/votes/[voteId]/verify-password`
  - Payload: `{ password: string }`
  - Validation: Zod schema with password length bounds (1-255 chars)
- **Response on Success**:
  - Status: 200
  - Body: `{ authenticated: true }`
  - Side effect: Set httpOnly cookie with JWT token
- **Response on Failure**:
  - Status: 401 (Unauthorized)
  - Body: `{ authenticated: false; message: "Incorrect password. Please try again." }` (generic message)
  - Side effect: Increment rate limit counter
- **Response on Rate Limit**:
  - Status: 429 (Too Many Requests)
  - Body: `{ authenticated: false; message: "Too many attempts. Please try again later." }`
- **Response on Invalid Vote**:
  - Status: 404
  - Body: `{ error: "Vote not found" }`
- **Rationale**: 
  - Generic error message prevents password validation timing attacks
  - Same message for "wrong password" and "no vote" prevents vote existence disclosure
  - HTTP status codes communicate to client via headers (also secure)

**Tasks**:
- [ ] Add PasswordVerifyRequest Zod schema to lib/vote/validate.ts
- [ ] Add PasswordVerifyResponse contract to src/types/contracts.ts
- [ ] Implement POST /api/votes/[voteId]/verify-password/route.ts

---

### 5. Frontend State Management

**Question**: How should the frontend know when it's authenticated for a password-protected vote?

**Decision**: **Client-side state sync with cookies**
- **Approach**:
  - httpOnly cookie contains authentication token (not readable by JS)
  - On page load: Frontend makes test API call or reads a non-httpOnly mirror cookie
  - Simpler option: Set a separate non-httpOnly cookie with flag `isPasswordAuthenticated=true`
- **Trade-off**: Non-httpOnly cookie can be read by JS, but:
  - Only contains boolean flag (no sensitive data)
  - Attack vector limited: XSS can already affect frontend state
  - Benefit: Client can conditionally render without extra API call
- **Implementation**:
  - httpOnly cookie: `vote_auth_[voteId]` (contains JWT)
  - Mirror cookie: `vote_auth_state_[voteId]=true/false` (readable by JS for UI)
  - Or: Frontend makes minimal API call to check authentication on page load
- **Selected**: Separate non-httpOnly cookie with boolean flag (no security regression)

**Tasks**:
- [ ] Decide: Single httpOnly cookie or dual cookies?
  - Decision: Use httpOnly cookie only; client-side state synced via page rendering
- [ ] Check if Next.js app needs special cookie handling in App Router

---

### 6. RLS Policy Updates

**Question**: How should RLS policies enforce password protection on vote_responses table?

**Decision**: **Validate JWT token server-side in API layer** (not RLS policy)
- **Rationale**:
  - RLS policies don't have access to httpOnly cookies
  - JWT token can be verified in Supabase function or Next.js API layer
  - API layer is simpler for validation logic
  - Better error handling and rate limiting at API level
- **Implementation**:
  - Next.js API route validates JWT token before calling Supabase insert
  - If token valid: Allow vote_responses insert via authenticated service role
  - If token invalid: Return 403 without calling Supabase
  - RLS policy remains unchanged (no password enforcement needed at DB level)
- **Alternatives Considered**:
  - RLS policy with Supabase JWT: Complex; Supabase doesn't expose httpOnly cookies to policies
  - Supabase Edge Function for password check: Adds latency; API layer sufficient
  - **Selected**: API layer validation (simpler, fits existing architecture)

**Tasks**:
- [ ] Verify current vote_responses RLS policy
- [ ] Add JWT validation middleware in API routes

---

### 7. Logging & Observability

**Question**: What should we log for password validation and rate limiting?

**Decision**: **Structured logs with correlation IDs, redacted sensitive data**
- **Log Events**:
  - `password.verify.attempt`: On each password verification attempt (redact password)
  - `password.verify.success`: Successful authentication
  - `password.verify.failed`: Failed attempt (count remaining before lockout)
  - `password.rate_limit.exceeded`: Rate limit breach
- **Log Fields** (must-have):
  - `correlationId`: Passed from request header or generated
  - `voteId`: Which vote was accessed
  - `attemptNumber`: Which attempt (1-5)
  - `hashedIP`: Hashed client IP (not plaintext)
  - `resultCode`: success, wrong_password, rate_limit, invalid_vote
- **Redaction Rules**:
  - Never log plaintext password
  - Never log full IP address (hash it)
  - Never log JWT token value
  - Safe to log: boolean success/failure, attempt count, generic error message
- **Implementation**: Extend existing logging in lib/vote/logging.ts

**Tasks**:
- [ ] Add password-specific log functions to lib/vote/logging.ts
- [ ] Verify correlation ID is passed through API routes
- [ ] Test that logs don't leak sensitive data

---

## Summary of Technical Decisions

| Decision | Option Selected | Rationale |
|----------|-----------------|-----------|
| **Password Hashing** | bcryptjs | Standard, zero-dep, constant-time comparison |
| **Session Persistence** | httpOnly secure cookies | XSS/CSRF protection, standard web practice |
| **Rate Limiting** | In-memory counter per session/IP | Fast, simple, sufficient for voting app |
| **API Contract** | Generic error messages, 429 status | Prevents timing attacks & vote existence disclosure |
| **Frontend State** | Separate non-httpOnly mirror cookie | Client can conditionally render, no regression |
| **RLS Enforcement** | API layer JWT validation | Simpler than RLS policy, fits architecture |
| **Observability** | Structured logs + correlation IDs | Supports incident response, redacted secrets |

---

## Phase 0 Summary

✅ **No blocking clarifications remain**
- All technology choices documented with rationale
- Trade-offs evaluated and decided
- No external dependencies needed beyond bcryptjs (already available)
- Ready to proceed to Phase 1 (Design & Contracts)
