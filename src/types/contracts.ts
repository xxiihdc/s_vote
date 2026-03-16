/**
 * Shared TypeScript contracts for frontend bootstrap, health checks,
 * and Edge Function API payloads.
 */
import { z } from 'zod'

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

// ---- Vote domain contracts ----

export const VoteOptionSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1).max(500),
  order: z.number().int().nonnegative(),
})

export type VoteOption = z.infer<typeof VoteOptionSchema>

export const VoteSchema = z.object({
  id: z.string().uuid(),
  question: z.string().min(3).max(1000),
  options: z.array(VoteOptionSchema).min(2).max(50),
  openTime: z.coerce.date(),
  closeTime: z.coerce.date().nullable(),
  requiresPassword: z.boolean(),
  allowMultiple: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  shareUrl: z.string(),
  creatorUserId: z.string().uuid().nullable(),
  status: z.enum(['active', 'closed', 'expired']),
})

export type Vote = z.infer<typeof VoteSchema>

export const VotePublicSchema = VoteSchema.omit({
  creatorUserId: true,
})

export type VotePublic = z.infer<typeof VotePublicSchema>

export const VoteResponseSchema = z.object({
  id: z.string().uuid(),
  voteId: z.string().uuid(),
  selectedOptionIds: z.array(z.string().uuid()).min(1),
  submittedAt: z.coerce.date(),
  voterFingerprint: z.string().max(255),
})

export type VoteResponse = z.infer<typeof VoteResponseSchema>

export const CreateVoteRequestSchema = z
  .object({
    question: z.string().min(3).max(1000),
    options: z.array(z.string().min(1).max(500)).min(2).max(50),
    openTime: z.coerce.date().optional(),
    closeTime: z.coerce.date().nullable().optional(),
    requiresPassword: z.boolean().default(false),
    password: z.string().max(255).optional(),
    allowMultiple: z.boolean().default(false),
    expirationDays: z.number().int().min(1).max(30).default(30),
  })
  .refine((data) => data.closeTime == null || data.closeTime > (data.openTime ?? new Date()), {
    message: 'closeTime must be after openTime',
    path: ['closeTime'],
  })
  .refine((data) => !data.requiresPassword || Boolean(data.password?.trim()), {
    message: 'password required when requiresPassword is true',
    path: ['password'],
  })

export type CreateVoteRequest = z.infer<typeof CreateVoteRequestSchema>

export const CreateVoteResponseSchema = z.object({
  voteId: z.string().uuid(),
  resultUrl: z.string(),
  tokenExpiresAt: z.string().datetime(),
})

export type CreateVoteResponse = z.infer<typeof CreateVoteResponseSchema>

export const CreateVoteRedirectSearchParamsSchema = z.object({
  created: z.literal('1').optional(),
  voteUrl: z.string().url().optional(),
  resultUrl: z.string().url().optional(),
  tokenExpiresAt: z.string().datetime().optional(),
  error: z.string().optional(),
})

export type CreateVoteRedirectSearchParams = z.infer<typeof CreateVoteRedirectSearchParamsSchema>

export function hasCompleteCreatedLinks(input: Partial<CreateVoteRedirectSearchParams>): boolean {
  if (input.created !== '1') {
    return false
  }

  const result = z
    .object({
      created: z.literal('1'),
      voteUrl: z.string().url(),
      resultUrl: z.string().url(),
    })
    .safeParse({
      created: input.created,
      voteUrl: input.voteUrl,
      resultUrl: input.resultUrl,
    })

  return result.success
}

export const TokenResultItemSchema = z.object({
  optionId: z.string().uuid(),
  label: z.string().min(1).max(300),
  votes: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
})

export type TokenResultItem = z.infer<typeof TokenResultItemSchema>

export const TokenResultsResponseSchema = z.object({
  voteId: z.string().uuid(),
  question: z.string().min(1).max(1000),
  results: z.array(TokenResultItemSchema),
  updatedAt: z.string().datetime(),
})

export type TokenResultsResponse = z.infer<typeof TokenResultsResponseSchema>

export const VoteSubmissionSchema = z.object({
  selectedOptionIds: z.array(z.string().uuid()).min(1),
})

export type VoteSubmission = z.infer<typeof VoteSubmissionSchema>

export const VoteSubmissionActionSchema = z.enum(['created', 'updated', 'unchanged'])

export type VoteSubmissionAction = z.infer<typeof VoteSubmissionActionSchema>

export const VoteSubmissionResponseSchema = z.object({
  action: VoteSubmissionActionSchema,
  voteId: z.string().uuid(),
  selectedOptionIds: z.array(z.string().uuid()).min(1),
})

export type VoteSubmissionResponse = z.infer<typeof VoteSubmissionResponseSchema>

export const VoteSubmissionErrorSchema = z.object({
  error: z.enum([
    'vote_not_found',
    'vote_closed',
    'invalid_options',
    'missing_options',
    'validation_error',
    'internal_error',
  ]),
  message: z.string(),
})

export type VoteSubmissionError = z.infer<typeof VoteSubmissionErrorSchema>

export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
  timestamp: z.coerce.date().optional(),
})

export type ApiError = z.infer<typeof ApiErrorSchema>
