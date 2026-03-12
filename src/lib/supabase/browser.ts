import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  type AdminTaskRequest,
  type AdminTaskResponse,
  type SupabaseConnectionContext,
} from '@/types/contracts'
import { withCorrelationHeader } from '@/lib/correlation'
import { getEnv } from '../env'

let _client: SupabaseClient | null = null

/**
 * Returns a singleton Supabase Browser Client initialized with the anon key.
 * Service-role credentials MUST NOT be used here — browser context only.
 */
export function createBrowserClient(): SupabaseClient {
  if (_client === null) {
    const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getEnv()
    _client = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  }
  return _client
}

export function getBrowserConnectionContext(): SupabaseConnectionContext {
  return {
    mode: 'browser',
    authSource: 'anon-key',
    rlsExpected: true,
    allowedOperations: ['select', 'insert', 'update', 'delete', 'invoke-edge-function'],
  }
}

export async function checkSupabaseReadiness(): Promise<{
  ok: boolean
  elapsedMs: number
  error?: string
}> {
  const start = performance.now()
  const client = createBrowserClient()
  const { error } = await client.from('_healthcheck').select('*').limit(1)
  const elapsedMs = performance.now() - start

  if (error && error.code !== 'PGRST116') {
    return { ok: false, elapsedMs, error: `${error.code}: ${error.message}` }
  }
  return { ok: true, elapsedMs }
}

export async function fetchPublicVotes(limit = 20): Promise<unknown[]> {
  const client = createBrowserClient()
  const { data, error } = await client
    .from('votes')
    .select('*')
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch votes: ${error.message}`)
  }
  return data ?? []
}

export async function invokeAdminTask(payload: AdminTaskRequest): Promise<AdminTaskResponse> {
  const client = createBrowserClient()
  const headers = withCorrelationHeader({}, payload.requestId)

  const { data, error } = await client.functions.invoke('admin-task', {
    body: payload,
    headers,
  })

  if (error) {
    return {
      status: 'failed',
      requestId: payload.requestId,
      error: error.message,
    }
  }

  const response = (data ?? {}) as Partial<AdminTaskResponse>
  return {
    status: response.status ?? 'success',
    requestId: response.requestId ?? payload.requestId,
    result: response.result,
    error: response.error,
  }
}

/** For test-only use — reset the cached client instance. */
export function _resetBrowserClientForTest(): void {
  _client = null
}
