import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { _resetEnvForTest } from '@/lib/env'
import { _resetBootstrapForTest, bootstrapApp } from '@/lib/bootstrap'

const VALID_ENV = {
  NODE_ENV: 'test',
  APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  LOG_LEVEL: 'info',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
}

describe('Frontend Bootstrap Integration', () => {
  beforeEach(() => {
    _resetEnvForTest()
    _resetBootstrapForTest()
    Object.entries(VALID_ENV).forEach(([k, v]) => (process.env[k] = v))
  })

  afterEach(() => {
    _resetEnvForTest()
    _resetBootstrapForTest()
    Object.keys(VALID_ENV).forEach((k) => delete process.env[k])
    vi.restoreAllMocks()
  })

  it('bootstrapApp() completes without throwing when env is valid', () => {
    expect(() => bootstrapApp()).not.toThrow()
  })

  it('bootstrapApp() is idempotent — calling twice does not throw', () => {
    expect(() => {
      bootstrapApp()
      bootstrapApp()
    }).not.toThrow()
  })

  it('bootstrapApp() emits a structured info log', () => {
    const logSpy = vi.spyOn(console, 'log')
    bootstrapApp()
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('bootstrap')
    )
  })

  it('bootstrapApp() does not log any secret values', () => {
    const logSpy = vi.spyOn(console, 'log')
    bootstrapApp()
    const allOutput = logSpy.mock.calls.map((c) => JSON.stringify(c)).join(' ')
    expect(allOutput).not.toMatch(/service.role|password|secret/i)
  })

  it('bootstrapApp() logs supabaseUrl without leaking anonKey', () => {
    const logSpy = vi.spyOn(console, 'log')
    bootstrapApp()
    const allOutput = logSpy.mock.calls.map((c) => JSON.stringify(c)).join(' ')
    expect(allOutput).toContain('supabase')
    expect(allOutput).not.toContain('test-anon-key')
  })
})
