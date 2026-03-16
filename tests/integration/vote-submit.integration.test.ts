import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/vote/service', () => ({
  submitVote: vi.fn(),
}))

import { POST } from '../../app/api/votes/[voteId]/responses/route'
import { submitVote } from '@/lib/vote/service'

describe('anonymous vote submission integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits first vote anonymously and returns created action', async () => {
    vi.mocked(submitVote).mockResolvedValue({
      action: 'created',
      voteId: '550e8400-e29b-41d4-a716-446655440000',
      selectedOptionIds: ['550e8400-e29b-41d4-a716-446655440001'],
    })

    const response = await POST(
      new Request('http://localhost/api/votes/550e8400-e29b-41d4-a716-446655440000/responses', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.10',
        },
        body: JSON.stringify({
          selectedOptionIds: ['550e8400-e29b-41d4-a716-446655440001'],
        }),
      }) as never,
      {
        params: Promise.resolve({ voteId: '550e8400-e29b-41d4-a716-446655440000' }),
      }
    )

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.action).toBe('created')
    expect(response.headers.get('x-correlation-id')).toBeTruthy()
  })

  it.todo('updates vote on second submission from same IP')
  it.todo('returns unchanged when same selection is re-submitted')
  it.todo('rejects submission when poll is closed')
  it.todo('rejects option IDs that do not belong to vote')
})
