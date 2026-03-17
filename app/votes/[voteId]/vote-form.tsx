'use client'

import React from 'react'
import { useMemo, useState } from 'react'
import type { VoteOption } from '@/types/contracts'

interface VoteFormProps {
  voteId: string
  options: VoteOption[]
  allowMultiple: boolean
  isOpen: boolean
  unlockToken?: string | null
  previouslySelectedOptionIds?: string[] | null
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

interface SubmitResult {
  action: 'created' | 'updated' | 'unchanged'
  selectedOptionIds: string[]
}

function normalizeSelection(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}

export function VoteForm({
  voteId,
  options,
  allowMultiple,
  isOpen,
  unlockToken = null,
  previouslySelectedOptionIds = null,
}: VoteFormProps) {
  const initialSelection = useMemo(
    () => normalizeSelection(previouslySelectedOptionIds ?? []),
    [previouslySelectedOptionIds]
  )

  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(initialSelection)
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [message, setMessage] = useState<string>('')
  const selectionCount = selectedOptionIds.length

  const toggleSelection = (optionId: string) => {
    if (!allowMultiple) {
      setSelectedOptionIds([optionId])
      return
    }

    setSelectedOptionIds((current) => {
      const hasOption = current.includes(optionId)
      return hasOption ? current.filter((item) => item !== optionId) : [...current, optionId]
    })
  }

  const submitVote = async () => {
    if (!isOpen) {
      setSubmitState('error')
      setMessage('Voting has ended for this poll.')
      return
    }

    if (selectedOptionIds.length === 0) {
      setSubmitState('error')
      setMessage('Please select at least one option.')
      return
    }

    try {
      setSubmitState('submitting')
      setMessage('Submitting your vote...')

      const response = await fetch(`/api/votes/${encodeURIComponent(voteId)}/responses`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(unlockToken ? { 'x-vote-unlock-token': unlockToken } : {}),
        },
        body: JSON.stringify({
          selectedOptionIds,
        }),
      })

      const payload = (await response.json()) as SubmitResult | { message?: string }
      if (!response.ok) {
        const errorPayload = payload as { message?: string }
        setSubmitState('error')
        if (response.status === 403) {
          setMessage('Password verification is required. Please verify again.')
          return
        }
        setMessage(errorPayload.message ?? 'Unable to submit vote right now.')
        return
      }

      const result = payload as SubmitResult
      setSelectedOptionIds(normalizeSelection(result.selectedOptionIds))
      setSubmitState('success')

      if (result.action === 'created') {
        setMessage('Your vote has been recorded.')
      } else if (result.action === 'updated') {
        setMessage('Your vote has been updated.')
      } else {
        setMessage('Your current selection is already recorded.')
      }
    } catch {
      setSubmitState('error')
      setMessage('Unable to submit vote right now.')
    }
  }

  return (
    <section className="card stack vote-form-card">
      <div className="stack vote-form-header">
        <div>
          <h2 className="card-title">Cast your vote</h2>
          <p className="muted">
            {allowMultiple
              ? 'Select one or more options before submitting.'
              : 'Select one option before submitting.'}
          </p>
        </div>
        <div className="vote-selection-summary" aria-live="polite">
          <strong>{selectionCount}</strong>
          <span>{selectionCount === 1 ? 'option selected' : 'options selected'}</span>
        </div>
      </div>

      {previouslySelectedOptionIds?.length ? (
        <p className="notice-inline notice-inline-success">Your previous selection is pre-filled.</p>
      ) : null}

      {!isOpen ? <p className="notice-inline notice-inline-error">Voting has ended for this poll.</p> : null}

      <fieldset className="vote-fieldset" disabled={!isOpen || submitState === 'submitting'}>
        <legend className="muted">{allowMultiple ? 'Select one or more options' : 'Select one option'}</legend>
        <ul className="vote-option-list">
          {options.map((option) => {
            const checked = selectedOptionIds.includes(option.id)
            return (
              <li key={option.id}>
                <label className={`vote-option-card ${checked ? 'is-selected' : ''}`}>
                  <input
                    className="vote-option-control"
                    type={allowMultiple ? 'checkbox' : 'radio'}
                    name="vote-option"
                    value={option.id}
                    checked={checked}
                    onChange={() => toggleSelection(option.id)}
                  />
                  <span className="vote-option-copy">
                    <strong>{option.text}</strong>
                    <span className="muted">
                      {checked
                        ? 'Selected'
                        : allowMultiple
                          ? 'Tap to add or remove this option.'
                          : 'Tap to choose this option.'}
                    </span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </fieldset>

      <div className="vote-action-row">
        <button className="btn" type="button" disabled={!isOpen || submitState === 'submitting'} onClick={submitVote}>
          {submitState === 'submitting' ? 'Submitting...' : 'Submit vote'}
        </button>
        <p className="muted">
          {isOpen ? 'You can update your selection later from the same device.' : 'This poll is no longer accepting responses.'}
        </p>
      </div>

      {message ? (
        <p
          className={`notice-inline ${submitState === 'error' ? 'notice-inline-error' : 'notice-inline-success'}`}
          role={submitState === 'error' ? 'alert' : 'status'}
        >
          {message}
        </p>
      ) : null}
    </section>
  )
}
