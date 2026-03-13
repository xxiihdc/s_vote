import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/vote/service', () => ({
  createVote: vi.fn(),
  getVoteResultsByToken: vi.fn(),
}))

import { POST } from '../../app/api/votes/route'
import { GET } from '../../app/api/votes/results/[token]/route'
import { createVote, getVoteResultsByToken } from '@/lib/vote/service'
import { TokenLookupError } from '@/lib/vote/validate'

describe('token-result API contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns tokenized response for POST /api/votes', async () => {
    vi.mocked(createVote).mockResolvedValue({
      voteId: '550e8400-e29b-41d4-a716-446655440000',
      resultUrl: 'http://localhost:3000/results/token_abc1234567890',
      tokenExpiresAt: '2026-04-11T10:00:00.000Z',
    })

    const response = await POST(
      new Request('http://localhost/api/votes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: 'Best language?', options: ['TypeScript', 'Python'] }),
      }) as never
    )

    expect(response.status).toBe(201)
    const json = await response.json()
    expect(json.voteId).toBeTruthy()
    expect(json.resultUrl).toContain('/results/')
    expect(json.tokenExpiresAt).toBeTruthy()
  })

  it('returns results payload for valid token', async () => {
    vi.mocked(getVoteResultsByToken).mockResolvedValue({
      voteId: '550e8400-e29b-41d4-a716-446655440000',
      question: 'Best language?',
      results: [
        {
          optionId: '550e8400-e29b-41d4-a716-446655440001',
          label: 'TypeScript',
          votes: 5,
          percentage: 62.5,
        },
      ],
      updatedAt: '2026-03-13T10:00:00.000Z',
    })

    const response = await GET(new Request('http://localhost') as never, {
      params: Promise.resolve({ token: 'token_abc1234567890' }),
    })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.results[0].votes).toBe(5)
  })

  it('returns 404 for unknown token', async () => {
    vi.mocked(getVoteResultsByToken).mockRejectedValue(
      new TokenLookupError('not_found', 'Token does not match any vote')
    )

    const response = await GET(new Request('http://localhost') as never, {
      params: Promise.resolve({ token: 'token_abc1234567890' }),
    })

    expect(response.status).toBe(404)
  })

  it('returns 410 for expired token', async () => {
    vi.mocked(getVoteResultsByToken).mockRejectedValue(
      new TokenLookupError('expired', 'Token is expired')
    )

    const response = await GET(new Request('http://localhost') as never, {
      params: Promise.resolve({ token: 'token_abc1234567890' }),
    })

    expect(response.status).toBe(410)
  })
})
