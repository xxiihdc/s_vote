# Data Model: Protect Voting Page When Password-Protected

**Phase**: 1 (Design and Contracts)  
**Date**: 2026-03-17  
**Purpose**: Define frontend and API contracts for password-protected voting

---

## Entity Definitions

### 1. Vote (Extended from Feature 002)

**Purpose**: Represents a single poll/survey with optional password protection.

**Existing Fields** (from feature 002):

| Field | Type | Used by Password Feature |
|-------|------|--------------------------|
| `id` | UUID | ✅ Primary key for authentication |
| `requiresPassword` | BOOLEAN | ✅ Determines if password form shown |
| `passwordHash` | TEXT | ✅ Used for bcrypt comparison (never exposed to client) |
| (other fields) | ... | Not affected by this feature |

**Database Schema**: No changes needed. Fields already exist from feature 002.

---

### 2. PasswordAuthToken (Frontend State)

**Purpose**: Represents the authentication state for a password-protected vote on the current client session.

**Storage**: httpOnly secure cookie + optional mirror cookie (boolean flag)

**Fields**:

| Field | Type | Description | Persistence |
|-------|------|-------------|-------------|
| `voteId` | UUID | Which vote this token is for | JWT payload |
| `authenticated` | boolean | Whether password has been verified | JWT payload + mirror cookie |
| `issuedAt` | number | Unix timestamp when token created | JWT payload |
| `expiresAt` | number | Unix timestamp when token expires | JWT payload |
| `iss` | string | Issuer (should be app domain) | JWT payload |

**JWT Token Structure** (httpOnly cookie):
```
Header:   { alg: "HS256", typ: "JWT" }
Payload:  {
  voteId: "550e8400-e29b-41d4-a716-446655440000",
  authenticated: true,
  issuedAt: 1710710400,
  expiresAt: 1710796800,
  iss: "s-vote.example.com"
}
Signature: HMAC-SHA256(secret)
```

**Cookie Configuration**:
- Name: `vote_auth_{voteId}` (httpOnly, Secure, SameSite=Strict)
- Expiration: 24 hours (or session end, whichever is sooner)
- Path: `/votes/{voteId}` (scoped to specific vote)
- Domain: Auto-set to current domain

**Mirror Cookie** (optional, non-httpOnly for client-side reads):
- Name: `vote_auth_state_{voteId}` (not httpOnly, Secure, SameSite=Strict)
- Value: `true` or `false` (boolean flag only)
- Same expiration as JWT cookie

**Validation Rules**:
- JWT signature must match app secret
- Token must not be expired (`expiresAt > now()`)
- VoteId in token must match requested vote
- Issuer must match expected domain

---

### 3. PasswordVerifyRequest (API Input)

**Purpose**: Input payload for password verification API endpoint

**Structure**:
```typescript
{
  password: string  // User's password attempt (1-255 chars)
}
```

**Validation Rules** (via Zod schema):
- `password` is required string
- `password` must be between 1 and 255 characters
- No special encoding required (UTF-8 supported)

**Zod Schema**:
```typescript
const PasswordVerifyRequestSchema = z.object({
  password: z.string()
    .min(1, 'Password is required')
    .max(255, 'Password too long'),
});
```

---

### 4. PasswordVerifyResponse (API Output)

**Purpose**: Response from password verification endpoint

**Structure on Success (Status 200)**:
```typescript
{
  authenticated: true
}
```

**Structure on Failure (Status 401)**:
```typescript
{
  authenticated: false,
  message: "Incorrect password. Please try again."
}
```

**Structure on Rate Limit (Status 429)**:
```typescript
{
  authenticated: false,
  message: "Too many attempts. Please try again later."
}
```

**Structure on Invalid Vote (Status 404)**:
```typescript
{
  error: "Vote not found"
}
```

**Side Effects**:
- Success: Set httpOnly cookie with JWT token
- Failure: Increment rate limit counter in memory
- Rate Limit: Return 429 without incrementing further
- Invalid: No cookies set

---

### 5. Vote API Response (Extended)

**Purpose**: Existing VoteDetail response, with password-related fields

**Structure** (no new fields; existing from feature 002):
```typescript
{
  id: UUID,
  question: string,
  options: VoteOption[],
  allowMultiple: boolean,
  isOpen: boolean,
  requiresPassword: boolean,    // ← Already in VoteDetail
  // passwordHash is NEVER returned (server-side only)
  createdAt: timestamp,
  expiresAt: timestamp,
  ...otherFields
}
```

**Note**: `passwordHash` field intentionally NOT included in API response. Server validates password and issues token; client never sees hash.

---

### 6. Rate Limit State (Server-side, In-Memory)

**Purpose**: Track failed password attempts per vote/session to prevent brute-force attacks

**Storage**: In-memory Map in Next.js API handler

**Key Structure**: `${voteId}:${hashedIP}`

**Value Structure**:
```typescript
{
  failedAttempts: number,      // Count of failed attempts (0-5)
  lastAttemptAt: number,       // Unix timestamp of last attempt
  resetAfter: number           // Unix timestamp when counter resets (lastAttemptAt + 60s)
}
```

**Lifecycle**:
- Increment on failed password verification
- Reset to 0 on successful password verification
- Auto-clean when `lastAttemptAt` > 60 seconds ago (sliding window)
- Return 429 if `failedAttempts >= 5` and `now() < resetAfter`

---

## Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                        Vote (DB)                            │
│  ┌─ requiresPassword: boolean                               │
│  ├─ passwordHash: text (bcrypt)                             │
│  └─ ...other fields...                                      │
└────────┬────────────────────────────────────────────────────┘
         │
         │ triggers password check (if requiresPassword = true)
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│         POST /api/votes/[voteId]/verify-password            │
│  Input:  { password: string }                               │
│  Output: { authenticated: boolean, message?: string }       │
│  Side:   Set PasswordAuthToken cookie on success            │
└────────┬────────────────────────────────────────────────────┘
         │
         │ issues JWT if password matches
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│         PasswordAuthToken (httpOnly Cookie)                 │
│  ┌─ voteId: UUID                                            │
│  ├─ authenticated: boolean                                  │
│  ├─ expiresAt: number (JWT claim)                           │
│  └─ ...JWT metadata...                                      │
└────────┬────────────────────────────────────────────────────┘
         │
         │ enables access to voting form
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│         VoteForm (Frontend Component)                       │
│  Submits vote via POST /api/votes/[voteId]/responses        │
│  API validates JWT token before accepting response          │
└─────────────────────────────────────────────────────────────┘
```

---

## Validation & Constraints

### Password Validation (Bcrypt)

```
plaintext password (from user) 
  ↓
[bcrypt.compare(plaintext, passwordHash)]
  ↓
  ├─ Match: Token issued, access granted
  └─ No match: Rate limit increment, error response
```

- Bcrypt work factor: 10-12 rounds (default for bcryptjs)
- Comparison time: ~100-200ms (constant-time)
- No timing attack vulnerability

### Rate Limiting

- Max 5 attempts per minute per vote/IP combination
- Counter increments only on failed attempt (wrong password)
- Counter resets completely on successful attempt
- Counter auto-clears if no attempts for 60 seconds (sliding window)
- Returns 429 when limit exceeded

### Cookie Security

- httpOnly: Prevents XSS access to token
- Secure: Transmit only over HTTPS
- SameSite=Strict: Prevents CSRF attacks
- Path=/votes/{voteId}: Scoped to vote URL

---

## API Endpoints (Contracts)

### 1. POST /api/votes/[voteId]/verify-password

**Request**:
```
POST /api/votes/123e4567-e89b-12d3-a456-426614174000/verify-password
Content-Type: application/json

{ "password": "myVotePassword" }
```

**Response on Success (200)**:
```json
{ "authenticated": true }
```
+ Set-Cookie: `vote_auth_{voteId}=eyJ...` (httpOnly)

**Response on Wrong Password (401)**:
```json
{ 
  "authenticated": false,
  "message": "Incorrect password. Please try again."
}
```

**Response on Rate Limit (429)**:
```json
{
  "authenticated": false,
  "message": "Too many attempts. Please try again later."
}
```

**Response on Invalid Vote (404)**:
```json
{ "error": "Vote not found" }
```

---

## Phase 1 Design Summary

✅ **All data models & contracts defined**

- Extended Vote entity leveraging existing schema from feature 002
- New PasswordAuthToken frontend state with JWT structure
- API contracts with error handling and rate limiting
- Security constraints enforced (httpOnly cookies, constant-time comparison, rate limiting)
- Ready for Task generation in Phase 2
