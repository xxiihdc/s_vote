'use client'

import { createBrowserClient } from '@/lib/supabase/browser'
import { checkSupabaseReadiness } from '@/lib/supabase/browser'
import { logger } from '@/lib/logger'

export default function HomePage() {
  const handleCheckSupabase = async () => {
    const client = createBrowserClient()
    const status = await checkSupabaseReadiness()

    if (!status.ok) {
      logger.warn('Supabase readiness check returned error', {
        error: status.error,
        elapsedMs: status.elapsedMs,
      })
    } else {
      logger.info('Supabase Browser Client ready', { elapsedMs: status.elapsedMs })
    }

    // Keep the reference in place to ensure browser client initializes.
    void client
  }

  return (
    <main>
      <h1>S Vote</h1>
      <button onClick={handleCheckSupabase}>Check Supabase connection</button>
    </main>
  )
}
