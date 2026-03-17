import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url('APP_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  VERCEL_PROJECT_ID: z.string().optional(),
  VERCEL_ORG_ID: z.string().optional(),
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info'),
  RESULT_TOKEN_EXPIRATION_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  RESULT_TOKEN_REFRESH_INTERVAL_MS: z.coerce.number().int().min(1000).max(60000).default(5000),
})

export type EnvConfig = z.infer<typeof envSchema>

function hideServiceRoleKey(env: EnvConfig): EnvConfig {
  Object.defineProperty(env, 'SUPABASE_SERVICE_ROLE_KEY', {
    value: env.SUPABASE_SERVICE_ROLE_KEY,
    enumerable: false,
    writable: false,
    configurable: false,
  })
  return env
}

function parseEnv(): EnvConfig {
  const result = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    APP_URL: process.env.APP_URL ?? 'http://localhost:3000',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID,
    VERCEL_ORG_ID: process.env.VERCEL_ORG_ID,
    LOG_LEVEL: process.env.LOG_LEVEL,
    RESULT_TOKEN_EXPIRATION_DAYS: process.env.RESULT_TOKEN_EXPIRATION_DAYS,
    RESULT_TOKEN_REFRESH_INTERVAL_MS: process.env.RESULT_TOKEN_REFRESH_INTERVAL_MS,
  })

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Environment configuration is invalid:\n${issues}`)
  }

  return hideServiceRoleKey(result.data)
}

let _env: EnvConfig | null = null

/**
 * Returns the validated environment configuration.
 * Throws on the first call if required variables are missing or invalid.
 */
export function getEnv(): EnvConfig {
  if (_env === null) {
    _env = parseEnv()
  }
  return _env
}

/** For test-only use — reset cached env. */
export function _resetEnvForTest(): void {
  _env = null
}
