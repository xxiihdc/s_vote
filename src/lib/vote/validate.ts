import { ZodError } from 'zod'
import { randomUUID } from 'crypto'
import { CreateVoteRequestSchema, type CreateVoteRequest, type VoteOption } from '@/types/contracts'
import { normalizeResultToken } from '@/lib/vote/token'

export interface VoteValidationError {
  error: 'validation_error'
  message: string
  details: Record<string, string[]>
}

export type TokenLookupErrorCode = 'malformed_token' | 'not_found' | 'expired' | 'unavailable'

export class TokenLookupError extends Error {
  code: TokenLookupErrorCode

  constructor(code: TokenLookupErrorCode, message: string) {
    super(message)
    this.name = 'TokenLookupError'
    this.code = code
  }
}

export function parseCreateVotePayload(payload: unknown): CreateVoteRequest {
  return CreateVoteRequestSchema.parse(payload)
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
