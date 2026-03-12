import { getEnv } from './env'
import { logger } from './logger'
import type { BootstrapStatus } from '@/types/contracts'

let _bootstrapped = false

/**
 * Runs app startup validation checks. Safe to call multiple times — only
 * executes once per process lifetime.
 */
export function bootstrapApp(): void {
  if (_bootstrapped) return
  if (process.env.NEXT_PHASE === 'phase-production-build') return
  _bootstrapped = true

  try {
    const env = getEnv()
    const status: BootstrapStatus = {
      ok: true,
      timestamp: new Date().toISOString(),
      environment: {
        state: 'validated',
        supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
        anonKeyPresent: Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      },
      supabase: {
        initialized: true,
      },
    }
    logger.info('App bootstrap complete', { bootstrapStatus: status })
  } catch (err) {
    logger.error('App bootstrap failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    // Do not fail Next.js compile-time analysis. Enforce fail-fast only at runtime.
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.NEXT_PHASE !== 'phase-production-build'
    ) {
      throw err
    }
  }
}

/** For test-only use — reset bootstrap state. */
export function _resetBootstrapForTest(): void {
  _bootstrapped = false
}
