import { beforeEach, describe, expect, it, vi } from 'vitest'

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`)
})

vi.mock('next/navigation', () => ({
  redirect: (path: string) => redirectMock(path),
}))

vi.mock('@/lib/vote/service', () => ({
  createVote: vi.fn(),
  getVoteById: vi.fn(),
}))

import { createVoteAction } from '../../app/votes/create/actions'
import { initialCreateVoteFormState } from '../../app/votes/create/form-state'
import { createVote, getVoteById } from '@/lib/vote/service'
import { GET } from '../../app/api/votes/[voteId]/route'

describe('create vote integration flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to vote page when server action succeeds', async () => {
    vi.mocked(createVote).mockResolvedValue({
      voteId: '550e8400-e29b-41d4-a716-446655440000',
      resultUrl: 'http://localhost:3000/results/token_abc1234567890',
      tokenExpiresAt: '2026-04-11T10:00:00.000Z',
    })

    const form = new FormData()
    form.set('question', 'Best language?')
    form.set('options', 'TypeScript\nPython')

    try {
      await createVoteAction(initialCreateVoteFormState, form)
      throw new Error('Expected redirect to be thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      const message = (error as Error).message
      expect(message).toBe(
        'NEXT_REDIRECT:/votes/create?created=1&voteUrl=http%3A%2F%2Flocalhost%3A3000%2Fvotes%2F550e8400-e29b-41d4-a716-446655440000&resultUrl=http%3A%2F%2Flocalhost%3A3000%2Fresults%2Ftoken_abc1234567890&tokenExpiresAt=2026-04-11T10%3A00%3A00.000Z'
      )

      const redirectUrl = message.replace('NEXT_REDIRECT:', '')
      const search = redirectUrl.split('?')[1] ?? ''
      const params = new URLSearchParams(search)
      const voteUrl = params.get('voteUrl')

      expect(voteUrl).toBe('http://localhost:3000/votes/550e8400-e29b-41d4-a716-446655440000')
      expect(voteUrl).not.toContain('/results/')
      expect(voteUrl).not.toContain('token_abc1234567890')
    }
  })

  it('returns field-level validation state for invalid submissions', async () => {
    const form = new FormData()
    form.set('question', 'Hi')
    form.set('options', 'Only one option')
    form.set('openTime', '2026-03-17T09:00')
    form.set('closeTime', '2026-03-17T08:00')
    form.set('requiresPassword', 'on')
    form.set('password', '')
    form.set('expirationDays', '31')
    form.set('allowMultiple', 'on')

    const result = await createVoteAction(initialCreateVoteFormState, form)

    expect(result).toMatchObject({
      message: 'Unable to create vote. Please correct the highlighted fields.',
      values: {
        question: 'Hi',
        options: 'Only one option',
        openTime: '2026-03-17T09:00',
        closeTime: '2026-03-17T08:00',
        expirationDays: '31',
        allowMultiple: true,
        requiresPassword: true,
      },
    })
    expect(result?.errors.question).toContain('String must contain at least 3 character(s)')
    expect(result?.errors.options).toContain('Array must contain at least 2 element(s)')
    expect(result?.errors.closeTime).toContain('closeTime must be after openTime')
    expect(result?.errors.password).toContain('password required when requiresPassword is true')
    expect(result?.errors.expirationDays).toContain('Number must be less than or equal to 30')
  })

  it('returns generic form error state for unexpected failures', async () => {
    vi.mocked(createVote).mockRejectedValue(new Error('database unavailable'))

    const form = new FormData()
    form.set('question', 'Best language?')
    form.set('options', 'TypeScript\nPython')
    form.set('requiresPassword', 'on')
    form.set('password', 'top-secret')

    const result = await createVoteAction(initialCreateVoteFormState, form)

    expect(result).toMatchObject({
      message: 'Unable to create vote right now. Please try again.',
      errors: {},
      values: {
        question: 'Best language?',
        options: 'TypeScript\nPython',
        openTime: '',
        closeTime: '',
        expirationDays: '30',
        allowMultiple: false,
        requiresPassword: true,
      },
    })
  })

  it('returns vote details from GET /api/votes/[voteId]', async () => {
    vi.mocked(getVoteById).mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
      question: 'Best language?',
      options: [{ id: '1f26ce6b-89e4-4a54-a4a5-2f0185a7d2f8', text: 'TypeScript', order: 0 }],
      requiresPassword: false,
      allowMultiple: false,
      openTime: '2026-03-12T10:00:00.000Z',
      closeTime: null,
      isOpen: true,
      status: 'active',
    })

    const response = await GET(new Request('http://localhost') as never, {
      params: Promise.resolve({ voteId: '550e8400-e29b-41d4-a716-446655440000' }),
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.id).toBe('550e8400-e29b-41d4-a716-446655440000')
    expect(body.requiresPassword).toBe(false)
  })
})
