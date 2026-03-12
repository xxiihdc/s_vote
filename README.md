# S Vote

Frontend-first voting baseline built with Next.js (TypeScript), Supabase Browser Client,
and Vercel deployment.

## Stack

- Next.js App Router + TypeScript strict mode
- Supabase JS Browser Client for frontend operations
- Supabase Edge Functions for admin-privileged actions
- Vercel for preview and production deploys
- Vitest for unit/integration tests

## How To Run Project

### 1. Run In Development Mode (Recommended)

1. Install dependencies:

```bash
npm install
```

2. Create local env file:

```bash
cp .env.example .env.local
```

3. Set required variables in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
APP_URL=http://localhost:3000
LOG_LEVEL=info
```

4. Run the app:

```bash
npm run dev
```

App URL: `http://localhost:3000`

5. Run tests:

```bash
npm run test
```

### 2. Run Production Build Locally

```bash
npm run build
npm run start
```

### 3. Run With Docker

1. Ensure `.env.local` (or exported env vars) includes:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
APP_URL=http://localhost:3000
```

2. Build and start with Docker Compose:

```bash
docker compose up --build
```

3. Stop containers:

```bash
docker compose down
```

## Run Supabase Local

### 1. Start Supabase Local

```bash
supabase start
```

### 2. Check Supabase Local Status

```bash
supabase status
```

Command output will provide local services such as:

- API URL
- DB URL
- Studio URL
- anon key
- service role key

### 3. Update `.env.local`

Copy the local `API URL` and `anon key` from `supabase status` into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
APP_URL=http://localhost:3000
LOG_LEVEL=info
```

### 4. Apply Migrations Locally

```bash
supabase db push
```

### 5. Serve Or Deploy Edge Functions

Serve locally during development:

```bash
supabase functions serve admin-task --no-verify-jwt
```

Deploy to remote project when needed:

```bash
supabase functions deploy admin-task
```

### 6. Stop Supabase Local

```bash
supabase stop
```

### Recommended Local Workflow

1. `supabase start`
2. Update `.env.local` with local values from `supabase status`
3. `supabase db push`
4. `npm run dev`
5. `supabase functions serve admin-task --no-verify-jwt`

## CI Quality Gate

Run all local quality checks:

```bash
npm run ci:check
```

This validates TypeScript, ESLint, tests, Next.js build, and Docker startup checks.

## Supabase CLI Operations

Migrations and Edge Function deploy are managed with Supabase CLI:

```bash
supabase db push
supabase functions deploy admin-task
```

## Security Boundary

- Frontend uses only `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Admin operations must go through `supabase/functions/admin-task/index.ts`.
- `SUPABASE_SERVICE_ROLE_KEY` must be configured only as Edge Function secret.

## Vercel Deployment (GitHub Integration)

1. Connect repository in Vercel dashboard.
2. Set environment variables in Vercel project settings:
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
	- `APP_URL`
	- `LOG_LEVEL`
3. Push to GitHub:
	- Pull requests create preview deployments
	- `main` branch updates production deployment

## Observability

- Structured JSON logs are emitted by `src/lib/logger.ts`.
- Correlation IDs are propagated through Edge Function invocations for traceability.
