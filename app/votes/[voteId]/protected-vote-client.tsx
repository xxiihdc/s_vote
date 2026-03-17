'use client'

import React from 'react'
import { useState } from 'react'
import type { VoteOption } from '@/types/contracts'
import { VoteForm } from './vote-form'
import { PasswordForm } from './password-form'

interface ProtectedVoteResponse {
  id: string
  question: string
  options: VoteOption[]
  allowMultiple: boolean
  isOpen: boolean
}

interface ProtectedVoteClientProps {
  voteId: string
}

export function ProtectedVoteClient({ voteId }: ProtectedVoteClientProps) {
  const [unlockToken, setUnlockToken] = useState<string | null>(null)
  const [vote, setVote] = useState<ProtectedVoteResponse | null>(null)
  const [message, setMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  async function loadProtectedVote(token: string) {
    setIsLoading(true)
    setMessage('Loading protected vote...')

    try {
      const response = await fetch(`/api/votes/${encodeURIComponent(voteId)}`, {
        method: 'GET',
        headers: {
          'x-vote-unlock-token': token,
        },
      })

      const payload = (await response.json()) as ProtectedVoteResponse | { message?: string }

      if (!response.ok) {
        setUnlockToken(null)
        setVote(null)
        setMessage((payload as { message?: string }).message ?? 'Unable to load protected vote.')
        return
      }

      setUnlockToken(token)
      setVote(payload as ProtectedVoteResponse)
      setMessage('')
    } catch {
      setUnlockToken(null)
      setVote(null)
      setMessage('Unable to load protected vote.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!unlockToken || !vote) {
    return (
      <div className="stack">
        <PasswordForm voteId={voteId} onVerified={loadProtectedVote} />
        {isLoading ? <p className="muted">Loading...</p> : null}
        {message ? <p className="notice-inline notice-inline-error">{message}</p> : null}
      </div>
    )
  }

  return (
    <div className="stack">
      <section className="card stack">
        <div>
          <h2 className="card-title">Options in this poll</h2>
          <p className="muted">Password verified for this page. Refreshing requires verification again.</p>
        </div>
        <ul className="vote-preview-list">
          {vote.options.map((option, index) => (
            <li className="vote-preview-item" key={option.id}>
              <span className="vote-preview-index">{index + 1}</span>
              <span>{option.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <VoteForm
        voteId={vote.id}
        options={vote.options}
        allowMultiple={vote.allowMultiple}
        isOpen={vote.isOpen}
        unlockToken={unlockToken}
      />
    </div>
  )
}