'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import type { VoteOption } from '@/types/contracts'
import { clearStoredVotePassword, readStoredVotePassword, saveStoredVotePassword } from './password-store'
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
  const [verifiedPassword, setVerifiedPassword] = useState<string | null>(null)
  const [vote, setVote] = useState<ProtectedVoteResponse | null>(null)
  const [message, setMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  async function restoreFromStoredPassword() {
    setIsLoading(true)
    setMessage('Restoring password session...')

    try {
      const password = await readStoredVotePassword(voteId)
      if (!password) {
        setMessage('')
        return
      }

      const response = await fetch(`/api/votes/${encodeURIComponent(voteId)}/verify-password`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const payload = (await response.json()) as {
        authenticated?: boolean
        unlockToken?: string
        vote?: ProtectedVoteResponse
        message?: string
      }

      if (!response.ok || !payload.authenticated || !payload.unlockToken || !payload.vote) {
        clearStoredVotePassword(voteId)
        setUnlockToken(null)
        setVerifiedPassword(null)
        setVote(null)
        setMessage('Please verify password to continue.')
        return
      }

      setUnlockToken(payload.unlockToken)
      setVerifiedPassword(password)
      setVote(payload.vote)
      setMessage('')
    } catch {
      setUnlockToken(null)
      setVerifiedPassword(null)
      setVote(null)
      setMessage('Unable to load protected vote.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void restoreFromStoredPassword()
  }, [voteId])

  async function handleVerified(token: string, password: string, nextVote: ProtectedVoteResponse) {
    setUnlockToken(token)
    setVerifiedPassword(password)
    setVote(nextVote)
    setMessage('')
    await saveStoredVotePassword(voteId, password)
  }

  if (!unlockToken || !vote) {
    return (
      <div className="stack">
        <PasswordForm voteId={voteId} onVerified={handleVerified} />
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
          <p className="muted">Password verified on this browser for faster re-entry.</p>
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
        password={verifiedPassword}
      />
    </div>
  )
}