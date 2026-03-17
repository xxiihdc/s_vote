import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearPasswordFailureAttempts,
  clearPasswordRateLimitsForTest,
  createPasswordRateLimitKey,
  isPasswordRateLimited,
  registerPasswordFailureAttempt,
} from '@/lib/vote/password-rate-limit'

describe('password rate limit', () => {
  beforeEach(() => {
    clearPasswordRateLimitsForTest()
  })

  it('becomes limited after 5 failed attempts', () => {
    const key = createPasswordRateLimitKey('vote-id', 'ip-hash')

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      expect(registerPasswordFailureAttempt(key)).toBe(attempt)
    }

    expect(isPasswordRateLimited(key)).toBe(true)
  })

  it('clears failures after successful verification', () => {
    const key = createPasswordRateLimitKey('vote-id', 'ip-hash')
    registerPasswordFailureAttempt(key)
    registerPasswordFailureAttempt(key)

    clearPasswordFailureAttempts(key)
    expect(isPasswordRateLimited(key)).toBe(false)
  })
})