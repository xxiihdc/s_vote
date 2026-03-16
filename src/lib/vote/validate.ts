import { ZodError } from 'zod'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import {
  CreateVoteRequestSchema,
  VoteSubmissionSchema,
  type CreateVoteRequest,
  type VoteOption,
  type VoteSubmission,
} from '@/types/contracts'
import { normalizeResultToken } from '@/lib/vote/token'

export interface VoteValidationError {
  error: 'validation_error'
  message: string
  details: Record<string, string[]>
}

export type TokenLookupErrorCode = 'malformed_token' | 'not_found' | 'expired' | 'unavailable'
export type VoteSubmitErrorCode =
  | 'vote_not_found'
  | 'vote_closed'
  | 'invalid_options'
  | 'missing_options'

export class TokenLookupError extends Error {
  code: TokenLookupErrorCode

  constructor(code: TokenLookupErrorCode, message: string) {
    super(message)
    this.name = 'TokenLookupError'
    this.code = code
  }
}

export class VoteSubmitError extends Error {
  code: VoteSubmitErrorCode

  constructor(code: VoteSubmitErrorCode, message: string) {
    super(message)
    this.name = 'VoteSubmitError'
    this.code = code
  }
}

export function parseCreateVotePayload(payload: unknown): CreateVoteRequest {
  return CreateVoteRequestSchema.parse(payload)
}

export function parseVoteSubmissionPayload(payload: unknown): VoteSubmission {
  return VoteSubmissionSchema.parse(payload)
}

export function parseVoteIdParam(voteId: string): string {
  return z.string().uuid('voteId must be a valid UUID').parse(voteId)
}

export function toVoteOptions(options: string[]): VoteOption[] {
  return options.map((raw, index) => ({
    id: randomUUID(),
    text: raw.trim(),
    order: index,
  }))
}

export function toValidationError(error: ZodError): VoteValidationError {
  const details = Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter(
      (entry): entry is [string, string[]] => Array.isArray(entry[1])
    )
  )

  return {
    error: 'validation_error',
    message: 'Request validation failed',
    details,
  }
}

export function parseTokenParam(token: string): string {
  const normalized = normalizeResultToken(token)

  if (!normalized) {
    throw new TokenLookupError('malformed_token', 'Token format is invalid')
  }

  return normalized
}

export function toTokenLookupResponse(error: TokenLookupError): { status: number; body: { error: string; message: string } } {
  switch (error.code) {
    case 'expired':
      return {
        status: 410,
        body: {
          error: 'token_expired',
          message: 'Result link is no longer available',
        },
      }
    case 'malformed_token':
    case 'not_found':
    case 'unavailable':
    default:
      return {
        status: 404,
        body: {
          error: 'not_found',
          message: 'Result link is not available',
        },
      }
  }
}

export function toVoteSubmitResponse(error: VoteSubmitError): { status: number; body: { error: string; message: string } } {
  switch (error.code) {
    case 'vote_not_found':
      return {
        status: 404,
        body: {
          error: 'vote_not_found',
          message: 'Vote not found',
        },
      }
    case 'vote_closed':
      return {
        status: 422,
        body: {
          error: 'vote_closed',
          message: 'Voting has ended for this poll',
        },
      }
    case 'invalid_options':
      return {
        status: 422,
        body: {
          error: 'invalid_options',
          message: 'One or more selected options do not belong to this poll',
        },
      }
    case 'missing_options':
    default:
      return {
        status: 422,
        body: {
          error: 'missing_options',
          message: 'At least one option must be selected',
        },
      }
  }
}
