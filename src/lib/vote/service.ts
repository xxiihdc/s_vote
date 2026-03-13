import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { CreateVoteRequest, TokenResultsResponse, VoteOption } from '@/types/contracts'
import { hashVotePassword } from '@/lib/vote/password'
import { computeExpiresAt, getVoteTimingState } from '@/lib/vote/timing'
import { TokenLookupError, toVoteOptions } from '@/lib/vote/validate'
import { buildResultUrl, generateResultToken, hashResultToken } from '@/lib/vote/token'
import { canReadTokenResults, resolveTokenAccessState } from '@/lib/vote/token-access'
import { getEnv } from '@/lib/env'

interface VoteRow {
  id: string
  question: string
  options: VoteOption[]
  open_time: string
  close_time: string | null
  requires_password: boolean
  allow_multiple: boolean
  created_at: string
  updated_at: string
  expires_at: string
  share_url: string
  result_token_hash: string
  token_expires_at: string
  creator_user_id: string | null
  status: 'active' | 'closed' | 'expired' | 'archived' | 'deleted'
}

function toCreateVoteResponse(row: VoteRow) {
  return {
    voteId: row.id,
    resultUrl: buildResultUrl(row.share_url),
    tokenExpiresAt: row.token_expires_at,
  }
}

export async function createVote(input: CreateVoteRequest) {
  const env = getEnv()
  const now = new Date()
  const openTime = input.openTime ?? new Date()
  const closeTime = input.closeTime ?? null
  const expiresAt = computeExpiresAt(now, input.expirationDays)
  const tokenExpiresAt = computeExpiresAt(now, env.RESULT_TOKEN_EXPIRATION_DAYS)
  const options = toVoteOptions(input.options)
  const token = generateResultToken()
  const tokenHash = hashResultToken(token)

  const supabase = createServerSupabaseClient()
  const insertPayload = {
    question: input.question.trim(),
    options,
    open_time: openTime.toISOString(),
    close_time: closeTime ? closeTime.toISOString() : null,
    requires_password: input.requiresPassword,
    password_hash: input.requiresPassword ? hashVotePassword(input.password!.trim()) : null,
    allow_multiple: input.allowMultiple,
    expires_at: expiresAt.toISOString(),
    share_url: token,
    result_token_hash: tokenHash,
    token_expires_at: tokenExpiresAt.toISOString(),
    status: 'active',
  }

  const { data, error } = await supabase
    .from('votes')
    .insert(insertPayload)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(`Failed to create vote: ${error?.message ?? 'unknown error'}`)
  }

  return toCreateVoteResponse(data as VoteRow)
}

export async function getVoteById(voteId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('id', voteId)
    .single()

  if (error || !data) {
    return null
  }

  const timing = getVoteTimingState({
    now: new Date(),
    openTime: new Date((data as VoteRow).open_time),
    closeTime: (data as VoteRow).close_time ? new Date((data as VoteRow).close_time as string) : null,
    expiresAt: new Date((data as VoteRow).expires_at),
  })

  return {
    id: (data as VoteRow).id,
    question: (data as VoteRow).question,
    options: (data as VoteRow).options,
    requiresPassword: (data as VoteRow).requires_password,
    allowMultiple: (data as VoteRow).allow_multiple,
    openTime: (data as VoteRow).open_time,
    closeTime: (data as VoteRow).close_time,
    isOpen: timing.isOpen,
    status: (data as VoteRow).status,
  }
}

interface VoteResponseRow {
  selected_option_ids: string[]
}

interface TokenLookupVoteRow {
  id: string
  question: string
  options: VoteOption[]
  status: string
  token_expires_at: string
  updated_at: string
}

export async function getVoteResultsByToken(token: string): Promise<TokenResultsResponse> {
  const supabase = createServerSupabaseClient()
  const tokenHash = hashResultToken(token)

  const { data: voteData, error: voteError } = await supabase
    .from('votes')
    .select('id, question, options, status, token_expires_at, updated_at')
    .eq('result_token_hash', tokenHash)
    .single()

  if (voteError || !voteData) {
    throw new TokenLookupError('not_found', 'Token does not match any vote')
  }

  const vote = voteData as TokenLookupVoteRow
  const accessState = resolveTokenAccessState({
    status: vote.status,
    tokenExpiresAt: vote.token_expires_at,
  })

  if (!canReadTokenResults(accessState)) {
    if (accessState === 'expired') {
      throw new TokenLookupError('expired', 'Token is expired')
    }
    throw new TokenLookupError('unavailable', 'Vote is not available')
  }

  const { data: responseRows, error: responseError } = await supabase
    .from('vote_responses')
    .select('selected_option_ids')
    .eq('vote_id', vote.id)

  if (responseError) {
    throw new Error(`Failed to load vote responses: ${responseError.message}`)
  }

  const rows = (responseRows ?? []) as VoteResponseRow[]
  const counts = new Map<string, number>()
  for (const option of vote.options) {
    counts.set(option.id, 0)
  }

  for (const row of rows) {
    for (const selectedId of row.selected_option_ids) {
      counts.set(selectedId, (counts.get(selectedId) ?? 0) + 1)
    }
  }

  const totalResponses = rows.length
  const results = vote.options.map((option) => {
    const votes = counts.get(option.id) ?? 0
    const percentage = totalResponses === 0 ? 0 : Math.round((votes / totalResponses) * 10000) / 100

    return {
      optionId: option.id,
      label: option.text,
      votes,
      percentage,
    }
  })

  return {
    voteId: vote.id,
    question: vote.question,
    results,
    updatedAt: vote.updated_at,
  }
}
