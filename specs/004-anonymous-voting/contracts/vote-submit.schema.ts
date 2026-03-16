import { z } from 'zod'

// ---- Vote Submission ----

export const VoteSubmissionSchema = z.object({
  selectedOptionIds: z
    .array(z.string().uuid('each selectedOptionId must be a valid UUID'))
    .min(1, 'at least one option must be selected'),
})

export type VoteSubmission = z.infer<typeof VoteSubmissionSchema>

// ---- Vote Submission Response ----

export const VoteSubmissionActionSchema = z.enum(['created', 'updated', 'unchanged'])

export type VoteSubmissionAction = z.infer<typeof VoteSubmissionActionSchema>

export const VoteSubmissionResponseSchema = z.object({
  action: VoteSubmissionActionSchema,
  voteId: z.string().uuid(),
  selectedOptionIds: z.array(z.string().uuid()).min(1),
})

export type VoteSubmissionResponse = z.infer<typeof VoteSubmissionResponseSchema>

// ---- Vote Submission Error ----

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
