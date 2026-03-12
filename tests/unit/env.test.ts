import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { _resetEnvForTest, getEnv } from '@/lib/env'

const VALID_ENV = {
  NODE_ENV: 'test',
  APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  LOG_LEVEL: 'info',
}

function setEnv(overrides: Partial<typeof VALID_ENV> = {}) {
  const env = { ...VALID_ENV, ...overrides }
  Object.entries(env).forEach(([k, v]) => {
    if (v === undefined) {
      delete process.env[k]
    } else {
      process.env[k] = v
    }
  })
}

describe('getEnv()', () => {
  beforeEach(() => {
    _resetEnvForTest()
  })

  afterEach(() => {
    _resetEnvForTest()
    Object.keys(VALID_ENV).forEach((k) => delete process.env[k])
  })

  it('returns validated config with all required fields present', () => {
    setEnv()
    const env = getEnv()
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://abc.supabase.co')
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key')
    expect(env.NODE_ENV).toBe('test')
  })

  it('throws when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    setEnv({ NEXT_PUBLIC_SUPABASE_URL: undefined as unknown as string })
    expect(() => getEnv()).toThrow(/invalid/i)
  })

  it('throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
    setEnv({ NEXT_PUBLIC_SUPABASE_ANON_KEY: '' })
    expect(() => getEnv()).toThrow(/invalid/i)
  })

  it('throws when NEXT_PUBLIC_SUPABASE_URL is not a valid URL', () => {
    setEnv({ NEXT_PUBLIC_SUPABASE_URL: 'not-a-url' })
    expect(() => getEnv()).toThrow(/invalid/i)
  })

  it('caches the result after first parse', () => {
    setEnv()
    const first = getEnv()
    const second = getEnv()
    expect(first).toBe(second)
  })

  it('defaults LOG_LEVEL to info when not set', () => {
    setEnv()
    delete process.env.LOG_LEVEL
    const env = getEnv()
    expect(env.LOG_LEVEL).toBe('info')
  })

  it('does not expose service-role key in public env fields', () => {
    setEnv()
    const env = getEnv()
    const keys = Object.keys(env)
    expect(keys.some((k) => /service.role/i.test(k))).toBe(false)
  })
})
