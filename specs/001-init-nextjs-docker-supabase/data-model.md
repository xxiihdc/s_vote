# Phase 1 Data Model: Initialize Next.js + Supabase + Vercel

## Entity: EnvironmentConfig
- Purpose: Validated runtime configuration used by frontend startup, Supabase Browser Client, and deploy pipelines.
- Fields:
  - `nodeEnv`: enum(`development`, `test`, `production`)
  - `appUrl`: URL string
  - `supabaseUrl`: URL string
  - `supabaseAnonKey`: string (public)
  - `vercelProjectId`: string
  - `vercelOrgId`: string
  - `logLevel`: enum(`debug`, `info`, `warn`, `error`)
- Validation Rules:
  - `supabaseUrl` MUST be valid HTTPS URL in non-local environments.
  - Service-role key MUST never exist in frontend runtime config.
  - Missing required fields MUST fail startup.
- State Transitions:
  - `Unvalidated` -> `Validated` during app bootstrap.
  - `Validated` -> `Rejected` on runtime reload with invalid env.

## Entity: VercelDeploymentConfig
- Purpose: Deployment metadata and constraints for Vercel CI/CD workflows.
- Fields:
  - `projectName`: string
  - `environment`: enum(`preview`, `production`)
  - `gitBranch`: string
  - `buildStatus`: enum(`queued`, `building`, `ready`, `failed`)
  - `deployUrl`: string
- Validation Rules:
  - `deployUrl` MUST be a valid URL.
  - `environment=production` MUST map to protected branch policy.

## Entity: SupabaseConnectionContext
- Purpose: Capture client initialization mode and security scope.
- Fields:
  - `mode`: enum(`browser`, `edge-function-admin`)
  - `authSource`: enum(`anon-key`, `service-role-edge-function`)
  - `rlsExpected`: boolean
  - `allowedOperations`: string[]
- Validation Rules:
  - `mode=edge-function-admin` MUST execute on Supabase Edge Functions only.
  - Browser mode MUST never use service-role privileges.

## Relationships
- `EnvironmentConfig` configures `SupabaseConnectionContext` construction.
- `VercelDeploymentConfig` governs frontend deployment lifecycle for the validated `EnvironmentConfig`.
