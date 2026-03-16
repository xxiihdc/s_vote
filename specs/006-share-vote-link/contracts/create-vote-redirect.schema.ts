import { z } from 'zod'

export const CreateVoteRedirectSearchParamsSchema = z.object({
  created: z.literal('1').optional(),
  voteUrl: z.string().url().optional(),
  resultUrl: z.string().url().optional(),
  tokenExpiresAt: z.string().datetime().optional(),
  error: z.string().optional(),
})

export type CreateVoteRedirectSearchParams = z.infer<typeof CreateVoteRedirectSearchParamsSchema>

export function hasCompleteCreatedLinks(input: CreateVoteRedirectSearchParams): boolean {
  return input.created === '1' && Boolean(input.voteUrl) && Boolean(input.resultUrl)
}
