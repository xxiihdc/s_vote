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

describe('password protected vote page integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows password prompt and hides options list for protected vote', async () => {
    vi.mocked(getVoteById).mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
      question: 'Protected poll',
      options: [
        { id: '550e8400-e29b-41d4-a716-446655440001', text: 'A', order: 0 },
        { id: '550e8400-e29b-41d4-a716-446655440002', text: 'B', order: 1 },
      ],
      requiresPassword: true,
      allowMultiple: false,
      openTime: '2026-03-17T10:00:00.000Z',
      closeTime: null,
      isOpen: true,
      status: 'active',
    })

    const ui = await VotePage({ params: Promise.resolve({ voteId: '550e8400-e29b-41d4-a716-446655440000' }) })
    render(ui)

    expect(screen.getByText('Password required')).toBeInTheDocument()
    expect(screen.getByText('Options are shown after password verification for this page view.')).toBeInTheDocument()
    expect(screen.queryByText('A')).not.toBeInTheDocument()
  })
})