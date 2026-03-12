// @ts-nocheck
// Supabase Edge Function: admin-task
// Runs in trusted server context and may use service_role credentials via
// Supabase secrets. Never expose service-role keys to frontend clients.

import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request): Promise<Response> => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ status: 'failed', error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { action, payload, requestId } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({
          status: 'failed',
          requestId,
          error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Privileged client only in Edge Function runtime.
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    let result: Record<string, unknown> = {}

    switch (action) {
      case 'recountVotes': {
        const pollId = String(payload?.pollId ?? '')
        if (!pollId) {
          throw new Error('pollId is required for recountVotes')
        }

        const { count, error } = await adminClient
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('poll_id', pollId)

        if (error) throw error
        result = { pollId, totalVotes: count ?? 0 }
        break
      }
      case 'resetPoll':
      case 'archivePoll': {
        result = { action, accepted: true }
        break
      }
      default:
        return new Response(
          JSON.stringify({
            status: 'failed',
            requestId,
            error: `Unsupported action: ${action}`,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        requestId,
        result,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
