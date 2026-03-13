import { describe, expect, it } from 'vitest'
import { compareResultToken, generateResultToken, hashResultToken, normalizeResultToken } from '@/lib/vote/token'

describe('vote token helpers', () => {
  it('generates an unguessable token', () => {
    const token = generateResultToken()
    expect(token.length).toBeGreaterThan(16)
    expect(normalizeResultToken(token)).toBe(token)
  })

  it('hashes and compares token consistently', () => {
    const token = 'token_abc1234567890'
    const hash = hashResultToken(token)

    expect(compareResultToken(token, hash)).toBe(true)
    expect(compareResultToken('token_other1234567890', hash)).toBe(false)
  })

  it('rejects malformed token characters', () => {
    expect(normalizeResultToken('bad token with spaces')).toBeNull()
  })
})
