'use client'

import React from 'react'
import { useState } from 'react'

interface PasswordFormProps {
  voteId: string
  onVerified: (unlockToken: string) => Promise<void>
}

export function PasswordForm({ voteId, onVerified }: PasswordFormProps) {
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string>('')

  async function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!password.trim()) {
      setMessage('Please enter the password.')
      return
    }

    try {
      setIsSubmitting(true)
      setMessage('Verifying password...')

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
        message?: string
      }

      if (!response.ok || !payload.authenticated || !payload.unlockToken) {
        setMessage(payload.message ?? 'Unable to verify password.')
        return
      }

      setMessage('Password verified. Loading vote options...')
      await onVerified(payload.unlockToken)
      setPassword('')
    } catch {
      setMessage('Unable to verify password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="card stack vote-form-card">
      <div className="stack vote-form-header">
        <div>
          <h2 className="card-title">Password required</h2>
          <p className="muted">This poll is protected. Enter the password to continue.</p>
        </div>
      </div>

      <form className="stack" onSubmit={submitPassword}>
        <div className="field">
          <label htmlFor="vote-password">Password</label>
          <input
            id="vote-password"
            type="password"
            value={password}
            autoComplete="off"
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="vote-action-row">
          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Verify password'}
          </button>
          <p className="muted">You need to verify again if you refresh or reopen this page.</p>
        </div>
      </form>

      {message ? (
        <p className={`notice-inline ${message.includes('verified') ? 'notice-inline-success' : 'notice-inline-error'}`}>
          {message}
        </p>
      ) : null}
    </section>
  )
}