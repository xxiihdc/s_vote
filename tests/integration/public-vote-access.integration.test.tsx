import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) =>
    createElement('a', { href, ...props }, children),
}))

vi.mock('@/lib/vote/service', () => ({
  getVoteById: vi.fn(),
}))

import VotePage from '../../app/votes/[voteId]/page'
import { getVoteById } from '@/lib/vote/service'

describe('public vote access integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders options and submit flow without password prompt for public vote', async () => {
    vi.mocked(getVoteById).mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
      question: 'Public poll',
      options: [
        { id: '550e8400-e29b-41d4-a716-446655440001', text: 'TypeScript', order: 0 },
        { id: '550e8400-e29b-41d4-a716-446655440002', text: 'Python', order: 1 },
      ],
      requiresPassword: false,
      allowMultiple: false,
      openTime: '2026-03-17T10:00:00.000Z',
      closeTime: null,
      isOpen: true,
      status: 'active',
    })

    const ui = await VotePage({ params: Promise.resolve({ voteId: '550e8400-e29b-41d4-a716-446655440000' }) })
    render(ui)

    expect(screen.queryByText('Password required')).not.toBeInTheDocument()
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Submit vote' })).toBeInTheDocument()
  })
})