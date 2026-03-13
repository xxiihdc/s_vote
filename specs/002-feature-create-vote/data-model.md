# Data Model: Create Vote Without Login

**Phase**: 1 (Design and Contracts)  
**Date**: March 12, 2026  
**Purpose**: Define database entities, relationships, and validation rules for anonymous vote creation and response tracking

---

## Entity Definitions

### 1. Vote

**Purpose**: Represents a single poll/survey with metadata, settings, and creator information.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key, auto-generated | Unique vote identifier |
| `question` | TEXT | NOT NULL, 3-1000 chars | Poll question displayed to voters |
| `options` | JSONB | NOT NULL, 2-50 items | Array of {id, text, order} objects; see VoteOption |
| `openTime` | TIMESTAMP | NOT NULL, UTC | When voting becomes available; defaults to NOW() |
| `closeTime` | TIMESTAMP | Nullable, UTC | When voting closes; null = always open |
| `requiresPassword` | BOOLEAN | NOT NULL, DEFAULT false | If true, passwordHash must be set |
| `passwordHash` | TEXT | Nullable | bcrypt hash of vote password; null if not password-protected |
| `allowMultiple` | BOOLEAN | NOT NULL, DEFAULT false | If true, voter can select multiple options |
| `createdAt` | TIMESTAMP | NOT NULL, UTC, auto-set | Vote creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL, UTC, auto-set | Last modification timestamp (initially = createdAt) |
| `expiresAt` | TIMESTAMP | NOT NULL, UTC | Auto-expires from public access after this date; default 30 days from creation |
| `shareUrl` | TEXT | NOT NULL, UNIQUE | Short token for public vote URL (e.g., `http://s-vote.com/votes/abc123xyz`) |
| `creatorUserId` | UUID | Nullable, FK to auth.users | NULL for anonymous creation; UUID if authenticated creator |
| `status` | ENUM | NOT NULL, DEFAULT 'active' | 'active', 'closed' (manually by creator), 'expired' (soft delete) |

**Relationships**:
- One Vote : Many VoteOption (1:N) - options stored in JSONB array
- One Vote : Many VoteResponse (1:N) - responses in separate table

**Indexes**:
```sql
CREATE INDEX idx_votes_share_url ON votes(shareUrl);
CREATE INDEX idx_votes_expires_at ON votes(expiresAt);
CREATE INDEX idx_votes_creator_user_id ON votes(creatorUserId);
CREATE INDEX idx_votes_open_close_time ON votes(openTime, closeTime);
```

**Validation Rules**:
- `question`: 3 ≤ length ≤ 1000
- `options`: 2 ≤ count ≤ 50
- Each option text: 1 ≤ length ≤ 500
- `openTime` ≤ `closeTime` OR `closeTime` IS NULL
- `closeTime` ≤ `expiresAt` (conceptually; checked in RLS policy)
- If `requiresPassword = true`, then `passwordHash` must not be null
- `shareUrl`: Must be unique and URL-safe (alphanumeric + dash/underscore)

---

### 2. VoteOption

**Purpose**: Represents a single answer choice within a vote.

**Storage Note**: VoteOption is stored as JSONB array within Vote entity (denormalized for query simplicity and performance). Not a separate table.

**Structure**:
```json
{
  "id": "uuid",           // Unique option ID (used in VoteResponse selections)
  "text": "string",       // Option text (1-500 chars)
  "order": "integer"      // Display order in UI (0-based)
}
```

**Validation Rules**:
- `id`: Must be unique within the vote
- `text`: Non-empty string, 1-500 characters
- `order`: Sequential 0-based integers (0, 1, 2, ..., N-1)

**Example Data**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "text": "Option A",
  "order": 0
},
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "text": "Option B",
  "order": 1
}
```

---

### 3. VoteResponse

**Purpose**: Represents a single voter's submission to a vote.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key, auto-generated | Unique response identifier |
| `voteId` | UUID | NOT NULL, FK to votes(id) | Reference to the vote being responded to |
| `selectedOptionIds` | UUID[] | NOT NULL, 1+ items | Array of option IDs selected by voter |
| `submittedAt` | TIMESTAMP | NOT NULL, UTC, auto-set | Response submission timestamp |
| `voterFingerprint` | TEXT | NOT NULL | Hash of IP address + browser fingerprint (used for deduplication) |
| `ipAddress` | INET | Nullable | Raw IP address for logging/debugging (may be redacted in audit logs) |

**Relationships**:
- Many VoteResponse : One Vote (N:1) - FK to votes.id

**Indexes**:
```sql
CREATE INDEX idx_vote_responses_vote_id ON vote_responses(voteId);
CREATE INDEX idx_vote_responses_fingerprint ON vote_responses(voteId, voterFingerprint);
CREATE UNIQUE INDEX idx_vote_responses_unique_fingerprint 
  ON vote_responses(voteId, voterFingerprint);
```

**Validation Rules**:
- `voteId`: Must reference existing vote
- `selectedOptionIds`: 
  - Length ≥ 1 (at least one option selected)
  - If `vote.allowMultiple = false`, then length must = 1
  - If `vote.allowMultiple = true`, then length can be > 1
  - All IDs must exist in `vote.options` array
- `voterFingerprint`: Non-empty string, max 255 chars
- Unique constraint: (voteId, voterFingerprint) - prevents duplicate votes from same user
- Response must not be inserted if:
  - `vote.expiresAt` < NOW()
  - `vote.closeTime` < NOW()
  - `vote.openTime` > NOW()
  - `vote.requiresPassword = true` AND user hasn't verified password (checked via RLS or middleware)

---

## State Diagram

```
Vote Creation:
┌──────────────┐
│   CREATED    │  (openTime in future or present)
│   (active)   │
└──────┬───────┘
       │
       ├─────────> Voting Period (can accept responses)
       │
       ├─ Manual Close ──> CLOSED (no more responses accepted)
       │
       └─ Auto Expire ──> EXPIRED (soft delete, archived)
         (after expiresAt)
```

---

## Data Flow Diagram

```
┌─────────────────┐
│   Vote Creator  │
│   (Anonymous)   │
└────────┬────────┘
         │
         ├──> Create Vote Form (Frontend)
         │       ├─ Question
         │       ├─ Options (2-50)
         │       ├─ Open/Close Times
         │       ├─ Password (optional)
         │       └─ Allow Multiple (boolean)
         │
         ├──> Server Action / POST /api/votes
         │       ├─ Validate inputs (Zod)
         │       ├─ Hash password (if provided)
         │       ├─ Generate shareUrl
         │       └─ INSERT into votes table
         │
         ├──> Response with shareUrl
         │       └─ Display shareable link
         │
         └──> Vote Creator can view results
              │
              └─> GET /api/votes/:id/results
                  └─> Count responses (SELECT COUNT by option)

┌──────────────────┐
│  Voter           │
│  (Anonymous)     │
└──────┬───────────┘
       │
       ├──> Visit shareUrl
       │
       ├──> Check if vote is open (openTime ≤ NOW() ≤ closeTime)
       │
       ├─────────────────────────────────────────────┐
       │                                             │
       ├─ If password required:                      │
       │   POST /api/votes/:id/verify-password      │
       │   └─> Verify + Set Session Token           │
       │                                             │
       ├──> Display vote options (radio or checkbox)│
       │                                             │
       ├──> Submit vote response                     │
       │   POST /api/votes/:id/respond              │
       │   ├─ Calculate voterFingerprint            │
       │   ├─ Check unique constraint               │
       │   ├─ Validate closeTime/openTime           │
       │   ├─ INSERT into vote_responses table      │
       │   └─> Return confirmation                  │
       │                                             │
       └─────────────────────────────────────────────┘

Vote Results Update:
┌──────────────────────────┐
│  Supabase Realtime       │
│  (vote_responses table)  │
└───────┬──────────────────┘
        │
        ├──> ON INSERT trigger
        │    ├─ Increment vote_counts[optionId]
        │    └─ Fire Realtime notification
        │
        └──> Vote Creator UI listens for updates
             └─ Re-render result counts in real-time
```

---

## Validation Schema (Zod)

```typescript
// Vote Creation Input
const createVoteSchema = z.object({
  question: z.string().min(3).max(1000),
  options: z.array(z.string().min(1).max(500))
    .min(2)
    .max(50),
  openTime: z.coerce.date().optional().default(() => new Date()),
  closeTime: z.coerce.date().nullable().optional(),
  requiresPassword: z.boolean().default(false),
  password: z.string().max(255).optional(),
  allowMultiple: z.boolean().default(false),
  expirationDays: z.number().int().min(1).max(30).default(30),
}).refine(
  (data) => data.closeTime === null || data.closeTime > data.openTime,
  { message: "Close time must be after open time" }
).refine(
  (data) => !data.requiresPassword || data.password,
  { message: "Password required when password protection enabled" }
);

// Vote Response Input
const submitResponseSchema = z.object({
  voteId: z.string().uuid(),
  selectedOptionIds: z.array(z.string().uuid())
    .min(1),
  voterFingerprint: z.string().max(255),
}).refine(
  (data) => data.selectedOptionIds.length === 1 || allowMultipleForVote(data.voteId),
  { message: "Multiple selections not allowed for this vote" }
);
```

---

## Constraints Summary

| Constraint | Type | Purpose |
|-----------|------|---------|
| `votes.id` PRIMARY KEY | Uniqueness | Unique vote identifier |
| `votes.shareUrl` UNIQUE | Uniqueness | Shareable voting link must be unique |
| `vote_responses (voteId, voterFingerprint)` UNIQUE | Deduplication | Prevent duplicate votes from same user |
| `vote_responses.voteId` FK | Referential Integrity | Response must reference existing vote |
| `votes.openTime ≤ closeTime` | Domain Logic | Open time must precede close time |
| `2 ≤ options count ≤ 50` | Domain Logic | Enforce minimum and maximum options |
| `3 ≤ question length ≤ 1000` | Domain Logic | Reasonable text constraints |
| `0 ≤ option text length ≤ 500` | Domain Logic | Reasonable option length |

---

## Future Extensibility

**Planned (not part of MVP)**:
- Vote editing by authenticated creator (add lastEditedAt, editHistory)
- Advanced voting (ranked choice, cumulative voting)
- Anonymous vs. Authenticated differentiation via user profiles
- Vote templates and duplication
- Webhook integrations for vote completion events
- Export votes as CSV/PDF

**Not Blocking Current Design**: Schema allows these features to be added without migration.
