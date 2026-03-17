import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hashVotePassword } from '@/lib/vote/password'
import { clearPasswordRateLimitsForTest } from '@/lib/vote/password-rate-limit'
import { clearVoteUnlockSessionsForTest } from '@/lib/vote/password-access'

vi.mock('@/lib/vote/service', () => ({
  getVoteAccessGuard: vi.fn(),
  getVoteById: vi.fn(),
  getExistingVoteResponse: vi.fn().mockResolvedValue(null),
}))

import { POST } from '../../app/api/votes/[voteId]/verify-password/route'
import { getExistingVoteResponse, getVoteAccessGuard, getVoteById } from '@/lib/vote/service'

const voteId = '550e8400-e29b-41d4-a716-446655440000'

describe('POST /api/votes/[voteId]/verify-password contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearPasswordRateLimitsForTest()
    clearVoteUnlockSessionsForTest()
    vi.mocked(getExistingVoteResponse).mockResolvedValue(null)
  })

  it('returns unlock token when password is valid', async () => {
    vi.mocked(getVoteAccessGuard).mockResolvedValue({
      id: voteId,
      status: 'active',
      expires_at: '2099-03-17T10:00:00.000Z',
      requires_password: true,
      password_hash: hashVotePassword('correct-password'),
    })
    vi.mocked(getVoteById).mockResolvedValue({
      id: voteId,
      question: 'Protected poll',
      options: [
        { id: '550e8400-e29b-41d4-a716-446655440001', text: 'A', order: 0 },
        { id: '550e8400-e29b-41d4-a716-446655440002', text: 'B', order: 1 },
      ],
      requiresPassword: true,
      allowMultiple: false,
      openTime: new Date('2026-03-17T10:00:00.000Z'),
      closeTime: null,
      isOpen: true,
      status: 'active',
      expiresAt: new Date('2099-03-17T10:00:00.000Z'),
    })

    const response = await POST(
      new Request(`http://localhost/api/votes/${voteId}/verify-password`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.10',
        },
        body: JSON.stringify({ password: 'correct-password' }),
      }) as never,
      { params: Promise.resolve({ voteId }) }
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.authenticated).toBe(true)
    expect(body.unlockToken).toBeTypeOf('string')
    expect(body.unlockToken.length).toBeGreaterThan(15)
    expect(body.vote?.id).toBe(voteId)
    expect(body.vote?.previouslySelectedOptionIds).toBeNull()
  })

  it('returns previous selection when current device already voted', async () => {
    vi.mocked(getVoteAccessGuard).mockResolvedValue({
      id: voteId,
      status: 'active',
      expires_at: '2099-03-17T10:00:00.000Z',
      requires_password: true,
      password_hash: hashVotePassword('correct-password'),
    })
    vi.mocked(getVoteById).mockResolvedValue({
      id: voteId,
      question: 'Protected poll',
      options: [
        { id: '550e8400-e29b-41d4-a716-446655440001', text: 'A', order: 0 },
        { id: '550e8400-e29b-41d4-a716-446655440002', text: 'B', order: 1 },
      ],
      requiresPassword: true,
      allowMultiple: false,
      openTime: new Date('2026-03-17T10:00:00.000Z'),
      closeTime: null,
      isOpen: true,
      status: 'active',
      expiresAt: new Date('2099-03-17T10:00:00.000Z'),
    })
    vi.mocked(getExistingVoteResponse).mockResolvedValue(['550e8400-e29b-41d4-a716-446655440002'])

    const response = await POST(
      new Request(`http://localhost/api/votes/${voteId}/verify-password`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.10',
        },
        body: JSON.stringify({ password: 'correct-password' }),
      }) as never,
      { params: Promise.resolve({ voteId }) }
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.vote?.previouslySelectedOptionIds).toEqual(['550e8400-e29b-41d4-a716-446655440002'])
  })

  it('returns 401 for invalid password', async () => {
    vi.mocked(getVoteAccessGuard).mockResolvedValue({
      id: voteId,
      status: 'active',
      expires_at: '2099-03-17T10:00:00.000Z',
      requires_password: true,
      password_hash: hashVotePassword('correct-password'),
    })

    const response = await POST(
      new Request(`http://localhost/api/votes/${voteId}/verify-password`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.10',
        },
        body: JSON.stringify({ password: 'wrong-password' }),
      }) as never,
      { params: Promise.resolve({ voteId }) }
    )

    expect(response.status).toBe(401)
    expect((await response.json()).authenticated).toBe(false)
  })

  it('returns 429 after too many failed attempts', async () => {
    vi.mocked(getVoteAccessGuard).mockResolvedValue({
      id: voteId,
      status: 'active',
      expires_at: '2099-03-17T10:00:00.000Z',
      requires_password: true,
      password_hash: hashVotePassword('correct-password'),
    })

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await POST(
        new Request(`http://localhost/api/votes/${voteId}/verify-password`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': '203.0.113.10',
          },
          body: JSON.stringify({ password: 'wrong-password' }),
        }) as never,
        { params: Promise.resolve({ voteId }) }
      )
    }

    const limited = await POST(
      new Request(`http://localhost/api/votes/${voteId}/verify-password`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.10',
        },
        body: JSON.stringify({ password: 'wrong-password' }),
      }) as never,
      { params: Promise.resolve({ voteId }) }
    )

    expect(limited.status).toBe(429)
    expect((await limited.json()).authenticated).toBe(false)
  })
})