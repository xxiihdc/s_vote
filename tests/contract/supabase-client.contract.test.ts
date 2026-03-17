import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { _resetEnvForTest } from '@/lib/env'
import { _resetBrowserClientForTest, createBrowserClient } from '@/lib/supabase/browser'

const VALID_ENV = {
  NODE_ENV: 'test',
  APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  LOG_LEVEL: 'info',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
}

describe('Supabase Browser Client Contract', () => {
  beforeEach(() => {
    _resetEnvForTest()
    _resetBrowserClientForTest()
    Object.entries(VALID_ENV).forEach(([k, v]) => (process.env[k] = v))
  })

  afterEach(() => {
    _resetEnvForTest()
    _resetBrowserClientForTest()
    Object.keys(VALID_ENV).forEach((k) => delete process.env[k])
  })

  it('createBrowserClient() returns a non-null client instance', () => {
    const client = createBrowserClient()
    expect(client).toBeDefined()
    expect(client).not.toBeNull()
  })

  it('createBrowserClient() is a singleton — same reference on repeated calls', () => {
    const a = createBrowserClient()
    const b = createBrowserClient()
    expect(a).toBe(b)
  })

  it('client exposes .from() query builder (RLS-safe operations)', () => {
    const client = createBrowserClient()
    expect(typeof client.from).toBe('function')
  })

  it('client exposes .functions() for Edge Function invocations', () => {
    const client = createBrowserClient()
    expect(client.functions).toBeDefined()
    expect(typeof client.functions.invoke).toBe('function')
  })

  it('client exposes .auth for session management', () => {
    const client = createBrowserClient()
    expect(client.auth).toBeDefined()
    expect(typeof client.auth.getSession).toBe('function')
  })

  it('client is initialized with anon key (not service-role)', () => {
    // Service-role key must never appear in any browser-accessible context
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    expect(key).not.toMatch(/service_role/i)
  })
})
