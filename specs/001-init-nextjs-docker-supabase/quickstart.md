# Quickstart: Initialize Next.js + Supabase + Vercel

## Prerequisites
- Node.js 20+
- npm/pnpm/yarn (one package manager)
- Supabase project
- Supabase CLI
- Vercel account linked with GitHub repository

## 1. Install Dependencies
```bash
npm install
```

## 2. Configure Environment
Create `.env.local` with:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
APP_URL=http://localhost:3000
```

## 3. Run in Local Dev Mode
```bash
npm run dev
```
Verify:
- Open `http://localhost:3000`
- Confirm frontend can initialize Supabase Browser Client successfully

## 4. Run Baseline Tests
```bash
npm run test
```
Verify:
- Browser Client initialization and integration tests pass.

## 5. Apply Migrations and Deploy Edge Functions
```bash
supabase db push
supabase functions deploy admin-task
```

## 5.1 Supabase CLI Operational Checklist
- Ensure `supabase/config.toml` exists and project is initialized.
- Authenticate CLI and select correct project ref.
- Run `supabase db push` before deploying edge functions when schema changes exist.
- Deploy functions with explicit function name (`admin-task`).
- Verify function secrets are set server-side (especially `SUPABASE_SERVICE_ROLE_KEY`).
- Never place service-role credentials in frontend env files.

## 6. Deploy Frontend to Vercel
```bash
vercel --prod
```

### Vercel Environment Variable Mapping
- `NEXT_PUBLIC_SUPABASE_URL` -> Supabase project URL (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` -> Supabase anon key (public)
- `APP_URL` -> Frontend base URL for runtime checks
- `LOG_LEVEL` -> Structured logging level (`debug|info|warn|error`)

### Preview and Production Workflow
- Every pull request generates a Preview deployment URL.
- Merges to `main` trigger Production deployment.
- Validate both URLs with smoke checks before sign-off.

## 7. Security and Compliance Checks
- Confirm frontend only uses anon key and never stores service-role key.
- Confirm admin operations are routed through Supabase Edge Functions.
- Confirm env validation fails fast if required variables are missing.
- Confirm logs do not print secrets.
