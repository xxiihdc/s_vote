import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearVoteUnlockSessionsForTest,
  issueVoteUnlockToken,
  validateVoteUnlockToken,
} from '@/lib/vote/password-access'

describe('password access unlock tokens', () => {
  beforeEach(() => {
    clearVoteUnlockSessionsForTest()
    vi.useRealTimers()
    process.env.VOTE_UNLOCK_TOKEN_TTL_MS = '5000'
  })

  it('validates issued token for matching vote id', () => {
    const voteId = '550e8400-e29b-41d4-a716-446655440000'
    const token = issueVoteUnlockToken(voteId)

    expect(validateVoteUnlockToken(voteId, token.token)).toBe(true)
    expect(validateVoteUnlockToken('550e8400-e29b-41d4-a716-446655440001', token.token)).toBe(false)
  })

  it('expires token after ttl', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-17T10:00:00.000Z'))

    const voteId = '550e8400-e29b-41d4-a716-446655440000'
    const token = issueVoteUnlockToken(voteId)

    expect(validateVoteUnlockToken(voteId, token.token)).toBe(true)
    vi.setSystemTime(new Date('2026-03-17T10:00:06.000Z'))
    expect(validateVoteUnlockToken(voteId, token.token)).toBe(false)
  })
})