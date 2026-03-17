import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ProtectedVoteClient } from '../../app/votes/[voteId]/protected-vote-client'

describe('password vote re-prompt integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('requires password prompt again after remount (refresh/reopen simulation)', async () => {
    const fetchMock = vi.fn()
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authenticated: true,
          unlockToken: 'unlock-token-1234567890',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '550e8400-e29b-41d4-a716-446655440000',
          question: 'Protected poll',
          options: [
            { id: '550e8400-e29b-41d4-a716-446655440001', text: 'A', order: 0 },
            { id: '550e8400-e29b-41d4-a716-446655440002', text: 'B', order: 1 },
          ],
          allowMultiple: false,
          isOpen: true,
        }),
      })

    vi.stubGlobal('fetch', fetchMock)

    const { unmount } = render(<ProtectedVoteClient voteId="550e8400-e29b-41d4-a716-446655440000" />)
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Verify password' }))

    await waitFor(() => {
      expect(screen.getByText('Options in this poll')).toBeInTheDocument()
    })

    unmount()
    render(<ProtectedVoteClient voteId="550e8400-e29b-41d4-a716-446655440000" />)

    expect(screen.getByText('Password required')).toBeInTheDocument()
    expect(screen.queryByText('Options in this poll')).not.toBeInTheDocument()
  })
})