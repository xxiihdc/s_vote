import { describe, expect, it } from 'vitest'
import { getEnv } from '@/lib/env'

describe('token results refresh integration', () => {
  it('uses bounded refresh interval from env', () => {
    const env = getEnv()
    expect(env.RESULT_TOKEN_REFRESH_INTERVAL_MS).toBeGreaterThanOrEqual(1000)
    expect(env.RESULT_TOKEN_REFRESH_INTERVAL_MS).toBeLessThanOrEqual(60000)
  })
})
