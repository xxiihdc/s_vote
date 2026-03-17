import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/vote/service', () => ({
  submitVote: vi.fn(),
  getVoteById: vi.fn().mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000', requiresPassword: false }),
}))

import { POST } from '../../app/api/votes/[voteId]/responses/route'
import { submitVote } from '@/lib/vote/service'

describe('POST /api/votes/[voteId]/responses contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 201 with action=created for first submission', async () => {
    vi.mocked(submitVote).mockResolvedValue({
      action: 'created',
      voteId: '550e8400-e29b-41d4-a716-446655440000',
      selectedOptionIds: ['550e8400-e29b-41d4-a716-446655440001'],
    })

    const response = await POST(
      new Request('http://localhost/api/votes/550e8400-e29b-41d4-a716-446655440000/responses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          selectedOptionIds: ['550e8400-e29b-41d4-a716-446655440001'],
        }),
      }) as never,
      {
        params: Promise.resolve({ voteId: '550e8400-e29b-41d4-a716-446655440000' }),
      }
    )

    expect(response.status).toBe(201)
    expect(await response.json()).toMatchObject({ action: 'created' })
  })

  it('returns 200 with action=updated for changed selection', async () => {
    vi.mocked(submitVote).mockResolvedValue({
      action: 'updated',
      voteId: '550e8400-e29b-41d4-a716-446655440000',
      selectedOptionIds: ['550e8400-e29b-41d4-a716-446655440002'],
    })

    const response = await POST(
      new Request('http://localhost/api/votes/550e8400-e29b-41d4-a716-446655440000/responses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          selectedOptionIds: ['550e8400-e29b-41d4-a716-446655440002'],
        }),
      }) as never,
      {
        params: Promise.resolve({ voteId: '550e8400-e29b-41d4-a716-446655440000' }),
      }
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ action: 'updated' })
  })

  it('returns 200 with action=unchanged for same selection', async () => {
    vi.mocked(submitVote).mockResolvedValue({
      action: 'unchanged',
      voteId: '550e8400-e29b-41d4-a716-446655440000',
      selectedOptionIds: ['550e8400-e29b-41d4-a716-446655440001'],
    })

    const response = await POST(
      new Request('http://localhost/api/votes/550e8400-e29b-41d4-a716-446655440000/responses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          selectedOptionIds: ['550e8400-e29b-41d4-a716-446655440001'],
        }),
      }) as never,
      {
        params: Promise.resolve({ voteId: '550e8400-e29b-41d4-a716-446655440000' }),
      }
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ action: 'unchanged' })
  })

  it('returns 400 for invalid payload', async () => {
    const response = await POST(
      new Request('http://localhost/api/votes/550e8400-e29b-41d4-a716-446655440000/responses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          selectedOptionIds: [],
        }),
      }) as never,
      {
        params: Promise.resolve({ voteId: '550e8400-e29b-41d4-a716-446655440000' }),
      }
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('validation_error')
  })
})
