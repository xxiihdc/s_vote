# Password Verification API Contract

**Purpose**: Define the shape and validation of password verification requests and responses  
**Enforced by**: Zod schema in `lib/vote/validate.ts` + TypeScript types in `src/types/contracts.ts`  
**API Endpoint**: `POST /api/votes/[voteId]/verify-password`

---

## Request Contract

### Zod Schema

```typescript
// lib/vote/validate.ts
import { z } from 'zod';

export const PasswordVerifyRequestSchema = z.object({
  password: z.string()
    .min(1, 'Password is required')
    .max(255, 'Password must be 255 characters or fewer'),
});

export type PasswordVerifyRequest = z.infer<typeof PasswordVerifyRequestSchema>;
```

### TypeScript Type

```typescript
// src/types/contracts.ts
export interface PasswordVerifyRequest {
  password: string;
}
```

### Validation Rules

- `password` is required (non-empty string)
- `password` must be 1-255 characters
- Accepts UTF-8 encoded text (all character sets supported)
- No special encoding required (raw string from user input)

### Example Request

```json
{ "password": "myVotePassword" }
```

---

## Response Contracts

### Success Response (Status 200)

```typescript
// src/types/contracts.ts
export interface PasswordVerifySuccess {
  authenticated: true;
}
```

**HTTP Response**:
```
Status: 200 OK
Content-Type: application/json

{ "authenticated": true }
```

**Side Effect**:
- Set httpOnly secure cookie: `vote_auth_{voteId}=<JWT_TOKEN>`

---

### Incorrect Password Response (Status 401)

```typescript
// src/types/contracts.ts
export interface PasswordVerifyFailure {
  authenticated: false;
  message: string;
}
```

**HTTP Response**:
```
Status: 401 Unauthorized
Content-Type: application/json

{
  "authenticated": false,
  "message": "Incorrect password. Please try again."
}
```

**Message**:
- Generic message (same for any authentication failure)
- Does not reveal if password attempted or vote exists
- Prevents timing attacks and vote existence enumeration

**Side Effect**:
- Increment rate limit counter in memory
- Do NOT set authentication cookie

---

### Rate Limit Exceeded Response (Status 429)

```typescript
// src/types/contracts.ts
export interface PasswordVerifyRateLimit {
  authenticated: false;
  message: string;
}
```

**HTTP Response**:
```
Status: 429 Too Many Requests
Content-Type: application/json
Retry-After: 60

{
  "authenticated": false,
  "message": "Too many attempts. Please try again later."
}
```

**Conditions**:
- Returned after 5 failed password attempts within 60-second window
- Retry-After header set to remaining time until rate limit reset

**Side Effect**:
- Do NOT increment counter further
- Do NOT set authentication cookie

---

### Invalid Vote Response (Status 404)

```typescript
// src/types/contracts.ts
export interface PasswordVerifyNotFound {
  error: string;
  message?: string;
}
```

**HTTP Response**:
```
Status: 404 Not Found
Content-Type: application/json

{ "error": "Vote not found" }
```

**Conditions**:
- Returned if vote does not exist or has expired
- Not treated as rate limit attempt (gate kept separate)

**Side Effect**:
- Do NOT set authentication cookie
- Do NOT increment rate limit counter

---

### Validation Error Response (Status 400)

```typescript
// src/types/contracts.ts
export interface ValidationError {
  error: string;
  message?: string;
  details?: Record<string, string[]>;
}
```

**HTTP Response**:
```
Status: 400 Bad Request
Content-Type: application/json

{
  "error": "validation_error",
  "message": "Password validation failed",
  "details": {
    "password": ["Password is required"]
  }
}
```

**Conditions**:
- Returned if Zod schema validation fails (missing or invalid password field)
- Not treated as rate limit attempt

---

## Type Guards (TypeScript)

```typescript
// Usage in frontend
const response = await fetch(`/api/votes/${voteId}/verify-password`, {
  method: 'POST',
  body: JSON.stringify({ password }),
});

const data = await response.json();

if (response.ok && data.authenticated) {
  // Type: PasswordVerifySuccess
  // Authentication succeeded, cookie set
  router.refresh(); // Refresh page to render vote form
} else if (response.status === 429) {
  // Type: PasswordVerifyRateLimit
  // Too many attempts
  setError('Too many attempts. Please try again later.');
} else if (response.status === 401) {
  // Type: PasswordVerifyFailure
  // Wrong password
  setError('Incorrect password. Please try again.');
} else if (response.status === 404) {
  // Type: PasswordVerifyNotFound
  // Vote doesn't exist
  router.push('/not-found');
}
```

---

## Implementation Checklist

- [ ] Add `PasswordVerifyRequestSchema` to `lib/vote/validate.ts`
- [ ] Add `PasswordVerifyRequest`, `PasswordVerifySuccess`, `PasswordVerifyFailure`, `PasswordVerifyRateLimit` types to `src/types/contracts.ts`
- [ ] Create `POST /api/votes/[voteId]/verify-password/route.ts` endpoint
- [ ] Implement bcrypt comparison logic in endpoint
- [ ] Implement in-memory rate limiting
- [ ] Set httpOnly cookies on success
- [ ] Document cookie configuration (Secure, SameSite, HttpOnly)
- [ ] Add integration tests for all response scenarios

---

## Breaking Changes

**None**: This is a new endpoint. No existing contracts modified.
