import { beforeEach, describe, expect, it, vi } from 'vitest'

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`)
})

vi.mock('next/navigation', () => ({
  redirect: (path: string) => redirectMock(path),
}))

vi.mock('@/lib/vote/service', () => ({
  createVote: vi.fn(),
  getVoteResultsByToken: vi.fn(),
}))

import { createVoteAction } from '../../app/votes/create/actions'
import { GET } from '../../app/api/votes/results/[token]/route'
import { createVote, getVoteResultsByToken } from '@/lib/vote/service'
import { TokenLookupError } from '@/lib/vote/validate'

describe('token results integration flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects create form flow to tokenized success screen', async () => {
    vi.mocked(createVote).mockResolvedValue({
      voteId: '550e8400-e29b-41d4-a716-446655440000',
      resultUrl: 'http://localhost:3000/results/token_abc1234567890',
      tokenExpiresAt: '2026-04-11T10:00:00.000Z',
    })

    const form = new FormData()
    form.set('question', 'Best language?')
    form.set('options', 'TypeScript\nPython')

    await expect(createVoteAction(form)).rejects.toThrow('NEXT_REDIRECT:/votes/create?created=1')
  })

  it('returns token results for valid token', async () => {
    vi.mocked(getVoteResultsByToken).mockResolvedValue({
      voteId: '550e8400-e29b-41d4-a716-446655440000',
      question: 'Best language?',
      results: [],
      updatedAt: '2026-03-13T10:00:00.000Z',
    })

    const response = await GET(new Request('http://localhost') as never, {
      params: Promise.resolve({ token: 'token_abc1234567890' }),
    })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.question).toBe('Best language?')
  })

  it('returns unavailable state for malformed token', async () => {
    vi.mocked(getVoteResultsByToken).mockRejectedValue(
      new TokenLookupError('malformed_token', 'Token format is invalid')
    )

    const response = await GET(new Request('http://localhost') as never, {
      params: Promise.resolve({ token: 'bad token' }),
    })

    expect(response.status).toBe(404)
  })
})
