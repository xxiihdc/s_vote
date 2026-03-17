import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearVoteUnlockSessionsForTest, issueVoteUnlockToken } from '@/lib/vote/password-access'

vi.mock('@/lib/vote/service', () => ({
  getVoteById: vi.fn(),
}))

import { GET } from '../../app/api/votes/[voteId]/route'
import { getVoteById } from '@/lib/vote/service'

const voteId = '550e8400-e29b-41d4-a716-446655440000'

describe('GET /api/votes/[voteId] access contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearVoteUnlockSessionsForTest()
  })

  it('returns vote payload for public vote without token', async () => {
    vi.mocked(getVoteById).mockResolvedValue({
      id: voteId,
      question: 'Best framework?',
      options: [],
      requiresPassword: false,
      allowMultiple: false,
      openTime: '2026-03-17T10:00:00.000Z',
      closeTime: null,
      isOpen: true,
      status: 'active',
    })

    const response = await GET(
      new Request(`http://localhost/api/votes/${voteId}`),
      { params: Promise.resolve({ voteId }) }
    )

    expect(response.status).toBe(200)
    expect((await response.json()).id).toBe(voteId)
  })

  it('returns 403 for protected vote without unlock token', async () => {
    vi.mocked(getVoteById).mockResolvedValue({
      id: voteId,
      question: 'Protected',
      options: [],
      requiresPassword: true,
      allowMultiple: false,
      openTime: '2026-03-17T10:00:00.000Z',
      closeTime: null,
      isOpen: true,
      status: 'active',
    })

    const response = await GET(
      new Request(`http://localhost/api/votes/${voteId}`),
      { params: Promise.resolve({ voteId }) }
    )

    expect(response.status).toBe(403)
    expect((await response.json()).error).toBe('vote_protected')
  })

  it('returns 200 for protected vote with valid unlock token', async () => {
    vi.mocked(getVoteById).mockResolvedValue({
      id: voteId,
      question: 'Protected',
      options: [],
      requiresPassword: true,
      allowMultiple: false,
      openTime: '2026-03-17T10:00:00.000Z',
      closeTime: null,
      isOpen: true,
      status: 'active',
    })

    const unlock = issueVoteUnlockToken(voteId)
    const response = await GET(
      new Request(`http://localhost/api/votes/${voteId}`, {
        headers: {
          'x-vote-unlock-token': unlock.token,
        },
      }),
      { params: Promise.resolve({ voteId }) }
    )

    expect(response.status).toBe(200)
  })
})