import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { _resetEnvForTest, getEnv } from '@/lib/env'

const VALID_ENV = {
  NODE_ENV: 'test',
  APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
}

describe('Supabase env validation', () => {
  beforeEach(() => {
    _resetEnvForTest()
  })

  afterEach(() => {
    _resetEnvForTest()
    Object.keys(VALID_ENV).forEach((k) => delete process.env[k])
  })

  it('accepts valid supabase URL and anon key', () => {
    Object.entries(VALID_ENV).forEach(([k, v]) => (process.env[k] = v))
    const env = getEnv()
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe(VALID_ENV.NEXT_PUBLIC_SUPABASE_URL)
  })

  it('rejects missing NEXT_PUBLIC_SUPABASE_URL', () => {
    Object.entries(VALID_ENV).forEach(([k, v]) => (process.env[k] = v))
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    expect(() => getEnv()).toThrow()
  })

  it('rejects missing NEXT_PUBLIC_SUPABASE_ANON_KEY', () => {
    Object.entries(VALID_ENV).forEach(([k, v]) => (process.env[k] = v))
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ''
    expect(() => getEnv()).toThrow()
  })
})
