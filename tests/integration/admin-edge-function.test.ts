import { describe, it, expect, vi, beforeEach } from 'vitest'
import { invokeAdminTask, _resetBrowserClientForTest } from '@/lib/supabase/browser'
import { _resetEnvForTest } from '@/lib/env'

vi.mock('@supabase/supabase-js', async () => {
  const actual = (await vi.importActual('@supabase/supabase-js')) as Record<string, unknown>
  return {
    ...actual,
    createClient: vi.fn(() => ({
      functions: {
        invoke: vi.fn(async () => ({
          data: {
            status: 'success',
            requestId: 'req_99',
            result: { affectedRows: 12 },
          },
          error: null,
        })),
      },
      from: vi.fn(),
      auth: { getSession: vi.fn() },
    })),
  }
})

describe('Admin operation integration (through Edge Function)', () => {
  beforeEach(() => {
    _resetEnvForTest()
    _resetBrowserClientForTest()
    Object.assign(process.env, {
      NODE_ENV: 'test',
      APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    })
  })

  it('routes admin action via Edge Function and not direct DB privileges', async () => {
    const res = await invokeAdminTask({
      action: 'recountVotes',
      payload: { pollId: 'poll_1' },
      requestId: 'req_99',
    })

    expect(res.status).toBe('success')
    expect(res.result).toEqual({ affectedRows: 12 })
  })
})
