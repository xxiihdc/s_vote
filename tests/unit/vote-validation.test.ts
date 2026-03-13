import { describe, expect, it } from 'vitest'
import { CreateVoteRequestSchema } from '@/types/contracts'
import { getVoteTimingState } from '@/lib/vote/timing'
import { parseTokenParam, TokenLookupError } from '@/lib/vote/validate'

describe('vote validation schema', () => {
  it('accepts valid create vote payload', () => {
    const result = CreateVoteRequestSchema.safeParse({
      question: 'Best language?',
      options: ['TypeScript', 'Python'],
      requiresPassword: false,
      allowMultiple: false,
      expirationDays: 7,
    })

    expect(result.success).toBe(true)
  })

  it('rejects payload with fewer than 2 options', () => {
    const result = CreateVoteRequestSchema.safeParse({
      question: 'Best language?',
      options: ['TypeScript'],
    })

    expect(result.success).toBe(false)
  })
})

describe('vote timing rules', () => {
  it('returns open state when now is within window', () => {
    const now = new Date('2026-03-12T10:00:00Z')
    const state = getVoteTimingState({
      now,
      openTime: new Date('2026-03-12T09:00:00Z'),
      closeTime: new Date('2026-03-12T11:00:00Z'),
    })

    expect(state).toEqual({ isOpen: true })
  })

  it('returns closed state after close time', () => {
    const state = getVoteTimingState({
      now: new Date('2026-03-12T12:00:00Z'),
      openTime: new Date('2026-03-12T09:00:00Z'),
      closeTime: new Date('2026-03-12T11:00:00Z'),
    })

    expect(state).toEqual({ isOpen: false, reason: 'closed' })
  })
})

describe('token lookup validation', () => {
  it('accepts normalized token input', () => {
    expect(parseTokenParam('token_abc1234567890')).toBe('token_abc1234567890')
  })

  it('rejects malformed token input', () => {
    expect(() => parseTokenParam('bad token')).toThrow(TokenLookupError)
  })
})
