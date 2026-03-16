import { describe, expect, it } from 'vitest'
import { buildResultUrl, buildVoteUrl, getCanonicalAppUrl } from '@/lib/vote/token'

describe('token URL generation', () => {
  it('builds stable result URL path from token', () => {
    const resultUrl = buildResultUrl('token_abc1234567890')
    expect(resultUrl).toContain('/results/token_abc1234567890')
  })

  it('builds vote URL path from vote id', () => {
    const voteUrl = buildVoteUrl('550e8400-e29b-41d4-a716-446655440000')
    expect(voteUrl).toContain('/votes/550e8400-e29b-41d4-a716-446655440000')
  })

  it('uses APP_URL as canonical origin and trims trailing slash', () => {
    const previousAppUrl = process.env.APP_URL
    process.env.APP_URL = 'https://vote.example.com/'

    expect(getCanonicalAppUrl()).toBe('https://vote.example.com')
    expect(buildVoteUrl('550e8400-e29b-41d4-a716-446655440000')).toBe(
      'https://vote.example.com/votes/550e8400-e29b-41d4-a716-446655440000'
    )
    expect(buildResultUrl('token_abc1234567890')).toBe('https://vote.example.com/results/token_abc1234567890')

    if (previousAppUrl === undefined) {
      delete process.env.APP_URL
    } else {
      process.env.APP_URL = previousAppUrl
    }
  })
})
