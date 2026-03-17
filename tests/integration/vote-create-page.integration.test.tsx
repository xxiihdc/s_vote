import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React, { createElement, type ReactNode } from 'react'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) =>
    createElement('a', { href, ...props }, children),
}))

import CreateVotePage from '../../app/votes/create/page'
import { CreateVoteForm } from '../../app/votes/create/create-vote-form'

describe('create vote page integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders both voting and result links for complete created state', async () => {
    const ui = await CreateVotePage({
      searchParams: Promise.resolve({
        created: '1',
        voteUrl: 'http://localhost:3000/votes/550e8400-e29b-41d4-a716-446655440000',
        resultUrl: 'http://localhost:3000/results/token_abc1234567890',
        tokenExpiresAt: '2026-04-11T10:00:00.000Z',
      }),
    })

    render(ui)

    expect(screen.getByLabelText('Voting URL (share with voters)')).toHaveValue(
      'http://localhost:3000/votes/550e8400-e29b-41d4-a716-446655440000'
    )
    expect(screen.getByLabelText('Result URL')).toHaveValue('http://localhost:3000/results/token_abc1234567890')
    expect(screen.getByRole('link', { name: 'Open voting page' })).toHaveAttribute(
      'href',
      'http://localhost:3000/votes/550e8400-e29b-41d4-a716-446655440000'
    )
    expect(screen.getByRole('link', { name: 'Open result page' })).toHaveAttribute(
      'href',
      'http://localhost:3000/results/token_abc1234567890'
    )
    expect(screen.getByRole('button', { name: 'Copy voting URL' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy result URL' })).toBeInTheDocument()
  })

  it('shows generic share-link error and hides success panel when created metadata is incomplete', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const ui = await CreateVotePage({
      searchParams: Promise.resolve({
        created: '1',
        resultUrl: 'http://localhost:3000/results/token_abc1234567890',
      }),
    })

    render(ui)

    expect(screen.queryByLabelText('Voting URL (share with voters)')).not.toBeInTheDocument()
    expect(screen.queryByText('Vote created successfully.')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load share links.')
    expect(warnSpy).toHaveBeenCalledWith('vote.create.share_links.incomplete', {
      hasVoteUrl: false,
      hasResultUrl: true,
    })
  })

  it('keeps invalid input error behavior unchanged', async () => {
    const ui = await CreateVotePage({
      searchParams: Promise.resolve({
        error: 'invalid_input',
      }),
    })

    render(ui)

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to create vote. Please verify your input.')
  })

  it('renders field-level errors and preserves submitted values from action state', () => {
    render(
      <CreateVoteForm
        initialState={{
          message: 'Unable to create vote. Please correct the highlighted fields.',
          errors: {
            question: ['String must contain at least 3 character(s)'],
            options: ['Array must contain at least 2 element(s)'],
            closeTime: ['closeTime must be after openTime'],
            password: ['password required when requiresPassword is true'],
          },
          values: {
            question: 'Hi',
            options: 'Only one option',
            openTime: '2026-03-17T09:00',
            closeTime: '2026-03-17T08:00',
            expirationDays: '12',
            allowMultiple: true,
            requiresPassword: true,
          },
          submissionId: 'failed-submit-1',
        }}
      />
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to create vote. Please correct the highlighted fields.')
    expect(screen.getByLabelText('Question')).toHaveValue('Hi')
    expect(screen.getByLabelText('Options (one per line)')).toHaveValue('Only one option')
    expect(screen.getByLabelText('Open time (optional)')).toHaveValue('2026-03-17T09:00')
    expect(screen.getByLabelText('Close time (optional)')).toHaveValue('2026-03-17T08:00')
    expect(screen.getByLabelText('Expiration days (1-30)')).toHaveValue(12)
    expect(screen.getByLabelText('Allow multiple selections')).toBeChecked()
    expect(screen.getByLabelText('Require password for voters')).toBeChecked()
    expect(screen.getByLabelText('Password')).toHaveValue('')
    expect(screen.getByText('String must contain at least 3 character(s)')).toBeInTheDocument()
    expect(screen.getByText('Array must contain at least 2 element(s)')).toBeInTheDocument()
    expect(screen.getByText('closeTime must be after openTime')).toBeInTheDocument()
    expect(screen.getByText('password required when requiresPassword is true')).toBeInTheDocument()
  })
})
