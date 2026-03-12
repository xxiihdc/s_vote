import { describe, it, expect, vi, beforeEach } from 'vitest'
import { _resetEnvForTest } from '@/lib/env'
import { _resetBrowserClientForTest, invokeAdminTask } from '@/lib/supabase/browser'

vi.mock('@supabase/supabase-js', async () => {
  const actual = (await vi.importActual('@supabase/supabase-js')) as Record<string, unknown>
  return {
    ...actual,
    createClient: vi.fn(() => ({
      functions: {
        invoke: vi.fn(async () => ({ data: { status: 'success' }, error: null })),
      },
    })),
  }
})

describe('Edge Function invocation', () => {
  beforeEach(() => {
    _resetEnvForTest()
    _resetBrowserClientForTest()
    Object.assign(process.env, {
      NODE_ENV: 'test',
      APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    })
  })

  it('invokes admin-task function and returns response', async () => {
    const response = await invokeAdminTask({
      action: 'recountVotes',
      payload: { pollId: 'poll_123' },
      requestId: 'req_1',
    })

    expect(response.status).toBe('success')
    expect(response.requestId).toBe('req_1')
  })
})
