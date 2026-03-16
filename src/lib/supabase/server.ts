import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getEnv } from '@/lib/env'

let _serverClient: SupabaseClient | null = null
let _serviceRoleClient: SupabaseClient | null = null

export function createServerSupabaseClient(): SupabaseClient {
  if (_serverClient) return _serverClient

  const env = getEnv()
  _serverClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  return _serverClient
}

export function createServiceRoleSupabaseClient(): SupabaseClient {
  if (_serviceRoleClient) return _serviceRoleClient

  const env = getEnv()
  _serviceRoleClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  return _serviceRoleClient
}

export function _resetServerSupabaseClientForTest(): void {
  _serverClient = null
  _serviceRoleClient = null
}
