/**
 * Shared TypeScript contracts for frontend bootstrap, health checks,
 * and Edge Function API payloads.
 */

// ---- Environment state ----

export type EnvState = 'unvalidated' | 'validated' | 'rejected'

export interface EnvironmentStatus {
  state: EnvState
  supabaseUrl: string
  /** Never includes secrets — only presence flag */
  anonKeyPresent: boolean
}

// ---- Supabase connection context ----

export type ClientMode = 'browser' | 'edge-function-admin'
export type AuthSource = 'anon-key' | 'service-role-edge-function'

export interface SupabaseConnectionContext {
  mode: ClientMode
  authSource: AuthSource
  rlsExpected: boolean
  allowedOperations: string[]
}

// ---- Bootstrap health status ----

export interface BootstrapStatus {
  ok: boolean
  timestamp: string
  environment: EnvironmentStatus
  supabase: {
    initialized: boolean
    elapsedMs?: number
    error?: string
  }
}

// ---- Edge Function contracts ----

export type AdminAction = 'recountVotes' | 'resetPoll' | 'archivePoll'

export interface AdminTaskRequest {
  action: AdminAction
  payload: Record<string, unknown>
  requestId: string
}

export interface AdminTaskResponse {
  status: 'success' | 'failed'
  requestId: string
  result?: Record<string, unknown>
  error?: string
}
