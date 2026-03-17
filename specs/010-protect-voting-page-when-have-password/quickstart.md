# Quickstart: Implement Password Protection

**Purpose**: Quick reference for implementing password-protected voting  
**Phase**: 1 (Design complete, see implementation tasks in tasks.md)

---

## High-Level Implementation Flow

```
1. User opens voting page (/votes/[voteId])
                    ↓
2. Server checks: vote.requiresPassword?
                    ↓
        YES         │         NO
        ├─→ Show password form ←─┤
        │               ↓         │
        └─→ POST /api/votes/[voteId]/verify-password
            │
            ├─→ [Success: Auth cookie set]
            │   └─→ Show voting form
            │       └─→ Submit vote with valid cookie
            │           └─→ Vote recorded
            │
            ├─→ [Wrong password]
            │   └─→ Show error, keep password form
            │
            └─→ [Rate limited]
                └─→ Show "too many attempts" message
```

---

## Frontend Components

### PasswordForm Component

**File**: `app/votes/[voteId]/password-form.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PasswordFormProps {
  voteId: string;
}

export function PasswordForm({ voteId }: PasswordFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/votes/${voteId}/verify-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        }
      );

      if (response.ok) {
        // Success: cookie set by server
        // Refresh page to show voting form instead of password form
        router.refresh();
      } else if (response.status === 429) {
        setError('Too many attempts. Please try again later.');
      } else {
        // 401, 404, 400, or other
        const data = await response.json();
        setError(data.message || 'Failed to verify password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card stack">
      <h2>This poll is password protected</h2>
      <p>Enter the password to access the voting options.</p>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          disabled={isLoading}
          autoFocus
        />
      </div>

      <button type="submit" disabled={isLoading} className="btn-primary">
        {isLoading ? 'Verifying...' : 'Verify Password'}
      </button>
    </form>
  );
}
```

### VotePage Update

**File**: `app/votes/[voteId]/page.tsx`

```typescript
// ... existing imports ...
import { PasswordForm } from './password-form';

export default async function VotePage({ params }: VotePageProps) {
  const { voteId } = await params;
  const vote = await getVoteById(voteId);

  if (!vote || vote.status === 'expired') {
    notFound();
  }

  // Check if vote requires password
  if (vote.requiresPassword) {
    // Check if user has auth cookie (only accessible server-side via headers)
    const hasAuthCookie = !!cookies().get(`vote_auth_${voteId}`);
    
    if (!hasAuthCookie) {
      // Show password form instead of voting form
      return (
        <main className="page-container stack">
          <header className="card stack vote-hero">
            <p className="eyebrow">Anonymous voting</p>
            <h1 className="page-title">{vote.question}</h1>
          </header>
          
          <div className="vote-page-grid">
            <PasswordForm voteId={vote.id} />
          </div>
        </main>
      );
    }
  }

  // If not password-protected, or password already verified, show voting form
  return (
    <main className="page-container stack">
      {/* ... existing voting form UI ... */}
      <VoteForm voteId={vote.id} {...} />
    </main>
  );
}
```

---

## Backend API Endpoint

### POST /api/votes/[voteId]/verify-password

**File**: `app/api/votes/[voteId]/verify-password/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { getVoteById } from '@/lib/vote/service';
import { PasswordVerifyRequestSchema } from '@/lib/vote/validate';
import { generateCorrelationId } from '@/lib/correlation';

// In-memory rate limiter (consider Redis for production)
const rateLimitMap = new Map<string, {
  failedAttempts: number;
  lastAttemptAt: number;
  resetAfter: number;
}>();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ voteId: string }> }
) {
  const correlationId = request.headers.get('x-correlation-id') ?? generateCorrelationId();
  const { voteId } = await params;

  try {
    // Validate request
    const body = await request.json();
    const parsed = PasswordVerifyRequestSchema.parse(body);

    // Check vote exists
    const vote = await getVoteById(voteId);
    if (!vote) {
      return NextResponse.json(
        { error: 'Vote not found' },
        { status: 404 }
      );
    }

    if (!vote.requiresPassword) {
      return NextResponse.json(
        { error: 'Vote does not require password' },
        { status: 400 }
      );
    }

    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const hashedIp = hashIp(clientIp); // Implement hash function
    const rateLimitKey = `${voteId}:${hashedIp}`;

    // Check rate limit
    const now = Date.now();
    const rateLimitEntry = rateLimitMap.get(rateLimitKey);

    if (rateLimitEntry && now < rateLimitEntry.resetAfter) {
      if (rateLimitEntry.failedAttempts >= 5) {
        return NextResponse.json(
          {
            authenticated: false,
            message: 'Too many attempts. Please try again later.',
          },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }
    } else {
      // Reset if outside time window
      rateLimitMap.delete(rateLimitKey);
    }

    // Compare password with bcrypt
    const passwordMatch = await bcrypt.compare(
      parsed.password,
      vote.passwordHash
    );

    if (!passwordMatch) {
      // Increment rate limit counter
      const entry = rateLimitMap.get(rateLimitKey) || {
        failedAttempts: 0,
        lastAttemptAt: now,
        resetAfter: now + 60 * 1000,
      };
      entry.failedAttempts++;
      entry.lastAttemptAt = now;
      rateLimitMap.set(rateLimitKey, entry);

      // Log attempt
      console.log({
        event: 'password.verify.failed',
        correlationId,
        voteId,
        attemptNumber: entry.failedAttempts,
      });

      return NextResponse.json(
        {
          authenticated: false,
          message: 'Incorrect password. Please try again.',
        },
        { status: 401 }
      );
    }

    // Password correct: Issue JWT token
    const token = createAuthToken(voteId);

    const response = NextResponse.json({ authenticated: true });

    // Set httpOnly secure cookie
    response.cookies.set({
      name: `vote_auth_${voteId}`,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: `/votes/${voteId}`,
      maxAge: 24 * 60 * 60, // 24 hours
    });

    // Clear rate limit counter on success
    rateLimitMap.delete(rateLimitKey);

    // Log success
    console.log({
      event: 'password.verify.success',
      correlationId,
      voteId,
    });

    return response;
  } catch (error) {
    // Handle validation or other errors
    return NextResponse.json(
      {
        error: 'validation_error',
        message: error instanceof Error ? error.message : 'Invalid request',
      },
      { status: 400 }
    );
  }
}

// Helper functions
function hashIp(ip: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

function createAuthToken(voteId: string): string {
  // Simple JWT creation (use jsonwebtoken library in production)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(
    JSON.stringify({
      voteId,
      authenticated: true,
      issuedAt: Math.floor(Date.now() / 1000),
      expiresAt: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      iss: process.env.NEXT_PUBLIC_APP_URL,
    })
  ).toString('base64');
  
  const signature = createSignature(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

function createSignature(message: string): string {
  // Use HMAC-SHA256 with app secret
  const crypto = require('crypto');
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'dev-secret')
    .update(message)
    .digest('base64');
}
```

---

## Type Definitions Update

### lib/vote/validate.ts

Add password verification schema:

```typescript
export const PasswordVerifyRequestSchema = z.object({
  password: z.string()
    .min(1, 'Password is required')
    .max(255, 'Password must be 255 characters or fewer'),
});

export type PasswordVerifyRequest = z.infer<typeof PasswordVerifyRequestSchema>;
```

### src/types/contracts.ts

Add password-related types:

```typescript
export interface PasswordVerifySuccess {
  authenticated: true;
}

export interface PasswordVerifyFailure {
  authenticated: false;
  message: string;
}

export type PasswordVerifyResponse = PasswordVerifySuccess | PasswordVerifyFailure;
```

---

## Testing Strategy

### Unit Tests

**File**: `tests/unit/password-voting.test.ts`

```typescript
describe('Password Verification', () => {
  it('should accept correct password', async () => {
    // Test bcrypt.compare with known hash/password pair
  });

  it('should reject incorrect password', async () => {
    // Test bcrypt.compare fails correctly
  });

  it('should implement rate limiting', async () => {
    // Test counter increments after 5 failed attempts
  });

  it('should clear rate limit on success', async () => {
    // Test counter resets after correct password
  });
});
```

### Integration Tests

**File**: `tests/integration/password-voting.integration.test.ts`

```typescript
describe('Password-Protected Voting Flow', () => {
  it('should show password form for protected votes', async () => {
    // Navigate to password-protected vote
    // Verify password form rendered instead of voting form
  });

  it('should show voting form after correct password', async () => {
    // Submit correct password
    // Verify page refreshes and shows voting form
  });

  it('should reject incorrect password', async () => {
    // Submit wrong password
    // Verify error message shown, password form remains
  });

  it('should enforce rate limiting', async () => {
    // Submit 5 wrong passwords
    // Verify 429 response on 6th attempt
  });

  it('should allow voting after password verification', async () => {
    // Verify password, submit vote
    // Verify vote recorded successfully
  });

  it('should persist auth across page refresh', async () => {
    // Verify password, refresh page
    // Verify voting form still visible without re-entering password
  });
});
```

---

## Deployment Checklist

- [ ] Ensure bcryptjs is in `package.json`
- [ ] Set `JWT_SECRET` environment variable (use strong random value)
- [ ] Ensure `NODE_ENV=production` in production (for secure cookie flag)
- [ ] Test rate limiting doesn't accumulate across deployment restarts
- [ ] Verify httpOnly cookies work in target browser/framework
- [ ] Validate password hashing time (~100-200ms acceptable)
- [ ] Check logs redact plaintext passwords and IPs

---

## Migration Notes

- **Feature 002 Dependency**: Assumes `requiresPassword` and `passwordHash` fields already exist in votes table
- **No Database Changes**: This feature only adds API layer + UI; no migrations needed
- **Backward Compatible**: Non-password-protected votes unaffected; voting form renders immediately as before

---

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Password verification (bcrypt) | ~100-200ms | Constant-time comparison |
| Rate limit check | <5ms | In-memory lookup |
| JWT token creation | <10ms | Simple encoding |
| Cookie setting | <5ms | HTTP header operation |
| **Total per request** | **<300ms p95** | Meets SLO |

---

## Next Steps

1. Review data-model.md for full API contract details
2. Check tasks.md for implementation task breakdown
3. Implement components/endpoints in task order
4. Write and run tests after each component
5. Verify integration across password form → voting form → vote submission
