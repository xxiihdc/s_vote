# Quickstart: Anonymous User Voting

**Feature**: `004-anonymous-voting`
**Date**: 2026-03-16

This guide explains how to run, test, and verify the anonymous voting feature locally.

---

## Prerequisites

1. Docker and Docker Compose installed
2. Supabase CLI installed (`supabase --version`)
3. `.env.local` configured (see below)
4. Node.js ≥ 20 and `npm` available

---

## Environment Variables

Add or update these in `.env.local`:

```env
# Required (was previously optional — must now be set)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Existing required vars
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
APP_URL=http://localhost:3000

# Optional — default changed to 5000 ms (was 15000 ms) to meet ≤5 s spec requirement
RESULT_TOKEN_REFRESH_INTERVAL_MS=5000
```

> **Note**: `SUPABASE_SERVICE_ROLE_KEY` is now **required**. The application will fail at startup
> with a clear error if it is missing. Find it in your Supabase project dashboard under
> Settings → API → Service role key (keep this secret — server-only).

---

## Local Development Setup

### 1. Start Supabase locally

```bash
supabase start
```

This runs Supabase locally on `http://localhost:54321`. Copy the `service_role` key from the output.

### 2. Start the app

```bash
npm run dev
```

App runs on `http://localhost:3000`.

### 3. Create a test vote

Navigate to `http://localhost:3000/votes/create` and create a vote. Copy the vote URL (e.g., `http://localhost:3000/votes/<voteId>`).

### 4. Submit a vote anonymously

Open the vote URL. Select an option and submit. You should see a confirmation message.

### 5. Verify deduplication

Reload the vote page. Your previously selected option should be pre-filled.
Submit again with a different option — the results should update within ≤ 5 seconds.

### 6. Test with Docker

```bash
docker compose up --build
```

Then follow steps 3–5 at `http://localhost:3000`.

---

## Running Tests

### All tests

```bash
npm test
```

### Unit tests only (IP hashing logic)

```bash
npm test -- tests/unit/vote-ip-hash.test.ts
```

### Integration tests (vote submission API)

```bash
npm test -- tests/integration/vote-submit.integration.test.ts
```

### Contract tests (payload schema validation)

```bash
npm test -- tests/contract/vote-submit.contract.test.ts
```

---

## Verifying Key Behaviors

### 1. Anonymous vote submission — 201 Created

```bash
VOTE_ID="<your-vote-id>"
OPTION_ID="<valid-option-uuid>"

curl -s -X POST "http://localhost:3000/api/votes/$VOTE_ID/responses" \
  -H "Content-Type: application/json" \
  -d "{\"selectedOptionIds\":[\"$OPTION_ID\"]}" | jq .
# Expected: { "action": "created", "voteId": "...", "selectedOptionIds": ["..."] }
```

### 2. Vote change — 200 Updated

```bash
# Submit again with a different option from the same IP
curl -s -X POST "http://localhost:3000/api/votes/$VOTE_ID/responses" \
  -H "Content-Type: application/json" \
  -d "{\"selectedOptionIds\":[\"$DIFFERENT_OPTION_ID\"]}" | jq .
# Expected: { "action": "updated", ... }
```

### 3. Unchanged vote — 200 Unchanged

```bash
# Submit the same option again
curl -s -X POST "http://localhost:3000/api/votes/$VOTE_ID/responses" \
  -H "Content-Type: application/json" \
  -d "{\"selectedOptionIds\":[\"$OPTION_ID\"]}" | jq .
# Expected: { "action": "unchanged", ... }
```

### 4. Closed poll rejection — 422

Create a vote with `closeTime` in the past (or set `status = 'closed'` via Supabase Studio), then:

```bash
curl -s -X POST "http://localhost:3000/api/votes/$CLOSED_VOTE_ID/responses" \
  -H "Content-Type: application/json" \
  -d "{\"selectedOptionIds\":[\"$OPTION_ID\"]}" | jq .
# Expected: { "error": "vote_closed", "message": "Voting has ended for this poll" }
```

### 5. Verify voter_fingerprint is not in API response

```bash
curl -s -X POST "http://localhost:3000/api/votes/$VOTE_ID/responses" \
  -H "Content-Type: application/json" \
  -d "{\"selectedOptionIds\":[\"$OPTION_ID\"]}" | jq 'keys'
# Expected: ["action", "selectedOptionIds", "voteId"]
# voter_fingerprint MUST NOT appear
```

### 6. Verify results refresh within ≤ 5 seconds

1. Open the results URL (from vote creation) in a browser tab
2. Submit a vote from `curl` (see step 1)
3. The results count should update within 5 seconds in the browser

---

## Supabase Studio Checks

Open `http://localhost:54323` (Supabase Studio):

1. **Table: `vote_responses`** — after submitting a vote, verify:
   - A row exists for the vote
   - `voter_fingerprint` is a 64-char hex string (not the raw IP)
   - `selected_option_ids` contains the option UUID

2. **RLS Policies** — confirm no SELECT policy exists for `anon` on `vote_responses`:
   - Navigate to Authentication → Policies → `vote_responses`
   - Only INSERT policy (`vote_responses_insert_open_vote`) should be listed for `anon`

3. **Uniqueness** — submit two votes from curl (same IP), check only 1 row exists per `(vote_id, voter_fingerprint)`.

---

## Known Limitations

- **Shared IP (NAT/proxy)**: Multiple users behind the same router share one IP and thus one vote slot.
  The first voter's IP is recorded; all others see the same pre-filled state.
- **SHA256 brute-force**: The stored `voter_fingerprint` is reversible via brute force over the IPv4 space.
  Accepted trade-off at current scale. Upgrade to HMAC-SHA256 if threat model changes.
- **No application-level rate limit**: Rapid-fire requests from the same IP rely on Supabase platform
  throttling for protection.
