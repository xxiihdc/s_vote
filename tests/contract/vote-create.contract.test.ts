import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/lib/vote/service', () => ({
  createVote: vi.fn(),
}))

import { POST } from '../../app/api/votes/route'
import { createVote } from '@/lib/vote/service'

describe('POST /api/votes contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 201 with vote payload for valid request', async () => {
    vi.mocked(createVote).mockResolvedValue({
      voteId: '550e8400-e29b-41d4-a716-446655440000',
      resultUrl: 'http://localhost:3000/results/token_abc1234567890',
      tokenExpiresAt: '2026-04-11T10:00:00.000Z',
    })

    const response = await POST(
      new Request('http://localhost/api/votes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question: 'Best language?',
          options: ['TypeScript', 'Python'],
        }),
      }) as never
    )

    expect(response.status).toBe(201)
    const json = await response.json()
    expect(json.resultUrl).toContain('/results/')
    expect(json.voteId).toBe('550e8400-e29b-41d4-a716-446655440000')
  })

  it('returns 400 for invalid payload', async () => {
    const response = await POST(
      new Request('http://localhost/api/votes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question: 'ab',
          options: ['Only one'],
        }),
      }) as never
    )

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('validation_error')
  })
})
