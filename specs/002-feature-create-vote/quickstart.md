# Developer Quickstart: Create Vote Feature

**Phase**: 1 (Design and Contracts)  
**Date**: March 12, 2026  
**Purpose**: Quick reference guide for developers implementing the vote creation feature

---

## Feature Overview

Enable anonymous users to create polls without login. Users specify:
- A poll question and 2-50 answer options
- Optional settings: open/close times, password protection, multiple-selection mode
- Expiration window (1-30 days, defaults to 30)

The system returns a shareable URL that can be distributed to voters.

---

## Getting Started: 5-Minute Setup

### Step 1: Understand the Data Model

Read [data-model.md](./data-model.md) for entity definitions. Key entities:

```
Vote (main table)
  ├── id: UUID
  ├── question: string (3-1000 chars)
  ├── options: JSONB array of {id, text, order}
  ├── openTime: timestamp
  ├── closeTime: timestamp (nullable)
  ├── requiresPassword: boolean
  ├── allowMultiple: boolean
  └── ... (see data-model.md for full schema)

VoteResponse (tracks submissions)
  ├── id: UUID
  ├── voteId: FK → Vote.id
  ├── selectedOptionIds: UUID array
  ├── submittedAt: timestamp
  └── voterFingerprint: string (IP + browser hash)
```

### Step 2: Review API Contracts

Open [vote.openapi.yaml](./vote.openapi.yaml) for API specs:

**Core Endpoints:**
- `POST /api/votes` → Create a vote
- `GET /api/votes/{id}` → Retrieve vote details
- `POST /api/votes/{id}/respond` → Submit vote response
- `POST /api/votes/{id}/verify-password` → Verify password
- `GET /api/votes/{id}/results` → Get result counts

**See Also:** [vote.schema.ts](./vote.schema.ts) for TypeScript/Zod schema definitions.

### Step 3: Create Supabase Migration

Create migration file: `supabase/migrations/TIMESTAMP_create_vote_tables.sql`

**Includes:**
- `votes` table with all fields from data model
- `vote_responses` table with FK to votes
- Unique constraint: (vote_id, voter_fingerprint)
- RLS policies: Anonymous inserts allowed if vote is open + password verified
- Indexes on shareUrl, expiresAt, openTime/closeTime

### Step 4: Implement Shared Types

Create/update: `src/types/contracts.ts`

**Use the provided schema file:** [vote.schema.ts](./vote.schema.ts)
- Copy and adapt Zod schemas for Vote, VoteOption, VoteResponse
- Use same schemas on frontend (validation), backend (API routes), and database layer
- Ensures type safety across the entire application

### Step 5: Add Frontend Components

Create directory: `app/votes/`

**Structure:**
```
app/votes/
├── create/
│   ├── page.tsx         # Vote creation form
│   └── actions.ts       # Server actions for form submission
├── [voteId]/
│   ├── page.tsx         # Vote display / voting interface
│   ├── results/
│   │   └── page.tsx     # Results view (real-time updates)
│   └── actions.ts       # Server actions for vote submission
└── components/
    ├── VoteForm.tsx
    ├── SettingsPanel.tsx
    ├── PasswordPrompt.tsx
    └── ResultsChart.tsx
```

### Step 6: Implement Backend Routes

Create directory: `app/api/votes/`

**Endpoints:**
- `route.ts` → POST /api/votes (create), GET /api/votes/:id (retrieve)
- `[voteId]/respond/route.ts` → POST (submit response, increment count)
- `[voteId]/verify-password/route.ts` → POST (password verification)
- `[voteId]/results/route.ts` → GET (retrieve counts)

All routes must:
- Validate input using Zod schemas from `src/types/contracts.ts`
- Check time-gating server-side (compare with DB server time)
- Enforce RLS via Supabase client
- Return structured error responses

### Step 7: Write Tests

Create test files in: `tests/`

**Unit Tests** (`tests/unit/`):
```
✓ Vote creation input validation (Zod schemas)
✓ Password hashing and verification (bcrypt)
✓ Timestamp comparisons (time-gating logic)
```

**Integration Tests** (`tests/integration/`):
```
✓ Full vote creation flow (form → server action → DB)
✓ Vote submission during open window (allowed)
✓ Vote submission after close time (rejected)
✓ Password-protected vote flow
✓ Concurrent vote submissions (race condition handling)
```

**Contract Tests** (`tests/contract/`):
```
✓ Vote count accuracy after concurrent submissions
✓ Fingerprint-based duplicate prevention
✓ Result count consistency
```

---

## Implementation Guides

### Creating a Vote (Happy Path)

```typescript
// Frontend: app/votes/create/page.tsx
const form = useForm({
  question: "Favorite language?",
  options: ["TypeScript", "Python", "Go"],
  openTime: "2026-03-12T10:00:00Z",
  closeTime: "2026-03-12T18:00:00Z",
  allowMultiple: false,
  requiresPassword: false,
});

// Submit: app/votes/create/actions.ts (Server Action)
const createVoteAction = async (data) => {
  // Validate using CreateVoteRequestSchema from contracts
  const validated = CreateVoteRequestSchema.parse(data);
  
  // Insert into Supabase
  const vote = await supabase.from('votes').insert({
    question: validated.question,
    options: validated.options.map((text, i) => ({
      id: generateUUID(),
      text,
      order: i,
    })),
    openTime: validated.openTime,
    closeTime: validated.closeTime,
    allowMultiple: validated.allowMultiple,
    requiresPassword: false,
    shareUrl: generateShareUrl(), // Unique token
    expiresAt: addDays(now, 30),
  });
  
  return { shareUrl: vote.shareUrl };
};
```

### Submitting a Vote (Happy Path)

```typescript
// Frontend: app/votes/[voteId]/page.tsx
const handleVoteSubmit = async (selectedIds) => {
  // Server action
  const result = await submitVoteAction(voteId, selectedIds);
  // Update UI with confirmation
};

// Backend: app/api/votes/[voteId]/respond/route.ts
export async function POST(req, { params }) {
  const body = SubmitResponseRequestSchema.parse(await req.json());
  
  // Check time-gating server-side
  const vote = await db.votes.findById(body.voteId);
  if (vote.closeTime && vote.closeTime < new Date()) {
    return error(410, "Voting has ended");
  }
  
  // Check fingerprint uniqueness
  const fingerprint = generateFingerprint(req);
  const existing = await db.voteResponses.findOne({
    voteId: body.voteId,
    voterFingerprint: fingerprint,
  });
  if (existing) {
    return error(409, "Already voted");
  }
  
  // Insert response
  const response = await db.voteResponses.insert({
    voteId: body.voteId,
    selectedOptionIds: body.selectedOptionIds,
    voterFingerprint: fingerprint,
  });
  
  return success(201, { responseId: response.id });
}
```

### Viewing Results (Real-Time)

```typescript
// Frontend: app/votes/[voteId]/results/page.tsx
useEffect(() => {
  // Subscribe to result updates via Supabase Realtime
  const subscription = supabase
    .from('vote_responses')
    .on('INSERT', (payload) => {
      // Re-fetch or update local tally
      updateResultCounts();
    })
    .subscribe();
  
  return () => subscription.unsubscribe();
}, [voteId]);
```

---

## Security Checklist

Before deploying to production, verify:

- [ ] **Passwords**: Never logged, never sent in client URLs, hashed server-side via bcrypt
- [ ] **Time-Gating**: All comparisons use database server time (UTC), not client time
- [ ] **Duplicate Prevention**: Fingerprint-based deduplication enforced server-side
- [ ] **RLS Policies**: Anonymous users can only INSERT responses, not UPDATE/DELETE
- [ ] **CSRF Protection**: Next.js Server Actions include automatic CSRF tokens
- [ ] **Rate Limiting**: Implemented on password verification (5 attempts/min) and vote creation (10/min)
- [ ] **Secrets**: No API keys, passwords, or secrets in `.env.local` (use `.env.example` template)
- [ ] **Logging**: Passwords redacted from logs; correlation IDs added to all requests

---

## Performance Checklist

Before deploying, verify:

- [ ] **Vote Creation**: Form submission returns shareUrl within 300ms p95
- [ ] **Vote Submission**: Response accepted within 300ms p95
- [ ] **Results Update**: Real-time update latency < 2 seconds
- [ ] **Database**: Queries use proper indexes (see data-model.md)
- [ ] **Scaling**: Tested with 1000 concurrent votes, 100 concurrent submissions per vote
- [ ] **Load Test**: Run `npm run test:load` before release

---

## Debugging Tips

### "Vote Not Found" When It Should Exist

**Likely causes:**
1. Vote has expired (check `expiresAt` timestamp against now)
2. Vote is not yet open (check `openTime` against now)
3. Vote ID mismatch in URL

**Debug:**
```sql
SELECT id, openTime, closeTime, expiresAt, status 
FROM votes 
WHERE shareUrl = 'abc123xyz';
```

### "Can't Submit Vote" Error

**Likely causes:**
1. Voting window closed (check `closeTime`)
2. Duplicate vote detected (same fingerprint already submitted)
3. Password required but not verified (check session cookie)

**Debug:**
```sql
SELECT * FROM vote_responses 
WHERE voteId = '...' 
AND voterFingerprint = '...';
```

### Password Verification Fails

**Likely causes:**
1. Password hash mismatch (user entered wrong password)
2. Rate limit exceeded (too many attempts in 1 minute)
3. Edge Function not deployed

**Debug:**
- Check Supabase function logs: `supabase functions logs verify-vote-password`
- Verify password hash is bcrypt format (starts with `$2a$` or `$2b$`)

---

## Related Documentation

- [Specification](./spec.md) — Feature requirements and user stories
- [Data Model](./data-model.md) — Database schema and relationships
- [API Contracts](./vote.openapi.yaml) — OpenAPI specification
- [TypeScript Schemas](./contracts/vote.schema.ts) — Zod validation schemas
- [Research Findings](./research.md) — Technology decisions and rationale

---

## Next Steps

1. **Implement Phase 2 Tasks**: Run `/speckit.tasks` to generate actionable tasks
2. **Start Development**: Begin with database schema (Supabase migration)
3. **Test Driven**: Write tests before implementing business logic
4. **Review**: Constitutional gates checked before pull request merge
5. **Deploy**: Use existing Docker/CI/CD pipeline; vote feature integrates transparently
