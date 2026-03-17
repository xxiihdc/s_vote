import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import { _resetEnvForTest, getEnv } from '@/lib/env'

const VALID_ENV = {
  NODE_ENV: 'test',
  APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
}

describe('token results refresh integration', () => {
  beforeEach(() => {
    _resetEnvForTest()
    Object.entries(VALID_ENV).forEach(([k, v]) => (process.env[k] = v))
  })

  afterEach(() => {
    _resetEnvForTest()
    Object.keys(VALID_ENV).forEach((k) => delete process.env[k])
  })

  it('uses bounded refresh interval from env', () => {
    const env = getEnv()
    expect(env.RESULT_TOKEN_REFRESH_INTERVAL_MS).toBeGreaterThanOrEqual(1000)
    expect(env.RESULT_TOKEN_REFRESH_INTERVAL_MS).toBeLessThanOrEqual(60000)
  })
})
