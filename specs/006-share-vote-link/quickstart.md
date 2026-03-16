# Quickstart — 006-share-vote-link

## Goal
Verify that vote creation returns both share links (voting + results), and that incomplete metadata shows a generic share-link error.

## Prerequisites
- Node.js + npm installed
- Project dependencies installed (`npm install`)
- `APP_URL` configured for local run (example: `http://localhost:3000`)

## 1) Run target test
```bash
npm run test -- tests/integration/vote-create.integration.test.ts
```
Expected: test suite passes and redirect contract includes `voteUrl` and `resultUrl`.

## 2) Run app locally
```bash
npm run dev
```

## 3) Manual verification (success path)
1. Open `/votes/create`
2. Submit valid form with at least 2 options
3. Confirm success card shows:
   - Voting URL (absolute URL)
   - Result URL (absolute URL)
4. Click open/copy actions for both URLs
5. Confirm voting URL opens `/votes/{voteId}` and result URL opens `/results/{token}`

## 4) Manual verification (incomplete metadata path)
1. Simulate missing link metadata in redirected search params (or by test fixture)
2. Confirm success panel is hidden
3. Confirm generic share-link error message appears

## 5) Optional quality gates
```bash
npm run typecheck
npm run lint
```
