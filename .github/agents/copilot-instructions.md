# s_vote Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-11

## Active Technologies
- TypeScript 5.x (strict mode), Next.js App Router + Next.js, React, Supabase JS, Zod (003-anonymous-poll-token)
- Supabase Postgres (RLS-enabled) (003-anonymous-poll-token)
- TypeScript 5.x (strict mode) + Next.js 15 App Router, React 19, Supabase JS v2, Zod v3, Node.js `crypto` (built-in) (004-anonymous-voting)
- Supabase Postgres with RLS; `vote_responses` table already has `voter_fingerprint text NOT NULL` + `UNIQUE(vote_id, voter_fingerprint)` constraint (004-anonymous-voting)
- TypeScript 5.x (strict mode) + Next.js App Router, React 19, Supabase JS v2, Zod (006-share-vote-link)
- Supabase Postgres with RLS; no schema change needed for this feature (006-share-vote-link)
- TypeScript 5.x (strict mode) + Next.js 15.x, React 19.x, Supabase JS Client, Zod, bcryptjs (010-protect-voting-page-when-have-password)
- Supabase Postgres with Row-Level Security (RLS); vote table has `requiresPassword` (boolean) and `passwordHash` (text) fields from feature 002 (010-protect-voting-page-when-have-password)

- TypeScript 5.x (strict mode) + Next.js App Router, React, Supabase (`@supabase/ssr`), Zod, Vitest/Jest (001-init-nextjs-docker-supabase)

## Project Structure

```text
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x (strict mode): Follow standard conventions

## Recent Changes
- 010-protect-voting-page-when-have-password: Added TypeScript 5.x (strict mode) + Next.js 15.x, React 19.x, Supabase JS Client, Zod, bcryptjs
- 006-share-vote-link: Added TypeScript 5.x (strict mode) + Next.js App Router, React 19, Supabase JS v2, Zod
- 004-anonymous-voting: Added TypeScript 5.x (strict mode) + Next.js 15 App Router, React 19, Supabase JS v2, Zod v3, Node.js `crypto` (built-in)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
