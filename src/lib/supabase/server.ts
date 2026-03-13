import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getEnv } from '@/lib/env'

let _serverClient: SupabaseClient | null = null

export function createServerSupabaseClient(): SupabaseClient {
  if (_serverClient) return _serverClient

  const env = getEnv()
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server vote operations')
  }

  _serverClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return _serverClient
}

export function _resetServerSupabaseClientForTest(): void {
  _serverClient = null
}
